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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-2">
      <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-slate-800 rounded text-sm">
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <Database className="h-4 w-4 text-blue-400" />
        <span className="text-slate-300">{dataset.name}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6 mt-1">
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