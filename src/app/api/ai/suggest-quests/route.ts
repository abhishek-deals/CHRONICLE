import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

// Hardcoded fallback — ensures this NEVER blocks the demo
const FALLBACK_QUESTS = [
  {
    title: 'Read for 30 minutes',
    category: 'Learning',
    difficulty: 'Easy' as const,
    attribute_tag: 'intellect',
    reason: 'Reading sharpens your mind and builds your Intellect attribute.',
  },
  {
    title: 'Do 20 push-ups',
    category: 'Fitness',
    difficulty: 'Easy' as const,
    attribute_tag: 'strength',
    reason: 'Physical training is the foundation of a legendary adventurer.',
  },
  {
    title: 'Work on a creative project for 1 hour',
    category: 'Creative',
    difficulty: 'Medium' as const,
    attribute_tag: 'creativity',
    reason: 'Creative work is what separates heroes from mere mortals.',
  },
];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const userMessages = body.messages || [];

    // Fetch user's current attributes from DB — NEVER trust client-sent values
    const { data: attrsRaw, error: attrError } = await supabase
      .from('attributes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (attrError || !attrsRaw) {
      return NextResponse.json({ quests: FALLBACK_QUESTS, fallback: true });
    }

    const attrs = attrsRaw as { intellect: number; strength: number; discipline: number; creativity: number };

    // Find weakest attribute
    const attrValues = {
      intellect: attrs.intellect,
      strength: attrs.strength,
      discipline: attrs.discipline,
      creativity: attrs.creativity,
    };
    const weakest = Object.entries(attrValues).sort((a, b) => a[1] - b[1])[0][0];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ quests: FALLBACK_QUESTS, fallback: true });
    }

    const client = new Anthropic({ apiKey });

    const systemPrompt = `You are the Sage, an ancient AI mentor in a life RPG called Chronicle.
A player's attributes are:
- Intellect: ${attrs.intellect as number} XP
- Strength: ${attrs.strength as number} XP  
- Discipline: ${attrs.discipline as number} XP
- Creativity: ${attrs.creativity as number} XP

Their weakest attribute is: ${weakest}

Speak in a warm, slightly archaic fantasy tone. Answer the user's query or provide a short 2-3 sentence introductory message (prose) addressing the adventurer and encouraging them.
Then, if the user is asking for quests or if it's the start of the conversation, suggest exactly 3 real-life quests (tasks) that would help them improve, especially the ${weakest} attribute.

Respond EXACTLY in this format with the exact delimiters:

PROSE:
[Your intro message or answer here]

QUESTS:
[
  {
    "title": "Quest title (max 60 chars)",
    "category": "Learning",
    "difficulty": "Easy",
    "attribute_tag": "intellect",
    "reason": "One sentence reason"
  }
]
If you have no quests to suggest, return an empty array [] for QUESTS.`;

    const apiMessages = [
      ...userMessages.map((m: any) => ({ role: m.role, content: m.content })),
    ];
    // We add the system context to the final user message to enforce the format, or as the first message.
    // Anthropic API supports system prompts at the top level. Let's use `system`.

    try {
      const stream = client.messages.stream({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        system: systemPrompt,
        messages: apiMessages.length > 0 ? apiMessages : [{ role: 'user', content: 'Suggest 3 quests for me.' }],
      });

      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      
      stream.on('text', (textDelta) => {
        writer.write(new TextEncoder().encode(textDelta));
      });
      stream.on('end', () => {
        writer.close();
      });
      stream.on('error', (err) => {
        writer.abort(err);
      });

      return new NextResponse(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      });

    } catch (aiErr) {
      console.error('Claude API error:', aiErr);
      return NextResponse.json({ error: 'Failed to generate quests' }, { status: 500 });
    }
  } catch (err) {
    console.error('POST /api/ai/suggest-quests error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
