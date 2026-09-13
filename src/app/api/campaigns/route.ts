import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campaigns, error } = await (supabase as any)
      .from('campaigns')
      .select('*, chapters(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sort chapters by order_index
    const formattedCampaigns = campaigns.map((c: any) => ({
      ...c,
      chapters: c.chapters.sort((a: any, b: any) => a.order_index - b.order_index)
    }));

    return NextResponse.json({ campaigns: formattedCampaigns });
  } catch (err) {
    console.error('GET /api/campaigns error:', err);
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
    const { title, description, category, difficulty, duration_days, chapters } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campaign, error: campaignError } = await (supabase as any)
      .from('campaigns')
      .insert({
        user_id: user.id,
        title,
        description,
        category,
        difficulty,
        duration_days
      })
      .select()
      .single();

    if (campaignError) {
      return NextResponse.json({ error: campaignError.message }, { status: 500 });
    }

    // Insert Chapters
    if (chapters && chapters.length > 0) {
      const chaptersToInsert = chapters.map((ch: any, idx: number) => ({
        campaign_id: campaign.id,
        title: ch.title,
        description: ch.description,
        completed: false,
        order_index: idx
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: chaptersError } = await (supabase as any)
        .from('chapters')
        .insert(chaptersToInsert);

      if (chaptersError) {
        return NextResponse.json({ error: chaptersError.message }, { status: 500 });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: fullCampaign, error: fetchError } = await (supabase as any)
      .from('campaigns')
      .select('*, chapters(*)')
      .eq('id', campaign.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    fullCampaign.chapters.sort((a: any, b: any) => a.order_index - b.order_index);

    return NextResponse.json({ campaign: fullCampaign }, { status: 201 });
  } catch (err) {
    console.error('POST /api/campaigns error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
