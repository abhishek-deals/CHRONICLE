import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/tasks/[id]/complete
 *
 * THE MOST CRITICAL ENDPOINT.
 * Delegates ALL state computation to the `complete_quest` PostgreSQL function
 * which runs as a single atomic transaction. The client NEVER sends reward values.
 *
 * Returns the full authoritative game state.
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the atomic SQL function — all business logic is in Postgres
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('complete_quest', {
      p_task_id: id,
      p_user_id: user.id,
    });

    if (error) {
      // Map DB error messages to user-friendly responses
      if (error.message.includes('Task already completed')) {
        return NextResponse.json(
          { error: 'Quest is already completed' },
          { status: 409 }
        );
      }
      if (error.message.includes('Task not found or unauthorized')) {
        return NextResponse.json(
          { error: 'Quest not found' },
          { status: 404 }
        );
      }
      console.error('complete_quest RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // `data` is the JSON returned by the Postgres function —
    // full authoritative state. Client just renders it.
    return NextResponse.json({ result: data });
  } catch (err) {
    console.error('PATCH /api/tasks/[id]/complete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
