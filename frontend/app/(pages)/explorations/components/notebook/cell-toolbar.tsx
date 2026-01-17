"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Play,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Copy,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CellToolbarProps {
  cellType: "sql" | "markdown" | "visualization"
  isCollapsed: boolean
  isExecuting?: boolean
  executionTime?: number | null
  onRun?: () => void
  onToggleCollapse: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export function CellToolbar({
  cellType,
  isCollapsed,
  isExecuting,
  executionTime,
  onRun,
  onToggleCollapse,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  dragHandleProps,
}: CellToolbarProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b border-border/50 bg-muted/30">
      {/* Drag handle */}
      <div
        {...dragHandleProps}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Cell type badge */}
      <span className="text-xs font-medium text-muted-foreground uppercase px-2">
        {cellType}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Execution time */}
      {executionTime !== null && executionTime !== undefined && (
        <span className="text-xs text-muted-foreground mr-2">
          {executionTime < 1000
            ? `${executionTime}ms`
            : `${(executionTime / 1000).toFixed(2)}s`}
        </span>
      )}

      {/* Run button (only for SQL cells) */}
      {cellType === "sql" && onRun && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRun}
          disabled={isExecuting}
          className="h-7 px-2 gap-1"
        >
          {isExecuting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          <span className="text-xs">Run</span>
        </Button>
      )}

      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleCollapse}
        className="h-7 w-7"
      >
        {isCollapsed ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </Button>

      {/* More actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onMoveUp} disabled={!canMoveUp}>
            <ArrowUp className="h-4 w-4 mr-2" />
            Move Up
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onMoveDown} disabled={!canMoveDown}>
            <ArrowDown className="h-4 w-4 mr-2" />
            Move Down
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
