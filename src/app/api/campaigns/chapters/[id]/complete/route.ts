import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Mark chapter as completed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: chapter, error: chapterError } = await (supabase as any)
      .from('chapters')
      .update({ completed: true })
      .eq('id', chapterId)
      .select('campaign_id, title')
      .single();

    if (chapterError) {
      return NextResponse.json({ error: chapterError.message }, { status: 500 });
    }

    // 2. Grant rewards (50 XP, 25 Gold per chapter)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('total_xp, gold, level')
      .eq('id', user.id)
      .single();

    if (profile) {
      let newTotalXp = profile.total_xp + 50;
      let newLevel = profile.level;
      let newGold = profile.gold + 25;
      
      const xpForNextLevel = Math.floor(100 * Math.pow(1.5, profile.level - 1));
      let leveledUp = false;

      if (newTotalXp >= xpForNextLevel) {
        newLevel += 1;
        newTotalXp -= xpForNextLevel;
        leveledUp = true;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('profiles')
        .update({
          total_xp: newTotalXp,
          level: newLevel,
          gold: newGold
        })
        .eq('id', user.id);

      // 3. Log to Chronicle
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('chronicle_events').insert({
        user_id: user.id,
        type: 'campaign',
        title: `Chapter Completed: ${chapter.title}`,
        description: `Earned +50 XP and +25 Gold.`
      });

      if (leveledUp) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('chronicle_events').insert({
          user_id: user.id,
          type: 'level_up',
          title: `Level Up! Now Level ${newLevel}`,
          description: `You have reached Level ${newLevel}.`
        });
      }

      // Check if all chapters in campaign are complete
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: allChapters } = await (supabase as any)
        .from('chapters')
        .select('completed')
        .eq('campaign_id', chapter.campaign_id);
      
      const allDone = allChapters.every((c: any) => c.completed);

      if (allDone) {
        // Mark campaign completed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: campaign } = await (supabase as any)
          .from('campaigns')
          .update({ status: 'completed' })
          .eq('id', chapter.campaign_id)
          .select('title')
          .single();
          
        if (campaign) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from('chronicle_events').insert({
            user_id: user.id,
            type: 'campaign',
            title: `Campaign Conquered: ${campaign.title}`,
            description: `You have successfully completed all chapters of this epic campaign!`
          });
        }
      }

      return NextResponse.json({ 
        success: true, 
        xp_gained: 50, 
        gold_gained: 25, 
        level_up: leveledUp,
        level: newLevel,
        total_xp: newTotalXp,
        gold: newGold,
        campaign_completed: allDone
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/campaigns/chapters/[id]/complete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
