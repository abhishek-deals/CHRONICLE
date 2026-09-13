import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch task
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: task, error: taskErr } = await (supabase as any).from('tasks').select('*').eq('id', id).eq('user_id', user.id).single();
    if (taskErr || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    if (task.status !== 'completed') {
      return NextResponse.json({ error: 'Task is not completed' }, { status: 400 });
    }

    // 2. Fetch the latest transaction for this task
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tx, error: txErr } = await (supabase as any)
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('source', id)
      .eq('type', 'quest_complete')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (txErr || !tx) {
      // No transaction found
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('tasks').update({ status: 'active', completed_at: null }).eq('id', id);
      return NextResponse.json({ message: 'Undo successful (no rewards reverted)' });
    }

    // 3. Rollback Profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any).from('profiles').select('*').eq('id', user.id).single();
    if (profile) {
      let newLevel = profile.level;
      const newTotalXp = Math.max(0, profile.total_xp - (tx.xp_gained || 0));
      
      const prevLevelRequired = (Math.pow(Math.max(1, newLevel - 1), 2) * 50) + (Math.max(1, newLevel - 1) * 50);
      
      if (newTotalXp < prevLevelRequired && newLevel > 1) {
        newLevel = newLevel - 1;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('profiles').update({
        total_xp: newTotalXp,
        gold: Math.max(0, profile.gold - (tx.gold_gained || 0)),
        level: newLevel
      }).eq('id', user.id);
    }

    // 4. Rollback Boss Damage
    if (tx.boss_damage && tx.boss_damage > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: boss } = await (supabase as any).from('bosses').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).single();
      if (boss) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('bosses').update({
          current_hp: Math.min(boss.max_hp, boss.current_hp + tx.boss_damage)
        }).eq('id', boss.id);
      }
    }

    // 5. Delete Transaction and Reset Task
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('transactions').delete().eq('id', tx.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('tasks').update({ status: 'active', completed_at: null }).eq('id', id);

    // Fetch new profile state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newProfile } = await (supabase as any).from('profiles').select('*').eq('id', user.id).single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newAttributes } = await (supabase as any).from('attributes').select('*').eq('user_id', user.id).single();

    return NextResponse.json({ 
      message: 'Undo successful',
      result: {
        profile: newProfile,
        attributes: newAttributes,
      }
    });
  } catch (err) {
    console.error('POST /api/tasks/[id]/undo error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
