"use client";
import { useState } from "react";
import { Menu } from "@/components/admin-panel/menu";
import { SidebarToggle } from "@/components/admin-panel/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { 
  PanelsTopLeft,
  ChevronDown,
  BarChart3,
  TrendingUp,
  PieChart
} from "lucide-react";
import Link from "next/link";
import { ProjectSelector } from "@/components/custom/project-selector";
import { DASHBOARD_CATEGORIES } from "@/lib/dashboard_categories";


export function Sidebar() {
  const sidebar = useStore(useSidebar, (x) => x);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["Analytics"])
  );

  if (!sidebar) return null;
  const { isOpen, toggleOpen, getOpenState, setIsHover, settings } = sidebar;

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300",
        !getOpenState() ? "w-[90px]" : "w-72",
        settings.disabled && "hidden"
      )}
    >
      <SidebarToggle isOpen={isOpen} setIsOpen={toggleOpen} />
      <div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="relative h-full flex flex-col px-3 py-4 shadow-md dark:shadow-zinc-800"
      >
        {/* Logo/Brand
        <Button
          className={cn(
            "transition-transform ease-in-out duration-300 mb-4 flex-shrink-0",
            !getOpenState() ? "translate-x-1" : "translate-x-0"
          )}
          variant="link"
          asChild
        >
          <Link href="/dashboard" className="flex items-center gap-2">
            <PanelsTopLeft className="w-6 h-6" />
            {getOpenState() && <span className="font-semibold text-lg">Data Platform</span>}
          </Link>
        </Button> */}
        
        {/* Project/Team Selector */}
        <div className="flex-shrink-0 mb-4">
          <ProjectSelector isOpen={getOpenState()} />
        </div>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto -mx-3 px-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Dashboard Categories */}
          <div className="space-y-1 px-2">
            {!getOpenState() ? (
              // Collapsed - icons only
              <div className="space-y-1">
                {DASHBOARD_CATEGORIES.map((category) => (
                  <Button
                    key={category.name}
                    variant="ghost"
                    className="w-full h-10 justify-center"
                    title={category.name}
                  >
                    <category.icon className="h-[18px] w-[18px]" />
                  </Button>
                ))}
              </div>
            ) : (
              // Expanded - full categories
              <>
                <p className="text-sm font-medium text-muted-foreground px-4 pb-2 max-w-[248px] truncate">
                  Dashboards
                </p>
                {DASHBOARD_CATEGORIES.map((category) => {
                  const isExpanded = expandedCategories.has(category.name);
                  const Icon = category.icon;
                  
                  return (
                    <div key={category.name} className="w-full">
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-10 mb-1"
                        onClick={() => toggleCategory(category.name)}
                      >
                        <span className="mr-4">
                          <Icon size={18} />
                        </span>
                        <span className="max-w-[200px] truncate flex-1 text-left">
                          {category.name}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform ml-auto",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </Button>
                      
                      {isExpanded && (
                        <div className="ml-10 space-y-1 mb-1">
                          {category.dashboards.map((dashboard) => (
                            <Link key={dashboard.href} href={dashboard.href}>
                              <Button
                                variant="ghost"
                                className="w-full justify-start h-9 text-sm font-normal text-muted-foreground hover:text-foreground"
                              >
                                {dashboard.name}
                              </Button>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
          
          {/* Navigation Menu */}
          <Menu isOpen={getOpenState()} />
        </div>
      </div>
    </aside>
  );
}