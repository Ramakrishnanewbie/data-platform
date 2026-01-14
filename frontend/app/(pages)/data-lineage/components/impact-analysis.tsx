"use client"

import { useMemo, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertTriangle,
  X,
  Download,
  Database,
} from 'lucide-react'
import { Node, Edge } from 'reactflow'

interface ImpactAnalysisProps {
  nodes: Node[]
  edges: Edge[]
  selectedNode: {
    projectId: string
    datasetId: string
    tableName: string
  }
  onClose: () => void
}

interface ImpactResult {
  directDownstream: Node[]
  indirectDownstream: Node[]
  totalAffected: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number
  longestChain: number
}

function calculateImpact(nodes: Node[], edges: Edge[], sourceNodeId: string): ImpactResult {
  const directDownstream: Node[] = []
  const indirectDownstream: Node[] = []
  const visited = new Set<string>()
  
  const queue: Array<{ id: string; depth: number }> = [{ id: sourceNodeId, depth: 0 }]
  visited.add(sourceNodeId)
  let maxDepth = 0
  
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!
    maxDepth = Math.max(maxDepth, depth)
    
    const outgoingEdges = edges.filter(e => e.source === id)
    
    outgoingEdges.forEach(edge => {
      const targetNode = nodes.find(n => n.id === edge.target)
      if (targetNode && !visited.has(edge.target)) {
        visited.add(edge.target)
        
        if (depth === 0) {
          directDownstream.push(targetNode)
        } else {
          indirectDownstream.push(targetNode)
        }
        
        queue.push({ id: edge.target, depth: depth + 1 })
      }
    })
  }
  
  const totalAffected = directDownstream.length + indirectDownstream.length
  const riskScore = Math.min(100, (totalAffected * 10) + (maxDepth * 5))
  
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
  if (riskScore >= 80) {
    riskLevel = 'critical'
  } else if (riskScore >= 50) {
    riskLevel = 'high'
  } else if (riskScore >= 25) {
    riskLevel = 'medium'
  }
  
  return {
    directDownstream,
    indirectDownstream,
    totalAffected,
    riskLevel,
    riskScore,
    longestChain: maxDepth,
  }
}

