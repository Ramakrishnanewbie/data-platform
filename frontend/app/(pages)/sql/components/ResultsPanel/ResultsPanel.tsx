// app/(pages)/sql/components/ResultsPanel/ResultsPanel.tsx
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QueryResult } from "../hooks/useBigQueryExecute";

interface ResultsPanelProps {
  results: QueryResult | null;
  error: string | null;
  onClose: () => void;
}

export const ResultsPanel = ({ results, error, onClose }: ResultsPanelProps) => {
  return (
    <div className="h-full bg-slate-900 border rounded-lg flex flex-col">
      <div className="p-3 border-b border-slate-700 bg-slate-800 flex items-center justify-between shrink-0">
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
          onClick={onClose}
          className="h-8 w-8 hover:bg-slate-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4">
          {error ? (
            <div className="bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          ) : results?.rows ? (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-800/50">
                  {results.schema.map((field, idx) => (
                    <TableHead
                      key={idx}
                      className="font-semibold text-slate-200 whitespace-nowrap"
                    >
                      {field.name}
                      <span className="text-xs text-slate-500 ml-2">
                        ({field.type})
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.rows.map((row, rowIdx) => (
                  <TableRow
                    key={rowIdx}
                    className="border-slate-800 hover:bg-slate-800/30"
                  >
                    {Object.values(row).map((value: any, cellIdx) => (
                      <TableCell key={cellIdx} className="text-slate-300">
                        {value === null ? (
                          <span className="text-slate-500 italic">null</span>
                        ) : typeof value === "object" ? (
                          <span className="text-blue-400">
                            {JSON.stringify(value)}
                          </span>
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
      </div>
    </div>
  );
};