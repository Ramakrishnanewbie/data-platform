"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  MessageSquare,
  Settings,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SlackSettingsProps {
  onConfigUpdate?: () => void
}

export function SlackSettings({ onConfigUpdate }: SlackSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const [config, setConfig] = useState({
    enabled: false,
    webhookUrl: '',
    channel: '#data-alerts',
    mentionOnCritical: true,
  })

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/alerts/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'configure', config }),
      })

      if (response.ok) {
        onConfigUpdate?.()
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Failed to save Slack config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const response = await fetch('/api/alerts/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      })

      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to send test message' })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Slack Integration
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#4A154B]" />
            Slack Integration
          </DialogTitle>
          <DialogDescription>
            Configure Slack notifications for your alerts. Receive real-time notifications when alerts are triggered.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="slack-enabled">Enable Slack Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Send alerts to your Slack workspace
              </p>
            </div>
            <Switch
              id="slack-enabled"
              checked={config.enabled}
              onCheckedChange={(enabled) => setConfig({ ...config, enabled })}
            />
          </div>

          {/* Webhook URL */}
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              type="password"
              placeholder="https://hooks.slack.com/services/..."
              value={config.webhookUrl}
              onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              <a
                href="https://api.slack.com/messaging/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Learn how to create a webhook
              </a>
            </p>
          </div>

          {/* Channel */}
          <div className="space-y-2">
            <Label htmlFor="channel">Default Channel</Label>
            <Input
              id="channel"
              placeholder="#data-alerts"
              value={config.channel}
              onChange={(e) => setConfig({ ...config, channel: e.target.value })}
            />
          </div>

          {/* Mention on Critical */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mention-critical">Mention on Critical Alerts</Label>
              <p className="text-xs text-muted-foreground">
                Use @channel for critical severity alerts
              </p>
            </div>
            <Switch
              id="mention-critical"
              checked={config.mentionOnCritical}
              onCheckedChange={(mentionOnCritical) => setConfig({ ...config, mentionOnCritical })}
            />
          </div>

          {/* Test Connection */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Test Connection</p>
                  <p className="text-xs text-muted-foreground">
                    Send a test message to verify your webhook
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTest}
                  disabled={!config.webhookUrl || isTesting}
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Test
                </Button>
              </div>

              {testResult && (
                <div className={cn(
                  "mt-3 p-3 rounded-lg flex items-center gap-2",
                  testResult.success
                    ? "bg-emerald-500/10 border border-emerald-500/30"
                    : "bg-red-500/10 border border-red-500/30"
                )}>
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  )}
                  <span className={cn(
                    "text-sm",
                    testResult.success ? "text-emerald-400" : "text-red-400"
                  )}>
                    {testResult.message}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
