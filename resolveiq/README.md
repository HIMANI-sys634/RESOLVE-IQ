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

## Recent UI pass

- **Mobile navigation** — the sidebar was `hidden md:flex`, so below the `md`
  breakpoint there was previously no way to move between sections at all.
  Added `components/layout/MobileNav.tsx`, a slide-in drawer sharing the same
  nav list as the desktop sidebar (`NavLinks` in `Sidebar.tsx`), opened from a
  menu button in `Topbar.tsx` and closed on route change, overlay click, or
  Escape. Search also gets a mobile fallback (icon button → `/tickets`) below
  the breakpoint where the inline search field is hidden.
- **Tighter cross-linking, the product's actual differentiator** — customer
  rows in `CustomerTable` now link into that customer's tickets
  (`/tickets?q=<name>`, reusing the existing search filter rather than adding
  a new customer-detail route); the ticket investigation header links the
  customer name the same way. Most notably, `RecommendationPanels` now
  surfaces `Recommendation.relatedClusterId/Name/relatedComplaintCount` —
  fields that already existed in the data contract and mock data but weren't
  rendered anywhere — as a second, independent link into Complaint
  Intelligence: the ticket's own classification links out via
  `ClusterConnectionStrip` above the fold, and the resolution agent's
  evidence-based match links out from inside its recommendation.
- Minor responsive fix: `EmergingIssues` row sparklines hide below `sm` so a
  four-column grid doesn't cram onto a narrow phone screen.

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
                          The adapter already calls the live Student 1 and Student 3 services and
                          falls back to deterministic demo data if a service is offline.
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
2. Copy `.env.example` to `.env.local`. The defaults point at the local
   Student 1 and Student 3 services used by the hackathon project.
3. Run it:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` — it redirects to `/dashboard`.

If your project uses Tailwind v3 instead of v4 (check whether you have a
`tailwind.config.ts`), replace the `@theme inline { ... }` block in
`app/globals.css` with the equivalent `theme.extend.colors` entries in
`tailwind.config.ts`, using the same `--color-*` CSS variables.

## Live service wiring

The frontend is already wired to the current hackathon APIs. `services/api.ts`
normalizes the real responses into the UI data contract, so the pages do not
need backend-specific logic.

- Student 1: customers, orders, complaints, and `/intelligence/analyze`.
- Student 2: intelligence is consumed through Student 1 at
  `/intelligence/analyze`.
- Student 3: ticket recommendations come from
  `/agent/analyze/{complaint_id}`.
- If either service is temporarily unavailable, deterministic demo data keeps
  the interface usable for presentation.

## Notes

- All mock data is static (not `Math.random()`-generated) so server- and
  client-rendered output always match and demo runs are reproducible.
- Customer data is generic and demo-only (`Customer #4821`, etc.) — the
  dashboard intentionally does not lead with customer names.

## Live hackathon integration

ResolveIQ connects directly to the project services:

- Student 1 FastAPI: `http://127.0.0.1:8000`
- Student 2 Intelligence Engine: exposed through Student 1 at `/intelligence/analyze`
- Student 3 AI Agent: `http://127.0.0.1:8001`

Copy `.env.example` to `.env.local` if you want to override these URLs.

The UI uses live backend data when the services are available and falls back to the bundled demo dataset when they are offline. Ticket investigation pages call Student 3's `/agent/analyze/{complaint_id}` endpoint for the decision and customer response.
