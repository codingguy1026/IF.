"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function InteractiveBrandMark() {
  const [expanded, setExpanded] = useState(false);
  return <div className={`shell-brand ${expanded ? "is-expanded" : ""}`}>
    <span className="shell-brand-what" aria-hidden={!expanded}>
      <Image src="/brand/what-lettering.svg" alt="" width={64} height={58}/>
    </span>
    <Link href="/" className="shell-brand-home" aria-label="IF. home">
      <Image src="/brand/if-logo.svg" alt="IF." width={58} height={58} priority />
    </Link>
    <span className="shell-brand-question" aria-hidden={!expanded}>
      <Image src="/brand/question-artwork.svg" alt="" width={104} height={58}/>
    </span>
    <button className="brand-dot-control" aria-expanded={expanded} aria-label={expanded ? "Return logo to IF." : "Expand logo to WHAT IF...?"} onClick={() => setExpanded(value => !value)} />
  </div>;
}
