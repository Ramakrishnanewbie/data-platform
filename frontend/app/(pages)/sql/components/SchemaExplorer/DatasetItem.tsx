// DatasetItem.tsx - POLISHED
import { useState } from "react";
import { Database, ChevronRight, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BigQueryDataset } from "../hooks/useBigQuerySchema";
import { TableItem } from "./TableItem";

interface DatasetItemProps {
  dataset: BigQueryDataset;
  onTableDragStart: (e: React.DragEvent, dataset: string, table: any) => void;
}

export const DatasetItem = ({ dataset, onTableDragStart }: DatasetItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-1.5">
      <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-slate-800 rounded-md text-sm transition-colors">
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        )}
        <Database className="h-3.5 w-3.5 text-blue-400" />
        <span className="text-sm text-slate-300">{dataset.name}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-5 mt-1 space-y-0.5">
        {dataset.tables.map((table) => (
          <TableItem
            key={table.name}
            table={table}
            datasetName={dataset.name}
            onDragStart={onTableDragStart}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};