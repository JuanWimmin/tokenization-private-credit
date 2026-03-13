"use client";

interface ClaimRoiButtonProps {
  campaignId: string;
  disabled?: boolean;
}

export function ClaimRoiButton({ campaignId, disabled }: ClaimRoiButtonProps) {
  const handleClaim = () => {
    // TODO: implement claim ROI transaction
    console.log("Claiming ROI for campaign:", campaignId);
  };

  return (
    <button
      type="button"
      onClick={handleClaim}
      disabled={disabled}
      className="h-10 rounded-xl bg-accent-orange px-5 text-sm font-medium text-white hover:bg-accent-orange-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Reclamar ROI
    </button>
  );
}
