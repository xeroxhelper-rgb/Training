export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-header flex items-start justify-between px-8 py-7 border-b" style={{ borderColor: "var(--line)" }}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
          {title}
        </h1>
        {description && (
          <p className="text-sm mt-1" style={{ color: "var(--ink-soft)" }}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
