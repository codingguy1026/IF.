import Image from "next/image";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <Image className={`brand-image ${compact ? "brand-image--compact" : ""}`} src="/brand/if-logo.svg" alt="IF." width={1000} height={1000} priority />;
}
