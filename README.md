# Vantage MOC — Electronic Management of Change

An internal web application that replaces the paper/Excel MOC process (printed
forms, wet signatures, walking folders between offices) with an electronic
workflow. It digitizes the existing Vantage MOC procedure exactly as written —
the same forms, the same checklists, the same approval chains — so no
retraining of the process itself is needed, only of the tool.

Built to replace a paid MOC module (Intelex / Enablon / Gensuite) with
something the EHS team owns and can change.

## What's inside

The app implements all five forms from the MOC procedure:

| Paper form | In the app |
|---|---|
| Appendix B — MOC Level 1 Form | **MOC Level 1** with functional review checklist and close-out checklist |
| Appendix C — MOC Level 2 Form | **MOC Level 2/3/4** with S&E assessment check-words, documentation checklist, full approval chain |
| Appendix D — Safety System Bypass | **Bypass** with shift log, >72-hour extension approvals, return-to-service verification |
| Appendix E — MOOC Form | **Organizational change** with transition plan and Site Manager approval |
| Appendix G — MOC Addendum | **Addenda** attached to any in-flight MOC, approved by the Technical Authority |

And the process rules from the training deck:

- **Hazard assessment matrix** — degree of hazard × significance determines
  Level 1–4 and picks the right form automatically. Level 3 requires a
  What-If PHA, Level 4 a HAZOP (enforced at submission).
- **Approval routing** — signatures route to the people holding each
  functional role (Process Safety, EHSS Manager, Production Manager,
  Technical Authority, Maintenance Manager, Site Manager) at the MOC's site.
- **Electronic signatures** — each signer types their full name and re-enters
  their password; the decision, name, and timestamp go to a permanent audit
  trail. A rejection sends the MOC back to the lead with comments.
- **Temporary changes** — require an end date, are flagged on the dashboard
  when overdue, and can be extended at most 3 times (Part 4B reviews).
- **Multi-site** — every record belongs to a site; MOC numbers are
  per-site/per-year (e.g. `GUR-2026-0001`); users see only their sites.
- **Notifications** — in-app always; email when SMTP is configured.
- **Attachments, punch lists (PSSR A/B/C categories), print/PDF export,
  full audit trail** on every record.

## Quick start (local)

```bash
npm install
cp .env.example .env        # edit SESSION_SECRET + admin credentials
npx prisma migrate deploy
npm run db:seed             # creates the first admin + site
npm run dev                 # http://localhost:3000
```

To explore with demo users for every approval role:
`SEED_DEMO=1 npm run db:seed` (all demo users' password: `VantageDemo1!`).

## Production deployment (Docker)

```bash
cp .env.example .env   # set SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up -d --build
```

The container applies database migrations on start, creates the first admin
account on first run, and stores the SQLite database and uploaded attachments
in the `moc-data` volume — **back that volume up**. Put the app behind your
reverse proxy with HTTPS; if you must serve plain HTTP inside a trusted
network, set `INSECURE_COOKIES=1`.

### First-run checklist for the administrator

1. Sign in with the admin account and change the password (top right → name).
2. **Admin → Sites**: add your other sites.
3. **Admin → Users**: create accounts, tick each user's site(s), and tick the
   functional roles they hold (this is what routes approvals). The Sites page
   warns when a role nobody holds would block routing.
4. Configure SMTP in the environment if you want email notifications.

## Architecture (for whoever maintains this)

- **Next.js 15 (App Router) + TypeScript + Tailwind** — single service,
  server-rendered pages, server actions for all mutations.
- **SQLite via Prisma 6** — a single file database; right-sized for MOC
  volume across multiple sites. Migrating to PostgreSQL later means changing
  the datasource and connection string, not the application code.
- `src/lib/workflow.ts` — the approval stages per form type, transcribed from
  the paper forms. Changing who signs what happens here.
- `src/lib/checklists.ts` — every checklist template (functional review, S&E
  check-words, documentation checklist, close-out, transition plan).
  Editing a checklist is editing this file.
- `src/lib/moc-service.ts` — numbering, role-holder routing, stage
  progression.
- `src/app/actions.ts` — all mutations with authorization checks.
- `scripts/workflow-smoke.ts` — end-to-end test of every workflow
  (`npx tsx scripts/workflow-smoke.ts` against a seeded dev database).

Authentication is email + password (bcrypt) with signed session cookies.
The password doubles as the e-signature credential. The user model is
intentionally simple so Microsoft Entra ID (M365) SSO can be added later as
an alternative login path without schema changes.

## Source documents

The original paper forms (`Appendix B/C/D/E/G`), the training deck
(`MOC - How To.pptx`), and the brand style guide (`branding.md`) are kept in
the repository root as the reference for what this app implements.
