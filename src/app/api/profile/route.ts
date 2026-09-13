import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [profileRes, attrsRes, streakRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('attributes').select('*').eq('user_id', user.id).single(),
      supabase.from('streaks').select('*').eq('user_id', user.id).single(),
    ]);

    if (profileRes.error) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: profileRes.data,
      attributes: attrsRes.data,
      streak: streakRes.data,
    });
  } catch (err) {
    console.error('GET /api/profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.username || typeof body.username !== 'string') {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({ username: body.username })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, username: body.username }, { status: 200 });
  } catch (err) {
    console.error('PATCH /api/profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
