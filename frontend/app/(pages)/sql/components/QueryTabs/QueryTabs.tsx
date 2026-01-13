
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Edit2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QueryTab {
  id: string;
  name: string;
  query: string;
}

interface QueryTabsProps {
  tabs: QueryTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabAdd: () => void;
  onTabClose: (tabId: string) => void;
  onTabRename: (tabId: string, newName: string) => void;
  onQueryChange: (tabId: string, query: string) => void;
}

export function QueryTabs({
  tabs,
  activeTabId,
  onTabChange,
  onTabAdd,
  onTabClose,
  onTabRename,
}: QueryTabsProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const startEditing = (tab: QueryTab) => {
    setEditingTabId(tab.id);
    setEditingName(tab.name);
  };

  const finishEditing = () => {
    if (editingTabId && editingName.trim()) {
      onTabRename(editingTabId, editingName.trim());
    }
    setEditingTabId(null);
  };

  return (
    <div className="flex items-center gap-1 bg-slate-900/50 border-b border-slate-700/50 px-2 md:px-3 py-1.5 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
      <AnimatePresence mode="popLayout">
        {tabs.map((tab, index) => (
          <motion.div
            key={tab.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className={`
              flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 rounded-lg text-xs md:text-sm transition-colors whitespace-nowrap
              ${activeTabId === tab.id 
                ? 'bg-slate-800 text-slate-200 shadow-lg' 
                : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
              }
            `}
          >
            {editingTabId === tab.id ? (
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={finishEditing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finishEditing();
                  if (e.key === 'Escape') setEditingTabId(null);
                }}
                className="h-6 w-24 px-2 text-xs bg-slate-950 border-slate-600"
                autoFocus
              />
            ) : (
              <button
                onClick={() => onTabChange(tab.id)}
                className="flex items-center gap-2 flex-1"
              >
                <span className="font-medium whitespace-nowrap">{tab.name}</span>
              </button>
            )}

            <div className="flex items-center gap-1">
              {activeTabId === tab.id && editingTabId !== tab.id && (
                <button
                  onClick={() => startEditing(tab)}
                  className="p-0.5 hover:bg-slate-700 rounded transition-colors"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              )}
              
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className="p-0.5 hover:bg-red-900/50 hover:text-red-400 rounded transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <Button
        size="sm"
        variant="ghost"
        onClick={onTabAdd}
        className="h-7 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}