import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: bosses, error } = await supabase
      .from('bosses')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'defeated')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bosses: bosses || [] });
  } catch (err) {
    console.error('GET /api/boss/past error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
