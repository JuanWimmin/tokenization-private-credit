"use client";

import { SidebarTrigger } from "@tokenization/ui/sidebar";

export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border bg-card px-4 md:hidden">
      <SidebarTrigger />
    </header>
  );
}
