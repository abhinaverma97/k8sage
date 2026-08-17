export function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  const gib = bytes / 1024 ** 3;
  return `${gib.toFixed(1)} Gi`;
}

export function formatCpu(nano: number): string {
  if (!nano) return "—";
  const cores = nano / 1e9;
  return `${cores.toFixed(2)}`;
}
