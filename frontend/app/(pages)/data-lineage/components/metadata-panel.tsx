"use client"

import { useQuery } from '@tanstack/react-query'
import { X, Table2, Eye, Database, Copy, ExternalLink, Clock, Layers } from 'lucide-react'
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

const SchemaRow = memo(({ field }: { field: any }) => (
  <TableRow>
    <TableCell className="font-mono text-[11px] py-1.5">{field.name}</TableCell>
    <TableCell className="text-[11px] py-1.5">
      <Badge variant="outline" className="text-[9px] px-1.5 py-0">{field.type}</Badge>
    </TableCell>
    <TableCell className="text-[11px] py-1.5">{field.mode}</TableCell>
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
        return <Eye className="h-3.5 w-3.5 text-purple-500" />
      case 'materialized_view':
        return <Database className="h-3.5 w-3.5 text-green-500" />
      default:
        return <Table2 className="h-3.5 w-3.5 text-blue-500" />
    }
  }

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
            {metadata && getTypeIcon(metadata.type)}
            <div>
              <h3 className="text-sm font-semibold">{tableId}</h3>
              <p className="text-[10px] text-muted-foreground">
                {projectId}.{datasetId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={() => copyToClipboard(`${projectId}.${datasetId}.${tableId}`)}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={openInSqlEditor}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Editor
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {metadataLoading ? (
          <div className="flex-1 p-4">
            <div className="flex gap-3">
              <Skeleton className="h-16 flex-1" />
              <Skeleton className="h-16 flex-1" />
              <Skeleton className="h-16 flex-1" />
              <Skeleton className="h-16 flex-1" />
            </div>
          </div>
        ) : metadata ? (
          <ScrollArea className="flex-1 scrollbar-thin">
            <div className="p-4 space-y-3">
              {/* Quick Stats - Horizontal Row */}
              <div className="flex gap-3">
                <Card className="flex-1 border-l-2 border-l-blue-500">
                  <CardContent className="p-2.5">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Type</p>
                    <Badge variant="secondary" className="text-[10px] h-5">{metadata.type}</Badge>
                  </CardContent>
                </Card>

                <Card className="flex-1 border-l-2 border-l-green-500">
                  <CardContent className="p-2.5">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Rows</p>
                    <p className="text-base font-bold">{formatNumber(metadata.numRows)}</p>
                  </CardContent>
                </Card>

                <Card className="flex-1 border-l-2 border-l-purple-500">
                  <CardContent className="p-2.5">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Size</p>
                    <p className="text-base font-bold">{formatBytes(metadata.numBytes)}</p>
                  </CardContent>
                </Card>

                <Card className="flex-1 border-l-2 border-l-orange-500">
                  <CardContent className="p-2.5">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Columns</p>
                    <p className="text-base font-bold">{metadata.schema.length}</p>
                  </CardContent>
                </Card>

                <Card className="flex-1 border-l-2 border-l-yellow-500">
                  <CardContent className="p-2.5">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Freshness</p>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${getFreshnessColor(metadata.freshness)}`} />
                      <span className="text-xs font-semibold capitalize">{metadata.freshness}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="schema" className="space-y-2">
                <TabsList className="grid w-full grid-cols-3 h-8">
                  <TabsTrigger value="schema" className="text-[11px]">Schema</TabsTrigger>
                  <TabsTrigger value="preview" className="text-[11px]">Preview</TabsTrigger>
                  <TabsTrigger value="details" className="text-[11px]">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="schema" className="space-y-2 mt-2">
                  <Card>
                    <CardContent className="p-2.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Layers className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-medium">{metadata.schema.length} columns</span>
                      </div>
                      <div className="max-h-[280px] overflow-auto scrollbar-thin">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-[10px] h-7">Column</TableHead>
                              <TableHead className="text-[10px] h-7">Type</TableHead>
                              <TableHead className="text-[10px] h-7">Mode</TableHead>
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

                  {metadata.viewQuery && (
                    <Card>
                      <CardContent className="p-2.5">
                        <p className="text-[11px] font-medium mb-1.5">View Definition</p>
                        <pre className="text-[10px] bg-muted p-2 rounded-md overflow-x-auto max-h-[150px] font-mono scrollbar-thin">
                          {metadata.viewQuery}
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="preview" className="mt-2">
                  {previewLoading ? (
                    <Skeleton className="h-48" />
                  ) : preview && preview.rows.length > 0 ? (
                    <Card>
                      <CardContent className="p-2.5">
                        <p className="text-[11px] font-medium mb-2">First {preview.totalRows} rows</p>
                        <div className="overflow-x-auto max-h-[280px] scrollbar-thin">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {preview.schema.slice(0, 6).map((col, idx) => (
                                  <TableHead key={idx} className="text-[10px] whitespace-nowrap h-7">{col.name}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {preview.rows.map((row, rowIdx) => (
                                <TableRow key={rowIdx}>
                                  {preview.schema.slice(0, 6).map((col, colIdx) => (
                                    <TableCell key={colIdx} className="text-[10px] font-mono whitespace-nowrap py-1.5">
                                      {String(row[col.name] ?? 'NULL').slice(0, 35)}
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
                    <div className="flex items-center justify-center h-36 text-muted-foreground text-[11px]">
                      No preview data
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="details" className="mt-2">
                  <div className="flex gap-3">
                    <Card className="flex-1">
                      <CardContent className="p-2.5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-medium">Timestamps</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Created</span>
                            <span>{new Date(metadata.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Modified</span>
                            <span>{new Date(metadata.modifiedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="flex-1">
                      <CardContent className="p-2.5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Database className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-medium">Location</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{metadata.location}</Badge>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-[11px]">Failed to load metadata</p>
          </div>
        )}
      </div>
    </>
  )
}