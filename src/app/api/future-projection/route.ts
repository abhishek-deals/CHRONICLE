import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateLevel, QUEST_REWARDS } from '@/lib/rpg';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { questsPerDay = 3, activeDays = 5, daysToProject = 30 } = body;

    // Fetch actual current data
    const [profileRes, attrsRes, streakRes, tasksRes] = await Promise.all([
      supabase.from('profiles').select('xp, level').eq('id', user.id).single(),
      supabase.from('attributes').select('strength, intellect, discipline, creativity').eq('user_id', user.id).single(),
      supabase.from('streaks').select('current_streak').eq('user_id', user.id).single(),
      supabase.from('tasks').select('difficulty').eq('user_id', user.id).eq('status', 'completed'),
    ]);

    if (profileRes.error) {
      console.error('Profile fetch error:', profileRes.error);
      // Don't fail completely, just use defaults
    }

    const currentXp = Number(profileRes.data?.xp) || 0;
    const currentLevel = Number(profileRes.data?.level) || 1;
    
    const attrs = attrsRes.data || {};
    const baseStrength = Number(attrs.strength) || 1;
    const baseIntellect = Number(attrs.intellect) || 1;
    const baseDiscipline = Number(attrs.discipline) || 1;
    const baseCreativity = Number(attrs.creativity) || 1;
    
    const currentStreak = Number(streakRes.data?.current_streak) || 0;

    // Calculate dynamic average XP based on their actual completed quests history
    let avgXpPerQuest = 15; // fallback
    if (tasksRes.data && tasksRes.data.length > 0) {
      let totalHistoricalXp = 0;
      tasksRes.data.forEach((t: { difficulty: string }) => {
         const reward = QUEST_REWARDS[t.difficulty as keyof typeof QUEST_REWARDS];
         if (reward) totalHistoricalXp += reward.xp;
      });
      avgXpPerQuest = totalHistoricalXp / tasksRes.data.length;
    }

    const weeks = daysToProject / 7;
    const totalQuests = Math.floor(questsPerDay * activeDays * weeks);

    const projectedXp = currentXp + (totalQuests * avgXpPerQuest);
    const projectedLevel = calculateLevel(projectedXp);

    const statGainPerAttr = Math.floor(totalQuests / 4);

    const projectedStats = {
      strength: baseStrength + statGainPerAttr,
      intellect: baseIntellect + statGainPerAttr,
      discipline: baseDiscipline + statGainPerAttr,
      creativity: baseCreativity + statGainPerAttr,
    };

    let projectedStreak = currentStreak;
    if (activeDays >= 6) {
       projectedStreak = currentStreak + daysToProject;
    } else {
       projectedStreak = activeDays; // rough estimation
    }

    return NextResponse.json({
      current: {
        xp: currentXp,
        level: currentLevel,
        attributes: { strength: baseStrength, intellect: baseIntellect, discipline: baseDiscipline, creativity: baseCreativity },
        streak: currentStreak
      },
      projected: {
        xp: projectedXp,
        level: projectedLevel,
        attributes: projectedStats,
        streak: projectedStreak,
        totalQuestsCompleted: totalQuests
      }
    });

  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
