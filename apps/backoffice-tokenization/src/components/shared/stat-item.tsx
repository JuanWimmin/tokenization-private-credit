interface StatItemProps {
  label: string;
  value: string | number;
  description?: string;
}

export function StatItem({ label, value, description }: StatItemProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-2xl font-semibold text-foreground">{value}</span>
      {description && (
        <span className="text-xs text-text-secondary">{description}</span>
      )}
    </div>
  );
}
