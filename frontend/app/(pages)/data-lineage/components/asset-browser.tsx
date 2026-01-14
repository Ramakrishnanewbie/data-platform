"use client"

import { useState, useMemo, memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronDown, Database, Table2, Eye, GitBranch, Search, Filter, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface Asset {
  name: string
  type: 'table' | 'view' | 'materialized_view' | 'external'
  rowCount?: number
  sizeBytes?: number
  lastModified?: string
  description?: string
}

interface Dataset {
  name: string
  location: string
  assets: Asset[]
}

interface Project {
  id: string
  name: string
  datasets: Dataset[]
}

interface AssetBrowserProps {
  onAssetSelect?: (projectId: string, datasetId: string, assetName: string, assetType: string) => void
  selectedAsset?: {
    projectId: string
    datasetId: string
    assetName: string
  }
}

async function fetchAssets() {
  const response = await fetch('/api/bigquery/assets')
  if (!response.ok) throw new Error('Failed to fetch assets')
  const data = await response.json()
  return data.projects || []
}

// Memoized Asset Item Component
const AssetItem = memo(({ 
  asset, 
  projectId, 
  datasetName, 
  isSelected, 
  onSelect 
}: { 
  asset: Asset
  projectId: string
  datasetName: string
  isSelected: boolean
  onSelect: () => void
}) => {
  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'table':
        return <Table2 className="h-4 w-4 text-blue-500" />
      case 'view':
        return <Eye className="h-4 w-4 text-purple-500" />
      case 'materialized_view':
        return <Database className="h-4 w-4 text-green-500" />
      default:
        return <Table2 className="h-4 w-4 text-gray-500" />
    }
  }

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const gb = bytes / (1024 ** 3)
    if (gb < 1) return `${(bytes / (1024 ** 2)).toFixed(2)} MB`
    return `${gb.toFixed(2)} GB`
  }

  const formatNumber = (num?: number) => {
    if (!num) return 'N/A'
    return num.toLocaleString()
  }

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all ${
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-accent'
      }`}
      onClick={onSelect}
    >
      {getAssetIcon(asset.type)}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {asset.name}
          </span>
          <Badge variant={isSelected ? "secondary" : "outline"} className="text-xs">
            {asset.type}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span>{formatNumber(asset.rowCount)} rows</span>
          <span>{formatBytes(asset.sizeBytes)}</span>
        </div>
      </div>
    </div>
  )
})

AssetItem.displayName = 'AssetItem'

export default function AssetBrowser({ onAssetSelect, selectedAsset }: AssetBrowserProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [expandedDatasets, setExpandedDatasets] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const { data: projects = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['bigquery-assets'],
    queryFn: fetchAssets,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  // Memoize filtered projects to avoid re-computation
  const filteredProjects = useMemo(() => {
    if (!searchQuery && typeFilter === 'all') return projects

    return projects.map((project: Project) => ({
      ...project,
      datasets: project.datasets
        .map(dataset => ({
          ...dataset,
          assets: dataset.assets.filter(asset => {
            const matchesSearch = searchQuery === '' || 
              asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              project.id.toLowerCase().includes(searchQuery.toLowerCase())
            
            const matchesType = typeFilter === 'all' || asset.type === typeFilter
            
            return matchesSearch && matchesType
          })
        }))
        .filter(dataset => dataset.assets.length > 0)
    })).filter((project: Project) => project.datasets.length > 0)
  }, [projects, searchQuery, typeFilter])

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(projectId)) {
        newExpanded.delete(projectId)
      } else {
        newExpanded.add(projectId)
      }
      return newExpanded
    })
  }

  const toggleDataset = (datasetKey: string) => {
    setExpandedDatasets(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(datasetKey)) {
        newExpanded.delete(datasetKey)
      } else {
        newExpanded.add(datasetKey)
      }
      return newExpanded
    })
  }

  const isAssetSelected = (projectId: string, datasetId: string, assetName: string) => {
    return selectedAsset?.projectId === projectId &&
           selectedAsset?.datasetId === datasetId &&
           selectedAsset?.assetName === assetName
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive text-sm">Failed to load assets</p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <Filter className="h-3 w-3 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="table">Tables</SelectItem>
            <SelectItem value="view">Views</SelectItem>
            <SelectItem value="materialized_view">Mat. Views</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-[600px] rounded-md border">
        <div className="p-3 space-y-1">
          {filteredProjects.map((project: Project) => (
            <div key={project.id} className="space-y-1">
              <div
                className="flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                onClick={() => toggleProject(project.id)}
              >
                {expandedProjects.has(project.id) ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                <Database className="h-3 w-3 text-orange-500" />
                <span className="font-medium text-sm truncate">{project.name}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {project.datasets.length}
                </Badge>
              </div>

              {expandedProjects.has(project.id) && (
                <div className="ml-4 space-y-1">
                  {project.datasets.map((dataset: Dataset) => {
                    const datasetKey = `${project.id}.${dataset.name}`

                    return (
                      <div key={datasetKey} className="space-y-1">
                        <div
                          className="flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                          onClick={() => toggleDataset(datasetKey)}
                        >
                          {expandedDatasets.has(datasetKey) ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                          <Database className="h-3 w-3 text-blue-500" />
                          <span className="text-sm truncate">{dataset.name}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {dataset.location}
                          </Badge>
                        </div>

                        {expandedDatasets.has(datasetKey) && (
                          <div className="ml-4 space-y-0.5">
                            {dataset.assets.map((asset) => (
                              <AssetItem
                                key={asset.name}
                                asset={asset}
                                projectId={project.id}
                                datasetName={dataset.name}
                                isSelected={isAssetSelected(project.id, dataset.name, asset.name)}
                                onSelect={() => onAssetSelect?.(project.id, dataset.name, asset.name, asset.type)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}