export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attributes: {
        Row: {
          creativity: number
          discipline: number
          id: string
          intellect: number
          strength: number
          user_id: string
        }
        Insert: {
          creativity?: number
          discipline?: number
          id?: string
          intellect?: number
          strength?: number
          user_id: string
        }
        Update: {
          creativity?: number
          discipline?: number
          id?: string
          intellect?: number
          strength?: number
          user_id?: string
        }
      }
      bosses: {
        Row: {
          bonus_gold_granted: boolean
          created_at: string | null
          current_hp: number
          id: string
          max_hp: number
          name: string
          status: string
          user_id: string
          week_start: string
        }
        Insert: {
          bonus_gold_granted?: boolean
          created_at?: string | null
          current_hp: number
          id?: string
          max_hp: number
          name: string
          status?: string
          user_id: string
          week_start: string
        }
        Update: {
          bonus_gold_granted?: boolean
          created_at?: string | null
          current_hp?: number
          id?: string
          max_hp?: number
          name?: string
          status?: string
          user_id?: string
          week_start?: string
        }
      }
      profiles: {
        Row: {
          created_at: string | null
          gold: number
          id: string
          level: number
          total_xp: number
          username: string
        }
        Insert: {
          created_at?: string | null
          gold?: number
          id: string
          level?: number
          total_xp?: number
          username: string
        }
        Update: {
          created_at?: string | null
          gold?: number
          id?: string
          level?: number
          total_xp?: number
          username?: string
        }
      }
      streaks: {
        Row: {
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          user_id?: string
        }
      }
      tasks: {
        Row: {
          attribute_tag: string
          category: string
          completed_at: string | null
          created_at: string | null
          difficulty: string
          id: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          attribute_tag?: string
          category?: string
          completed_at?: string | null
          created_at?: string | null
          difficulty: string
          id?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          attribute_tag?: string
          category?: string
          completed_at?: string | null
          created_at?: string | null
          difficulty?: string
          id?: string
          status?: string
          title?: string
          user_id?: string
        }
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          source: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          source: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          source?: string
          type?: string
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_quest: {
        Args: { p_task_id: string; p_user_id: string }
        Returns: Json
      }
      get_or_create_boss: { Args: { p_user_id: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
