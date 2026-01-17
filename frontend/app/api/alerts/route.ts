import { NextRequest, NextResponse } from 'next/server'
import type { Alert, AlertFilter, AlertStats } from '@/lib/alerts/types'

// In-memory store for demo - replace with database in production
let alerts: Alert[] = generateMockAlerts()

function generateMockAlerts(): Alert[] {
  const types: Alert['type'][] = ['pipeline_failure', 'cost_anomaly', 'data_freshness', 'schema_change', 'query_timeout']
  const severities: Alert['severity'][] = ['critical', 'high', 'medium', 'low', 'info']
  const statuses: Alert['status'][] = ['active', 'acknowledged', 'resolved', 'snoozed']

  const mockAlerts: Alert[] = []

  // Generate some realistic mock alerts
  const alertTemplates = [
    {
      type: 'pipeline_failure' as const,
      severity: 'critical' as const,
      title: 'ETL Pipeline Failed',
      message: 'The daily_sales_aggregation pipeline failed due to missing source data',
      source: { projectId: 'prod-analytics', datasetId: 'sales', tableId: 'daily_sales_agg' },
      suggestedActions: ['Check upstream data sources', 'Review job logs', 'Notify data team'],
    },
    {
      type: 'cost_anomaly' as const,
      severity: 'high' as const,
      title: 'Unusual Query Cost Detected',
      message: 'Query cost exceeded $500, which is 10x higher than average',
      source: { projectId: 'prod-analytics', queryId: 'job_abc123' },
      suggestedActions: ['Review query for full table scans', 'Check partitioning', 'Add clustering'],
    },
    {
      type: 'data_freshness' as const,
      severity: 'medium' as const,
      title: 'Stale Data Detected',
      message: 'Table customer_events has not been updated in 48 hours',
      source: { projectId: 'prod-analytics', datasetId: 'events', tableId: 'customer_events' },
      suggestedActions: ['Check pipeline status', 'Verify data source connectivity'],
    },
    {
      type: 'schema_change' as const,
      severity: 'high' as const,
      title: 'Schema Change Detected',
      message: 'Column "revenue" was renamed to "total_revenue" in orders table',
      source: { projectId: 'prod-analytics', datasetId: 'sales', tableId: 'orders' },
      suggestedActions: ['Update downstream queries', 'Notify dependent teams', 'Update documentation'],
      impactedTables: 12,
    },
    {
      type: 'query_timeout' as const,
      severity: 'medium' as const,
      title: 'Query Timeout',
      message: 'Query exceeded maximum execution time of 30 minutes',
      source: { projectId: 'prod-analytics', jobId: 'job_xyz789' },
      suggestedActions: ['Optimize query', 'Consider materializing intermediate results'],
    },
  ]

  // Generate alerts for the last 7 days
  for (let i = 0; i < 25; i++) {
    const template = alertTemplates[i % alertTemplates.length]
    const hoursAgo = Math.floor(Math.random() * 168) // Last 7 days
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    const status = i < 8 ? 'active' : statuses[Math.floor(Math.random() * statuses.length)]

    mockAlerts.push({
      id: `alert_${i + 1}`,
      ...template,
      status,
      metadata: {
        jobDuration: Math.floor(Math.random() * 3600),
        bytesProcessed: Math.floor(Math.random() * 1000000000000),
        slotUsage: Math.floor(Math.random() * 1000),
      },
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      acknowledgedAt: status !== 'active' ? new Date(createdAt.getTime() + 30 * 60000).toISOString() : undefined,
      resolvedAt: status === 'resolved' ? new Date(createdAt.getTime() + 120 * 60000).toISOString() : undefined,
    })
  }

  return mockAlerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  let filteredAlerts = [...alerts]

  // Apply filters
  const severity = searchParams.get('severity')
  if (severity) {
    const severities = severity.split(',')
    filteredAlerts = filteredAlerts.filter(a => severities.includes(a.severity))
  }

  const status = searchParams.get('status')
  if (status) {
    const statuses = status.split(',')
    filteredAlerts = filteredAlerts.filter(a => statuses.includes(a.status))
  }

  const type = searchParams.get('type')
  if (type) {
    const types = type.split(',')
    filteredAlerts = filteredAlerts.filter(a => types.includes(a.type))
  }

  const search = searchParams.get('search')
  if (search) {
    const searchLower = search.toLowerCase()
    filteredAlerts = filteredAlerts.filter(
      a => a.title.toLowerCase().includes(searchLower) ||
           a.message.toLowerCase().includes(searchLower) ||
           a.source.tableId?.toLowerCase().includes(searchLower) ||
           a.source.datasetId?.toLowerCase().includes(searchLower)
    )
  }

  // Pagination
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const start = (page - 1) * limit
  const paginatedAlerts = filteredAlerts.slice(start, start + limit)

  // Calculate stats
  const stats: AlertStats = {
    total: alerts.length,
    bySeverity: {
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
      info: alerts.filter(a => a.severity === 'info').length,
    },
    byStatus: {
      active: alerts.filter(a => a.status === 'active').length,
      acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
      snoozed: alerts.filter(a => a.status === 'snoozed').length,
    },
    byType: {
      pipeline_failure: alerts.filter(a => a.type === 'pipeline_failure').length,
      cost_anomaly: alerts.filter(a => a.type === 'cost_anomaly').length,
      data_freshness: alerts.filter(a => a.type === 'data_freshness').length,
      schema_change: alerts.filter(a => a.type === 'schema_change').length,
      query_timeout: alerts.filter(a => a.type === 'query_timeout').length,
      slot_utilization: alerts.filter(a => a.type === 'slot_utilization').length,
      custom: alerts.filter(a => a.type === 'custom').length,
    },
    last24Hours: alerts.filter(a => {
      const created = new Date(a.createdAt)
      return Date.now() - created.getTime() < 24 * 60 * 60 * 1000
    }).length,
    lastWeek: alerts.filter(a => {
      const created = new Date(a.createdAt)
      return Date.now() - created.getTime() < 7 * 24 * 60 * 60 * 1000
    }).length,
    mttr: 45, // Mock MTTR of 45 minutes
  }

  return NextResponse.json({
    alerts: paginatedAlerts,
    total: filteredAlerts.length,
    page,
    limit,
    totalPages: Math.ceil(filteredAlerts.length / limit),
    stats,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const newAlert: Alert = {
    id: `alert_${Date.now()}`,
    type: body.type || 'custom',
    severity: body.severity || 'medium',
    status: 'active',
    title: body.title,
    message: body.message,
    source: body.source || {},
    metadata: body.metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    suggestedActions: body.suggestedActions,
  }

  alerts.unshift(newAlert)

  return NextResponse.json(newAlert, { status: 201 })
}
