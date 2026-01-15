"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QueryList } from "../../components/query-list";
import { Query } from "../../components/query-card";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { ContentLayout } from "@/components/admin-panel/content-layout";
// Mock data - starred queries (could be personal or team)
const mockStarredQueries: Query[] = [
  {
    id: "1",
    name: "Monthly Revenue Report",
    description: "Calculates total revenue by month for the current fiscal year",
    sql_content: `SELECT
  DATE_TRUNC(order_date, MONTH) as month,
  SUM(amount) as revenue
FROM \`project.dataset.orders\`
WHERE EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM CURRENT_DATE())
GROUP BY 1
ORDER BY 1 DESC`,
    visibility: "team",
    tags: ["revenue", "monthly", "finance"],
    run_count: 47,
    last_run_at: "2024-01-14T10:30:00Z",
    created_by: {
      id: "user-1",
      name: "You",
      avatar_url: null,
    },
    created_at: "2024-01-01T09:00:00Z",
    updated_at: "2024-01-14T10:30:00Z",
    is_starred: true,
  },
  {
    id: "3",
    name: "Daily Active Users",
    description: "Counts unique active users per day for the last 30 days",
    sql_content: `SELECT
  DATE(event_timestamp) as date,
  COUNT(DISTINCT user_id) as dau
FROM \`project.dataset.events\`
WHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY 1
ORDER BY 1 DESC`,
    visibility: "team",
    tags: ["users", "engagement", "daily"],
    run_count: 89,
    last_run_at: "2024-01-14T08:00:00Z",
    created_by: {
      id: "user-1",
      name: "You",
      avatar_url: null,
    },
    created_at: "2023-12-15T11:00:00Z",
    updated_at: "2024-01-14T08:00:00Z",
    is_starred: true,
  },
  {
    id: "team-1",
    name: "Weekly Sales Summary",
    description: "Executive summary of weekly sales performance across all regions",
    sql_content: `SELECT
  DATE_TRUNC(order_date, WEEK) as week,
  region,
  SUM(amount) as revenue
FROM \`project.dataset.orders\` o
JOIN \`project.dataset.customers\` c ON o.customer_id = c.customer_id
GROUP BY 1, 2
ORDER BY 1 DESC`,
    visibility: "team",
    tags: ["sales", "weekly", "executive"],
    run_count: 156,
    last_run_at: "2024-01-14T09:00:00Z",
    created_by: {
      id: "user-2",
      name: "Sarah Chen",
      avatar_url: null,
    },
    created_at: "2023-11-15T10:00:00Z",
    updated_at: "2024-01-14T09:00:00Z",
    is_starred: true,
  },
  {
    id: "team-4",
    name: "Marketing Campaign ROI",
    description: "Calculates return on investment for each marketing campaign",
    sql_content: `SELECT
  mc.campaign_name,
  mc.channel,
  SAFE_DIVIDE(SUM(o.amount), mc.spend) as roi
FROM \`project.dataset.marketing_campaigns\` mc
LEFT JOIN \`project.dataset.orders\` o ON mc.campaign_id = o.campaign_id
GROUP BY 1, 2, mc.spend
ORDER BY roi DESC`,
    visibility: "team",
    tags: ["marketing", "roi", "campaigns"],
    run_count: 23,
    last_run_at: "2024-01-12T16:45:00Z",
    created_by: {
      id: "user-5",
      name: "Alex Rivera",
      avatar_url: null,
    },
    created_at: "2024-01-08T13:00:00Z",
    updated_at: "2024-01-12T16:45:00Z",
    is_starred: true,
  },
];

export default function StarredQueriesPage() {
  const router = useRouter();
  const [queries, setQueries] = useState<Query[]>(mockStarredQueries);

  const handleRunQuery = (query: Query) => {
    router.push(`/sql?query=${query.id}`);
  };

  const handleUnstarQuery = async (query: Query) => {
    setQueries((prev) => prev.filter((q) => q.id !== query.id));
    toast.success(`Removed "${query.name}" from starred`);
  };

  const handleForkQuery = (query: Query) => {
    toast.info(`Forking "${query.name}"...`);
  };

  const handleShareQuery = (query: Query) => {
    toast.info(`Share dialog for "${query.name}" coming soon!`);
  };

  return (
    <ContentLayout title="Starred Queries">
    <div className="container py-6 max-w-7xl">
      <QueryList
        queries={queries}
        showCreateButton={false}
        onRunQuery={handleRunQuery}
        onStarQuery={handleUnstarQuery}
        onForkQuery={handleForkQuery}
        onShareQuery={handleShareQuery}
        emptyMessage="No starred queries yet. Star queries to quickly access them here."
      />
    </div>
    </ContentLayout>
  );
}