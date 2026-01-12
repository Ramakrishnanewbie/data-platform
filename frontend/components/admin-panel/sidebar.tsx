"use client";
import { Menu } from "@/components/admin-panel/menu";
import { SidebarToggle } from "@/components/admin-panel/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { PanelsTopLeft } from "lucide-react";
import Link from "next/link";
import { ProjectSelector } from "@/components/custom/project-selector";

export function Sidebar() {
  const sidebar = useStore(useSidebar, (x) => x);
  if (!sidebar) return null;
  const { isOpen, toggleOpen, getOpenState, setIsHover, settings } = sidebar;
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
        {/* Logo/Brand */}
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
        </Button>
        
        {/* Project/Team Selector */}
        <div className="flex-shrink-0">
          <ProjectSelector isOpen={getOpenState()} />
        </div>
        
        {/* Navigation Menu - Scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto -mx-3 px-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <Menu isOpen={getOpenState()} />
        </div>
      </div>
    </aside>
  );
}