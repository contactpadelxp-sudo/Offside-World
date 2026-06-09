export interface FootSlot {
  id: string;
  date: string;
  start: string;
  end: string;
  price: number;
  available: boolean;
}

export const footSlots: FootSlot[] = [
  { id: "f1", date: "2026-06-14", start: "18:00", end: "19:00", price: 45, available: true },
  { id: "f2", date: "2026-06-14", start: "19:00", end: "20:00", price: 45, available: false },
  { id: "f3", date: "2026-06-14", start: "20:00", end: "21:00", price: 50, available: true },
  { id: "f4", date: "2026-06-15", start: "10:00", end: "11:00", price: 40, available: true },
  { id: "f5", date: "2026-06-15", start: "11:00", end: "12:00", price: 40, available: true },
  { id: "f6", date: "2026-06-15", start: "14:00", end: "15:00", price: 45, available: false },
  { id: "f7", date: "2026-06-15", start: "15:00", end: "16:00", price: 45, available: true },
  { id: "f8", date: "2026-06-21", start: "18:00", end: "19:00", price: 45, available: true },
  { id: "f9", date: "2026-06-21", start: "19:00", end: "20:00", price: 50, available: true },
];

export const EXTERNAL_BOOKING_LINKS = {
  playtomic: "https://playtomic.io",
  sportfinder: "https://sportfinder.be",
} as const;
