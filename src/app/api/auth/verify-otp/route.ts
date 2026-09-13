import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Called after OTP verification to ensure the user profile row exists.
 * The DB trigger (handle_new_user) usually creates it, but we upsert
 * to guarantee the username is set correctly.
 */
export async function POST(request: Request) {
  try {
    const { userId, username } = await request.json();

    if (!userId || !username) {
      return NextResponse.json({ error: 'userId and username are required' }, { status: 400 });
    }

    // Use admin client to bypass RLS for profile upsert
    const supabase = await createAdminClient();

    // Give the DB trigger a moment to run first
    await new Promise((r) => setTimeout(r, 500));

    // Use raw .from() with explicit any to avoid SDK generic inference issue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('profiles').upsert(
      {
        id: userId,
        username: username.trim(),
        level: 1,
        total_xp: 0,
        gold: 0,
      },
      { onConflict: 'id', ignoreDuplicates: false }
    );

    if (error) {
      console.error('Profile upsert error:', error);
      // Non-fatal — the trigger may have already created the row
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('verify-otp profile creation error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
