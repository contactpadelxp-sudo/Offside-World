export interface Salle {
  id: string;
  name: string;
  capacity: number;
  description: string;
  image: string;
}

export interface TimeSlot {
  id: string;
  start: string; // "HH:mm"
  end: string;
}

export interface BookedSlot {
  salleId: string;
  date: string; // "YYYY-MM-DD"
  slotId: string;
}

export const salles: Salle[] = [
  {
    id: "salle-1",
    name: "Salle Galaxy",
    capacity: 20,
    description: "Notre plus grande salle : éclairage LED, sono et espace goûter intégré.",
    image: "/images/placeholder-salle1.jpg",
  },
  {
    id: "salle-2",
    name: "Salle Thunder",
    capacity: 16,
    description: "Ambiance tamisée avec lumières UV, idéale pour les ados.",
    image: "/images/placeholder-salle2.jpg",
  },
  {
    id: "salle-3",
    name: "Salle Junior",
    capacity: 14,
    description: "Taille adaptée aux plus petits, mousse de protection et mini-buts.",
    image: "/images/placeholder-salle3.jpg",
  },
];

export const timeSlots: TimeSlot[] = [
  { id: "10h-12h", start: "10:00", end: "12:00" },
  { id: "13h-15h", start: "13:00", end: "15:00" },
  { id: "15h30-17h30", start: "15:30", end: "17:30" },
  { id: "18h-20h", start: "18:00", end: "20:00" },
];

// Simulated already-booked slots
export const bookedSlots: BookedSlot[] = [
  { salleId: "salle-1", date: "2026-06-14", slotId: "13h-15h" },
  { salleId: "salle-1", date: "2026-06-14", slotId: "15h30-17h30" },
  { salleId: "salle-2", date: "2026-06-14", slotId: "10h-12h" },
  { salleId: "salle-3", date: "2026-06-15", slotId: "13h-15h" },
  { salleId: "salle-1", date: "2026-06-15", slotId: "18h-20h" },
  { salleId: "salle-2", date: "2026-06-21", slotId: "15h30-17h30" },
];

export function isSlotBooked(salleId: string, date: string, slotId: string): boolean {
  return bookedSlots.some(
    (b) => b.salleId === salleId && b.date === date && b.slotId === slotId
  );
}
