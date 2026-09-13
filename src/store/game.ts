import { create } from 'zustand';

export interface Profile {
  id: string;
  username: string;
  level: number;
  total_xp: number;
  gold: number;
  current_hp: number;
  max_hp: number;
  defense: number;
  crit_chance: number;
  combo_multiplier: number;
  knockout_until: string | null;
}

export interface Attributes {
  intellect: number;
  strength: number;
  discipline: number;
  creativity: number;
}

export interface Streak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  status: string;
  attribute_tag: string;
  created_at: string | null;
  completed_at: string | null;
  deadline?: string | null;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  quests: Partial<Task>[];
  completed: boolean;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration_days: number;
  chapters: Chapter[];
  status: 'active' | 'completed';
  created_at: string;
}

export interface ChronicleEvent {
  id: string;
  type: 'level_up' | 'quest' | 'achievement' | 'campaign' | 'skill';
  title: string;
  description: string;
  date?: string;
  created_at?: string;
}

export interface UserSettings {
  daily_goal: number;
  difficulty_preference: string;
  auto_quest_suggestions: boolean;
  theme: string;
  color_accent: string;
  crt_effect: boolean;
  ui_mode: string;
  animations: boolean;
  master_volume: number;
  music: boolean;
  sfx: boolean;
  ui_sounds: boolean;
  quest_reminders: boolean;
  achievement_notifications: boolean;
  level_up_notifications: boolean;
  campaign_reminders: boolean;
  reduce_motion: boolean;
  high_contrast: boolean;
  font_size: string;
}

export interface CompleteResult {
  level: number;
  total_xp: number;
  gold: number;
  xp_gained: number;
  gold_gained: number;
  level_up: boolean;
  current_streak: number;
  longest_streak: number;
  attributes: Attributes;
  boss_damage?: number;
  counter_damage?: number;
  is_crit?: boolean;
  combo_multiplier?: number;
  current_hp?: number;
  max_hp?: number;
}

interface GameState {
  profile: Profile | null;
  attributes: Attributes | null;
  streak: Streak | null;
  tasks: Task[];
  campaigns: Campaign[];
  chronicleEvents: ChronicleEvent[];
  settings: UserSettings | null;
  isLoading: boolean;
  lastCombatResult: CompleteResult | null;

  setProfile: (p: Profile) => void;
  setAttributes: (a: Attributes) => void;
  setStreak: (s: Streak) => void;
  setTasks: (t: Task[]) => void;
  setCampaigns: (c: Campaign[]) => void;
  setChronicleEvents: (e: ChronicleEvent[]) => void;
  setSettings: (s: UserSettings) => void;
  updateSettings: (s: Partial<UserSettings>) => void;
  setLoading: (v: boolean) => void;

  // Optimistic task complete
  optimisticComplete: (taskId: string) => void;
  rollbackComplete: (taskId: string) => void;

  // Apply server authoritative state after complete
  applyCompleteResult: (taskId: string, result: CompleteResult) => void;
  applyUndoResult: (taskId: string, result: Partial<CompleteResult> & { profile?: Profile }) => void;

  // Add new task optimistically
  addTask: (task: Task) => void;
  removeTask: (taskId: string) => void;

  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  profile: null,
  attributes: null,
  streak: null,
  tasks: [],
  campaigns: [],
  chronicleEvents: [],
  settings: null,
  isLoading: false,

  lastCombatResult: null,

  setProfile: (p) => set({ profile: p }),
  setAttributes: (a) => set({ attributes: a }),
  setStreak: (s) => set({ streak: s }),
  setTasks: (t) => set({ tasks: t }),
  setCampaigns: (c) => set({ campaigns: c }),
  setChronicleEvents: (e) => set({ chronicleEvents: e }),
  setSettings: (s) => set({ settings: s }),
  updateSettings: (s) => set((state) => ({ settings: state.settings ? { ...state.settings, ...s } : null })),
  setLoading: (v) => set({ isLoading: v }),

  optimisticComplete: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'completed' } : t
      ),
    })),

  rollbackComplete: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'active' } : t
      ),
    })),

  applyUndoResult: (taskId, result) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'active', completed_at: null } : t
      ),
      profile: result.profile || state.profile,
      attributes: result.attributes || state.attributes,
    })),

  applyCompleteResult: (taskId, result) =>
    set((state) => ({
      lastCombatResult: result,
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: 'completed', completed_at: new Date().toISOString() }
          : t
      ),
      profile: state.profile
        ? {
            ...state.profile,
            level: result.level,
            total_xp: result.total_xp,
            gold: result.gold,
            current_hp: result.current_hp ?? state.profile.current_hp,
            max_hp: result.max_hp ?? state.profile.max_hp,
            combo_multiplier: result.combo_multiplier ?? state.profile.combo_multiplier,
          }
        : null,
      attributes: result.attributes,
      streak: state.streak
        ? {
            ...state.streak,
            current_streak: result.current_streak,
            longest_streak: result.longest_streak,
          }
        : null,
    })),

  addTask: (task) =>
    set((state) => ({ tasks: [task, ...state.tasks] })),

  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    })),

  reset: () =>
    set({
      profile: null,
      attributes: null,
      streak: null,
      tasks: [],
      campaigns: [],
      chronicleEvents: [],
      settings: null,
      isLoading: false,
    }),
}));
