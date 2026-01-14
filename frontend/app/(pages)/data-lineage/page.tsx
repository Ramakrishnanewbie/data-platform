"use client"

import { useState } from 'react'
import {ContentLayout} from '@/components/admin-panel/content-layout'
import AssetBrowser from '@/app/(pages)/data-lineage/components/asset-browser'
import LineageGraph from '@/app/(pages)/data-lineage/components/lineage-graph'
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
import { GitBranch, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, Download } from 'lucide-react'

export default function DataLineagePage() {
  const [selectedAsset, setSelectedAsset] = useState<{
    projectId: string
    datasetId: string
    assetName: string
    assetType: string
  } | null>(null)
  
  const [direction, setDirection] = useState<'upstream' | 'downstream' | 'both'>('both')
  const [depth, setDepth] = useState([3])
  const [lineageData, setLineageData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleAssetSelect = async (
    projectId: string,
    datasetId: string,
    assetName: string,
    assetType: string
  ) => {
    setSelectedAsset({ projectId, datasetId, assetName, assetType })
    
    // Fetch lineage data
    setLoading(true)
    try {
      const response = await fetch(
        `/api/bigquery/lineage/${projectId}/${datasetId}/${assetName}?direction=${direction}&depth=${depth[0]}`
      )
      const data = await response.json()
      setLineageData(data)
    } catch (error) {
      console.error('Error fetching lineage:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDirectionChange = async (newDirection: 'upstream' | 'downstream' | 'both') => {
    setDirection(newDirection)
    if (selectedAsset) {
      await handleAssetSelect(
        selectedAsset.projectId,
        selectedAsset.datasetId,
        selectedAsset.assetName,
        selectedAsset.assetType
      )
    }
  }

  const handleDepthChange = async (newDepth: number[]) => {
    setDepth(newDepth)
    if (selectedAsset) {
      await handleAssetSelect(
        selectedAsset.projectId,
        selectedAsset.datasetId,
        selectedAsset.assetName,
        selectedAsset.assetType
      )
    }
  }

  const handleExportGraph = () => {
    // TODO: Implement export to PNG/SVG
    console.log('Exporting graph...')
  }

  return (
    <ContentLayout title="Data Lineage">
      <div className="space-y-4">
        {/* Header with Controls */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Data Lineage Explorer</h2>
            <p className="text-muted-foreground">
              Visualize dependencies and relationships between your BigQuery assets
            </p>
          </div>
          
          {selectedAsset && (
            <Button variant="outline" onClick={handleExportGraph}>
              <Download className="h-4 w-4 mr-2" />
              Export Graph
            </Button>
          )}
        </div>

        {/* Selected Asset Info & Controls */}
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
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            {/* Direction Control */}
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
            
            {/* Depth Control */}
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

        {/* Main Content Area - Split View */}
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-280px)]">
          {/* Left Sidebar - Asset Browser */}
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

          {/* Right Main Area - Lineage Graph */}
          <div className="col-span-9 border rounded-lg overflow-hidden">
            {!selectedAsset ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <GitBranch className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select an Asset</h3>
                <p className="text-muted-foreground max-w-md">
                  Choose a table, view, or materialized view from the asset browser to visualize its lineage and dependencies
                </p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading lineage graph...</p>
                </div>
              </div>
            ) : lineageData ? (
              <LineageGraph
                nodes={lineageData.nodes}
                edges={lineageData.edges}
                rootNodeId={lineageData.rootNode}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No lineage data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ContentLayout>
  )
}