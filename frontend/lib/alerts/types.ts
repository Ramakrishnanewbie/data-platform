// Alert Types and Interfaces

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'snoozed'
export type AlertType =
  | 'pipeline_failure'
  | 'cost_anomaly'
  | 'data_freshness'
  | 'schema_change'
  | 'query_timeout'
  | 'slot_utilization'
  | 'custom'

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  title: string
  message: string
  source: {
    projectId?: string
    datasetId?: string
    tableId?: string
    jobId?: string
    queryId?: string
  }
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
  acknowledgedAt?: string
  resolvedAt?: string
  acknowledgedBy?: string
  resolvedBy?: string
  snoozedUntil?: string
  relatedAlerts?: string[]
  impactedTables?: number
  suggestedActions?: string[]
}

export interface AlertRule {
  id: string
  name: string
  description: string
  type: AlertType
  enabled: boolean
  conditions: AlertCondition[]
  severity: AlertSeverity
  channels: NotificationChannel[]
  cooldownMinutes: number
  createdAt: string
  updatedAt: string
}

export interface AlertCondition {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains'
  value: string | number | boolean
}

export interface NotificationChannel {
  type: 'slack' | 'email' | 'webhook' | 'in_app'
  config: SlackConfig | EmailConfig | WebhookConfig | InAppConfig
  enabled: boolean
}

export interface SlackConfig {
  webhookUrl: string
  channel?: string
  mentionUsers?: string[]
  mentionGroups?: string[]
}

export interface EmailConfig {
  recipients: string[]
  ccRecipients?: string[]
}

export interface WebhookConfig {
  url: string
  method: 'GET' | 'POST'
  headers?: Record<string, string>
}

export interface InAppConfig {
  showToast: boolean
  showBadge: boolean
  playSound: boolean
}

export interface AlertStats {
  total: number
  bySeverity: Record<AlertSeverity, number>
  byStatus: Record<AlertStatus, number>
  byType: Record<AlertType, number>
  last24Hours: number
  lastWeek: number
  mttr: number // Mean Time To Resolution in minutes
}

export interface AlertFilter {
  severity?: AlertSeverity[]
  status?: AlertStatus[]
  type?: AlertType[]
  startDate?: string
  endDate?: string
  search?: string
}

// Utility functions
export function getSeverityConfig(severity: AlertSeverity) {
  const config = {
    critical: {
      label: 'Critical',
      color: 'text-red-400',
      bgColor: 'bg-red-500/15',
      borderColor: 'border-red-500/50',
      badgeBg: 'bg-red-500/20',
      icon: 'AlertTriangle',
    },
    high: {
      label: 'High',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/15',
      borderColor: 'border-orange-500/50',
      badgeBg: 'bg-orange-500/20',
      icon: 'AlertCircle',
    },
    medium: {
      label: 'Medium',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/15',
      borderColor: 'border-amber-500/50',
      badgeBg: 'bg-amber-500/20',
      icon: 'AlertCircle',
    },
    low: {
      label: 'Low',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/15',
      borderColor: 'border-blue-500/50',
      badgeBg: 'bg-blue-500/20',
      icon: 'Info',
    },
    info: {
      label: 'Info',
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/15',
      borderColor: 'border-slate-500/50',
      badgeBg: 'bg-slate-500/20',
      icon: 'Info',
    },
  }
  return config[severity]
}

export function getStatusConfig(status: AlertStatus) {
  const config = {
    active: {
      label: 'Active',
      color: 'text-red-400',
      bgColor: 'bg-red-500/15',
      borderColor: 'border-red-500/50',
    },
    acknowledged: {
      label: 'Acknowledged',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/15',
      borderColor: 'border-amber-500/50',
    },
    resolved: {
      label: 'Resolved',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/15',
      borderColor: 'border-emerald-500/50',
    },
    snoozed: {
      label: 'Snoozed',
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/15',
      borderColor: 'border-slate-500/50',
    },
  }
  return config[status]
}

export function getTypeConfig(type: AlertType) {
  const config = {
    pipeline_failure: {
      label: 'Pipeline Failure',
      icon: 'GitBranch',
      color: 'text-red-400',
    },
    cost_anomaly: {
      label: 'Cost Anomaly',
      icon: 'DollarSign',
      color: 'text-amber-400',
    },
    data_freshness: {
      label: 'Data Freshness',
      icon: 'Clock',
      color: 'text-blue-400',
    },
    schema_change: {
      label: 'Schema Change',
      icon: 'Database',
      color: 'text-purple-400',
    },
    query_timeout: {
      label: 'Query Timeout',
      icon: 'Timer',
      color: 'text-orange-400',
    },
    slot_utilization: {
      label: 'Slot Utilization',
      icon: 'Cpu',
      color: 'text-cyan-400',
    },
    custom: {
      label: 'Custom',
      icon: 'Bell',
      color: 'text-slate-400',
    },
  }
  return config[type]
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
