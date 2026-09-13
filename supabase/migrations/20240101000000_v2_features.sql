-- V2 Features Migration

-- 1. Profiles Table Updates (Player Combat Stats)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS max_hp integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS current_hp integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS knockout_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS defense integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS crit_chance integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS combo_multiplier numeric(3,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS last_combo_time timestamp with time zone;

-- 2. Bosses Table Updates
ALTER TABLE bosses
ADD COLUMN IF NOT EXISTS tier integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS atk integer DEFAULT 15,
ADD COLUMN IF NOT EXISTS def integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS signature_move text,
ADD COLUMN IF NOT EXISTS sprite text;

-- 3. Transactions Table (For Idempotency and Audit)
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE,
ADD COLUMN IF NOT EXISTS xp_gained integer,
ADD COLUMN IF NOT EXISTS gold_gained integer,
ADD COLUMN IF NOT EXISTS boss_damage integer,
ADD COLUMN IF NOT EXISTS is_crit boolean,
ADD COLUMN IF NOT EXISTS combo_multiplier numeric(3,2);

-- 4. Rewrite complete_quest RPC (Atomic Server-Authoritative Engine)
CREATE OR REPLACE FUNCTION complete_quest(p_task_id uuid, p_user_id uuid, p_idempotency_key text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task record;
  v_profile record;
  v_boss record;
  v_streak record;
  v_base_xp integer;
  v_base_gold integer;
  v_final_xp integer;
  v_final_gold integer;
  v_is_crit boolean := false;
  v_combo numeric(3,2);
  v_boss_damage integer := 0;
  v_boss_atk integer;
  v_counter_damage integer := 0;
  v_knocked_out boolean := false;
  v_time_now timestamp with time zone := now();
  v_level_up boolean := false;
  v_new_level integer;
  v_required_xp integer;
BEGIN
  -- 1. Idempotency Check
  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM transactions WHERE idempotency_key = p_idempotency_key AND user_id = p_user_id) THEN
      RAISE EXCEPTION 'Idempotent request already processed';
    END IF;
  END IF;

  -- 2. Fetch and Lock Task
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found or unauthorized';
  END IF;
  IF v_task.status = 'completed' THEN
    RAISE EXCEPTION 'Task already completed';
  END IF;

  -- 3. Fetch Profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF v_profile.current_hp <= 0 AND v_profile.knockout_until > v_time_now THEN
    RAISE EXCEPTION 'You are knocked out and must rest.';
  END IF;

  -- 4. Calculate Base Rewards based on difficulty
  IF v_task.difficulty = 'Easy' THEN
    v_base_xp := 10; v_base_gold := 5;
  ELSIF v_task.difficulty = 'Medium' THEN
    v_base_xp := 25; v_base_gold := 15;
  ELSIF v_task.difficulty = 'Hard' THEN
    v_base_xp := 50; v_base_gold := 35;
  ELSIF v_task.difficulty = 'Epic' THEN
    v_base_xp := 100; v_base_gold := 80;
  ELSE
    v_base_xp := 10; v_base_gold := 5;
  END IF;

  -- 5. Combo System
  v_combo := 1.0;
  IF v_profile.last_combo_time IS NOT NULL AND (v_time_now - v_profile.last_combo_time) < interval '30 minutes' THEN
    v_combo := LEAST(2.5, v_profile.combo_multiplier + 0.1);
  END IF;

  -- 6. Crit System
  IF (random() * 100) < v_profile.crit_chance THEN
    v_is_crit := true;
  END IF;

  -- Apply multipliers
  v_final_xp := FLOOR(v_base_xp * v_combo);
  v_final_gold := FLOOR(v_base_gold * v_combo);
  IF v_is_crit THEN
    v_final_xp := v_final_xp * 2;
    v_final_gold := v_final_gold * 2;
  END IF;

  -- 7. Update Task
  UPDATE tasks SET status = 'completed', completed_at = v_time_now WHERE id = p_task_id;

  -- 8. Update Streak
  SELECT * INTO v_streak FROM streaks WHERE user_id = p_user_id FOR UPDATE;
  IF v_streak IS NOT NULL THEN
    IF v_streak.last_activity_date IS NULL OR v_streak.last_activity_date < CURRENT_DATE THEN
      IF v_streak.last_activity_date = CURRENT_DATE - interval '1 day' THEN
        UPDATE streaks SET current_streak = current_streak + 1, last_activity_date = CURRENT_DATE,
               longest_streak = GREATEST(longest_streak, current_streak + 1)
        WHERE user_id = p_user_id;
      ELSE
        UPDATE streaks SET current_streak = 1, last_activity_date = CURRENT_DATE WHERE user_id = p_user_id;
      END IF;
    END IF;
  ELSE
    INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (p_user_id, 1, 1, CURRENT_DATE);
  END IF;

  -- 9. Update Attributes
  UPDATE attributes SET 
    intellect = intellect + CASE WHEN v_task.attribute_tag = 'intellect' THEN v_final_xp ELSE 0 END,
    strength = strength + CASE WHEN v_task.attribute_tag = 'strength' THEN v_final_xp ELSE 0 END,
    discipline = discipline + CASE WHEN v_task.attribute_tag = 'discipline' THEN v_final_xp ELSE 0 END,
    creativity = creativity + CASE WHEN v_task.attribute_tag = 'creativity' THEN v_final_xp ELSE 0 END
  WHERE user_id = p_user_id;

  -- 10. Boss Battle Damage & Counter-Attack
  SELECT * INTO v_boss FROM bosses WHERE user_id = p_user_id AND status = 'active' ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF FOUND THEN
    -- Damage is based on final XP (so it includes crits and combos)
    v_boss_damage := GREATEST(1, v_final_xp - v_boss.def);
    v_boss_atk := v_boss.atk;

    UPDATE bosses SET current_hp = GREATEST(0, current_hp - v_boss_damage) WHERE id = v_boss.id;

    -- Counter Attack
    IF (v_boss.current_hp - v_boss_damage) > 0 THEN
      v_counter_damage := GREATEST(1, v_boss_atk - v_profile.defense);
    END IF;
  END IF;

  -- 11. Profile Update (XP, Leveling, HP)
  v_new_level := v_profile.level;
  v_required_xp := (POWER(v_new_level, 2) * 50) + (v_new_level * 50);
  
  IF (v_profile.total_xp + v_final_xp) >= v_required_xp THEN
    v_level_up := true;
    v_new_level := v_new_level + 1;
    -- Heal on level up
    v_counter_damage := 0; 
  END IF;

  UPDATE profiles SET 
    total_xp = total_xp + v_final_xp,
    gold = gold + v_final_gold,
    level = v_new_level,
    combo_multiplier = v_combo,
    last_combo_time = v_time_now,
    current_hp = CASE 
      WHEN v_level_up THEN max_hp 
      ELSE GREATEST(0, current_hp - v_counter_damage) 
    END,
    knockout_until = CASE 
      WHEN (current_hp - v_counter_damage) <= 0 AND NOT v_level_up THEN v_time_now + interval '12 hours' 
      ELSE knockout_until 
    END
  WHERE id = p_user_id;

  -- 12. Log Transaction
  INSERT INTO transactions (id, user_id, type, source, amount, xp_gained, gold_gained, boss_damage, is_crit, combo_multiplier, idempotency_key, created_at)
  VALUES (gen_random_uuid(), p_user_id, 'quest_complete', v_task.id::text, v_final_gold, v_final_xp, v_final_gold, v_boss_damage, v_is_crit, v_combo, p_idempotency_key, v_time_now);

  RETURN json_build_object(
    'xp_gained', v_final_xp,
    'gold_gained', v_final_gold,
    'level_up', v_level_up,
    'boss_damage', v_boss_damage,
    'counter_damage', v_counter_damage,
    'is_crit', v_is_crit,
    'combo_multiplier', v_combo,
    'current_hp', CASE WHEN v_level_up THEN v_profile.max_hp ELSE GREATEST(0, v_profile.current_hp - v_counter_damage) END,
    'max_hp', v_profile.max_hp,
    'level', v_new_level,
    'total_xp', v_profile.total_xp + v_final_xp,
    'gold', v_profile.gold + v_final_gold,
    'current_streak', CASE WHEN v_streak IS NOT NULL THEN (CASE WHEN v_streak.last_activity_date = CURRENT_DATE - interval '1 day' THEN v_streak.current_streak + 1 ELSE 1 END) ELSE 1 END,
    'longest_streak', CASE WHEN v_streak IS NOT NULL THEN GREATEST(v_streak.longest_streak, CASE WHEN v_streak.last_activity_date = CURRENT_DATE - interval '1 day' THEN v_streak.current_streak + 1 ELSE 1 END) ELSE 1 END,
    'attributes', (SELECT json_build_object('intellect', intellect, 'strength', strength, 'discipline', discipline, 'creativity', creativity) FROM attributes WHERE user_id = p_user_id)
  );
END;
$$;
