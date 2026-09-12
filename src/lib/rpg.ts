// Server-controlled reward table — client input is NEVER trusted
export const QUEST_REWARDS = {
  Easy:   { xp: 10,  gold: 5  },
  Medium: { xp: 25,  gold: 10 },
  Hard:   { xp: 50,  gold: 25 },
  Epic:   { xp: 100, gold: 50 },
} as const;

export type Difficulty = keyof typeof QUEST_REWARDS;

/**
 * XP needed to complete a given level.
 * Level 1→2: 100 XP, Level 2→3: 400 XP, Level 3→4: 900 XP, etc.
 */
export function xpForLevel(level: number): number {
  return level * level * 100;
}

/**
 * Calculate the current level from total accumulated XP.
 * Levels are non-cumulative — each level resets the XP pool.
 */
export function calculateLevel(totalXp: number): number {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return level;
}

/**
 * XP needed to reach the NEXT level, and current XP within this level.
 */
export function xpProgress(totalXp: number): { current: number; needed: number; level: number } {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return { current: remaining, needed: xpForLevel(level), level };
}

export const BOSS_NAMES = [
  'Shadow Sloth',
  'Procrastinax the Terrible',
  'Lord Laziness',
  'The Distraction Drake',
  'Megaslack the Unmotivated',
  'Baron Von Burnout',
  'The Apathy Ogre',
  'Chaos Goblin',
];

export const ATTRIBUTE_TAGS = ['intellect', 'strength', 'discipline', 'creativity'] as const;
export type AttributeTag = typeof ATTRIBUTE_TAGS[number];

export const CATEGORIES = ['General', 'Learning', 'Fitness', 'Creative', 'Career', 'Health', 'Social'] as const;
