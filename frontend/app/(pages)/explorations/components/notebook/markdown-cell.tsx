"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import { CellToolbar } from "./cell-toolbar"
import type { ExplorationCell, MarkdownCellContent } from "@/lib/explorations/types"

interface MarkdownCellProps {
  cell: ExplorationCell
  onContentChange: (content: MarkdownCellContent) => void
  onDelete: () => void
  onDuplicate: () => void
  onToggleCollapse: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export function MarkdownCell({
  cell,
  onContentChange,
  onDelete,
  onDuplicate,
  onToggleCollapse,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  dragHandleProps,
}: MarkdownCellProps) {
  const content = cell.content as MarkdownCellContent
  const [text, setText] = useState(content.text || "")
  const [isEditing, setIsEditing] = useState(!content.text)

  useEffect(() => {
    if (text !== content.text) {
      onContentChange({ text })
    }
  }, [text])

  const handleDoubleClick = () => {
    if (!isEditing) {
      setIsEditing(true)
    }
  }

  const handleBlur = () => {
    if (text.trim()) {
      setIsEditing(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CellToolbar
        cellType="markdown"
        isCollapsed={cell.is_collapsed}
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
          <div className="relative">
            {/* Toggle button */}
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="h-7 px-2 text-xs"
              >
                {isEditing ? (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </>
                ) : (
                  <>
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </>
                )}
              </Button>
            </div>

            {isEditing ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={handleBlur}
                placeholder="Write some markdown here..."
                className={cn(
                  "w-full min-h-[100px] p-4 font-mono text-sm bg-background resize-none",
                  "focus:outline-none focus:ring-0 border-0",
                  "placeholder:text-muted-foreground/50"
                )}
                autoFocus={!content.text}
              />
            ) : (
              <div
                onDoubleClick={handleDoubleClick}
                className="p-4 min-h-[60px] cursor-text prose prose-sm prose-invert max-w-none"
              >
                {text ? (
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold mb-4">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-semibold mb-3">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-medium mb-2">{children}</h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-2 text-foreground">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-2 space-y-1">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-2 space-y-1">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-foreground">{children}</li>
                      ),
                      code: ({ className, children, ...props }) => {
                        const isInline = !className
                        return isInline ? (
                          <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">
                            {children}
                          </code>
                        ) : (
                          <code
                            className="block p-3 bg-muted rounded-md text-sm font-mono overflow-x-auto"
                            {...props}
                          >
                            {children}
                          </code>
                        )
                      },
                      pre: ({ children }) => (
                        <pre className="mb-2">{children}</pre>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-primary/50 pl-4 italic text-muted-foreground mb-2">
                          {children}
                        </blockquote>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {children}
                        </a>
                      ),
                      table: ({ children }) => (
                        <table className="w-full border-collapse mb-2">
                          {children}
                        </table>
                      ),
                      th: ({ children }) => (
                        <th className="border border-border/50 px-3 py-2 bg-muted/50 text-left font-medium">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-border/50 px-3 py-2">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {text}
                  </ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground italic">
                    Double-click to edit markdown
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
