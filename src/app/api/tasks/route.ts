import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES, ATTRIBUTE_TAGS, QUEST_REWARDS } from '@/lib/rpg';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Process expired tasks
    if (tasks) {
      const now = new Date();
      const expiredTasks = (tasks as any[]).filter(t => t.status === 'active' && t.deadline && new Date(t.deadline) < now);
      
      if (expiredTasks.length > 0) {
        // Mark as failed
        const expiredIds = expiredTasks.map(t => t.id);
        await (supabase as any).from('tasks').update({ status: 'failed' }).in('id', expiredIds);
        
        // Calculate total penalty (50% of the reward they would have gotten)
        let totalXpPenalty = 0;
        let totalGoldPenalty = 0;
        expiredTasks.forEach(t => {
           const reward = QUEST_REWARDS[t.difficulty as keyof typeof QUEST_REWARDS] || QUEST_REWARDS.Medium;
           totalXpPenalty += Math.floor(reward.xp / 2);
           totalGoldPenalty += Math.floor(reward.gold / 2);
        });

        // Deduct from profile
        const { data: profile } = await supabase.from('profiles').select('xp, gold, level').eq('id', user.id).single();
        if (profile) {
           const profileData = profile as any;
           const newXp = Math.max(0, (profileData.xp || 0) - totalXpPenalty);
           const newGold = Math.max(0, (profileData.gold || 0) - totalGoldPenalty);
           // Re-calculate level just in case they lose a level (though typically games don't derank easily, we will here)
           let newLevel = 1;
           let remaining = newXp;
           while (remaining >= newLevel * newLevel * 100) {
             remaining -= newLevel * newLevel * 100;
             newLevel++;
           }
           await (supabase as any).from('profiles').update({ xp: newXp, gold: newGold, level: newLevel }).eq('id', user.id);
        }

        // Re-fetch tasks after update
        const { data: updatedTasks } = await supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (updatedTasks) tasks = updatedTasks;
      }
    }

    return NextResponse.json({ tasks });
  } catch (err) {
    console.error('GET /api/tasks error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, category, difficulty, attribute_tag, deadline } = body;

    // Server-side validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Quest title cannot be empty' },
        { status: 400 }
      );
    }

    if (!['Easy', 'Medium', 'Hard', 'Epic'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty' },
        { status: 400 }
      );
    }

    const validCategory = CATEGORIES.includes(category as typeof CATEGORIES[number]) ? category : 'General';
    const validAttributeTag = ATTRIBUTE_TAGS.includes(attribute_tag as typeof ATTRIBUTE_TAGS[number]) ? attribute_tag : 'discipline';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: task, error } = await (supabase as any)
      .from('tasks')
      .insert({
        user_id: user.id,
        title: title.trim(),
        category: validCategory,
        difficulty,
        attribute_tag: validAttributeTag,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error('POST /api/tasks error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
