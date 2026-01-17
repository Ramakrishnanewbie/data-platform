"use client"

import { useQuery } from '@tanstack/react-query'
import { X, Table2, Eye, Database, Copy, ExternalLink, Clock, Layers, HardDrive, Columns3, Sparkles, CheckCircle2, AlertCircle, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState, useEffect, memo } from 'react'
import { cn } from '@/lib/utils'

interface MetadataPanelProps {
  projectId: string
  datasetId: string
  tableId: string
  onClose: () => void
}

interface TableMetadata {
  projectId: string
  datasetId: string
  tableId: string
  tableName: string
  type: string
  schema: Array<{
    name: string
    type: string
    mode: string
    description: string
  }>
  numRows: number
  numBytes: number
  createdAt: string
  modifiedAt: string
  freshness: string
  description: string
  labels: Record<string, string>
  location: string
  viewQuery?: string
  partitioning?: any
  clusteringFields: string[]
  expirationTime?: string
}

interface TablePreview {
  schema: Array<{ name: string; type: string }>
  rows: Array<Record<string, any>>
  totalRows: number
}

async function fetchMetadata(projectId: string, datasetId: string, tableId: string) {
  const response = await fetch(`/api/bigquery/table-metadata/${projectId}/${datasetId}/${tableId}`)
  if (!response.ok) throw new Error('Failed to fetch metadata')
  return response.json()
}

async function fetchPreview(projectId: string, datasetId: string, tableId: string) {
  const response = await fetch(`/api/bigquery/table-preview/${projectId}/${datasetId}/${tableId}?limit=10`)
  if (!response.ok) throw new Error('Failed to fetch preview')
  return response.json()
}

// Metric Card Configuration
const metricConfig = {
  type: {
    icon: Database,
    gradient: 'from-blue-500/20 to-blue-600/10',
    borderColor: 'border-blue-500/40',
    iconColor: 'text-blue-400',
    glowColor: 'shadow-blue-500/10',
  },
  rows: {
    icon: Layers,
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    borderColor: 'border-emerald-500/40',
    iconColor: 'text-emerald-400',
    glowColor: 'shadow-emerald-500/10',
  },
  size: {
    icon: HardDrive,
    gradient: 'from-purple-500/20 to-purple-600/10',
    borderColor: 'border-purple-500/40',
    iconColor: 'text-purple-400',
    glowColor: 'shadow-purple-500/10',
  },
  columns: {
    icon: Columns3,
    gradient: 'from-orange-500/20 to-orange-600/10',
    borderColor: 'border-orange-500/40',
    iconColor: 'text-orange-400',
    glowColor: 'shadow-orange-500/10',
  },
  freshness: {
    icon: Sparkles,
    gradient: 'from-amber-500/20 to-amber-600/10',
    borderColor: 'border-amber-500/40',
    iconColor: 'text-amber-400',
    glowColor: 'shadow-amber-500/10',
  },
}

