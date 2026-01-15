"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  FolderPlus,
  SlidersHorizontal,
} from "lucide-react";
import { QueryCard, Query } from "./query-card";
import { cn } from "@/lib/utils";

interface QueryListProps {
  queries: Query[];
  title?: string;
  showCreateButton?: boolean;
  onCreateQuery?: () => void;
  onCreateFolder?: () => void;
  onRunQuery?: (query: Query) => void;
  onStarQuery?: (query: Query) => void;
  onForkQuery?: (query: Query) => void;
  onEditQuery?: (query: Query) => void;
  onDeleteQuery?: (query: Query) => void;
  onShareQuery?: (query: Query) => void;
  emptyMessage?: string;
}

type SortOption = "updated" | "created" | "name" | "runs";
type ViewMode = "grid" | "list";

export function QueryList({
  queries,
  title,
  showCreateButton = true,
  onCreateQuery,
  onCreateFolder,
  onRunQuery,
  onStarQuery,
  onForkQuery,
  onEditQuery,
  onDeleteQuery,
  onShareQuery,
  emptyMessage = "No queries found",
}: QueryListProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");

  // Filter and sort queries
  const filteredQueries = useMemo(() => {
    let result = [...queries];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (q) =>
          q.name.toLowerCase().includes(searchLower) ||
          q.description?.toLowerCase().includes(searchLower) ||
          q.sql_content.toLowerCase().includes(searchLower) ||
          q.tags.some((t) => t.toLowerCase().includes(searchLower))
      );
    }

    // Visibility filter
    if (visibilityFilter !== "all") {
      result = result.filter((q) => q.visibility === visibilityFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "updated":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case "created":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "name":
          return a.name.localeCompare(b.name);
        case "runs":
          return b.run_count - a.run_count;
        default:
          return 0;
      }
    });

    return result;
  }, [queries, search, sortBy, visibilityFilter]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        {title && <h1 className="text-2xl font-bold">{title}</h1>}
        
        {showCreateButton && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onCreateFolder}>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button size="sm" onClick={onCreateQuery}>
              <Plus className="h-4 w-4 mr-2" />
              New Query
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search queries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Visibility filter */}
        <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
          <SelectTrigger className="w-[140px]">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="team">Team</SelectItem>
            <SelectItem value="public">Public</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Recently Updated</SelectItem>
            <SelectItem value="created">Recently Created</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="runs">Most Runs</SelectItem>
          </SelectContent>
        </Select>

        {/* View mode toggle */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList className="h-9">
            <TabsTrigger value="grid" className="px-2">
              <LayoutGrid className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="list" className="px-2">
              <List className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredQueries.length} {filteredQueries.length === 1 ? "query" : "queries"}
        {search && ` matching "${search}"`}
      </p>

      {/* Query grid/list */}
      {filteredQueries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">{emptyMessage}</p>
          {showCreateButton && (
            <Button variant="outline" className="mt-4" onClick={onCreateQuery}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first query
            </Button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-3"
          )}
        >
          {filteredQueries.map((query) => (
            <QueryCard
              key={query.id}
              query={query}
              onRun={onRunQuery}
              onStar={onStarQuery}
              onFork={onForkQuery}
              onEdit={onEditQuery}
              onDelete={onDeleteQuery}
              onShare={onShareQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}