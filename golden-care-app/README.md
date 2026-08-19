# 🐶 Golden — Golden Retriever Family Care App

A polished, mobile-first web app for a family to manage the day-to-day care of a
Golden Retriever puppy. The core idea: parents open the app and immediately know
**what the puppy needs right now** — feeding, potty, training, rest, checks —
without doing any nutrition math. The app does the calculations in the background.

Built for our actual puppy (Golden Retriever, ~3 months, ~9 kg, vegetarian Indian
household) but everything is editable data, not hard-coded.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
```

First launch seeds a realistic demo (profile, family, a week of history). Reset
any time from **Admin → Demo data → Reset**.

## What it does

- **Today** — a single prominent **NEXT ACTION** card with a **DONE** button, an
  auto-generated daily routine + checklist, quick actions (Feed / Water / Potty /
  Train / Play / Rest / Medicine / Weigh), a calm dashboard, a potty coach, and
  human-error alerts (duplicate feed, missed meal, treat over-budget, weight-check
  due, supplement warning).
- **Diet** — parent-friendly daily energy target, today's food in **grams** (auto
  from the food's kcal/kg), the **Set our standard diet** editor, treat budget
  (≤10%), and a searchable **food safety database** focused on an Indian kitchen.
- **Train** — a timed 10-minute daily session, an age-gated positive-reinforcement
  curriculum with progress, one-tap behaviour logging with trend insights, and a
  rest coach.
- **Grow** — weight / height / BCS charts, growth-velocity analysis (trajectory,
  not a "correct weight"), a guided weekly check, and a plain-language weekly report.
- **Health** — vet reminders & records, and a very visible **"Should I call the
  vet?"** triage (emergency / prompt / monitor — educational, never a diagnosis).
- **Family mode** — everyone shares one dog state; actions are attributed and
  visible so nobody double-feeds. Switch between **Simple** (parents) and
  **Admin** (detailed controls + scientific transparency) modes.

## Safety & science

The nutrition engine deliberately separates **energy** from **nutritional
adequacy**: calories alone never mean the diet is complete. It prioritises a
complete-and-balanced large-breed **growth** food, lean body condition, measured
meals and weekly monitoring, and warns against routine calcium/multivitamin
supplementation. Energy uses `RER = 70 × kg^0.75` × a life-stage factor,
presented as a *starting estimate*. Every important calculation exposes its
formula, basis, assumptions and limitations under **"Why this number?"**, and
**Admin → Sources & assumptions** documents the evidence basis (WSAVA, AAHA,
Merck Veterinary Manual, AAFCO/FEDIAF, AVSAB, manufacturer guides). This app is
educational and does not diagnose or prescribe treatment.

## Tech

React + TypeScript + Vite + Tailwind. Local persistence via IndexedDB (Dexie) so
a backend (e.g. Supabase/Postgres) can later replace the data layer table-for-table.

```
src/
  types/         all data models
  data/          seed, food DB, training curriculum, red-flags, sources
  db/            Dexie database + mutation actions
  services/      calculations (calc, age, routine, potty, bcs, insights, alerts, today)
  hooks/         useData — one live-data surface
  components/    UI primitives, app shell, sheets
  pages/         Today, Diet, Train, Grow, Health, Admin
```

All calculations live in `services/` — never inside UI components.
