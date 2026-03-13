import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { SidebarInset, SidebarProvider } from "@tokenization/ui/sidebar";

interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col gap-4 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
