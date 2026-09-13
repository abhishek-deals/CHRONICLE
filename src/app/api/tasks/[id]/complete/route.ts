import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/tasks/[id]/complete
 *
 * THE MOST CRITICAL ENDPOINT.
 * Delegates ALL state computation to the `complete_quest` PostgreSQL function
 * which runs as a single atomic transaction. The client NEVER sends reward values.
 *
 * Returns the full authoritative game state.
 */
export async function PATCH(
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

    const body = await request.json().catch(() => ({}));
    const { active_buff } = body;

    // Call the atomic SQL function — all business logic is in Postgres
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('complete_quest', {
      p_task_id: id,
      p_user_id: user.id,
    });

    if (error) {
      // Map DB error messages to user-friendly responses
      if (error.message.includes('Task already completed')) {
        return NextResponse.json(
          { error: 'Quest is already completed' },
          { status: 409 }
        );
      }
      if (error.message.includes('Task not found or unauthorized')) {
        return NextResponse.json(
          { error: 'Quest not found' },
          { status: 404 }
        );
      }
      console.error('complete_quest RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // --- ORACLE BUFF LOGIC ---
    let buffXpBonus = 0;
    let buffGoldBonus = 0;
    
    if (active_buff) {
      if (active_buff === 'the_chariot') {
        buffXpBonus = Math.floor(data.xp_gained * 0.5); // +50% XP
      } else if (active_buff === 'the_merchant') {
        buffGoldBonus = Math.floor(data.gold_gained * 0.5); // +50% Gold
      } else if (active_buff === 'the_emperor') {
        buffXpBonus = Math.floor(data.xp_gained * 0.25);
        buffGoldBonus = Math.floor(data.gold_gained * 0.25);
      }

      if (buffXpBonus > 0 || buffGoldBonus > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('total_xp, gold')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('profiles')
            .update({ 
              total_xp: profile.total_xp + buffXpBonus,
              gold: profile.gold + buffGoldBonus
            })
            .eq('id', user.id);
            
          data.xp_gained += buffXpBonus;
          data.gold_gained += buffGoldBonus;
          data.total_xp = profile.total_xp + buffXpBonus;
          data.gold = profile.gold + buffGoldBonus;
        }
      }
    }

    // Attach boss info to the result for the frontend (now fully from RPC)
    const finalResult = {
      ...data,
      boss_defeated: data.level_up ? true : (data.current_hp === 0 && data.boss_damage > 0), // Simple heuristic for defeated
    };

    // --- OPTION C: HEAL LOGIC ---
    // Instead of taking counter-damage, completing a quest heals the user!
    // The RPC already deducted counter_damage. We reverse it and add 20 HP heal.
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: currentProfile, error: profileErr } = await (supabase as any)
        .from('profiles')
        .select('current_hp, max_hp')
        .eq('id', user.id)
        .single();

      if (!profileErr && currentProfile && currentProfile.current_hp !== undefined) {
        // Reverse counter damage and add 20 heal
        const healAmount = 20;
        const newHp = Math.min(currentProfile.max_hp || 100, (currentProfile.current_hp || 0) + (data.counter_damage || 0) + healAmount);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('profiles')
          .update({ 
            current_hp: newHp,
            knockout_until: null // Revive if they were knocked out by the RPC
          })
          .eq('id', user.id);
          
        finalResult.current_hp = newHp;
        finalResult.counter_damage = -healAmount; // Negative counter damage = heal
      }
    } catch (e) {
      console.warn('Could not apply heal logic, skipping:', e);
    }

    return NextResponse.json({ result: finalResult });
  } catch (err) {
    console.error('PATCH /api/tasks/[id]/complete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
