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
      applications: {
        Row: {
          ai_analysis: Json | null
          behavioral_answers: Json | null
          birth_date: string | null
          certificate_urls: string[] | null
          certifications: Json | null
          city: string | null
          cpf: string | null
          created_at: string
          cultura_analysis: Json | null
          cultura_score: number | null
          education: Json | null
          email: string
          evaluated_at: string | null
          experience: Json | null
          fit_final: number | null
          fit_score: number | null
          full_name: string
          id: string
          job_id: string
          languages: Json | null
          linkedin: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          resume_url: string | null
          state: string | null
          status: Database["public"]["Enums"]["application_status"]
          summary_ai: string | null
          tecnica_analysis: Json | null
          tecnica_score: number | null
          updated_at: string
        }
        Insert: {
          ai_analysis?: Json | null
          behavioral_answers?: Json | null
          birth_date?: string | null
          certificate_urls?: string[] | null
          certifications?: Json | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          cultura_analysis?: Json | null
          cultura_score?: number | null
          education?: Json | null
          email: string
          evaluated_at?: string | null
          experience?: Json | null
          fit_final?: number | null
          fit_score?: number | null
          full_name: string
          id?: string
          job_id: string
          languages?: Json | null
          linkedin?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          resume_url?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          summary_ai?: string | null
          tecnica_analysis?: Json | null
          tecnica_score?: number | null
          updated_at?: string
        }
        Update: {
          ai_analysis?: Json | null
          behavioral_answers?: Json | null
          birth_date?: string | null
          certificate_urls?: string[] | null
          certifications?: Json | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          cultura_analysis?: Json | null
          cultura_score?: number | null
          education?: Json | null
          email?: string
          evaluated_at?: string | null
          experience?: Json | null
          fit_final?: number | null
          fit_score?: number | null
          full_name?: string
          id?: string
          job_id?: string
          languages?: Json | null
          linkedin?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          resume_url?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          summary_ai?: string | null
          tecnica_analysis?: Json | null
          tecnica_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          area: string
          created_at: string
          created_by: string | null
          custom_questions: Json
          deadline: string | null
          description: string
          desired_skills: string[] | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          icon: string | null
          id: string
          level: string | null
          location: string
          min_education: Database["public"]["Enums"]["education_level"] | null
          min_experience_years: number | null
          required_certifications: string[] | null
          required_languages: string[] | null
          requirements: string
          salary_max: number | null
          salary_min: number | null
          slug: string
          status: Database["public"]["Enums"]["job_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          area: string
          created_at?: string
          created_by?: string | null
          custom_questions?: Json
          deadline?: string | null
          description: string
          desired_skills?: string[] | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          icon?: string | null
          id?: string
          level?: string | null
          location: string
          min_education?: Database["public"]["Enums"]["education_level"] | null
          min_experience_years?: number | null
          required_certifications?: string[] | null
          required_languages?: string[] | null
          requirements: string
          salary_max?: number | null
          salary_min?: number | null
          slug: string
          status?: Database["public"]["Enums"]["job_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          area?: string
          created_at?: string
          created_by?: string | null
          custom_questions?: Json
          deadline?: string | null
          description?: string
          desired_skills?: string[] | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          icon?: string | null
          id?: string
          level?: string | null
          location?: string
          min_education?: Database["public"]["Enums"]["education_level"] | null
          min_experience_years?: number | null
          required_certifications?: string[] | null
          required_languages?: string[] | null
          requirements?: string
          salary_max?: number | null
          salary_min?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["job_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recruiter_settings: {
        Row: {
          fit_weights: Json | null
          notify_deadline: boolean | null
          notify_high_fit: boolean | null
          notify_new_application: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          fit_weights?: Json | null
          notify_deadline?: boolean | null
          notify_high_fit?: boolean | null
          notify_new_application?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          fit_weights?: Json | null
          notify_deadline?: boolean | null
          notify_high_fit?: boolean | null
          notify_new_application?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "recruiter" | "analyst"
      application_status:
        | "new"
        | "reviewing"
        | "interview"
        | "offer"
        | "hired"
        | "rejected"
      education_level:
        | "fundamental"
        | "medio"
        | "tecnico"
        | "superior"
        | "pos"
        | "mestrado"
        | "doutorado"
      employment_type: "clt" | "pj" | "estagio" | "temporario" | "freelancer"
      job_status: "open" | "closed"
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
      app_role: ["admin", "recruiter", "analyst"],
      application_status: [
        "new",
        "reviewing",
        "interview",
        "offer",
        "hired",
        "rejected",
      ],
      education_level: [
        "fundamental",
        "medio",
        "tecnico",
        "superior",
        "pos",
        "mestrado",
        "doutorado",
      ],
      employment_type: ["clt", "pj", "estagio", "temporario", "freelancer"],
      job_status: ["open", "closed"],
    },
  },
} as const
