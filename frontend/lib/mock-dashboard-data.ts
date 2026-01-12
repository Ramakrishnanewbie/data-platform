// lib/mock-dashboard-data.ts

export type ChartType = 'line' | 'bar' | 'area' | 'donut';

export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  description?: string;
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
}

export interface DashboardConfig {
  id: string;
  name: string;
  charts: ChartConfig[];
}

export const mockDashboardData: DashboardConfig = {
  id: "dash-1",
  name: "Sales Overview",
  charts: [
    {
      id: "chart-1",
      type: "line",
      title: "Monthly Revenue",
      description: "Revenue trends over the past 6 months",
      data: [
        { month: "Jan", revenue: 45000, costs: 32000 },
        { month: "Feb", revenue: 52000, costs: 35000 },
        { month: "Mar", revenue: 48000, costs: 33000 },
        { month: "Apr", revenue: 61000, costs: 38000 },
        { month: "May", revenue: 55000, costs: 36000 },
        { month: "Jun", revenue: 67000, costs: 40000 },
      ],
      index: "month",
      categories: ["revenue", "costs"],
      colors: ["indigo", "rose"]
    },
    {
      id: "chart-2",
      type: "bar",
      title: "Sales by Region",
      description: "Q2 2024 regional performance",
      data: [
        { region: "North", sales: 23000 },
        { region: "South", sales: 31000 },
        { region: "East", sales: 28000 },
        { region: "West", sales: 42000 },
      ],
      index: "region",
      categories: ["sales"],
      colors: ["blue"]
    },
    {
      id: "chart-3",
      type: "area",
      title: "User Growth",
      description: "Active users over time",
      data: [
        { date: "Week 1", users: 1200 },
        { date: "Week 2", users: 1350 },
        { date: "Week 3", users: 1580 },
        { date: "Week 4", users: 1820 },
        { date: "Week 5", users: 2100 },
        { date: "Week 6", users: 2350 },
      ],
      index: "date",
      categories: ["users"],
      colors: ["emerald"]
    },
    {
      id: "chart-4",
      type: "donut",
      title: "Customer Segments",
      description: "Distribution by customer type",
      data: [
        { name: "Enterprise", value: 4500 },
        { name: "SMB", value: 3200 },
        { name: "Startup", value: 2100 },
        { name: "Individual", value: 1800 },
      ],
      index: "name",
      categories: ["value"],
      colors: ["violet", "indigo", "blue", "cyan"]
    }
  ]
};