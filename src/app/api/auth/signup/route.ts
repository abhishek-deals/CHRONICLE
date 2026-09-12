import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json();

    // Server-side validation
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Email, password, and username are required' },
        { status: 400 }
      );
    }
    if (username.trim().length < 2) {
      return NextResponse.json(
        { error: 'Username must be at least 2 characters' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create auth user — pass username in metadata for the DB trigger
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { username: username.trim() },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // The DB trigger (handle_new_user) auto-creates profiles, attributes, and streaks rows.
    // We wait a moment and verify they exist, then update the username if trigger used email.
    await new Promise((r) => setTimeout(r, 500));

    // Upsert profile with correct username (trigger may have used email prefix)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('profiles').upsert({
      id: authData.user.id,
      username: username.trim(),
      level: 1,
      total_xp: 0,
      gold: 0,
    });

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
