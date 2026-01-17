"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Check, Palette, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { themes, getThemeByName, type Theme } from "@/lib/themes";

function ThemeSwatch({ theme, isActive }: { theme: Theme; isActive: boolean }) {
  return (
    <div className="flex items-center gap-3 w-full">
      {/* Color preview swatch */}
      <div
        className={cn(
          "relative w-8 h-8 rounded-md overflow-hidden border-2 transition-all flex-shrink-0",
          isActive
            ? "border-primary ring-2 ring-primary/30"
            : "border-transparent"
        )}
        style={{ backgroundColor: theme.preview.background }}
      >
        {/* Accent color stripe */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2"
          style={{ backgroundColor: theme.preview.accent }}
        />
        {/* Text preview dot */}
        <div
          className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full"
          style={{ backgroundColor: theme.preview.text }}
        />
        <div
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full opacity-50"
          style={{ backgroundColor: theme.preview.text }}
        />
        {/* Active checkmark */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Check className="w-4 h-4 text-white drop-shadow-md" />
          </div>
        )}
      </div>
      {/* Theme name */}
      <div className="flex flex-col items-start">
        <span className="text-sm font-medium">{theme.label}</span>
        <span className="text-xs text-muted-foreground capitalize">
          {theme.mode} mode
        </span>
      </div>
    </div>
  );
}

export function ThemePicker() {
  const { theme: currentTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? getThemeByName(currentTheme || "slate") : null;
  const darkThemes = themes.filter((t) => t.mode === "dark");
  const lightThemes = themes.filter((t) => t.mode === "light");

  const handleThemeChange = (themeName: string) => {
    const theme = getThemeByName(themeName);
    if (theme) {
      setTheme(themeName);
    }
  };

  return (
    <DropdownMenu>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                className="rounded-full w-8 h-8 bg-background mr-2 relative overflow-hidden"
                variant="outline"
                size="icon"
              >
                {mounted && activeTheme ? (
                  <div
                    className="absolute inset-1 rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${activeTheme.preview.background} 0%, ${activeTheme.preview.accent} 100%)`,
                    }}
                  />
                ) : (
                  <Palette className="h-4 w-4" />
                )}
                <span className="sr-only">Choose theme</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Choose Theme</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent
        align="end"
        className="w-56 max-h-[400px] overflow-y-auto"
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <Moon className="w-4 h-4" />
          Dark Themes
        </DropdownMenuLabel>
        {darkThemes.map((theme) => (
          <DropdownMenuItem
            key={theme.name}
            onClick={() => handleThemeChange(theme.name)}
            className={cn(
              "cursor-pointer py-2",
              currentTheme === theme.name && "bg-accent"
            )}
          >
            <ThemeSwatch
              theme={theme}
              isActive={mounted && currentTheme === theme.name}
            />
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center gap-2">
          <Sun className="w-4 h-4" />
          Light Themes
        </DropdownMenuLabel>
        {lightThemes.map((theme) => (
          <DropdownMenuItem
            key={theme.name}
            onClick={() => handleThemeChange(theme.name)}
            className={cn(
              "cursor-pointer py-2",
              currentTheme === theme.name && "bg-accent"
            )}
          >
            <ThemeSwatch
              theme={theme}
              isActive={mounted && currentTheme === theme.name}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
