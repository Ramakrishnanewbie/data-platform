"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreVertical,
  Play,
  Copy,
  Pencil,
  Trash2,
  Share2,
  Globe,
  Lock,
  Clock,
  FileCode2,
  FileText,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Exploration } from "@/lib/explorations/types"

interface ExplorationCardProps {
  exploration: Exploration
  onOpen?: (exploration: Exploration) => void
  onDuplicate?: (exploration: Exploration) => void
  onEdit?: (exploration: Exploration) => void
  onDelete?: (exploration: Exploration) => void
  onShare?: (exploration: Exploration) => void
}

export function ExplorationCard({
  exploration,
  onOpen,
  onDuplicate,
  onEdit,
  onDelete,
  onShare,
}: ExplorationCardProps) {
  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link href={`/explorations/${exploration.id}`}>
              <CardTitle className="text-base font-medium hover:text-primary transition-colors truncate">
                {exploration.name}
              </CardTitle>
            </Link>
            {exploration.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {exploration.description}
              </CardDescription>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpen?.(exploration)}>
                  <Play className="h-4 w-4 mr-2" />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate?.(exploration)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onShare?.(exploration)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(exploration)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete?.(exploration)}
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
        {/* Cell count summary */}
        <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileCode2 className="h-3.5 w-3.5" />
            <span>{exploration.cell_count} cells</span>
          </div>
        </div>

        {/* Tags */}
        {exploration.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {exploration.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {exploration.tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{exploration.tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {/* Visibility */}
            <div className="flex items-center gap-1">
              {exploration.is_public ? (
                <>
                  <Globe className="h-3 w-3" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  <span>Private</span>
                </>
              )}
            </div>
          </div>

          {/* Last updated */}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(exploration.updated_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
