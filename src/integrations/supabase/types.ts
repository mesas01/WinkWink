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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_access_state: {
        Row: {
          blocked: boolean
          id: boolean
          message: string | null
        }
        Insert: {
          blocked?: boolean
          id?: boolean
          message?: string | null
        }
        Update: {
          blocked?: boolean
          id?: boolean
          message?: string | null
        }
        Relationships: []
      }
      budget_limits: {
        Row: {
          category: string
          created_at: string
          currency: string
          employee_id: string | null
          enabled: boolean
          human_above: number
          id: string
          label: string
          per_payment: number
          period: string
          period_limit: number
        }
        Insert: {
          category?: string
          created_at?: string
          currency: string
          employee_id?: string | null
          enabled?: boolean
          human_above: number
          id?: string
          label: string
          per_payment: number
          period?: string
          period_limit: number
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string
          employee_id?: string | null
          enabled?: boolean
          human_above?: number
          id?: string
          label?: string
          per_payment?: number
          period?: string
          period_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_limits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          accepted_at: string
          terms_version: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          terms_version: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          terms_version?: string
          user_id?: string
        }
        Relationships: []
      }
      invoice_events: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          invoice_id: string
          message_en: string
          message_es: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          invoice_id: string
          message_en: string
          message_es: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          invoice_id?: string
          message_en?: string
          message_es?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          ai_usage: Json | null
          amount: number | null
          approved_at: string | null
          category: string | null
          created_at: string
          currency: string | null
          decision_snapshot: Json | null
          demo_scenario: boolean
          description: string | null
          due_date: string | null
          error_message: string | null
          explanation_en: string | null
          explanation_es: string | null
          file_name: string
          id: string
          invoice_date: string | null
          invoice_number: string | null
          matched_merchant: string | null
          mime_type: string
          policy_version: string
          proposed_channel: string | null
          proposed_destination: string | null
          security_snapshot: Json | null
          security_status: string | null
          status: string
          storage_path: string
          test_document: boolean
          upload_authorized_at: string
          user_id: string
          vendor: string | null
        }
        Insert: {
          ai_usage?: Json | null
          amount?: number | null
          approved_at?: string | null
          category?: string | null
          created_at?: string
          currency?: string | null
          decision_snapshot?: Json | null
          demo_scenario?: boolean
          description?: string | null
          due_date?: string | null
          error_message?: string | null
          explanation_en?: string | null
          explanation_es?: string | null
          file_name: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          matched_merchant?: string | null
          mime_type: string
          policy_version?: string
          proposed_channel?: string | null
          proposed_destination?: string | null
          security_snapshot?: Json | null
          security_status?: string | null
          status?: string
          storage_path: string
          test_document?: boolean
          upload_authorized_at?: string
          user_id: string
          vendor?: string | null
        }
        Update: {
          ai_usage?: Json | null
          amount?: number | null
          approved_at?: string | null
          category?: string | null
          created_at?: string
          currency?: string | null
          decision_snapshot?: Json | null
          demo_scenario?: boolean
          description?: string | null
          due_date?: string | null
          error_message?: string | null
          explanation_en?: string | null
          explanation_es?: string | null
          file_name?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          matched_merchant?: string | null
          mime_type?: string
          policy_version?: string
          proposed_channel?: string | null
          proposed_destination?: string | null
          security_snapshot?: Json | null
          security_status?: string | null
          status?: string
          storage_path?: string
          test_document?: boolean
          upload_authorized_at?: string
          user_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_rules: {
        Row: {
          action: string
          category: string
          comparison: string
          created_at: string
          currency: string
          enabled: boolean
          id: string
          label: string
          threshold: number
        }
        Insert: {
          action: string
          category: string
          comparison: string
          created_at?: string
          currency?: string
          enabled?: boolean
          id?: string
          label: string
          threshold?: number
        }
        Update: {
          action?: string
          category?: string
          comparison?: string
          created_at?: string
          currency?: string
          enabled?: boolean
          id?: string
          label?: string
          threshold?: number
        }
        Relationships: []
      }
      privacy_requests: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          message: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          demo_employee: boolean
          display_name: string
          id: string
        }
        Insert: {
          demo_employee?: boolean
          display_name?: string
          id: string
        }
        Update: {
          demo_employee?: boolean
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      supplier_attestations: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          snapshot: Json
          vendor_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          snapshot: Json
          vendor_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          snapshot?: Json
          vendor_id?: string
        }
        Relationships: []
      }
      supplier_reference_files: {
        Row: {
          ai_usage: Json | null
          created_at: string
          error_message: string | null
          file_name: string
          id: string
          kind: string
          metadata: Json | null
          mime_type: string
          status: string
          storage_path: string
          test_document: boolean
          user_id: string
          vendor_id: string
        }
        Insert: {
          ai_usage?: Json | null
          created_at?: string
          error_message?: string | null
          file_name: string
          id?: string
          kind: string
          metadata?: Json | null
          mime_type: string
          status?: string
          storage_path: string
          test_document?: boolean
          user_id: string
          vendor_id: string
        }
        Update: {
          ai_usage?: Json | null
          created_at?: string
          error_message?: string | null
          file_name?: string
          id?: string
          kind?: string
          metadata?: Json | null
          mime_type?: string
          status?: string
          storage_path?: string
          test_document?: boolean
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_reference_files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_reference_files_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "verified_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verified_vendors: {
        Row: {
          aliases: string[]
          bank_last4: string | null
          bank_name: string | null
          confirmation_channel: string | null
          disposition: string
          expected_category: string | null
          expected_currency: string | null
          format_notes: string | null
          id: string
          invoice_prefix: string | null
          name: string
          reference_invoice_number: string | null
          tax_id: string | null
          trust_confirmed_at: string | null
          trust_confirmed_by: string | null
          verified_at: string | null
        }
        Insert: {
          aliases?: string[]
          bank_last4?: string | null
          bank_name?: string | null
          confirmation_channel?: string | null
          disposition?: string
          expected_category?: string | null
          expected_currency?: string | null
          format_notes?: string | null
          id?: string
          invoice_prefix?: string | null
          name: string
          reference_invoice_number?: string | null
          tax_id?: string | null
          trust_confirmed_at?: string | null
          trust_confirmed_by?: string | null
          verified_at?: string | null
        }
        Update: {
          aliases?: string[]
          bank_last4?: string | null
          bank_name?: string | null
          confirmation_channel?: string | null
          disposition?: string
          expected_category?: string | null
          expected_currency?: string | null
          format_notes?: string | null
          id?: string
          invoice_prefix?: string | null
          name?: string
          reference_invoice_number?: string | null
          tax_id?: string | null
          trust_confirmed_at?: string | null
          trust_confirmed_by?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      budget_period_start: {
        Args: { _period: string; _time: string }
        Returns: string
      }
      has_consent: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      resolve_invoice: {
        Args: { _id: string; _status: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "employee"
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "employee"],
    },
  },
} as const
