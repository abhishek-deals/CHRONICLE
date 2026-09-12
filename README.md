# ⚔️ Chronicle — Life RPG

> **"Turn Your Life Into a Legend."**

A full-stack gamified life productivity app. Complete real-life tasks as quests, earn XP and Gold, level up your character, defeat weekly boss battles, and get AI-powered quest suggestions from the Sage.

---

## 🚀 Live Demo

> Deploy link will appear here after Vercel deployment.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📜 **Quest System** | Create tasks as quests with difficulty (Easy/Medium/Hard/Epic) |
| ⬆️ **XP & Leveling** | Server-authoritative XP calculation — client never computes rewards |
| 💰 **Gold Economy** | Earn gold on quest completion, bonus gold for boss defeats |
| 📊 **Attributes** | Train Intellect, Strength, Discipline, Creativity through quests |
| 🔥 **Streaks** | Daily activity streak tracking with flame icon |
| 👹 **Boss Battles** | Weekly boss auto-spawns; quests deal HP damage equal to their XP reward |
| 🔮 **AI Mentor** | Claude-powered Sage suggests personalized quests based on your weakest attribute |
| 🎮 **Retro UI** | 16-bit dungeon crawler aesthetic with CRT scanlines (toggleable) |
| 🎵 **Sound** | Quest complete, level-up, boss defeat sounds (off by default) |
| 📱 **Responsive** | Works at 375px and 1440px, no horizontal scroll |
| ♿ **Accessible** | Full keyboard navigation, ARIA labels, visible focus rings |

---

## 🛠 Tech Stack

- **Frontend**: Next.js 14+ (App Router) + TypeScript + Tailwind CSS v4
- **Animations**: Framer Motion
- **State**: Zustand (optimistic UI + server reconciliation)
- **Auth + DB**: Supabase (Postgres + Supabase Auth + Row Level Security)
- **AI**: Anthropic Claude (server-side only, never exposed to browser)
- **Toasts**: Sonner
- **Icons**: Lucide React
- **Deploy**: Vercel

---

## 🏗 Architecture

### Database (6 tables)
```
profiles      — level, XP, gold, username
attributes    — intellect, strength, discipline, creativity
streaks       — current_streak, longest_streak, last_activity_date
tasks         — quests with difficulty, category, status
bosses        — weekly boss with HP tracking
transactions  — XP and gold transaction log
```

### Security
- **RLS on every table** — `user_id = auth.uid()` enforced
- **Server-side reward calculation** — client NEVER sends XP/gold values
- **Atomic SQL function** — `complete_quest()` runs in one DB transaction
- **Service role key never exposed** to browser

---

## 🚀 Setup

### Prerequisites
- Node.js 18+
- npm
- Supabase account
- Anthropic API key (optional — fallback quests work without it)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/chronicle-life-rpg
cd chronicle
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase/schema.sql` in the SQL Editor
3. Copy your project URL and keys

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # Settings > API > service_role
ANTHROPIC_API_KEY=your-anthropic-key              # Optional
```

> ⚠️ **Never commit `.env.local`** — it's gitignored by default.

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🎮 How to Play

1. **Sign Up** → Create your adventurer (username + email + password)
2. **Add Quests** → Go to Quest Board, add tasks with difficulty
3. **Complete Quests** → Click ✓ to earn XP, Gold, and train attributes
4. **Fight Bosses** → Each completed quest damages the weekly boss
5. **Ask the Sage** → Get AI-powered quest suggestions from the AI Mentor

---

## 🏗 Deploy to Vercel

1. Push to GitHub (public repo)
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.local`
4. Deploy!

---

## 📋 Security Checklist

- [x] Supabase RLS enabled on all 6 tables
- [x] XP/Gold calculated server-side only
- [x] Anthropic API key server-side only
- [x] Double-complete protection (PostgreSQL level)
- [x] Service role key never in client bundle
- [x] No `localStorage` as primary storage (Supabase auth cookies)

---

## 🧪 Testing RLS (Two-Account Test)

1. Create Account A, add quests, note task IDs
2. Create Account B, try to fetch Account A's tasks via `/api/tasks`
3. Result: Account B gets **zero results** (RLS blocks cross-user access)
