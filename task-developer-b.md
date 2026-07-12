# AssetFlow – Developer B Task File
## Implementation Contract: Dashboard, Booking, Maintenance, Auditing, Reports & Logs

This document serves as the official implementation contract for Developer B. It contains the exact specifications, business rules, API designs, files expected, and detailed checklists for all tasks owned by Developer B.

---

## 1. Requirement Traceability & Task Index

| Req ID | Screen / Feature | Current Status | Objective |
|---|---|---|---|
| **REQ-ATH-01** | Forgot Password | 🟥 Not Implemented | Create secure token-based password recovery flow (forgot password form, reset email simulation, reset password page). |
| **REQ-DSH-01** | Live KPIs & Dashboard | 🟥 Not Implemented | Render actual counts for Available/Allocated assets, Bookings, Maintenance, Transfers, and overdue return warnings. |
| **REQ-DSH-02** | Dashboard Quick Actions | 🟥 Not Implemented | Provide shortcuts to Register Asset, Book Resource, and Raise Repair. |
| **REQ-BOK-01** | Resource Booking | 🟥 Not Implemented | Calendar-based time-slot booking for bookable assets, supporting cancel/reschedule and booking states. |
| **REQ-BOK-02** | Overlap Validation | 🟥 Not Implemented | Build overlap validation blocking double bookings, allowing adjacent bookings. |
| **REQ-MNT-01** | Maintenance Workflow | 🟥 Not Implemented | Build full routing flow from request to technician assignment to repair completion and status updates. |
| **REQ-MNT-02** | Maintenance Logs UI | 🟥 Not Implemented | Display maintenance history per asset inside asset details. |
| **REQ-AUD-01** | Audit Cycle Management | 🟥 Not Implemented | Scope audit cycles by department/location, assign auditors, and mark asset verification statuses. |
| **REQ-AUD-02** | Audit Closure & Report | 🟥 Not Implemented | Generate discrepancy reports, lock cycle, and cascade asset statuses on close (Missing -> Lost, Damaged -> Repair). |
| **REQ-REP-01** | Reports & Exports | 🟥 Not Implemented | Show utilization trends, booking heatmaps, allocation reports, and export to CSV/PDF/Excel. |
| **REQ-NTF-01** | Notification Feed | 🟥 Not Implemented | bell notification feed in sidebar/nav, tracking read/unread, triggered on key events. |
| **REQ-LOG-01** | Activity Logs UI | 🟨 Partially Implemented | View detailed database mutations log inside System Administration. |

---

## 2. Requirement Details & Implementation Specs

### REQ-ATH-01: Forgot Password / Password Recovery
- **Requirement ID**: REQ-ATH-01
- **Specification Reference**: Screen 1 (Login / Signup)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Implement a secure mechanism for users to reset forgotten passwords.
- **Actors**: `EMPLOYEE`, `DEPT_HEAD`, `ASSET_MANAGER`, `ADMIN`
- **Dependencies**: `PasswordResetToken` database model.
- **Preconditions**: User has an existing active account.
- **Workflow**:
  1. User clicks "Forgot Password" link on login screen.
  2. User enters email address.
  3. System verifies email, generates a unique, cryptographically secure reset token expiring in 1 hour.
  4. Token is saved in `PasswordResetToken` table and returned or logged to console (simulating email delivery).
  5. User navigates to recovery URL: `/reset-password?token=XYZ`.
  6. User inputs new password. System validates token, hashes new password, updates employee record, and revokes active tokens.
- **Business Rules**:
  - Tokens expire exactly after 1 hour.
  - Reset tokens must be revoked instantly upon use.
- **Validation Rules**:
  - New password must meet strength criteria (8 chars, 1 number, 1 special char).
- **Edge Cases**:
  - Submitting an expired token blocks password reset and requests a new request.
- **Backend Tasks**:
  - Build `POST /api/v1/auth/forgot-password` (verify email, generate token).
  - Build `POST /api/v1/auth/reset-password` (verify token, update password, revoke token).
- **Frontend Tasks**:
  - Create Forgot Password component route.
  - Create Reset Password page layout checking token query parameter.
- **Database Changes**: Add `PasswordResetToken` model (Already added to `schema.prisma`).
- **API Changes**:
  - `POST /api/v1/auth/forgot-password` -> `{ email }`
  - `POST /api/v1/auth/reset-password` -> `{ token, password }`
