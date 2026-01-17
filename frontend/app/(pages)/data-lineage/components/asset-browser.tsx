"use client"

import { useState, useMemo, memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Database, Table2, Eye, Search, Filter, RefreshCw, Layers, HardDrive } from 'lucide-react'
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
import { cn } from '@/lib/utils'

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

// Asset type configuration for consistent styling
const assetTypeConfig = {
  table: {
    icon: Table2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    label: 'Table'
  },
  view: {
    icon: Eye,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    label: 'View'
  },
  materialized_view: {
    icon: Database,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    label: 'Mat. View'
  },
  external: {
    icon: HardDrive,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    label: 'External'
  },
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
  const config = assetTypeConfig[asset.type] || assetTypeConfig.table
  const Icon = config.icon

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const gb = bytes / (1024 ** 3)
    if (gb < 1) return `${(bytes / (1024 ** 2)).toFixed(1)} MB`
    return `${gb.toFixed(1)} GB`
  }

  const formatNumber = (num?: number) => {
    if (!num) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer",
        "transition-all duration-200 ease-out",
        "border border-transparent",
        isSelected
          ? "bg-primary/15 border-primary/40 shadow-[0_0_12px_rgba(var(--primary),0.15)]"
          : "hover:bg-accent/60 hover:border-border/60 hover:shadow-sm hover:-translate-y-0.5"
      )}
      onClick={onSelect}
    >
      {/* Type Icon with Background */}
      <div className={cn(
        "flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg",
        "transition-transform duration-200 group-hover:scale-105",
        config.bgColor, config.borderColor, "border"
      )}>
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            "text-sm font-medium truncate",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {asset.name}
          </span>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Layers className="h-3 w-3 opacity-60" />
            <span className="font-medium">{formatNumber(asset.rowCount)}</span>
            <span className="opacity-60">rows</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <HardDrive className="h-3 w-3 opacity-60" />
            <span className="font-medium">{formatBytes(asset.sizeBytes)}</span>
          </div>
        </div>
      </div>

      {/* Type Badge */}
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] font-medium px-2 py-0.5 transition-colors",
          isSelected
            ? "bg-primary/20 border-primary/40 text-primary"
            : cn(config.bgColor, config.borderColor, config.color)
        )}
      >
        {config.label}
      </Badge>
    </div>
  )
})

AssetItem.displayName = 'AssetItem'

// Expandable Section Header
const SectionHeader = memo(({
  icon: Icon,
  iconColor,
  title,
  count,
  badge,
  isExpanded,
  onClick,
  level = 0
}: {
  icon: React.ElementType
  iconColor: string
  title: string
  count?: number
  badge?: React.ReactNode
  isExpanded: boolean
  onClick: () => void
  level?: number
}) => (
  <div
    className={cn(
      "group flex items-center gap-3 p-3 rounded-lg cursor-pointer",
      "transition-all duration-200 ease-out",
      "hover:bg-accent/60 hover:shadow-sm",
      level > 0 && "ml-2"
    )}
    onClick={onClick}
  >
    {/* Chevron with rotation animation */}
    <div className={cn(
      "flex-shrink-0 transition-transform duration-200",
      isExpanded && "rotate-90"
    )}>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>

    {/* Icon */}
    <div className={cn(
      "flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md",
      "bg-gradient-to-br from-accent to-accent/50",
      "transition-transform duration-200 group-hover:scale-105"
    )}>
      <Icon className={cn("h-3.5 w-3.5", iconColor)} />
    </div>

    {/* Title */}
    <span className="font-medium text-sm truncate flex-1">{title}</span>

    {/* Badge or Count */}
    {badge || (
      count !== undefined && (
        <Badge
          variant="secondary"
          className="text-[10px] font-semibold px-2 py-0.5 bg-accent/80"
        >
          {count}
        </Badge>
      )
    )}
  </div>
))

SectionHeader.displayName = 'SectionHeader'

export default function AssetBrowser({ onAssetSelect, selectedAsset }: AssetBrowserProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [expandedDatasets, setExpandedDatasets] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const { data: projects = [], isLoading, isError, refetch, isFetching } = useQuery({
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
      <div className="space-y-5 p-1">
        <div className="flex gap-3">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-[140px] rounded-xl" />
        </div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <Database className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-destructive text-sm font-medium">Failed to load assets</p>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="hover:shadow-md transition-shadow"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10 h-11 rounded-xl",
              "bg-accent/30 border-border/50",
              "focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
              "transition-all duration-200"
            )}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className={cn(
            "w-[140px] h-11 rounded-xl",
            "bg-accent/30 border-border/50",
            "hover:bg-accent/50 transition-colors"
          )}>
            <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="table">
              <div className="flex items-center gap-2">
                <Table2 className="h-3.5 w-3.5 text-blue-400" />
                Tables
              </div>
            </SelectItem>
            <SelectItem value="view">
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-purple-400" />
                Views
              </div>
            </SelectItem>
            <SelectItem value="materialized_view">
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-emerald-400" />
                Mat. Views
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Asset List */}
      <ScrollArea className="h-[600px] rounded-xl border border-border/50 bg-card/30">
        <div className="p-3 space-y-1">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Search className="h-8 w-8 mb-3 opacity-40" />
              <p className="text-sm">No assets found</p>
              <p className="text-xs opacity-60">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredProjects.map((project: Project) => (
              <div key={project.id} className="space-y-1">
                {/* Project Header */}
                <SectionHeader
                  icon={Database}
                  iconColor="text-orange-400"
                  title={project.name}
                  count={project.datasets.reduce((acc, d) => acc + d.assets.length, 0)}
                  isExpanded={expandedProjects.has(project.id)}
                  onClick={() => toggleProject(project.id)}
                />

                {/* Project Content */}
                <div className={cn(
                  "overflow-hidden transition-all duration-300 ease-out",
                  expandedProjects.has(project.id)
                    ? "max-h-[2000px] opacity-100"
                    : "max-h-0 opacity-0"
                )}>
                  <div className="ml-6 space-y-1 pt-1">
                    {project.datasets.map((dataset: Dataset) => {
                      const datasetKey = `${project.id}.${dataset.name}`

                      return (
                        <div key={datasetKey} className="space-y-1">
                          {/* Dataset Header */}
                          <SectionHeader
                            icon={Database}
                            iconColor="text-blue-400"
                            title={dataset.name}
                            badge={
                              <Badge
                                variant="outline"
                                className="text-[10px] font-medium px-2 py-0.5 bg-accent/50"
                              >
                                {dataset.location}
                              </Badge>
                            }
                            isExpanded={expandedDatasets.has(datasetKey)}
                            onClick={() => toggleDataset(datasetKey)}
                            level={1}
                          />

                          {/* Dataset Assets */}
                          <div className={cn(
                            "overflow-hidden transition-all duration-300 ease-out",
                            expandedDatasets.has(datasetKey)
                              ? "max-h-[2000px] opacity-100"
                              : "max-h-0 opacity-0"
                          )}>
                            <div className="ml-8 space-y-1 pt-1 pb-2">
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
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
