
'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Table2, Columns } from 'lucide-react';
import { motion } from 'framer-motion';

interface BigQueryTable {
  name: string;
  columns: string[]; // BigQuery returns columns as string array
}

interface BigQueryDataset {
  name: string;
  tables: BigQueryTable[];
}

interface SchemaSearchProps {
  datasets: BigQueryDataset[];
  onTableSelect: (dataset: string, tableName: string) => void;
}

export function SchemaSearch({ datasets, onTableSelect }: SchemaSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Search across datasets, tables, and columns
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    const results: Array<{
      type: 'table' | 'column';
      dataset: string;
      table: string;
      column?: string;
    }> = [];

    datasets.forEach(dataset => {
      dataset.tables.forEach(table => {
        // Match table names
        if (table.name.toLowerCase().includes(term)) {
          results.push({
            type: 'table',
            dataset: dataset.name,
            table: table.name,
          });
        }

        // Match column names (columns are just strings in BigQuery)
        if (table.columns && Array.isArray(table.columns)) {
          table.columns.forEach(column => {
            if (column.toLowerCase().includes(term)) {
              results.push({
                type: 'column',
                dataset: dataset.name,
                table: table.name,
                column: column,
              });
            }
          });
        }
      });
    });

    return results.slice(0, 50); // Limit to 50 results
  }, [searchTerm, datasets]);

  return (
    <div className="p-3 border-b border-slate-700/50">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search tables and columns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-9 bg-slate-900 border-slate-700 text-slate-200 text-sm"
        />
      </div>

      {/* Search Results Dropdown */}
      {searchTerm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 max-h-[300px] overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-xl"
        >
          {searchResults.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              No results found
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => onTableSelect(result.dataset, result.table)}
                  className="w-full text-left p-2 rounded hover:bg-slate-800 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    {result.type === 'table' ? (
                      <Table2 className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Columns className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate">
                        {result.table}
                      </div>
                      
                      <div className="text-xs text-slate-500 mt-0.5">
                        {result.dataset}
                        {result.column && (
                          <>
                            {' → '}
                            <span className="text-slate-400">{result.column}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}