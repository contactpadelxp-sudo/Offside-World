import { ANNIVERSAIRES_SIMULTANES, BATTEMENT_MINUTES } from "./reglement";

export interface Espace {
  id: string;
  name: string;
  capacity: number;
  description: string;
}

export interface TimeSlot {
  id: string;
  start: string; // "HH:mm"
  end: string;
}

export interface BookedSlot {
  espaceId: string;
  date: string; // "YYYY-MM-DD"
  slotId: string;
}

/**
 * Deux anniversaires peuvent se dérouler en parallèle, avec un battement de
 * 30 minutes entre deux groupes successifs pour le changement.
 */
// TODO remplacer par les noms réels des espaces une fois confirmés avec Brahim.
export const espaces: Espace[] = Array.from({ length: ANNIVERSAIRES_SIMULTANES }, (_, i) => ({
  id: `espace-${i + 1}`,
  name: `Espace anniversaire ${i + 1}`,
  capacity: 20,
  description: "Terrain réservé pour le groupe, espace gâteau et accès aux vestiaires.",
}));

// Créneaux espacés de 30 min pour permettre le changement entre deux groupes.
export const timeSlots: TimeSlot[] = [
  { id: "10h-12h", start: "10:00", end: "12:00" },
  { id: "12h30-14h30", start: "12:30", end: "14:30" },
  { id: "15h-17h", start: "15:00", end: "17:00" },
  { id: "17h30-19h30", start: "17:30", end: "19:30" },
];

export { BATTEMENT_MINUTES };

// Créneaux déjà réservés (simulation).
export const bookedSlots: BookedSlot[] = [
  { espaceId: "espace-1", date: "2026-09-12", slotId: "12h30-14h30" },
  { espaceId: "espace-1", date: "2026-09-12", slotId: "15h-17h" },
  { espaceId: "espace-2", date: "2026-09-12", slotId: "10h-12h" },
  { espaceId: "espace-2", date: "2026-09-13", slotId: "12h30-14h30" },
  { espaceId: "espace-1", date: "2026-09-13", slotId: "17h30-19h30" },
  { espaceId: "espace-2", date: "2026-09-19", slotId: "15h-17h" },
];

export function isSlotBooked(espaceId: string, date: string, slotId: string): boolean {
  return bookedSlots.some(
    (b) => b.espaceId === espaceId && b.date === date && b.slotId === slotId
  );
}
