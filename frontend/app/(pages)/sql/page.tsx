// app/(pages)/sql/page.tsx - DYNAMIC HEIGHT ADJUSTMENT
"use client";
import { useState, useEffect, useRef } from "react";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { PanelLeft, Play, Loader2 } from "lucide-react";
import { SchemaExplorer } from "./components/SchemaExplorer/SchemaExplorer";
import { VisualQueryBuilder } from "./components/VisualQueryBuilder/VisualQueryBuilder";
import { SQLEditor } from "./components/SQLEditor/SQLEditor";
import { ResultsPanel } from "./components/ResultsPanel/ResultsPanel";
import { AIQueryInput } from "./components/AIAssistant/AIQueryInput";
import { QueryExplanation } from "./components/AIAssistant/QueryExplanation";
import { QueryHistoryPanel } from "./components/QueryHistory/QueryHistoryPanel";
import { SaveQueryDialog } from "./components/QueryHistory/SaveQueryDialog";
import { SQLFormatter } from "./components/SQLEditor/SQLFormatter";
import { useQueryBuilder } from "./components/hooks/useQueryBuilder";
import { useBigQueryExecute } from "./components/hooks/useBigQueryExecute";
import { useBigQuerySchema } from "./components/hooks/useBigQuerySchema";
import { useQueryHistory } from "./components/hooks/useQueryHistory";

export default function SQLPage() {
  const [query, setQuery] = useState("SELECT * FROM `project.dataset.table` LIMIT 10;");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const queryBuilderRef = useRef<HTMLDivElement>(null);
  const [queryBuilderHeight, setQueryBuilderHeight] = useState(0);
  
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

  // Measure query builder height and adjust layout
  useEffect(() => {
    if (queryBuilderRef.current) {
      const height = queryBuilderRef.current.scrollHeight;
      setQueryBuilderHeight(height);
    }
  }, [selectedTables]);

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
    try {
      const result = await executeQuery(query);
      const executionTime = Date.now() - startTime;
      addToHistory(query, executionTime, result?.rows?.length);
    } catch (err) {
      addToHistory(query);
    }
  };

  const handleCloseResults = () => {
    clearResults();
  };

  // Calculate spacing based on query builder content
  const hasOverflow = queryBuilderHeight > 150;
  const editorTopPadding = hasOverflow ? 'pt-3' : 'pt-2';

  return (
    <ContentLayout title="SQL Editor">
      <div className="h-[calc(100vh-8rem)]">
        <ResizablePanelGroup direction="vertical" className="h-full">
          <ResizablePanel defaultSize={showResults ? 60 : 100} minSize={30}>
            <div className="h-full flex gap-3 p-3">
              {/* Left Sidebar */}
              {!sidebarCollapsed ? (
                <div className="w-[260px] flex-shrink-0">
                  <SchemaExplorer
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    onTableDragStart={handleTableDragStart}
                  />
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

              {/* Main Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-0">
                {/* AI Query Input */}
                <div className="flex-shrink-0 mb-2.5">
                  <AIQueryInput
                    onQueryGenerated={setQuery}
                    schema={schemaContext}
                  />
                </div>

                {/* Visual Query Builder - Dynamic height */}
                <div 
                  ref={queryBuilderRef}
                  className="flex-shrink-0 transition-all duration-300 ease-out"
                  style={{
                    marginBottom: hasOverflow ? '12px' : '8px'
                  }}
                >
                  <VisualQueryBuilder
                    selectedTables={selectedTables}
                    onTableDrop={handleTableDrop}
                    onRemoveTable={removeTable}
                    onClearAll={clearTables}
                    onGenerateSQL={handleGenerateSQL}
                  />
                </div>

                {/* SQL Editor - Takes remaining space */}
                <div className={`flex-1 relative min-h-0 ${editorTopPadding} transition-all duration-300`}>
                  <div className="h-full border rounded-lg overflow-hidden bg-slate-950">
                    <SQLEditor
                      value={query}
                      onChange={setQuery}
                      onExecute={handleExecuteQuery}
                      loading={loading}
                    />
                  </div>

                  {/* Toolbar */}
                  <div className="absolute top-5 right-3 z-10 flex gap-2">
                    <SQLFormatter sql={query} onFormat={setQuery} />
                    <QueryExplanation sql={query} />
                    <SaveQueryDialog sql={query} />
                    <QueryHistoryPanel onSelectQuery={setQuery} />
                    
                    <Button
                      onClick={handleExecuteQuery}
                      disabled={loading || !query.trim()}
                      size="sm"
                      className="gap-1.5 shadow-lg h-8"
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
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ResizablePanel>

          {/* Bottom: Results */}
          {showResults && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={40} minSize={20} maxSize={70}>
                <ResultsPanel
                  results={results}
                  error={error}
                  onClose={handleCloseResults}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </ContentLayout>
  );
}