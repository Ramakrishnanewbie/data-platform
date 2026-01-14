"use client"

import { useMemo, memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { ArrowUpCircle, ArrowDownCircle, Layers, TrendingUp, AlertTriangle } from 'lucide-react'
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
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    let riskColor = 'text-green-600'
    
    if (downstreamCount > 10) {
      riskLevel = 'high'
      riskColor = 'text-red-600'
    } else if (downstreamCount > 5) {
      riskLevel = 'medium'
      riskColor = 'text-yellow-600'
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
    }
  }, [nodes, edges, rootNodeId])

  return (
    <div className="flex items-center gap-4 bg-background/95 backdrop-blur border rounded-lg px-3 py-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <ArrowUpCircle className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs text-muted-foreground">Up:</span>
          <span className="text-sm font-semibold">{stats.upstreamCount}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <ArrowDownCircle className="h-3.5 w-3.5 text-purple-500" />
          <span className="text-xs text-muted-foreground">Down:</span>
          <span className="text-sm font-semibold">{stats.downstreamCount}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-green-500" />
          <span className="text-xs text-muted-foreground">Total:</span>
          <span className="text-sm font-semibold">{stats.totalTables}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
          <span className="text-xs text-muted-foreground">Depth:</span>
          <span className="text-sm font-semibold">{stats.maxDepth}</span>
        </div>
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-1.5">
        <AlertTriangle className={`h-3.5 w-3.5 ${stats.riskColor}`} />
        <span className="text-xs text-muted-foreground">Risk:</span>
        <Badge variant="outline" className={`text-xs ${stats.riskColor} border-current`}>
          {stats.riskLevel}
        </Badge>
      </div>
    </div>
  )
})

LineageSummary.displayName = 'LineageSummary'

export default LineageSummary