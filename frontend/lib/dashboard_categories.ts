import { 
  PanelsTopLeft,
  ChevronDown,
  BarChart3,
  TrendingUp,
  PieChart
} from "lucide-react";

const DASHBOARD_CATEGORIES = [
  {
    name: "Analytics",
    icon: BarChart3,
    dashboards: [
      { name: "Overview", href: "/dashboards/analytics/overview" },
      { name: "User Behavior", href: "/dashboards/analytics/users" },
      { name: "Revenue Analysis", href: "/dashboards/analytics/revenue" },
    ],
  },
  {
    name: "Operations",
    icon: TrendingUp,
    dashboards: [
      { name: "Pipeline Health", href: "/dashboards/ops/pipeline-health" },
      { name: "Data Quality", href: "/dashboards/ops/data-quality" },
      { name: "Cost Analysis", href: "/dashboards/ops/costs" },
    ],
  },
  {
    name: "Business",
    icon: PieChart,
    dashboards: [
      { name: "Executive Summary", href: "/dashboards/business/executive" },
      { name: "KPIs", href: "/dashboards/business/kpis" },
      { name: "Forecasting", href: "/dashboards/business/forecast" },
    ],
  },
];

export { DASHBOARD_CATEGORIES };