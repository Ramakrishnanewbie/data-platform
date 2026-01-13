// TableItem.tsx - POLISHED
import { Table2 } from "lucide-react";
import { BigQueryTable } from "../hooks/useBigQuerySchema";

interface TableItemProps {
  table: BigQueryTable;
  datasetName: string;
  onDragStart: (e: React.DragEvent, dataset: string, table: BigQueryTable) => void;
}

export const TableItem = ({ table, datasetName, onDragStart }: TableItemProps) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, datasetName, table)}
      className="flex items-center gap-2 p-1.5 hover:bg-slate-800 rounded-md cursor-move text-sm transition-colors"
    >
      <Table2 className="h-3 w-3 text-green-400 flex-shrink-0" />
      <span className="text-sm text-slate-400">{table.name}</span>
    </div>
  );
};