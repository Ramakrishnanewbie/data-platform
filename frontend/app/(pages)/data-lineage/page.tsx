"use client"

import { useState,useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { ContentLayout } from '@/components/admin-panel/content-layout'
import ExportMenu from '@/app/(pages)/data-lineage/components/export-menu'
import LineageSummary from '@/app/(pages)/data-lineage/components/lineage-summary'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { 
  GitBranch, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  ArrowLeftRight, 
  Target, 
  ChevronLeft,
  ChevronRight,
  Maximize2,
  AlertCircle
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const AssetBrowser = dynamic(() => import('@/app/(pages)/data-lineage/components/asset-browser'), {
  loading: () => <AssetBrowserSkeleton />,
  ssr: false,
})

const LineageGraph = dynamic(() => import('@/app/(pages)/data-lineage/components/lineage-graph'), {
  loading: () => <LineageGraphSkeleton />,
  ssr: false,
})

const MetadataPanel = dynamic(() => import('@/app/(pages)/data-lineage/components/metadata-panel'), {
  loading: () => <div>Loading metadata...</div>,
  ssr: false,
})

const ImpactAnalysis = dynamic(() => import('@/app/(pages)/data-lineage/components/impact-analysis'), {
  loading: () => <div>Loading impact analysis...</div>,
  ssr: false,
})

const EdgeDetailsPanel = dynamic(() => import('@/app/(pages)/data-lineage/components/edge-details'), {
  loading: () => <div>Loading edge details...</div>,
  ssr: false,
})

const RootCauseAnalysis = dynamic(() => import('@/app/(pages)/data-lineage/components/RootCauseAnalysis'), {
  loading: () => <div>Loading root cause analysis...</div>,
  ssr: false,
})

function AssetBrowserSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}

function LineageGraphSkeleton() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-4">
        <div className="animate-pulse space-y-2">
          <div className="h-16 w-16 bg-muted rounded-full mx-auto" />
          <div className="h-4 w-32 bg-muted rounded mx-auto" />
        </div>
        <p className="text-muted-foreground">Loading graph...</p>
      </div>
    </div>
  )
}

async function fetchLineage(
  projectId: string,
  datasetId: string,
  assetName: string,
  direction: string,
  depth: number
) {
  const response = await fetch(
    `/api/bigquery/lineage/${projectId}/${datasetId}/${assetName}?direction=${direction}&depth=${depth}`
  )
  if (!response.ok) throw new Error('Failed to fetch lineage')
  return response.json()
}

type PanelType = 'metadata' | 'impact' | 'edge' | 'rootcause' | null

