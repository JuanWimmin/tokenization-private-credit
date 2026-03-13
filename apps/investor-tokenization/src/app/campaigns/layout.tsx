import { PageShell } from "@/components/layout/page-shell";
import type { ReactNode } from "react";

export default function CampaignsLayout({ children }: { children: ReactNode }) {
  return <PageShell>{children}</PageShell>;
}
