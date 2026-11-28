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
      admins: {
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
        Relationships: [
          {
            foreignKeyName: "admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applicant_id: string
          created_at: string
          decided_at: string | null
          id: string
          listing_id: string
          note: string
          status: string
        }
        Insert: {
          applicant_id?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          listing_id: string
          note?: string
          status?: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          listing_id?: string
          note?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      beacons: {
        Row: {
          category: string
          city: string
          created_at: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          category: string
          city: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Update: {
          category?: string
          city?: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beacons_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "beacons_city_fkey"
            columns: ["city"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "beacons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id?: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          is_active: boolean
          max_group: number
          min_group: number
          slug: string
          sort_order: number
        }
        Insert: {
          is_active?: boolean
          max_group: number
          min_group: number
          slug: string
          sort_order?: number
        }
        Update: {
          is_active?: boolean
          max_group?: number
          min_group?: number
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      chat_members: {
        Row: {
          chat_id: string
          joined_at: string
          last_read_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          chat_id: string
          joined_at?: string
          last_read_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          id: string
          listing_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          country_code: string
          is_active: boolean
          lat: number
          lng: number
          slug: string
          sort_order: number
          timezone: string
        }
        Insert: {
          country_code: string
          is_active?: boolean
          lat: number
          lng: number
          slug: string
          sort_order?: number
          timezone: string
        }
        Update: {
          country_code?: string
          is_active?: boolean
          lat?: number
          lng?: number
          slug?: string
          sort_order?: number
          timezone?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          accepted_count: number
          already_going: number
          author_id: string
          category: string
          city: string
          cost_eur: number | null
          cost_type: string
          created_at: string
          description: string
          duration_minutes: number | null
          group_max: number
          id: string
          languages: string[]
          lat: number
          lng: number
          moderation_reason: string | null
          moderation_status: string
          place_name: string
          skill_level: number | null
          starts_at: string
          status: string
          time_tbd: boolean
          title: string
          updated_at: string
        }
        Insert: {
          accepted_count?: number
          already_going?: number
          author_id?: string
          category: string
          city: string
          cost_eur?: number | null
          cost_type?: string
          created_at?: string
          description?: string
          duration_minutes?: number | null
          group_max: number
          id?: string
          languages?: string[]
          lat: number
          lng: number
          moderation_reason?: string | null
          moderation_status?: string
          place_name: string
          skill_level?: number | null
          starts_at: string
          status?: string
          time_tbd?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          accepted_count?: number
          already_going?: number
          author_id?: string
          category?: string
          city?: string
          cost_eur?: number | null
          cost_type?: string
          created_at?: string
          description?: string
          duration_minutes?: number | null
          group_max?: number
          id?: string
          languages?: string[]
          lat?: number
          lng?: number
          moderation_reason?: string | null
          moderation_status?: string
          place_name?: string
          skill_level?: number | null
          starts_at?: string
          status?: string
          time_tbd?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "listings_city_fkey"
            columns: ["city"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["slug"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          chat_id: string
          created_at: string
          hidden_at: string | null
          hidden_reason: string | null
          id: string
          moderated_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          chat_id: string
          created_at?: string
          hidden_at?: string | null
          hidden_reason?: string | null
          id?: string
          moderated_at?: string | null
          sender_id?: string
        }
        Update: {
          body?: string
          chat_id?: string
          created_at?: string
          hidden_at?: string | null
          hidden_reason?: string | null
          id?: string
          moderated_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      osm_places: {
        Row: {
          category: string | null
          city: string | null
          lat: number
          lng: number
          name: string | null
          osm_id: number
          osm_type: string
          tags: Json
          updated_at: string
        }
        Insert: {
          category?: string | null
          city?: string | null
          lat: number
          lng: number
          name?: string | null
          osm_id: number
          osm_type: string
          tags?: Json
          updated_at?: string
        }
        Update: {
          category?: string | null
          city?: string | null
          lat?: number
          lng?: number
          name?: string | null
          osm_id?: number
          osm_type?: string
          tags?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "osm_places_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "osm_places_city_fkey"
            columns: ["city"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["slug"]
          },
        ]
      }
      profile_private: {
        Row: {
          birth_date: string
          created_at: string
          requested_city: string | null
          ui_language: string
          user_id: string
        }
        Insert: {
          birth_date: string
          created_at?: string
          requested_city?: string | null
          ui_language?: string
          user_id: string
        }
        Update: {
          birth_date?: string
          created_at?: string
          requested_city?: string | null
          ui_language?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_private_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          bio: string
          created_at: string
          display_name: string
          home_city: string | null
          id: string
          languages: string[]
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          bio?: string
          created_at?: string
          display_name: string
          home_city?: string | null
          id: string
          languages?: string[]
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          home_city?: string | null
          id?: string
          languages?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_home_city_fkey"
            columns: ["home_city"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["slug"]
          },
        ]
      }
      push_tokens: {
        Row: {
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          ai_assessment: Json | null
          created_at: string
          details: string
          id: string
          reason: string
          reporter_id: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_listing_id: string | null
          target_message_id: string | null
          target_snapshot: Json | null
          target_user_id: string | null
        }
        Insert: {
          ai_assessment?: Json | null
          created_at?: string
          details?: string
          id?: string
          reason: string
          reporter_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_listing_id?: string | null
          target_message_id?: string | null
          target_snapshot?: Json | null
          target_user_id?: string | null
        }
        Update: {
          ai_assessment?: Json | null
          created_at?: string
          details?: string
          id?: string
          reason?: string
          reporter_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_listing_id?: string | null
          target_message_id?: string | null
          target_snapshot?: Json | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_listing_id_fkey"
            columns: ["target_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_message_id_fkey"
            columns: ["target_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      swipes: {
        Row: {
          created_at: string
          direction: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          listing_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          direction?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bans: {
        Row: {
          banned_by: string | null
          created_at: string
          reason: string
          user_id: string
        }
        Insert: {
          banned_by?: string | null
          created_at?: string
          reason: string
          user_id: string
        }
        Update: {
          banned_by?: string | null
          created_at?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bans_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          category: string
          created_at: string
          skill_level: number | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          skill_level?: number | null
          user_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          skill_level?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_application: {
        Args: { p_application_id: string }
        Returns: undefined
      }
      admin_ban_user: {
        Args: { p_reason: string; p_user_id: string }
        Returns: undefined
      }
      admin_hide_message: {
        Args: { p_message_id: string; p_reason: string }
        Returns: undefined
      }
      admin_moderate_listing: {
        Args: { p_decision: string; p_listing_id: string; p_reason?: string }
        Returns: undefined
      }
      admin_unban_user: { Args: { p_user_id: string }; Returns: undefined }
      complete_onboarding: {
        Args: {
          p_birth_date: string
          p_display_name: string
          p_home_city?: string
          p_interests?: Json
          p_languages?: string[]
          p_requested_city?: string
          p_ui_language?: string
        }
        Returns: {
          avatar_path: string | null
          bio: string
          created_at: string
          display_name: string
          home_city: string | null
          id: string
          languages: string[]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_listing: {
        Args: {
          p_already_going: number
          p_category: string
          p_city: string
          p_cost_eur: number
          p_cost_type: string
          p_day: string
          p_description: string
          p_group_max: number
          p_languages: string[]
          p_lat: number
          p_lng: number
          p_place_name: string
          p_skill_level: number
          p_time: string
          p_title: string
        }
        Returns: string
      }
      decline_application: {
        Args: { p_application_id: string }
        Returns: undefined
      }
      distance_km: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      feed_listings: {
        Args: {
          p_category?: string
          p_lat: number
          p_limit?: number
          p_lng: number
          p_radius_km?: number
        }
        Returns: {
          author_id: string
          category: string
          city: string
          cost_eur: number
          cost_type: string
          description: string
          distance_km: number
          duration_minutes: number
          group_max: number
          id: string
          languages: string[]
          lat: number
          lng: number
          place_name: string
          skill_level: number
          spots_left: number
          starts_at: string
          time_tbd: boolean
          title: string
        }[]
      }
      register_push_token: {
        Args: { p_platform: string; p_token: string }
        Returns: undefined
      }
      swipe_listing: {
        Args: { p_direction: string; p_listing_id: string; p_note?: string }
        Returns: undefined
      }
      update_profile: {
        Args: {
          p_bio?: string
          p_display_name: string
          p_home_city?: string
          p_interests?: Json
          p_languages?: string[]
          p_requested_city?: string
        }
        Returns: {
          avatar_path: string | null
          bio: string
          created_at: string
          display_name: string
          home_city: string | null
          id: string
          languages: string[]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      withdraw_application: {
        Args: { p_application_id: string }
        Returns: undefined
      }
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
    Enums: {},
  },
} as const
