import Link from "next/link";
import { SectionTitle } from "@/components/shared/section-title";
import { CampaignsView } from "@/features/campaigns/components/campaigns-view";
import { Button } from "@tokenization/ui/button";
import { Plus } from "lucide-react";

export default function CampaignsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between gap-1">
        <SectionTitle
          title="Campañas"
          description="Consulta y gestiona las campañas de inversión activas."
        />
        <div className="flex gap-2">

          <Button size="lg" asChild>
            <Link href="/campaigns/new">
              <Plus size={16} />
              Nueva Campaña
            </Link>
          </Button>
        </div>
      </div>
      <CampaignsView />
    </div>
  );
}
