// app/(pages)/sql/page.tsx - PHASE 2 FIXED ALL ISSUES
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Button } from "@/components/ui/button";
import { PanelLeft, Play, Loader2, Zap } from "lucide-react";
import { SchemaExplorer } from "./components/SchemaExplorer/SchemaExplorer";
import { SchemaSearch } from "./components/SchemaExplorer/SchemaSearch";
import { VisualQueryBuilder } from "./components/VisualQueryBuilder/VisualQueryBuilder";
import { SQLEditor } from "./components/SQLEditor/SQLEditor";
import { ResultsPanel } from "./components/ResultsPanel/ResultsPanel";
import { QueryTabs } from "./components/QueryTabs/QueryTabs";
import { AIQueryInput } from "./components/AIAssistant/AIQueryInput";
import { QueryExplanation } from "./components/AIAssistant/QueryExplanation";
import { EnhancedQueryHistory } from "./components/QueryHistory/EnhancedQueryHistory";
import { SaveQueryDialog } from "./components/QueryHistory/SaveQueryDialog";
import { SQLFormatter } from "./components/SQLEditor/SQLFormatter";
import { useQueryBuilder } from "./components/hooks/useQueryBuilder";
import { useBigQueryExecute } from "./components/hooks/useBigQueryExecute";
import { useBigQuerySchema } from "./components/hooks/useBigQuerySchema";
import { useQueryHistory } from "./components/hooks/useQueryHistory";
import { motion, AnimatePresence } from "framer-motion";

interface QueryTab {
  id: string;
  name: string;
  query: string;
}

