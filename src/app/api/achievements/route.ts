import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ─── Achievement definitions ───────────────────────────────────────────────
// These are the conditions the server checks against real user data
const ACHIEVEMENT_DEFS = [
  // Milestones
  { id: 'first_quest',    title: 'First Steps',        description: 'Complete your very first quest.',      icon: '🌱', category: 'Milestone',    check: (s: Stats) => s.total_completed >= 1 },
  { id: 'quests_10',     title: 'Getting Started',     description: 'Complete 10 quests.',                  icon: '📜', category: 'Milestone',    check: (s: Stats) => s.total_completed >= 10 },
  { id: 'quests_50',     title: 'Seasoned Adventurer', description: 'Complete 50 quests.',                  icon: '⚔️', category: 'Milestone',    check: (s: Stats) => s.total_completed >= 50 },
  { id: 'quests_100',    title: 'Quest Master',        description: 'Complete 100 quests.',                 icon: '👑', category: 'Milestone',    check: (s: Stats) => s.total_completed >= 100 },
  { id: 'level_5',       title: 'Apprentice',          description: 'Reach Level 5.',                      icon: '🛡️', category: 'Milestone',    check: (s: Stats) => s.level >= 5 },
  { id: 'level_10',      title: 'Journeyman',          description: 'Reach Level 10.',                     icon: '⚡', category: 'Milestone',    check: (s: Stats) => s.level >= 10 },
  { id: 'level_25',      title: 'Veteran',             description: 'Reach Level 25.',                     icon: '🔱', category: 'Milestone',    check: (s: Stats) => s.level >= 25 },
  { id: 'gold_1000',     title: 'Coin Collector',      description: 'Accumulate 1,000 Gold.',               icon: '💰', category: 'Milestone',    check: (s: Stats) => s.gold >= 1000 },
  // Consistency
  { id: 'streak_3',      title: 'Streak Initiate',     description: 'Maintain a 3-day streak.',             icon: '🔥', category: 'Consistency', check: (s: Stats) => s.longest_streak >= 3 },
  { id: 'streak_7',      title: 'Week Warrior',        description: 'Maintain a 7-day streak.',             icon: '💎', category: 'Consistency', check: (s: Stats) => s.longest_streak >= 7 },
  { id: 'streak_30',     title: 'Iron Resolve',        description: 'Maintain a 30-day streak.',            icon: '🌟', category: 'Consistency', check: (s: Stats) => s.longest_streak >= 30 },
  // Attributes
  { id: 'intellect_50',  title: 'Scholar',             description: 'Reach 50 Intellect.',                  icon: '🧠', category: 'Attribute',   check: (s: Stats) => s.intellect >= 50 },
  { id: 'strength_50',   title: 'Warrior',             description: 'Reach 50 Strength.',                   icon: '💪', category: 'Attribute',   check: (s: Stats) => s.strength >= 50 },
  { id: 'discipline_50', title: 'Monk',                description: 'Reach 50 Discipline.',                 icon: '🎯', category: 'Attribute',   check: (s: Stats) => s.discipline >= 50 },
  { id: 'creativity_50', title: 'Artisan',             description: 'Reach 50 Creativity.',                 icon: '🎨', category: 'Attribute',   check: (s: Stats) => s.creativity >= 50 },
  { id: 'balanced',      title: 'The Balanced One',    description: 'Have all 4 attributes above 30.',       icon: '⚖️', category: 'Special',    check: (s: Stats) => s.intellect >= 30 && s.strength >= 30 && s.discipline >= 30 && s.creativity >= 30 },
  // Special
  { id: 'epic_quest',    title: 'Epic Achiever',       description: 'Complete an Epic difficulty quest.',    icon: '🐉', category: 'Special',    check: (s: Stats) => s.epic_completed >= 1 },
  { id: 'hard_quest',    title: 'Hard Hitter',         description: 'Complete 10 Hard quests.',              icon: '⚔️', category: 'Special',    check: (s: Stats) => s.hard_completed >= 10 },
];

interface Stats {
  level: number;
  gold: number;
  total_completed: number;
  epic_completed: number;
  hard_completed: number;
  longest_streak: number;
  intellect: number;
  strength: number;
  discipline: number;
  creativity: number;
}

