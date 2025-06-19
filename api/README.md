# Cliq API 🚀

This package contains the backend API for the Cliq platform, providing all core business logic, authentication, and data management for affiliate and promoter operations. The API is built with scalability, security, and extensibility in mind.


## Tech Stack 🛠️

- **Framework:** NestJS (Node.js)
- **Language:** TypeScript
- **Database:** PostgreSQL (configurable)
- **ORM:** TypeORM
- **API Documentation:** OpenAPI (Swagger)
- **Authentication:** JWT, Role-based access control
- **Queue & Jobs:** BullMQ (Redis-backed)
- **Validation:** class-validator, class-transformer
- **Containerization:** Docker


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

- Node.js (v18+ recommended)
- npm or yarn
- PostgreSQL (or your configured database)
- Redis (for queues and background jobs)

### Setup & Development

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and configure your environment variables.

3. Run database migrations (if required):

   ```sh
   npm run migration:run
   ```

4. Start the development server:

   ```sh
   npm run start:dev
   ```


## Contributing 🤝

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.