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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_messages: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          message: string
          read: boolean
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          message: string
          read?: boolean
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          message?: string
          read?: boolean
          to_user_id?: string
        }
        Relationships: []
      }
      calculator_results: {
        Row: {
          braking_table: Json
          created_at: string
          deceleration: number
          grip: number
          id: string
          payload: number
          safe_speed: number
          slope: number
          user_id: string
          vehicle_mass: number
        }
        Insert: {
          braking_table?: Json
          created_at?: string
          deceleration: number
          grip: number
          id?: string
          payload: number
          safe_speed: number
          slope: number
          user_id: string
          vehicle_mass: number
        }
        Update: {
          braking_table?: Json
          created_at?: string
          deceleration?: number
          grip?: number
          id?: string
          payload?: number
          safe_speed?: number
          slope?: number
          user_id?: string
          vehicle_mass?: number
        }
        Relationships: []
      }
      driver_messages: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          message: string
          read: boolean
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          message: string
          read?: boolean
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          message?: string
          read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "driver_messages_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string
          display_name: string
          id: string
          password: string
          vehicle_name: string | null
          vehicle_plate: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          password: string
          vehicle_name?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          password?: string
          vehicle_name?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
          vehicle_name: string | null
          vehicle_plate: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          vehicle_name?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          vehicle_name?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      vehicle_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          message: string
          safe_speed: number | null
          severity: string
          speed: number | null
          user_id: string
          vehicle_id: string
          vehicle_name: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          message: string
          safe_speed?: number | null
          severity?: string
          speed?: number | null
          user_id: string
          vehicle_id: string
          vehicle_name: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          safe_speed?: number | null
          severity?: string
          speed?: number | null
          user_id?: string
          vehicle_id?: string
          vehicle_name?: string
        }
        Relationships: []
      }
      vehicle_telemetry: {
        Row: {
          braking_distance: number
          created_at: string
          deceleration: number
          driver: string | null
          grip_coefficient: number
          id: string
          latitude: number | null
          load: number
          location: string | null
          longitude: number | null
          safe_speed: number
          slope: number
          speed: number
          status: string
          throttle: number
          updated_at: string
          vehicle_id: string
          vehicle_name: string | null
          vehicle_plate: string | null
          vehicle_type: string | null
        }
        Insert: {
          braking_distance?: number
          created_at?: string
          deceleration?: number
          driver?: string | null
          grip_coefficient?: number
          id?: string
          latitude?: number | null
          load?: number
          location?: string | null
          longitude?: number | null
          safe_speed?: number
          slope?: number
          speed?: number
          status?: string
          throttle?: number
          updated_at?: string
          vehicle_id: string
          vehicle_name?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Update: {
          braking_distance?: number
          created_at?: string
          deceleration?: number
          driver?: string | null
          grip_coefficient?: number
          id?: string
          latitude?: number | null
          load?: number
          location?: string | null
          longitude?: number | null
          safe_speed?: number
          slope?: number
          speed?: number
          status?: string
          throttle?: number
          updated_at?: string
          vehicle_id?: string
          vehicle_name?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
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
      app_role: "admin" | "driver"
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
      app_role: ["admin", "driver"],
    },
  },
} as const
