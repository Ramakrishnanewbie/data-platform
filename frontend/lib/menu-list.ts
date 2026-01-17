import {
  Tag,
  Users,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid,
  LucideIcon,
  Database,
  GitBranch,
  BookOpen,
  MessageSquare,
  BarChart3,
  Library,
  FolderOpen,
  Star,
  Share2,
  Table,
  FileText,
  Compass,
  Bell,
  Shield,
  Clock,
  LayoutDashboard,
  Plus,
  Globe
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  icon?: LucideIcon;
  active?: boolean;
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "Data Platform",
      menus: [
        {
          href: "/sql",
          label: "SQL Editor",
          icon: Database,
          active: pathname.startsWith("/sql")
        },
        {
          href: "/query-library",
          label: "Query Library",
          icon: Library,
          active: pathname.startsWith("/query-library"),
          submenus: [
            { href: "/query-library/queries/mine", label: "My Queries", icon: FolderOpen },
            { href: "/query-library/queries/team", label: "Team Queries", icon: Users },
            { href: "/query-library/queries/starred", label: "Starred", icon: Star },
            { href: "/query-library/queries/recent", label: "Recent", icon: Clock },
          ]
        },
        {
          href: "/dashboards",
          label: "Dashboard Hub",
          icon: LayoutDashboard,
          active: pathname.startsWith("/dashboards"),
          submenus: [
            { href: "/dashboards/mine", label: "My Dashboards", icon: FolderOpen },
            { href: "/dashboards/shared", label: "Shared with Me", icon: Share2 },
            { href: "/dashboards/team", label: "Team Dashboards", icon: Users },
            { href: "/dashboards/public", label: "Public Dashboards", icon: Globe },
            { href: "/dashboards/create", label: "Create Dashboard", icon: Plus },
          ]
        },
        {
          href: "/data-catalog",
          label: "Data Catalog",
          icon: BookOpen,
          active: pathname.startsWith("/data-catalog"),
          submenus: [
            { href: "/data-catalog/tables", label: "Tables", icon: Table },
            { href: "/data-catalog/glossary", label: "Glossary", icon: FileText },
          ]
        },
        {
          href: "/data-lineage",
          label: "Data Lineage",
          icon: GitBranch,
          active: pathname.startsWith("/data-lineage")
        },
        {
          href: "/explorations",
          label: "Explorations",
          icon: Compass,
          active: pathname.startsWith("/explorations")
        },
        {
          href: "/ai-chat",
          label: "AI Chat",
          icon: MessageSquare,
          active: pathname.startsWith("/ai-chat")
        },
      ]
    },
    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/alerts",
          label: "Alerts",
          icon: Bell,
          active: pathname.startsWith("/alerts")
        },
        {
          href: "/settings",
          label: "Settings",
          icon: Settings,
          active: pathname.startsWith("/settings"),
          submenus: [
            { href: "/settings/profile", label: "Profile", icon: Users },
            { href: "/settings/team", label: "Team", icon: Users },
            { href: "/settings/permissions", label: "Permissions", icon: Shield },
          ]
        },
      ]
    }
  ];
}