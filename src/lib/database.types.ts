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
          tier: number
          atk: number
          def: number
          signature_move: string | null
          sprite: string | null
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
          tier?: number
          atk?: number
          def?: number
          signature_move?: string | null
          sprite?: string | null
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
          tier?: number
          atk?: number
          def?: number
          signature_move?: string | null
          sprite?: string | null
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
          max_hp: number
          current_hp: number
          knockout_until: string | null
          defense: number
          crit_chance: number
          combo_multiplier: number
          last_combo_time: string | null
        }
        Insert: {
          created_at?: string | null
          gold?: number
          id: string
          level?: number
          total_xp?: number
          username: string
          max_hp?: number
          current_hp?: number
          knockout_until?: string | null
          defense?: number
          crit_chance?: number
          combo_multiplier?: number
          last_combo_time?: string | null
        }
        Update: {
          created_at?: string | null
          gold?: number
          id?: string
          level?: number
          total_xp?: number
          username?: string
          max_hp?: number
          current_hp?: number
          knockout_until?: string | null
          defense?: number
          crit_chance?: number
          combo_multiplier?: number
          last_combo_time?: string | null
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
          idempotency_key: string | null
          xp_gained: number | null
          gold_gained: number | null
          boss_damage: number | null
          is_crit: boolean | null
          combo_multiplier: number | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          source: string
          type: string
          user_id: string
          idempotency_key?: string | null
          xp_gained?: number | null
          gold_gained?: number | null
          boss_damage?: number | null
          is_crit?: boolean | null
          combo_multiplier?: number | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          source?: string
          type?: string
          user_id?: string
          idempotency_key?: string | null
          xp_gained?: number | null
          gold_gained?: number | null
          boss_damage?: number | null
          is_crit?: boolean | null
          combo_multiplier?: number | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_quest: {
        Args: { p_task_id: string; p_user_id: string; p_idempotency_key?: string }
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
