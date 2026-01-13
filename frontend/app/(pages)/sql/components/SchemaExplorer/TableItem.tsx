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
      className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded cursor-move text-sm mb-1"
    >
      <Table2 className="h-3 w-3 text-green-400" />
      <span className="text-slate-400">{table.name}</span>
    </div>
  );
};