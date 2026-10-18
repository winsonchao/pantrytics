# Pantrytics 🍳

> **Smart Food Image Analysis & Recipe Generation Web App powered by TanStack Start and Gemini 3.5 Flash Lite.**

Pantrytics lets you snap or upload photos of food and groceries, uses Google Gemini Vision to analyze ingredients, stores your inventory in browser LocalStorage (with a clean abstraction layer ready for Supabase), and generates tailored recipes with step-by-step cooking guides and interactive timers based on available items.

---

## ✨ Key Features

1. **📷 AI Food & Dish Scanner (`/scan`)**
   - Live camera snapshot capture or file drag-and-drop / upload.
   - Dual analysis modes: **Raw Ingredients Scanning** (batch recognize produce & meat for pantry storage) and **Dish Analysis** (reverse-engineer cooked meals into ingredient components).
   - Powered by **Google Gemini 3.5 Flash Lite** (with smart fallback support).
   - Editable recognition cards with category, estimated quantities, units, and suggested expiry dates before batch adding to inventory.

2. **🥬 Pantry & Fridge Inventory Management (`/pantry`)**
   - Categorized browsing: Vegetables, Meat, Seafood, Dairy & Eggs, Fruit, Grains, Seasonings, and Others.
   - Storage locations: Fridge ❄️, Freezer 🧊, Room Temperature 🧺.
   - Real-time expiry alerts (highlighting items expiring in ≤ 3 days or already expired).
   - Quick quantity adjustment (+ / -) directly on cards.
   - Common Taiwanese kitchen seasonings quick-toggle bar.
   - Multi-select ingredients with a floating action bar: **"Cook with Selected"**.

3. **🍳 AI Recipe & Step-by-Step Cooking Guide (`/recipes`)**
   - Generates 3~4 customized recipes strictly utilizing your selected pantry items.
   - Preferences: Cuisine styles (Taiwanese home cooking, Japanese/Korean, Western, Low-carb/healthy, Quick stir-fry, Steamed soups), preparation time limits, servings, and available cookware.
   - Interactive **Cooking Mode Modal**:
     - Precise ingredient amounts with pantry matching indicators.
     - Preparation (Prep) guide.
     - Step-by-step instructions with **built-in interactive countdown timers** (audio alert & progress bar).
     - Chef pro tips for optimal seasoning and heat control.
     - One-click bookmarking to your recipe collection.

4. **📖 Saved Recipes Notebook (`/saved-recipes`)**
   - Save favorite AI-generated recipes for future reference.
   - Offline accessible and exportable.

5. **⚙️ Settings & Future Supabase Bridge (`/settings`)**
   - Gemini API Key setup (supports server-side `.env` or client-side storage for maximum flexibility).
   - Storage abstraction layer status (`LocalStorageAdapter` currently active).
   - **Future Supabase migration bridge**: pre-configured table schema SQL copy button and config placeholders for future multi-device syncing.
   - JSON export and import for easy backups.

---

## 🛠 Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (Full-stack React with Vite and file-based routing via TanStack Router).
- **Runtime & Package Manager**: [Bun](https://bun.sh) / Node.js.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) with `@tailwindcss/vite`.
- **Icons**: [Lucide React](https://lucide.dev).
- **AI Engine**: Google Gemini API via official `@google/generative-ai` & `@google/genai` (Free tier `gemini-2.5-flash`).
- **Data Layer**: Browser `LocalStorage` abstraction with clean interface (`StorageAdapter`) ready for [Supabase](https://supabase.com).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
bun install
# or: npm install
```

### 2. Configure Gemini API Key (Free)
You can obtain a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

Set it in `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*Note: You can also enter your API key directly on the Web UI Settings page (`/settings`). It will be securely stored in your browser's LocalStorage.*

### 3. Development Server
```bash
bun run dev
# or: npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build
```bash
bun run build
bun run start
```

---

## 🗄 Storage Architecture: LocalStorage to Supabase

The application uses the **Adapter Pattern** located in `src/lib/storage/`:
- `types.ts`: Defines `StorageAdapter`, `Ingredient`, `Recipe`, and `UserSettings`.
- `localStorageAdapter.ts`: Full implementation utilizing browser `localStorage`, with initial demo seed data.
- `supabaseAdapter.ts`: Pre-wired skeleton for future migration.

### Database Schema for Supabase
```sql
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) default auth.uid(),
  name text not null,
  category text not null,
  quantity numeric not null default 1,
  unit text not null default '份',
  storage_location text not null default 'fridge',
  expiry_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.saved_recipes (
  id text primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  data jsonb not null,
  created_at timestamptz default now()
);
```

---

## 📄 License
MIT
