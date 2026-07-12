# AssetFlow — Project Structure Specification

This document defines the complete directory tree layout, file naming conventions, module locations, configuration files, and ownership rules for the **AssetFlow** repository.

---

## 1. Directory Tree Map

The repository follows a clean separation between the frontend application, the backend API server, and structural resources.

```
AssetFlow/
├── .gemini/               # App Agent configurations
├── .git/                  # Git repository metadata
├── client/                # React 19 Client App (Vite)
│   ├── public/            # Static assets (logos, icons)
│   ├── src/
│   │   ├── assets/        # Global images and styling overrides
│   │   ├── components/    # Reusable shared components
│   │   │   ├── ui/        # Atomic elements (buttons, inputs, cards)
│   │   │   └── common/    # Structural wrappers (Sidebar, GlobalHeader)
│   │   ├── features/      # Feature modules (feature-first structure)
│   │   │   ├── auth/      # Sign-in, sign-up views, auth hooks
│   │   │   ├── admin/     # Admin configurations, trees, user directories
│   │   │   ├── assets/    # Asset listings, detail timeline views
│   │   │   ├── allocation/# Custody management, return forms, transfers
│   │   │   ├── booking/   # Reservation schedules calendar views
│   │   │   ├── maintenance/# Ticket kanban boards, repair forms
│   │   │   ├── audit/     # Active audit checklists, progress cards
│   │   │   └── reports/   # KPI metrics, Recharts wrappers, export triggers
│   │   ├── hooks/         # Global shared react hooks
│   │   ├── services/      # Universal clients (API fetch clients)
│   │   ├── styles/        # Global CSS stylesheet rules
│   │   │   └── index.css  # CSS custom utility variables
│   │   ├── utils/         # Helper utilities (date formatters, tags)
│   │   ├── App.jsx        # Routing configuration tree & route guards
│   │   └── main.jsx       # Client entry mounting
│   ├── .env.example       # Example client environmental variables
│   ├── index.html         # HTML entry blueprint
│   ├── package.json       # Frontend dependencies configuration
│   └── vite.config.js     # Vite configuration
│
├── server/                # Node.js Express API Server
│   ├── config/            # System environment loaders and verifiers
│   │   └── environment.js # Zod environmental parser
│   ├── database/          # Prisma database config client
│   │   ├── schema.prisma  # Database models & relationships
│   │   ├── client.js      # Global PrismaClient instantiator
│   │   ├── seed.js        # PostgreSQL database seed script
│   │   └── migrations/    # SQL migration records folder
│   ├── features/          # Server feature-first folders
│   │   ├── auth/          # Router, controllers, services, repositories
│   │   ├── admin/         # Hierarchy traversers, deactivation validations
│   │   ├── assets/        # Auto-tag monotonic loops, metadata checkers
│   │   ├── allocation/    # Concurrency lockers, custody handlers
│   │   ├── booking/       # Overlap queries, calendar managers
│   │   ├── maintenance/   # Technician schedulers, status trackers
│   │   ├── audit/         # Audit scoped setup, cycle closers
│   │   ├── reports/       # Aggregate analytics queries
│   │   └── notifications/ # Event dispatcher, unread controllers
│   ├── middlewares/       # Express global middlewares
│   │   ├── auth.middleware.js       # Session JWT verifiers
│   │   ├── authorization.middleware.js # RBAC gatekeepers
│   │   ├── error.middleware.js      # Global error mapper
│   │   └── logging.middleware.js    # Mutation database logger
│   ├── services/          # External API wrappers
│   │   ├── storage/       # File upload drivers (local / Cloudinary)
│   │   └── events/        # In-process event emitter
│   ├── uploads/           # Local file storage (development uploads)
│   ├── .env.example       # Example server environmental configurations
│   ├── Dockerfile         # Server containerization file
│   ├── app.js             # Express app instance and routing hooks
│   ├── package.json       # Backend dependencies configuration
│   └── server.js          # Server port listener entry point
│
├── docs/                  # System documentation blueprints
├── scripts/               # Automation scripts (database checkers)
├── .gitignore             # Git ignore definitions
├── docker-compose.yml     # Local database PostgreSQL container orchestrator
└── README.md              # Project quick-start instructions
```

