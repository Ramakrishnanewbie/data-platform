"use client"

import { useQuery } from '@tanstack/react-query'
import { X, Code, Clock, DollarSign, User, Play, Copy, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState, useEffect } from 'react'

interface EdgeDetailsPanelProps {
  sourceTable: string
  targetTable: string
  onClose: () => void
}

interface EdgeQueryData {
  sourceTable: string
  targetTable: string
  query: string | null
  jobId: string
  userEmail: string
  startTime: string
  endTime: string
  durationMs: number
  bytesProcessed: number
  totalSlotMs: number
  statementType: string
  costEstimate: number
  message?: string
}

async function fetchEdgeQuery(sourceTable: string, targetTable: string) {
  const response = await fetch(`/api/bigquery/edge-query/${encodeURIComponent(sourceTable)}/${encodeURIComponent(targetTable)}`)
  if (!response.ok) throw new Error('Failed to fetch edge query')
  return response.json()
}

export default function EdgeDetailsPanel({ sourceTable, targetTable, onClose }: EdgeDetailsPanelProps) {
  const [notification, setNotification] = useState<string | null>(null)

  const { data: edgeData, isLoading } = useQuery<EdgeQueryData>({
    queryKey: ['edge-query', sourceTable, targetTable],
    queryFn: () => fetchEdgeQuery(sourceTable, targetTable),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setNotification('✅ SQL copied!')
  }

  const runInSqlEditor = () => {
    if (edgeData?.query) {
      window.location.href = `/sql?query=${encodeURIComponent(edgeData.query)}`
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
    return `${(ms / 60000).toFixed(2)}m`
  }

  const getSourceTableName = () => sourceTable.split('.').pop() || sourceTable
  const getTargetTableName = () => targetTable.split('.').pop() || targetTable

  return (
    <>
      {notification && (
        <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top duration-200">
          <div className="bg-background border rounded-lg shadow-lg px-3 py-1.5">
            <p className="text-[11px] font-medium">{notification}</p>
          </div>
        </div>
      )}

      <div className="h-full flex flex-col bg-background">
        {/* Compact Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-blue-500" />
            <div>
              <h3 className="text-sm font-semibold">Edge Details</h3>
              <p className="text-[10px] text-muted-foreground">
                {getSourceTableName()} → {getTargetTableName()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {edgeData?.query && (
              <>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => copyToClipboard(edgeData.query!)}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={runInSqlEditor}>
                  <Play className="h-3 w-3 mr-1" />
                  Run
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex-1 p-4">
            <div className="flex gap-3">
              <Skeleton className="h-16 flex-1" />
              <Skeleton className="h-16 flex-1" />
              <Skeleton className="h-16 flex-1" />
              <Skeleton className="h-16 flex-1" />
            </div>
          </div>
        ) : edgeData?.query ? (
          <ScrollArea className="flex-1 scrollbar-thin">
            <div className="p-4 space-y-3">
              {/* Performance Metrics - Horizontal Row */}
              <div className="flex gap-3">
                <Card className="flex-1 border-l-2 border-l-blue-500">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Clock className="h-3 w-3 text-blue-500" />
                      <p className="text-[10px] text-muted-foreground">Duration</p>
                    </div>
                    <p className="text-base font-bold">{formatDuration(edgeData.durationMs)}</p>
                  </CardContent>
                </Card>

                <Card className="flex-1 border-l-2 border-l-purple-500">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Database className="h-3 w-3 text-purple-500" />
                      <p className="text-[10px] text-muted-foreground">Data Processed</p>
                    </div>
                    <p className="text-base font-bold">{formatBytes(edgeData.bytesProcessed)}</p>
                  </CardContent>
                </Card>

                <Card className="flex-1 border-l-2 border-l-green-500">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <DollarSign className="h-3 w-3 text-green-500" />
                      <p className="text-[10px] text-muted-foreground">Est. Cost</p>
                    </div>
                    <p className="text-base font-bold">${edgeData.costEstimate.toFixed(4)}</p>
                  </CardContent>
                </Card>

                <Card className="flex-1 border-l-2 border-l-orange-500">
                  <CardContent className="p-2.5">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Statement</p>
                    <Badge variant="secondary" className="text-[10px] h-5">{edgeData.statementType}</Badge>
                  </CardContent>
                </Card>

                <Card className="flex-1 border-l-2 border-l-yellow-500">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <User className="h-3 w-3 text-yellow-500" />
                      <p className="text-[10px] text-muted-foreground">Executed By</p>
                    </div>
                    <p className="text-[10px] font-medium truncate">{edgeData.userEmail}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="query" className="space-y-2">
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="query" className="text-[11px]">SQL Query</TabsTrigger>
                  <TabsTrigger value="details" className="text-[11px]">Job Details</TabsTrigger>
                </TabsList>

                <TabsContent value="query" className="mt-2">
                  <Card>
                    <CardContent className="p-2.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Code className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-medium">SQL Query</span>
                      </div>
                      <div className="relative">
                        <pre className="text-[10px] bg-muted p-2.5 rounded-md overflow-x-auto max-h-[280px] font-mono scrollbar-thin">
                          {edgeData.query}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="details" className="mt-2">
                  <div className="flex gap-3">
                    <Card className="flex-1">
                      <CardContent className="p-2.5">
                        <p className="text-[11px] font-medium mb-2">Relationship</p>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Source</span>
                            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{getSourceTableName()}</code>
                          </div>
                          <div className="flex justify-center py-0.5">
                            <span className="text-xl">→</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Target</span>
                            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{getTargetTableName()}</code>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="flex-1">
                      <CardContent className="p-2.5">
                        <p className="text-[11px] font-medium mb-2">Execution Time</p>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Started</span>
                            <span>{new Date(edgeData.startTime).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Completed</span>
                            <span>{new Date(edgeData.endTime).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between text-[10px] pt-1.5 border-t">
                            <span className="text-muted-foreground">Job ID</span>
                            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded truncate max-w-[140px]">
                              {edgeData.jobId.split(':').pop()}
                            </code>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Database className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-sm font-semibold mb-1.5">No Query Found</h3>
            <p className="text-[11px] text-muted-foreground max-w-md">
              {edgeData?.message || "Could not find the SQL query that created this relationship."}
            </p>
          </div>
        )}
      </div>
    </>
  )
}