- **Files Expected**:
  - `server/features/auth/forgot.service.js`
  - `client/src/features/auth/ForgotPassword.jsx`
  - `client/src/features/auth/ResetPassword.jsx`

---

### REQ-DSH-01: Live KPIs & Dashboard
- **Requirement ID**: REQ-DSH-01
- **Specification Reference**: Screen 2 (Dashboard)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Display real-time KPI metrics and warning alerts to users upon landing.
- **Actors**: All roles (Department/Employee context filters).
- **Dependencies**: Assets, Allocations, Bookings, Maintenance models.
- **Preconditions**: User is logged in.
- **Workflow**:
  1. Landing on `/dashboard` triggers fetching of metrics.
  2. System calculates live counts:
     - Available Assets, Allocated Assets.
     - Active bookings today, Scheduled repairs today.
     - Overdue Returns (Expected return date passed, Status = ACTIVE).
  3. UI displays counters in elegant, modern cards.
- **Business Rules**:
  - Employees only see counts relevant to them (their allocations, upcoming bookings).
  - Managers see organization-wide counts.
  - Overdue Returns must trigger red indicator alert panels.
- **Validation Rules**: None.
- **Edge Cases**:
  - Handling zeros gracefully with appropriate descriptions.
- **Backend Tasks**:
  - Create `GET /api/v1/dashboard/metrics` querying database counts based on user role.
- **Frontend Tasks**:
  - Implement dynamic KPI cards in `Dashboard.jsx`.
  - Implement Overdue Returns grid panel.
- **Database Changes**: None.
- **API Changes**:
  - `GET /api/v1/dashboard/metrics`
    - Response: `{ success: true, data: { available, allocated, maintenanceToday, activeBookings, pendingTransfers, upcomingReturns, overdueReturns: [] } }`
- **Files Expected**:
  - `server/features/dashboard/dashboard.service.js`
  - `client/src/features/dashboard/Dashboard.jsx` (Replace placeholder)

---

### REQ-DSH-02: Dashboard Quick Actions
- **Requirement ID**: REQ-DSH-02
- **Specification Reference**: Screen 2 (Dashboard Quick Actions)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Provide quick launcher shortcuts depending on roles.
- **Actors**: `ADMIN`, `ASSET_MANAGER`, `DEPT_HEAD`, `EMPLOYEE`
- **Dependencies**: Frontend routing modals.
- **Preconditions**: User session active.
- **Workflow**:
  - System checks user role and renders:
    - **Register Asset** (Asset Manager, Admin)
    - **Book Resource** (All roles)
    - **Raise Repair** (All roles)
  - Clicking launches appropriate form modal or routes to feature.
- **Business Rules**:
  - Hide "Register Asset" for non-managers.
- **Validation Rules**: None.
- **Edge Cases**: None.
- **Backend Tasks**: None.
- **Frontend Tasks**:
  - Add "Quick Actions" dashboard panel.
  - Wire up buttons to launch modals or trigger route navigation.
- **Database Changes**: None.
- **API Changes**: None.
- **Files Expected**:
  - `client/src/features/dashboard/components/QuickActions.jsx`

---

### REQ-BOK-01: Resource Booking Calendar
- **Requirement ID**: REQ-BOK-01
- **Specification Reference**: Screen 6 (Resource Booking)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Book shared assets (marked as bookable) on a interactive calendar by date/time slots.
- **Actors**: All logged-in employees.
- **Dependencies**: `Booking`, `Asset` models.
- **Preconditions**: Asset exists and has `isBookable: true`.
- **Workflow**:
  1. User navigates to "/bookings".
  2. Calendar displays active slots for selected resources.
  3. User clicks slot or "Create Booking".
  4. User enters Date, Start Time, End Time, Asset, and notes.
  5. Form submits to `/api/v1/bookings`.
  6. Backend creates booking in `UPCOMING` status.
- **Business Rules**:
  - Non-bookable assets (isBookable = false) cannot be selected.
  - Booking statuses progress: `UPCOMING` -> `ONGOING` -> `COMPLETED` or `CANCELLED`.
- **Validation Rules**:
  - End Time must be greater than Start Time.
  - Duration must be within allowed limits.
- **Edge Cases**:
  - Allowing users to cancel bookings. Cancelling updates status to `CANCELLED` instantly freeing slot.
- **Backend Tasks**:
  - Build endpoints to create, list, cancel, and update bookings.
  - Implement scheduling engine checking resource availability.
- **Frontend Tasks**:
  - Install and style a clean calendar view.
  - Build booking scheduler form modal.
