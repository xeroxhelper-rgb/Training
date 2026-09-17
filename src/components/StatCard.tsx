export default function StatCard({
  label,
  value,
  suffix,
  tone = "default",
  sub,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  tone?: "default" | "primary" | "amber" | "green";
  sub?: string;
}) {
  const toneColor =
    tone === "primary"
      ? "var(--primary)"
      : tone === "amber"
      ? "var(--amber)"
      : tone === "green"
      ? "var(--green)"
      : "var(--ink)";

  return (
    <div className="card px-5 py-4 flex-1 min-w-[180px]">
      <div className="text-xs font-medium" style={{ color: "var(--ink-soft)" }}>
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-[28px] font-semibold tabular" style={{ color: toneColor }}>
          {value}
        </span>
        {suffix && (
          <span className="text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
            {suffix}
          </span>
        )}
      </div>
      {sub && (
        <div className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}
