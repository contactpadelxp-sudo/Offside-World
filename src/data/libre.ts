export interface LibreSlot {
  id: string;
  date: string;
  start: string;
  end: string;
  price: number;
  spotsLeft: number;
}

export const libreSlots: LibreSlot[] = [
  { id: "l1", date: "2026-06-14", start: "14:00", end: "15:00", price: 10, spotsLeft: 8 },
  { id: "l2", date: "2026-06-14", start: "15:00", end: "16:00", price: 10, spotsLeft: 3 },
  { id: "l3", date: "2026-06-14", start: "16:00", end: "17:00", price: 10, spotsLeft: 12 },
  { id: "l4", date: "2026-06-15", start: "10:00", end: "11:00", price: 8, spotsLeft: 15 },
  { id: "l5", date: "2026-06-15", start: "11:00", end: "12:00", price: 8, spotsLeft: 10 },
  { id: "l6", date: "2026-06-15", start: "14:00", end: "15:00", price: 10, spotsLeft: 0 },
  { id: "l7", date: "2026-06-21", start: "14:00", end: "15:00", price: 10, spotsLeft: 6 },
  { id: "l8", date: "2026-06-21", start: "15:00", end: "16:00", price: 10, spotsLeft: 14 },
];