---

## 2. File Naming Conventions

Strict file naming conventions are enforced across frontend and backend directories:

### 2.1 Frontend Conventions
* **React Components**: PascalCase with `.jsx` extension (e.g. `Button.jsx`, `AssetForm.jsx`, `Sidebar.jsx`).
* **Custom React Hooks**: camelCase starting with `use` prefix (e.g. `useAuth.js`, `useAssetDetails.js`).
* **Shared Utilities / Style Helpers**: camelCase (e.g. `cn.js`, `dateFormatter.js`).
* **CSS Files**: lowercase (e.g. `index.css`).

### 2.2 Backend Conventions
* **Express Routers**: `[feature].routes.js` (e.g. `asset.routes.js`).
* **Controllers**: `[feature].controller.js` (e.g. `asset.controller.js`).
* **Services**: `[feature].service.js` (e.g. `asset.service.js`).
* **Repositories**: `[feature].repository.js` (e.g. `asset.repository.js`).
* **Zod Validation Schemas**: `[feature].validation.js` (e.g. `asset.validation.js`).
* **Middlewares**: `[action].middleware.js` (e.g. `auth.middleware.js`, `error.middleware.js`).

---

## 3. Environment Variable Specifications

### 3.1 Server Environment (`server/.env`)
```ini
PORT=5000
NODE_ENV=development # development | production | test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/assetflow?schema=public
JWT_ACCESS_SECRET=supersecretlongstringkeyforaccesstokens32chars
JWT_REFRESH_SECRET=supersecretlongstringkeyforrefreshtokens32chars
# (Optional) production variables
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

### 3.2 Client Environment (`client/.env`)
```ini
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 4. Docker & Local PostgreSQL Orchestration

To avoid local database environment drift, a standardized `docker-compose.yml` launches a containerized PostgreSQL 16 server in the workspace root.

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: assetflow-db
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: assetflow
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
    driver: local
```

* **Command to run db container**:
  ```bash
  docker-compose up -d
  ```

---

## 5. Folder Ownership Rules

To minimize Git merge conflicts during the 8-hour hackathon, folder directories are partitioned with strict ownership boundaries.

| Directory Path / Module | Primary Owner | Reviewer / Collaborator |
|---|---|---|
| `client/src/components/ui/` | **Developer 2** | Developer 1 (Uses UI elements) |
| `client/src/features/auth/` & `server/features/auth/` | **Developer 1** | Developer 2 |
| `client/src/features/admin/` & `server/features/admin/` | **Developer 1** | Developer 2 |
| `client/src/features/assets/` & `server/features/assets/` | **Developer 1** | Developer 2 |
| `client/src/features/allocation/` & `server/features/allocation/` | **Developer 1** | Developer 2 |
| `client/src/features/booking/` & `server/features/booking/` | **Developer 2** | Developer 1 |
| `client/src/features/maintenance/` & `server/features/maintenance/` | **Developer 2** | Developer 1 |
| `client/src/features/audit/` & `server/features/audit/` | **Developer 2** | Developer 1 |
| `client/src/features/reports/` & `server/features/reports/` | **Developer 2** | Developer 1 |
| `client/src/features/notifications/` & `server/features/notifications/` | **Developer 2** | Developer 1 |
| `server/database/` (Prisma migrations) | **Developer 1** | Developer 2 (Must coordinate changes) |
| `client/src/styles/index.css` | **Developer 2** | Developer 1 |

### 5.1 Shared Integrity Rules
1. **No Shared Editing without Approval**: Developers must not modify files owned by the other developer unless discussed and approved.
2. **Prisma Schema Coordination**: Changes to `server/database/schema.prisma` must be defined collectively. Developer 1 executes the migrations, runs the Prisma client generator, and pushes the changes, after which Developer 2 pulls and updates their client.
3. **Common Folder Rules**: Shared utilities (`client/src/utils/`, `server/middlewares/`) are common properties. Small edits are permitted, but major refactoring is blocked.
