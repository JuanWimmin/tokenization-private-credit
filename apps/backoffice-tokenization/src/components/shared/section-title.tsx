interface SectionTitleProps {
  title: string;
  description?: string;
}

export function SectionTitle({ title, description }: SectionTitleProps) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-3xl font-bold text-foreground">{title}</h2>
      {description && (
        <p className="text-md text-text-secondary">{description}</p>
      )}
    </div>
  );
}
