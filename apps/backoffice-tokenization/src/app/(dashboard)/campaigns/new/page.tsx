import { SectionTitle } from "@/components/shared/section-title";
import { CreateCampaignStepper } from "@/features/campaigns/components/create/create-campaign-stepper";

export default function NewCampaignPage() {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title="Nueva Campaña"
        description="Completa los pasos para configurar tu programa de micro-préstamos."
      />
      <CreateCampaignStepper />
    </div>
  );
}
