
'use client';

import { Button } from "@/components/ui/button";
import { X, Copy, Check, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QueryResult } from "../hooks/useBigQueryExecute";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { ExportOptions } from "./ExportOptions";

interface ResultsPanelProps {
  results: QueryResult | null;
  error: string | null;
  onClose: () => void;
  executionTime?: number;
}

const ROWS_PER_PAGE = 100;

export const ResultsPanel = ({ results, error, onClose, executionTime }: ResultsPanelProps) => {
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  const sortedData = useMemo(() => {
    if (!results?.rows || !sortConfig.key) return results?.rows || [];
    
    const sorted = [...results.rows].sort((a, b) => {
      const aVal = a[sortConfig.key!];
      const bVal = b[sortConfig.key!];
      
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [results?.rows, sortConfig]);

  const totalPages = Math.ceil((sortedData?.length || 0) / ROWS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage]);

  const handleSort = (columnName: string) => {
    setSortConfig(prev => ({
      key: columnName,
      direction: prev.key === columnName && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const handleCopyCell = (value: any) => {
    const text = value?.toString() || '';
    navigator.clipboard.writeText(text);
    setCopiedCell(text);
    setTimeout(() => setCopiedCell(null), 2000);
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border rounded-lg flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="p-3 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-slate-200">
            {error ? "Query Error" : "Query Results"}
          </h2>
          {results?.rows && (
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Rows:</span>
                <span className="text-blue-400 font-mono font-medium">
                  {results.rows.length.toLocaleString()}
                </span>
              </div>
              {executionTime && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Time:</span>
                  <span className="text-green-400 font-mono font-medium">
                    {formatExecutionTime(executionTime)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {results && (
            <ExportOptions
              data={results.rows}
              schema={results.schema}
              filename={`query-results-${Date.now()}`}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content with proper scrolling */}
      <div 
        className="flex-1 min-h-0" 
        style={{ 
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <AnimatePresence mode="wait">
          {/* Error State */}
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="p-6 flex items-center justify-center h-full"
            >
              <div className="max-w-2xl w-full bg-red-950/30 border border-red-700/50 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <X className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-400 mb-2">Query Error</h4>
                    <pre className="text-sm text-red-300/90 font-mono whitespace-pre-wrap">
                      {error}
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results Table */}
          {results?.rows && !error && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="p-4"
            >
              {/*
                ENHANCED TABLE WITH PROFESSIONAL POLISH
                - table-zebra: Subtle alternating row colors
                - table-hover: Row lift on hover
                - table-sticky-header: Sticky header with shadow
                - elevation-sm: Depth for the container
              */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm elevation-sm overflow-auto">
                <Table className="table-zebra table-hover">
                  <TableHeader className="table-sticky-header">
                    <TableRow className="border-slate-700/50 hover:bg-slate-800/50 bg-gradient-to-r from-slate-800/95 via-slate-800/90 to-slate-800/95">
                      {results.schema?.map((field, idx) => (
                        <TableHead
                          key={idx}
                          className="font-semibold text-slate-200 cursor-pointer hover:bg-slate-700/50 transition-colors"
                          onClick={() => handleSort(field.name)}
                          style={{ minWidth: '150px' }}
                        >
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm">{field.name}</span>
                              <span className="text-xs font-normal text-blue-400/70 uppercase tracking-wide">
                                {field.type}
                              </span>
                            </div>
                            {sortConfig.key === field.name ? (
                              sortConfig.direction === 'asc' ? (
                                <ArrowUp className="h-3 w-3 text-blue-400 flex-shrink-0" />
                              ) : (
                                <ArrowDown className="h-3 w-3 text-blue-400 flex-shrink-0" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-600 flex-shrink-0" />
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((row, rowIdx) => (
                      <motion.tr
                        key={rowIdx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.25,
                          delay: Math.min(rowIdx * 0.02, 0.5),
                          ease: "easeOut"
                        }}
                        className="border-slate-800/50 hover:bg-slate-800/40 transition-colors"
                      >
                        {Object.values(row).map((value: any, cellIdx) => (
                          <TableCell 
                            key={cellIdx} 
                            className="text-slate-300 group relative"
                            style={{ minWidth: '150px' }}
                          >
                            <div className="flex items-center gap-2">
                              {value === null ? (
                                <span className="text-slate-600 italic text-xs whitespace-nowrap">NULL</span>
                              ) : typeof value === "object" ? (
                                <span className="text-blue-400 font-mono text-xs whitespace-nowrap">
                                  {JSON.stringify(value)}
                                </span>
                              ) : (
                                <span className="font-mono text-xs whitespace-nowrap">
                                  {String(value)}
                                </span>
                              )}
                              
                              <button
                                onClick={() => handleCopyCell(value)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-700/50 rounded flex-shrink-0"
                                title={copiedCell === value?.toString() ? 'Copied!' : 'Copy value'}
                              >
                                {copiedCell === value?.toString() ? (
                                  <Check className="h-3 w-3 text-green-400" />
                                ) : (
                                  <Copy className="h-3 w-3 text-slate-400" />
                                )}
                              </button>
                            </div>
                          </TableCell>
                        ))}
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Showing {((currentPage - 1) * ROWS_PER_PAGE) + 1} - {Math.min(currentPage * ROWS_PER_PAGE, sortedData.length)} of {sortedData.length} rows
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-7"
                    >
                      <ChevronLeft className="h-3 w-3 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="text-xs text-slate-400 px-3">
                      Page {currentPage} of {totalPages}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-7"
                    >
                      Next
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 flex items-center justify-between text-xs text-slate-500"
              >
                <span>Query executed successfully</span>
                {sortConfig.key && (
                  <span>Sorted by {sortConfig.key} ({sortConfig.direction})</span>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};