export default function SQLPage() {
  const [tabs, setTabs] = useState<QueryTab[]>([
    { id: '1', name: 'Query 1', query: 'SELECT * FROM `project.dataset.table` LIMIT 10;' }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  
  const activeTab = tabs.find(t => t.id === activeTabId)!;
  const [query, setQuery] = useState(activeTab.query);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const queryBuilderRef = useRef<HTMLDivElement>(null);
  const [queryBuilderHeight, setQueryBuilderHeight] = useState(0);
  const [resultsHeight, setResultsHeight] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | undefined>();
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartHeight = useRef<number>(40);
  
  const { selectedTables, addTable, removeTable, clearTables, generateSQL } = useQueryBuilder();
  const { results, loading, error, executeQuery, clearResults } = useBigQueryExecute();
  const { datasets } = useBigQuerySchema();
  const { addToHistory } = useQueryHistory();

  const showResults = !!results || !!error;

  const schemaContext = datasets
    .map((ds) => 
      `Dataset: ${ds.name}\nTables: ${ds.tables.map((t) => t.name).join(', ')}`
    )
    .join('\n\n');

  useEffect(() => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab) setQuery(tab.query);
  }, [activeTabId, tabs]);

  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTabs(prev => prev.map(t => 
        t.id === activeTabId ? { ...t, query: queryRef.current } : t
      ));
    }, 500);

    return () => clearTimeout(timer);
  }, [query, activeTabId]);

  const handleTabAdd = () => {
    const newId = String(Date.now());
    const newTab = { 
      id: newId, 
      name: `Query ${tabs.length + 1}`, 
      query: 'SELECT * FROM `project.dataset.table` LIMIT 10;' 
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const handleTabClose = (tabId: string) => {
    if (tabs.length === 1) return;
    
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    
    if (activeTabId === tabId) {
      const newActiveTab = newTabs[Math.max(0, tabIndex - 1)];
      setActiveTabId(newActiveTab.id);
    }
  };

  const handleTabRename = (tabId: string, newName: string) => {
    setTabs(prev => prev.map(t => 
      t.id === tabId ? { ...t, name: newName } : t
    ));
  };

  useEffect(() => {
    if (queryBuilderRef.current) {
      const height = queryBuilderRef.current.scrollHeight;
      setQueryBuilderHeight(height);
    }
  }, [selectedTables]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!loading && query.trim()) {
          handleExecuteQuery();
        }
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector<HTMLButtonElement>('[data-format-button]')?.click();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        handleTabAdd();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        if (tabs.length > 1) {
          handleTabClose(activeTabId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, query, tabs.length, activeTabId]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const deltaY = dragStartY.current - e.clientY;
    const deltaPercent = (deltaY / containerRect.height) * 100;
    
    const newHeight = dragStartHeight.current + deltaPercent;
    const clampedHeight = Math.min(Math.max(newHeight, 20), 70);
    
    requestAnimationFrame(() => {
      setResultsHeight(clampedHeight);
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (containerRef.current) {
      dragStartY.current = e.clientY;
      dragStartHeight.current = resultsHeight;
      setIsDragging(true);
    }
  }, [resultsHeight]);

  const handleTableDragStart = (e: React.DragEvent, dataset: string, table: any) => {
    e.dataTransfer.setData("table", JSON.stringify({ dataset, ...table }));
  };

  const handleTableDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const tableData = JSON.parse(e.dataTransfer.getData("table"));
    addTable(tableData.dataset, tableData);
  };

  const handleGenerateSQL = () => {
    const sql = generateSQL();
    if (sql) setQuery(sql);
  };

  const handleExecuteQuery = async () => {
    const startTime = Date.now();
    setExecutionTime(undefined);
    
    try {
      const result = await executeQuery(query);
      const execTime = Date.now() - startTime;
      setExecutionTime(execTime);
      addToHistory(query, execTime, result?.rows?.length, false);
    } catch (err) {
      const execTime = Date.now() - startTime;
      setExecutionTime(execTime);
      addToHistory(query, execTime, undefined, true);
    }
  };

  const handleCloseResults = () => {
    clearResults();
    setExecutionTime(undefined);
  };

  const hasOverflow = queryBuilderHeight > 150;
  const editorTopPadding = hasOverflow ? 'pt-3' : 'pt-2';

  return (
    <ContentLayout title="SQL Editor">
      <div className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
        {/* Query Tabs */}
        <QueryTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          onTabAdd={handleTabAdd}
          onTabClose={handleTabClose}
          onTabRename={handleTabRename}
          onQueryChange={(tabId, query) => {
            setTabs(prev => prev.map(t => t.id === tabId ? { ...t, query } : t));
          }}
        />

        {/* Main Content - Fixed Layout */}
        <div className="flex-1 flex gap-3 p-3 min-h-0 overflow-hidden">
          {/* Left Sidebar - Fixed Width */}
          {!sidebarCollapsed ? (
            <div className="w-[260px] flex-shrink-0 flex flex-col overflow-hidden">
              <div className="border rounded-lg bg-slate-950 flex flex-col h-full overflow-hidden">
                <SchemaSearch
                  datasets={datasets}
                  onTableSelect={(dataset, table) => {
                    const tableData = datasets
                      .find(d => d.name === dataset)
                      ?.tables.find(t => t.name === table);
                    if (tableData) {
                      addTable(dataset, tableData);
                    }
                  }}
                />
                <div className="flex-1 overflow-auto">
                  <SchemaExplorer
                    collapsed={false}
                    onToggleCollapse={() => setSidebarCollapsed(true)}
                    onTableDragStart={handleTableDragStart}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-12 flex-shrink-0 border rounded-lg bg-slate-950 flex items-start justify-center pt-3">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSidebarCollapsed(false)}
                className="h-7 w-7"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Editor and Results - Takes remaining space */}
          <div 
            ref={containerRef}
            className="flex-1 min-w-0 relative"
          >
            {/* Editor Area - Absolute positioned to prevent pushing */}
            <div 
              className="absolute inset-0 flex flex-col"
              style={{
                height: showResults ? `${100 - resultsHeight}%` : '100%',
              }}
            >
              <div className="flex-shrink-0 mb-2.5">
                <AIQueryInput
                  onQueryGenerated={setQuery}
                  schema={schemaContext}
                />
              </div>

              <div 
                ref={queryBuilderRef}
                className="flex-shrink-0 transition-all duration-300 ease-out"
                style={{ marginBottom: hasOverflow ? '12px' : '8px' }}
              >
                <VisualQueryBuilder
                  selectedTables={selectedTables}
                  onTableDrop={handleTableDrop}
                  onRemoveTable={removeTable}
                  onClearAll={clearTables}
                  onGenerateSQL={handleGenerateSQL}
                />
              </div>

              <div className={`flex-1 relative min-h-0 ${editorTopPadding} transition-all duration-300 overflow-hidden`}>
                <div className="h-full border rounded-lg overflow-hidden bg-slate-950">
                  <SQLEditor
                    value={query}
                    onChange={setQuery}
                    onExecute={handleExecuteQuery}
                    loading={loading}
                  />
                </div>

                <div className="absolute top-5 right-3 z-10 flex gap-2">
                  <SQLFormatter sql={query} onFormat={setQuery} />
                  <QueryExplanation sql={query} />
                  <SaveQueryDialog sql={query} />
                  <EnhancedQueryHistory onSelectQuery={setQuery} />
                  
                  <Button
                    onClick={handleExecuteQuery}
                    disabled={loading || !query.trim()}
                    size="sm"
                    className="gap-1.5 shadow-lg h-8 relative group"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span className="text-sm">Running...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        <span className="text-sm">Run</span>
                        <Zap className="h-3 w-3 text-yellow-400 ml-1" />
                      </>
                    )}
                    
                    {!loading && (
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        <div className="bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded shadow-lg">
                          ⌘/Ctrl + Enter
                        </div>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Panel - Absolute positioned overlay */}
            <AnimatePresence>
              {showResults && (
                <>
                  {/* Drag Handle */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: [0, -4, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{
                      opacity: { duration: 0.3 },
                      y: { duration: 1.5, repeat: 2, repeatType: "loop", ease: "easeInOut", delay: 0.5 }
                    }}
                    onMouseDown={handleDragStart}
                    className={`absolute left-0 right-0 h-3 flex items-center justify-center cursor-row-resize hover:bg-blue-500/10 transition-colors group z-20 ${isDragging ? 'bg-blue-500/20' : ''}`}
                    style={{ 
                      bottom: `${resultsHeight}%`,
                      userSelect: 'none',
                      touchAction: 'none'
                    }}
                  >
                    <div className="flex flex-col items-center gap-1 pointer-events-none">
                      <div className="w-12 h-1 rounded-full bg-slate-600 group-hover:bg-blue-400 transition-all duration-200" />
                      <div className="w-8 h-0.5 rounded-full bg-slate-700 group-hover:bg-blue-500 transition-all duration-200" />
                    </div>
                  </motion.div>

                  {/* Results Panel Overlay */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute left-0 right-0 bottom-0 z-10"
                    style={{ height: `${resultsHeight}%` }}
                  >
                    <ResultsPanel
                      results={results}
                      error={error}
                      onClose={handleCloseResults}
                      executionTime={executionTime}
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}