- **Database Changes**: None.
- **API Changes**:
  - `GET /api/v1/bookings` (with resource filters, start/end range)
  - `POST /api/v1/bookings` -> `{ assetId, startDate, endDate, notes }`
  - `DELETE /api/v1/bookings/:id` (cancel booking)
- **Files Expected**:
  - `server/features/booking/booking.validators.js`
  - `server/features/booking/booking.service.js`
  - `client/src/features/booking/BookingCalendar.jsx` (Replace placeholder)

---

### REQ-BOK-02: Time-slot Overlap Validation
- **Requirement ID**: REQ-BOK-02
- **Specification Reference**: Screen 6 (Overlap Prevention)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Prevent two users booking the same resource at overlapping times.
- **Actors**: System
- **Dependencies**: Booking model.
- **Preconditions**: N/A.
- **Workflow**:
  1. Backend receives new booking request `{ assetId, startDate, endDate }`.
  2. System queries existing bookings for `assetId` with statuses in (`UPCOMING`, `ONGOING`).
  3. Backend checks overlap conditional:
     `requestedStart < existingEnd AND requestedEnd > existingStart`
  4. If true, block and return 400 error.
  5. Adjacent slots (ending exactly when another starts) are allowed.
- **Business Rules**: No double bookings.
- **Validation Rules**: None.
- **Edge Cases**:
  - Handling timezone changes safely (use UTC).
- **Backend Tasks**:
  - Implement transaction-isolated overlap validation logic.
- **Frontend Tasks**: None.
- **Database Changes**: None.
- **API Changes**: None.
- **Files Expected**:
  - `server/features/booking/booking.lifecycle.js`

---

### REQ-MNT-01: Maintenance Request & Workflow
- **Requirement ID**: REQ-MNT-01
- **Specification Reference**: Screen 7 (Maintenance Management)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Report asset defects and manage repairs via status workflows.
- **Actors**: `EMPLOYEE` (Raises repair), `ASSET_MANAGER` (Approves & assigns technician), System (Auto-updates asset state).
- **Dependencies**: `MaintenanceRequest`, `Asset` models.
- **Preconditions**: Asset exists.
- **Workflow**:
  1. Holder raises repair request with defect description and priority (Low/Medium/High/Critical).
  2. Asset remains `ALLOCATED` or `AVAILABLE` while request is `PENDING`.
  3. Asset Manager reviews:
     - Approves request, selects technician (active Employee), and schedules date.
     - OR Rejects request (requires reason).
  4. On approval, backend changes Asset status to `UNDER_MAINTENANCE` and request status to `IN_PROGRESS`.
  5. Technician marks repair as `RESOLVED` (requires completion notes).
  6. Asset status changes back to `AVAILABLE`.
- **Business Rules**:
  - Only Asset Managers can approve and assign.
- **Validation Rules**:
  - Request description is required.
- **Edge Cases**:
  - Asset was already retired/lost; block maintenance creation.
- **Backend Tasks**:
  - Build endpoints: `POST /api/v1/maintenance`, `PATCH /api/v1/maintenance/:id/approve`, `PATCH /api/v1/maintenance/:id/resolve`.
- **Frontend Tasks**:
  - Build Kanban board representation of repair statuses (Pending, Approved, In Progress, Resolved).
  - Build repair reporting dialog.
- **Database Changes**: None.
- **API Changes**:
  - `POST /api/v1/maintenance` -> `{ assetId, description, priority }`
  - `PATCH /api/v1/maintenance/:id/approve` -> `{ assignedToId }`
  - `PATCH /api/v1/maintenance/:id/resolve` -> `{ resolutionNotes }`
- **Files Expected**:
  - `server/features/maintenance/maintenance.service.js`
  - `client/src/features/maintenance/MaintenanceKanban.jsx` (Replace placeholder)

---

### REQ-MNT-02: Maintenance History per Asset
- **Requirement ID**: REQ-MNT-02
- **Specification Reference**: Screen 7 (Asset details join)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Record all repairs and display them chronologically inside asset files.
- **Actors**: All managers.
- **Dependencies**: Developer A's Asset Details modal.
- **Preconditions**: Asset detail is open.
- **Workflow**:
  - UI displays a dedicated tab or section in Asset Details mapping past maintenance details (Date, technician, issue, resolution notes).
