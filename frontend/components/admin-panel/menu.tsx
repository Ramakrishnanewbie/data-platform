"use client";

import Link from "next/link";
import { Ellipsis, LogOut, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { getMenuList } from "@/lib/menu-list";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip";

interface MenuProps {
  isOpen: boolean | undefined;
}

interface FlyoutPosition {
  top: number;
  left: number;
}

export function Menu({ isOpen }: MenuProps) {
  const pathname = usePathname();
  const menuList = getMenuList(pathname);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [flyoutPosition, setFlyoutPosition] = useState<FlyoutPosition>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // For portal - need to wait for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = useCallback((menuId: string) => {
    // Clear any pending close
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    const triggerEl = triggerRefs.current[menuId];
    if (triggerEl) {
      const rect = triggerEl.getBoundingClientRect();
      setFlyoutPosition({
        top: rect.top,
        left: rect.right + 8,
      });
    }
    setHoveredMenu(menuId);
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Delay closing to allow cursor to move to flyout
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredMenu(null);
    }, 100);
  }, []);

  const handleFlyoutMouseEnter = useCallback(() => {
    // Cancel the close timeout when entering flyout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const handleFlyoutMouseLeave = useCallback(() => {
    // Close when leaving flyout
    setHoveredMenu(null);
  }, []);

  // Find the current submenu items for the hovered menu
  const getHoveredSubmenu = () => {
    if (!hoveredMenu) return null;
    
    for (const group of menuList) {
      for (let i = 0; i < group.menus.length; i++) {
        const menu = group.menus[i];
        const menuId = `${menuList.indexOf(group)}-${i}`;
        if (menuId === hoveredMenu && menu.submenus) {
          return { label: menu.label, submenus: menu.submenus };
        }
      }
    }
    return null;
  };

  const hoveredSubmenu = getHoveredSubmenu();

  return (
    <>
      <ScrollArea className="[&>div>div[style]]:!block">
        <nav className="mt-8 h-full w-full">
          <ul className="flex flex-col min-h-[calc(100vh-48px-36px-16px-32px)] lg:min-h-[calc(100vh-32px-40px-32px)] items-start space-y-1 px-2">
            {menuList.map(({ groupLabel, menus }, index) => (
              <li className={cn("w-full", groupLabel ? "pt-5" : "")} key={index}>
                {/* Group Label */}
                {(isOpen && groupLabel) || isOpen === undefined ? (
                  <p className="text-sm font-medium text-muted-foreground px-4 pb-2 max-w-[248px] truncate">
                    {groupLabel}
                  </p>
                ) : !isOpen && isOpen !== undefined && groupLabel ? (
                  <TooltipProvider>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger className="w-full">
                        <div className="w-full flex justify-center items-center">
                          <Ellipsis className="h-5 w-5" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{groupLabel}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <p className="pb-2"></p>
                )}

                {/* Menu Items */}
                <div className="flex flex-col gap-1">
                  {menus.map(
                    ({ href, label, icon: Icon, active, submenus }, menuIndex) => {
                      const isActive =
                        active === undefined ? pathname.startsWith(href) : active;
                      const menuId = `${index}-${menuIndex}`;
                      const hasSubmenus = submenus && submenus.length > 0;

                      // No submenus - direct link (same as before)
                      if (!hasSubmenus) {
                        return (
                          <div className="w-full relative" key={menuIndex}>
                            {/*
                              VISUAL IMPROVEMENTS:
                              - Added relative positioning for active indicator
                              - Animated left border appears on active state
                              - Smooth slide-in animation for premium feel
                            */}
                            {isActive && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-pink-500 rounded-r-full animate-in slide-in-from-left duration-300" />
                            )}
                            <TooltipProvider disableHoverableContent>
                              <Tooltip delayDuration={100}>
                                <TooltipTrigger asChild>
                                  {/*
                                    VISUAL IMPROVEMENTS:
                                    - hover-lift: Subtle upward movement on hover (-2px translateY)
                                    - active-scale: Press down effect (0.98 scale)
                                    - transition-all duration-200: Smooth state changes
                                    - Group hover for icon color change
                                    - Psychology: Tactile feedback = responsive, premium UI
                                  */}
                                  <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={cn(
                                      "w-full justify-start h-10 mb-1 hover-lift active-scale group",
                                      isActive && "elevation-xs"
                                    )}
                                    asChild
                                  >
                                    <Link href={href}>
                                      <span
                                        className={cn(
                                          "transition-colors duration-200",
                                          isOpen === false ? "" : "mr-4",
                                          isActive ? "text-violet-400" : "group-hover:text-violet-400"
                                        )}
                                      >
                                        <Icon size={18} />
                                      </span>
                                      <p
                                        className={cn(
                                          "max-w-[200px] truncate transition-all duration-200",
                                          isOpen === false
                                            ? "-translate-x-96 opacity-0"
                                            : "translate-x-0 opacity-100",
                                          isActive && "font-medium"
                                        )}
                                      >
                                        {label}
                                      </p>
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                {isOpen === false && (
                                  <TooltipContent side="right">
                                    {label}
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        );
                      }

                      // Has submenus - trigger for flyout
                      return (
                        <div
                          key={menuIndex}
                          ref={(el) => { triggerRefs.current[menuId] = el; }}
                          className="w-full relative"
                          onMouseEnter={() => handleMouseEnter(menuId)}
                          onMouseLeave={handleMouseLeave}
                        >
                          {/* Animated active indicator for submenu parent */}
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-pink-500 rounded-r-full animate-in slide-in-from-left duration-300" />
                          )}
                          {/*
                            VISUAL IMPROVEMENTS:
                            - hover-lift active-scale: Same tactile feedback as regular menu items
                            - Icon color transition on hover
                            - Smooth chevron rotation
                          */}
                          <Button
                            variant={isActive ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-start h-10 mb-1 hover-lift active-scale group",
                              hoveredMenu === menuId && "bg-accent",
                              isActive && "elevation-xs"
                            )}
                          >
                            <span
                              className={cn(
                                "transition-colors duration-200",
                                isOpen === false ? "" : "mr-4",
                                isActive ? "text-violet-400" : "group-hover:text-violet-400"
                              )}
                            >
                              <Icon size={18} />
                            </span>
                            <p
                              className={cn(
                                "max-w-[200px] truncate flex-1 text-left transition-all duration-200",
                                isOpen === false
                                  ? "-translate-x-96 opacity-0"
                                  : "translate-x-0 opacity-100",
                                isActive && "font-medium"
                              )}
                            >
                              {label}
                            </p>
                            {isOpen !== false && (
                              <ChevronRight
                                size={16}
                                className={cn(
                                  "ml-auto transition-all duration-300 ease-out",
                                  hoveredMenu === menuId && "rotate-90 text-violet-400"
                                )}
                              />
                            )}
                          </Button>
                        </div>
                      );
                    }
                  )}
                </div>
              </li>
            ))}

            {/* Sign out button at bottom
            <li className="w-full grow flex items-end">
              <TooltipProvider disableHoverableContent>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => {}}
                      variant="outline"
                      className="w-full justify-center h-10 mt-5"
                    >
                      <span className={cn(isOpen === false ? "" : "mr-4")}>
                        <LogOut size={18} />
                      </span>
                      <p
                        className={cn(
                          "whitespace-nowrap",
                          isOpen === false ? "opacity-0 hidden" : "opacity-100"
                        )}
                      >
                        Sign out
                      </p>
                    </Button>
                  </TooltipTrigger>
                  {isOpen === false && (
                    <TooltipContent side="right">Sign out</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </li> */}
          </ul>
        </nav>
      </ScrollArea>

      {/* Flyout rendered via Portal - outside sidebar container */}
      {mounted && hoveredMenu && hoveredSubmenu && createPortal(
        <div
          className="fixed animate-in fade-in-0 zoom-in-95 slide-in-from-left-2 duration-200"
          style={{
            top: flyoutPosition.top,
            left: flyoutPosition.left,
            zIndex: 9999,
          }}
          onMouseEnter={handleFlyoutMouseEnter}
          onMouseLeave={handleFlyoutMouseLeave}
        >
          {/* Invisible bridge to connect trigger and flyout */}
          <div
            className="absolute right-full top-0 w-4 h-full"
            style={{ pointerEvents: 'auto' }}
          />

          {/*
            VISUAL IMPROVEMENTS:
            - elevation-lg: Stronger shadow for floating menu
            - glass-morphism: Frosted glass effect
            - gradient-border: Subtle premium border effect
            - Smooth entrance animation
          */}
          <div className="bg-popover text-popover-foreground rounded-lg border elevation-lg min-w-[220px] glass-morphism">
            <div className="p-2">
              {/* Submenu header */}
              <div className="text-xs font-semibold text-muted-foreground px-3 py-2 border-b border-border mb-2 bg-white/5 rounded-t-md">
                {hoveredSubmenu.label}
              </div>

              {/* Submenu items */}
              {hoveredSubmenu.submenus.map((subItem, subIndex) => {
                const SubIcon = subItem.icon;
                const isSubActive = pathname === subItem.href;

                return (
                  <Link
                    key={subIndex}
                    href={subItem.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group",
                      "hover:bg-accent hover:text-accent-foreground hover-lift active-scale",
                      isSubActive && "bg-accent text-accent-foreground font-medium elevation-xs"
                    )}
                    onClick={() => setHoveredMenu(null)}
                  >
                    {SubIcon && (
                      <SubIcon className={cn(
                        "h-4 w-4 shrink-0 transition-colors duration-200",
                        isSubActive ? "text-violet-400" : "group-hover:text-violet-400"
                      )} />
                    )}
                    <span className="text-sm">{subItem.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}