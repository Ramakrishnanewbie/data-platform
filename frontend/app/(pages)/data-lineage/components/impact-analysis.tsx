"use client"

import { useState, useMemo, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  AlertTriangle,
  X,
  Download,
  TrendingUp,
  Users,
  Database,
  FileWarning,
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
  
  // BFS to find all downstream nodes
  const queue: Array<{ id: string; depth: number }> = [{ id: sourceNodeId, depth: 0 }]
  visited.add(sourceNodeId)
  let maxDepth = 0
  
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!
    maxDepth = Math.max(maxDepth, depth)
    
    // Find all edges where this node is the source
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
  
  // Calculate risk score (0-100)
  const riskScore = Math.min(100, (totalAffected * 10) + (maxDepth * 5))
  
  // Determine risk level
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
      case 'critical': return { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' }
      case 'high': return { text: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-300' }
      case 'medium': return { text: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-300' }
      default: return { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300' }
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

## Recommendation
${impact.riskLevel === 'critical' 
  ? '⚠️ HIGH RISK: Extensive testing required. Consider gradual rollout.'
  : impact.riskLevel === 'high'
  ? '⚠️ MEDIUM-HIGH RISK: Thorough testing recommended. Review all affected pipelines.'
  : impact.riskLevel === 'medium'
  ? '⚠️ MODERATE RISK: Basic testing recommended. Monitor downstream tables.'
  : '✅ LOW RISK: Minimal impact. Standard testing sufficient.'
}
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
    <div className="fixed inset-y-0 right-0 w-[500px] bg-background border-l shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <div>
            <h2 className="text-lg font-bold">Impact Analysis</h2>
            <p className="text-xs text-muted-foreground">{selectedNode.tableName}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Risk Overview Card */}
          <Card className={`border-2 ${riskColors.border}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Risk Assessment</CardTitle>
                <Badge className={`${riskColors.bg} ${riskColors.text} border-0`}>
                  {impact.riskLevel.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Risk Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Risk Score</span>
                  <span className={`text-2xl font-bold ${riskColors.text}`}>
                    {impact.riskScore}/100
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${riskColors.bg} transition-all duration-500`}
                    style={{ width: `${impact.riskScore}%` }}
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="text-center p-2 bg-muted rounded-lg">
                  <p className="text-xl font-bold">{impact.totalAffected}</p>
                  <p className="text-xs text-muted-foreground">Affected Tables</p>
                </div>
                <div className="text-center p-2 bg-muted rounded-lg">
                  <p className="text-xl font-bold">{impact.longestChain}</p>
                  <p className="text-xs text-muted-foreground">Longest Chain</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Impact Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Impact Summary</CardTitle>
              <CardDescription className="text-xs">
                What happens if you modify this table?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Direct Dependencies</span>
                <Badge variant="secondary">{impact.directDownstream.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Indirect Dependencies</span>
                <Badge variant="secondary">{impact.indirectDownstream.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total Impact</span>
                <Badge variant="secondary">{impact.totalAffected} tables</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Affected Tables - Direct */}
          {impact.directDownstream.length > 0 && (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        <Database className="h-4 w-4 text-red-500" />
        Direct Dependencies ({impact.directDownstream.length})
      </CardTitle>
      <CardDescription className="text-xs">
        Tables that directly read from this table
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {impact.directDownstream.map((node) => (
          <div key={node.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
            <div>
              <p className="text-xs font-medium">{node.data?.label || 'Unknown'}</p>
              <p className="text-[10px] text-muted-foreground">{node.data?.datasetId || ''}</p>
            </div>
            <Badge variant="outline" className="text-[10px]">{node.data?.type || 'table'}</Badge>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)}

          {/* Affected Tables - Indirect */}
          {impact.indirectDownstream.length > 0 && (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        <Database className="h-4 w-4 text-orange-500" />
        Indirect Dependencies ({impact.indirectDownstream.length})
      </CardTitle>
      <CardDescription className="text-xs">
        Tables affected through downstream chain
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {impact.indirectDownstream.map((node) => (
          <div key={node.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
            <div>
              <p className="text-xs font-medium">{node.data?.label || 'Unknown'}</p>
              <p className="text-[10px] text-muted-foreground">{node.data?.datasetId || ''}</p>
            </div>
            <Badge variant="outline" className="text-[10px]">{node.data?.type || 'table'}</Badge>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)}

          {/* Recommendations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileWarning className="h-4 w-4" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                {impact.riskLevel === 'critical' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="font-semibold text-red-700 mb-1">⚠️ CRITICAL IMPACT</p>
                    <ul className="list-disc list-inside space-y-1 text-red-600">
                      <li>Extensive testing required before changes</li>
                      <li>Consider gradual rollout strategy</li>
                      <li>Notify all downstream table owners</li>
                      <li>Create rollback plan</li>
                      <li>Monitor all {impact.totalAffected} affected tables</li>
                    </ul>
                  </div>
                )}
                
                {impact.riskLevel === 'high' && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <p className="font-semibold text-orange-700 mb-1">⚠️ HIGH IMPACT</p>
                    <ul className="list-disc list-inside space-y-1 text-orange-600">
                      <li>Thorough testing recommended</li>
                      <li>Review all {impact.totalAffected} affected pipelines</li>
                      <li>Coordinate with downstream owners</li>
                      <li>Plan deployment window carefully</li>
                    </ul>
                  </div>
                )}
                
                {impact.riskLevel === 'medium' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="font-semibold text-yellow-700 mb-1">⚠️ MODERATE IMPACT</p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-600">
                      <li>Standard testing recommended</li>
                      <li>Monitor downstream tables after changes</li>
                      <li>Notify affected teams</li>
                    </ul>
                  </div>
                )}
                
                {impact.riskLevel === 'low' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="font-semibold text-green-700 mb-1">✅ LOW IMPACT</p>
                    <ul className="list-disc list-inside space-y-1 text-green-600">
                      <li>Minimal downstream impact</li>
                      <li>Standard testing sufficient</li>
                      <li>Safe for development changes</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <Button 
            onClick={exportImpactReport} 
            variant="outline" 
            className="w-full"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Impact Report
          </Button>
        </div>
      </ScrollArea>
    </div>
  )
})

ImpactAnalysis.displayName = 'ImpactAnalysis'

export default ImpactAnalysis