const ImpactAnalysis = memo(function ImpactAnalysis({ nodes, edges, selectedNode, onClose }: ImpactAnalysisProps) {
  const nodeId = `${selectedNode.projectId}.${selectedNode.datasetId}.${selectedNode.tableName}`
  
  const impact = useMemo(() => {
    return calculateImpact(nodes, edges, nodeId)
  }, [nodes, edges, nodeId])

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300', accent: 'bg-red-500' }
      case 'high': return { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300', accent: 'bg-orange-500' }
      case 'medium': return { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-300', accent: 'bg-yellow-500' }
      default: return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300', accent: 'bg-green-500' }
    }
  }

  const riskColors = getRiskColor(impact.riskLevel)

  const exportImpactReport = () => {
    const report = `# Impact Analysis Report
    
**Table:** ${selectedNode.tableName}
**Dataset:** ${selectedNode.datasetId}
**Generated:** ${new Date().toLocaleString()}

## Summary
- **Risk Level:** ${impact.riskLevel.toUpperCase()}
- **Risk Score:** ${impact.riskScore}/100
- **Total Affected Tables:** ${impact.totalAffected}
- **Longest Dependency Chain:** ${impact.longestChain} levels

## Direct Dependencies (${impact.directDownstream.length})
${impact.directDownstream.map(n => `- ${n.data?.label || 'Unknown'} (${n.data?.datasetId || 'N/A'})`).join('\n')}

## Indirect Dependencies (${impact.indirectDownstream.length})
${impact.indirectDownstream.map(n => `- ${n.data?.label || 'Unknown'} (${n.data?.datasetId || 'N/A'})`).join('\n')}
`
    
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `impact-analysis-${selectedNode.tableName}.md`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <div>
            <h3 className="text-sm font-semibold">Impact Analysis</h3>
            <p className="text-xs text-muted-foreground">{selectedNode.tableName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={exportImpactReport}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content - Horizontal Layout */}
      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="p-5">
          {/* Stats Row */}
          <div className="flex gap-3 mb-4">
            <Card className="flex-1 border-l-2 border-l-orange-500">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Risk Level</p>
                <Badge className={`${riskColors.bg} ${riskColors.text} border-0 text-xs px-2`}>
                  {impact.riskLevel.toUpperCase()}
                </Badge>
              </CardContent>
            </Card>

            <Card className="flex-1 border-l-2 border-l-blue-500">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Risk Score</p>
                <p className="text-lg font-bold">{impact.riskScore}<span className="text-xs text-muted-foreground">/100</span></p>
              </CardContent>
            </Card>

            <Card className="flex-1 border-l-2 border-l-purple-500">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Total Impact</p>
                <p className="text-lg font-bold">{impact.totalAffected}</p>
              </CardContent>
            </Card>

            <Card className="flex-1 border-l-2 border-l-green-500">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Longest Chain</p>
                <p className="text-lg font-bold">{impact.longestChain}</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-muted-foreground">Impact Score</span>
              <span className={`font-semibold ${riskColors.text}`}>{impact.riskScore}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${riskColors.accent} transition-all duration-500`}
                style={{ width: `${impact.riskScore}%` }}
              />
            </div>
          </div>

          {/* Dependencies in 2 Columns */}
          <div className="grid grid-cols-2 gap-4">
            {/* Direct */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Database className="h-4 w-4 text-red-500" />
                <h4 className="text-sm font-semibold">Direct ({impact.directDownstream.length})</h4>
              </div>
              {impact.directDownstream.length > 0 ? (
                <div className="space-y-2">
                  {impact.directDownstream.map((node) => (
                    <div key={node.id} className="p-2.5 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                      <p className="text-xs font-medium truncate">{node.data?.label || 'Unknown'}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] text-muted-foreground truncate">{node.data?.datasetId || ''}</p>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{node.data?.type || 'table'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">None</p>
              )}
            </div>

            {/* Indirect */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Database className="h-4 w-4 text-orange-500" />
                <h4 className="text-sm font-semibold">Indirect ({impact.indirectDownstream.length})</h4>
              </div>
              {impact.indirectDownstream.length > 0 ? (
                <div className="space-y-2">
                  {impact.indirectDownstream.map((node) => (
                    <div key={node.id} className="p-2.5 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                      <p className="text-xs font-medium truncate">{node.data?.label || 'Unknown'}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] text-muted-foreground truncate">{node.data?.datasetId || ''}</p>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{node.data?.type || 'table'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">None</p>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs font-semibold mb-2">Recommended Actions</p>
            <div className="space-y-1.5 text-xs">
              {impact.riskLevel === 'critical' && (
                <>
                  <div className="flex gap-2"><span className="text-muted-foreground">•</span><span>Extensive testing required before changes</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground">•</span><span>Consider gradual rollout strategy</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground">•</span><span>Notify all {impact.totalAffected} downstream owners</span></div>
                </>
              )}
              
              {impact.riskLevel === 'high' && (
                <>
                  <div className="flex gap-2"><span className="text-muted-foreground">•</span><span>Thorough testing recommended</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground">•</span><span>Review all {impact.totalAffected} affected pipelines</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground">•</span><span>Coordinate with downstream owners</span></div>
                </>
              )}
              
              {impact.riskLevel === 'medium' && (
                <>
                  <div className="flex gap-2"><span className="text-muted-foreground">•</span><span>Standard testing recommended</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground">•</span><span>Monitor downstream tables after changes</span></div>
                </>
              )}
              
              {impact.riskLevel === 'low' && (
                <>
                  <div className="flex gap-2"><span className="text-muted-foreground">•</span><span>Minimal downstream impact</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground">•</span><span>Standard testing sufficient</span></div>
                </>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
})

ImpactAnalysis.displayName = 'ImpactAnalysis'

export default ImpactAnalysis