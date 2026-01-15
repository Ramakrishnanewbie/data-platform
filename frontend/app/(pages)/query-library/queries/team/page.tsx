"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QueryList } from "../../components/query-list";
import { Query } from "../../components/query-card";
import { toast } from "sonner";
import { ContentLayout } from "@/components/admin-panel/content-layout";


// Mock data - team queries from all workspace members
const mockTeamQueries: Query[] = [
  {
    id: "team-1",
    name: "Weekly Sales Summary",
    description: "Executive summary of weekly sales performance across all regions",
    sql_content: `SELECT
  DATE_TRUNC(order_date, WEEK) as week,
  region,
  SUM(amount) as revenue,
  COUNT(*) as order_count,
  AVG(amount) as avg_order_value
FROM \`project.dataset.orders\` o
JOIN \`project.dataset.customers\` c ON o.customer_id = c.customer_id
WHERE order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 WEEK)
GROUP BY 1, 2
ORDER BY 1 DESC, revenue DESC`,
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
    id: "team-2",
    name: "Customer Churn Analysis",
    description: "Identifies customers who haven't ordered in 90+ days",
    sql_content: `WITH customer_last_order AS (
  SELECT
    customer_id,
    MAX(order_date) as last_order_date
  FROM \`project.dataset.orders\`
  GROUP BY 1
)
SELECT
  c.customer_id,
  c.customer_name,
  c.email,
  clo.last_order_date,
  DATE_DIFF(CURRENT_DATE(), clo.last_order_date, DAY) as days_since_last_order
FROM \`project.dataset.customers\` c
JOIN customer_last_order clo ON c.customer_id = clo.customer_id
WHERE DATE_DIFF(CURRENT_DATE(), clo.last_order_date, DAY) > 90
ORDER BY days_since_last_order DESC`,
    visibility: "team",
    tags: ["churn", "customers", "retention"],
    run_count: 34,
    last_run_at: "2024-01-13T14:20:00Z",
    created_by: {
      id: "user-3",
      name: "Mike Johnson",
      avatar_url: null,
    },
    created_at: "2024-01-02T11:30:00Z",
    updated_at: "2024-01-13T14:20:00Z",
    is_starred: false,
  },
  {
    id: "team-3",
    name: "Inventory Levels by Warehouse",
    description: "Current stock levels across all warehouses with reorder alerts",
    sql_content: `SELECT
  w.warehouse_name,
  p.product_name,
  p.category,
  i.quantity_on_hand,
  i.reorder_point,
  CASE WHEN i.quantity_on_hand <= i.reorder_point THEN 'REORDER' ELSE 'OK' END as status
FROM \`project.dataset.inventory\` i
JOIN \`project.dataset.warehouses\` w ON i.warehouse_id = w.warehouse_id
JOIN \`project.dataset.products\` p ON i.product_id = p.product_id
ORDER BY w.warehouse_name, status DESC, p.category`,
    visibility: "team",
    tags: ["inventory", "warehouse", "operations"],
    run_count: 78,
    last_run_at: "2024-01-14T07:00:00Z",
    created_by: {
      id: "user-4",
      name: "Lisa Park",
      avatar_url: null,
    },
    created_at: "2023-12-20T09:00:00Z",
    updated_at: "2024-01-14T07:00:00Z",
    is_starred: false,
  },
  {
    id: "team-4",
    name: "Marketing Campaign ROI",
    description: "Calculates return on investment for each marketing campaign",
    sql_content: `SELECT
  mc.campaign_name,
  mc.channel,
  mc.spend,
  COUNT(DISTINCT o.order_id) as attributed_orders,
  SUM(o.amount) as attributed_revenue,
  SAFE_DIVIDE(SUM(o.amount), mc.spend) as roi
FROM \`project.dataset.marketing_campaigns\` mc
LEFT JOIN \`project.dataset.attribution\` a ON mc.campaign_id = a.campaign_id
LEFT JOIN \`project.dataset.orders\` o ON a.order_id = o.order_id
WHERE mc.start_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
GROUP BY 1, 2, 3
ORDER BY roi DESC NULLS LAST`,
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

export default function TeamQueriesPage() {
  const router = useRouter();
  const [queries, setQueries] = useState<Query[]>(mockTeamQueries);

  const handleRunQuery = (query: Query) => {
    router.push(`/sql?query=${query.id}`);
  };

  const handleStarQuery = async (query: Query) => {
    setQueries((prev) =>
      prev.map((q) =>
        q.id === query.id ? { ...q, is_starred: !q.is_starred } : q
      )
    );
    toast.success(query.is_starred ? "Removed from starred" : "Added to starred");
  };

  const handleForkQuery = (query: Query) => {
    toast.info(`Forking "${query.name}" to your queries...`);
    // Create a copy in user's personal queries
  };

  const handleShareQuery = (query: Query) => {
    toast.info(`Share dialog for "${query.name}" coming soon!`);
  };

  return (
    <ContentLayout title="Team Queries">
    <div className="container py-6 max-w-7xl">
      <QueryList
        queries={queries}
        showCreateButton={false}
        onRunQuery={handleRunQuery}
        onStarQuery={handleStarQuery}
        onForkQuery={handleForkQuery}
        onShareQuery={handleShareQuery}
        emptyMessage="No team queries shared yet"
      />
    </div>
    </ContentLayout>
  );
}