import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES, ATTRIBUTE_TAGS } from '@/lib/rpg';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tasks });
  } catch (err) {
    console.error('GET /api/tasks error:', err);
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
    const { title, category, difficulty, attribute_tag } = body;

    // Server-side validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Quest title cannot be empty' },
        { status: 400 }
      );
    }

    if (!['Easy', 'Medium', 'Hard', 'Epic'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty' },
        { status: 400 }
      );
    }

    const validCategory = CATEGORIES.includes(category as typeof CATEGORIES[number]) ? category : 'General';
    const validAttributeTag = ATTRIBUTE_TAGS.includes(attribute_tag as typeof ATTRIBUTE_TAGS[number]) ? attribute_tag : 'discipline';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: task, error } = await (supabase as any)
      .from('tasks')
      .insert({
        user_id: user.id,
        title: title.trim(),
        category: validCategory,
        difficulty,
        attribute_tag: validAttributeTag,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error('POST /api/tasks error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
