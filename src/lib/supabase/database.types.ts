export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          care_request_id: string | null
          caretaker_id: string | null
          created_at: string | null
          id: string
          payment_status: string | null
          price: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          care_request_id?: string | null
          caretaker_id?: string | null
          created_at?: string | null
          id?: string
          payment_status?: string | null
          price?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          care_request_id?: string | null
          caretaker_id?: string | null
          created_at?: string | null
          id?: string
          payment_status?: string | null
          price?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_care_request_id_fkey"
            columns: ["care_request_id"]
            isOneToOne: false
            referencedRelation: "care_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_caretaker_id_fkey"
            columns: ["caretaker_id"]
            isOneToOne: false
            referencedRelation: "caretaker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_requests: {
        Row: {
          created_at: string | null
          emergency_contact: string | null
          end_date: string | null
          id: string
          owner_id: string | null
          pet_id: string | null
          services: Json
          special_instructions: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          vet_info: string | null
        }
        Insert: {
          created_at?: string | null
          emergency_contact?: string | null
          end_date?: string | null
          id?: string
          owner_id?: string | null
          pet_id?: string | null
          services: Json
          special_instructions?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          vet_info?: string | null
        }
        Update: {
          created_at?: string | null
          emergency_contact?: string | null
          end_date?: string | null
          id?: string
          owner_id?: string | null
          pet_id?: string | null
          services?: Json
          special_instructions?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          vet_info?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "caretaker_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_requests_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      caretaker_profiles: {
        Row: {
          animal_types: string[] | null
          availability: Json | null
          bio: string | null
          created_at: string | null
          experience_description: string | null
          experience_years: number | null
          home_photos: string[] | null
          hourly_rate: number | null
          id: string
          is_verified: boolean | null
          long_about_me: string | null
          prices: Json | null
          qualifications: string[] | null
          rating: number | null
          review_count: number | null
          service_radius: number | null
          services: Json | null
          short_about_me: string | null
          updated_at: string | null
        }
        Insert: {
          animal_types?: string[] | null
          availability?: Json | null
          bio?: string | null
          created_at?: string | null
          experience_description?: string | null
          experience_years?: number | null
          home_photos?: string[] | null
          hourly_rate?: number | null
          id: string
          is_verified?: boolean | null
          long_about_me?: string | null
          prices?: Json | null
          qualifications?: string[] | null
          rating?: number | null
          review_count?: number | null
          service_radius?: number | null
          services?: Json | null
          short_about_me?: string | null
          updated_at?: string | null
        }
        Update: {
          animal_types?: string[] | null
          availability?: Json | null
          bio?: string | null
          created_at?: string | null
          experience_description?: string | null
          experience_years?: number | null
          home_photos?: string[] | null
          hourly_rate?: number | null
          id?: string
          is_verified?: boolean | null
          long_about_me?: string | null
          prices?: Json | null
          qualifications?: string[] | null
          rating?: number | null
          review_count?: number | null
          service_radius?: number | null
          services?: Json | null
          short_about_me?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "caretaker_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "caretaker_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caretaker_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          caretaker_id: string
          created_at: string | null
          id: string
          last_message_at: string | null
          owner_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          caretaker_id: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          owner_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          caretaker_id?: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          owner_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_caretaker_id_fkey"
            columns: ["caretaker_id"]
            isOneToOne: false
            referencedRelation: "caretaker_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_caretaker_id_fkey"
            columns: ["caretaker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "caretaker_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          edited_at: string | null
          id: string
          message_type: string | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          edited_at?: string | null
          id?: string
          message_type?: string | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          edited_at?: string | null
          id?: string
          message_type?: string | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "caretaker_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_caretaker_connections: {
        Row: {
          caretaker_id: string
          created_at: string
          id: string
          owner_id: string
          status: string
          updated_at: string
        }
        Insert: {
          caretaker_id: string
          created_at?: string
          id?: string
          owner_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          caretaker_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_caretaker_connections_caretaker_id_fkey"
            columns: ["caretaker_id"]
            isOneToOne: false
            referencedRelation: "caretaker_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_caretaker_connections_caretaker_id_fkey"
            columns: ["caretaker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_caretaker_connections_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "caretaker_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_caretaker_connections_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_preferences: {
        Row: {
          care_instructions: string | null
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          other_services: string | null
          owner_id: string
          services: string[]
          share_settings: Json | null
          vet_info: string | null
        }
        Insert: {
          care_instructions?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          other_services?: string | null
          owner_id: string
          services: string[]
          share_settings?: Json | null
          vet_info?: string | null
        }
        Update: {
          care_instructions?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          other_services?: string | null
          owner_id?: string
          services?: string[]
          share_settings?: Json | null
          vet_info?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_preferences_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "caretaker_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_preferences_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          age: number | null
          breed: string | null
          created_at: string | null
          description: string | null
          gender: string | null
          id: string
          name: string
          neutered: boolean | null
          owner_id: string | null
          photo_url: string | null
          type: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          breed?: string | null
          created_at?: string | null
          description?: string | null
          gender?: string | null
          id?: string
          name: string
          neutered?: boolean | null
          owner_id?: string | null
          photo_url?: string | null
          type: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          breed?: string | null
          created_at?: string | null
          description?: string | null
          gender?: string | null
          id?: string
          name?: string
          neutered?: boolean | null
          owner_id?: string | null
          photo_url?: string | null
          type?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "caretaker_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plzs: {
        Row: {
          city: string
          created_at: string | null
          latitude: number | null
          location: unknown | null
          longitude: number | null
          plz: string
        }
        Insert: {
          city: string
          created_at?: string | null
          latitude?: number | null
          location?: unknown | null
          longitude?: number | null
          plz: string
        }
        Update: {
          city?: string
          created_at?: string | null
          latitude?: number | null
          location?: unknown | null
          longitude?: number | null
          plz?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          care_request_id: string | null
          caretaker_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          care_request_id?: string | null
          caretaker_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          care_request_id?: string | null
          caretaker_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_care_request_id_fkey"
            columns: ["care_request_id"]
            isOneToOne: false
            referencedRelation: "care_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_caretaker_id_fkey"
            columns: ["caretaker_id"]
            isOneToOne: false
            referencedRelation: "caretaker_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "caretaker_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          phone_number: string | null
          plz: string | null
          profile_completed: boolean | null
          profile_photo_url: string | null
          updated_at: string | null
          user_type: string | null
          username: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          phone_number?: string | null
          plz?: string | null
          profile_completed?: boolean | null
          profile_photo_url?: string | null
          updated_at?: string | null
          user_type?: string | null
          username?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          phone_number?: string | null
          plz?: string | null
          profile_completed?: boolean | null
          profile_photo_url?: string | null
          updated_at?: string | null
          user_type?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_plz_city_fkey"
            columns: ["plz", "city"]
            isOneToOne: false
            referencedRelation: "plzs"
            referencedColumns: ["plz", "city"]
          },
        ]
      }
    }
    Views: {
      caretaker_search_view: {
        Row: {
          animal_types: string[] | null
          city: string | null
          experience_description: string | null
          experience_years: number | null
          first_name: string | null
          full_name: string | null
          home_photos: string[] | null
          hourly_rate: number | null
          id: string | null
          is_verified: boolean | null
          last_name: string | null
          long_about_me: string | null
          plz: string | null
          profile_photo_url: string | null
          qualifications: string[] | null
          rating: number | null
          review_count: number | null
          service_radius: number | null
          services: Json | null
          short_about_me: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_plz_city_fkey"
            columns: ["plz", "city"]
            isOneToOne: false
            referencedRelation: "plzs"
            referencedColumns: ["plz", "city"]
          },
        ]
      }
    }
    Functions: {
      check_caretaker_access: {
        Args: { target_owner_id: string; requesting_caretaker_id: string }
        Returns: boolean
      }
      get_caretaker_by_id: {
        Args: { caretaker_id: string }
        Returns: {
          id: string
          services: Json
          hourly_rate: number
          rating: number
          review_count: number
          is_verified: boolean
          short_about_me: string
          long_about_me: string
          experience_years: number
          first_name: string
          last_name: string
          city: string
          plz: string
          profile_photo_url: string
          phone_number: string
          email: string
        }[]
      }
      search_caretakers: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          services: Json
          hourly_rate: number
          rating: number
          review_count: number
          is_verified: boolean
          short_about_me: string
          long_about_me: string
          experience_years: number
          first_name: string
          last_name: string
          city: string
          plz: string
          profile_photo_url: string
          phone_number: string
          email: string
        }[]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// Helper type for our caretaker search view
export type CaretakerSearchResult = Tables<'caretaker_search_view'>