
import { Button } from "@/components/ui/button";
import { Table2, X } from "lucide-react";
import { SelectedTable } from "../hooks/useQueryBuilder";

interface TableCardProps {
  table: SelectedTable;
  index: number;
  onRemove: (idx: number) => void;
}

export const TableCard = ({ table, index, onRemove }: TableCardProps) => {
  return (
    <div className="relative border border-slate-600 rounded-lg p-2.5 bg-slate-900 min-w-[170px] max-w-[170px] group flex-shrink-0">
      <Button
        size="icon"
        variant="ghost"
        className="absolute -top-1.5 -right-1.5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 rounded-full"
        onClick={() => onRemove(index)}
      >
        <X className="h-3 w-3" />
      </Button>

      <div className="flex items-center gap-1.5 mb-1.5">
        <Table2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
        <span className="font-semibold text-sm text-slate-200 truncate">{table.name}</span>
      </div>
      <div className="text-xs text-slate-500 mb-2 truncate">{table.dataset}</div>
      <div className="space-y-0.5 max-h-[75px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        {table.columns.slice(0, 10).map((col: string) => (
          <div
            key={col}
            className="text-xs text-slate-400 flex items-center gap-1 truncate"
          >
            <span
              className={
                col === table.primaryKey
                  ? "text-yellow-400 font-semibold"
                  : ""
              }
            >
              {col}
            </span>
            {col === table.primaryKey && (
              <span className="text-yellow-500 text-[10px]">(PK)</span>
            )}
          </div>
        ))}
        {table.columns.length > 10 && (
          <div className="text-xs text-slate-500 italic pt-0.5">
            +{table.columns.length - 10} more columns
          </div>
        )}
      </div>
    </div>
  );
};