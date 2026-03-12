"use client";

import Image from "next/image";
import { Megaphone, TrendingUp } from "lucide-react";
import { ReactNode } from "react";
import {
  SidebarProvider,
  SidebarInset,
} from "@tokenization/ui/sidebar";
import { AppSidebar } from "@tokenization/ui/app-sidebar";
import { SidebarWalletButton } from "@tokenization/ui/sidebar-wallet-button";

const ROI_NAV_ITEMS = [
  { href: "/", label: "Manage Campaigns", icon: Megaphone },
  { href: "/roi", label: "ROI", icon: TrendingUp },
];

type RoiDashboardShellProps = {
  children: ReactNode;
};

export function RoiDashboardShell({ children }: RoiDashboardShellProps) {
  return (
    <div className="fixed inset-0 z-[60] flex min-h-svh bg-background">
      <SidebarProvider>
        <AppSidebar
          navItems={ROI_NAV_ITEMS}
          logo={{
            href: "/",
            element: (
              <Image
                src="/escrows/interactuar.jpg"
                alt="interactuar"
                width={260}
                height={68}
                className="h-16 w-auto max-w-full object-contain object-left"
                priority
              />
            ),
          }}
          footerContent={
            <div className="px-1 pb-2">
              <SidebarWalletButton />
            </div>
          }
        />
        <SidebarInset>
          <div className="flex flex-1 flex-col bg-muted p-6 md:p-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
