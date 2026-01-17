"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  Users,
  Filter,
  SortAsc,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import { ExplorationCard } from "./components/exploration-card"
import { CreateExplorationDialog } from "./components/create-dialog"
import {
  fetchExplorations,
  createExploration,
  deleteExploration,
  duplicateExploration,
} from "@/lib/explorations/api"
import type { Exploration, CreateExplorationRequest } from "@/lib/explorations/types"

type SortOption = "updated_at" | "created_at" | "name"

export default function ExplorationsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<"mine" | "shared">("mine")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("updated_at")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // TODO: Replace with actual user authentication when Clerk is configured
  const userId = "default-user"

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["explorations", userId, tab, page, search, sortBy],
    queryFn: () =>
      fetchExplorations({
        userId,
        page,
        limit: 12,
        search: search || undefined,
        includeShared: tab === "shared",
      }),
    staleTime: 30000,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateExplorationRequest) =>
      createExploration(userId, data),
    onSuccess: (newExploration) => {
      queryClient.invalidateQueries({ queryKey: ["explorations"] })
      toast.success("Exploration created")
      router.push(`/explorations/${newExploration.id}`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to create: ${error.message}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExploration(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["explorations"] })
      toast.success("Exploration deleted")
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`)
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => duplicateExploration(id, userId),
    onSuccess: (newExploration) => {
      queryClient.invalidateQueries({ queryKey: ["explorations"] })
      toast.success("Exploration duplicated")
      router.push(`/explorations/${newExploration.id}`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to duplicate: ${error.message}`)
    },
  })

  const handleCreate = useCallback(
    async (data: CreateExplorationRequest) => {
      await createMutation.mutateAsync(data)
    },
    [createMutation]
  )

  const handleOpen = useCallback(
    (exploration: Exploration) => {
      router.push(`/explorations/${exploration.id}`)
    },
    [router]
  )

  const handleDuplicate = useCallback(
    (exploration: Exploration) => {
      duplicateMutation.mutate(exploration.id)
    },
    [duplicateMutation]
  )

  const handleDelete = useCallback(
    (exploration: Exploration) => {
      if (confirm(`Delete "${exploration.name}"? This cannot be undone.`)) {
        deleteMutation.mutate(exploration.id)
      }
    },
    [deleteMutation]
  )

  const handleShare = useCallback((exploration: Exploration) => {
    toast.info("Share dialog coming soon!")
  }, [])

  const handleEdit = useCallback((exploration: Exploration) => {
    toast.info("Edit dialog coming soon!")
  }, [])

  // Sort explorations client-side
  const sortedExplorations = data?.items
    ? [...data.items].sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name)
          case "created_at":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          case "updated_at":
          default:
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        }
      })
    : []

  const totalPages = data ? Math.ceil(data.total / 12) : 1

  return (
    <ContentLayout title="Explorations">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Explorations</h2>
                {data && (
                  <Badge variant="outline" className="text-xs">
                    {data.total} total
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Notebook-style data analysis and exploration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Exploration
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as "mine" | "shared")}>
          <div className="flex items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="mine" className="gap-2">
                <BookOpen className="h-4 w-4" />
                My Explorations
              </TabsTrigger>
              <TabsTrigger value="shared" className="gap-2">
                <Users className="h-4 w-4" />
                Shared with Me
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search explorations..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-9 w-[250px]"
                />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[160px]">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_at">Last Updated</SelectItem>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="mine" className="mt-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex gap-1">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : isError ? (
              <Card className="border-destructive/50">
                <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="p-4 rounded-full bg-destructive/10">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  </div>
                  <p className="text-destructive font-medium">Failed to load explorations</p>
                  <Button variant="outline" onClick={() => refetch()}>
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : sortedExplorations.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">No explorations yet</p>
                    <p className="text-sm text-muted-foreground">
                      {search
                        ? "No explorations match your search"
                        : "Create your first exploration to get started"}
                    </p>
                  </div>
                  {!search && (
                    <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Exploration
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sortedExplorations.map((exploration) => (
                  <ExplorationCard
                    key={exploration.id}
                    exploration={exploration}
                    onOpen={handleOpen}
                    onDuplicate={handleDuplicate}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onShare={handleShare}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shared" className="mt-6">
            <Card className="border-border/50">
              <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="p-4 rounded-full bg-muted">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium">No shared explorations</p>
                  <p className="text-sm text-muted-foreground">
                    Explorations shared with you will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {data && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * 12 + 1} to {Math.min(page * 12, data.total)} of{" "}
              {data.total} explorations
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <CreateExplorationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />
    </ContentLayout>
  )
}
