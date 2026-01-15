"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, X, Loader2, FolderOpen, Lock, Users, Globe } from "lucide-react";

interface SaveQueryDialogProps {
  sql: string;
  onSave: (data: SaveQueryData) => Promise<void>;
  trigger?: React.ReactNode;
  existingQuery?: {
    id: string;
    name: string;
    description: string;
    folder_id: string | null;
    visibility: string;
    tags: string[];
  };
}

export interface SaveQueryData {
  name: string;
  description: string;
  sql_content: string;
  folder_id: string | null;
  visibility: "private" | "team" | "public";
  tags: string[];
}

// Mock folders - replace with actual API call
const mockFolders = [
  { id: "folder-1", name: "Revenue Queries", is_team_folder: true },
  { id: "folder-2", name: "Customer Analysis", is_team_folder: true },
  { id: "folder-3", name: "My Drafts", is_team_folder: false },
];

export function SaveQueryDialog({
  sql,
  onSave,
  trigger,
  existingQuery,
}: SaveQueryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(existingQuery?.name || "");
  const [description, setDescription] = useState(existingQuery?.description || "");
  const [folderId, setFolderId] = useState<string | null>(existingQuery?.folder_id || null);
  const [visibility, setVisibility] = useState<"private" | "team" | "public">(
    (existingQuery?.visibility as any) || "private"
  );
  const [tags, setTags] = useState<string[]>(existingQuery?.tags || []);
  const [tagInput, setTagInput] = useState("");

  const isEditing = !!existingQuery;

  const handleSave = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        sql_content: sql,
        folder_id: folderId,
        visibility,
        tags,
      });
      setOpen(false);
      // Reset form if not editing
      if (!isEditing) {
        setName("");
        setDescription("");
        setFolderId(null);
        setVisibility("private");
        setTags([]);
      }
    } catch (error) {
      console.error("Failed to save query:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-1.5 h-8">
            <Save className="h-3.5 w-3.5" />
            <span className="text-sm">{isEditing ? "Update" : "Save"}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Update Query" : "Save Query"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your saved query details."
              : "Save this query to your library for easy access later."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Monthly Revenue Report"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What does this query do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Folder */}
          <div className="grid gap-2">
            <Label>Folder</Label>
            <Select
              value={folderId || "none"}
              onValueChange={(val) => setFolderId(val === "none" ? null : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">No folder</span>
                </SelectItem>
                {mockFolders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      <span>{folder.name}</span>
                      {folder.is_team_folder && (
                        <Users className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibility */}
          <div className="grid gap-2">
            <Label>Visibility</Label>
            <Select
              value={visibility}
              onValueChange={(val: any) => setVisibility(val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Private</span>
                    <span className="text-muted-foreground text-xs">Only you</span>
                  </div>
                </SelectItem>
                <SelectItem value="team">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Team</span>
                    <span className="text-muted-foreground text-xs">
                      Workspace members
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Public</span>
                    <span className="text-muted-foreground text-xs">
                      Anyone with link
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="grid gap-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Update Query" : "Save Query"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}