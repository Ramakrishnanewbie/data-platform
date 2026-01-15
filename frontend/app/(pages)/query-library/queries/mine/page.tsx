"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QueryList } from "../../components/query-list";
import { Query } from "../../components/query-card";
import { toast } from "sonner";
import { ContentLayout } from "@/components/admin-panel/content-layout";
// Mock data - replace with actual API calls
const mockQueries: Query[] = [
  {
    id: "1",
    name: "Monthly Revenue Report",
    description: "Calculates total revenue by month for the current fiscal year",
    sql_content: `SELECT
  DATE_TRUNC(order_date, MONTH) as month,
  SUM(amount) as revenue,
  COUNT(DISTINCT customer_id) as unique_customers
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
    id: "2",
    name: "Top Customers by Spend",
    description: "Identifies top 10 customers based on total order value",
    sql_content: `SELECT
  c.customer_id,
  c.customer_name,
  c.email,
  SUM(o.amount) as total_spend,
  COUNT(o.order_id) as order_count
FROM \`project.dataset.customers\` c
JOIN \`project.dataset.orders\` o ON c.customer_id = o.customer_id
GROUP BY 1, 2, 3
ORDER BY total_spend DESC
LIMIT 10`,
    visibility: "private",
    tags: ["customers", "analysis"],
    run_count: 12,
    last_run_at: "2024-01-12T15:45:00Z",
    created_by: {
      id: "user-1",
      name: "You",
      avatar_url: null,
    },
    created_at: "2024-01-05T14:00:00Z",
    updated_at: "2024-01-12T15:45:00Z",
    is_starred: false,
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
  AND event_name = 'page_view'
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
    id: "4",
    name: "Product Sales by Category",
    description: null,
    sql_content: `SELECT
  p.category,
  SUM(oi.quantity) as units_sold,
  SUM(oi.quantity * oi.unit_price) as revenue
FROM \`project.dataset.order_items\` oi
JOIN \`project.dataset.products\` p ON oi.product_id = p.product_id
GROUP BY 1
ORDER BY revenue DESC`,
    visibility: "private",
    tags: ["products", "sales"],
    run_count: 5,
    last_run_at: null,
    created_by: {
      id: "user-1",
      name: "You",
      avatar_url: null,
    },
    created_at: "2024-01-13T16:30:00Z",
    updated_at: "2024-01-13T16:30:00Z",
    is_starred: false,
  },
];

export default function MyQueriesPage() {
  const router = useRouter();
  const [queries, setQueries] = useState<Query[]>(mockQueries);

  const handleCreateQuery = () => {
    // Navigate to SQL editor to create new query
    router.push("/sql");
  };

  const handleCreateFolder = () => {
    toast.info("Create folder dialog coming soon!");
  };

  const handleRunQuery = (query: Query) => {
    // Navigate to SQL editor with this query loaded
    router.push(`/sql?query=${query.id}`);
  };

  const handleStarQuery = async (query: Query) => {
    // Toggle star status
    setQueries((prev) =>
      prev.map((q) =>
        q.id === query.id ? { ...q, is_starred: !q.is_starred } : q
      )
    );
    toast.success(query.is_starred ? "Removed from starred" : "Added to starred");
  };

  const handleForkQuery = (query: Query) => {
    toast.info(`Forking "${query.name}"...`);
    // Create a copy and navigate to it
  };

  const handleEditQuery = (query: Query) => {
    router.push(`/queries/${query.id}/edit`);
  };

  const handleDeleteQuery = async (query: Query) => {
    // In real app, show confirmation dialog first
    setQueries((prev) => prev.filter((q) => q.id !== query.id));
    toast.success(`Deleted "${query.name}"`);
  };

  const handleShareQuery = (query: Query) => {
    toast.info(`Share dialog for "${query.name}" coming soon!`);
  };

  return (
    <ContentLayout title="My Queries">
    <div className="container py-6 max-w-7xl">
      <QueryList
        queries={queries}
        onCreateQuery={handleCreateQuery}
        onCreateFolder={handleCreateFolder}
        onRunQuery={handleRunQuery}
        onStarQuery={handleStarQuery}
        onForkQuery={handleForkQuery}
        onEditQuery={handleEditQuery}
        onDeleteQuery={handleDeleteQuery}
        onShareQuery={handleShareQuery}
        emptyMessage="You haven't saved any queries yet"
      />
    </div>
    </ContentLayout>
  );
}