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
      admin_activity_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: []
      }
      agent_applications: {
        Row: {
          admin_note: string | null
          bio: string | null
          city: string | null
          created_at: string
          email: string
          experience_years: number | null
          full_name: string
          generated_password: string | null
          id: string
          languages: string | null
          phone: string | null
          reason: string | null
          rera_number: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          specialization: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email: string
          experience_years?: number | null
          full_name: string
          generated_password?: string | null
          id?: string
          languages?: string | null
          phone?: string | null
          reason?: string | null
          rera_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialization?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string
          experience_years?: number | null
          full_name?: string
          generated_password?: string | null
          id?: string
          languages?: string | null
          phone?: string | null
          reason?: string | null
          rera_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialization?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_clients: {
        Row: {
          agent_id: string
          client_email: string | null
          client_name: string
          client_phone: string | null
          commission: number | null
          created_at: string
          deal_value: number | null
          id: string
          notes: string | null
          property_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          commission?: number | null
          created_at?: string
          deal_value?: number | null
          id?: string
          notes?: string | null
          property_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          commission?: number | null
          created_at?: string
          deal_value?: number | null
          id?: string
          notes?: string | null
          property_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_profiles: {
        Row: {
          agent_id: string
          areas_served: string[] | null
          certifications: string[] | null
          commission_earned: number | null
          created_at: string
          experience_years: number | null
          id: string
          languages: string | null
          properties_listed: number | null
          rating: number | null
          specialization: string | null
          total_revenue: number | null
          total_reviews: number | null
          total_sales: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          areas_served?: string[] | null
          certifications?: string[] | null
          commission_earned?: number | null
          created_at?: string
          experience_years?: number | null
          id?: string
          languages?: string | null
          properties_listed?: number | null
          rating?: number | null
          specialization?: string | null
          total_revenue?: number | null
          total_reviews?: number | null
          total_sales?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          areas_served?: string[] | null
          certifications?: string[] | null
          commission_earned?: number | null
          created_at?: string
          experience_years?: number | null
          id?: string
          languages?: string | null
          properties_listed?: number | null
          rating?: number | null
          specialization?: string | null
          total_revenue?: number | null
          total_reviews?: number | null
          total_sales?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_reviews: {
        Row: {
          agent_user_id: string
          created_at: string
          id: string
          rating: number
          review_text: string | null
          reviewer_name: string
          reviewer_user_id: string
        }
        Insert: {
          agent_user_id: string
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          reviewer_name: string
          reviewer_user_id: string
        }
        Update: {
          agent_user_id?: string
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          reviewer_name?: string
          reviewer_user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_id: string
          author_name: string | null
          category: string
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published_at: string | null
          read_time: number | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name?: string | null
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          read_time?: number | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string | null
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          read_time?: number | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          agent_id: string | null
          budget: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          otp_code: string | null
          otp_verified: boolean | null
          phone: string
          property_id: string | null
          status: string
          updated_at: string
          user_id: string | null
          visit_date: string | null
        }
        Insert: {
          agent_id?: string | null
          budget?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          otp_code?: string | null
          otp_verified?: boolean | null
          phone: string
          property_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          visit_date?: string | null
        }
        Update: {
          agent_id?: string | null
          budget?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          otp_code?: string | null
          otp_verified?: boolean | null
          phone?: string
          property_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          visit_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      new_projects: {
        Row: {
          amenities: string[] | null
          available_units: number | null
          builder: string
          city: string
          configs: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image: string | null
          images: string[] | null
          is_featured: boolean | null
          is_new: boolean | null
          locality: string
          max_price: number
          min_price: number
          name: string
          possession_date: string | null
          rating: number | null
          rera_id: string | null
          status: string
          total_units: number | null
          type: string
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          available_units?: number | null
          builder: string
          city: string
          configs?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image?: string | null
          images?: string[] | null
          is_featured?: boolean | null
          is_new?: boolean | null
          locality: string
          max_price?: number
          min_price?: number
          name: string
          possession_date?: string | null
          rating?: number | null
          rera_id?: string | null
          status?: string
          total_units?: number | null
          type?: string
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          available_units?: number | null
          builder?: string
          city?: string
          configs?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image?: string | null
          images?: string[] | null
          is_featured?: boolean | null
          is_new?: boolean | null
          locality?: string
          max_price?: number
          min_price?: number
          name?: string
          possession_date?: string | null
          rating?: number | null
          rera_id?: string | null
          status?: string
          total_units?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          bio: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_banned: boolean | null
          is_verified: boolean | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_banned?: boolean | null
          is_verified?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_banned?: boolean | null
          is_verified?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      property_listings: {
        Row: {
          address: string | null
          admin_note: string | null
          age_of_property: string | null
          amenities: string[] | null
          approval_authority: string | null
          area: number | null
          area_unit: string | null
          bathrooms: number | null
          bedrooms: number | null
          builder_name: string | null
          city: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          facing: string | null
          floor: number | null
          furnishing: string | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          is_new: boolean | null
          is_verified: boolean | null
          latitude: number | null
          listing_type: string
          locality: string
          longitude: number | null
          parking: number | null
          price: number
          price_per_sqft: number | null
          price_unit: string | null
          property_attributes: Json | null
          property_type: string
          rera_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          society_name: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          title: string
          total_floors: number | null
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          admin_note?: string | null
          age_of_property?: string | null
          amenities?: string[] | null
          approval_authority?: string | null
          area?: number | null
          area_unit?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          builder_name?: string | null
          city: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          facing?: string | null
          floor?: number | null
          furnishing?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          is_new?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          listing_type: string
          locality: string
          longitude?: number | null
          parking?: number | null
          price: number
          price_per_sqft?: number | null
          price_unit?: string | null
          property_attributes?: Json | null
          property_type: string
          rera_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          society_name?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title: string
          total_floors?: number | null
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          admin_note?: string | null
          age_of_property?: string | null
          amenities?: string[] | null
          approval_authority?: string | null
          area?: number | null
          area_unit?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          builder_name?: string | null
          city?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          facing?: string | null
          floor?: number | null
          furnishing?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          is_new?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          listing_type?: string
          locality?: string
          longitude?: number | null
          parking?: number | null
          price?: number
          price_per_sqft?: number | null
          price_unit?: string | null
          property_attributes?: Json | null
          property_type?: string
          rera_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          society_name?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title?: string
          total_floors?: number | null
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      property_reviews: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean | null
          property_id: string
          rating: number
          review_text: string | null
          reviewer_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean | null
          property_id: string
          rating: number
          review_text?: string | null
          reviewer_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean | null
          property_id?: string
          rating?: number
          review_text?: string | null
          reviewer_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      property_update_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          listing_id: string
          proposed_changes: Json
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          listing_id: string
          proposed_changes?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          proposed_changes?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_properties: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          alerts_enabled: boolean
          bedrooms: number | null
          city: string | null
          created_at: string
          id: string
          last_alerted_at: string | null
          listing_type: string | null
          locality: string | null
          max_price: number | null
          min_price: number | null
          name: string
          property_type: string | null
          user_id: string
        }
        Insert: {
          alerts_enabled?: boolean
          bedrooms?: number | null
          city?: string | null
          created_at?: string
          id?: string
          last_alerted_at?: string | null
          listing_type?: string | null
          locality?: string | null
          max_price?: number | null
          min_price?: number | null
          name: string
          property_type?: string | null
          user_id: string
        }
        Update: {
          alerts_enabled?: boolean
          bedrooms?: number | null
          city?: string | null
          created_at?: string
          id?: string
          last_alerted_at?: string | null
          listing_type?: string | null
          locality?: string | null
          max_price?: number | null
          min_price?: number | null
          name?: string
          property_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sponsorship_plans: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          duration_days: number
          features: string[] | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          sort_order: number | null
          stripe_price_id: string | null
          stripe_product_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          duration_days: number
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          duration_days?: number
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Relationships: []
      }
      sponsorships: {
        Row: {
          amount: number
          checkout_session_id: string | null
          created_at: string
          duration_days: number
          expires_at: string | null
          id: string
          listing_id: string
          payment_id: string | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          plan_name: string
          starts_at: string | null
          status: Database["public"]["Enums"]["sponsorship_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          checkout_session_id?: string | null
          created_at?: string
          duration_days?: number
          expires_at?: string | null
          id?: string
          listing_id: string
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          plan_name?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["sponsorship_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          checkout_session_id?: string | null
          created_at?: string
          duration_days?: number
          expires_at?: string | null
          id?: string
          listing_id?: string
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          plan_name?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["sponsorship_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorships_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      update_request_audit: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          id: string
          listing_id: string
          note: string | null
          request_id: string
          reviewer_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          id?: string
          listing_id: string
          note?: string | null
          request_id: string
          reviewer_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          id?: string
          listing_id?: string
          note?: string | null
          request_id?: string
          reviewer_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      market_trends: {
        Row: {
          avg_price_sqft: number | null
          city: string | null
          listing_count: number | null
          year: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_delete_user: { Args: { _target_user_id: string }; Returns: Json }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "agent" | "user"
      listing_status: "pending" | "approved" | "rejected" | "suspended"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      sponsorship_status: "pending" | "active" | "expired" | "cancelled"
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
      app_role: ["admin", "moderator", "agent", "user"],
      listing_status: ["pending", "approved", "rejected", "suspended"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      sponsorship_status: ["pending", "active", "expired", "cancelled"],
    },
  },
} as const
