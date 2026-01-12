import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { WorkspaceProvider } from "@/lib/contexts/workspace-context";
import '../styles.css';
export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WorkspaceProvider>
      <AdminPanelLayout>{children}</AdminPanelLayout>
    </WorkspaceProvider>
  );
}