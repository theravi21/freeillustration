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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      illustrations: {
        Row: {
          approved_at: string | null
          created_at: string
          creator_id: string | null
          description: string | null
          dimensions_height: number | null
          dimensions_width: number | null
          dominant_color: string | null
          download_count: number | null
          file_path: string
          file_size: number | null
          id: string
          orientation: string | null
          original_file_size: number | null
          original_filename: string | null
          png_large_path: string | null
          png_medium_path: string | null
          png_small_path: string | null
          processing_error: string | null
          processing_status: string | null
          published: boolean | null
          raw_file_path: string | null
          status: string
          style: string | null
          svg_path: string | null
          tags: string[] | null
          thumbnail_path: string | null
          title: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          dimensions_height?: number | null
          dimensions_width?: number | null
          dominant_color?: string | null
          download_count?: number | null
          file_path: string
          file_size?: number | null
          id?: string
          orientation?: string | null
          original_file_size?: number | null
          original_filename?: string | null
          png_large_path?: string | null
          png_medium_path?: string | null
          png_small_path?: string | null
          processing_error?: string | null
          processing_status?: string | null
          published?: boolean | null
          raw_file_path?: string | null
          status?: string
          style?: string | null
          svg_path?: string | null
          tags?: string[] | null
          thumbnail_path?: string | null
          title: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          dimensions_height?: number | null
          dimensions_width?: number | null
          dominant_color?: string | null
          download_count?: number | null
          file_path?: string
          file_size?: number | null
          id?: string
          orientation?: string | null
          original_file_size?: number | null
          original_filename?: string | null
          png_large_path?: string | null
          png_medium_path?: string | null
          png_small_path?: string | null
          processing_error?: string | null
          processing_status?: string | null
          published?: boolean | null
          raw_file_path?: string | null
          status?: string
          style?: string | null
          svg_path?: string | null
          tags?: string[] | null
          thumbnail_path?: string | null
          title?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      Inventory: {
        Row: {
          "Category/Tags": string | null
          "Content Owner": string | null
          "Content Type (blog, product, landing, docs, etc.": string | null
          "Content Type (blog, product, landing, docs, etc.)": string | null
          "Internal Links (key in/out links)": string | null
          "Last Updated": string | null
          "Linked Assets (images, PDFs, videos)": string | null
          "Meta Description": string | null
          "Meta Title": string | null
          "Notes/Comments": string | null
          "Page Title": string
          "Performance: Avg engagement time or Time on page": number | null
          "Performance: Conversions/Conversion rate": number | null
          "Performance: Pageviews (GA4)": number | null
          "Publish Date": string | null
          "SEO: Clicks and CTR": number | null
          "SEO: Impressions": number | null
          "Status (Not started, Draft, Pending approval, Approved/Publishe":
            | string
            | null
          URL: number
        }
        Insert: {
          "Category/Tags"?: string | null
          "Content Owner"?: string | null
          "Content Type (blog, product, landing, docs, etc."?: string | null
          "Content Type (blog, product, landing, docs, etc.)"?: string | null
          "Internal Links (key in/out links)"?: string | null
          "Last Updated"?: string | null
          "Linked Assets (images, PDFs, videos)"?: string | null
          "Meta Description"?: string | null
          "Meta Title"?: string | null
          "Notes/Comments"?: string | null
          "Page Title": string
          "Performance: Avg engagement time or Time on page"?: number | null
          "Performance: Conversions/Conversion rate"?: number | null
          "Performance: Pageviews (GA4)"?: number | null
          "Publish Date"?: string | null
          "SEO: Clicks and CTR"?: number | null
          "SEO: Impressions"?: number | null
          "Status (Not started, Draft, Pending approval, Approved/Publishe"?:
            | string
            | null
          URL?: number
        }
        Update: {
          "Category/Tags"?: string | null
          "Content Owner"?: string | null
          "Content Type (blog, product, landing, docs, etc."?: string | null
          "Content Type (blog, product, landing, docs, etc.)"?: string | null
          "Internal Links (key in/out links)"?: string | null
          "Last Updated"?: string | null
          "Linked Assets (images, PDFs, videos)"?: string | null
          "Meta Description"?: string | null
          "Meta Title"?: string | null
          "Notes/Comments"?: string | null
          "Page Title"?: string
          "Performance: Avg engagement time or Time on page"?: number | null
          "Performance: Conversions/Conversion rate"?: number | null
          "Performance: Pageviews (GA4)"?: number | null
          "Publish Date"?: string | null
          "SEO: Clicks and CTR"?: number | null
          "SEO: Impressions"?: number | null
          "Status (Not started, Draft, Pending approval, Approved/Publishe"?:
            | string
            | null
          URL?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_download_count: {
        Args: { illustration_id: string }
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
