"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, FileCode2, FileText, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AddCellButtonProps {
  onAddCell: (type: "sql" | "markdown" | "visualization") => void
  className?: string
}

export function AddCellButton({ onAddCell, className }: AddCellButtonProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center py-2 opacity-0 hover:opacity-100 transition-opacity group",
        className
      )}
    >
      <div className="flex-1 h-px bg-border/50 group-hover:bg-border transition-colors" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="mx-4 gap-2 h-8 px-3 bg-background"
          >
            <Plus className="h-4 w-4" />
            Add Cell
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={() => onAddCell("sql")}>
            <FileCode2 className="h-4 w-4 mr-2" />
            SQL Query
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddCell("markdown")}>
            <FileText className="h-4 w-4 mr-2" />
            Markdown
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddCell("visualization")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Visualization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex-1 h-px bg-border/50 group-hover:bg-border transition-colors" />
    </div>
  )
}
