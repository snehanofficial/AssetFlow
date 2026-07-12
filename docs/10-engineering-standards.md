# AssetFlow — Engineering Standards

This document establishes the official engineering standards, quality guidelines, Git workflows, and coding rules for the **AssetFlow** platform. Every code change must conform to these definitions.

---

## 1. Coding Standards (JavaScript & React)

### 1.1 Core JavaScript Style Guidelines
* **Clean Code Fundamentals**: Functions must be small, focused, and enforce a Single Responsibility.
* **Early Returns**: Code must favor early returns to avoid deep nesting of conditional blocks:
  ```javascript
  // Bad Practice
  async function returnAsset(req, res) {
    const allocation = await repo.find(req.params.id);
    if (allocation) {
      if (!allocation.returnedAt) {
        // Nested logic...
      } else {
        res.status(400).send('Already returned');
      }
    } else {
      res.status(404).send('Not found');
    }
  }

  // Approved Standard
  async function returnAsset(req, res) {
    const allocation = await repo.find(req.params.id);
    if (!allocation) return res.status(404).json(errorEnvelope('ALLOCATION_NOT_FOUND'));
    if (allocation.returnedAt) return res.status(400).json(errorEnvelope('ALREADY_RETURNED'));

    // Linear logic...
  }
  ```
* **Asynchronous Flow Control**: Use `async/await` exclusively. The use of raw `.then().catch()` chains is prohibited.
* **No Magic Strings or Numbers**: Move config numbers (like session timeouts or default page limits) and action status strings to shared constants.

### 1.2 Frontend Coding Rules
* **Functional React Components**: Components must be structured as functional components utilizing React Hooks. Class components are prohibited.
* **Prop Destructuring**: Always destructure props in the component arguments signature.
* **React State Segregation**: Server state must reside in TanStack Query. Local UI state must not duplicate server data.

---

## 2. Validation Standards

* **Zod as the Single Source of Truth**: All payloads (form submissions on the client, request parameters and bodies on the server) must be verified using Zod schemas.
* **Zod Schema Locations**: Define schemas in a feature's validation file (e.g. `features/assets/asset.validation.js`).
* **Input Sanitization**: Parse all input data through the Zod schema before processing:
  ```javascript
  const schema = z.object({
    name: z.string().trim().min(2),
    expectedReturnDate: z.string().datetime()
  });

  const parsedData = schema.parse(req.body); // Automatically strips unregistered parameters
  ```

---

## 3. API & Response Standards

* **Consistent Envelopes**: All routes must return the success or error envelopes defined in `docs/04-api-specification.md`.
* **Correct HTTP Status Codes**:
  * `200 OK`: Successful resource fetches and state edits.
  * `201 Created`: Successful creation of new entities.
  * `400 Bad Request`: Payload validation failures (Zod failures).
  * `401 Unauthorized`: Missing or expired authentication JWT.
  * `403 Forbidden`: Insufficient RBAC privileges or account deactivation blocks.
  * `404 Not Found`: Target entity not found in database.
  * `409 Conflict`: Business rule invariant check failures (e.g. double-allocation, overlap booking).
  * `500 Internal Server Error`: Unexpected runtime database or logic failures.

---

## 4. Import & Naming Conventions

* **CamelCase File Naming**: Files must use naming standards matching their classification (PascalCase for React components, camelCase for controllers/services/repos/hooks).
* **Organized Import Blocks**: Group and order imports in client files:
  1. React core hooks and libraries.
  2. Third-party NPM packages (e.g. Lucide icons, TanStack Query).
  3. Shared UI elements (`components/ui/*`).
  4. Local feature-specific components.
  5. Shared hooks, utils, or constants.
  6. CSS layout stylesheets.

---

## 5. Git Workflow & Branch Strategy

We use a lightweight Git feature branch strategy optimized to prevent merge conflicts during the 8-hour hackathon.

```
Main (Production staging)
  ▲
  │ (Pull Request after validation)
Develop (Integration build)
  ▲
  ├── feature/auth-and-org (Dev 1)
  └── feature/booking-calendar (Dev 2)
```

### 5.1 Branching Rules
1. **No direct commits to `main` or `develop`**: All additions must originate from a feature branch (e.g. `feature/assets-registry`).
2. **Frequency**: Pull from `develop` and merge locally at least once every 2 hours to detect integration conflicts early.
3. **Branch Split Rule**: Features must be partitioned based on Folder Ownership (Section 5, `docs/09-project-structure.md`).

### 5.2 Conventional Commits Standards
Every commit message must follow the Conventional Commits specification:
* `feat(scope)`: A new feature code implementation (e.g., `feat(assets): add category schema builder`).
* `fix(scope)`: A bug resolution (e.g., `fix(booking): resolve overlap validation query bounds`).
* `docs(scope)`: Modifying documentation files (e.g., `docs(api): update return route envelope`).
* `style(scope)`: CSS layout changes or formatting (e.g., `style(ui): fix sidebar alignment on mobile`).
* `refactor(scope)`: Modifying logic without introducing features or fixing bugs (e.g., `refactor(auth): simplify JWT expiration helper`).

---

## 6. Pull Request & Code Review Checklist

Before merging any pull request into `develop`, the developer must verify that:

- [ ] The codebase builds cleanly without any syntax or linter warnings.
- [ ] Direct database changes are backed by a transactional Prisma migration.
- [ ] Route controllers enforce input validation using Zod.
- [ ] Endpoints verify access clearances using `authenticateSession` and `authorizeRoles`.
- [ ] The client UI handles empty, loading, success, and error states gracefully.
- [ ] The change has been manually tested using the roles matrix.

---

## 7. Definition of Ready & Definition of Done

### 7.1 Definition of Ready (DoR)
A task is ready for developer implementation only if:
1. All functional requirements are documented in `00-project-plan.md` or `01-business-rules.md`.
2. The database schema has columns corresponding to the domain model entities.
3. Target API endpoint routes and JSON structures are defined.
4. UI screens have clear responsive wireframe layouts and interactive requirements.

### 7.2 Definition of Done (DoD)
A feature is complete and ready for production deployment only if:
1. Core business invariants and validation constraints are fully implemented.
2. RBAC access security middleware layers are locked.
3. API documentation matches the code implementation.
4. Responsive layout views render correctly on mobile, tablet, and desktop viewports.
5. All interactive modal focus locks and keyboard traversal traps behave correctly.
6. The database matches 3NF structures with correct unique partial indexes.
7. Zero dead code, console logs, or mock placeholder UI remain.

---

## 8. AI-Augmented Development Rules

When coding assistants (AI agents) modify the workspace, they must enforce the following behaviors:

1. **Understand Business Context First**: Read domain rules (`docs/01-business-rules.md`, `docs/02-domain-model.md`) before writing features. Reject requests that bypass or break rules.
2. **No TypeScript Code**: Ensure all client and server files use plain JavaScript. Never generate TypeScript interfaces, types, or transpile settings.
3. **Preserve Documentation**: Do not edit unrelated files, comments, or documentation files unless explicitly requested.
4. **Enforce Clean Relational Boundaries**: Ensure feature modules interact through services rather than direct database accesses across contexts.
5. **No Code Duplication**: Look for existing elements in `components/ui` or `utils` before creating new styling definitions.
