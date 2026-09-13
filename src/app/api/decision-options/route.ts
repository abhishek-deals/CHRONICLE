import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already made a decision today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: existingDecision } = await supabase
      .from('chronicle_events')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'decision')
      .gte('date', startOfDay.toISOString())
      .limit(1);

    if (existingDecision && existingDecision.length > 0) {
      return NextResponse.json({ alreadyDecided: true });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return NextResponse.json({ error: 'AI API Key is missing.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const systemPrompt = `You are the Oracle of Chronicle, an RPG Life Game.
Your task is to present the player with a daily "Crossroads" decision.
You must provide exactly two paths:
- Path A (The Hard Path): A productive, difficult, or positive real-world habit. (e.g., Deep focus work, tough workout).
- Path B (The Easy Path): An indulgent, lazy, or restful real-world habit. (e.g., Doomscrolling, skipping a workout).

Make the scenario sound epic and atmospheric.
Respond ONLY with a valid JSON object. Do not include markdown formatting or extra text.
Format:
{
  "scenario": "A highly atmospheric, dark fantasy description of the current situation...",
  "pathA": {
    "title": "Short title",
    "description": "What they must do.",
    "projected_xp": 100,
    "projected_hp_change": -10,
    "difficulty": "Hard"
  },
  "pathB": {
    "title": "Short title",
    "description": "What they must do.",
    "projected_xp": 10,
    "projected_hp_change": 30,
    "difficulty": "Easy"
  }
}
`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent("Generate today's life decision crossroads.");
    const content = result.response.text();
    let decision = null;

    try {
      decision = JSON.parse(content.replace(/```json/gi, '').replace(/```/g, '').trim());
      
      // Validate structure to prevent frontend crashes
      if (!decision || !decision.pathA || !decision.pathB || !decision.scenario) {
        throw new Error("Invalid AI schema returned");
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON:', content);
      return NextResponse.json({ error: 'Failed to parse AI response.' }, { status: 500 });
    }

    return NextResponse.json({ decision, alreadyDecided: false });
  } catch (err) {
    console.error('GET /api/decision-options error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
