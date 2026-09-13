-- SQL script to execute in Supabase SQL Editor to set up the RPG tables

-- 1. Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own campaigns" ON public.campaigns FOR ALL USING (auth.uid() = user_id);

-- 2. Chapters
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL
);
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage chapters for their campaigns" ON public.chapters FOR ALL USING (
  EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = chapters.campaign_id AND campaigns.user_id = auth.uid())
);

-- 3. User Settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  daily_goal INTEGER DEFAULT 5,
  difficulty_preference TEXT DEFAULT 'Balanced',
  auto_quest_suggestions BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'Midnight',
  color_accent TEXT DEFAULT 'Purple',
  crt_effect BOOLEAN DEFAULT false,
  ui_mode TEXT DEFAULT 'Comfortable',
  animations BOOLEAN DEFAULT true,
  master_volume INTEGER DEFAULT 80,
  music BOOLEAN DEFAULT true,
  sfx BOOLEAN DEFAULT true,
  ui_sounds BOOLEAN DEFAULT true,
  quest_reminders BOOLEAN DEFAULT true,
  achievement_notifications BOOLEAN DEFAULT true,
  level_up_notifications BOOLEAN DEFAULT true,
  campaign_reminders BOOLEAN DEFAULT true,
  reduce_motion BOOLEAN DEFAULT false,
  high_contrast BOOLEAN DEFAULT false,
  font_size TEXT DEFAULT 'Normal'
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- 4. Chronicle Events
CREATE TABLE IF NOT EXISTS public.chronicle_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'level_up', 'quest', 'achievement', 'campaign', 'skill'
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.chronicle_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own events" ON public.chronicle_events FOR ALL USING (auth.uid() = user_id);

-- 5. Unlocked Skills
CREATE TABLE IF NOT EXISTS public.unlocked_skills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);
ALTER TABLE public.unlocked_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own skills" ON public.unlocked_skills FOR ALL USING (auth.uid() = user_id);

-- 6. Unlocked Achievements
CREATE TABLE IF NOT EXISTS public.unlocked_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  UNIQUE(user_id, achievement_id)
);
ALTER TABLE public.unlocked_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own achievements" ON public.unlocked_achievements FOR ALL USING (auth.uid() = user_id);
