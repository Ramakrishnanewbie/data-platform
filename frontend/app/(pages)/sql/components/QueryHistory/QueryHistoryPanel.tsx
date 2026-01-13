// app/(pages)/sql/components/QueryHistory/QueryHistoryPanel.tsx
"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, Star, Trash2, Clock } from 'lucide-react';
import { useQueryHistory } from '../hooks/useQueryHistory';
import { Card } from '@/components/ui/card';

interface QueryHistoryPanelProps {
  onSelectQuery: (sql: string) => void;
}

export const QueryHistoryPanel = ({ onSelectQuery }: QueryHistoryPanelProps) => {
  const { history, savedQueries, deleteQuery, toggleFavorite, clearHistory } = useQueryHistory();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <History className="h-4 w-4" />
        History
      </Button>

      {isOpen && (
        <Card className="absolute top-16 right-20 w-[500px] h-[600px] bg-slate-900 border-slate-700 z-50 flex flex-col">
          <Tabs defaultValue="history" className="flex-1 flex flex-col">
            <div className="p-4 border-b border-slate-700">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="history">Recent</TabsTrigger>
                <TabsTrigger value="saved">Saved</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="history" className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm text-slate-400">Last 50 queries</span>
                <Button size="sm" variant="ghost" onClick={clearHistory}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              <ScrollArea className="h-full px-4">
                {history.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No query history</div>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectQuery(item.sql);
                        setIsOpen(false);
                      }}
                      className="p-3 mb-2 bg-slate-800/50 hover:bg-slate-800 rounded cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                        {item.rowCount !== undefined && (
                          <span className="text-xs text-slate-500">
                            {item.rowCount} rows
                          </span>
                        )}
                      </div>
                      <code className="text-xs text-slate-300 line-clamp-2">
                        {item.sql}
                      </code>
                    </div>
                  ))
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="saved" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full px-4">
                {savedQueries.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No saved queries</div>
                ) : (
                  savedQueries.map((query) => (
                    <div
                      key={query.id}
                      className="p-3 mb-2 bg-slate-800/50 hover:bg-slate-800 rounded group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-200">
                          {query.name}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleFavorite(query.id)}
                            className="h-6 w-6"
                          >
                            <Star
                              className={`h-3 w-3 ${
                                query.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''
                              }`}
                            />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteQuery(query.id)}
                            className="h-6 w-6"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <code
                        onClick={() => {
                          onSelectQuery(query.sql);
                          setIsOpen(false);
                        }}
                        className="text-xs text-slate-300 line-clamp-2 cursor-pointer"
                      >
                        {query.sql}
                      </code>
                      {query.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {query.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 bg-slate-700 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </>
  );
};