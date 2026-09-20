# NestLedger — PG owner portal

A self-hosted owner workspace for a PG business. Next.js 16, React 19, TypeScript and PostgreSQL. One application, one database, no mandatory SaaS subscription. Designed for a small business with a few properties and staff accounts.

## What works

- Owner dashboard: occupancy, available beds, monthly collections, outstanding balances, cash-flow chart and property summaries.
- Multiple PGs with property filters, amenities, rules and rent due-day settings.
- Rooms and individual beds; maintenance status; transactional protection against double occupancy.
- Tenant onboarding, profiles, emergency contacts, agreement expiry, deposit tracking, notices and within-PG bed transfers.
- Current-month billing, first-month proration, manual extra charges, partial payments, duplicate-submission protection and printable receipts.
- Deposit collection, checkout settlement, refund recording and release of the bed. Refunds/payments are records of money handled outside the app; the application does not transfer money.
- Expenses, payment status, maintenance requests, enquiries and follow-ups.
- Private PDF/JPG/PNG documents (5 MB each), scoped downloads.
- CSV reports, cash surplus and refundable deposits reported separately.
- Owner, manager, accountant and caretaker roles; server-enforced per-PG access; account disabling and password changes.
- Mutation audit history, secure session cookies, same-origin mutation checks and account-based login throttling.
- Scheduled billing script, database schema setup, demo seeding, Docker Compose, HTTPS reverse proxy and backup script.

## Existing local demo on this computer

The Desktop checkout is the repository. `LOCAL-ACCESS.txt` contains the generated local login; it and `.env` are ignored by Git. The demo is clearly marked in the interface.

```sh
npm install
npm run dev
```

Open http://localhost:3000. The local PostgreSQL instance created during setup runs on port 55432. Its data directory is `/Users/venkatreddy/Documents/Codex/2026-09-19/20/work/postgres`. It is isolated from other databases and bound to loopback. It uses local trust authentication solely for this demo; production Compose uses a password. If you restart your computer, start it with:

```sh
/opt/homebrew/bin/pg_ctl -D /Users/venkatreddy/Documents/Codex/2026-09-19/20/work/postgres -l /Users/venkatreddy/Documents/Codex/2026-09-19/20/work/postgres.log -o '-p 55432 -h 127.0.0.1 -k /private/tmp' start
```

## Fresh local setup

Requirements: Node.js 24+, npm and PostgreSQL 17+ (or Docker).

