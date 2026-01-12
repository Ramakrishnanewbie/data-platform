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
  BarChart3
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
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
          label: "SQL",
          icon: Database,
          active: pathname.startsWith("/sql")
        },
        {
          href: "/data-lineage",
          label: "Data Lineage",
          icon: GitBranch,
          active: pathname.startsWith("/datalineage")
        },
        {
          href: "/data-catalog",
          label: "Data Catalog",
          icon: BookOpen,
          active: pathname.startsWith("/datacatalog")
        },
        {
          href: "/ai-chat",
          label: "AI Chat",
          icon: MessageSquare,
          active: pathname.startsWith("/aichat")
        },
        
      ]
    }
  ];
}