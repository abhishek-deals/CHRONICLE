import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json();

    // Server-side validation
    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Email, password, and username are required' }, { status: 400 });
    }
    if (username.trim().length < 2) {
      return NextResponse.json({ error: 'Username must be at least 2 characters' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    // We use the admin client to create the user instantly, bypassing email verification completely!
    const adminAuth = await createAdminClient();
    
    // Check if the user already exists
    const { data: { users }, error: checkError } = await adminAuth.auth.admin.listUsers();
    if (checkError) {
      console.error('Check user error:', checkError);
    } else {
      const existingUser = users.find(u => u.email === normalizedEmail);
      if (existingUser) {
        return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 400 });
      }
    }

    // ── MAGICAL INSTANT CREATION ──
    // Create the user and explicitly auto-confirm their email so they don't need a magic link or OTP!
    const { data: newUser, error: createError } = await adminAuth.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true, // This skips the email verification completely!
      user_metadata: { username: username.trim() }
    });

    if (createError || !newUser?.user) {
      console.error('Failed to create user:', createError);
      return NextResponse.json({ error: 'Failed to create user: ' + (createError?.message || '') }, { status: 500 });
    }

    // Upsert profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminAuth as any).from('profiles').upsert({
      id: newUser.user.id,
      username: username.trim(),
      level: 1,
      total_xp: 0,
      gold: 0,
    });

    return NextResponse.json({ success: true, message: 'Character created instantly!' });
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Internal server error: ' + (err.message || String(err)) }, { status: 500 });
  }
}
