"use client";

import Image from "next/image";
import { TrendingUp, Wallet } from "lucide-react";
import {
  AppSidebar as SharedAppSidebar,
  type AppSidebarNavItem,
  type AppSidebarLogoConfig,
} from "@tokenization/ui/app-sidebar";
import { SidebarWalletButton } from "@tokenization/ui/sidebar-wallet-button";

const logo: AppSidebarLogoConfig = {
  element: (
    <Image
      src="/interactuar_logo.png"
      alt="interactuar"
      width={160}
      height={32}
      priority
      style={{ objectFit: "contain" }}
    />
  ),
  href: "/",
};

const navItems: AppSidebarNavItem[] = [
  {
    label: "Campañas",
    href: "/campaigns",
    icon: Wallet,
  },
  {
    label: "Retorno de Inversión",
    href: "/roi",
    icon: TrendingUp,
  },
];

export function AppSidebar() {
  return (
    <SharedAppSidebar
      navItems={navItems}
      logo={logo}
      footerContent={<SidebarWalletButton />}
    />
  );
}
