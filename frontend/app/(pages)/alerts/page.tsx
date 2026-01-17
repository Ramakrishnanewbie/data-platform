"use client"

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ContentLayout } from '@/components/admin-panel/content-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bell,
  RefreshCw,
  Settings,
  Volume2,
  VolumeX,
  CheckCheck,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { AlertCard } from './components/AlertCard'
import { AlertStats } from './components/AlertStats'
import { AlertFilters } from './components/AlertFilters'
import { SlackSettings } from './components/SlackSettings'
import type { Alert, AlertSeverity, AlertStatus, AlertType, AlertStats as AlertStatsType } from '@/lib/alerts/types'

interface AlertsResponse {
  alerts: Alert[]
  total: number
  page: number
  limit: number
  totalPages: number
  stats: AlertStatsType
}

async function fetchAlerts(params: {
  page: number
  severity?: string
  status?: string
  type?: string
  search?: string
}): Promise<AlertsResponse> {
  const searchParams = new URLSearchParams()
  searchParams.set('page', params.page.toString())
  searchParams.set('limit', '20')
  if (params.severity) searchParams.set('severity', params.severity)
  if (params.status) searchParams.set('status', params.status)
  if (params.type) searchParams.set('type', params.type)
  if (params.search) searchParams.set('search', params.search)

  const response = await fetch(`/api/alerts?${searchParams}`)
  if (!response.ok) throw new Error('Failed to fetch alerts')
  return response.json()
}

async function updateAlert(id: string, action: string, snoozeDuration?: number) {
  const response = await fetch(`/api/alerts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, snoozeDuration }),
  })
  if (!response.ok) throw new Error('Failed to update alert')
  return response.json()
}

export default function AlertsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedSeverities, setSelectedSeverities] = useState<AlertSeverity[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<AlertStatus[]>(['active'])
  const [selectedTypes, setSelectedTypes] = useState<AlertType[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['alerts', page, selectedSeverities, selectedStatuses, selectedTypes, search],
    queryFn: () => fetchAlerts({
      page,
      severity: selectedSeverities.join(',') || undefined,
      status: selectedStatuses.join(',') || undefined,
      type: selectedTypes.join(',') || undefined,
      search: search || undefined,
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => updateAlert(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  const handleAlertAction = useCallback((alertId: string, action: 'acknowledge' | 'resolve' | 'snooze' | 'reopen') => {
    updateMutation.mutate({ id: alertId, action })
  }, [updateMutation])

  const handleClearFilters = useCallback(() => {
    setSelectedSeverities([])
    setSelectedStatuses(['active'])
    setSelectedTypes([])
    setSearch('')
    setPage(1)
  }, [])

  const handleResolveAll = useCallback(async () => {
    const activeAlerts = data?.alerts.filter(a => a.status === 'active') || []
    for (const alert of activeAlerts) {
      await updateAlert(alert.id, 'resolve')
    }
    queryClient.invalidateQueries({ queryKey: ['alerts'] })
  }, [data?.alerts, queryClient])

  const activeCount = data?.stats.byStatus.active || 0
  const criticalCount = data?.stats.bySeverity.critical || 0

  return (
    <ContentLayout title="Alerts">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg border",
              activeCount > 0
                ? "bg-red-500/10 border-red-500/30"
                : "bg-emerald-500/10 border-emerald-500/30"
            )}>
              <Bell className={cn(
                "h-5 w-5",
                activeCount > 0 ? "text-red-400" : "text-emerald-400"
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Alert Center</h2>
                {activeCount > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-red-500/10 border-red-500/30 text-red-400"
                  >
                    {activeCount} active
                  </Badge>
                )}
                {criticalCount > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-red-500/20 border-red-500/50 text-red-300 animate-pulse"
                  >
                    {criticalCount} critical
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Monitor and manage alerts from your data pipelines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
              Refresh
            </Button>

            {/* Resolve All (only show if there are active alerts) */}
            {activeCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResolveAll}
                className="gap-2 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              >
                <CheckCheck className="h-4 w-4" />
                Resolve All
              </Button>
            )}

            {/* Slack Settings */}
            <SlackSettings onConfigUpdate={() => refetch()} />
          </div>
        </div>

        {/* Stats */}
        <AlertStats stats={data?.stats!} isLoading={isLoading} />

        {/* Filters */}
        <AlertFilters
          search={search}
          onSearchChange={setSearch}
          selectedSeverities={selectedSeverities}
          onSeverityChange={setSelectedSeverities}
          selectedStatuses={selectedStatuses}
          onStatusChange={setSelectedStatuses}
          selectedTypes={selectedTypes}
          onTypeChange={setSelectedTypes}
          onClearFilters={handleClearFilters}
        />

        {/* Alerts List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="p-4 rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <p className="text-destructive font-medium">Failed to load alerts</p>
              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : data?.alerts.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="p-4 rounded-full bg-emerald-500/10">
                <Bell className="h-8 w-8 text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="font-medium">All Clear!</p>
                <p className="text-sm text-muted-foreground">
                  No alerts match your current filters
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {data?.alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAction={handleAlertAction}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * data.limit) + 1} to {Math.min(page * data.limit, data.total)} of {data.total} alerts
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </ContentLayout>
  )
}
