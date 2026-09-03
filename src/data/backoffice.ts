export interface MockReservation {
  id: string;
  type: "anniversaire" | "bubble" | "team-building";
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  timeSlot: string;
  espace?: string;
  details: string;
  options: string[];
  totalPrice: number;
  notes?: string;
}

// Réservations fictives pour "demain" (affichage back-office).
// Les locations de terrain n'apparaissent pas ici : elles sont gérées par SportFinder.
export const mockReservations: MockReservation[] = [
  {
    id: "RES-001",
    type: "anniversaire",
    clientName: "Sophie Dupont",
    clientEmail: "sophie.dupont@email.com",
    clientPhone: "0472 12 34 56",
    date: "2026-09-04",
    timeSlot: "13:00 – 15:00",
    espace: "Espace anniversaire 1",
    details: "Formule Bubble — 12 enfants (Lucas, 9 ans)",
    options: ["Pack photo souvenir"],
    totalPrice: 320,
    notes: "Allergie gluten pour 1 enfant",
  },
  {
    id: "RES-002",
    type: "anniversaire",
    clientName: "Marc Leroy",
    clientEmail: "marc.leroy@email.com",
    clientPhone: "0498 76 54 32",
    date: "2026-09-04",
    timeSlot: "15:30 – 17:30",
    espace: "Espace anniversaire 2",
    details: "Formule Kick-Off — 10 enfants (Emma, 7 ans)",
    options: ["Piñata"],
    totalPrice: 210,
  },
  {
    id: "RES-003",
    type: "bubble",
    clientName: "Karim Benziane",
    clientEmail: "karim.b@email.com",
    clientPhone: "0486 11 22 33",
    date: "2026-09-04",
    timeSlot: "18:00 – 19:00",
    details: "Bubble Foot — 10 personnes",
    options: [],
    totalPrice: 230,
    notes: "Groupe d'amis, arrivée prévue 17h45",
  },
  {
    id: "RES-004",
    type: "team-building",
    clientName: "Entreprise TechCorp",
    clientEmail: "events@techcorp.be",
    clientPhone: "02 123 45 67",
    date: "2026-09-04",
    timeSlot: "14:00 – 18:00",
    espace: "Terrain privatisé",
    details: "Team building — demi-journée, 18 personnes",
    options: [],
    totalPrice: 0,
    notes: "Sur devis — contact : Nathalie (RH)",
  },
];
