// app/(pages)/sql/components/QueryHistory/SaveQueryDialog.tsx
"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { useQueryHistory } from '../hooks/useQueryHistory';

interface SaveQueryDialogProps {
  sql: string;
}

export const SaveQueryDialog = ({ sql }: SaveQueryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const { saveQuery } = useQueryHistory();

  const handleSave = () => {
    if (!name.trim()) return;

    const tagArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    saveQuery(name, sql, tagArray);
    setName('');
    setTags('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Save className="h-3 w-3" />
          Save Query
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle>Save Query</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Query Name</Label>
            <Input
              id="name"
              placeholder="e.g., Top Customers by Revenue"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="e.g., sales, reporting, monthly"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <Button onClick={handleSave} className="w-full">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};