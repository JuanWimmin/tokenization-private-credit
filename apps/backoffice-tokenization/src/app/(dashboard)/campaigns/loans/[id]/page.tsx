import { SectionTitle } from "@/components/shared/section-title";
import { ManageLoansView } from "@/features/campaigns/components/loans/manage-loans-view";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CampaignLoansPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title="Manejar Préstamos"
        description="Administra los hitos y préstamos de la campaña."
      />
      <ManageLoansView contractId={id} />
    </div>
  );
}
