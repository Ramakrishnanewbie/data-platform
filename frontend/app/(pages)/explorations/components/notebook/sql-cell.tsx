"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Database,
  Copy,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { CellToolbar } from "./cell-toolbar"
import type {
  ExplorationCell,
  SQLCellContent,
  CellOutput,
} from "@/lib/explorations/types"

interface SQLCellProps {
  cell: ExplorationCell
  isExecuting: boolean
  onContentChange: (content: SQLCellContent) => void
  onExecute: () => void
  onDelete: () => void
  onDuplicate: () => void
  onToggleCollapse: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export function SQLCell({
  cell,
  isExecuting,
  onContentChange,
  onExecute,
  onDelete,
  onDuplicate,
  onToggleCollapse,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  dragHandleProps,
}: SQLCellProps) {
  const content = cell.content as SQLCellContent
  const output = cell.output as CellOutput | null
  const [query, setQuery] = useState(content.query || "")
  const [showAllRows, setShowAllRows] = useState(false)

  // Update parent when query changes (debounced in parent)
  useEffect(() => {
    if (query !== content.query) {
      onContentChange({ query })
    }
  }, [query])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Shift+Enter to execute
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault()
        onExecute()
      }
      // Tab for indentation
      if (e.key === "Tab") {
        e.preventDefault()
        const textarea = e.currentTarget
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newValue = query.substring(0, start) + "  " + query.substring(end)
        setQuery(newValue)
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2
        }, 0)
      }
    },
    [query, onExecute]
  )

  const handleCopyQuery = () => {
    navigator.clipboard.writeText(query)
    toast.success("Query copied to clipboard")
  }

  const handleExportCSV = () => {
    if (!output?.rows?.length || !output?.schema) return

    const headers = output.schema.map((s) => s.name).join(",")
    const rows = output.rows
      .map((row) =>
        output.schema!
          .map((s) => {
            const val = row[s.name]
            if (val === null || val === undefined) return ""
            if (typeof val === "string" && val.includes(",")) return `"${val}"`
            return String(val)
          })
          .join(",")
      )
      .join("\n")

    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `query-results-${cell.id.slice(0, 8)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV downloaded")
  }

  const displayRows = showAllRows
    ? output?.rows || []
    : (output?.rows || []).slice(0, 10)

  return (
    <Card
      className={cn(
        "border-border/50 transition-colors",
        isExecuting && "border-primary/50"
      )}
    >
      <CellToolbar
        cellType="sql"
        isCollapsed={cell.is_collapsed}
        isExecuting={isExecuting}
        executionTime={cell.execution_time_ms}
        onRun={onExecute}
        onToggleCollapse={onToggleCollapse}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        dragHandleProps={dragHandleProps}
      />

      {!cell.is_collapsed && (
        <CardContent className="p-0">
          {/* Query Editor */}
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your SQL query here..."
              className={cn(
                "w-full min-h-[120px] p-4 font-mono text-sm bg-background resize-none",
                "focus:outline-none focus:ring-0 border-0",
                "placeholder:text-muted-foreground/50"
              )}
              spellCheck={false}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyQuery}
                className="h-6 px-2 text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
              <span className="text-xs text-muted-foreground">Shift+Enter to run</span>
            </div>
          </div>

          {/* Output Section */}
          {(output || isExecuting) && (
            <div className="border-t border-border/50">
              {isExecuting ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : output?.error ? (
                <div className="p-4">
                  <div className="flex items-start gap-2 text-destructive">
                    <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="font-mono text-sm whitespace-pre-wrap">
                      {output.error}
                    </div>
                  </div>
                </div>
              ) : output?.schema ? (
                <div>
                  {/* Results header */}
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border/50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>
                        {output.total_rows ?? 0} row
                        {output.total_rows !== 1 ? "s" : ""}
                      </span>
                      {output.cached && (
                        <Badge variant="outline" className="text-xs">
                          cached
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportCSV}
                      className="h-7 px-2 text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export CSV
                    </Button>
                  </div>

                  {/* Results table */}
                  {(output.rows?.length ?? 0) > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {output.schema.map((col) => (
                              <TableHead key={col.name} className="font-mono text-xs">
                                {col.name}
                                <span className="ml-1 text-muted-foreground font-normal">
                                  ({col.type})
                                </span>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayRows.map((row, i) => (
                            <TableRow key={i}>
                              {output.schema!.map((col) => (
                                <TableCell key={col.name} className="font-mono text-xs">
                                  {row[col.name] === null ? (
                                    <span className="text-muted-foreground italic">
                                      null
                                    </span>
                                  ) : (
                                    String(row[col.name])
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Show more/less */}
                      {(output.rows?.length ?? 0) > 10 && (
                        <div className="flex justify-center py-2 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAllRows(!showAllRows)}
                            className="text-xs"
                          >
                            {showAllRows ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Show All ({output.rows!.length} rows)
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Query executed successfully with no results
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
