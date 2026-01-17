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
  TrendingUp,
  GitBranch,
  Target,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { Node, Edge } from 'reactflow'
import { cn } from '@/lib/utils'

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

// Risk level configuration for consistent styling
const riskConfig = {
  critical: {
    gradient: 'from-red-500/25 to-red-600/10',
    borderColor: 'border-red-500/50',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/15',
    badgeBg: 'bg-red-500/20',
    badgeText: 'text-red-300',
    glowColor: 'shadow-red-500/20',
    progressColor: 'bg-gradient-to-r from-red-500 to-red-400',
    icon: AlertTriangle,
  },
  high: {
    gradient: 'from-orange-500/25 to-orange-600/10',
    borderColor: 'border-orange-500/50',
    textColor: 'text-orange-400',
    bgColor: 'bg-orange-500/15',
    badgeBg: 'bg-orange-500/20',
    badgeText: 'text-orange-300',
    glowColor: 'shadow-orange-500/20',
    progressColor: 'bg-gradient-to-r from-orange-500 to-orange-400',
    icon: Zap,
  },
  medium: {
    gradient: 'from-amber-500/25 to-amber-600/10',
    borderColor: 'border-amber-500/50',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    glowColor: 'shadow-amber-500/20',
    progressColor: 'bg-gradient-to-r from-amber-500 to-amber-400',
    icon: TrendingUp,
  },
  low: {
    gradient: 'from-emerald-500/25 to-emerald-600/10',
    borderColor: 'border-emerald-500/50',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    glowColor: 'shadow-emerald-500/20',
    progressColor: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
    icon: Shield,
  },
}

