# pay-tracker

Michael Saez's UPS pay tracker — a static dashboard backed by a small Vercel
serverless API, gated by a single shared password (persistent cookie, not a
per-visit prompt).

**Live at:** https://michaelsaez.com/pay-tracker (primary) — also reachable
directly at the Vercel deployment URL, e.g. https://pay-tracker-flame.vercel.app.
The `/pay-tracker` path works via a reverse-proxy rewrite configured in the
**michael-saez/pilot-schedule** repo's `vercel.json` (that repo owns the
michaelsaez.com domain). `index.html` and `login.html` detect which context
they're running in via the `APP_BASE` constant so both URLs work identically.

## Structure

```
pay-tracker/
├── index.html          ← the dashboard (Check Lookup, Premiums, Pay Hours, Paychecks, Calendar)
├── login.html           ← password form
├── api/
│   ├── login.js          ← verifies PAY_PASSWORD, sets the pay_auth cookie
│   ├── logout.js         ← clears the cookie
│   └── pay-data.js       ← protected endpoint; checks the cookie, returns data/pay-data.json
├── data/
│   └── pay-data.json     ← THE pay data (premiums, hours, JA trips, paychecks, checks, bid map)
├── package.json
└── README.md
```

`data/pay-data.json` is never served as a static file — it's only readable through
`/api/pay-data`, which requires a valid `pay_auth` cookie.

## Required Vercel environment variables

Set these in the Vercel project (Settings → Environment Variables), for the
Production environment at minimum:

| Variable | Purpose |
|---|---|
| `PAY_PASSWORD` | The shared password for signing in at `/login.html` |
| `SESSION_SECRET` | Random secret used to sign the auth cookie (any long random string works — doesn't need to be memorable) |

After setting these, redeploy (or they'll apply automatically to new deployments).

## Auth model

Signing in at `/login.html` POSTs to `/api/login`, which checks the password
against `PAY_PASSWORD` and, on success, sets an `HttpOnly`, `Secure`,
`SameSite=Lax` cookie (`pay_auth`) valid for ~400 days (the browser max) — so
you stay signed in rather than being re-prompted on every visit. The cookie
value is `HMAC-SHA256(SESSION_SECRET, "authenticated")`, not the password
itself. `/api/pay-data` checks that cookie on every request before returning
data. `index.html` redirects to `/login.html` automatically on a 401.

## Updating pay data

Data updates are committed directly to `data/pay-data.json` via the GitHub
Contents API using a fine-grained PAT scoped to this repo only (Contents:
read/write, Metadata: read). See the `pay-tracker` skill for the full
procedure (schema, GitHub commit steps, deployment verification).