// Metric Card Component
const MetricCard = memo(({
  type,
  label,
  value,
  subValue,
  badge,
  freshnessIndicator,
}: {
  type: keyof typeof metricConfig
  label: string
  value?: React.ReactNode
  subValue?: string
  badge?: React.ReactNode
  freshnessIndicator?: { status: string; color: string }
}) => {
  const config = metricConfig[type]
  const Icon = config.icon

  return (
    <Card className={cn(
      "group relative overflow-hidden",
      "border transition-all duration-300",
      "hover:shadow-lg hover:-translate-y-0.5",
      config.borderColor,
      `hover:${config.glowColor}`
    )}>
      {/* Gradient Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-60",
        config.gradient
      )} />

      {/* Glow Effect on Hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100",
        "transition-opacity duration-300",
        "bg-gradient-to-t from-transparent via-transparent to-white/5"
      )} />

      <CardContent className="relative p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl",
            "bg-background/50 backdrop-blur-sm border border-border/50",
            "transition-transform duration-300 group-hover:scale-110"
          )}>
            <Icon className={cn("h-5 w-5", config.iconColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 text-right">
            <p className="text-xs text-muted-foreground mb-1 font-medium">{label}</p>
            {badge ? (
              badge
            ) : freshnessIndicator ? (
              <div className="flex items-center justify-end gap-2">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full animate-pulse",
                  freshnessIndicator.color
                )} />
                <span className="text-lg font-bold capitalize">{freshnessIndicator.status}</span>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold tracking-tight">{value}</p>
                {subValue && (
                  <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

MetricCard.displayName = 'MetricCard'

const SchemaRow = memo(({ field, index }: { field: any; index: number }) => (
  <TableRow className={cn(
    "transition-colors hover:bg-accent/50",
    index % 2 === 0 && "bg-muted/20"
  )}>
    <TableCell className="font-mono text-xs py-2.5 font-medium">{field.name}</TableCell>
    <TableCell className="py-2.5">
      <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-mono bg-accent/50">{field.type}</Badge>
    </TableCell>
    <TableCell className="text-xs py-2.5">
      <Badge
        variant={field.mode === 'REQUIRED' ? 'default' : 'secondary'}
        className="text-[10px] px-2 py-0.5"
      >
        {field.mode}
      </Badge>
    </TableCell>
  </TableRow>
))

SchemaRow.displayName = 'SchemaRow'

export default function MetadataPanel({ projectId, datasetId, tableId, onClose }: MetadataPanelProps) {
  const [notification, setNotification] = useState<string | null>(null)

  const { data: metadata, isLoading: metadataLoading } = useQuery<TableMetadata>({
    queryKey: ['table-metadata', projectId, datasetId, tableId],
    queryFn: () => fetchMetadata(projectId, datasetId, tableId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  const { data: preview, isLoading: previewLoading } = useQuery<TablePreview>({
    queryKey: ['table-preview', projectId, datasetId, tableId],
    queryFn: () => fetchPreview(projectId, datasetId, tableId),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setNotification('Copied to clipboard!')
  }

  const openInSqlEditor = () => {
    const query = `SELECT *\nFROM \`${projectId}.${datasetId}.${tableId}\`\nLIMIT 100`
    window.location.href = `/sql-editor?query=${encodeURIComponent(query)}`
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const getFreshnessConfig = (freshness: string) => {
    switch (freshness) {
      case 'fresh':
        return { color: 'bg-emerald-500', icon: CheckCircle2, iconColor: 'text-emerald-400' }
      case 'recent':
        return { color: 'bg-amber-500', icon: Timer, iconColor: 'text-amber-400' }
      case 'stale':
        return { color: 'bg-red-500', icon: AlertCircle, iconColor: 'text-red-400' }
      default:
        return { color: 'bg-gray-500', icon: Clock, iconColor: 'text-gray-400' }
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'view':
        return <Eye className="h-4 w-4 text-purple-400" />
      case 'materialized_view':
        return <Database className="h-4 w-4 text-emerald-400" />
      default:
        return <Table2 className="h-4 w-4 text-blue-400" />
    }
  }

  const getTypeBadge = (type: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      TABLE: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      VIEW: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
      MATERIALIZED_VIEW: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    }
    const c = config[type.toUpperCase()] || { bg: 'bg-gray-500/20', text: 'text-gray-400' }
    return (
      <Badge className={cn("text-xs font-semibold px-3 py-1", c.bg, c.text, "border-0")}>
        {type.replace(/_/g, ' ')}
      </Badge>
    )
  }

  return (
    <>
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 bg-background border border-border rounded-xl shadow-lg px-4 py-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <p className="text-sm font-medium">{notification}</p>
          </div>
        </div>
      )}

      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/50 border border-border/50">
              {metadata && getTypeIcon(metadata.type)}
            </div>
            <div>
              <h3 className="text-base font-semibold">{tableId}</h3>
              <p className="text-xs text-muted-foreground font-mono">
                {projectId}.{datasetId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs rounded-lg hover:bg-accent transition-colors"
              onClick={() => copyToClipboard(`${projectId}.${datasetId}.${tableId}`)}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy Path
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs rounded-lg hover:bg-accent transition-colors"
              onClick={openInSqlEditor}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Open in Editor
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {metadataLoading ? (
          <div className="flex-1 p-5">
            <div className="grid grid-cols-5 gap-4 mb-5">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-10 w-full rounded-lg mb-4" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : metadata ? (
          <ScrollArea className="flex-1 scrollbar-thin">
            <div className="p-5 space-y-5">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-5 gap-4">
                <MetricCard
                  type="type"
                  label="Type"
                  badge={getTypeBadge(metadata.type)}
                />
                <MetricCard
                  type="rows"
                  label="Rows"
                  value={formatNumber(metadata.numRows)}
                  subValue={metadata.numRows > 1000 ? `${metadata.numRows.toLocaleString()} total` : undefined}
                />
                <MetricCard
                  type="size"
                  label="Size"
                  value={formatBytes(metadata.numBytes)}
                />
                <MetricCard
                  type="columns"
                  label="Columns"
                  value={metadata.schema.length}
                  subValue="fields"
                />
                <MetricCard
                  type="freshness"
                  label="Freshness"
                  freshnessIndicator={{
                    status: metadata.freshness,
                    color: getFreshnessConfig(metadata.freshness).color
                  }}
                />
              </div>

              {/* Tabs */}
              <Tabs defaultValue="schema" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 h-11 p-1 bg-muted/50 rounded-xl">
                  <TabsTrigger
                    value="schema"
                    className="text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Columns3 className="h-4 w-4 mr-2" />
                    Schema
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className="text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Table2 className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    className="text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Details
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="schema" className="space-y-4 mt-4">
                  <Card className="border-border/50 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border/50">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{metadata.schema.length} columns</span>
                      </div>
                      <div className="max-h-[320px] overflow-auto scrollbar-thin">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/20 hover:bg-muted/20">
                              <TableHead className="text-xs h-10 font-semibold">Column Name</TableHead>
                              <TableHead className="text-xs h-10 font-semibold">Type</TableHead>
                              <TableHead className="text-xs h-10 font-semibold">Mode</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {metadata.schema.map((field, idx) => (
                              <SchemaRow key={idx} field={field} index={idx} />
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {metadata.viewQuery && (
                    <Card className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Eye className="h-4 w-4 text-purple-400" />
                          <span className="text-sm font-medium">View Definition</span>
                        </div>
                        <pre className="text-xs bg-muted/50 p-4 rounded-xl overflow-x-auto max-h-[180px] font-mono scrollbar-thin border border-border/30">
                          {metadata.viewQuery}
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
                  {previewLoading ? (
                    <Skeleton className="h-56 rounded-xl" />
                  ) : preview && preview.rows.length > 0 ? (
                    <Card className="border-border/50 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/50">
                          <span className="text-sm font-medium">First {preview.totalRows} rows</span>
                          <Badge variant="outline" className="text-xs">
                            {preview.schema.length} columns shown
                          </Badge>
                        </div>
                        <div className="overflow-x-auto max-h-[320px] scrollbar-thin">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/20 hover:bg-muted/20">
                                {preview.schema.slice(0, 6).map((col, idx) => (
                                  <TableHead key={idx} className="text-xs whitespace-nowrap h-10 font-semibold">
                                    {col.name}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {preview.rows.map((row, rowIdx) => (
                                <TableRow key={rowIdx} className={cn(
                                  "transition-colors hover:bg-accent/50",
                                  rowIdx % 2 === 0 && "bg-muted/20"
                                )}>
                                  {preview.schema.slice(0, 6).map((col, colIdx) => (
                                    <TableCell key={colIdx} className="text-xs font-mono whitespace-nowrap py-2.5">
                                      {String(row[col.name] ?? 'NULL').slice(0, 40)}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-border/50">
                      <CardContent className="flex flex-col items-center justify-center h-44 text-muted-foreground">
                        <Table2 className="h-8 w-8 mb-3 opacity-40" />
                        <p className="text-sm">No preview data available</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="details" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Timestamps</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                            <span className="text-xs text-muted-foreground">Created</span>
                            <span className="text-sm font-medium">
                              {new Date(metadata.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                            <span className="text-xs text-muted-foreground">Modified</span>
                            <span className="text-sm font-medium">
                              {new Date(metadata.modifiedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Database className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Location & Config</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                            <span className="text-xs text-muted-foreground">Region</span>
                            <Badge variant="outline" className="text-xs font-medium">
                              {metadata.location}
                            </Badge>
                          </div>
                          {metadata.clusteringFields?.length > 0 && (
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">Clustering</span>
                              <span className="text-xs font-mono">
                                {metadata.clusteringFields.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Failed to load metadata</p>
          </div>
        )}
      </div>
    </>
  )
}
