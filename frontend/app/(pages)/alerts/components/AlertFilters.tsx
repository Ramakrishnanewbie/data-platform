"use client"

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  GitBranch,
  DollarSign,
  Clock,
  Database,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AlertSeverity, AlertStatus, AlertType } from '@/lib/alerts/types'

interface AlertFiltersProps {
  search: string
  onSearchChange: (search: string) => void
  selectedSeverities: AlertSeverity[]
  onSeverityChange: (severities: AlertSeverity[]) => void
  selectedStatuses: AlertStatus[]
  onStatusChange: (statuses: AlertStatus[]) => void
  selectedTypes: AlertType[]
  onTypeChange: (types: AlertType[]) => void
  onClearFilters: () => void
}

const severities: { value: AlertSeverity; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: 'text-red-400' },
  { value: 'high', label: 'High', color: 'text-orange-400' },
  { value: 'medium', label: 'Medium', color: 'text-amber-400' },
  { value: 'low', label: 'Low', color: 'text-blue-400' },
  { value: 'info', label: 'Info', color: 'text-slate-400' },
]

const statuses: { value: AlertStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: 'text-red-400' },
  { value: 'acknowledged', label: 'Acknowledged', color: 'text-amber-400' },
  { value: 'resolved', label: 'Resolved', color: 'text-emerald-400' },
  { value: 'snoozed', label: 'Snoozed', color: 'text-slate-400' },
]

const types: { value: AlertType; label: string; icon: React.ElementType }[] = [
  { value: 'pipeline_failure', label: 'Pipeline Failure', icon: GitBranch },
  { value: 'cost_anomaly', label: 'Cost Anomaly', icon: DollarSign },
  { value: 'data_freshness', label: 'Data Freshness', icon: Clock },
  { value: 'schema_change', label: 'Schema Change', icon: Database },
]

export const AlertFilters = memo(function AlertFilters({
  search,
  onSearchChange,
  selectedSeverities,
  onSeverityChange,
  selectedStatuses,
  onStatusChange,
  selectedTypes,
  onTypeChange,
  onClearFilters,
}: AlertFiltersProps) {
  const hasFilters = selectedSeverities.length > 0 || selectedStatuses.length > 0 || selectedTypes.length > 0 || search

  const toggleSeverity = (severity: AlertSeverity) => {
    if (selectedSeverities.includes(severity)) {
      onSeverityChange(selectedSeverities.filter(s => s !== severity))
    } else {
      onSeverityChange([...selectedSeverities, severity])
    }
  }

  const toggleStatus = (status: AlertStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter(s => s !== status))
    } else {
      onStatusChange([...selectedStatuses, status])
    }
  }

  const toggleType = (type: AlertType) => {
    if (selectedTypes.includes(type)) {
      onTypeChange(selectedTypes.filter(t => t !== type))
    } else {
      onTypeChange([...selectedTypes, type])
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "pl-10 h-10 rounded-xl",
              "bg-accent/30 border-border/50",
              "focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
              "transition-all duration-200"
            )}
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Severity Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-10 px-3 rounded-xl gap-2",
                selectedSeverities.length > 0 && "border-primary/50 bg-primary/5"
              )}
            >
              <AlertTriangle className="h-4 w-4" />
              Severity
              {selectedSeverities.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {selectedSeverities.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Filter by Severity</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {severities.map((severity) => (
              <DropdownMenuCheckboxItem
                key={severity.value}
                checked={selectedSeverities.includes(severity.value)}
                onCheckedChange={() => toggleSeverity(severity.value)}
              >
                <span className={severity.color}>{severity.label}</span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-10 px-3 rounded-xl gap-2",
                selectedStatuses.length > 0 && "border-primary/50 bg-primary/5"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Status
              {selectedStatuses.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {selectedStatuses.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statuses.map((status) => (
              <DropdownMenuCheckboxItem
                key={status.value}
                checked={selectedStatuses.includes(status.value)}
                onCheckedChange={() => toggleStatus(status.value)}
              >
                <span className={status.color}>{status.label}</span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-10 px-3 rounded-xl gap-2",
                selectedTypes.length > 0 && "border-primary/50 bg-primary/5"
              )}
            >
              <Filter className="h-4 w-4" />
              Type
              {selectedTypes.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {selectedTypes.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {types.map((type) => (
              <DropdownMenuCheckboxItem
                key={type.value}
                checked={selectedTypes.includes(type.value)}
                onCheckedChange={() => toggleType(type.value)}
              >
                <type.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                {type.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-10 px-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Tags */}
      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {selectedSeverities.map((severity) => {
            const config = severities.find(s => s.value === severity)
            return (
              <Badge
                key={severity}
                variant="secondary"
                className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20"
                onClick={() => toggleSeverity(severity)}
              >
                <span className={config?.color}>{config?.label}</span>
                <X className="h-3 w-3" />
              </Badge>
            )
          })}
          {selectedStatuses.map((status) => {
            const config = statuses.find(s => s.value === status)
            return (
              <Badge
                key={status}
                variant="secondary"
                className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20"
                onClick={() => toggleStatus(status)}
              >
                <span className={config?.color}>{config?.label}</span>
                <X className="h-3 w-3" />
              </Badge>
            )
          })}
          {selectedTypes.map((type) => {
            const config = types.find(t => t.value === type)
            return (
              <Badge
                key={type}
                variant="secondary"
                className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20"
                onClick={() => toggleType(type)}
              >
                {config?.label}
                <X className="h-3 w-3" />
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
})
