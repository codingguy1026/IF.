import type { CanonStatus } from "@/lib/data";

export function StatusBadge({ status }: { status: CanonStatus }) {
  return <span className={`status-badge status-${status.toLowerCase().replace("-", "")}`}><i />{status}</span>;
}
