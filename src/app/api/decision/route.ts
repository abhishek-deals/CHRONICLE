import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateLevel } from '@/lib/rpg';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, projected_xp, projected_hp_change } = body;

    if (!title) {
      return NextResponse.json({ error: 'Missing choice data.' }, { status: 400 });
    }

    // 1. Fetch current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 2. Calculate new stats
    const newXp = (profile.xp || 0) + (projected_xp || 0);
    const newHp = Math.min(
      profile.max_hp || 100, 
      Math.max(0, (profile.current_hp || 100) + (projected_hp_change || 0))
    );
    const newLevel = calculateLevel(newXp);
    const levelUp = newLevel > (profile.level || 1);

    // 3. Update profile
    await (supabase as any)
      .from('profiles')
      .update({
        xp: newXp,
        current_hp: newHp,
        level: newLevel,
      })
      .eq('id', user.id);

    // 4. Log the decision in chronicle_events to prevent multiple daily decisions
    await (supabase as any)
      .from('chronicle_events')
      .insert({
        user_id: user.id,
        type: 'decision',
        title: `Life Decision: ${title}`,
        description: description,
      });

    if (levelUp) {
      await (supabase as any)
        .from('chronicle_events')
        .insert({
          user_id: user.id,
          type: 'level_up',
          title: `Level Up! Now Level ${newLevel}`,
          description: `The Arena tested you, and you grew stronger.`,
        });
    }

    return NextResponse.json({
      success: true,
      xp_gained: projected_xp,
      hp_change: projected_hp_change,
      level_up: levelUp,
      new_level: newLevel,
      new_hp: newHp,
    });
  } catch (err) {
    console.error('POST /api/decision error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
