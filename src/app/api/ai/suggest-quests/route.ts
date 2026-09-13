import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const HARDCODED_QUESTS = [
  { title: "Read 10 pages of a non-fiction book", category: "Learning", difficulty: "Easy", attribute_tag: "intellect", reason: "Expanding knowledge requires daily discipline." },
  { title: "Complete a 30-minute cardio workout", category: "Fitness", difficulty: "Medium", attribute_tag: "strength", reason: "Endurance is forged in sweat." },
  { title: "Drink 2 liters of water today", category: "Health", difficulty: "Easy", attribute_tag: "discipline", reason: "Hydration is the foundation of energy." },
  { title: "Spend 20 minutes sketching or writing", category: "Art", difficulty: "Medium", attribute_tag: "creativity", reason: "The mind needs a canvas to explore." },
  { title: "Code for 1 hour without distractions", category: "Career", difficulty: "Hard", attribute_tag: "intellect", reason: "Deep focus sharpens your intellect." },
  { title: "Do 50 push-ups total today", category: "Fitness", difficulty: "Medium", attribute_tag: "strength", reason: "Physical strength translates to mental fortitude." },
  { title: "Meditate for 10 minutes", category: "Mindfulness", difficulty: "Easy", attribute_tag: "discipline", reason: "A calm mind is an impenetrable fortress." },
  { title: "Brainstorm 5 new ideas for a project", category: "Planning", difficulty: "Medium", attribute_tag: "creativity", reason: "Innovation requires intentional thought." },
  { title: "Learn a new vocabulary word and use it", category: "Learning", difficulty: "Easy", attribute_tag: "intellect", reason: "Words are the building blocks of understanding." },
  { title: "Stretch or do yoga for 15 minutes", category: "Health", difficulty: "Easy", attribute_tag: "strength", reason: "Flexibility prevents future injuries." },
  { title: "Clean your workspace completely", category: "Habits", difficulty: "Medium", attribute_tag: "discipline", reason: "A clear environment breeds a clear mind." },
  { title: "Cook a new healthy recipe", category: "Life", difficulty: "Hard", attribute_tag: "creativity", reason: "Culinary exploration nourishes the body and soul." },
  { title: "Watch a documentary on a new topic", category: "Learning", difficulty: "Medium", attribute_tag: "intellect", reason: "Curiosity is the engine of intellect." },
  { title: "Go for a brisk 45-minute walk", category: "Fitness", difficulty: "Medium", attribute_tag: "strength", reason: "Movement is the essence of life." },
  { title: "No social media for the first 2 hours awake", category: "Habits", difficulty: "Hard", attribute_tag: "discipline", reason: "Reclaiming your attention is the ultimate power." }
];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    // Fetch user's current attributes from DB
    const { data: attrsRaw } = await supabase
      .from('attributes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const attrs = attrsRaw || { intellect: 0, strength: 0, discipline: 0, creativity: 0 };
    const attrValues = { intellect: attrs.intellect, strength: attrs.strength, discipline: attrs.discipline, creativity: attrs.creativity };
    const weakest = Object.entries(attrValues).sort((a, b) => a[1] - b[1])[0][0];

    // Shuffle and pick 3 quests
    const shuffled = [...HARDCODED_QUESTS].sort(() => 0.5 - Math.random());
    const selectedQuests = shuffled.slice(0, 3);

    // Format the response exactly as the frontend expects
    const responseText = `PROSE:
Greetings, adventurer. I sense your ${weakest} is currently your weakest link. Fear not, for I have peered into the cosmic weave and found three tasks tailored to forge you into a stronger warrior of life. Accept these trials, and grow.

QUESTS:
${JSON.stringify(selectedQuests, null, 2)}`;

    // Fake a readable stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    
    (async () => {
      try {
        // Stream it in small chunks to simulate AI typing
        const chunks = responseText.split(/(?<=\s)/);
        for (const chunk of chunks) {
          writer.write(new TextEncoder().encode(chunk));
          await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay per word
        }
      } catch (err) {
        writer.abort(err);
      } finally {
        writer.close();
      }
    })();

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });

  } catch (err) {
    console.error('POST /api/ai/suggest-quests error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
