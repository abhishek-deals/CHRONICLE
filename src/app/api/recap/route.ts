import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString();

    // 1. Fetch Profile and Attributes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any).from('profiles').select('*').eq('id', user.id).single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: attributes } = await (supabase as any).from('attributes').select('*').eq('id', user.id).single();

    // 2. Fetch Transactions from last 7 days
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: txs } = await (supabase as any)
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', oneWeekAgoStr);

    let questsCompleted = 0;
    let xpGained = 0;
    let goldGained = 0;

    if (txs) {
      for (const tx of txs) {
        if (tx.type === 'quest_complete') {
          questsCompleted++;
        }
        xpGained += (tx.xp_gained || 0);
        goldGained += (tx.gold_gained || 0);
      }
    }

    // 3. Fetch Bosses defeated this week
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: defeatedBosses } = await (supabase as any)
      .from('bosses')
      .select('name')
      .eq('user_id', user.id)
      .eq('status', 'defeated')
      .gte('updated_at', oneWeekAgoStr);

    return NextResponse.json({
      profile,
      attributes,
      weeklyStats: {
        questsCompleted,
        xpGained,
        goldGained,
        bossesDefeated: defeatedBosses ? defeatedBosses.length : 0,
        bossesNames: defeatedBosses ? defeatedBosses.map((b: any) => b.name) : []
      }
    });
  } catch (err) {
    console.error('GET /api/recap error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
