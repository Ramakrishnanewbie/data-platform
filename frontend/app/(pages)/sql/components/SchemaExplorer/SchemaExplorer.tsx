import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, PanelLeftClose, PanelLeft } from "lucide-react";
import { useBigQuerySchema } from "../hooks/useBigQuerySchema";
import { DatasetItem } from "./DatasetItem";

interface SchemaExplorerProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onTableDragStart: (e: React.DragEvent, dataset: string, table: any) => void;
}

export const SchemaExplorer = ({
  collapsed,
  onToggleCollapse,
  onTableDragStart,
}: SchemaExplorerProps) => {
  const { datasets, loading, refetch } = useBigQuerySchema();

  return (
    <div className="h-full border rounded-lg p-4 bg-slate-950 relative">
      <Button
        size="icon"
        variant="ghost"
        onClick={onToggleCollapse}
        className="absolute top-2 right-2 h-8 w-8 z-10"
      >
        {collapsed ? (
          <PanelLeft className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </Button>

      {!collapsed && (
        <>
          <div className="flex items-center justify-between mb-4 pr-10">
            <h3 className="text-sm font-semibold text-slate-200">
              Datasets & Tables
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={refetch}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
          <ScrollArea className="h-[calc(100%-3rem)]">
            {loading ? (
              <div className="text-center py-8 text-slate-500">
                Loading schema...
              </div>
            ) : datasets.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No datasets found
              </div>
            ) : (
              datasets.map((dataset) => (
                <DatasetItem
                  key={dataset.name}
                  dataset={dataset}
                  onTableDragStart={onTableDragStart}
                />
              ))
            )}
          </ScrollArea>
        </>
      )}
    </div>
  );
};