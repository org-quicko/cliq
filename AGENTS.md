# Repository guide for coding agents

## Layout

This repository has separate npm packages, not a root npm workspace. Run npm commands from the package you change.

- `api/`: NestJS API, TypeORM entities and migrations (`db/`), Vitest tests (`src/**/*.spec.ts` and `test/`).
- `frontend/`: Angular workspace with `admin-portal`, `promoter-portal`, and the shared `org-quicko-cliq-ngx-core` library under `projects/`.
- `lib/core/`, `lib/client/`, `lib/sheet-core/`: separately built TypeScript packages. `lib/sheet-core/generated/` is produced from schemas in `lib/sheet-core/resources/schemas/`.
- `e2e/`: Playwright browser tests for the running API and portals.
- `docs/`: Docusaurus documentation.

Read the relevant package's `README.md` and `package.json` before changing its build, generation, or test flow. Use Node.js 22 for the API and CI-aligned work.

## Making changes

- Keep a change within the owning package unless its public contract requires updates elsewhere. When changing API payloads or shared models, check their consumers in `frontend/`, `lib/`, `e2e/`, and `docs/`.
- Add or update tests for changed behavior in the nearest existing test suite. API unit tests live beside source; API integration and HTTP tests live in `api/test/integration/` and `api/test/e2e/`.
- Put database schema changes in `api/db/migrations/` and keep TypeORM entities aligned with them. Inspect existing migrations before adding one.
- Edit source schemas or generators for generated code; do not hand-edit generated output unless that output is intentionally checked in and is part of the change.
- Do not commit secrets or local environment files. Use the package's example environment file when setup is needed.

## Validation

Run the checks relevant to the changed package, from that package's directory:

| Package | Commands |
| --- | --- |
| `api/` | `npx oxlint --type-aware`, `npm run format:check`, `npm test`; `npm run test:integration` and `npm run test:e2e` for database or HTTP behavior |
| `frontend/` | `npm run build:admin`, `npm run build:promoter`, or `npm run build:org-quicko-cliq-ngx-core` for the affected project; `npm test` for relevant Angular tests |
| `lib/core/`, `lib/client/`, `lib/sheet-core/` | `npm run build`; use package-specific test scripts where present |
| `e2e/` | `npm run typecheck`, `npm test` |
| `docs/` | `npm run typecheck`, `npm run build` |

API integration and HTTP tests use Testcontainers and need Docker. Browser tests need a running stack and Chromium; see `e2e/README.md` for local setup. CI runs API lint, unit, integration, and HTTP tests plus Playwright typechecking and browser tests (`.github/workflows/ci.yml`).
