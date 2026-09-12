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

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const prompt = `You are the Sage, an ancient AI mentor in a life RPG called Chronicle. 
A player's attributes are:
- Intellect: ${attrs.intellect as number} XP
- Strength: ${attrs.strength as number} XP  
- Discipline: ${attrs.discipline as number} XP
- Creativity: ${attrs.creativity as number} XP

Their weakest attribute is: ${weakest}

Suggest exactly 3 real-life quests (tasks) that would help them improve, especially the ${weakest} attribute.

Respond ONLY with valid JSON (no markdown fences, no commentary), in this exact format:
[
  {
    "title": "Quest title (specific and actionable, max 60 chars)",
    "category": "one of: General, Learning, Fitness, Creative, Career, Health, Social",
    "difficulty": "one of: Easy, Medium, Hard, Epic",
    "attribute_tag": "one of: intellect, strength, discipline, creativity",
    "reason": "One sentence explaining how this quest helps the adventurer (max 100 chars)"
  }
]`;

    let questsData = FALLBACK_QUESTS;
    let isFallback = false;

    try {
      const message = await client.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        let raw = content.text.trim();
        // Strip markdown code fences if present
        raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

        const parsed = JSON.parse(raw);

        // Validate shape
        if (
          Array.isArray(parsed) &&
          parsed.length >= 1 &&
          parsed.every(
            (q) =>
              typeof q.title === 'string' &&
              typeof q.category === 'string' &&
              ['Easy', 'Medium', 'Hard', 'Epic'].includes(q.difficulty) &&
              ['intellect', 'strength', 'discipline', 'creativity'].includes(q.attribute_tag)
          )
        ) {
          questsData = parsed.slice(0, 3).map((q) => ({
            title: q.title.slice(0, 60),
            category: q.category,
            difficulty: q.difficulty,
            attribute_tag: q.attribute_tag,
            reason: q.reason?.slice(0, 100) || '',
          }));
        } else {
          isFallback = true;
        }
      }
    } catch (aiErr) {
      console.error('Claude API error (using fallback):', aiErr);
      isFallback = true;
    }

    return NextResponse.json({
      quests: questsData,
      weakest,
      fallback: isFallback,
    });
  } catch (err) {
    console.error('POST /api/ai/suggest-quests error:', err);
    // Never crash — always return fallback
    return NextResponse.json({ quests: FALLBACK_QUESTS, fallback: true });
  }
}
