# 🎮 The Wall - Chaotic Fun for Friend Groups

A feature-rich social platform designed for small friend groups to share notes, chat in real-time, play mini-games, and create shared memories together.

![The Wall](https://lovable.dev/opengraph-image-p98pqg.png)

## ✨ Features

### 🗣️ Real-Time Chat
- Multi-threaded conversations
- Image, GIF, and voice message support
- Message reactions and pinning
- Read receipts and typing indicators
- Reply threading and quote messages

### 📝 Interactive Wall
Post and share various content types:
- 📌 Sticky Notes (7 colors)
- 🖼️ Images with captions
- 🎵 Music drops with metadata
- 🎨 Doodles (canvas drawing)
- 🎙️ Audio clips
- 📊 Polls and challenges
- 📢 Announcements

### 🎮 Mini-Games (11 Games)
**Strategy Games (with AI):**
- ♟️ Chess (multiplayer)
- ⭕ Tic-Tac-Toe (Easy/Medium/Hard AI)
- 🔴 Connect Four (AI opponent)
- 🎯 Checkers (AI opponent)

**Word Games:**
- 🔤 Hangman (AI word selection)
- ❓ 21 Questions

**Social Games:**
- 📊 Polls
- 🤔 Would You Rather
- 💭 Question of the Day
- 📖 Story Chain
- ⭐ Rate This

### 👥 Community Features
- User profiles with avatars and bios
- Circle/group management
- Activity feeds
- Stories
- Presence tracking (online status)
- Public profile pages

## 🚀 Tech Stack

**Frontend:**
- ⚛️ React 18.3.1 with TypeScript
- ⚡ Vite 5.4 (build tool)
- 🎨 Tailwind CSS 3.4
- 🧩 shadcn/ui (Radix UI components)
- 🔄 TanStack Query (React Query)
- 🎯 React Router 6

**Backend:**
- 🗄️ Supabase (PostgreSQL + Auth + Real-time)
- 🦕 Deno Edge Functions
- 🔒 Row-Level Security (RLS)

**Key Libraries:**
- `chess.js` - Chess game logic
- `react-hook-form` + `zod` - Form validation
- `date-fns` - Date utilities
- `recharts` - Data visualization
- `sonner` - Toast notifications
- `lucide-react` - Icon library

## 📋 Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ or **bun** 1+
- **Supabase Account** ([sign up here](https://supabase.com))
- **Git** for version control

## 🛠️ Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd dumbwall
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Setup Supabase

#### Option A: Use Existing Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or use an existing one
3. Go to **Project Settings** → **API**
4. Copy your project credentials

#### Option B: Local Supabase (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Apply migrations
supabase db reset
```

### 4. Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your Supabase credentials
```

Required variables:
```env
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 5. Run Database Migrations

**CRITICAL:** Apply all migrations, especially the game types migration:

```bash
# If using Supabase CLI locally:
supabase db reset

# Or manually in Supabase Dashboard → SQL Editor:
# Run all files in supabase/migrations/ in chronological order
```

**Important:** The migration `20251125120000_add_missing_game_types.sql` is required for games to work properly.

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:8080](http://localhost:8080)

## 📁 Project Structure

```
dumbwall/
├── src/
│   ├── components/       # React components
│   │   ├── chat/        # Chat components
│   │   ├── games/       # Game components
│   │   ├── wall/        # Wall posting components
│   │   ├── people/      # Community features
│   │   ├── profile/     # User profile components
│   │   └── ui/          # Reusable UI components (shadcn)
│   ├── pages/           # Route pages
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities & helpers
│   ├── integrations/    # Supabase integration
│   ├── types/           # TypeScript types
│   └── assets/          # Images and media
├── supabase/
│   ├── functions/       # Edge functions (Deno)
│   └── migrations/      # Database migrations
├── public/              # Static assets
└── Configuration files
```

## 🎮 Games System

### How Games Work

1. **Browse Games:** Navigate to `/circle/:circleId/games`
2. **Create Game:** Click "Create Game" and choose type
3. **Invite Players:** Use the invite system to add friends
4. **Play:** Click on active game to open full-screen detail page

### AI Opponents

4 games support AI opponents with difficulty levels:
- Tic-Tac-Toe (Minimax algorithm - unbeatable on Hard)
- Connect Four (Position evaluation)
- Checkers (Basic strategy)
- Hangman (Random word selection)

### Game Categories

- **Quick:** Fast games (< 5 minutes)
- **Social:** Multiplayer voting/response games
- **Strategy:** Chess, Checkers, Connect Four
- **Word:** Hangman, 21 Questions
- **Board:** Traditional board games

## 🚢 Deployment

### Deploy to Lovable

1. Visit [Lovable Dashboard](https://lovable.dev/projects/b5b93414-f27a-4644-bcb8-6ad918ca473c)
2. Click **Share** → **Publish**
3. Follow the deployment wizard

### Deploy to Vercel/Netlify

```bash
# Build the project
npm run build

# The dist/ folder contains your production build
```

**Environment Variables:** Don't forget to set all `VITE_*` variables in your hosting platform.

### Database Migrations in Production

Ensure all migrations are applied to your production Supabase project:

1. Go to Supabase Dashboard → SQL Editor
2. Run migrations in chronological order
3. Verify with: `SELECT * FROM pg_enum WHERE enumtypid = 'game_type'::regtype;`

## 🧪 Testing

> ⚠️ **Testing infrastructure is not yet set up.** This is a high-priority item on the roadmap.

Planned testing stack:
- Vitest (unit tests)
- React Testing Library (component tests)
- Playwright (E2E tests)

## 📚 API Documentation

### Edge Functions

**Games API** (`/supabase/functions/games/index.ts`)
- `GET /games` - List user's games
- `POST /games` - Create new game
- `GET /games/:id` - Get game details
- `POST /games/:id/join` - Join game
- `POST /games/:id/action` - Make move/action

**Email API** (`/supabase/functions/send-invite-email/index.ts`)
- `POST /send-invite-email` - Send circle invitation

### Database Schema

See `src/integrations/supabase/types.ts` for full TypeScript types.

**Key Tables:**
- `circles` - Friend groups
- `circle_members` - Group membership
- `profiles` - User profiles
- `wall_items` - Wall posts
- `chat_threads` - Chat conversations
- `chat_messages` - Chat messages
- `games` - Game instances
- `game_participants` - Game players
- `game_events` - Game moves/actions

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## 🔒 Security

- **Row-Level Security (RLS):** Enabled on all tables
- **Authentication:** Supabase Auth with JWT tokens
- **Input Validation:** Zod schemas on Edge Functions

**Security Issues:** Please report to the repository maintainers privately.

## 📝 License

[Add your license here]

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- UI Components from [shadcn/ui](https://ui.shadcn.com)
- Chess logic powered by [chess.js](https://github.com/jhlywa/chess.js)
- Icons by [Lucide](https://lucide.dev)

## 📞 Support

- **Documentation:** See `/docs` folder (coming soon)
- **Issues:** [GitHub Issues](your-repo-url/issues)
- **Discussions:** [GitHub Discussions](your-repo-url/discussions)

## 🗺️ Roadmap

**Current Status:** MVP with 11 games, real-time chat, and wall posting

**Upcoming Features:**
- [ ] Testing infrastructure (Vitest + Playwright)
- [ ] Chess AI implementation
- [ ] PWA support (offline mode, push notifications)
- [ ] Content moderation system
- [ ] User blocking/muting
- [ ] Direct messages
- [ ] Mobile app (React Native)
- [ ] Video calls integration
- [ ] More games (tournaments, leaderboards)

## 💡 Tips & Tricks

### Keyboard Shortcuts
- (Coming soon - see `src/hooks/useKeyboardShortcuts.ts`)

### Performance
- Images are automatically compressed before upload
- Real-time updates use Supabase subscriptions
- Code splitting for React and UI vendors

### Troubleshooting

**"Game function failed" error:**
- Ensure you've run the migration: `20251125120000_add_missing_game_types.sql`

**"Unauthorized" errors:**
- Check your `.env` file has correct Supabase credentials
- Ensure you're logged in

**Real-time not working:**
- Check Supabase project has realtime enabled
- Verify RLS policies allow reading data

**Build fails:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node version: `node -v` (should be 18+)

---

Built with ❤️ for friend groups who want a private, fun space to hang out online.
