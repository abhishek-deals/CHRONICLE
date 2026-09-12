import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the SQL function that gets or creates this week's boss
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_or_create_boss', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('get_or_create_boss error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ boss: data });
  } catch (err) {
    console.error('GET /api/boss error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
