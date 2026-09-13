import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user attributes
    const { data: attributes } = await supabase
      .from('attributes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!attributes) {
      return NextResponse.json({ error: 'Attributes not found' }, { status: 404 });
    }

    // Define regions and calculate their status
    const regions = [
      {
        id: 'intellect',
        name: 'The Crystal Spire of Knowledge',
        description: 'A towering spire holding the secrets of the universe. Unlock by increasing Intellect.',
        attribute: 'intellect',
        level: attributes.intellect || 0,
        unlocked: true,
        required_level: 0,
        color: 'text-blue-400',
        bgGlow: 'rgba(59, 130, 246, 0.5)',
      },
      {
        id: 'strength',
        name: 'The Volcanic Forge of Power',
        description: 'A brutal domain of fire and iron. Unlock by increasing Strength.',
        attribute: 'strength',
        level: attributes.strength || 0,
        unlocked: (attributes.strength || 0) >= 10,
        required_level: 10,
        color: 'text-red-500',
        bgGlow: 'rgba(239, 68, 68, 0.5)',
      },
      {
        id: 'discipline',
        name: 'The Iron Fortress of Resolve',
        description: 'An impenetrable bastion of sheer will. Unlock by increasing Discipline.',
        attribute: 'discipline',
        level: attributes.discipline || 0,
        unlocked: (attributes.discipline || 0) >= 10,
        required_level: 10,
        color: 'text-yellow-500',
        bgGlow: 'rgba(234, 179, 8, 0.5)',
      },
      {
        id: 'creativity',
        name: 'The Enchanted Grove of Dreams',
        description: 'A wild, shifting forest of boundless imagination. Unlock by increasing Creativity.',
        attribute: 'creativity',
        level: attributes.creativity || 0,
        unlocked: (attributes.creativity || 0) >= 10,
        required_level: 10,
        color: 'text-emerald-400',
        bgGlow: 'rgba(16, 185, 129, 0.5)',
      }
    ];

    return NextResponse.json({ regions });
  } catch (err) {
    console.error('GET /api/world-map error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
