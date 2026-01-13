
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { History, Search, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQueryHistory } from '../hooks/useQueryHistory';

interface EnhancedQueryHistoryProps {
  onSelectQuery: (query: string) => void;
}

export function EnhancedQueryHistory({ onSelectQuery }: EnhancedQueryHistoryProps) {
  const { history, clearHistory } = useQueryHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error'>('all');

  // Filter and search history
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      // Status filter
      if (filterStatus === 'success' && item.error) return false;
      if (filterStatus === 'error' && !item.error) return false;
      
      // Search filter - check both sql and query fields
      if (searchTerm) {
        const queryText = item.query || item.sql || '';
        return queryText.toLowerCase().includes(searchTerm.toLowerCase());
      }
      
      return true;
    });
  }, [history, searchTerm, filterStatus]);

  const formatExecutionTime = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (timestamp: Date | number) => {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5"
        >
          <History className="h-3.5 w-3.5" />
          <span className="text-sm">History</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[500px] bg-slate-950 border-slate-800">
        <SheetHeader>
          <SheetTitle className="text-slate-200">Query History</SheetTitle>
          <SheetDescription className="text-slate-400">
            View and rerun your past queries
          </SheetDescription>
        </SheetHeader>

        {/* Search and Filters */}
        <div className="mt-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-700 text-slate-200"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
              className="h-7"
            >
              All ({history.length})
            </Button>
            <Button
              size="sm"
              variant={filterStatus === 'success' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('success')}
              className="h-7"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Success
            </Button>
            <Button
              size="sm"
              variant={filterStatus === 'error' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('error')}
              className="h-7"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Errors
            </Button>

            {history.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearHistory}
                className="h-7 ml-auto text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* History List */}
        <div className="mt-4 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No queries found</p>
            </div>
          ) : (
            filteredHistory.map((item, idx) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onSelectQuery(item.query || item.sql)}
                className="w-full text-left p-3 rounded-lg bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-all group"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs">
                    {item.error ? (
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                    )}
                    <span className="text-slate-400">{formatDate(item.timestamp)}</span>
                  </div>

                  {item.executionTime && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      {formatExecutionTime(item.executionTime)}
                    </div>
                  )}
                </div>

                {/* Query Preview */}
                <pre className="text-xs text-slate-300 font-mono line-clamp-3 group-hover:text-slate-200 transition-colors">
                  {item.query || item.sql}
                </pre>

                {/* Stats */}
                {item.rowCount !== undefined && (
                  <div className="mt-2 text-xs text-slate-500">
                    {item.rowCount.toLocaleString()} rows
                  </div>
                )}
              </motion.button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}