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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_call_schedules: {
        Row: {
          call_purposes: string[]
          call_time: string
          created_at: string | null
          custom_message: string | null
          days_of_week: number[] | null
          id: string
          is_active: boolean
          notification_channel: string
          patient_id: string
          schedule_type: string
          scheduled_by_role: string
          scheduled_by_user_id: string
          specific_dates: string[] | null
          updated_at: string | null
        }
        Insert: {
          call_purposes: string[]
          call_time: string
          created_at?: string | null
          custom_message?: string | null
          days_of_week?: number[] | null
          id?: string
          is_active?: boolean
          notification_channel?: string
          patient_id: string
          schedule_type?: string
          scheduled_by_role: string
          scheduled_by_user_id: string
          specific_dates?: string[] | null
          updated_at?: string | null
        }
        Update: {
          call_purposes?: string[]
          call_time?: string
          created_at?: string | null
          custom_message?: string | null
          days_of_week?: number[] | null
          id?: string
          is_active?: boolean
          notification_channel?: string
          patient_id?: string
          schedule_type?: string
          scheduled_by_role?: string
          scheduled_by_user_id?: string
          specific_dates?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_call_schedules_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coadmin_profiles: {
        Row: {
          created_at: string | null
          id: string
          patient_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          patient_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          patient_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coadmin_profiles_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dizziness_records: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string
          recorded_at: string
          severity: number
          symptoms: string[] | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          recorded_at?: string
          severity: number
          symptoms?: string[] | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          recorded_at?: string
          severity?: number
          symptoms?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "dizziness_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      glucose_records: {
        Row: {
          created_at: string | null
          date: string
          id: string
          notes: string | null
          patient_id: string
          recorded_at: string
          time_slot: string
          updated_at: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          patient_id: string
          recorded_at?: string
          time_slot: string
          updated_at?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          patient_id?: string
          recorded_at?: string
          time_slot?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "glucose_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      insulin_schedules: {
        Row: {
          brand: string | null
          change_reason: string | null
          changed_by_role: string | null
          changed_by_user_id: string | null
          created_at: string | null
          effective_from: string
          effective_until: string | null
          id: string
          insulin_type: string
          is_active: boolean
          notes: string | null
          ordered_by: string | null
          patient_id: string
          times_per_day: number
          units_per_dose: number
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          change_reason?: string | null
          changed_by_role?: string | null
          changed_by_user_id?: string | null
          created_at?: string | null
          effective_from?: string
          effective_until?: string | null
          id?: string
          insulin_type: string
          is_active?: boolean
          notes?: string | null
          ordered_by?: string | null
          patient_id: string
          times_per_day: number
          units_per_dose: number
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          change_reason?: string | null
          changed_by_role?: string | null
          changed_by_user_id?: string | null
          created_at?: string | null
          effective_from?: string
          effective_until?: string | null
          id?: string
          insulin_type?: string
          is_active?: boolean
          notes?: string | null
          ordered_by?: string | null
          patient_id?: string
          times_per_day?: number
          units_per_dose?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insulin_schedules_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          daily_summary: boolean | null
          glucose_alerts: boolean | null
          hyperglycemia_alerts: boolean | null
          hypoglycemia_alerts: boolean | null
          id: string
          measurement_reminders: boolean | null
          medication_reminders: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_summary?: boolean | null
          glucose_alerts?: boolean | null
          hyperglycemia_alerts?: boolean | null
          hypoglycemia_alerts?: boolean | null
          id?: string
          measurement_reminders?: boolean | null
          medication_reminders?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_summary?: boolean | null
          glucose_alerts?: boolean | null
          hyperglycemia_alerts?: boolean | null
          hypoglycemia_alerts?: boolean | null
          id?: string
          measurement_reminders?: boolean | null
          medication_reminders?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      patient_profiles: {
        Row: {
          birth_date: string | null
          city: string | null
          coadmin_email: string | null
          coadmin_name: string | null
          coadmin_phone: string | null
          created_at: string | null
          diabetes_type: string
          diagnosis_year: number | null
          estrato: number | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          id_number: string | null
          streak: number | null
          updated_at: string | null
          user_id: string
          xp_level: number | null
        }
        Insert: {
          birth_date?: string | null
          city?: string | null
          coadmin_email?: string | null
          coadmin_name?: string | null
          coadmin_phone?: string | null
          created_at?: string | null
          diabetes_type: string
          diagnosis_year?: number | null
          estrato?: number | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          id_number?: string | null
          streak?: number | null
          updated_at?: string | null
          user_id: string
          xp_level?: number | null
        }
        Update: {
          birth_date?: string | null
          city?: string | null
          coadmin_email?: string | null
          coadmin_name?: string | null
          coadmin_phone?: string | null
          created_at?: string | null
          diabetes_type?: string
          diagnosis_year?: number | null
          estrato?: number | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          id_number?: string | null
          streak?: number | null
          updated_at?: string | null
          user_id?: string
          xp_level?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sleep_records: {
        Row: {
          created_at: string | null
          date: string
          hours: number
          id: string
          patient_id: string
          quality: number
        }
        Insert: {
          created_at?: string | null
          date?: string
          hours: number
          id?: string
          patient_id: string
          quality: number
        }
        Update: {
          created_at?: string | null
          date?: string
          hours?: number
          id?: string
          patient_id?: string
          quality?: number
        }
        Relationships: [
          {
            foreignKeyName: "sleep_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stress_records: {
        Row: {
          created_at: string | null
          id: string
          level: number
          notes: string | null
          patient_id: string
          recorded_at: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level: number
          notes?: string | null
          patient_id: string
          recorded_at?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: number
          notes?: string | null
          patient_id?: string
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stress_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authorized_coadmin_email: {
        Args: { _email: string }
        Returns: {
          patient_name: string
          patient_profile_id: string
        }[]
      }
    }
    Enums: {
      gender_type: "masculino" | "femenino" | "otro" | "prefiero_no_decir"
      user_role: "patient" | "coadmin" | "doctor"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      gender_type: ["masculino", "femenino", "otro", "prefiero_no_decir"],
      user_role: ["patient", "coadmin", "doctor"],
    },
  },
} as const
