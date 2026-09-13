import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedQuests() {
  console.log('Fetching user...');
  const { data: profiles, error: profileErr } = await supabase.from('profiles').select('id').limit(1);
  
  if (profileErr || !profiles || profiles.length === 0) {
    console.error('No profiles found or error:', profileErr);
    return;
  }

  const userId = profiles[0].id;
  console.log(`Found user: ${userId}. Seeding 12 epic quests...`);

  const quests = [
    { user_id: userId, title: 'Drink the Elixir of Life', difficulty: 'easy', category: 'health', attribute_tag: 'vitality' },
    { user_id: userId, title: 'Slay the Morning Sloth', difficulty: 'medium', category: 'discipline', attribute_tag: 'endurance' },
    { user_id: userId, title: 'Read the Ancient Tomes', difficulty: 'easy', category: 'intellect', attribute_tag: 'wisdom' },
    { user_id: userId, title: 'Train with the Blademaster', difficulty: 'hard', category: 'strength', attribute_tag: 'power' },
    { user_id: userId, title: 'Meditate at the Peak', difficulty: 'medium', category: 'spirit', attribute_tag: 'focus' },
    { user_id: userId, title: 'Forge the Iron Will', difficulty: 'epic', category: 'discipline', attribute_tag: 'endurance' },
    { user_id: userId, title: 'Hunt for Bounties', difficulty: 'medium', category: 'wealth', attribute_tag: 'luck' },
    { user_id: userId, title: 'Gather Herbs', difficulty: 'easy', category: 'health', attribute_tag: 'vitality' },
    { user_id: userId, title: 'Scribe a Scroll', difficulty: 'easy', category: 'creativity', attribute_tag: 'focus' },
    { user_id: userId, title: 'Walk the Kingdom', difficulty: 'medium', category: 'health', attribute_tag: 'endurance' },
    { user_id: userId, title: 'Learn the Arcane Arts', difficulty: 'hard', category: 'intellect', attribute_tag: 'wisdom' },
    { user_id: userId, title: 'Vanquish the Screen Demon', difficulty: 'medium', category: 'discipline', attribute_tag: 'focus' }
  ];

  const { error } = await supabase.from('tasks').insert(quests);

  if (error) {
    console.error('Failed to seed quests:', error);
  } else {
    console.log('Successfully seeded 12 quests!');
  }
}

seedQuests();
