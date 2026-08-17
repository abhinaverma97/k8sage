export function StatusDot({
  tone,
  className = "",
}: {
  tone: "ok" | "warn" | "idle";
  className?: string;
}) {
  const styles = {
    ok: "bg-ink-50",
    warn: "bg-ink-400",
    idle: "bg-ink-600",
  } as const;
  return (
    <span
      aria-hidden
      className={`inline-block size-1.5 rounded-full ${styles[tone]} ${className}`}
    />
  );
}
