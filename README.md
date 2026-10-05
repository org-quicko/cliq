# Cliq 🚀

Cliq is a self-hosted affiliate software solution designed for startups. It enables organizations to manage, track, and optimize their affiliate and promoter programs with ease. The platform provides robust APIs, a modern promoter portal, and is built with scalability and maintainability in mind.


## Table of Contents 📚

- [Cliq 🚀](#cliq-)
  - [Table of Contents 📚](#table-of-contents-)
  - [Features ✨](#features-)
  - [Tech Stack 🛠️](#tech-stack-️)
    - [Backend (API) ⚙️](#backend-api-️)
    - [Frontend (Promoter Portal) 💻](#frontend-promoter-portal-)
    - [Common 🌐](#common-)
  - [Project Structure 🗂️](#project-structure-️)
  - [Resources 📦](#resources-)
  - [Getting Started 🏁](#getting-started-)
    - [Prerequisites 📦](#prerequisites-)
    - [Backend (API) ⚙️](#backend-api-️-1)
    - [Frontend (Promoter Portal) 💻](#frontend-promoter-portal--1)
    - [Docker 🐳](#docker-)
  - [Contributing 🤝](#contributing-)
  - [Authors](#authors)


## Features ✨

- Affiliate and promoter management
- Referral tracking and commission calculation
- Detailed reporting and analytics
- Secure authentication and authorization
- Responsive, modern UI for promoters
- Extensible API for integrations


## Tech Stack 🛠️

### Backend (API) ⚙️
- **Framework:** [NestJS](https://nestjs.com/) (Node.js)
- **Language:** TypeScript
- **Database:** (Configurable, typically PostgreSQL)
- **ORM:** TypeORM or Prisma (as configured)
- **API Documentation:** OpenAPI (Swagger)
- **Authentication:** JWT, Role-based access control

### Frontend (Promoter Portal) 💻
- **Framework:** [Angular](https://angular.io/)
- **Language:** TypeScript
- **UI Library:** Angular Material
- **Styling:** Tailwind CSS, SCSS (custom themes and overrides)
- **State Management:** Angular Signals, RxJS
- **Build Tooling:** Angular CLI

### Common 🌐
- **Monorepo Management:** Custom folder structure
- **Containerization:** Docker, Docker Compose
- **Linting & Formatting:** oxlint, oxfmt


## Project Structure 🗂️

```text
.  
├── api/                # NestJS backend API
├── frontend/
│   ├── projects/
│   │   └── promoter-portal/   # Angular frontend for promoters
│   └── ...            # Frontend configuration and shared resources
├── lib/
│   └── ...            # Client and core packages
├── resources/         # Static resources
├── docker-compose.*.yml
├── Dockerfile
└── README.md
```


## Resources 📦

The `resources/` directory contains supporting assets for the platform, including:
- Excel templates and data for schema generation
- Postman collection

These resources help with development, testing, and integration workflows.


## Getting Started 🏁

### Prerequisites 📦

- Node.js 22.12+ (NestJS 12 requires it)
- npm or yarn
- Docker (for containerized deployment)
- PostgreSQL (or your configured database)
- Redis (for caching, queues, and background jobs)

### Backend (API) ⚙️

1. Navigate to the `api/` directory.
2. Copy `.env.example` to `.env` and configure your environment variables.
3. Install dependencies:
    ```sh
    npm install
    ```
4. Run the development server:
    ```sh
    npm run start:dev
    ```

### Frontend (Promoter Portal) 💻

1. Navigate to `frontend/`.
2. Copy `.env.example` to `.env` if required and configure.
3. Install dependencies:
    ```sh
    npm install
    ```
4. Run the promoter portal development server:
    ```sh
    npm run start:promoter-portal
    ```

### Docker 🐳

To run the entire stack using Docker Compose:

```sh
docker-compose -f docker-compose.yml up --build
```


## Contributing 🤝

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.

## Authors
- [Quicko Engineering](mailto:developer@quicko.org.in)
- See individual `package.json` files for contributors.