- **Business Rules**: None.
- **Validation Rules**: None.
- **Edge Cases**: None.
- **Backend Tasks**: Join `MaintenanceRequest` on `GET /api/v1/assets/:id` (Coordinated with Dev A).
- **Frontend Tasks**: Design history table in Asset detail component.
- **Database Changes**: None.
- **API Changes**: None.
- **Files Expected**:
  - `client/src/features/maintenance/components/MaintenanceHistoryTable.jsx`

---

### REQ-AUD-01: Audit Cycle Management
- **Requirement ID**: REQ-AUD-01
- **Specification Reference**: Screen 8 (Asset Audit)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Create physical verification cycles, scope assets (by department/location), assign auditors, and record asset states.
- **Actors**: `ADMIN` (Creates cycle), `EMPLOYEE` (Assigned Auditor)
- **Dependencies**: `AuditCycle`, `AuditItem` models.
- **Preconditions**: Scope contains active assets.
- **Workflow**:
  1. Admin clicks "New Audit Cycle".
  2. Input: Scope (Department or Location), Start Date, End Date, Auditor (Employee ID).
  3. On submit, backend finds all assets matching scope and inserts `AuditItem` records in `PENDING` state. Cycle is set to `IN_PROGRESS`.
  4. Auditor logs in, views assigned cycle, opens sheet.
  5. Auditor marks each item as: `VERIFIED`, `MISSING`, or `DAMAGED` (optional notes).
- **Business Rules**:
  - Scope filter is mandatory.
  - Auditors must be active employees.
- **Validation Rules**: None.
- **Edge Cases**:
  - Handling assets registered *after* the cycle creation (exclude from this current cycle).
- **Backend Tasks**:
  - Build `POST /api/v1/audits` (generate items in transaction).
  - Build `PATCH /api/v1/audits/items/:itemId` (save auditor status).
- **Frontend Tasks**:
  - Build Audit creation panel.
  - Build Auditor checklist view showing scope.
- **Database Changes**: None.
- **API Changes**:
  - `POST /api/v1/audits` -> `{ title, scopeType: 'department'|'location', scopeValue, endDate, auditorIds: [] }`
  - `PATCH /api/v1/audits/items/:id` -> `{ status: 'VERIFIED'|'MISSING'|'DAMAGED', notes? }`
- **Files Expected**:
  - `server/features/audit/audit.service.js`
  - `client/src/features/audit/AuditList.jsx` (Replace placeholder)

---

### REQ-AUD-02: Audit Closure & Discrepancies
- **Requirement ID**: REQ-AUD-02
- **Specification Reference**: Screen 8 (Audit Closure)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Generate discrepancy reports, check verification status, lock cycle, and apply status changes on closure.
- **Actors**: `ADMIN`
- **Dependencies**: AuditCycle, Asset models.
- **Preconditions**: Cycle is `IN_PROGRESS`.
- **Workflow**:
  1. Admin views open cycle sheet.
  2. System shows Discrepancy report detailing:
     - Missing assets (verified state = Missing)
     - Damaged assets (verified state = Damaged)
  3. Admin clicks "Close Cycle".
  4. Backend verifies all assets in scope are audited (none are `PENDING`).
  5. If clean, cycle is locked (`CLOSED` status).
  6. Backend cascades status updates:
     - `MISSING` -> Asset status = `LOST`
     - `DAMAGED` -> Asset status = `UNDER_MAINTENANCE` (or flags repair request).
- **Business Rules**:
  - Cannot close cycle with any `PENDING` items.
  - Closure is irreversible.
- **Validation Rules**: None.
- **Edge Cases**:
  - Attempting to edit an audit item after the cycle is `CLOSED` must fail.
- **Backend Tasks**:
  - Build `POST /api/v1/audits/:id/close` (validate progress, update statuses in transaction).
- **Frontend Tasks**:
  - Build discrepancy summary view.
  - Build validation check block when attempting closure.
- **Database Changes**: None.
- **API Changes**:
  - `POST /api/v1/audits/:id/close` -> Response: `{ success: true }`
- **Files Expected**:
  - `client/src/features/audit/AuditDiscrepancies.jsx`

---

### REQ-REP-01: Reports & Exports
- **Requirement ID**: REQ-REP-01
- **Specification Reference**: Screen 9 (Reports & Analytics)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Show operational charts, utilization percentages, peak bookings, and support downloading raw data.
- **Actors**: `ADMIN`, `ASSET_MANAGER`
- **Dependencies**: Recharts (frontend charts).
- **Preconditions**: Active datasets in DB.
- **Workflow**:
  1. Manager opens "/reports".
  2. UI requests:
     - Utilization Trends (Most active vs idle)
     - Maintenance Frequency
     - Resource Peak Heatmap
  3. Charts render interactively.
  4. User clicks "Export" selecting CSV, PDF, or Excel formats.
