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

    const { goal, category, difficulty } = await request.json().catch(() => ({}));

    if (!goal) {
      return NextResponse.json({ error: 'Missing goal for campaign generation.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return NextResponse.json({ error: 'AI API Key is missing or invalid. Please configure your GEMINI_API_KEY.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const systemPrompt = `You are a master storyteller in a fantasy Life RPG called Chronicle.
The player has created a new Campaign (goal): "${goal}"
Category: ${category}
Difficulty: ${difficulty}

Your task is to break this real-life goal down into exactly 3 epic RPG chapters (stages). 
- Chapter 1 should be about beginning the journey/preparation.
- Chapter 2 should be about facing challenges/consistency.
- Chapter 3 should be about mastering the goal and final triumph.

Make the titles sound epic and fantasy-themed.
CRITICAL: The descriptions MUST be highly detailed and personalized to the specific goal ("${goal}"). Do not use generic text. For each chapter's description, include a 3-step action plan of exactly what the user must do in real life during this stage.

Respond ONLY with a valid JSON array of exactly 3 objects. Do not include any markdown formatting, backticks, or prose outside the JSON.
Format:
[
  {
    "title": "Epic Title",
    "description": "Highly detailed lore description followed by 3 specific actionable tasks: 1. ... 2. ... 3. ..."
  }
]
`;

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const result = await model.generateContent(`Generate the 3 chapters for my campaign: ${goal}`);
      const content = result.response.text();
      let chapters = [];

      try {
        const cleanedContent = content.replace(/```json/gi, '').replace(/```/g, '').trim();
        chapters = JSON.parse(cleanedContent);
        
        if (!Array.isArray(chapters) || chapters.length !== 3) {
           return NextResponse.json({ error: 'AI returned invalid chapter format.' }, { status: 500 });
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini JSON:', content);
        return NextResponse.json({ error: 'Failed to parse AI response.' }, { status: 500 });
      }

      return NextResponse.json({ chapters });
    } catch (aiErr) {
      console.error('Gemini API error:', aiErr);
      return NextResponse.json({ error: 'Failed to generate campaign with AI.' }, { status: 500 });
    }
  } catch (err) {
    console.error('POST /api/ai/generate-campaign error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
