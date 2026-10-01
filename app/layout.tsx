import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "IF. — Build possible histories", description: "A collaborative archive for imagined worlds and branching histories." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
