import { SectionTitle } from "@/components/shared/section-title";
import { RoiView } from "@/features/campaigns/components/roi/roi-view";

export default function RoiPage() {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title="Retornos"
        description="Gestione y monitoree sus programas de ROI activos en tiempo real."
      />
      <RoiView />
    </div>
  );
}
