"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

export function LandingExperience() {
  const [open, setOpen] = useState(false);
  return <main className={`landing ${open ? "is-open" : ""}`}>
    <div className="brand-stage">
      <span className="word word-what"><Image src="/brand/what-lettering.svg" alt="WHAT" fill sizes="(max-width: 700px) 42vw, 320px" /></span>
      <span className="word word-if">
        <Image src="/brand/if-logo.svg" alt="IF." fill priority sizes="(max-width: 700px) 30vw, 220px" />
        <button
          type="button"
          className="brand-dot-trigger"
          onClick={() => setOpen(value => !value)}
          aria-expanded={open}
          aria-controls="if-invitation"
          aria-label={open ? "Collapse WHAT IF...?" : "Expand IF. into WHAT IF...?"}
          title={open ? "Close the world of possibilities" : "What if...? Click the dot"}
        />
      </span>
      <span className="word word-question"><Image src="/brand/question-artwork.svg" alt="...?" fill sizes="(max-width: 700px) 28vw, 210px" /></span>
      <span className="click-hint">click the dot</span>
    </div>
    <div id="if-invitation" className="invitation" aria-hidden={!open} inert={!open}>
      <form action="/create" className="idea-form"><label htmlFor="idea" className="sr-only">Your first idea for a world</label><input id="idea" name="idea" placeholder="What if...?" autoComplete="off" /><button aria-label="Begin creating"><ArrowRight size={19}/></button></form>
      <div className="landing-actions"><Link href="/create">Create a World</Link><Link href="/explore">Explore Worlds</Link></div>
    </div>
    <p className="landing-note">An archive of possible histories</p>
  </main>;
}
