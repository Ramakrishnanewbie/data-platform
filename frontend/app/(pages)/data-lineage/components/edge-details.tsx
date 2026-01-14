"use client"

import { useQuery } from '@tanstack/react-query'
import { X, Code, Clock, DollarSign, User, Play, Copy, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useState, useEffect } from 'react'

interface EdgeDetailsPanelProps {
  sourceTable: string  // Format: project.dataset.table
  targetTable: string  // Format: project.dataset.table
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
    setNotification('✅ SQL copied to clipboard!')
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
          <div className="bg-background border rounded-lg shadow-lg p-3">
            <p className="text-sm font-medium">{notification}</p>
          </div>
        </div>
      )}

      <div className="fixed inset-y-0 right-0 w-[700px] bg-background border-l shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Code className="h-5 w-5 text-blue-500" />
            <div>
              <h2 className="text-lg font-bold">Edge Details</h2>
              <p className="text-xs text-muted-foreground">
                {getSourceTableName()} → {getTargetTableName()}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : edgeData?.query ? (
            <div className="space-y-4">
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(edgeData.query!)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy SQL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runInSqlEditor}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run in Editor
                </Button>
              </div>

              {/* Relationship Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Relationship
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Source</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{getSourceTableName()}</code>
                  </div>
                  <div className="flex items-center justify-center py-1">
                    <span className="text-2xl">→</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Target</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{getTargetTableName()}</code>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Statement Type</span>
                    <Badge variant="secondary">{edgeData.statementType}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Query Performance */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Duration</span>
                    </div>
                    <span className="text-sm font-medium">{formatDuration(edgeData.durationMs)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-purple-500" />
                      <span className="text-sm text-muted-foreground">Data Processed</span>
                    </div>
                    <span className="text-sm font-medium">{formatBytes(edgeData.bytesProcessed)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">Est. Cost</span>
                    </div>
                    <span className="text-sm font-medium">${edgeData.costEstimate.toFixed(4)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-muted-foreground">Executed By</span>
                    </div>
                    <span className="text-sm font-medium truncate max-w-[200px]">{edgeData.userEmail}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Timestamps */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Execution Time</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Started</span>
                    <span>{new Date(edgeData.startTime).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span>{new Date(edgeData.endTime).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Job ID</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{edgeData.jobId.split(':').pop()}</code>
                  </div>
                </CardContent>
              </Card>

              {/* SQL Query */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    SQL Query
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto max-h-[400px] font-mono">
                      {edgeData.query}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(edgeData.query!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
              <Database className="h-16 w-16 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold mb-2">No Query Found</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {edgeData?.message || "Could not find the SQL query that created this relationship. The job may be older than 30 days."}
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  )
}