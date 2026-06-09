export interface TeamBuildingPackage {
  id: string;
  name: string;
  description: string;
  pricePerPerson: number;
  minPeople: number;
  maxPeople: number;
  durationMinutes: number;
  includes: string[];
}

export interface TeamBuildingSlot {
  id: string;
  date: string;
  dayOfWeek: string; // "lundi" | "mardi" | "jeudi" | "samedi"
  start: string;
  end: string;
  available: boolean;
}

export const teamBuildingPackages: TeamBuildingPackage[] = [
  {
    id: "tb-classique",
    name: "Team Foot",
    description: "Tournoi de foot indoor entre collègues, encadré par nos animateurs.",
    pricePerPerson: 20,
    minPeople: 10,
    maxPeople: 30,
    durationMinutes: 120,
    includes: [
      "2h de terrain privatisé",
      "Arbitrage & organisation du tournoi",
      "Chasubles & équipement",
      "Vestiaires",
    ],
  },
  {
    id: "tb-bubble",
    name: "Bubble Team",
    description: "Bubble Foot + tournoi : l'activité team building qui casse la glace.",
    pricePerPerson: 30,
    minPeople: 10,
    maxPeople: 24,
    durationMinutes: 150,
    includes: [
      "2h30 dont 1h de Bubble Foot",
      "Organisation du tournoi",
      "Équipement Bubble Foot",
      "Vestiaires & chasubles",
      "Boissons offertes",
    ],
  },
  {
    id: "tb-premium",
    name: "Corporate VIP",
    description: "Formule tout inclus : Bubble Foot, tournoi, cocktail et salle de réception.",
    pricePerPerson: 45,
    minPeople: 10,
    maxPeople: 40,
    durationMinutes: 210,
    includes: [
      "3h30 privatisation complète",
      "Bubble Foot + tournoi foot",
      "Salle de réception privatisée",
      "Cocktail dînatoire",
      "Sono & micro",
      "Photos de groupe",
    ],
  },
];

// Team building : uniquement lun/mar/jeu/sam à partir de 18h
export const teamBuildingSlots: TeamBuildingSlot[] = [
  { id: "tb-s1", date: "2026-06-15", dayOfWeek: "lundi", start: "18:00", end: "20:00", available: true },
  { id: "tb-s2", date: "2026-06-15", dayOfWeek: "lundi", start: "20:00", end: "22:00", available: true },
  { id: "tb-s3", date: "2026-06-16", dayOfWeek: "mardi", start: "18:00", end: "20:00", available: false },
  { id: "tb-s4", date: "2026-06-16", dayOfWeek: "mardi", start: "20:00", end: "22:00", available: true },
  { id: "tb-s5", date: "2026-06-18", dayOfWeek: "jeudi", start: "18:00", end: "20:00", available: true },
  { id: "tb-s6", date: "2026-06-18", dayOfWeek: "jeudi", start: "20:00", end: "22:00", available: true },
  { id: "tb-s7", date: "2026-06-20", dayOfWeek: "samedi", start: "18:00", end: "20:00", available: true },
  { id: "tb-s8", date: "2026-06-20", dayOfWeek: "samedi", start: "20:00", end: "22:00", available: false },
];
