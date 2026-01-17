"use client"

import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingDown,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AlertStats as AlertStatsType } from '@/lib/alerts/types'

interface AlertStatsProps {
  stats: AlertStatsType
  isLoading?: boolean
}

const StatCard = memo(function StatCard({
  icon: Icon,
  iconColor,
  bgColor,
  borderColor,
  label,
  value,
  subValue,
  trend,
}: {
  icon: React.ElementType
  iconColor: string
  bgColor: string
  borderColor: string
  label: string
  value: number | string
  subValue?: string
  trend?: { value: number; isPositive: boolean }
}) {
  return (
    <Card className={cn(
      "group relative overflow-hidden",
      "border transition-all duration-300",
      "hover:shadow-lg hover:-translate-y-0.5",
      borderColor
    )}>
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40", bgColor)} />
      <CardContent className="relative p-4">
        <div className="flex items-start justify-between gap-3">
          <div className={cn(
            "flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl",
            "bg-background/50 backdrop-blur-sm border border-border/50",
            "transition-transform duration-300 group-hover:scale-110"
          )}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
          <div className="flex-1 text-right">
            <p className="text-xs text-muted-foreground mb-1 font-medium">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subValue && (
              <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center justify-end gap-1 mt-1 text-xs",
                trend.isPositive ? 'text-emerald-400' : 'text-red-400'
              )}>
                <TrendingDown className={cn("h-3 w-3", !trend.isPositive && "rotate-180")} />
                <span>{trend.value}%</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export const AlertStats = memo(function AlertStats({ stats, isLoading }: AlertStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <div className="h-20 animate-pulse bg-muted/50 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={AlertTriangle}
        iconColor="text-red-400"
        bgColor="from-red-500/20 to-red-600/10"
        borderColor="border-red-500/40"
        label="Active Alerts"
        value={stats.byStatus.active}
        subValue={`${stats.bySeverity.critical} critical`}
      />
      <StatCard
        icon={Activity}
        iconColor="text-amber-400"
        bgColor="from-amber-500/20 to-amber-600/10"
        borderColor="border-amber-500/40"
        label="Last 24 Hours"
        value={stats.last24Hours}
        subValue="new alerts"
      />
      <StatCard
        icon={CheckCircle2}
        iconColor="text-emerald-400"
        bgColor="from-emerald-500/20 to-emerald-600/10"
        borderColor="border-emerald-500/40"
        label="Resolved"
        value={stats.byStatus.resolved}
        subValue="this week"
      />
      <StatCard
        icon={Clock}
        iconColor="text-blue-400"
        bgColor="from-blue-500/20 to-blue-600/10"
        borderColor="border-blue-500/40"
        label="Avg Resolution"
        value={`${stats.mttr}m`}
        subValue="mean time to resolve"
      />
    </div>
  )
})