1. Copy `.env.example` to `.env`. Set `POSTGRES_PASSWORD` to a random hex password, align it with `DATABASE_URL`, and set `SESSION_SECRET` to at least 32 random characters. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` generates a secret.
2. Start a database: `docker compose -f compose.local.yaml up -d`.
3. Run `npm ci`, then `npm run db:migrate`.
4. For an empty real workspace, leave `DEMO_MODE=false`. Create an owner without putting the password in shell history:

```sh
read -s OWNER_PASSWORD
export OWNER_PASSWORD
npm run owner:create -- owner@example.com "Your name"
unset OWNER_PASSWORD
```

5. For sample data instead, set `DEMO_MODE=true`, then run `npm run db:seed` on an empty database. Generated credentials go into `LOCAL-ACCESS.txt`.
6. Run `npm run dev`, then open http://localhost:3000. Use this exact origin; same-origin request validation is intentional.

Do not change `DEMO_MODE` to pretend sample records are real. Use a new empty database for production.

## Role permissions

| Role       | Access                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Owner      | Every PG, all modules, property settings, staff administration and audit history                                                      |
| Manager    | Assigned PGs, tenants, operations, billing, expenses and documents                                                                    |
| Accountant | Assigned PGs, resident/billing information, collections, deposits, charges, expenses and reports; no onboarding/checkout or documents |
| Caretaker  | Assigned PG rooms/beds and maintenance; no financial records or tenant profiles                                                       |

Tenant names are visible on occupied beds to assigned caretakers. Staff membership is enforced server-side for every query and mutation; hiding navigation is not the security boundary.

## Billing and settlement policy

- Money is stored as integer paise. CSV monetary columns currently remain in paise.
- Business dates use Asia/Kolkata. Database DATE values remain date strings to avoid timezone shifts.
- Generate rent creates only the current month's rent, once per stay. Run the daily billing task to pick up mid-month arrivals.
- Joining month is prorated by calendar days including joining day. Checkout month is charged in full. There is no automatic historical billing, late fee, discount, tax invoice, advance-credit allocation or rent escalation in this first version.
- Payment recording rejects overpayments. Record each payment against a bill. A random idempotency key protects the payment form from duplicate submission.
- Checkout requires settled bills, including checkout-month rent, and a reason/refund reference. It records the remaining deposit as refunded. Complete the external refund before confirming.
- Transfers within a PG retain rent/deposit terms. Cross-PG moves require settlement and fresh onboarding; prior bills remain attached to the old PG.
- Enquiries are a prospect tracker, not reserved inventory. Marking Converted does not automatically onboard a tenant.
- Historical financial records are not deletable through the UI. Corrections/credit notes, configurable prorated checkout and reservation advances remain future work.

## Single-server production deployment

Suggested starting point: a Linux VPS with 2 GB RAM, Docker and Compose, and a domain pointing to it. Production cost depends on provider, storage and backups. A single-server deployment has downtime during host failure; this is not a high-availability architecture.

1. Copy/clone the repository onto the server. Set `.env` values: `DOMAIN`, a random hex `POSTGRES_PASSWORD`, and `SESSION_SECRET`. Never copy local demo credentials or data. The Compose file constructs the production database URL and HTTPS origin.
2. Permit incoming TCP 80/443, and restrict SSH. PostgreSQL and the app have no published public ports.
3. Build with `docker compose build app` (prefer building the Linux image in CI or a separate build machine for a small VPS).
4. Start DB: `docker compose up -d db`.
5. Initialize schema: `docker compose run --rm app node scripts/migrate.mjs`.
6. Create owner using an environment variable:

```sh
read -s OWNER_PASSWORD
export OWNER_PASSWORD
docker compose run --rm -e OWNER_PASSWORD app node scripts/create-owner.mjs owner@example.com "Your name"
unset OWNER_PASSWORD
```

7. Run `docker compose up -d`. Caddy provisions HTTPS for `DOMAIN`; DNS must resolve to the server.
8. Verify `/api/health`, sign in, create your property and test a complete tenant workflow.

Database and uploads use Docker named volumes. Never use `docker compose down -v` against real data. The image runs as a non-root user. App secrets are runtime variables, not browser variables or image contents.

## Scheduled jobs and backups

On the Linux host, configure cron (replace the path):

```cron
# Daily billing; server timezone determines execution time, billing month uses India time.
15 1 * * * cd /srv/pg-owner-portal && docker compose exec -T app node scripts/bill.mjs >> /srv/pg-owner-portal/billing.log 2>&1
30 2 * * * /srv/pg-owner-portal/scripts/backup.sh >> /srv/pg-owner-portal/backup.log 2>&1
```

`backup.sh` produces a PostgreSQL custom-format dump plus a documents archive. Copy both to encrypted off-server storage and establish retention. The script does not configure a backup provider or off-site copying. Provider disk snapshots are an extra recovery layer, not a substitute for a tested database backup.

Test recovery on a separate empty database: `pg_restore --no-owner --no-acl -d <restore_database> <database.dump>`. Restore the matching upload archive into that deployment's uploads volume. Backups contain personal data; restrict access. For consistent point-in-time pairing, pause writes while taking/restoring the two archives. Schedule a monthly restore drill and monitor job failures.

## Verification

```sh
npm run test       # monetary validation and proration
npm run typecheck
npm run build
npm run test:e2e   # running local demo + Chrome required
```

E2E tests use the isolated demo credentials, create temporary `QA-` records and remove them afterward. Never run E2E against production. Tests cover concurrent bed assignment, duplicate monthly billing, overpayment and duplicate payment protection, deposit limits, checkout, property isolation, CSRF, private documents, desktop navigation, mobile overflow and CSV exports.

## Remaining integrations / deliberate boundaries

No live payment gateway, WhatsApp/SMS/email delivery, Aadhaar/PAN/police verification, e-signing, public listing, tenant app, payroll or tax accounting is connected. Reminders are shown inside the portal. Reports are CSV and receipts use browser Print / Save as PDF. File malware scanning, MFA, password recovery by email, role reassignment UI, server monitoring alerts and off-site backup provider configuration should be added as required before wider use. Avoid collecting sensitive identity documents until your storage/access/retention process is established.

No hosting account has been purchased and no public deployment has been made. The Docker deployment configuration is supplied but was not run here because Docker Desktop was not running. The application was built and tested against the isolated local PostgreSQL server.
