import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const HARDCODED_DECISIONS = [
  {
    scenario: "The weight of the day presses down on you. Before you lies the path of fleeting comfort, and the steep climb of lasting strength.",
    pathA: { title: "Deep Work Session", description: "Immerse yourself in 60 minutes of unbroken, focused work.", projected_xp: 150, projected_hp_change: -10, difficulty: "Hard" },
    pathB: { title: "Mindless Scrolling", description: "Lose yourself in the endless feed for an hour.", projected_xp: 10, projected_hp_change: 20, difficulty: "Easy" }
  },
  {
    scenario: "Your body feels sluggish, yearning for rest. The iron calls to you from one side, while the soft embrace of the couch beckons from the other.",
    pathA: { title: "The Iron Trial", description: "Complete a gruelling 45-minute workout.", projected_xp: 200, projected_hp_change: -20, difficulty: "Hard" },
    pathB: { title: "The Couch's Embrace", description: "Skip the workout and watch a show instead.", projected_xp: 15, projected_hp_change: 30, difficulty: "Easy" }
  },
  {
    scenario: "The kitchen is quiet. You can forge a meal of vitality, or summon a feast of convenient lethargy.",
    pathA: { title: "Forge a Healthy Meal", description: "Cook a nutritious meal from scratch.", projected_xp: 100, projected_hp_change: 15, difficulty: "Medium" },
    pathB: { title: "Order Fast Food", description: "Order takeout and avoid cooking.", projected_xp: 5, projected_hp_change: -5, difficulty: "Easy" }
  },
  {
    scenario: "The morning sun has not yet risen. The warmth of the blankets is a powerful spell, but the silence of the early hours offers immense power.",
    pathA: { title: "Seize the Dawn", description: "Wake up early and tackle your hardest task first.", projected_xp: 180, projected_hp_change: -15, difficulty: "Hard" },
    pathB: { title: "Hit Snooze", description: "Sleep in for an extra hour.", projected_xp: 10, projected_hp_change: 25, difficulty: "Easy" }
  },
  {
    scenario: "A chaotic space reflects a chaotic mind. The mess around you is a monster waiting to be slain.",
    pathA: { title: "Purge the Chaos", description: "Spend 30 minutes deep cleaning your environment.", projected_xp: 120, projected_hp_change: -5, difficulty: "Medium" },
    pathB: { title: "Ignore the Mess", description: "Leave it for tomorrow... again.", projected_xp: 5, projected_hp_change: 10, difficulty: "Easy" }
  }
];

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

    // Randomly select a hardcoded decision
    const randomDecision = HARDCODED_DECISIONS[Math.floor(Math.random() * HARDCODED_DECISIONS.length)];

    return NextResponse.json({ decision: randomDecision, alreadyDecided: false });
  } catch (err) {
    console.error('GET /api/decision-options error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
