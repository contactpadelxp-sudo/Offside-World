/**
 * Types de la base — FICHIER GÉNÉRÉ, NE PAS MODIFIER À LA MAIN.
 *
 * Régénération après toute migration :
 *   npx supabase gen types typescript --project-id shybhkzgwxyajysjlrbv > src/lib/supabase/types.ts
 * (puis recoller cet en-tête)
 *
 * Le schéma de référence reste supabase/migrations/.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      creneaux: {
        Row: {
          created_at: string
          debut: string
          espace_id: string
          fin: string
          id: string
          ouvert: boolean
          type: Database["public"]["Enums"]["type_activite"]
        }
        Insert: {
          created_at?: string
          debut: string
          espace_id: string
          fin: string
          id?: string
          ouvert?: boolean
          type: Database["public"]["Enums"]["type_activite"]
        }
        Update: {
          created_at?: string
          debut?: string
          espace_id?: string
          fin?: string
          id?: string
          ouvert?: boolean
          type?: Database["public"]["Enums"]["type_activite"]
        }
        Relationships: [
          {
            foreignKeyName: "creneaux_espace_id_fkey"
            columns: ["espace_id"]
            isOneToOne: false
            referencedRelation: "espaces"
            referencedColumns: ["id"]
          },
        ]
      }
      demandes_devis: {
        Row: {
          cgv_acceptees_le: string | null
          contact_email: string
          contact_nom: string
          contact_telephone: string
          created_at: string
          date_souhaitee: string | null
          entreprise: string
          id: string
          message: string | null
          nb_participants: number | null
          newsletter: boolean
          periode: string | null
          reference: string
          statut: Database["public"]["Enums"]["statut_devis"]
          updated_at: string
        }
        Insert: {
          cgv_acceptees_le?: string | null
          contact_email: string
          contact_nom: string
          contact_telephone: string
          created_at?: string
          date_souhaitee?: string | null
          entreprise: string
          id?: string
          message?: string | null
          nb_participants?: number | null
          newsletter?: boolean
          periode?: string | null
          reference: string
          statut?: Database["public"]["Enums"]["statut_devis"]
          updated_at?: string
        }
        Update: {
          cgv_acceptees_le?: string | null
          contact_email?: string
          contact_nom?: string
          contact_telephone?: string
          created_at?: string
          date_souhaitee?: string | null
          entreprise?: string
          id?: string
          message?: string | null
          nb_participants?: number | null
          newsletter?: boolean
          periode?: string | null
          reference?: string
          statut?: Database["public"]["Enums"]["statut_devis"]
          updated_at?: string
        }
        Relationships: []
      }
      espaces: {
        Row: {
          actif: boolean
          capacite: number
          id: string
          nom: string
        }
        Insert: {
          actif?: boolean
          capacite: number
          id: string
          nom: string
        }
        Update: {
          actif?: boolean
          capacite?: number
          id?: string
          nom?: string
        }
        Relationships: []
      }
      formules: {
        Row: {
          accroche: string | null
          actif: boolean
          description: string
          duree_minutes: number
          enfants_inclus: number
          enfants_max: number
          id: string
          image: string | null
          inclus: string[]
          nom: string
          ordre: number
          prix_base_cents: number
          prix_enfant_sup_cents: number
        }
        Insert: {
          accroche?: string | null
          actif?: boolean
          description: string
          duree_minutes: number
          enfants_inclus: number
          enfants_max: number
          id: string
          image?: string | null
          inclus?: string[]
          nom: string
          ordre?: number
          prix_base_cents: number
          prix_enfant_sup_cents: number
        }
        Update: {
          accroche?: string | null
          actif?: boolean
          description?: string
          duree_minutes?: number
          enfants_inclus?: number
          enfants_max?: number
          id?: string
          image?: string | null
          inclus?: string[]
          nom?: string
          ordre?: number
          prix_base_cents?: number
          prix_enfant_sup_cents?: number
        }
        Relationships: []
      }
      journal_admin: {
        Row: {
          acteur: string
          action: string
          cible: string | null
          created_at: string
          detail: Json | null
          id: number
          ip: unknown
        }
        Insert: {
          acteur: string
          action: string
          cible?: string | null
          created_at?: string
          detail?: Json | null
          id?: number
          ip?: unknown
        }
        Update: {
          acteur?: string
          action?: string
          cible?: string | null
          created_at?: string
          detail?: Json | null
          id?: number
          ip?: unknown
        }
        Relationships: []
      }
      options: {
        Row: {
          actif: boolean
          description: string | null
          id: string
          libelle: string
          prix_cents: number
        }
        Insert: {
          actif?: boolean
          description?: string | null
          id: string
          libelle: string
          prix_cents: number
        }
        Update: {
          actif?: boolean
          description?: string | null
          id?: string
          libelle?: string
          prix_cents?: number
        }
        Relationships: []
      }
      paiements: {
        Row: {
          created_at: string
          devise: string
          erreur: string | null
          id: string
          methode: string | null
          montant_cents: number
          reservation_id: string
          statut: Database["public"]["Enums"]["statut_paiement"]
          stripe_payment_intent: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          devise?: string
          erreur?: string | null
          id?: string
          methode?: string | null
          montant_cents: number
          reservation_id: string
          statut?: Database["public"]["Enums"]["statut_paiement"]
          stripe_payment_intent?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          devise?: string
          erreur?: string | null
          id?: string
          methode?: string | null
          montant_cents?: number
          reservation_id?: string
          statut?: Database["public"]["Enums"]["statut_paiement"]
          stripe_payment_intent?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          allergies: string | null
          anonymisee_le: string | null
          cgv_acceptees_le: string
          client_email: string
          client_nom: string
          client_telephone: string
          created_at: string
          creneau_id: string
          enfant_age: number | null
          enfant_prenom: string | null
          formule_id: string | null
          id: string
          nb_enfants: number | null
          nb_personnes: number | null
          newsletter: boolean
          options_ids: string[]
          reference: string
          remarques: string | null
          statut: Database["public"]["Enums"]["statut_reservation"]
          total_cents: number
          type: Database["public"]["Enums"]["type_activite"]
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          anonymisee_le?: string | null
          cgv_acceptees_le: string
          client_email: string
          client_nom: string
          client_telephone: string
          created_at?: string
          creneau_id: string
          enfant_age?: number | null
          enfant_prenom?: string | null
          formule_id?: string | null
          id?: string
          nb_enfants?: number | null
          nb_personnes?: number | null
          newsletter?: boolean
          options_ids?: string[]
          reference: string
          remarques?: string | null
          statut?: Database["public"]["Enums"]["statut_reservation"]
          total_cents: number
          type: Database["public"]["Enums"]["type_activite"]
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          anonymisee_le?: string | null
          cgv_acceptees_le?: string
          client_email?: string
          client_nom?: string
          client_telephone?: string
          created_at?: string
          creneau_id?: string
          enfant_age?: number | null
          enfant_prenom?: string | null
          formule_id?: string | null
          id?: string
          nb_enfants?: number | null
          nb_personnes?: number | null
          newsletter?: boolean
          options_ids?: string[]
          reference?: string
          remarques?: string | null
          statut?: Database["public"]["Enums"]["statut_reservation"]
          total_cents?: number
          type?: Database["public"]["Enums"]["type_activite"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_creneau_id_fkey"
            columns: ["creneau_id"]
            isOneToOne: false
            referencedRelation: "creneaux"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_formule_id_fkey"
            columns: ["formule_id"]
            isOneToOne: false
            referencedRelation: "formules"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      reservations_detaillees: {
        Row: {
          allergies: string | null
          client_email: string | null
          client_nom: string | null
          client_telephone: string | null
          created_at: string | null
          debut: string | null
          enfant_age: number | null
          enfant_prenom: string | null
          espace_id: string | null
          espace_nom: string | null
          fin: string | null
          formule_id: string | null
          formule_nom: string | null
          id: string | null
          nb_enfants: number | null
          nb_personnes: number | null
          options_ids: string[] | null
          reference: string | null
          remarques: string | null
          statut: Database["public"]["Enums"]["statut_reservation"] | null
          total_cents: number | null
          type: Database["public"]["Enums"]["type_activite"] | null
        }
        Relationships: []
      }
      creneaux_disponibles: {
        Row: {
          capacite: number | null
          debut: string | null
          espace_id: string | null
          espace_nom: string | null
          fin: string | null
          id: string | null
          libre: boolean | null
          type: Database["public"]["Enums"]["type_activite"] | null
        }
        Relationships: [
          {
            foreignKeyName: "creneaux_espace_id_fkey"
            columns: ["espace_id"]
            isOneToOne: false
            referencedRelation: "espaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      anonymiser_reservations_anciennes: {
        Args: { delai?: string }
        Returns: number
      }
      expirer_reservations_en_attente: {
        Args: { delai?: string }
        Returns: number
      }
      generer_creneaux_anniversaire: {
        Args: { au: string; du: string }
        Returns: number
      }
      generer_creneaux_bubble: {
        Args: { au: string; du: string }
        Returns: number
      }
    }
    Enums: {
      statut_devis:
        | "nouvelle"
        | "traitee"
        | "devis_envoye"
        | "acceptee"
        | "refusee"
      statut_paiement:
        | "cree"
        | "en_cours"
        | "reussi"
        | "echoue"
        | "rembourse"
        | "partiellement_rembourse"
      statut_reservation: "en_attente" | "confirmee" | "annulee" | "expiree"
      type_activite: "anniversaire" | "bubble"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      statut_devis: [
        "nouvelle",
        "traitee",
        "devis_envoye",
        "acceptee",
        "refusee",
      ],
      statut_paiement: [
        "cree",
        "en_cours",
        "reussi",
        "echoue",
        "rembourse",
        "partiellement_rembourse",
      ],
      statut_reservation: ["en_attente", "confirmee", "annulee", "expiree"],
      type_activite: ["anniversaire", "bubble"],
    },
  },
} as const
