import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const FALLBACK_CHAPTERS = [
  { title: 'The Awakening', description: 'Laying the foundations of your journey.' },
  { title: 'The First Trial', description: 'Testing your resolve and commitment.' },
  { title: 'Mastery', description: 'Achieving true greatness and completing your goal.' },
];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goal, category, difficulty } = await request.json().catch(() => ({}));

    if (!goal) {
      return NextResponse.json({ chapters: FALLBACK_CHAPTERS });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'YOUR_ANTHROPIC_API_KEY_HERE') {
      return NextResponse.json({ chapters: FALLBACK_CHAPTERS, fallback: true });
    }

    const client = new Anthropic({ apiKey });

    const systemPrompt = `You are a master storyteller in a fantasy Life RPG called Chronicle.
The player has created a new Campaign (goal): "${goal}"
Category: ${category}
Difficulty: ${difficulty}

Your task is to break this real-life goal down into exactly 3 epic RPG chapters (stages). 
- Chapter 1 should be about beginning the journey/preparation.
- Chapter 2 should be about facing challenges/consistency.
- Chapter 3 should be about mastering the goal and final triumph.

Make the titles sound epic and fantasy-themed, but the descriptions should clearly relate to the real-life goal.

Respond ONLY with a valid JSON array of exactly 3 objects. Do not include any markdown formatting, backticks, or prose outside the JSON.
Format:
[
  {
    "title": "Epic Title",
    "description": "Short description of what the player must do."
  }
]
`;

    try {
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Generate the 3 chapters for my campaign: ${goal}` }],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      let chapters = FALLBACK_CHAPTERS;

      try {
        const cleanedContent = content.replace(/```json/gi, '').replace(/```/g, '').trim();
        chapters = JSON.parse(cleanedContent);
        
        if (!Array.isArray(chapters) || chapters.length !== 3) {
           chapters = FALLBACK_CHAPTERS;
        }
      } catch (parseError) {
        console.error('Failed to parse Claude JSON:', content);
      }

      return NextResponse.json({ chapters });
    } catch (aiErr) {
      console.error('Claude API error:', aiErr);
      return NextResponse.json({ chapters: FALLBACK_CHAPTERS, fallback: true });
    }
  } catch (err) {
    console.error('POST /api/ai/generate-campaign error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
