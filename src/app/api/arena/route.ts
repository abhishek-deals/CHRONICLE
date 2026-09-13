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
    const { data: boss, error } = await (supabase as any).rpc('get_or_create_boss', {
      p_user_id: user.id
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any).from('profiles').select('*').eq('id', user.id).single();

    return NextResponse.json({ boss: boss[0] || boss, profile });
  } catch (err) {
    console.error('GET /api/arena error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
