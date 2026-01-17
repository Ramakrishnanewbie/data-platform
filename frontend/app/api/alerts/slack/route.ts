import { NextRequest, NextResponse } from 'next/server'
import type { Alert } from '@/lib/alerts/types'

// Slack integration settings - would be stored in database/env
let slackConfig = {
  enabled: false,
  webhookUrl: '',
  channel: '#data-alerts',
  mentionOnCritical: true,
  mentionUsers: [] as string[],
}

export async function GET() {
  // Return current Slack configuration (without sensitive data)
  return NextResponse.json({
    enabled: slackConfig.enabled,
    channel: slackConfig.channel,
    mentionOnCritical: slackConfig.mentionOnCritical,
    hasWebhook: !!slackConfig.webhookUrl,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, alert, config } = body

  if (action === 'configure') {
    // Update Slack configuration
    slackConfig = {
      ...slackConfig,
      ...config,
    }
    return NextResponse.json({ success: true, message: 'Slack configuration updated' })
  }

  if (action === 'test') {
    // Test Slack webhook
    if (!slackConfig.webhookUrl) {
      return NextResponse.json(
        { success: false, error: 'Webhook URL not configured' },
        { status: 400 }
      )
    }

    try {
      const testMessage = buildSlackMessage({
        id: 'test_alert',
        type: 'custom',
        severity: 'info',
        status: 'active',
        title: 'Test Alert from Data Pulse',
        message: 'This is a test message to verify your Slack integration is working correctly.',
        source: {},
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      const response = await fetch(slackConfig.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMessage),
      })

      if (response.ok) {
        return NextResponse.json({ success: true, message: 'Test message sent successfully' })
      } else {
        return NextResponse.json(
          { success: false, error: 'Failed to send test message' },
          { status: 500 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to connect to Slack' },
        { status: 500 }
      )
    }
  }

  if (action === 'send' && alert) {
    // Send alert to Slack
    if (!slackConfig.enabled || !slackConfig.webhookUrl) {
      return NextResponse.json({ success: false, message: 'Slack not configured' })
    }

    try {
      const message = buildSlackMessage(alert)
      await fetch(slackConfig.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      })
      return NextResponse.json({ success: true })
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to send to Slack' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

function buildSlackMessage(alert: Alert) {
  const severityEmoji: Record<string, string> = {
    critical: ':rotating_light:',
    high: ':warning:',
    medium: ':large_yellow_circle:',
    low: ':information_source:',
    info: ':speech_balloon:',
  }

  const severityColor: Record<string, string> = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#d97706',
    low: '#3b82f6',
    info: '#64748b',
  }

  const mentions = alert.severity === 'critical' && slackConfig.mentionOnCritical
    ? slackConfig.mentionUsers.map(u => `<@${u}>`).join(' ')
    : ''

  return {
    channel: slackConfig.channel,
    username: 'Data Pulse Alerts',
    icon_emoji: ':bar_chart:',
    text: `${severityEmoji[alert.severity] || ':bell:'} ${alert.title}`,
    attachments: [
      {
        color: severityColor[alert.severity] || '#64748b',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${alert.title}*\n${alert.message}`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Severity:*\n${alert.severity.toUpperCase()}`,
              },
              {
                type: 'mrkdwn',
                text: `*Type:*\n${alert.type.replace(/_/g, ' ')}`,
              },
              {
                type: 'mrkdwn',
                text: `*Source:*\n${alert.source.tableId || alert.source.jobId || 'N/A'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Time:*\n${new Date(alert.createdAt).toLocaleString()}`,
              },
            ],
          },
          ...(alert.suggestedActions?.length ? [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Suggested Actions:*\n${alert.suggestedActions.map(a => `• ${a}`).join('\n')}`,
            },
          }] : []),
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'View in Data Pulse',
                  emoji: true,
                },
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/alerts?id=${alert.id}`,
              },
            ],
          },
        ],
      },
    ],
    ...(mentions ? { text: `${mentions} ${severityEmoji[alert.severity] || ':bell:'} ${alert.title}` } : {}),
  }
}
