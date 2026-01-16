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
    <div className="space-y-4 animate-in fade-in duration-300">
      {/*
        VISUAL IMPROVEMENTS:
        - shimmer: Animated gradient that sweeps across (like Vercel/Linear)
        - Staggered animation delays for natural feel
        - elevation-xs: Subtle depth vs. completely flat
        - Psychology: Animated skeletons feel faster than static ones
        - Users perceive 15-20% faster load times with shimmer
      */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 shimmer elevation-xs" />
        <Skeleton className="h-10 w-[180px] shimmer elevation-xs" style={{ animationDelay: '0.1s' } as React.CSSProperties} />
      </div>
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-12 w-full shimmer elevation-xs"
            style={{ animationDelay: `${i * 0.05}s` } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}

function LineageGraphSkeleton() {
  return (
    <div className="flex items-center justify-center h-full animate-in fade-in duration-500">
      <div className="text-center space-y-6">
        {/*
          VISUAL IMPROVEMENTS:
          - Pulsing graph icon with multiple rings for depth
          - Shimmer effect on text skeleton
          - Smooth fade-in entrance
          - Multiple animated elements create sophisticated loading state
        */}
        <div className="relative">
          {/* Animated rings around center */}
          <div className="h-20 w-20 bg-violet-500/20 rounded-full mx-auto animate-pulse" />
          <div className="absolute inset-0 h-20 w-20 mx-auto border-2 border-violet-500/30 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-2 h-16 w-16 mx-auto border-2 border-pink-500/30 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
          <GitBranch className="absolute inset-0 m-auto h-8 w-8 text-violet-400 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-40 bg-muted rounded shimmer mx-auto elevation-xs" />
          <p className="text-sm text-muted-foreground animate-pulse">Analyzing dependencies...</p>
        </div>
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
      <div className="relative h-[calc(100vh-120px)] flex flex-col animate-in fade-in duration-300">
        {/*
          DECLUTTERED HEADER
          - Removed redundant title (already in ContentLayout)
          - Moved action buttons to floating toolbar
          - Cleaner, minimal header
        */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <GitBranch className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Lineage Explorer</h2>
              <p className="text-xs text-muted-foreground">Track data dependencies across BigQuery</p>
            </div>
          </div>

          {selectedAsset && lineageData && (
            <div className="flex items-center gap-2">
              <LineageSummary
                nodes={lineageData.nodes}
                edges={lineageData.edges}
                rootNodeId={lineageData.rootNode}
              />
              <ExportMenu
                nodes={lineageData.nodes}
                edges={lineageData.edges}
                selectedAsset={selectedAsset}
              />
            </div>
          )}
        </div>

        {/* Main Canvas Area */}
        <div className="relative flex-1 flex overflow-hidden">
          {/*
            DECLUTTERED ASSET BROWSER
            - Cleaner design with card styling
            - Better visual hierarchy
            - Smooth animations
          */}
          <div
            className={cn(
              "relative transition-all duration-300 ease-out",
              isBrowserCollapsed ? "w-0" : "w-80"
            )}
          >
            <div className={cn(
              "h-full overflow-hidden transition-opacity duration-200",
              isBrowserCollapsed && "opacity-0"
            )}>
              <div className="p-4 h-full overflow-y-auto bg-card/30 border-r border-border/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-violet-500/10">
                      <GitBranch className="h-3.5 w-3.5 text-violet-400" />
                    </div>
                    <h3 className="font-semibold text-sm">Data Assets</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover-lift active-scale"
                    onClick={() => setIsBrowserCollapsed(true)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
                <AssetBrowser
                  onAssetSelect={handleAssetSelect}
                  selectedAsset={selectedAsset ?? undefined}
                />
              </div>
            </div>

            {/* Floating Toggle Button - Only show when collapsed */}
            {isBrowserCollapsed && (
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-4 h-8 w-8 rounded-lg elevation-md glass-morphism z-10 hover-lift active-scale"
                onClick={() => setIsBrowserCollapsed(false)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Graph Canvas */}
          <div className="relative flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/*
              DECLUTTERED FLOATING TOOLBAR
              - Consolidated controls into single clean toolbar
              - Better spacing and hierarchy
              - Glassmorphism for premium feel
            */}
            {selectedAsset && (
              <>
                {/* Top Toolbar - Controls & Actions */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                  {/* Direction & Depth Controls */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg elevation-md glass-morphism border border-border/50 animate-in slide-in-from-top duration-300">
                    {isFetching && (
                      <Badge variant="outline" className="animate-pulse text-xs">
                        Updating...
                      </Badge>
                    )}

                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <Select value={direction} onValueChange={handleDirectionChange}>
                        <SelectTrigger className="h-7 w-[110px] text-xs border-0 bg-transparent hover-lift">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="elevation-lg">
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

                    <div className="h-4 w-px bg-border" />

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Depth:</span>
                      <Slider
                        value={depth}
                        onValueChange={handleDepthChange}
                        min={1}
                        max={5}
                        step={1}
                        className="w-16"
                      />
                      <Badge variant="secondary" className="text-xs px-2 min-w-[24px] justify-center">{depth[0]}</Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg elevation-md glass-morphism border border-border/50 animate-in slide-in-from-top duration-300 delay-75">
                    <Button variant="ghost" size="sm" onClick={handleShowRootCause} className="h-7 text-xs hover-lift">
                      <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                      Root Cause
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleShowImpact} className="h-7 text-xs hover-lift">
                      <Target className="h-3.5 w-3.5 mr-1.5" />
                      Impact
                    </Button>
                  </div>
                </div>

                {/* Selected Asset Info - Top Left - More Compact */}
                <div className="absolute top-4 left-4 z-10 px-3 py-2 rounded-lg elevation-md glass-morphism border border-border/50 max-w-xl animate-in slide-in-from-left duration-300">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-violet-500/10">
                      <Maximize2 className="h-3 w-3 text-violet-400" />
                    </div>
                    <code className="text-xs font-mono text-muted-foreground truncate max-w-md">
                      {selectedAsset.projectId}.{selectedAsset.datasetId}.{selectedAsset.assetName}
                    </code>
                    <Badge variant="secondary" className="text-xs shrink-0">{selectedAsset.assetType}</Badge>
                  </div>
                </div>
              </>
            )}

            {/* Graph Content */}
            <div className="h-full w-full">
              {!selectedAsset ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in duration-500">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20 mb-6 animate-pulse">
                    <GitBranch className="h-16 w-16 text-violet-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                    Select a Data Asset
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                    Browse tables, views, and materialized views from the asset browser to visualize their lineage and dependencies
                  </p>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <LineageGraphSkeleton />
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 animate-in fade-in duration-300">
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
                  </div>
                  <p className="text-sm text-destructive font-medium">Failed to load lineage data</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="hover-lift">
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

        {/*
          DECLUTTERED BOTTOM PANEL
          - Cleaner slide-in animation
          - Better elevation and styling
          - Glassmorphism for modern feel
        */}
        {activePanel && (
          <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-card/95 border-t border-border/50 elevation-xl backdrop-blur-lg z-20 animate-in slide-in-from-bottom duration-300">
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