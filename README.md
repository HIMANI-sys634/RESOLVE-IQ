# ResolveIQ — Frontend

AI-powered customer support intelligence & resolution system. This is Student
4's deliverable: the Next.js / TypeScript / Tailwind frontend for the
ResolveIQ hackathon project (Team K-DON, Customer Support track).

## What this is

Not a chatbot UI — a support **operations** platform. It resolves individual
tickets *and* connects related complaints into the pattern behind them
("Complaint solve bhi + complaint se insight bhi"). The dashboard's
**Complaint Intelligence** section is the product's differentiator and is
surfaced prominently, not buried as a secondary tab.

## Design system

- **Palette** — near-black charcoal background (`#0b0c0e`), slightly raised
  panels (`#141518`), a restrained blue accent (`#5b84e6`), and muted
  success/warning/critical tones. No gradients, no glow, no glassmorphism.
  Every status also carries a text label and, where relevant, an icon — never
  color alone.
- **Type** — Inter throughout, tabular figures for numbers, sentence case
  everywhere (no tracked-out all-caps labels).
- **Motion** — CSS transitions only, 150–250ms, on hover/focus/route change.
  No entrance animations, no bounce, no particles.
- **Layout** — fixed 240px sidebar, 8px spacing scale, 1px borders instead of
  shadows, flat sections where a card isn't needed.

Tokens live in `app/globals.css` under `:root` and are mapped to Tailwind
utilities via `@theme inline` (e.g. `--color-accent` → `bg-accent`,
`text-accent`, `border-accent`).

## Folder structure

```
app/
  dashboard/            Overview — top metrics, Emerging Issues, charts
  tickets/              Ticket list (search, filter, sort)
  tickets/[id]/         Ticket investigation screen
  intelligence/         Complaint Intelligence — cluster grid + trends
  intelligence/[id]/    Cluster drill-down + related tickets
  customers/            Customer list
  history/              Case history log
  settings/             Workspace, escalation, notification settings
  globals.css           Design tokens (colors, type, focus states)
  layout.tsx            Root layout — loads Inter, wraps AppShell

components/
  layout/               Sidebar, Topbar, AppShell (page-transition wrapper)
  ui/                   Badge, Button, Panel, StatCard, empty/error/loading states
  dashboard/            EmergingIssues, SVG chart primitives (no chart library)
  tickets/              TicketTable, InvestigationHeader, ConversationPanel,
                        ClusterConnectionStrip, RecommendationSection (async,
                        streamed), RecommendationPanels (interactive)
  intelligence/         ClusterGrid
  customers/, history/, settings/   per-page components

lib/
  types.ts              Shared data contract (Ticket, Trend, Recommendation, ...)
  mock-data.ts           Centralized, hand-authored mock data
  utils.ts               Formatters + status/severity label maps

services/
  api.ts                 Every screen reads data through this file only.
                          Swap the mock-backed functions for real fetch()
                          calls against NEXT_PUBLIC_API_URL when Student 1's
                          API is ready — call sites don't need to change.
```

Every route has its own `loading.tsx` (skeleton) and `error.tsx` (retry
button); ticket and cluster detail routes also have `not-found.tsx`.

## Setup

This assumes the project already exists via
`npx create-next-app@latest resolveiq` (TypeScript, Tailwind, App Router, no
`src/` directory) — these files are meant to be copied into that project,
not to replace it.

1. Install the one new dependency (icons):
   ```bash
   npm install lucide-react
   ```
2. Copy `.env.example` to `.env.local` if you want to point at a real
   backend later; the app runs fully on mock data without it.
3. Run it:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` — it redirects to `/dashboard`.

If your project uses Tailwind v3 instead of v4 (check whether you have a
`tailwind.config.ts`), replace the `@theme inline { ... }` block in
`app/globals.css` with the equivalent `theme.extend.colors` entries in
`tailwind.config.ts`, using the same `--color-*` CSS variables.

## Wiring in Student 2 and Student 3's output

- Student 2 (NLP + clustering) → fills `Trend[]` and `ComplaintAnalysis` in
  `lib/types.ts`. Replace `fetchTrends()` / `fetchTrendById()` in
  `services/api.ts` with a call to their endpoint; the shape is already
  what `ClusterGrid` and the cluster detail page expect.
- Student 3 (resolution agent) → fills `Recommendation`, fetched independently
  from the ticket via `fetchRecommendationForTicket()` in `services/api.ts`
  (mirrors the real system: the agent call is slower than the ticket read, so
  the UI streams it in behind a `<Suspense>` boundary instead of blocking the
  page — see `app/tickets/[id]/page.tsx`). `RecommendationPanels` already
  renders evidence, recommended actions, recommended response, and the
  approve/escalate/send decision from that shape.
- Student 1 (backend) → once `/tickets`, `/customers`, `/trends`, etc. exist,
  swap each function body in `services/api.ts` for a `fetch()` call. No
  component changes are required.

## Notes

- All mock data is static (not `Math.random()`-generated) so server- and
  client-rendered output always match and demo runs are reproducible.
- Customer data is generic and demo-only (`Customer #4821`, etc.) — the
  dashboard intentionally does not lead with customer names.
