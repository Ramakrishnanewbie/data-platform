'use client';
import React, { useState } from 'react';
import { ContentLayout } from "@/components/admin-panel/content-layout";
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

function SQLPage() {
  const [sql, setSql] = useState('SELECT * FROM dataset.table LIMIT 10');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runQuery = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Query failed');
      }
      
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContentLayout title="SQL Editor">
      <div className="flex flex-col h-full -m-6">
        {/* Editor Section */}
        <div className="h-80 bg-[#1e1e1e] border-b border-gray-700 relative">
          <div className="absolute inset-0">
            <Editor
              height="100%"
              width="100%"
              language="sql"
              value={sql}
              onChange={(value) => setSql(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-b border-gray-700">
          <Button 
            onClick={runQuery} 
            disabled={loading}
            size="sm"
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            {loading ? 'Running...' : 'Run Query'}
          </Button>
        </div>

        {/* Results Section */}
        <div className="flex-1 overflow-auto bg-[#0a0a0a] p-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-200 mb-4">
              <div className="font-semibold mb-1">Error</div>
              {error}
            </div>
          )}
          
          {results && (
            <div>
              <div className="mb-3 text-sm text-gray-400">
                {results.rowCount} {results.rowCount === 1 ? 'row' : 'rows'} returned
              </div>
              <div className="overflow-auto rounded-lg border border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 sticky top-0">
                    <tr>
                      {results.schema.map((col: any) => (
                        <th key={col.name} className="px-4 py-3 text-left font-medium">
                          <div>{col.name}</div>
                          <div className="text-xs text-gray-500 font-normal">
                            {col.type}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-gray-950">
                    {results.rows.map((row: any, idx: number) => (
                      <tr key={idx} className="border-t border-gray-800 hover:bg-gray-900/50">
                        {Object.values(row).map((cell: any, cellIdx: number) => (
                          <td key={cellIdx} className="px-4 py-3">
                            {cell !== null && cell !== undefined ? (
                              cell.toString()
                            ) : (
                              <span className="text-gray-600 italic">NULL</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {!results && !error && !loading && (
            <div className="flex items-center justify-center h-full text-gray-500">
              Write a SQL query and click Run to see results
            </div>
          )}
        </div>
      </div>
    </ContentLayout>
  );
}

export default SQLPage;