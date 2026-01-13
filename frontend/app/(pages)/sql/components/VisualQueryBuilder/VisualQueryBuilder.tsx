// app/(pages)/sql/components/VisualQueryBuilder/VisualQueryBuilder.tsx - NO SCROLL, SMOOTH
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
      className="rounded-lg p-2 bg-slate-950/30 border border-slate-800"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onTableDrop}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-slate-200">
          Visual Query Builder
        </h3>
        {selectedTables.length > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onClearAll} className="h-7 text-xs">
              Clear All
            </Button>
            <Button size="sm" onClick={onGenerateSQL} className="h-7 text-xs">
              Generate SQL
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-nowrap overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 min-h-[60px]">
        {selectedTables.map((table, idx) => (
          <TableCard
            key={idx}
            table={table}
            index={idx}
            onRemove={onRemoveTable}
          />
        ))}
        {selectedTables.length === 0 && (
          <div className="text-center w-full text-slate-500 py-4 text-xs">
            Drag tables here to build your query
          </div>
        )}
      </div>
    </div>
  );
};