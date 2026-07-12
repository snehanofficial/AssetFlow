# AssetFlow — Hackathon Implementation Plan

This document outlines the step-by-step development strategy, critical paths, task divisions, and timeline configurations for a **2-Developer Team** implementing AssetFlow during an **8-Hour Hackathon**.

---

## 1. MVP Definition & Priority Matrix

To guarantee a fully working demo by Hour 8, development focuses strictly on core ERP workflows. Stretch goals are isolated from the critical path.

```
┌────────────────────────────────────────────────────────┐
│                        CORE MVP                        │
│  - JWT Cookie Authentication                           │
│  - Department Tree & Category JSONB Schemas            │
│  - Asset Tag Monotonic Registration                    │
│  - Overlap-Free Shared Resource Booking                │
│  - Double-Allocation Blocked Custody                   │
│  - Maintenance Ticket Status Kanban                    │
│  - Active Audit Checklist & Discrepancy Resolution     │
│  - Responsive Navigation Dashboard Layout               │
└────────────────────────────────────────────────────────┘
```

### 1.1 Priority Matrix

| Core Modules (Priority 1 - Hours 1-4) | Operational Workflows (Priority 2 - Hours 4-6.5) | Polish & Analytics (Priority 3 - Hours 6.5-8) |
|---|---|---|
| JWT Auth Sign-in / Sign-up | Double-Allocation Custody Setup | Dashboard KPI Calculations |
| Local Database Docker Setup | Return Modal Condition Logging | Recharts Utilization Visualization |
| Department Cyclic Verifier | Transfer Request Workflow | CSV Data Export Streams |
| Monotonic Tag Sequence (`AF-XXXX`) | Booking Overlap Database Transaction | Real-Time Notification Indicators |
| Category Schema validation (JSONB) | Trello Maintenance Columns Triage | Audit Cycle History Timeline Logs |
| Tailwind v4 CSS configuration | Auditor Scoped Checklist Actions | Dark/Light Mode Theme Switcher |

---

## 2. Parallel Developer Split & Module Ownership

Developer ownership is divided to minimize code overlaps and eliminate merge conflicts.

```
┌────────────────────────────────────────────────────────┐
│                      Developer 1                       │
│  - Core DB Models & Local Docker DB Config             │
│  - Auth, Admin, Assets & Allocation Features           │
│  - Sequential Tag Loop & JSONB Schema Validators       │
│  - Return Asset Condition and Transfer Handover       │
└────────────────────────────────────────────────────────┘
                           │
                           ├─► Parallel Integration via Pull Requests
                           │
┌────────────────────────────────────────────────────────┐
│                      Developer 2                       │
│  - Tailwind v4 Themes & Reusable Common UI Setup       │
│  - Bookings, Maintenance, Audit & Reports Features     │
│  - Database Overlap Transactions Locker                │
│  - Kanban Boards & Discrepancy Actions Modal           │
└────────────────────────────────────────────────────────┘
```

### 2.1 File & API Ownership Map

