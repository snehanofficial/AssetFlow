# AssetFlow

Enterprise Asset & Resource Management Platform

AssetFlow digitizes the complete lifecycle of organizational assets and shared resources through a centralized ERP platform. Built as a decoupled client-server architecture with a React 19 Frontend and Node/Express Backend.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18 or later
- **Docker & Docker Compose**: For local PostgreSQL database containerization

### 2. Local Database Orchestration
Start the PostgreSQL 16 container:
```bash
docker-compose up -d
```
The database port is mapped to `5432` with credentials:
- **DB Name**: `assetflow`
- **Username**: `postgres`
- **Password**: `postgres`

### 3. Server Setup
Navigate to the `server/` directory, set up your configuration, and start development:
```bash
cd server
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

### 4. Client Setup
Navigate to the `client/` directory, set up configurations, and start the Vite server:
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

---

## 📁 Repository Structure
```
AssetFlow/
├── client/                # React 19 Client App (Vite)
│   ├── src/
│   │   ├── components/    # Reusable shared components (ui, common)
│   │   ├── features/      # Feature modules (feature-first)
│   │   ├── hooks/         # Global shared react hooks
│   │   ├── services/      # Universal clients (API fetch clients)
│   │   ├── styles/        # CSS theme tokens & styles (index.css)
│   │   └── App.jsx        # Route configuration & route guards
│
├── server/                # Node.js Express API Server
│   ├── config/            # Environment variable validation (Zod)
│   ├── database/          # Prisma database config, schema, seed
│   ├── features/          # Server feature-first folders
│   ├── middlewares/       # Express global middlewares (auth, rbac, errors)
│   ├── routes/            # Centralized route registry
│   ├── services/          # External services (Storage abstraction)
│   └── uploads/           # Local file storage folders
│
├── docs/                  # System design specifications
├── scripts/               # Automation scripts
└── docker-compose.yml     # Database container definition
```

---

## 🛠️ Engineering Standards

- **Feature-First Architecture**: Group code by business modules (`features/auth`, `features/assets`, etc.) rather than technical layers.
- **Service-Repository Pattern**: Enforce separation of concerns on the server. Controllers route inputs, Services manage business rules, and Repositories run database operations.
- **Strict Database Invariants**: Guard against invalid states with database check constraints and partial unique indexes.
- **JWT & HTTP-Only Cookies**: Secure authentication using rotated refresh tokens in HTTP-Only cookies.

