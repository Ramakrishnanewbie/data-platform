"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import debounce from "lodash/debounce"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { SQLCell } from "./sql-cell"
import { MarkdownCell } from "./markdown-cell"
import { VisualizationCell } from "./visualization-cell"
import { AddCellButton } from "./add-cell-button"
import type {
  Exploration,
  ExplorationCell,
  CellContent,
  SQLCellContent,
  MarkdownCellContent,
  VisualizationCellContent,
} from "@/lib/explorations/types"
import {
  createCell,
  updateCell,
  deleteCell,
  reorderCells,
  executeCell,
} from "@/lib/explorations/api"

interface NotebookEditorProps {
  exploration: Exploration
  userId: string
  onExplorationUpdate: () => void
}

interface SortableCellProps {
  cell: ExplorationCell
  children: (props: { dragHandleProps: Record<string, unknown> | undefined }) => React.ReactNode
}

function SortableCell({ cell, children }: SortableCellProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cell.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children({ dragHandleProps: listeners })}
    </div>
  )
}

export function NotebookEditor({
  exploration,
  userId,
  onExplorationUpdate,
}: NotebookEditorProps) {
  const [cells, setCells] = useState<ExplorationCell[]>(exploration.cells || [])
  const [executingCells, setExecutingCells] = useState<Set<string>>(new Set())
  const [pendingChanges, setPendingChanges] = useState<Map<string, CellContent>>(
    new Map()
  )

  // Update cells when exploration changes
  useEffect(() => {
    setCells(exploration.cells || [])
  }, [exploration.cells])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Debounced save function
  const debouncedSave = useMemo(
    () =>
      debounce(async (cellId: string, content: CellContent) => {
        try {
          await updateCell(exploration.id, cellId, userId, { content })
          setPendingChanges((prev) => {
            const next = new Map(prev)
            next.delete(cellId)
            return next
          })
        } catch (error) {
          console.error("Failed to save cell:", error)
          toast.error("Failed to save changes")
        }
      }, 1000),
    [exploration.id, userId]
  )

  // Handle content change
  const handleContentChange = useCallback(
    (cellId: string, content: CellContent) => {
      setCells((prev) =>
        prev.map((c) => (c.id === cellId ? { ...c, content } : c))
      )
      setPendingChanges((prev) => new Map(prev).set(cellId, content))
      debouncedSave(cellId, content)
    },
    [debouncedSave]
  )

  // Handle add cell
  const handleAddCell = useCallback(
    async (
      type: "sql" | "markdown" | "visualization",
      afterIndex?: number
    ) => {
      const orderIndex = afterIndex !== undefined ? afterIndex + 1 : cells.length

      const defaultContent: CellContent =
        type === "sql"
          ? { query: "" }
          : type === "markdown"
          ? { text: "" }
          : { source_cell_id: "", chart_type: "bar", config: {} }

      try {
        const newCell = await createCell(exploration.id, userId, {
          cell_type: type,
          content: defaultContent,
          order_index: orderIndex,
        })

        setCells((prev) => {
          const newCells = [...prev]
          newCells.splice(orderIndex, 0, newCell)
          return newCells.map((c, i) => ({ ...c, order_index: i }))
        })

        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} cell added`)
      } catch (error) {
        console.error("Failed to add cell:", error)
        toast.error("Failed to add cell")
      }
    },
    [exploration.id, userId, cells.length]
  )

  // Handle delete cell
  const handleDeleteCell = useCallback(
    async (cellId: string) => {
      try {
        await deleteCell(exploration.id, cellId, userId)
        setCells((prev) =>
          prev.filter((c) => c.id !== cellId).map((c, i) => ({ ...c, order_index: i }))
        )
        toast.success("Cell deleted")
      } catch (error) {
        console.error("Failed to delete cell:", error)
        toast.error("Failed to delete cell")
      }
    },
    [exploration.id, userId]
  )

  // Handle duplicate cell
  const handleDuplicateCell = useCallback(
    async (cell: ExplorationCell) => {
      try {
        const newCell = await createCell(exploration.id, userId, {
          cell_type: cell.cell_type,
          content: cell.content,
          order_index: cell.order_index + 1,
        })

        setCells((prev) => {
          const newCells = [...prev]
          const index = newCells.findIndex((c) => c.id === cell.id)
          newCells.splice(index + 1, 0, newCell)
          return newCells.map((c, i) => ({ ...c, order_index: i }))
        })

        toast.success("Cell duplicated")
      } catch (error) {
        console.error("Failed to duplicate cell:", error)
        toast.error("Failed to duplicate cell")
      }
    },
    [exploration.id, userId]
  )

  // Handle toggle collapse
  const handleToggleCollapse = useCallback(
    async (cellId: string) => {
      const cell = cells.find((c) => c.id === cellId)
      if (!cell) return

      const newCollapsed = !cell.is_collapsed
      setCells((prev) =>
        prev.map((c) =>
          c.id === cellId ? { ...c, is_collapsed: newCollapsed } : c
        )
      )

      try {
        await updateCell(exploration.id, cellId, userId, {
          is_collapsed: newCollapsed,
        })
      } catch (error) {
        console.error("Failed to update collapse state:", error)
      }
    },
    [exploration.id, userId, cells]
  )

  // Handle execute cell
  const handleExecuteCell = useCallback(
    async (cellId: string) => {
      setExecutingCells((prev) => new Set(prev).add(cellId))

      try {
        const output = await executeCell(exploration.id, cellId, userId)
        setCells((prev) =>
          prev.map((c) =>
            c.id === cellId
              ? {
                  ...c,
                  output,
                  executed_at: new Date().toISOString(),
                  execution_time_ms: output.execution_time_ms ?? null,
                }
              : c
          )
        )

        if (output.error) {
          toast.error("Query failed")
        } else {
          toast.success(
            `Query returned ${output.total_rows || 0} rows${
              output.cached ? " (cached)" : ""
            }`
          )
        }
      } catch (error: any) {
        console.error("Failed to execute cell:", error)
        setCells((prev) =>
          prev.map((c) =>
            c.id === cellId
              ? {
                  ...c,
                  output: {
                    error: error.message || "Execution failed",
                  },
                }
              : c
          )
        )
        toast.error("Failed to execute query")
      } finally {
        setExecutingCells((prev) => {
          const next = new Set(prev)
          next.delete(cellId)
          return next
        })
      }
    },
    [exploration.id, userId]
  )

  // Handle move cell
  const handleMoveCell = useCallback(
    async (cellId: string, direction: "up" | "down") => {
      const index = cells.findIndex((c) => c.id === cellId)
      if (
        (direction === "up" && index === 0) ||
        (direction === "down" && index === cells.length - 1)
      ) {
        return
      }

      const newIndex = direction === "up" ? index - 1 : index + 1
      const newCells = arrayMove(cells, index, newIndex).map((c, i) => ({
        ...c,
        order_index: i,
      }))

      setCells(newCells)

      try {
        await reorderCells(exploration.id, userId, {
          cells: newCells.map((c) => ({
            id: c.id,
            order_index: c.order_index,
          })),
        })
      } catch (error) {
        console.error("Failed to reorder cells:", error)
        toast.error("Failed to reorder cells")
        setCells(cells) // Revert
      }
    },
    [exploration.id, userId, cells]
  )

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event

      if (over && active.id !== over.id) {
        const oldIndex = cells.findIndex((c) => c.id === active.id)
        const newIndex = cells.findIndex((c) => c.id === over.id)

        const newCells = arrayMove(cells, oldIndex, newIndex).map((c, i) => ({
          ...c,
          order_index: i,
        }))

        setCells(newCells)

        try {
          await reorderCells(exploration.id, userId, {
            cells: newCells.map((c) => ({
              id: c.id,
              order_index: c.order_index,
            })),
          })
        } catch (error) {
          console.error("Failed to reorder cells:", error)
          toast.error("Failed to reorder cells")
          setCells(cells) // Revert
        }
      }
    },
    [exploration.id, userId, cells]
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter: Execute all cells
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        cells
          .filter((c) => c.cell_type === "sql")
          .forEach((c) => handleExecuteCell(c.id))
      }
      // Ctrl/Cmd + S: Manual save (flush pending changes)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        debouncedSave.flush()
        toast.success("Saved")
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [cells, handleExecuteCell, debouncedSave])

  const hasPendingChanges = pendingChanges.size > 0

  return (
    <div className="space-y-2">
      {/* Save indicator */}
      {hasPendingChanges && (
        <div className="fixed bottom-4 right-4 bg-muted px-3 py-1.5 rounded-full text-xs text-muted-foreground flex items-center gap-2 z-50">
          <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
          Saving...
        </div>
      )}

      {/* Initial add cell button if empty */}
      {cells.length === 0 && (
        <AddCellButton onAddCell={(type) => handleAddCell(type)} className="opacity-100" />
      )}

      {/* Cells */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={cells.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cells.map((cell, index) => (
            <div key={cell.id}>
              <SortableCell cell={cell}>
                {({ dragHandleProps }) => {
                  if (cell.cell_type === "sql") {
                    return (
                      <SQLCell
                        cell={cell}
                        isExecuting={executingCells.has(cell.id)}
                        onContentChange={(content) =>
                          handleContentChange(cell.id, content)
                        }
                        onExecute={() => handleExecuteCell(cell.id)}
                        onDelete={() => handleDeleteCell(cell.id)}
                        onDuplicate={() => handleDuplicateCell(cell)}
                        onToggleCollapse={() => handleToggleCollapse(cell.id)}
                        onMoveUp={() => handleMoveCell(cell.id, "up")}
                        onMoveDown={() => handleMoveCell(cell.id, "down")}
                        canMoveUp={index > 0}
                        canMoveDown={index < cells.length - 1}
                        dragHandleProps={dragHandleProps}
                      />
                    )
                  }

                  if (cell.cell_type === "markdown") {
                    return (
                      <MarkdownCell
                        cell={cell}
                        onContentChange={(content) =>
                          handleContentChange(cell.id, content)
                        }
                        onDelete={() => handleDeleteCell(cell.id)}
                        onDuplicate={() => handleDuplicateCell(cell)}
                        onToggleCollapse={() => handleToggleCollapse(cell.id)}
                        onMoveUp={() => handleMoveCell(cell.id, "up")}
                        onMoveDown={() => handleMoveCell(cell.id, "down")}
                        canMoveUp={index > 0}
                        canMoveDown={index < cells.length - 1}
                        dragHandleProps={dragHandleProps}
                      />
                    )
                  }

                  if (cell.cell_type === "visualization") {
                    // Get available SQL cells as sources
                    const availableSources = cells
                      .filter((c) => c.cell_type === "sql" && c.output?.schema && !c.output?.error)
                      .map((c, i) => ({
                        id: c.id,
                        name: `SQL Cell ${i + 1}`,
                        output: c.output,
                      }))

                    return (
                      <VisualizationCell
                        cell={cell}
                        availableSources={availableSources}
                        onContentChange={(content) =>
                          handleContentChange(cell.id, content)
                        }
                        onDelete={() => handleDeleteCell(cell.id)}
                        onDuplicate={() => handleDuplicateCell(cell)}
                        onToggleCollapse={() => handleToggleCollapse(cell.id)}
                        onMoveUp={() => handleMoveCell(cell.id, "up")}
                        onMoveDown={() => handleMoveCell(cell.id, "down")}
                        canMoveUp={index > 0}
                        canMoveDown={index < cells.length - 1}
                        dragHandleProps={dragHandleProps}
                      />
                    )
                  }

                  // Unknown cell type fallback
                  return (
                    <div className="p-4 border rounded-lg bg-muted/50 text-muted-foreground text-center">
                      Unknown cell type: {cell.cell_type}
                    </div>
                  )
                }}
              </SortableCell>

              {/* Add cell button between cells */}
              <AddCellButton onAddCell={(type) => handleAddCell(type, index)} />
            </div>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}
