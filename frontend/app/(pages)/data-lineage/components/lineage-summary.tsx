"use client"

import { useMemo, memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUpCircle, ArrowDownCircle, GitBranch, Layers, TrendingUp, AlertTriangle } from 'lucide-react'
import { Node, Edge } from 'reactflow'

interface LineageSummaryProps {
  nodes: Node[]
  edges: Edge[]
  rootNodeId: string
}

const LineageSummary = memo(function LineageSummary({ nodes, edges, rootNodeId }: LineageSummaryProps) {
  const stats = useMemo(() => {
    const upstreamCount = edges.filter(e => e.target === rootNodeId).length
    const downstreamCount = edges.filter(e => e.source === rootNodeId).length
    const totalTables = nodes.length
    
    const depths = nodes.map(n => Math.abs(n.data?.level || 0))
    const maxDepth = depths.length > 0 ? Math.max(...depths) : 0
    
    const tableCount = nodes.filter(n => n.data?.type === 'table').length
    const viewCount = nodes.filter(n => n.data?.type === 'view').length
    const matViewCount = nodes.filter(n => n.data?.type === 'materialized_view').length
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    let riskColor = 'text-green-600'
    let riskBg = 'bg-green-50'
    
    if (downstreamCount > 10) {
      riskLevel = 'high'
      riskColor = 'text-red-600'
      riskBg = 'bg-red-50'
    } else if (downstreamCount > 5) {
      riskLevel = 'medium'
      riskColor = 'text-yellow-600'
      riskBg = 'bg-yellow-50'
    }
    
    return {
      upstreamCount,
      downstreamCount,
      totalTables,
      maxDepth,
      tableCount,
      viewCount,
      matViewCount,
      riskLevel,
      riskColor,
      riskBg,
    }
  }, [nodes, edges, rootNodeId])

  const rootNode = nodes.find(n => n.id === rootNodeId)

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <GitBranch className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">{rootNode?.data?.label || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">{rootNode?.data?.datasetId || ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Upstream</p>
                <p className="text-lg font-bold">{stats.upstreamCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Downstream</p>
                <p className="text-lg font-bold">{stats.downstreamCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Assets</p>
                <p className="text-lg font-bold">{stats.totalTables}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Max Depth</p>
                <p className="text-lg font-bold">{stats.maxDepth}</p>
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${stats.riskBg}`}>
            <AlertTriangle className={`h-4 w-4 ${stats.riskColor}`} />
            <div>
              <p className="text-xs text-muted-foreground">Impact Risk</p>
              <p className={`text-sm font-bold ${stats.riskColor} uppercase`}>
                {stats.riskLevel}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground">Types:</p>
          {stats.tableCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {stats.tableCount} Tables
            </Badge>
          )}
          {stats.viewCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {stats.viewCount} Views
            </Badge>
          )}
          {stats.matViewCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {stats.matViewCount} Mat. Views
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

LineageSummary.displayName = 'LineageSummary'

export default LineageSummary