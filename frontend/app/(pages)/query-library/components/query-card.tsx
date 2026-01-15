"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Star,
  MoreVertical,
  Play,
  Copy,
  Pencil,
  Trash2,
  Share2,
  GitFork,
  Lock,
  Users,
  Globe,
  Clock,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Query {
  id: string;
  name: string;
  description: string | null;
  sql_content: string;
  visibility: "private" | "team" | "public";
  tags: string[];
  run_count: number;
  last_run_at: string | null;
  created_by: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  created_at: string;
  updated_at: string;
  is_starred?: boolean;
}

interface QueryCardProps {
  query: Query;
  onRun?: (query: Query) => void;
  onStar?: (query: Query) => void;
  onFork?: (query: Query) => void;
  onEdit?: (query: Query) => void;
  onDelete?: (query: Query) => void;
  onShare?: (query: Query) => void;
}

const visibilityIcons = {
  private: Lock,
  team: Users,
  public: Globe,
};

const visibilityLabels = {
  private: "Private",
  team: "Team",
  public: "Public",
};

export function QueryCard({
  query,
  onRun,
  onStar,
  onFork,
  onEdit,
  onDelete,
  onShare,
}: QueryCardProps) {
  const [isStarred, setIsStarred] = useState(query.is_starred || false);
  const VisibilityIcon = visibilityIcons[query.visibility];

  const handleStar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsStarred(!isStarred);
    onStar?.(query);
  };

  // Truncate SQL for preview
  const sqlPreview = query.sql_content.slice(0, 150) + (query.sql_content.length > 150 ? "..." : "");

  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link href={`/queries/${query.id}`}>
              <CardTitle className="text-base font-medium hover:text-primary transition-colors truncate">
                {query.name}
              </CardTitle>
            </Link>
            {query.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {query.description}
              </CardDescription>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Star button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleStar}
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  isStarred && "fill-yellow-400 text-yellow-400"
                )}
              />
            </Button>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onRun?.(query)}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Query
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFork?.(query)}>
                  <GitFork className="h-4 w-4 mr-2" />
                  Fork Query
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(query.sql_content)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy SQL
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onShare?.(query)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(query)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete?.(query)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* SQL Preview */}
        <div className="bg-muted/50 rounded-md p-3 mb-3 font-mono text-xs text-muted-foreground overflow-hidden">
          <pre className="whitespace-pre-wrap break-all">{sqlPreview}</pre>
        </div>

        {/* Tags */}
        {query.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {query.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {query.tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{query.tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {/* Visibility */}
            <div className="flex items-center gap-1">
              <VisibilityIcon className="h-3 w-3" />
              <span>{visibilityLabels[query.visibility]}</span>
            </div>

            {/* Run count */}
            {query.run_count > 0 && (
              <div className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                <span>{query.run_count} runs</span>
              </div>
            )}
          </div>

          {/* Last updated */}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(query.updated_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}