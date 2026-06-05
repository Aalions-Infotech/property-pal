
# Enterprise Upgrade Plan — Ekananda Estate

You picked the maximum scope: every focus area, multi-tenant agencies, all compliance items. That is a large multi-week build, so I'll ship it in 4 reviewable phases. You approve this plan once, then I implement Phase 1 immediately and walk you through 2–4 in order. You can pause or reorder after any phase.

---

## Phase 1 — Foundation: Multi-tenant Agencies & RBAC v2

The biggest structural change first, because every later feature plugs into it.

**Backend (migrations)**
- New tables: `organizations`, `org_members` (org_id + user_id + role: owner/admin/manager/agent), `org_branches`, `org_invites` (token-based, email).
- `property_listings`, `leads`, `agent_clients`, `sponsorships` gain optional `org_id` + `branch_id`. Existing rows backfill to `null` (treated as "solo agent").
- New SECURITY DEFINER helpers: `is_org_member(org, user)`, `org_role(org, user)`, `current_user_org_ids()`.
- RLS rewritten on the 4 affected tables: solo rows behave as today; org rows visible to all members of that org, mutations restricted by org role.
- Activity log extended with `org_id`.

**Frontend**
- Org switcher in Navbar (persists in localStorage).
- `/org/create`, `/org/settings`, `/org/members` (invite by email, role assign, branch CRUD).
- Invite acceptance page `/org/invite/:token`.
- Listing & lead forms get an org/branch selector when the user belongs to ≥1 org.

---

## Phase 2 — Agent & Broker CRM + Buyer Discovery

**CRM (`/agent-dashboard/crm`)**
- Kanban lead pipeline (stages: New → Contacted → Visit Scheduled → Negotiation → Closed Won/Lost) with drag-drop.
- Lead detail drawer: timeline of activities, call/email/note logs, next-action reminder.
- Tasks & reminders table with due-date notifications.
- Commission tracker: deal_value, commission %, payout status; monthly summary.
- Performance report: leads received, conversion %, avg response time, revenue.

**Buyer discovery**
- Saved-search email digests (daily/weekly via existing Resend) — new edge function `saved-search-digest` on cron.
- Smart shortlists ("Folders") — users can group saved properties.
- Compare upgrades: highlight differences, AI-generated pros/cons via Lovable AI.
- Neighborhood insights panel on PropertyDetail (schools, hospitals, transit using existing locality data + price trend chart).

---

## Phase 3 — Compliance & Trust

- **KYC**: new `kyc_submissions` table (doc URLs, type, status, reviewer). Upload UI for agents & sellers (`/account/kyc`). Admin queue at `/admin/kyc`. Verified badge surfaces on agent cards and listings.
- **RERA verification workflow**: structured RERA fields on listing + project, admin verification status, public "RERA Verified" badge.
- **Anti-fraud & duplicate detection**:
  - Background trigger on listing insert/update flags duplicates by (locality, area ±5%, price ±10%, same images hash).
  - Phone/email blacklist table; lead submission and signup check against it.
  - Flag button on listings → goes into a moderation queue with SLA timer.
- **2FA** (TOTP) for admin and agent roles using `otpauth` lib + QR code; recovery codes stored hashed.
- **Active sessions panel** on Account: list devices, force sign-out a session.
- **Audit log UI** for admins (already populated server-side) — filter by actor, entity, date.
- **DPDP data export & delete-me**: edge function bundles a user's data into JSON and emails a download link; "Delete my account" path that calls existing `admin_delete_user` flow as a self-serve request.

---

## Phase 4 — Growth, Monetization & Analytics

- **Subscription tiers** for agents/agencies (Free / Pro / Agency) via Stripe Billing — new `subscriptions` table; gate features (lead volume, listing slots, CRM seats).
- **Lead packs**: agencies buy 50/200/500 verified leads, balance decrements as leads route.
- **Paid boosts on listings** (separate from existing sponsorships): pay-per-day featured slots.
- **GST-compliant invoices** generated via edge function (PDF) and emailed; stored in `invoices` table.
- **Referral program**: unique referral codes, attribution, reward issuance.
- **Analytics dashboard** at `/admin/analytics` (and per-org at `/org/analytics`):
  - Cohorts (signup week → retention), funnels (view → lead → deal), revenue, top localities, agent leaderboard.
  - Powered by aggregation views + Recharts; no third-party analytics required.

---

## Cross-cutting Technical Decisions

- All new tables follow the project's RLS standard (org-aware where applicable, explicit GRANTs, service_role full).
- SECURITY DEFINER helpers for every cross-table check to avoid RLS recursion.
- Realtime publication kept minimal — only `notifications`, `leads` (with column filtering), `messages`.
- Edge functions reused: `agent-approval-email`, `listing-status-email`, `ai-recommendations`, plus new: `saved-search-digest`, `kyc-status-email`, `data-export`, `generate-invoice`, `verify-totp`.
- No new external paid services — Stripe + Resend + Lovable AI cover everything.
- All UI uses existing Navy/Gold design tokens and shadcn primitives; pages stay fully responsive.

---

## What I'll Do Right After You Approve

Implement Phase 1 end-to-end (migration + UI), verify, then post a short summary and ask whether to proceed to Phase 2 immediately or pause. Each phase is independently shippable, so the app keeps working between phases.
