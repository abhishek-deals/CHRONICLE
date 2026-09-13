import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';



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
      return NextResponse.json({ error: 'Failed to fetch user attributes.' }, { status: 500 });
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return NextResponse.json({ error: 'AI API Key is missing or invalid. Please configure your GEMINI_API_KEY.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

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

    const history = userMessages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt
      });

      const chat = model.startChat({
        history: history.length > 1 ? history.slice(0, -1) : []
      });
      
      const lastMessage = history.length > 0 ? history[history.length - 1].parts[0].text : 'Suggest 3 quests for me.';

      const result = await chat.sendMessageStream(lastMessage);

      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      
      // Process stream asynchronously without blocking
      (async () => {
        try {
          for await (const chunk of result.stream) {
            writer.write(new TextEncoder().encode(chunk.text()));
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

    } catch (aiErr) {
      console.error('Gemini API error:', aiErr);
      return NextResponse.json({ error: 'Failed to generate quests' }, { status: 500 });
    }
  } catch (err) {
    console.error('POST /api/ai/suggest-quests error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
