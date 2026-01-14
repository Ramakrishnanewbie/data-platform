"use client"

import { useQuery } from '@tanstack/react-query'
import { X, Table2, Eye, Database, Copy, ExternalLink, Clock, Layers, Tag, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useState, useEffect, memo } from 'react'

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

// Memoized schema row component
const SchemaRow = memo(({ field }: { field: any }) => (
  <TableRow>
    <TableCell className="font-mono text-xs">{field.name}</TableCell>
    <TableCell className="text-xs">
      <Badge variant="outline" className="text-[10px]">{field.type}</Badge>
    </TableCell>
    <TableCell className="text-xs">{field.mode}</TableCell>
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
    setNotification('✅ Copied!')
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
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatNumber = (num: number) => num.toLocaleString()

  const getFreshnessColor = (freshness: string) => {
    switch (freshness) {
      case 'fresh': return 'bg-green-500'
      case 'recent': return 'bg-yellow-500'
      case 'stale': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'view':
        return <Eye className="h-4 w-4 text-purple-500" />
      case 'materialized_view':
        return <Database className="h-4 w-4 text-green-500" />
      default:
        return <Table2 className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <>
      {notification && (
        <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top duration-200">
          <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
            <p className="text-xs font-medium">{notification}</p>
          </div>
        </div>
      )}

      <div className="fixed inset-y-0 right-0 w-[550px] bg-background border-l shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {metadata && getTypeIcon(metadata.type)}
            <div>
              <h2 className="text-lg font-bold">{tableId}</h2>
              <p className="text-xs text-muted-foreground">
                {projectId}.{datasetId}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          {metadataLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : metadata ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(`${projectId}.${datasetId}.${tableId}`)}
                >
                  <Copy className="h-3 w-3 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openInSqlEditor}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  SQL Editor
                </Button>
              </div>

              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-xs font-medium">Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Type</span>
                    <Badge variant="secondary" className="text-[10px]">{metadata.type}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Rows</span>
                    <span className="text-xs font-medium">{formatNumber(metadata.numRows)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Size</span>
                    <span className="text-xs font-medium">{formatBytes(metadata.numBytes)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Freshness</span>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${getFreshnessColor(metadata.freshness)}`} />
                      <span className="text-xs font-medium capitalize">{metadata.freshness}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-xs font-medium flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Timestamps
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Created</span>
                    <span>{new Date(metadata.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Modified</span>
                    <span>{new Date(metadata.modifiedAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-xs font-medium flex items-center gap-2">
                    <Layers className="h-3 w-3" />
                    Schema ({metadata.schema.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="max-h-[250px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Column</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs">Mode</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metadata.schema.map((field, idx) => (
                          <SchemaRow key={idx} field={field} />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {preview && preview.rows.length > 0 && (
                <Card>
                  <CardHeader className="p-3">
                    <CardTitle className="text-xs font-medium">Data Preview</CardTitle>
                    <CardDescription className="text-[10px]">First {preview.totalRows} rows</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    {previewLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : (
                      <div className="overflow-x-auto max-h-[300px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {preview.schema.slice(0, 5).map((col, idx) => (
                                <TableHead key={idx} className="text-[10px] whitespace-nowrap">{col.name}</TableHead>
                              ))}
                              {preview.schema.length > 5 && (
                                <TableHead className="text-[10px]">...</TableHead>
                              )}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {preview.rows.map((row, rowIdx) => (
                              <TableRow key={rowIdx}>
                                {preview.schema.slice(0, 5).map((col, colIdx) => (
                                  <TableCell key={colIdx} className="text-[10px] font-mono whitespace-nowrap">
                                    {String(row[col.name] ?? 'NULL').slice(0, 30)}
                                  </TableCell>
                                ))}
                                {preview.schema.length > 5 && (
                                  <TableCell className="text-[10px]">...</TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {metadata.viewQuery && (
                <Card>
                  <CardHeader className="p-3">
                    <CardTitle className="text-xs font-medium">View Definition</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <pre className="text-[10px] bg-muted p-2 rounded-md overflow-x-auto max-h-[200px]">
                      {metadata.viewQuery}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">Failed to load metadata</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  )
}