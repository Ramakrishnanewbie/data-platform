"use client"

import { useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Save,
  Share2,
  MoreHorizontal,
  Download,
  Copy,
  Trash2,
  AlertTriangle,
  Pencil,
  Check,
  X,
  Play,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import { NotebookEditor } from "../components/notebook/notebook-editor"
import {
  fetchExploration,
  updateExploration,
  deleteExploration,
  duplicateExploration,
  exportExploration,
} from "@/lib/explorations/api"
import type { Exploration } from "@/lib/explorations/types"

export default function ExplorationPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()

  const explorationId = params.id as string
  // TODO: Replace with actual user authentication when Clerk is configured
  const userId = "default-user"

  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState("")

  const { data: exploration, isLoading, isError, refetch } = useQuery({
    queryKey: ["exploration", explorationId, userId],
    queryFn: () => fetchExploration(explorationId, userId),
    enabled: !!explorationId,
    staleTime: 0, // Always fetch fresh data
  })

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      updateExploration(explorationId, userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exploration", explorationId] })
      toast.success("Exploration updated")
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteExploration(explorationId, userId),
    onSuccess: () => {
      toast.success("Exploration deleted")
      router.push("/explorations")
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`)
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: () => duplicateExploration(explorationId, userId),
    onSuccess: (newExploration) => {
      toast.success("Exploration duplicated")
      router.push(`/explorations/${newExploration.id}`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to duplicate: ${error.message}`)
    },
  })

  const handleStartEditName = useCallback(() => {
    if (exploration) {
      setEditedName(exploration.name)
      setIsEditingName(true)
    }
  }, [exploration])

  const handleSaveName = useCallback(() => {
    if (editedName.trim() && editedName !== exploration?.name) {
      updateMutation.mutate({ name: editedName.trim() })
    }
    setIsEditingName(false)
  }, [editedName, exploration?.name, updateMutation])

  const handleCancelEditName = useCallback(() => {
    setIsEditingName(false)
    setEditedName("")
  }, [])

  const handleDelete = useCallback(() => {
    if (confirm("Delete this exploration? This cannot be undone.")) {
      deleteMutation.mutate()
    }
  }, [deleteMutation])

  const handleExport = useCallback(
    async (format: "json" | "html") => {
      try {
        const blob = await exportExploration(explorationId, userId, format)
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${exploration?.name || "exploration"}.${format}`
        a.click()
        URL.revokeObjectURL(url)
        toast.success(`Exported as ${format.toUpperCase()}`)
      } catch (error) {
        toast.error("Failed to export")
      }
    },
    [explorationId, userId, exploration?.name]
  )

  if (isLoading) {
    return (
      <ContentLayout title="Loading...">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ContentLayout>
    )
  }

  if (isError || !exploration) {
    return (
      <ContentLayout title="Error">
        <Card className="border-destructive/50">
          <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="p-4 rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-destructive font-medium">Failed to load exploration</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/explorations")}>
                Go Back
              </Button>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </ContentLayout>
    )
  }

  return (
    <ContentLayout title={exploration.name}>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/explorations")}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName()
                    if (e.key === "Escape") handleCancelEditName()
                  }}
                  className="h-9 w-64"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSaveName}
                  className="h-8 w-8"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancelEditName}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{exploration.name}</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleStartEditName}
                  className="h-7 w-7"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* Tags */}
            {exploration.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {exploration.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {exploration.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{exploration.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Run all */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => toast.info("Use Ctrl/Cmd + Enter to run all cells")}
            >
              <Play className="h-4 w-4" />
              Run All
            </Button>

            {/* Share */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => toast.info("Share dialog coming soon")}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>

            {/* More actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => duplicateMutation.mutate()}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport("json")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("html")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as HTML
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Description */}
        {exploration.description && (
          <p className="text-sm text-muted-foreground max-w-3xl">
            {exploration.description}
          </p>
        )}

        {/* Notebook Editor */}
        <NotebookEditor
          exploration={exploration}
          userId={userId}
          onExplorationUpdate={() => refetch()}
        />
      </div>
    </ContentLayout>
  )
}