// ─── GET: Return all achievements with real progress ──────────────────────
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user data in parallel
    const [profileRes, attrsRes, streakRes, tasksRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('profiles').select('level, gold').eq('id', user.id).single(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('attributes').select('intellect, strength, discipline, creativity').eq('user_id', user.id).single(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('streaks').select('longest_streak').eq('user_id', user.id).single(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('tasks').select('difficulty').eq('user_id', user.id).eq('status', 'completed'),
    ]);

    const profile = profileRes.data || { level: 1, gold: 0 };
    const attrs = attrsRes.data || { intellect: 0, strength: 0, discipline: 0, creativity: 0 };
    const streak = streakRes.data || { longest_streak: 0 };
    const completedTasks: { difficulty: string }[] = tasksRes.data || [];

    const stats: Stats = {
      level: profile.level,
      gold: profile.gold,
      total_completed: completedTasks.length,
      epic_completed: completedTasks.filter((t) => t.difficulty === 'Epic').length,
      hard_completed: completedTasks.filter((t) => t.difficulty === 'Hard').length,
      longest_streak: streak.longest_streak,
      intellect: attrs.intellect,
      strength: attrs.strength,
      discipline: attrs.discipline,
      creativity: attrs.creativity,
    };

    // Fetch already-unlocked achievements
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: unlocked } = await (supabase as any)
      .from('unlocked_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', user.id);

    const unlockedMap = new Map((unlocked || []).map((u: { achievement_id: string; unlocked_at: string }) => [u.achievement_id, u.unlocked_at]));

    // Compute progress percentage per achievement
    const achievements = ACHIEVEMENT_DEFS.map((def) => {
      const isUnlocked = unlockedMap.has(def.id) || def.check(stats);
      const progress = computeProgress(def.id, stats);
      return {
        ...def,
        unlocked: isUnlocked,
        unlocked_at: unlockedMap.get(def.id) || (isUnlocked ? new Date().toISOString() : null),
        progress,
      };
    });

    // Auto-unlock newly earned achievements in DB
    const newlyUnlocked = achievements.filter(
      (a) => a.unlocked && !unlockedMap.has(a.id)
    );

    if (newlyUnlocked.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('unlocked_achievements').upsert(
        newlyUnlocked.map((a) => ({
          user_id: user.id,
          achievement_id: a.id,
          unlocked_at: new Date().toISOString(),
        })),
        { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
      );
    }

    return NextResponse.json({ achievements, stats });
  } catch (err) {
    console.error('GET /api/achievements error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST: Check achievements after quest complete ────────────────────────
// Called fire-and-forget by QuestCard — unlocks newly earned achievements
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { result, task } = body;

    // Fetch existing unlocked set
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: unlocked } = await (supabase as any)
      .from('unlocked_achievements')
      .select('achievement_id')
      .eq('user_id', user.id);

    const unlockedIds = new Set((unlocked || []).map((u: { achievement_id: string }) => u.achievement_id));

    // Fetch full stats for accurate checking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tasksData } = await (supabase as any)
      .from('tasks')
      .select('difficulty')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const completedTasks: { difficulty: string }[] = tasksData || [];

    const stats: Stats = {
      level: result?.level || 1,
      gold: result?.gold || 0,
      total_completed: completedTasks.length,
      epic_completed: completedTasks.filter((t) => t.difficulty === 'Epic').length,
      hard_completed: completedTasks.filter((t) => t.difficulty === 'Hard').length,
      longest_streak: result?.longest_streak || 0,
      intellect: result?.attributes?.intellect || 0,
      strength: result?.attributes?.strength || 0,
      discipline: result?.attributes?.discipline || 0,
      creativity: result?.attributes?.creativity || 0,
    };

    // Find newly earned achievements
    const newlyEarned = ACHIEVEMENT_DEFS.filter(
      (def) => !unlockedIds.has(def.id) && def.check(stats)
    );

    if (newlyEarned.length > 0) {
      const now = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('unlocked_achievements').upsert(
        newlyEarned.map((a) => ({
          user_id: user.id,
          achievement_id: a.id,
          unlocked_at: now,
        })),
        { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
      );

      // Log each achievement unlock to the Chronicle
      for (const a of newlyEarned) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('chronicle_events').insert({
          user_id: user.id,
          type: 'achievement',
          title: `Achievement Unlocked: ${a.title}`,
          description: a.description,
        }).catch(() => {});
      }
    }

    return NextResponse.json({ newly_unlocked: newlyEarned.map((a) => a.id) });
  } catch (err) {
    console.error('POST /api/achievements error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Helper: compute 0–100 progress per achievement ──────────────────────
function computeProgress(id: string, s: Stats): number {
  switch (id) {
    case 'first_quest':    return Math.min(100, s.total_completed >= 1 ? 100 : 0);
    case 'quests_10':      return Math.min(100, Math.floor((s.total_completed / 10) * 100));
    case 'quests_50':      return Math.min(100, Math.floor((s.total_completed / 50) * 100));
    case 'quests_100':     return Math.min(100, Math.floor((s.total_completed / 100) * 100));
    case 'level_5':        return Math.min(100, Math.floor((s.level / 5) * 100));
    case 'level_10':       return Math.min(100, Math.floor((s.level / 10) * 100));
    case 'level_25':       return Math.min(100, Math.floor((s.level / 25) * 100));
    case 'gold_1000':      return Math.min(100, Math.floor((s.gold / 1000) * 100));
    case 'streak_3':       return Math.min(100, Math.floor((s.longest_streak / 3) * 100));
    case 'streak_7':       return Math.min(100, Math.floor((s.longest_streak / 7) * 100));
    case 'streak_30':      return Math.min(100, Math.floor((s.longest_streak / 30) * 100));
    case 'intellect_50':   return Math.min(100, Math.floor((s.intellect / 50) * 100));
    case 'strength_50':    return Math.min(100, Math.floor((s.strength / 50) * 100));
    case 'discipline_50':  return Math.min(100, Math.floor((s.discipline / 50) * 100));
    case 'creativity_50':  return Math.min(100, Math.floor((s.creativity / 50) * 100));
    case 'balanced':       return Math.min(100, Math.floor((Math.min(s.intellect, s.strength, s.discipline, s.creativity) / 30) * 100));
    case 'epic_quest':     return Math.min(100, s.epic_completed >= 1 ? 100 : 0);
    case 'hard_quest':     return Math.min(100, Math.floor((s.hard_completed / 10) * 100));
    default:               return 0;
  }
}
