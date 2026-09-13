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
    const { data: skills, error } = await (supabase as any)
      .from('unlocked_skills')
      .select('skill_id')
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const unlockedSkillIds = skills.map((s: any) => s.skill_id);
    return NextResponse.json({ unlocked_skills: unlockedSkillIds });
  } catch (err) {
    console.error('GET /api/skills error:', err);
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
    const { skill_id } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: skill, error } = await (supabase as any)
      .from('unlocked_skills')
      .insert({
        user_id: user.id,
        skill_id
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ skill }, { status: 201 });
  } catch (err) {
    console.error('POST /api/skills error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
