"use client"

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import {ContentLayout} from '@/components/admin-panel/content-layout'
import ExportMenu from '@/app/(pages)/data-lineage/components/export-menu'
import LineageSummary from '@/app/(pages)/data-lineage/components/lineage-summary'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { GitBranch, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, Target } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

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

type PanelType = 'metadata' | 'impact' | 'edge' | null

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
  
  const [direction, setDirection] = useState<'upstream' | 'downstream' | 'both'>('both')
  const [depth, setDepth] = useState([3])

  const { 
    data: lineageData, 
    isLoading, 
    isError,
    isFetching
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
  })

  const handleAssetSelect = (
    projectId: string,
    datasetId: string,
    assetName: string,
    assetType: string
  ) => {
    setSelectedAsset({ projectId, datasetId, assetName, assetType })
    setActivePanel(null) // Close all panels when switching assets
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

  const handleClosePanel = () => {
    setActivePanel(null)
    setSelectedNode(null)
    setSelectedEdge(null)
  }

  return (
    <ContentLayout title="Data Lineage">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Data Lineage Explorer</h2>
            <p className="text-muted-foreground">
              Visualize dependencies and relationships between your BigQuery assets
            </p>
          </div>
          
          <div className="flex gap-2">
            {selectedAsset && lineageData && (
              <>
                <Button variant="outline" onClick={handleShowImpact}>
                  <Target className="h-4 w-4 mr-2" />
                  Impact Analysis
                </Button>
                <ExportMenu 
                  nodes={lineageData.nodes} 
                  edges={lineageData.edges}
                  selectedAsset={selectedAsset}
                />
              </>
            )}
          </div>
        </div>

        {selectedAsset && lineageData && (
          <LineageSummary 
            nodes={lineageData.nodes}
            edges={lineageData.edges}
            rootNodeId={lineageData.rootNode}
          />
        )}

        {selectedAsset && (
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                <span className="font-medium">Selected Asset:</span>
                <code className="text-sm bg-background px-2 py-1 rounded">
                  {selectedAsset.projectId}.{selectedAsset.datasetId}.{selectedAsset.assetName}
                </code>
                <Badge>{selectedAsset.assetType}</Badge>
                {isFetching && (
                  <Badge variant="outline" className="animate-pulse">
                    Updating...
                  </Badge>
                )}
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Direction:</span>
              <Select value={direction} onValueChange={handleDirectionChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upstream">
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="h-4 w-4" />
                      Upstream
                    </div>
                  </SelectItem>
                  <SelectItem value="downstream">
                    <div className="flex items-center gap-2">
                      <ArrowDownCircle className="h-4 w-4" />
                      Downstream
                    </div>
                  </SelectItem>
                  <SelectItem value="both">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="h-4 w-4" />
                      Both
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            <div className="flex items-center gap-3 min-w-[200px]">
              <span className="text-sm font-medium">Depth:</span>
              <Slider
                value={depth}
                onValueChange={handleDepthChange}
                min={1}
                max={5}
                step={1}
                className="flex-1"
              />
              <Badge variant="outline">{depth[0]} levels</Badge>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-380px)]">
          <div className="col-span-3 border rounded-lg p-4 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <GitBranch className="h-5 w-5" />
              <h3 className="font-semibold">Assets</h3>
            </div>
            <AssetBrowser
              onAssetSelect={handleAssetSelect}
              selectedAsset={selectedAsset ?? undefined}
            />
          </div>

          <div className="col-span-9 border rounded-lg overflow-hidden">
            {!selectedAsset ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <GitBranch className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select an Asset</h3>
                <p className="text-muted-foreground max-w-md">
                  Choose a table, view, or materialized view from the asset browser to visualize its lineage and dependencies
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading lineage graph...</p>
                </div>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-destructive">Failed to load lineage</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
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

        {/* Metadata Panel */}
        {selectedNode && activePanel === 'metadata' && (
          <MetadataPanel
            projectId={selectedNode.projectId}
            datasetId={selectedNode.datasetId}
            tableId={selectedNode.tableName}
            onClose={handleClosePanel}
          />
        )}

        {/* Impact Analysis Panel */}
        {selectedNode && activePanel === 'impact' && lineageData && (
          <ImpactAnalysis
            nodes={lineageData.nodes}
            edges={lineageData.edges}
            selectedNode={selectedNode}
            onClose={handleClosePanel}
          />
        )}

        {/* Edge Details Panel */}
        {selectedEdge && activePanel === 'edge' && (
          <EdgeDetailsPanel
            sourceTable={selectedEdge.sourceTable}
            targetTable={selectedEdge.targetTable}
            onClose={handleClosePanel}
          />
        )}
      </div>
    </ContentLayout>
  )
}