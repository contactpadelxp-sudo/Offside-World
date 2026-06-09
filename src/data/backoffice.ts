export interface MockReservation {
  id: string;
  type: "anniversaire" | "libre" | "foot" | "team-building";
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  timeSlot: string;
  salle?: string;
  details: string;
  options: string[];
  totalPrice: number;
  notes?: string;
}

// Réservations fictives pour "demain" (affichage back-office)
export const mockReservations: MockReservation[] = [
  {
    id: "RES-001",
    type: "anniversaire",
    clientName: "Sophie Dupont",
    clientEmail: "sophie.dupont@email.com",
    clientPhone: "0472 12 34 56",
    date: "2026-06-10",
    timeSlot: "13:00 – 15:00",
    salle: "Salle Galaxy",
    details: "Formule Bubble Foot — 12 enfants (Lucas, 9 ans)",
    options: ["Pack décoration", "Gâteau d'anniversaire", "Pack boissons"],
    totalPrice: 400,
    notes: "Allergie gluten pour 1 enfant → gâteau adapté",
  },
  {
    id: "RES-002",
    type: "anniversaire",
    clientName: "Marc Leroy",
    clientEmail: "marc.leroy@email.com",
    clientPhone: "0498 76 54 32",
    date: "2026-06-10",
    timeSlot: "15:30 – 17:30",
    salle: "Salle Junior",
    details: "Formule Classique — 10 enfants (Emma, 7 ans)",
    options: ["Piñata"],
    totalPrice: 210,
  },
  {
    id: "RES-003",
    type: "foot",
    clientName: "Karim Benziane",
    clientEmail: "karim.b@email.com",
    clientPhone: "0486 11 22 33",
    date: "2026-06-10",
    timeSlot: "18:00 – 19:00",
    details: "Location terrain — réservation interne",
    options: [],
    totalPrice: 45,
    notes: "Groupe de 10 joueurs, demande 2 ballons",
  },
  {
    id: "RES-004",
    type: "libre",
    clientName: "Julie Martin",
    clientEmail: "julie.m@email.com",
    clientPhone: "0477 99 88 77",
    date: "2026-06-10",
    timeSlot: "14:00 – 15:00",
    details: "Entrée libre — 3 personnes",
    options: [],
    totalPrice: 30,
  },
  {
    id: "RES-005",
    type: "team-building",
    clientName: "Entreprise TechCorp",
    clientEmail: "events@techcorp.be",
    clientPhone: "02 123 45 67",
    date: "2026-06-10",
    timeSlot: "18:00 – 20:00",
    salle: "Salle Galaxy",
    details: "Formule Bubble Team — 18 personnes",
    options: ["Boissons offertes"],
    totalPrice: 540,
    notes: "Contact : Nathalie (RH) — arrivée prévue 17h45",
  },
];
