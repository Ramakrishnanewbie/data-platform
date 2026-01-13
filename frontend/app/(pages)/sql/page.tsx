// app/(pages)/sql/page.tsx - FULL CODE WITH COMBINED TOOLBAR
"use client";
import { useState } from "react";
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

  return (
    <ContentLayout title="SQL Editor">
      <div className="h-[calc(100vh-8rem)]">
        <ResizablePanelGroup direction="vertical" className="h-full">
          {/* Top: Editor Area */}
          <ResizablePanel defaultSize={showResults ? 60 : 100} minSize={30}>
            <div className="h-full flex gap-2 p-2">
              {/* Left Sidebar */}
              {!sidebarCollapsed ? (
                <div className="w-[280px] flex-shrink-0">
                  <SchemaExplorer
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    onTableDragStart={handleTableDragStart}
                  />
                </div>
              ) : (
                <div className="w-12 flex-shrink-0 border rounded-lg bg-slate-950 flex items-start justify-center pt-4">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSidebarCollapsed(false)}
                    className="h-8 w-8"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <ResizablePanelGroup direction="vertical">
                  {/* AI Input + Query Builder */}
                  <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                    <div className="h-full flex flex-col gap-2 overflow-hidden">
                      <div className="flex-shrink-0">
                        <AIQueryInput
                          onQueryGenerated={setQuery}
                          schema={schemaContext}
                        />
                      </div>
                      <div className="flex-1 min-h-0">
                        <VisualQueryBuilder
                          selectedTables={selectedTables}
                          onTableDrop={handleTableDrop}
                          onRemoveTable={removeTable}
                          onClearAll={clearTables}
                          onGenerateSQL={handleGenerateSQL}
                        />
                      </div>
                    </div>
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  {/* SQL Editor */}
                  <ResizablePanel defaultSize={75} minSize={40}>
                    <div className="h-full relative">
                      {/* Editor without Run button */}
                      <div className="h-full border rounded-lg overflow-hidden relative bg-slate-950">
                        <SQLEditor
                          value={query}
                          onChange={setQuery}
                          onExecute={handleExecuteQuery}
                          loading={loading}
                        />
                      </div>

                      {/* Combined Toolbar with ALL buttons including Run Query */}
                      <div className="absolute top-4 right-4 z-10 flex gap-2">
                        <SQLFormatter sql={query} onFormat={setQuery} />
                        <QueryExplanation sql={query} />
                        <SaveQueryDialog sql={query} />
                        <QueryHistoryPanel onSelectQuery={setQuery} />
                        
                        {/* Run Query Button */}
                        <Button
                          onClick={handleExecuteQuery}
                          disabled={loading || !query.trim()}
                          className="gap-2 shadow-lg"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Running...
                            </>
                          ) : (
                            <>
                              <Play className="h-2 w-2" />
                              Run Query
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
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