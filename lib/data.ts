export type World = { id: string; name: string; description: string; owner: string; members: number; events: number; branches: number; policy: "OPEN" | "REVIEW" | "INVITE ONLY" | "SOLO"; updated: string; glyph: string };
export const worlds: World[] = [
  { id: "luna-republic", name: "Luna Republic", description: "A living record of humanity's first independent civilization beyond Earth.", owner: "Mara Voss", members: 284, events: 47, branches: 8, policy: "REVIEW", updated: "12 min ago", glyph: "◒" },
  { id: "earth-17", name: "Earth—17", description: "The industrial age discovered computation two centuries early.", owner: "Ilya Chen", members: 89, events: 112, branches: 24, policy: "OPEN", updated: "1 hr ago", glyph: "◉" },
  { id: "neo-seoul", name: "Neo Seoul", description: "A city archive from the peninsula's floating century.", owner: "Joon Park", members: 51, events: 36, branches: 3, policy: "REVIEW", updated: "Yesterday", glyph: "◇" },
  { id: "verdant-signal", name: "The Verdant Signal", description: "First contact arrived as a seed, not a message.", owner: "Noa Ellis", members: 126, events: 73, branches: 17, policy: "OPEN", updated: "2 hr ago", glyph: "✦" },
];

export const timeline = [
  { id: "e1", year: "2026", title: "Lunar settlement founded", text: "Thirty-two settlers establish the first permanent habitation at Shackleton Crater.", x: 110, y: 90, important: false },
  { id: "e2", year: "2030", title: "Population reaches 10,000", text: "The settlements become a permanent civic society with their own institutions.", x: 310, y: 90, important: false },
  { id: "e3", year: "2034", title: "Moon declares independence", text: "Representatives of the lunar colonies sign the Lunar Declaration.", x: 510, y: 90, important: true },
  { id: "e4", year: "2035", title: "Earth imposes sanctions", text: "Earth governments suspend trade and restrict orbital access.", x: 710, y: 90, important: false },
  { id: "e5", year: "2034", title: "Federation Agreement", text: "An alternate settlement binds Earth and Moon under a shared charter.", x: 710, y: 250, important: true },
];
