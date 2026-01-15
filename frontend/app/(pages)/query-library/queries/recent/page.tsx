"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Play,
  Copy,
  Save,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ContentLayout } from "@/components/admin-panel/content-layout";


interface QueryHistoryItem {
  id: string;
  sql_content: string;
  executed_at: string;
  duration_ms: number | null;
  row_count: number | null;
  bytes_processed: number | null;
  status: "running" | "success" | "error" | "cancelled";
  error_message: string | null;
  query_name: string | null; // If linked to saved query
  query_id: string | null;
}

// Mock data
const mockHistory: QueryHistoryItem[] = [
  {
    id: "hist-1",
    sql_content: `SELECT DATE_TRUNC(order_date, MONTH) as month, SUM(amount) as revenue FROM orders GROUP BY 1 ORDER BY 1 DESC`,
    executed_at: "2024-01-14T10:30:00Z",
    duration_ms: 2340,
    row_count: 12,
    bytes_processed: 15728640,
    status: "success",
    error_message: null,
    query_name: "Monthly Revenue Report",
    query_id: "1",
  },
  {
    id: "hist-2",
    sql_content: `SELECT * FROM customers WHERE region = 'APAC' LIMIT 100`,
    executed_at: "2024-01-14T10:25:00Z",
    duration_ms: 890,
    row_count: 100,
    bytes_processed: 5242880,
    status: "success",
    error_message: null,
    query_name: null,
    query_id: null,
  },
  {
    id: "hist-3",
    sql_content: `SELECT product_id, COUNT(*) as sales FROM order_items GROUP BY 1 HAVING sales > 1000`,
    executed_at: "2024-01-14T10:20:00Z",
    duration_ms: null,
    row_count: null,
    bytes_processed: null,
    status: "error",
    error_message: "Column 'sales' not found in HAVING clause. Did you mean to use an alias?",
    query_name: null,
    query_id: null,
  },
  {
    id: "hist-4",
    sql_content: `SELECT DATE(event_timestamp) as date, COUNT(DISTINCT user_id) as dau FROM events WHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY) GROUP BY 1`,
    executed_at: "2024-01-14T10:15:00Z",
    duration_ms: 4560,
    row_count: 30,
    bytes_processed: 104857600,
    status: "success",
    error_message: null,
    query_name: "Daily Active Users",
    query_id: "3",
  },
  {
    id: "hist-5",
    sql_content: `SELECT * FROM very_large_table`,
    executed_at: "2024-01-14T10:10:00Z",
    duration_ms: null,
    row_count: null,
    bytes_processed: null,
    status: "cancelled",
    error_message: "Query cancelled by user",
    query_name: null,
    query_id: null,
  },
];

const formatBytes = (bytes: number | null): string => {
  if (bytes === null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const formatDuration = (ms: number | null): string => {
  if (ms === null) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const statusConfig = {
  running: { icon: Loader2, label: "Running", className: "text-blue-500" },
  success: { icon: CheckCircle2, label: "Success", className: "text-green-500" },
  error: { icon: XCircle, label: "Error", className: "text-red-500" },
  cancelled: { icon: Clock, label: "Cancelled", className: "text-yellow-500" },
};

export default function RecentQueriesPage() {
  const router = useRouter();
  const [history, setHistory] = useState<QueryHistoryItem[]>(mockHistory);
  const [search, setSearch] = useState("");

  const filteredHistory = history.filter(
    (item) =>
      item.sql_content.toLowerCase().includes(search.toLowerCase()) ||
      item.query_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRunAgain = (item: QueryHistoryItem) => {
    // Navigate to SQL editor with this query
    router.push(`/sql?sql=${encodeURIComponent(item.sql_content)}`);
  };

  const handleCopySQL = (item: QueryHistoryItem) => {
    navigator.clipboard.writeText(item.sql_content);
    toast.success("SQL copied to clipboard");
  };

  const handleSaveQuery = (item: QueryHistoryItem) => {
    // Open save dialog or navigate to SQL editor with save modal open
    router.push(`/sql?sql=${encodeURIComponent(item.sql_content)}&save=true`);
  };

  return (
    <ContentLayout title="Recent Queries">
    <div className="container py-6 max-w-7xl">
      
      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search history..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* History Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Query</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Rows</TableHead>
              <TableHead>Data Processed</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No query history found
                </TableCell>
              </TableRow>
            ) : (
              filteredHistory.map((item) => {
                const StatusIcon = statusConfig[item.status].icon;
                return (
                  <TableRow key={item.id}>
                    {/* Query */}
                    <TableCell>
                      <div className="space-y-1">
                        {item.query_name && (
                          <div className="font-medium text-sm">{item.query_name}</div>
                        )}
                        <pre className="text-xs text-muted-foreground font-mono truncate max-w-[400px]">
                          {item.sql_content}
                        </pre>
                        {item.status === "error" && item.error_message && (
                          <p className="text-xs text-red-500 truncate max-w-[400px]">
                            {item.error_message}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <StatusIcon
                          className={cn(
                            "h-4 w-4",
                            statusConfig[item.status].className,
                            item.status === "running" && "animate-spin"
                          )}
                        />
                        <span className="text-sm">{statusConfig[item.status].label}</span>
                      </div>
                    </TableCell>

                    {/* Duration */}
                    <TableCell className="text-sm">
                      {formatDuration(item.duration_ms)}
                    </TableCell>

                    {/* Rows */}
                    <TableCell className="text-sm">
                      {item.row_count?.toLocaleString() ?? "-"}
                    </TableCell>

                    {/* Bytes */}
                    <TableCell className="text-sm">
                      {formatBytes(item.bytes_processed)}
                    </TableCell>

                    {/* Time */}
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(item.executed_at), { addSuffix: true })}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRunAgain(item)}>
                            <Play className="h-4 w-4 mr-2" />
                            Run Again
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopySQL(item)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy SQL
                          </DropdownMenuItem>
                          {!item.query_id && (
                            <DropdownMenuItem onClick={() => handleSaveQuery(item)}>
                              <Save className="h-4 w-4 mr-2" />
                              Save Query
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
    </ContentLayout>
  );
}