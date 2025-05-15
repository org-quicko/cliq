# Cliq Frontend ✨

This package contains the frontend applications for the Cliq platform, including the Promoter Portal and shared Angular libraries. It is designed to provide a modern, responsive, and maintainable user interface for promoters and other stakeholders.



## Tech Stack 🛠️

- **Framework:** Angular 19
- **Language:** TypeScript
- **UI Library:** Angular Material
- **Styling:** Tailwind CSS, SCSS
- **State Management:** NgRx (Store, Effects, Signals, Component Store)
- **Authentication:** JWT (via @auth0/angular-jwt)
- **Utilities:** Lodash, Moment.js, ngx-cookie-service, ngx-avatars
- **Form Validation:** @rxweb/reactive-form-validators
- **Monorepo:** Managed via Angular CLI workspaces



## Project Structure 📁

```text
frontend/
├── projects/
│   ├── promoter-portal/      # Main promoter-facing Angular app
│   ├── admin-portal/         
│   └── org-quicko-cliq-core/ # Shared Angular library
├── resources/                # Static and schema resources
├── package.json
├── angular.json
└── README.md
```



## Getting Started 🏁

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- Redis (for caching, queues, and background jobs)

### Setup & Development

1. Install dependencies:

   ```sh
   npm install
   ```

2. To run the Promoter Portal in development mode:

   ```sh
   npm run start:promoter-portal
   ```

3. To build the shared core library:

   ```sh
   npm run build:core-lib
   ```



## Contributing 🤝

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.
