export function formatBytes(bytes: number): string {
  if (!bytes || Number.isNaN(bytes)) return "0 Gi";
  const gib = bytes / (1024 ** 3);
  return `${gib.toFixed(1)} Gi`;
}

export function formatCpu(nano: number): string {
  if (!nano || Number.isNaN(nano)) return "0.00";
  const cores = nano / 1e9;
  return `${cores.toFixed(2)}`;
}

export function parseCpuCores(value: string | number | undefined | null): number {
  if (!value) return 1;
  if (typeof value === "number") return value > 0 ? value : 1;
  const trimmed = value.trim();
  const m = /^([\d.]+)m$/.exec(trimmed);
  if (m) return parseFloat(m[1]) / 1000;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function parseMemoryBytes(value: string | number | undefined | null): number {
  if (!value) return 0;
  if (typeof value === "number") return value > 0 ? value : 0;
  const trimmed = value.trim();
  const m = /^([\d.]+)([KMGTPE]i?|Ki|Mi|Gi|Ti)?$/.exec(trimmed);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return 0;
  const unit = m[2];
  switch (unit) {
    case "Ki":
      return Math.round(n * 1024);
    case "Mi":
      return Math.round(n * (1024 ** 2));
    case "Gi":
      return Math.round(n * (1024 ** 3));
    case "Ti":
      return Math.round(n * (1024 ** 4));
    case "K":
    case "k":
      return Math.round(n * 1000);
    case "M":
      return Math.round(n * (1000 ** 2));
    case "G":
      return Math.round(n * (1000 ** 3));
    case "T":
      return Math.round(n * (1000 ** 4));
    default:
      return Math.round(n);
  }
}

export function formatMemoryString(value: string | undefined | null): string {
  if (!value) return "—";
  const bytes = parseMemoryBytes(value);
  if (!bytes) return value;
  return formatBytes(bytes);
}
