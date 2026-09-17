export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    재직: { bg: "var(--green-soft)", fg: "var(--green)" },
    휴직: { bg: "var(--amber-soft)", fg: "var(--amber)" },
    퇴사: { bg: "#eceef1", fg: "var(--ink-soft)" },
    신입: { bg: "var(--primary-soft)", fg: "var(--primary)" },
  };
  const c = map[status] ?? { bg: "#eceef1", fg: "var(--ink-soft)" };
  return (
    <span className="badge" style={{ background: c.bg, color: c.fg }}>
      {status}
    </span>
  );
}

export function RateBadge({ rate, threshold }: { rate: number; threshold?: number }) {
  const exceeded = threshold != null && rate > threshold;
  const bg = exceeded ? "var(--amber-soft)" : rate >= 80 ? "var(--green-soft)" : "var(--primary-soft)";
  const fg = exceeded ? "var(--amber)" : rate >= 80 ? "var(--green)" : "var(--primary)";
  return (
    <span className="badge tabular" style={{ background: bg, color: fg }}>
      {rate.toFixed(1)}%
    </span>
  );
}
