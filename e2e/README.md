# Cliq e2e tests

Playwright tests that drive the production admin portal, Nest API, Postgres and
Redis together. They arrange isolated programs through the API and assert the
behaviour in a real browser.

## Running locally

```bash
cd e2e
npm install
npx playwright install chromium
npm run stack:up
npm test
npm run stack:down
```

Use `npm run test:ui` while writing a test. To run against local dev servers,
set `BASE_URL` (and, if needed, `API_URL`) in `e2e/.env.e2e`; copy
[.env.e2e.example](.env.e2e.example) first.

## Test data and scope

The setup project creates or verifies one configurable super-admin account.
Each browser test that needs data receives a new, uniquely named program. The
stack database lives in tmpfs, so `npm run stack:down` removes every fixture at
the end of a run. The browser starts with the same `CLIQ_ACCESS_TOKEN` cookie
that the portal writes at login; login tests explicitly start without it.

The suite covers both portals: super-admin authentication and program settings
in `/admin`, and member authentication, links, referrals and settings in the
promoter portal. It covers live tables and trigger-maintained analytics,
including promoters, referrals and links.

The super-admin program summary reads `program_summary_mv`, a materialized view
that production refreshes on a cron. The e2e stack disables that cron
(`REFRESH_MV_CRON`), and tests call the `refreshProgramSummary` fixture to
refresh the view over a direct Postgres connection, so results don't depend on
runner speed. The stack publishes Postgres on `localhost:55432` (override with
`E2E_DB_PORT`). Against a remote `BASE_URL`, set `DB_URL` or these tests skip.
The cron itself is covered by the API integration tests.
