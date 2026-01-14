"use client"

import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  AlertCircle, 
  X, 
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock
} from 'lucide-react'

interface RootCauseAnalysisProps {
  projectId: string
  datasetId: string
  tableName: string
  onClose: () => void
  onHighlightPath: (nodeIds: string[]) => void
}

interface SuspiciousNode {
  node: {
    id: string
    data: {
      label: string
      datasetId: string
      type: string
    }
  }
  issues: string[]
  severity: 'critical' | 'warning' | 'info'
  lastModified?: string
  freshness?: string
  numRows?: number
  jobFailures?: Array<{
    jobId: string
    creationTime: string
    errorReason: string
    errorMessage: string
  }>
}

interface RootCauseData {
  suspiciousNodes: SuspiciousNode[]
  analyzedNodes: number
  recommendation: string
  timestamp: string
}

async function fetchRootCause(projectId: string, datasetId: string, tableName: string) {
  const response = await fetch(`/api/bigquery/root-cause/${projectId}/${datasetId}/${tableName}`)
  if (!response.ok) throw new Error('Failed to fetch root cause analysis')
  return response.json()
}

export default function RootCauseAnalysis({ 
  projectId, 
  datasetId, 
  tableName, 
  onClose,
  onHighlightPath 
}: RootCauseAnalysisProps) {
  const { data: analysis, isLoading } = useQuery<RootCauseData>({
    queryKey: ['root-cause', projectId, datasetId, tableName],
    queryFn: () => fetchRootCause(projectId, datasetId, tableName),
    staleTime: 2 * 60 * 1000,
  })
  
  const handleHighlightNode = (node: SuspiciousNode['node']) => {
    const pathIds = [node.id, `${projectId}.${datasetId}.${tableName}`]
    onHighlightPath(pathIds)
  }
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <div>
            <h3 className="text-sm font-semibold">Root Cause Analysis</h3>
            <p className="text-xs text-muted-foreground">{tableName}</p>
          </div>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 p-5 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : analysis ? (
        <ScrollArea className="flex-1 scrollbar-thin">
          <div className="p-5 space-y-4">
            {/* Summary Banner */}
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-sm font-medium mb-1">{analysis.recommendation}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Analyzed {analysis.analyzedNodes} tables</span>
                <span>•</span>
                <span>Found {analysis.suspiciousNodes.length} issues</span>
              </div>
            </div>

            {/* Issues List */}
            {analysis.suspiciousNodes.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Potential Root Causes</h4>

                {analysis.suspiciousNodes.map((item) => (
                  <div 
                    key={item.node.id} 
                    className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer border border-transparent hover:border-orange-500/30"
                    onClick={() => handleHighlightNode(item.node)}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getSeverityIcon(item.severity)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.node.data?.label || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.node.data?.datasetId || ''}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={item.severity === 'critical' ? 'destructive' : 'secondary'}
                        className="text-[10px] shrink-0"
                      >
                        {item.severity}
                      </Badge>
                    </div>

                    {/* Issues */}
                    <div className="space-y-1 mb-2">
                      {item.issues.map((issue, idx) => (
                        <div key={idx} className="flex gap-2 text-xs">
                          <span className="text-orange-500">→</span>
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>

                    {/* Job Failures */}
                    {item.jobFailures && item.jobFailures.length > 0 && (
                      <div className="mt-2 pt-2 border-t space-y-1.5">
                        <p className="text-xs font-medium">Recent Failures:</p>
                        {item.jobFailures.slice(0, 2).map((failure, idx) => (
                          <div key={idx} className="text-xs bg-destructive/10 p-2 rounded">
                            <p className="font-mono text-[10px] text-destructive">{failure.errorReason}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(failure.creationTime).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Metadata */}
                    {item.lastModified && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Modified {new Date(item.lastModified).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm font-semibold mb-1">No Issues Detected</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  All upstream tables appear healthy. Check transformation logic or external factors.
                </p>
              </div>
            )}

            {/* Action Items */}
            {analysis.suspiciousNodes.length > 0 && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs font-semibold mb-2">Next Steps</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex gap-2"><span className="text-muted-foreground">1.</span><span>Investigate flagged tables by severity</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground">2.</span><span>Check recent job runs and query history</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground">3.</span><span>Review schema changes in last 24 hours</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground">4.</span><span>Fix root cause before reprocessing downstream</span></div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">Failed to load analysis</p>
        </div>
      )}
    </div>
  )
}