// Risk Metric Card Component
const RiskMetricCard = memo(({
  type,
  label,
  value,
  subValue,
  riskLevel,
  showBadge = false,
}: {
  type: 'risk' | 'score' | 'impact' | 'chain'
  label: string
  value: React.ReactNode
  subValue?: string
  riskLevel: keyof typeof riskConfig
  showBadge?: boolean
}) => {
  const config = riskConfig[riskLevel]

  const iconConfig = {
    risk: { icon: config.icon, color: config.textColor },
    score: { icon: Target, color: 'text-blue-400' },
    impact: { icon: Database, color: 'text-purple-400' },
    chain: { icon: GitBranch, color: 'text-cyan-400' },
  }

  const Icon = iconConfig[type].icon
  const iconColor = type === 'risk' ? config.textColor : iconConfig[type].color

  return (
    <Card className={cn(
      "group relative overflow-hidden",
      "border transition-all duration-300",
      "hover:shadow-lg hover:-translate-y-0.5",
      type === 'risk' ? config.borderColor : 'border-border/50'
    )}>
      {/* Gradient Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-60",
        type === 'risk' ? config.gradient : 'from-muted/50 to-transparent'
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
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 text-right">
            <p className="text-xs text-muted-foreground mb-1 font-medium">{label}</p>
            {showBadge ? (
              <Badge className={cn(
                "text-sm font-bold px-3 py-1 border-0",
                config.badgeBg, config.badgeText
              )}>
                {value}
              </Badge>
            ) : (
              <>
                <p className={cn(
                  "text-2xl font-bold tracking-tight",
                  type === 'score' && config.textColor
                )}>
                  {value}
                </p>
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

RiskMetricCard.displayName = 'RiskMetricCard'

// Circular Progress Component
const CircularProgress = memo(({
  value,
  riskLevel,
}: {
  value: number
  riskLevel: keyof typeof riskConfig
}) => {
  const config = riskConfig[riskLevel]
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="relative w-28 h-28">
      {/* Background Circle */}
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        {/* Progress Circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
            transition: 'stroke-dashoffset 0.5s ease-out'
          }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className={cn(
              riskLevel === 'critical' && 'text-red-500',
              riskLevel === 'high' && 'text-orange-500',
              riskLevel === 'medium' && 'text-amber-500',
              riskLevel === 'low' && 'text-emerald-500'
            )} style={{ stopColor: 'currentColor' }} />
            <stop offset="100%" className={cn(
              riskLevel === 'critical' && 'text-red-400',
              riskLevel === 'high' && 'text-orange-400',
              riskLevel === 'medium' && 'text-amber-400',
              riskLevel === 'low' && 'text-emerald-400'
            )} style={{ stopColor: 'currentColor' }} />
          </linearGradient>
        </defs>
      </svg>
      {/* Center Value */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-bold", config.textColor)}>{value}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  )
})

CircularProgress.displayName = 'CircularProgress'

// Dependency Item Component
const DependencyItem = memo(({ node, type }: { node: Node; type: 'direct' | 'indirect' }) => (
  <div className={cn(
    "group p-3 rounded-xl cursor-pointer",
    "border border-transparent",
    "transition-all duration-200",
    "hover:bg-accent/60 hover:border-border/60 hover:shadow-sm hover:-translate-y-0.5"
  )}>
    <div className="flex items-center gap-3">
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
        "transition-transform duration-200 group-hover:scale-105",
        type === 'direct' ? 'bg-red-500/15 border border-red-500/30' : 'bg-orange-500/15 border border-orange-500/30'
      )}>
        <Database className={cn(
          "h-4 w-4",
          type === 'direct' ? 'text-red-400' : 'text-orange-400'
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{node.data?.label || 'Unknown'}</p>
        <p className="text-xs text-muted-foreground truncate">{node.data?.datasetId || ''}</p>
      </div>
      <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-accent/50">
        {node.data?.type || 'table'}
      </Badge>
    </div>
  </div>
))

DependencyItem.displayName = 'DependencyItem'

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

  const config = riskConfig[impact.riskLevel]

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
      <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl",
            config.bgColor, "border", config.borderColor
          )}>
            <AlertTriangle className={cn("h-5 w-5", config.textColor)} />
          </div>
          <div>
            <h3 className="text-base font-semibold">Impact Analysis</h3>
            <p className="text-xs text-muted-foreground font-mono">{selectedNode.tableName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs rounded-lg hover:bg-accent transition-colors"
            onClick={exportImpactReport}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Report
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
      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="p-5 space-y-5">
          {/* Risk Overview - Large Card */}
          <Card className={cn(
            "overflow-hidden border",
            config.borderColor
          )}>
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-40",
              config.gradient
            )} />
            <CardContent className="relative p-6">
              <div className="flex items-center gap-8">
                {/* Circular Progress */}
                <CircularProgress value={impact.riskScore} riskLevel={impact.riskLevel} />

                {/* Risk Details */}
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Risk Assessment</p>
                    <div className="flex items-center gap-3">
                      <Badge className={cn(
                        "text-base font-bold px-4 py-1.5 border-0",
                        config.badgeBg, config.badgeText
                      )}>
                        {impact.riskLevel.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {impact.totalAffected} downstream {impact.totalAffected === 1 ? 'table' : 'tables'} affected
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-muted-foreground">Impact Score</span>
                      <span className={cn("font-semibold", config.textColor)}>{impact.riskScore}%</span>
                    </div>
                    <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          config.progressColor
                        )}
                        style={{ width: `${impact.riskScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <RiskMetricCard
              type="risk"
              label="Risk Level"
              value={impact.riskLevel.toUpperCase()}
              riskLevel={impact.riskLevel}
              showBadge
            />
            <RiskMetricCard
              type="score"
              label="Risk Score"
              value={impact.riskScore}
              subValue="out of 100"
              riskLevel={impact.riskLevel}
            />
            <RiskMetricCard
              type="impact"
              label="Total Impact"
              value={impact.totalAffected}
              subValue={impact.totalAffected === 1 ? 'table' : 'tables'}
              riskLevel={impact.riskLevel}
            />
            <RiskMetricCard
              type="chain"
              label="Longest Chain"
              value={impact.longestChain}
              subValue={impact.longestChain === 1 ? 'level' : 'levels'}
              riskLevel={impact.riskLevel}
            />
          </div>

          {/* Dependencies Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Direct Dependencies */}
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border-b border-red-500/20">
                  <Database className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-medium">Direct Dependencies</span>
                  <Badge variant="outline" className="ml-auto text-xs bg-red-500/10 border-red-500/30 text-red-400">
                    {impact.directDownstream.length}
                  </Badge>
                </div>
                <div className="p-2 max-h-[200px] overflow-auto scrollbar-thin">
                  {impact.directDownstream.length > 0 ? (
                    <div className="space-y-1">
                      {impact.directDownstream.map((node) => (
                        <DependencyItem key={node.id} node={node} type="direct" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-20 text-muted-foreground">
                      <Shield className="h-6 w-6 mb-2 opacity-40" />
                      <p className="text-xs">No direct dependencies</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Indirect Dependencies */}
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 px-4 py-3 bg-orange-500/10 border-b border-orange-500/20">
                  <GitBranch className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-medium">Indirect Dependencies</span>
                  <Badge variant="outline" className="ml-auto text-xs bg-orange-500/10 border-orange-500/30 text-orange-400">
                    {impact.indirectDownstream.length}
                  </Badge>
                </div>
                <div className="p-2 max-h-[200px] overflow-auto scrollbar-thin">
                  {impact.indirectDownstream.length > 0 ? (
                    <div className="space-y-1">
                      {impact.indirectDownstream.map((node) => (
                        <DependencyItem key={node.id} node={node} type="indirect" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-20 text-muted-foreground">
                      <Shield className="h-6 w-6 mb-2 opacity-40" />
                      <p className="text-xs">No indirect dependencies</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className={cn(
            "overflow-hidden border",
            config.borderColor
          )}>
            <CardContent className="p-0">
              <div className={cn(
                "flex items-center gap-2 px-4 py-3 border-b",
                config.bgColor, config.borderColor
              )}>
                <Zap className={cn("h-4 w-4", config.textColor)} />
                <span className="text-sm font-medium">Recommended Actions</span>
              </div>
              <div className="p-4 space-y-3">
                {impact.riskLevel === 'critical' && (
                  <>
                    <RecommendationItem
                      text="Extensive testing required before changes"
                      severity="critical"
                    />
                    <RecommendationItem
                      text="Consider gradual rollout strategy"
                      severity="critical"
                    />
                    <RecommendationItem
                      text={`Notify all ${impact.totalAffected} downstream table owners`}
                      severity="critical"
                    />
                  </>
                )}

                {impact.riskLevel === 'high' && (
                  <>
                    <RecommendationItem
                      text="Thorough testing recommended"
                      severity="high"
                    />
                    <RecommendationItem
                      text={`Review all ${impact.totalAffected} affected pipelines`}
                      severity="high"
                    />
                    <RecommendationItem
                      text="Coordinate with downstream owners"
                      severity="high"
                    />
                  </>
                )}

                {impact.riskLevel === 'medium' && (
                  <>
                    <RecommendationItem
                      text="Standard testing recommended"
                      severity="medium"
                    />
                    <RecommendationItem
                      text="Monitor downstream tables after changes"
                      severity="medium"
                    />
                  </>
                )}

                {impact.riskLevel === 'low' && (
                  <>
                    <RecommendationItem
                      text="Minimal downstream impact"
                      severity="low"
                    />
                    <RecommendationItem
                      text="Standard testing sufficient"
                      severity="low"
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
})

// Recommendation Item Component
const RecommendationItem = memo(({
  text,
  severity
}: {
  text: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}) => {
  const config = riskConfig[severity]

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
      <ArrowRight className={cn("h-4 w-4 flex-shrink-0", config.textColor)} />
      <span className="text-sm">{text}</span>
    </div>
  )
})

RecommendationItem.displayName = 'RecommendationItem'

ImpactAnalysis.displayName = 'ImpactAnalysis'

export default ImpactAnalysis