export default function DataLineagePage() {
  const [selectedAsset, setSelectedAsset] = useState<{
    projectId: string
    datasetId: string
    assetName: string
    assetType: string
  } | null>(null)
  
  const [selectedNode, setSelectedNode] = useState<{
    projectId: string
    datasetId: string
    tableName: string
  } | null>(null)

  const [selectedEdge, setSelectedEdge] = useState<{
    sourceTable: string
    targetTable: string
  } | null>(null)

  const [activePanel, setActivePanel] = useState<PanelType>(null)
  const [isBrowserCollapsed, setIsBrowserCollapsed] = useState(false)
  
  const [direction, setDirection] = useState<'upstream' | 'downstream' | 'both'>('both')
  const [depth, setDepth] = useState([3])

  const { 
    data: lineageData, 
    isLoading, 
    isError,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['lineage', selectedAsset?.projectId, selectedAsset?.datasetId, selectedAsset?.assetName, direction, depth[0]],
    queryFn: () => fetchLineage(
      selectedAsset!.projectId,
      selectedAsset!.datasetId,
      selectedAsset!.assetName,
      direction,
      depth[0]
    ),
    enabled: !!selectedAsset,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false, 
    refetchOnWindowFocus: false,  
  })

  useEffect(() => {
    if (selectedAsset) {
      refetch()
    }
  }, [direction, depth, refetch, selectedAsset])

  const handleAssetSelect = (
    projectId: string,
    datasetId: string,
    assetName: string,
    assetType: string
  ) => {
    setSelectedAsset({ projectId, datasetId, assetName, assetType })
    setActivePanel(null)
  }

  const handleDirectionChange = (newDirection: 'upstream' | 'downstream' | 'both') => {
    setDirection(newDirection)
  }

  const handleDepthChange = (newDepth: number[]) => {
    setDepth(newDepth)
  }

  const handleNodeClick = (projectId: string, datasetId: string, tableName: string) => {
    setSelectedNode({ projectId, datasetId, tableName })
    setActivePanel('metadata')
  }

  const handleEdgeClick = (sourceTable: string, targetTable: string) => {
    console.log('🔗 Edge clicked:', sourceTable, '→', targetTable)
    setSelectedEdge({ sourceTable, targetTable })
    setActivePanel('edge')
  }

  const handleShowImpact = () => {
    if (selectedAsset) {
      setSelectedNode({
        projectId: selectedAsset.projectId,
        datasetId: selectedAsset.datasetId,
        tableName: selectedAsset.assetName,
      })
      setActivePanel('impact')
    }
  }

  const handleShowRootCause = () => {
    if (selectedAsset) {
      setSelectedNode({
        projectId: selectedAsset.projectId,
        datasetId: selectedAsset.datasetId,
        tableName: selectedAsset.assetName,
      })
      setActivePanel('rootcause')
    }
  }

  const handleClosePanel = () => {
    setActivePanel(null)
    setSelectedNode(null)
    setSelectedEdge(null)
  }

  const handleHighlightPath = (nodeIds: string[]) => {
    // TODO: Implement graph highlighting
    console.log('Highlight path:', nodeIds)
  }

  return (
    <ContentLayout title="Data Lineage">
      <div className="relative h-[calc(100vh-120px)] flex flex-col">
        {/* Compact Header */}
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-3">
            <GitBranch className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold">Data Lineage Explorer</h2>
              <p className="text-xs text-muted-foreground">Visualize BigQuery dependencies</p>
            </div>
          </div>
          
          {selectedAsset && lineageData && (
            <div className="flex items-center gap-2">
              <LineageSummary 
                nodes={lineageData.nodes}
                edges={lineageData.edges}
                rootNodeId={lineageData.rootNode}
              />
              <Button variant="outline" size="sm" onClick={handleShowRootCause}>
                <AlertCircle className="h-4 w-4 mr-2" />
                Root Cause
              </Button>
              <Button variant="outline" size="sm" onClick={handleShowImpact}>
                <Target className="h-4 w-4 mr-2" />
                Impact
              </Button>
              <ExportMenu 
                nodes={lineageData.nodes} 
                edges={lineageData.edges}
                selectedAsset={selectedAsset}
              />
            </div>
          )}
        </div>

        {/* Main Canvas Area */}
        <div className="relative flex-1 flex overflow-hidden mt-3">
          {/* Collapsible Asset Browser */}
          <div 
            className={cn(
              "relative bg-background border-r transition-all duration-300 ease-in-out",
              isBrowserCollapsed ? "w-0" : "w-80"
            )}
          >
            <div className={cn(
              "h-full overflow-hidden",
              isBrowserCollapsed && "opacity-0"
            )}>
              <div className="p-4 h-full overflow-y-auto">
                <div className="flex items-center gap-2 mb-4">
                  <GitBranch className="h-4 w-4" />
                  <h3 className="font-medium text-sm">Assets</h3>
                </div>
                <AssetBrowser
                  onAssetSelect={handleAssetSelect}
                  selectedAsset={selectedAsset ?? undefined}
                />
              </div>
            </div>
            
            {/* Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-3 top-4 h-6 w-6 rounded-full border bg-background shadow-sm z-10"
              onClick={() => setIsBrowserCollapsed(!isBrowserCollapsed)}
            >
              {isBrowserCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronLeft className="h-3 w-3" />
              )}
            </Button>
          </div>

          {/* Graph Canvas */}
          <div className="relative flex-1 bg-muted/20">
            {/* Floating Controls - Top Right */}
            {selectedAsset && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border rounded-lg p-2 shadow-lg">
                {isFetching && (
                  <Badge variant="outline" className="animate-pulse">
                    Updating...
                  </Badge>
                )}
                
                <div className="flex items-center gap-2 border-r pr-2">
                  <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <Select value={direction} onValueChange={handleDirectionChange}>
                    <SelectTrigger className="h-8 w-[120px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upstream">
                        <div className="flex items-center gap-2">
                          <ArrowUpCircle className="h-3.5 w-3.5" />
                          <span className="text-xs">Upstream</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="downstream">
                        <div className="flex items-center gap-2">
                          <ArrowDownCircle className="h-3.5 w-3.5" />
                          <span className="text-xs">Downstream</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="both">
                        <div className="flex items-center gap-2">
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                          <span className="text-xs">Both</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2 min-w-[140px]">
                  <span className="text-xs text-muted-foreground">Depth:</span>
                  <Slider
                    value={depth}
                    onValueChange={handleDepthChange}
                    min={1}
                    max={5}
                    step={1}
                    className="w-20"
                  />
                  <Badge variant="secondary" className="text-xs px-1.5">{depth[0]}</Badge>
                </div>
              </div>
            )}

            {/* Selected Asset Badge - Top Left */}
            {selectedAsset && (
              <div className="absolute top-3 left-3 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border rounded-lg p-2 shadow-lg max-w-xl">
                <div className="flex items-center gap-2">
                  <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <code className="text-xs font-mono">
                    {selectedAsset.projectId}.{selectedAsset.datasetId}.{selectedAsset.assetName}
                  </code>
                  <Badge variant="secondary" className="text-xs">{selectedAsset.assetType}</Badge>
                </div>
              </div>
            )}

            {/* Graph Content */}
            <div className="h-full w-full">
              {!selectedAsset ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <GitBranch className="h-16 w-16 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select an Asset</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Choose a table, view, or materialized view from the asset browser to visualize its lineage and dependencies
                  </p>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">Loading lineage graph...</p>
                  </div>
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <p className="text-sm text-destructive">Failed to load lineage</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              ) : lineageData ? (
                <LineageGraph
                  nodes={lineageData.nodes}
                  edges={lineageData.edges}
                  rootNodeId={lineageData.rootNode}
                  onNodeClick={handleNodeClick}
                  onEdgeClick={handleEdgeClick}
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* Bottom Drawer Panel - Single unified panel */}
        {activePanel && (
          <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-background border-t shadow-2xl z-20 animate-in slide-in-from-bottom duration-300">
            {selectedNode && activePanel === 'metadata' && (
              <MetadataPanel
                projectId={selectedNode.projectId}
                datasetId={selectedNode.datasetId}
                tableId={selectedNode.tableName}
                onClose={handleClosePanel}
              />
            )}

            {selectedNode && activePanel === 'impact' && lineageData && (
              <ImpactAnalysis
                nodes={lineageData.nodes}
                edges={lineageData.edges}
                selectedNode={selectedNode}
                onClose={handleClosePanel}
              />
            )}

            {selectedNode && activePanel === 'rootcause' && lineageData && (
              <RootCauseAnalysis
                projectId={selectedNode.projectId}
                datasetId={selectedNode.datasetId}
                tableName={selectedNode.tableName}
                onClose={handleClosePanel}
                onHighlightPath={handleHighlightPath}
              />
            )}

            {selectedEdge && activePanel === 'edge' && (
              <EdgeDetailsPanel
                sourceTable={selectedEdge.sourceTable}
                targetTable={selectedEdge.targetTable}
                onClose={handleClosePanel}
              />
            )}
          </div>
        )}
      </div>
    </ContentLayout>
  )
}