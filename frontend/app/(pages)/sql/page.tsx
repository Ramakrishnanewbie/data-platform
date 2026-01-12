"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Play, Loader2, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContentLayout } from "@/components/admin-panel/content-layout";

export default function SQLPage() {
  const [query, setQuery] = useState("SELECT * FROM `project.dataset.table` LIMIT 10;");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    setShowResults(false);
    
    try {
      const response = await fetch("/api/bigquery/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
      setShowResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContentLayout title="SQL Editor">
      <div className="relative h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex-1 border rounded-lg overflow-hidden relative">
          <Editor
            height="100%"
            width="100%"
            defaultLanguage="sql"
            value={query}
            onChange={(value) => setQuery(value || "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
            }}
          />
          
          <div className="absolute top-4 right-4 z-10">
            <Button
              onClick={executeQuery}
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
                  <Play className="h-4 w-4" />
                  Run Query
                </>
              )}
            </Button>
          </div>
        </div>

        {showResults && (
          <div
            className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 shadow-2xl transition-transform duration-300 ease-in-out z-50 translate-y-0"
            style={{ 
              height: "30vh",
            }}
          >
            <div className="h-full flex flex-col">
              <div className="p-3 border-b border-slate-700 bg-slate-800/80 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    {error ? "Error" : results ? "Results" : "Query Results"}
                  </h2>
                  {results?.rows && (
                    <p className="text-xs text-slate-400 mt-1">
                      {results.rows.length} row(s) returned
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowResults(false)}
                  className="h-8 w-8 hover:bg-slate-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4">
                  {error ? (
                    <div className="bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded">
                      {error}
                    </div>
                  ) : results?.rows ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700 hover:bg-slate-800/50">
                          {results.schema.map((field: any, idx: number) => (
                            <TableHead key={idx} className="font-semibold text-slate-200">
                              {field.name}
                              <span className="text-xs text-slate-500 ml-2">
                                ({field.type})
                              </span>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.rows.map((row: any, rowIdx: number) => (
                          <TableRow key={rowIdx} className="border-slate-800 hover:bg-slate-800/30">
                            {Object.values(row).map((value: any, cellIdx: number) => (
                              <TableCell key={cellIdx} className="text-slate-300">
                                {value === null ? (
                                  <span className="text-slate-500 italic">null</span>
                                ) : typeof value === 'object' ? (
                                  <span className="text-blue-400">{JSON.stringify(value)}</span>
                                ) : (
                                  String(value)
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        
      </div>
    </ContentLayout>
  );
}