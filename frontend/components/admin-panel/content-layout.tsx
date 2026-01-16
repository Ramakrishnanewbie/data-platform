import { Navbar } from "@/components/admin-panel/navbar";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function ContentLayout({ title, children }: ContentLayoutProps) {
  return (
    <div className="min-h-screen">
      <Navbar title={title} />
      <div className="p-8 animate-in fade-in duration-300">
        {children}
      </div>
    </div>
  );
}
