"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  Square,
  Code,
  Save,
  FolderOpen,
  History,
  Download,
  Copy,
  Trash2,
  MoreHorizontal,
  Loader2,
  Clock,
  Keyboard,
} from "lucide-react";
import { format } from "sql-formatter";
import { toast } from "sonner";
import { SaveQueryDialog, SaveQueryData } from "./../../../query-library/components/save-query-dialog";

interface EditorToolbarProps {
  sql: string;
  onSqlChange: (sql: string) => void;
  onExecute: () => void;
  onCancel?: () => void;
  isExecuting?: boolean;
  // For loading saved queries
  onOpenQuery?: () => void;
  onViewHistory?: () => void;
  // Current query context (if editing a saved query)
  currentQuery?: {
    id: string;
    name: string;
    description: string;
    folder_id: string | null;
    visibility: string;
    tags: string[];
  };
}

export function EditorToolbar({
  sql,
  onSqlChange,
  onExecute,
  onCancel,
  isExecuting = false,
  onOpenQuery,
  onViewHistory,
  currentQuery,
}: EditorToolbarProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Format SQL
  const handleFormat = () => {
    try {
      const formatted = format(sql, {
        language: "bigquery",
        tabWidth: 2,
        keywordCase: "upper",
      });
      onSqlChange(formatted);
      toast.success("SQL formatted");
    } catch (err) {
      console.error("Format error:", err);
      toast.error("Failed to format SQL");
    }
  };

  // Copy SQL to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    toast.success("SQL copied to clipboard");
  };

  // Download SQL as file
  const handleDownload = () => {
    const blob = new Blob([sql], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentQuery?.name
      ? `${currentQuery.name.replace(/\s+/g, "_")}.sql`
      : "query.sql";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("SQL file downloaded");
  };

  // Clear editor
  const handleClear = () => {
    if (sql.trim() && !confirm("Clear the editor? This cannot be undone.")) {
      return;
    }
    onSqlChange("");
  };

  // Save query handler
  const handleSaveQuery = async (data: SaveQueryData) => {
    setIsSaving(true);
    try {
      // TODO: Replace with actual API call
      console.log("Saving query:", data);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // If editing existing query
      if (currentQuery) {
        // PATCH /api/queries/:id
        toast.success(`Updated "${data.name}"`);
      } else {
        // POST /api/queries
        toast.success(`Saved "${data.name}"`);
      }
    } catch (error) {
      console.error("Failed to save query:", error);
      toast.error("Failed to save query");
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center justify-between px-3 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Left side - Primary actions */}
        <div className="flex items-center gap-2">
          {/* Run / Cancel */}
          {isExecuting ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={onCancel}
              className="gap-1.5 h-8"
            >
              <Square className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={onExecute}
                  disabled={!sql.trim()}
                  className="gap-1.5 h-8"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Run</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="flex items-center gap-2">
                  <span>Execute query</span>
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">⌘↵</kbd>
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          <div className="w-px h-6 bg-border" />

          {/* Format */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={handleFormat}
                disabled={!sql.trim()}
                className="gap-1.5 h-8"
              >
                <Code className="h-3.5 w-3.5" />
                <span>Format</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Format SQL</TooltipContent>
          </Tooltip>

          {/* Save Query */}
          <SaveQueryDialog
            sql={sql}
            onSave={handleSaveQuery}
            existingQuery={currentQuery}
            trigger={
              <Button
                size="sm"
                variant="outline"
                disabled={!sql.trim()}
                className="gap-1.5 h-8"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{currentQuery ? "Update" : "Save"}</span>
              </Button>
            }
          />
        </div>

        {/* Right side - Secondary actions */}
        <div className="flex items-center gap-2">
          {/* Open saved query */}
          {onOpenQuery && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onOpenQuery}
                  className="gap-1.5 h-8"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Open</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Open saved query</TooltipContent>
            </Tooltip>
          )}

          {/* History */}
          {onViewHistory && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onViewHistory}
                  className="gap-1.5 h-8"
                >
                  <History className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">History</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Query history</TooltipContent>
            </Tooltip>
          )}

          {/* More actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopy} disabled={!sql.trim()}>
                <Copy className="h-4 w-4 mr-2" />
                Copy SQL
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload} disabled={!sql.trim()}>
                <Download className="h-4 w-4 mr-2" />
                Download .sql
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleClear} disabled={!sql.trim()}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Editor
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Keyboard className="h-4 w-4 mr-2" />
                Keyboard Shortcuts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Execution status bar (optional) */}
      {isExecuting && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border-b border-blue-500/20 text-sm text-blue-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Executing query...</span>
        </div>
      )}
    </TooltipProvider>
  );
}