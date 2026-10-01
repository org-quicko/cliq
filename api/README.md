# Cliq API 🚀

This package contains the backend API for the Cliq platform, providing all core business logic, authentication, and data management for affiliate and promoter operations. The API is built with scalability, security, and extensibility in mind.


## Tech Stack 🛠️

- **Framework:** NestJS 12 (Node.js)
- **Language:** TypeScript
- **Database:** PostgreSQL (configurable)
- **ORM:** TypeORM 1.x
- **API Documentation:** OpenAPI (Swagger)
- **Authentication:** JWT, Role-based access control
- **Queue & Jobs:** BullMQ (Redis-backed)
- **Validation:** class-validator, class-transformer
- **Containerization:** Docker
- **Testing:** Vitest, Supertest, Testcontainers
- **Linting & Formatting:** oxlint (type-aware), oxfmt


## Project Structure 📁

```text
api/
├── src/                # Main source code (controllers, services, modules, etc.)
├── db/                 # Database configuration and migrations
├── generated/          # Generated schemas and sources
├── resources/          # Static and schema resources
├── scripts/            # Utility scripts
├── package.json
├── nest-cli.json
└── README.md
```


## Getting Started 🏁

### Prerequisites

- Node.js 22.12+ (NestJS 12 requires it)
- npm or yarn
- PostgreSQL (or your configured database)
- Redis (for queues and background jobs)
- Docker (the integration and e2e tests start throwaway Postgres and Redis containers)

### Setup & Development

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and configure your environment variables.

3. Run database migrations (if required):

   ```sh
   npm run db:migration-run
   ```

4. Start the development server:

   ```sh
   npm run start:dev
   ```


## Testing 🧪

| Command | What it runs |
| --- | --- |
| `npm test` | Unit tests (`src/**/*.spec.ts`) |
| `npm run test:integration` | Integration tests (`test/integration`): services against a real database |
| `npm run test:e2e` | End-to-end tests (`test/e2e`): the full HTTP API via Supertest |
| `npm run test:all` | All three, in that order |
| `npm run test:cov` | Unit tests with coverage |

The integration and e2e suites need Docker. Each run starts one `postgres:18` and one `redis:7` container with [Testcontainers](https://testcontainers.com/), applies the real migrations, and boots the app exactly as `main.ts` does (see `src/app.setup.ts`). Most tests run inside a transaction that is rolled back afterwards (`test/support/transaction.ts`), so they don't leak data into each other. Shared helpers live in `test/support/`.


## Linting & Formatting 🧹

```sh
npm run lint          # oxlint with type-aware rules, applies safe fixes
npm run format        # oxfmt over src/ and test/
npm run format:check  # report unformatted files without writing
```

## Contributing 🤝

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.