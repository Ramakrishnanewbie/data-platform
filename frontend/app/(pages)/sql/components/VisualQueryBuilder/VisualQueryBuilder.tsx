// VisualQueryBuilder.tsx - POLISHED
import { Button } from "@/components/ui/button";
import { SelectedTable } from "../hooks/useQueryBuilder";
import { TableCard } from "./TableCard";

interface VisualQueryBuilderProps {
  selectedTables: SelectedTable[];
  onTableDrop: (e: React.DragEvent) => void;
  onRemoveTable: (idx: number) => void;
  onClearAll: () => void;
  onGenerateSQL: () => void;
}

export const VisualQueryBuilder = ({
  selectedTables,
  onTableDrop,
  onRemoveTable,
  onClearAll,
  onGenerateSQL,
}: VisualQueryBuilderProps) => {
  return (
    <div
      className="rounded-lg p-2.5 bg-slate-950/30 border border-slate-800"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onTableDrop}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-200">
          Visual Query Builder
        </h3>
        {selectedTables.length > 0 && (
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" onClick={onClearAll} className="h-7 text-xs px-2.5">
              Clear All
            </Button>
            <Button size="sm" onClick={onGenerateSQL} className="h-7 text-xs px-2.5">
              Generate SQL
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2.5 flex-nowrap overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 min-h-[70px] pb-1">
        {selectedTables.map((table, idx) => (
          <TableCard
            key={idx}
            table={table}
            index={idx}
            onRemove={onRemoveTable}
          />
        ))}
        {selectedTables.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
            Drag tables here to build your query
          </div>
        )}
      </div>
    </div>
  );
};