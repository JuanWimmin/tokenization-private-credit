"use client";

import { StatItem } from "@/components/shared/stat-item";
import { RoiTable } from "@/features/campaigns/components/roi/roi-table";
import { FundRoiDialog } from "@/features/campaigns/components/roi/FundRoiDialog";
import { useRoi } from "@/features/campaigns/hooks/use-roi";
import { useCampaigns } from "@/features/campaigns/hooks/use-campaigns";

const SUMMARY_STATS = [
  {
    label: "Total Activo",
    value: "$1,350,000",
    description: "+12.5% vs mes anterior",
  },
  {
    label: "Retorno Promedio",
    value: "8.4%",
    description: "Objetivo anual: 9.0%",
  },
  {
    label: "Beneficiarios",
    value: "1,248",
    description: "+154 nuevos este mes",
  },
];

export function RoiView() {
  const { data: campaigns = [] } = useCampaigns();
  const {
    fundsDialogCampaign,
    fundDialogOpen,
    openFundsDialog,
    closeFundsDialog,
  } = useRoi();

  return (
    <div className="flex flex-col gap-8">
      {/* Campaigns table section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">
            Campaña de ROI Activas
          </h3>
        </div>

        <RoiTable
          campaigns={campaigns}
          onAddFunds={openFundsDialog}
        />
      </div>

      {/* Financial summary */}
      {/* <div className="flex flex-col gap-4">
        <h3 className="text-base font-semibold text-foreground">
          Resumen Financiero
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SUMMARY_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <StatItem
                label={stat.label}
                value={stat.value}
                description={stat.description}
              />
            </div>
          ))}
        </div>
      </div> */}

      {/* Dialogs */}
      {fundsDialogCampaign?.vaultId ? (
        <FundRoiDialog
          open={fundDialogOpen}
          onOpenChange={(open) => { if (!open) closeFundsDialog(); }}
          campaignName={fundsDialogCampaign.name}
          vaultId={fundsDialogCampaign.vaultId}
          onFunded={closeFundsDialog}
        />
      ) : null}
    </div>
  );
}