- **Business Rules**: None.
- **Validation Rules**: None.
- **Edge Cases**:
  - Exclude deleted items from summary graphs.
- **Backend Tasks**:
  - Build query aggregate endpoints `/api/v1/reports/utilization`, `/api/v1/reports/heatmap`.
  - Implement file format exporter helper.
- **Frontend Tasks**:
  - Design charts layout using `recharts` library.
  - Build exporter download hooks.
- **Database Changes**: None.
- **API Changes**:
  - `GET /api/v1/reports/summary` (with filters)
  - `GET /api/v1/reports/export?format=csv|xlsx`
- **Files Expected**:
  - `server/features/reports/reports.service.js`
  - `client/src/features/reports/AnalyticsDashboard.jsx` (Replace placeholder)

---

### REQ-NTF-01: Notification Feed
- **Requirement ID**: REQ-NTF-01
- **Specification Reference**: Screen 10 (Notifications)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Provide a real-time bell notification inbox tracking events (assignments, overdue, approvals).
- **Actors**: All roles (Personal notifications inbox).
- **Dependencies**: Notifications DB model.
- **Preconditions**: Logged-in session.
- **Workflow**:
  1. Trigger event occurs on backend (e.g. Asset Assigned).
  2. Backend inserts record into `Notification` table.
  3. Sidebar notification widget reflects unread count.
  4. User clicks feed, sees list of events.
  5. User can "Mark as Read".
- **Business Rules**: None.
- **Validation Rules**: None.
- **Edge Cases**:
  - Cap notification list query.
- **Backend Tasks**:
  - Implement generic notification publisher utility.
  - Build endpoint `GET /api/v1/notifications` and `PATCH /api/v1/notifications/:id/read`.
- **Frontend Tasks**:
  - Build navigation bar notification dropdown widget.
  - Build list feed page with read/unread visual indicators.
- **Database Changes**: None.
- **API Changes**:
  - `GET /api/v1/notifications`
  - `PATCH /api/v1/notifications/:id/read`
- **Files Expected**:
  - `server/features/notifications/notification.service.js`
  - `client/src/features/notifications/NotificationFeed.jsx` (Replace placeholder)

---

### REQ-LOG-01: Activity Logs UI
- **Requirement ID**: REQ-LOG-01
- **Specification Reference**: Screen 10 (Activity Logs)
- **Current Status**: 🟨 Partially Implemented (Logging exists, UI missing)
- **Objective**: View administrative audit logs detailing exactly who performed database changes.
- **Actors**: `ADMIN`
- **Dependencies**: `AuditLog` table.
- **Preconditions**: Admin clearance.
- **Workflow**:
  1. Admin opens Settings -> Activity Logs.
  2. UI displays table listing actor, action, table mutated, record ID, old values, new values, timestamp, and IP address.
  3. Admin can search and filter by actor or table name.
- **Business Rules**:
  - Read-only table. No edits or deletions allowed.
- **Validation Rules**: None.
- **Edge Cases**: None.
- **Backend Tasks**:
  - Build `GET /api/v1/admin/audit-logs` query endpoint.
- **Frontend Tasks**:
  - Build audit log table page with raw JSON diff previewers.
- **Database Changes**: None.
- **API Changes**:
  - `GET /api/v1/admin/audit-logs` -> Response: `{ success: true, data: AuditLog[] }`
- **Files Expected**:
  - `client/src/features/admin/ActivityLogs.jsx`

---

## 3. Developer B Tasks & Files Checklist

### Backend - Features Dashboard, Bookings, Maintenance, Audits & Reports
- [ ] Create `server/features/auth/forgot.service.js` (forgot password, reset tokens).
- [ ] Update `server/features/auth/auth.routes.js` to implement forgot-password/reset-password endpoints.
- [ ] Create `server/features/dashboard/dashboard.service.js` querying dashboard counters.
- [ ] Update `server/features/dashboard/dashboard.routes.js` implementing `/api/v1/dashboard/metrics`.
- [ ] Create `server/features/booking/booking.service.js` (booking allocations & overlap validator).
- [ ] Create `server/features/booking/booking.validators.js` (Zod schemas).
- [ ] Update `server/features/booking/booking.routes.js` to implement:
  - `GET /` (list bookings)
  - `POST /` (create booking)
  - `DELETE /:id` (cancel booking)
