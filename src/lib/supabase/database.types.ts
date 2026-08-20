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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      appearance_settings: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          published_at: string | null
          schema_version: number
          settings: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: never
          published_at?: string | null
          schema_version?: number
          settings: Json
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: never
          published_at?: string | null
          schema_version?: number
          settings?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      parse_issues: {
        Row: {
          acknowledged: boolean
          code: string
          created_at: string
          entry_indexes: number[] | null
          id: number
          message: string
          revision_id: number
          severity: string
        }
        Insert: {
          acknowledged?: boolean
          code: string
          created_at?: string
          entry_indexes?: number[] | null
          id?: never
          message: string
          revision_id: number
          severity: string
        }
        Update: {
          acknowledged?: boolean
          code?: string
          created_at?: string
          entry_indexes?: number[] | null
          id?: never
          message?: string
          revision_id?: number
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "parse_issues_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "resume_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_entries: {
        Row: {
          content: Json
          content_schema_version: number
          created_at: string
          end_date: string | null
          id: number
          organization: string | null
          position: number
          role: string | null
          section_id: number
          start_date: string | null
          title: string
          updated_at: string
          visible: boolean
          wheel_label: string
        }
        Insert: {
          content?: Json
          content_schema_version?: number
          created_at?: string
          end_date?: string | null
          id?: never
          organization?: string | null
          position: number
          role?: string | null
          section_id: number
          start_date?: string | null
          title: string
          updated_at?: string
          visible?: boolean
          wheel_label: string
        }
        Update: {
          content?: Json
          content_schema_version?: number
          created_at?: string
          end_date?: string | null
          id?: never
          organization?: string | null
          position?: number
          role?: string | null
          section_id?: number
          start_date?: string | null
          title?: string
          updated_at?: string
          visible?: boolean
          wheel_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_entries_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "resume_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_files: {
        Row: {
          byte_size: number | null
          checksum_sha256: string | null
          created_at: string
          error_message: string | null
          generated_from_version: number | null
          id: number
          kind: string
          revision_id: number
          status: string
          storage_bucket: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          byte_size?: number | null
          checksum_sha256?: string | null
          created_at?: string
          error_message?: string | null
          generated_from_version?: number | null
          id?: never
          kind: string
          revision_id: number
          status?: string
          storage_bucket: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          byte_size?: number | null
          checksum_sha256?: string | null
          created_at?: string
          error_message?: string | null
          generated_from_version?: number | null
          id?: never
          kind?: string
          revision_id?: number
          status?: string
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_files_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "resume_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_profiles: {
        Row: {
          content_version: number
          created_at: string
          id: number
          is_active: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          content_version?: number
          created_at?: string
          id?: never
          is_active?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          content_version?: number
          created_at?: string
          id?: never
          is_active?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      resume_revisions: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          identity: Json
          parse_status: string
          phone_visible: boolean
          profile_id: number
          published_at: string | null
          schema_version: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: never
          identity?: Json
          parse_status?: string
          phone_visible?: boolean
          profile_id: number
          published_at?: string | null
          schema_version?: number
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: never
          identity?: Json
          parse_status?: string
          phone_visible?: boolean
          profile_id?: number
          published_at?: string | null
          schema_version?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_revisions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "resume_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_sections: {
        Row: {
          created_at: string
          id: number
          kind: string
          position: number
          revision_id: number
          summary: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          id?: never
          kind: string
          position: number
          revision_id: number
          summary?: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          id?: never
          kind?: string
          position?: number
          revision_id?: number
          summary?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "resume_sections_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "resume_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
