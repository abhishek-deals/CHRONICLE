import { create } from 'zustand';

export interface Profile {
  id: string;
  username: string;
  level: number;
  total_xp: number;
  gold: number;
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
}

export interface Boss {
  id: string;
  name: string;
  max_hp: number;
  current_hp: number;
  week_start: string;
  status: string;
  bonus_gold_granted: boolean;
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
  boss_hp: number | null;
  boss_defeated: boolean;
  boss_id: string | null;
}

interface GameState {
  profile: Profile | null;
  attributes: Attributes | null;
  streak: Streak | null;
  tasks: Task[];
  boss: Boss | null;
  isLoading: boolean;

  setProfile: (p: Profile) => void;
  setAttributes: (a: Attributes) => void;
  setStreak: (s: Streak) => void;
  setTasks: (t: Task[]) => void;
  setBoss: (b: Boss | null) => void;
  setLoading: (v: boolean) => void;

  // Optimistic task complete
  optimisticComplete: (taskId: string) => void;
  rollbackComplete: (taskId: string) => void;

  // Apply server authoritative state after complete
  applyCompleteResult: (taskId: string, result: CompleteResult) => void;

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
  boss: null,
  isLoading: false,

  setProfile: (p) => set({ profile: p }),
  setAttributes: (a) => set({ attributes: a }),
  setStreak: (s) => set({ streak: s }),
  setTasks: (t) => set({ tasks: t }),
  setBoss: (b) => set({ boss: b }),
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

  applyCompleteResult: (taskId, result) =>
    set((state) => ({
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
      boss:
        state.boss && result.boss_id
          ? {
              ...state.boss,
              current_hp: result.boss_hp ?? state.boss.current_hp,
              status: result.boss_defeated ? 'defeated' : state.boss.status,
            }
          : state.boss,
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
      boss: null,
      isLoading: false,
    }),
}));