- [ ] Create `server/features/maintenance/maintenance.service.js` (workflow transitions & assignment).
- [ ] Update `server/features/maintenance/maintenance.routes.js` to implement:
  - `POST /` (raise maintenance)
  - `GET /` (list maintenance requests)
  - `PATCH /:id/approve` (approve & assign technician)
  - `PATCH /:id/resolve` (resolve repair)
- [ ] Create `server/features/audit/audit.service.js` (cycle scoping & verification checklist).
- [ ] Update `server/features/audit/audit.routes.js` to implement:
  - `POST /` (create audit cycle)
  - `GET /` (list audit cycles)
  - `GET /:id/items` (list audit scope items)
  - `PATCH /items/:id` (mark auditor checklist status)
  - `POST /:id/close` (close cycle & cascade statuses)
- [ ] Create `server/features/reports/reports.service.js` (aggregates utilization / heatmap).
- [ ] Update `server/features/reports/reports.routes.js` to implement `/summary` and `/export`.
- [ ] Create `server/features/notifications/notification.service.js` (publish triggers).
- [ ] Update `server/features/notifications/notification.routes.js` to fetch and read notifications.
- [ ] Update `server/features/admin/admin.routes.js` to expose `GET /audit-logs` endpoint.

### Frontend - Dashboard, Calendars, Kanban & Reports Views
- [ ] Implement `client/src/features/auth/ForgotPassword.jsx` and `ResetPassword.jsx`.
- [ ] Implement `client/src/features/dashboard/Dashboard.jsx` (KPI cards, overdue returns panels, charts).
- [ ] Create `client/src/features/dashboard/components/QuickActions.jsx` (Shortcut action button pad).
- [ ] Implement `client/src/features/booking/BookingCalendar.jsx` (Calendar rendering scheduler slots).
- [ ] Implement `client/src/features/maintenance/MaintenanceKanban.jsx` (Kanban columns representing statuses).
- [ ] Create `client/src/features/maintenance/components/MaintenanceHistoryTable.jsx` (Historical repairs grid inside Asset detail).
- [ ] Implement `client/src/features/audit/AuditList.jsx` (Audit management controls and checklist sheets).
- [ ] Create `client/src/features/audit/AuditDiscrepancies.jsx` (Discrepancy summary panel).
- [ ] Implement `client/src/features/reports/AnalyticsDashboard.jsx` (Recharts integration & csv exporters).
- [ ] Implement `client/src/features/notifications/NotificationFeed.jsx` (Bell drawer dropdown feed & unread tracker).
- [ ] Create `client/src/features/admin/ActivityLogs.jsx` (Admin only audit logs database explorer).

---

## 4. Verification & Testing

### Automated Tests Plan
- Execute post-implementation unit integration tests for:
  - Reset password token expiration blocks recovery.
  - Overlap scheduler rejects conflicting bookings on the same resource.
  - Maintenance resolution updates asset status back to `AVAILABLE`.
  - Audit closure blocks if any asset in scope is pending verification.
  - Report data aggregates ignore soft-deleted records.

### Manual Verification
- Request forgot-password token. Use token to update password. Verify login with new credentials.
- Verify dashboard KPIs match database counts accurately.
- Attempt to book Meeting Room A from 10:00 to 11:30. Request booking for the same room from 11:00 to 12:00. Verify the system rejects it. Verify booking for 11:30 to 12:00 works.
- Create an audit cycle for department "Engineering". Verify only assets in that department appear in scope. Mark all verified. Close cycle and verify status changes.
- Click "Export reports" and verify a CSV downloads containing the correct utilization trends data.
- Trigger a repair request and confirm the holding employee receives the appropriate feed notification.

---

## 5. Definition of Done & Out of Scope

### Definition of Done
- All backend routes are validated using Zod and secure session/authorization roles.
- Frontend forms validate inputs before submission using React Hook Form.
- All database operations are transaction-safe where multi-table updates occur.
- Code must pass ESLint and Prettier rules without errors.
- Responsive design: Pages render cleanly on mobile layouts.

### Out of Scope
- Integrating a real SMTP server for password recovery (simulate email delivery via console logging/JSON return in dev mode).
- Real-time WebSockets integration (use HTTP long-polling or Query interval refetching for notifications).