| Task Domain | Developer 1 (Core & Custody) | Developer 2 (Operations & Analytics) |
|---|---|---|
| **Database** | schema.prisma, Seed data script, docker-compose.yml | Transaction Query Overlap Helpers |
| **Styling & UI** | Form Layouts matching schemas | index.css theme variables, components/ui/* |
| **Auth Module** | auth.routes.js, auth.service.js, Signup/Login forms | Private routes wrappers |
| **Admin Module** | employee.routes.js, dept.routes.js, category.routes.js | Schema builder UI elements |
| **Asset Directory**| asset.routes.js, asset.service.js, tag generation | History timeline log list view |
| **Custody & Transfers**| allocation.routes.js, transfer.routes.js, Return Form | Transfer inbox UI grid |
| **Resource Planner**| Booking model relations | booking.routes.js, overlap transactions, Scheduler Calendar |
| **Maintenance** | Maintenance model relation | maintenance.routes.js, Kanban board columns, resolution forms |
| **Compliance Audits**| Audit Cycle database model relations | audit.routes.js, Audit Checklist views, Discrepancy inbox |
| **Analytics & Logs**| Audit log middleware hook | reports.routes.js, KPI card calculations, Recharts wrappers |
| **Notifications** | Triggering service hooks | notification.routes.js, user alert list drop-down |

---

## 3. Hour-by-Hour Execution Timeline

```
Hour 0     Hour 1     Hour 2     Hour 3     Hour 4     Hour 5     Hour 6     Hour 7     Hour 8
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│  Setup   │   Auth   │  Assets  │ Custody  │ Bookings │ Repairs  │ Audits   │ Reports  │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

### Hour 0.0 - Hour 0.5: Workspace & Project Setup
* **Shared Action**: Collective review of database schema and domain business rules.
* **Developer 1**: 
  * Initialize PostgreSQL Docker database (`docker-compose.yml` up).
  * Configure Prisma schema (`schema.prisma`) and generate Prisma Client.
* **Developer 2**: 
  * Configure Tailwind v4 variable mapping in `client/src/styles/index.css`.
  * Set up base layout view template routes (AppLayout, Sidebar, GlobalHeader).

### Hour 0.5 - Hour 1.5: Authentication & Shared Components Setup
* **Developer 1**: 
  * Implement sign-up and login endpoints, password hashing, and JWT cookie handlers.
  * Build frontend Login/Signup screen layouts.
* **Developer 2**:
  * Set up reusable atomic UI components (`Button.jsx`, `Input.jsx`, `Select.jsx`, `Table.jsx`).
  * Integrate React Hook Form validation wrappers.

### Hour 1.5 - Hour 2.5: Organization Settings & Resource Booking Foundations
* **Developer 1**:
  * Build Department database controllers with recursive loops to prevent cyclic hierarchy graphs.
  * Implement Category schema creator (saving dynamic definitions in JSONB).
* **Developer 2**:
  * Build Booking database schema setup.
  * Write the database transaction overlap detection validation logic.

### Hour 2.5 - Hour 4.0: Asset Registry & Booking Calendar Scheduler
* **Developer 1**:
  * Implement Asset registration endpoints (auto-tag loops validating inputs against Category JSON schemas).
  * Build `/assets` lists grid and `/assets/:id` metadata detail layout views.
* **Developer 2**:
  * Build Booking Scheduler Calendar views mapping reserved resource schedules.
  * Connect booking creation forms to overlap database checkers.

### Hour 4.0 - Hour 5.5: Allocations custody, returns, & Maintenance triage
* **Developer 1**:
  * Implement asset allocation routes (protected by partial unique indexes checking double-allocations).
  * Build return modal forms capturing asset condition and check-in notes.
  * Build transfer request workflows.
* **Developer 2**:
  * Implement Maintenance request tickets status pipeline.
  * Build drag-and-drop technician dispatch Kanban dashboard views.

### Hour 5.5 - Hour 6.5: Audits campaigns & notifications feeds
* **Developer 1**:
  * Build universal event emitter listener loops.
  * Wire up the database audit logging mutation middleware hook.
* **Developer 2**:
  * Implement Audit cycles creation and Auditor checklist generation.
  * Build execution pages (Verify/Missing/Damaged buttons).
  * Implement audit closure discrepancy updates (missing assets transition to `LOST`).

### Hour 6.5 - Hour 7.5: Analytics dashboards & integration testing
* **Developer 1**:
  * Execute integration testing runs across endpoints.
  * Manually run the RBAC verification check lists.
* **Developer 2**:
  * Implement reports metric aggregation routes.
  * Build Dashboard analytics cards and Recharts charts widgets.
  * Build notifications drop-down feeds.

### Hour 7.5 - Hour 8.0: Staging builds & Cloud Deployments
* **Shared Action**:
  * Execute staging client builds (`npm run build`).
  * Run database seeds on Neon PostgreSQL.
  * Deploy backend node server to Render, and React client static bundle to Vercel.
  * Run final live role-testing walkthrough checks.

---

## 4. Testing Gates & Integration Checklist

Each module merge from feature branches into `develop` must clear three testing gates:

1. **Schema Validation Gate**: Ensure migrations have run cleanly, the local database container is synchronized, and the seed script completes without errors.
2. **Access Control (RBAC) Gate**: Verify that routes reject requests without a valid session token (401), and block standard employees from hitting manager/admin actions (403).
3. **Data Integrity Gate**: Verify that double-allocation, overlap booking, cyclical department trees, and audit lockout updates are blocked.

---

## 5. Deployment Procedures

1. **Local verification**: Clean build run on client (`npm run build`) and database checks on server.
2. **Neon DB Setup**: Create a production PostgreSQL instance on Neon. Run Prisma migration commands target URL:
   ```bash
   npx prisma db push --accept-data-loss # For fast hackathon db sync, or migrations deploy
   node server/database/seed.js
   ```
3. **Render Deployment**: Link backend repository to Render. Set environment config values. Verify port mappings.
4. **Vercel Deployment**: Link client repository to Vercel. Set `VITE_API_URL` targeting Render server url. Verify live build outputs.

---

## 6. Risk Mitigation Strategies

* **Issue 1: Slow Render spins on cold starts**:
  * *Impact*: Live demo feels sluggish.
  * *Mitigation*: Ping the Render URL 10 minutes before the demo to warm up the instance.
* **Issue 2: Calendar views taking too long to design**:
  * *Impact*: Developer 2 falls behind.
  * *Mitigation*: Fall back to a simplified list scheduler view mapping bookings by day/hour columns instead of full monthly interactive grids.
* **Issue 3: Deployments fail at the final hour**:
  * *Impact*: Live demo broken.
  * *Mitigation*: Ensure staging builds are run locally by Hour 6. Have the local PostgreSQL container running with seed data ready as a fallback demo backup.
