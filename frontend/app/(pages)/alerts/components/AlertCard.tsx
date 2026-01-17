"use client"

import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  GitBranch,
  DollarSign,
  Clock,
  Database,
  Timer,
  Cpu,
  Bell,
  MoreHorizontal,
  Check,
  CheckCheck,
  AlarmClockOff,
  RotateCcw,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Alert, AlertSeverity, AlertType } from '@/lib/alerts/types'
import { getSeverityConfig, getTypeConfig, getStatusConfig, formatTimeAgo } from '@/lib/alerts/types'

interface AlertCardProps {
  alert: Alert
  onAction: (alertId: string, action: 'acknowledge' | 'resolve' | 'snooze' | 'reopen') => void
  onClick?: (alert: Alert) => void
}

const severityIcons: Record<AlertSeverity, React.ElementType> = {
  critical: AlertTriangle,
  high: AlertCircle,
  medium: AlertCircle,
  low: Info,
  info: Info,
}

const typeIcons: Record<AlertType, React.ElementType> = {
  pipeline_failure: GitBranch,
  cost_anomaly: DollarSign,
  data_freshness: Clock,
  schema_change: Database,
  query_timeout: Timer,
  slot_utilization: Cpu,
  custom: Bell,
}

export const AlertCard = memo(function AlertCard({ alert, onAction, onClick }: AlertCardProps) {
  const severityConfig = getSeverityConfig(alert.severity)
  const statusConfig = getStatusConfig(alert.status)
  const typeConfig = getTypeConfig(alert.type)
  const SeverityIcon = severityIcons[alert.severity]
  const TypeIcon = typeIcons[alert.type]

  return (
    <Card
      className={cn(
        "group relative overflow-hidden cursor-pointer",
        "border transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-0.5",
        alert.status === 'active' && severityConfig.borderColor,
        alert.status !== 'active' && 'border-border/50 opacity-75'
      )}
      onClick={() => onClick?.(alert)}
    >
      {/* Gradient Background for active alerts */}
      {alert.status === 'active' && (
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r opacity-30",
          alert.severity === 'critical' && 'from-red-500/20 to-transparent',
          alert.severity === 'high' && 'from-orange-500/20 to-transparent',
          alert.severity === 'medium' && 'from-amber-500/20 to-transparent',
          alert.severity === 'low' && 'from-blue-500/20 to-transparent',
          alert.severity === 'info' && 'from-slate-500/20 to-transparent'
        )} />
      )}

      <CardContent className="relative p-4">
        <div className="flex items-start gap-4">
          {/* Severity Icon */}
          <div className={cn(
            "flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl",
            "transition-transform duration-300 group-hover:scale-110",
            severityConfig.bgColor, "border", severityConfig.borderColor
          )}>
            <SeverityIcon className={cn("h-5 w-5", severityConfig.color)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-semibold truncate">{alert.title}</h4>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-2 py-0",
                    statusConfig.bgColor, statusConfig.borderColor, statusConfig.color
                  )}
                >
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {alert.status === 'active' && (
                    <>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction(alert.id, 'acknowledge') }}>
                        <Check className="h-4 w-4 mr-2" />
                        Acknowledge
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction(alert.id, 'snooze') }}>
                        <AlarmClockOff className="h-4 w-4 mr-2" />
                        Snooze 1 hour
                      </DropdownMenuItem>
                    </>
                  )}
                  {(alert.status === 'active' || alert.status === 'acknowledged') && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction(alert.id, 'resolve') }}>
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Resolve
                    </DropdownMenuItem>
                  )}
                  {(alert.status === 'resolved' || alert.status === 'snoozed') && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction(alert.id, 'reopen') }}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reopen
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Message */}
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {alert.message}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Type Badge */}
                <div className="flex items-center gap-1.5">
                  <TypeIcon className={cn("h-3.5 w-3.5", typeConfig.color)} />
                  <span className="text-xs text-muted-foreground">{typeConfig.label}</span>
                </div>

                {/* Source */}
                {(alert.source.tableId || alert.source.datasetId) && (
                  <>
                    <span className="text-muted-foreground/30">•</span>
                    <span className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">
                      {alert.source.tableId || alert.source.datasetId}
                    </span>
                  </>
                )}

                {/* Impacted Tables */}
                {alert.impactedTables && alert.impactedTables > 0 && (
                  <>
                    <span className="text-muted-foreground/30">•</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 border-primary/30 text-primary">
                      {alert.impactedTables} affected
                    </Badge>
                  </>
                )}
              </div>

              {/* Time */}
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatTimeAgo(alert.createdAt)}
              </span>
            </div>

            {/* Suggested Actions (for active critical/high alerts) */}
            {alert.status === 'active' && alert.suggestedActions && alert.suggestedActions.length > 0 && (alert.severity === 'critical' || alert.severity === 'high') && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ChevronRight className="h-3 w-3" />
                  <span>Suggested: {alert.suggestedActions[0]}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
