"use client"

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Database, Table2, Eye, GitBranch, Search, Filter } from 'lucide-react'
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

export default function AssetBrowser({ onAssetSelect, selectedAsset }: AssetBrowserProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [expandedDatasets, setExpandedDatasets] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    fetchAssets()
  }, [])

const fetchAssets = async () => {
  try {
    setLoading(true)
    const response = await fetch('/api/bigquery/assets')
    const data = await response.json()
    
    // FIX: Extract projects array from response
    setProjects(data.projects || [])  // Add fallback to empty array
  } catch (error) {
    console.error('Error fetching assets:', error)
    setProjects([])  // Set empty array on error
  } finally {
    setLoading(false)
  }
}

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  const toggleDataset = (datasetKey: string) => {
    const newExpanded = new Set(expandedDatasets)
    if (newExpanded.has(datasetKey)) {
      newExpanded.delete(datasetKey)
    } else {
      newExpanded.add(datasetKey)
    }
    setExpandedDatasets(newExpanded)
  }

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

  const filterAssets = (asset: Asset, projectId: string, datasetId: string) => {
    const matchesSearch = searchQuery === '' || 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      datasetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projectId.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = typeFilter === 'all' || asset.type === typeFilter
    
    return matchesSearch && matchesType
  }

  const isAssetSelected = (projectId: string, datasetId: string, assetName: string) => {
    return selectedAsset?.projectId === projectId &&
           selectedAsset?.datasetId === datasetId &&
           selectedAsset?.assetName === assetName
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading assets...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects, datasets, or tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="table">Tables</SelectItem>
            <SelectItem value="view">Views</SelectItem>
            <SelectItem value="materialized_view">Materialized Views</SelectItem>
            <SelectItem value="external">External Tables</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Asset Tree */}
      <ScrollArea className="h-[600px] rounded-md border">
        <div className="p-4 space-y-2">
          {projects.map((project) => {
            const hasMatchingAssets = project.datasets.some(dataset =>
              dataset.assets.some(asset => filterAssets(asset, project.id, dataset.name))
            )
            
            if (!hasMatchingAssets && searchQuery) return null

            return (
              <div key={project.id} className="space-y-1">
                {/* Project Level */}
                <div
                  className="flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                  onClick={() => toggleProject(project.id)}
                >
                  {expandedProjects.has(project.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Database className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">{project.name}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {project.datasets.length} datasets
                  </Badge>
                </div>

                {/* Datasets Level */}
                {expandedProjects.has(project.id) && (
                  <div className="ml-6 space-y-1">
                    {project.datasets.map((dataset) => {
                      const matchingAssets = dataset.assets.filter(asset =>
                        filterAssets(asset, project.id, dataset.name)
                      )
                      
                      if (matchingAssets.length === 0 && searchQuery) return null

                      const datasetKey = `${project.id}.${dataset.name}`

                      return (
                        <div key={datasetKey} className="space-y-1">
                          <div
                            className="flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                            onClick={() => toggleDataset(datasetKey)}
                          >
                            {expandedDatasets.has(datasetKey) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <Database className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">{dataset.name}</span>
                            <Badge variant="outline" className="ml-auto text-xs">
                              {dataset.location}
                            </Badge>
                          </div>

                          {/* Assets Level */}
                          {expandedDatasets.has(datasetKey) && (
                            <div className="ml-6 space-y-1">
                              {matchingAssets.map((asset) => {
                                const isSelected = isAssetSelected(project.id, dataset.name, asset.name)
                                
                                return (
                                  <div
                                    key={asset.name}
                                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-accent'
                                    }`}
                                    onClick={() => onAssetSelect?.(project.id, dataset.name, asset.name, asset.type)}
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
                                        {asset.lastModified && (
                                          <span>Modified {new Date(asset.lastModified).toLocaleDateString()}</span>
                                        )}
                                      </div>
                                    </div>
                                    {onAssetSelect && (
                                      <Button
                                        variant={isSelected ? "secondary" : "ghost"}
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onAssetSelect(project.id, dataset.name, asset.name, asset.type)
                                        }}
                                      >
                                        <GitBranch className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}