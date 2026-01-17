import { ThemePicker } from "@/components/prebuilt/theme-picker";
import { UserNav } from "@/components/admin-panel/user-nav";
import { SheetMenu } from "@/components/admin-panel/sheet-menu";

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="mx-4 sm:mx-8 flex h-14 items-center">
        <div className="flex items-center space-x-4 lg:space-x-0">
          <SheetMenu />
          <h1 className="font-semibold text-foreground">{title}</h1>
        </div>
        <div className="flex flex-1 items-center justify-end gap-1">
          <ThemePicker />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
