# AssetFlow — User Interface (UI) Specification

This document defines the frontend layout, design tokens, navigation flow, and screen-by-screen specifications for the **AssetFlow** platform. 

It aligns with the engineering rules in `AGENTS.md` and focuses on delivering a modern, high-fidelity Enterprise SaaS experience (drawing inspiration from linear.app, stripe.com, and vercel.com) instead of a generic Bootstrap admin template.

---

## 1. Global Design System & Theme Tokens

Everything in the UI is bound to semantic tokens. No ad-hoc hex codes, spacing sizes, or radiuses are permitted in the application markup.

### 1.1 Color Palettes

#### Sleek Dark Theme (Default)
*   **Background (Canvas)**: Slate HSL `224 71% 4%` (Deep navy/black)
*   **Surface (Card/Dialog)**: Slate HSL `224 71% 7%` (Slightly lighter dark elevation)
*   **Border (Subtle)**: Slate HSL `220 14.3% 16%`
*   **Text (Primary)**: Zinc HSL `210 20% 98%` (High contrast off-white)
*   **Text (Secondary)**: Zinc HSL `215.4 16.3% 56.9%` (Muted gray)
*   **Brand Primary (Indigo)**: HSL `263.4 70% 50.4%`
*   **Brand Accent**: HSL `262.1 83.3% 57.8%`

#### Soft Light Theme
*   **Background (Canvas)**: HSL `0 0% 100%` (Pure white)
*   **Surface (Card/Dialog)**: Zinc HSL `240 4.8% 95.9%`
*   **Border (Subtle)**: Zinc HSL `240 5.9% 90%`
*   **Text (Primary)**: Zinc HSL `240 10% 3.9%` (Off-black)
*   **Text (Secondary)**: Zinc HSL `240 3.8% 46.1%` (Muted dark gray)

#### Status Indications (Both Themes)
*   **Success (Emerald)**: HSL `142.1 76.2% 36.3%` (Used for: `AVAILABLE`, `APPROVED`, `COMPLETED`, `VERIFIED`, `RECONCILED`)
*   **Warning (Amber)**: HSL `47.9 95.8% 51.2%` (Used for: `RESERVED`, `PENDING`, `ONGOING`, `DAMAGED`)
*   **Destructive/Error (Rose)**: HSL `346.8 77.2% 49.8%` (Used for: `LOST`, `REJECTED`, `CANCELLED`, `DISPOSED`, Overdue Returns)

---

### 1.2 Typography & Spacing
*   **Font Primary**: `Inter, system-ui, sans-serif` (Crisp text rendering)
*   **Font Headings**: `Outfit, system-ui, sans-serif` (Premium branding)
*   **Font Monospace**: `JetBrains Mono, monospace` (For asset tags `AF-XXXX` and log outputs)
*   **Base Spacing Scale**: 4px increment system (`pt-1` = 4px, `pt-2` = 8px, `pt-4` = 16px, `pt-6` = 24px, `pt-8` = 32px)
*   **Elevation & Radius**:
    *   Border Radius: `rounded-lg` (8px) for cards/inputs, `rounded-xl` (12px) for dialog containers.
    *   Shadows: Flat UI border-styling for dark theme; subtle soft-ambient shadows for light theme.

---

## 2. Dashboard Information Architecture & Layout Grid

The workspace uses a persistent layout structure consisting of a **Sleek Sidebar Navigation**, a **Global Header**, and a **Main Workspace Canvas**.

```
┌────────────────────────────────────────────────────────────────────────┐
│  Sidebar     │ Global Header: Breadcrumbs / search (Cmd+K) / Actions   │
│  Logo        ├─────────────────────────────────────────────────────────┤
│              │                                                         │
│  - Dashboard │  Main Workspace Canvas                                  │
│  - Assets    │  ┌───────────────────────────────────────────────────┐  │
│  - Custody   │  │                                                   │  │
│  - Planner   │  │  KPI Cards Grid                                   │  │
│  - Repairs   │  │  [ Total Assets ]  [ Active Alloc ]  [ Overdue ]  │  │
│  - Audits    │  │                                                   │  │
│  - Reports   │  ├───────────────────────────────────────────────────┤  │
│              │  │                                                   │  │
│  - Settings  │  │  Main Feature List View / Calendar Grid / Charts  │  │
│  - Logs      │  │                                                   │  │
│              │  │                                                   │  │
│  Profile     │  │                                                   │  │
│  [UserBadge] │  └───────────────────────────────────────────────────┘  │
└──────────────┴─────────────────────────────────────────────────────────┘
```

### 2.1 Navigation Flow & Sidebar Map
1.  **Overview Section**:
    *   **Dashboard** (`/dashboard`): General analytics and shortcut commands.
    *   **Notifications** (`/notifications`): Push alert feed and unread statuses.
2.  **Operations Section**:
    *   **Asset Directory** (`/assets`): Inventory directory, registration, and details.
    *   **Custody & Transfers** (`/allocations`): Allocations directory, returns manager, and transfer inboxes.
    *   **Planner** (`/bookings`): Resource schedule calendar mapping bookable items.
    *   **Repairs Center** (`/maintenance`): Maintenance ticketing pipeline.
3.  **Compliance Section**:
    *   **Audit Cycles** (`/audits`): Scoped compliance audits execution lists.
    *   **Reports & Analytics** (`/reports`): Utilization indices, discrepancy reviews, data export.
4.  **Settings Section (Admin Only)**:
    *   **Organization Setup** (`/admin/org-setup`): Tabbed configuration dashboard (Employees, Departments, Categories).
    *   **System Logs** (`/admin/logs`): Paginated security audit logging history.

---

## 3. Screen Specifications

### Screen 1: Login & Signup (`/login`, `/signup`)
*   **Purpose**: Account creation and secure authentication entry.
*   **Target User**: Guest (Visitor), Employees.
*   **Layout**: Balanced screen division. Left panel displays a premium dark motion graphic with typography explaining "AssetFlow ERP Control". Right panel houses a centered card holding forms.
*   **Components**:
    *   *Form*: Email input, Password field with password-strength checking indicator, Name field (only visible on `/signup`), "Submit" button, and "Toggle Login/Signup" link.
*   **States**:
    *   *Loading*: Submit button locks, displaying an animating spinner.
    *   *Error*: Custom inline alert blocks (e.g. "EMAIL_ALREADY_EXISTS" in red outline banner).
*   **Design Notes**: Focuses on micro-animations. Floating card transitions upwards on load.

---

### Screen 2: Dashboard Overview (`/dashboard`)
*   **Purpose**: Central hub highlighting critical operations, shortcuts, and key performance indicators.
*   **Target User**: All authenticated staff (UI adapts components based on active role).
*   **Layout**: Top row grid displaying KPI cards. Left canvas renders a consolidated "Activity Feed". Right canvas lists user's active custody assets and resource bookings.
*   **Components**:
    *   *KPI Card*: Count widgets (Total Assets, Active Allocations, Overdue Assets [highlighted in red outline], Active Audits). Clicking details opens filtered lists.
    *   *Quick Actions Panel*: Buttons for `+ New Asset`, `+ Allocate`, `+ Book Room`, `+ Raise Maintenance`. (Asset/Allocation buttons are hidden for normal Employees).
*   **Empty State**: If an employee has no assets or bookings, a central area displays an illustration of a laptop with the text "No assets currently allocated to you. Need something? Raise a request or book a shared resource."

---

### Screen 3: Organization Setup (`/admin/org-setup`)
*   **Purpose**: Admin configuration dashboard for employees, categories, and departments.
*   **Target User**: `ADMIN`.
*   **Layout**: Horizontal tabs panel:
    *   **Employees Tab**: Table listing employees, columns: Email, Role, Status, Department. Action dropdown: Change Role (BR-AUTH-02), Toggle Status (Deactivate checks).
    *   **Departments Tab**: Tree-hierarchy rendering departments with parent relationships (BR-ORG-01). Action: Edit Parent Department, Toggle Status (Deactivation safeguards check).
    *   **Asset Categories Tab**: Grid list. Cards show category name and custom field count. Action: Open Schema Builder Modal.
*   **Components**:
    *   *Schema Builder Modal*: Dynamic form builder. Add fields: Name (key), Type (String/Number/Boolean), Required flag checkbox.
*   **Success State**: Saving a category schema shows a toast: "Category [Name] schema saved. [Count] attributes registered."

---

### Screen 4: Asset Directory (`/assets`, `/assets/:id`)
*   **Purpose**: Inventory listing, item detail viewing, registration, and decommissioning.
*   **Target User**: All roles (Managers can register/decommission; Employees can view/request).
*   **Layout**: 
    *   `/assets` (List): Search bar and horizontal filters bar. Table shows Tag (`AF-XXXX` in monospace), Name, Category, Status pill, and Custody holder.
    *   `/assets/:id` (Details): Left column holds details, categories, acquisition dates, and condition. Renders dynamic metadata values in a clean key-value card. Right column houses a timeline widget showing the consolidated audit and booking history (Section 7, `03-database-design.md`).
*   **Forms**:
    *   *Asset Registration (`/assets/new`)*: Form fields: Name, Category selection (updates form inputs to render fields matching the category's dynamic schema), bookable toggle, acquisition cost.
*   **Dialogs**:
    *   *Decommission Dialog*: Modal triggered on available assets. Selection: `RETIRED` or `DISPOSED`, and a mandatory text area for decommission reasons (BR-ASSET-03).

---

### Screen 5: Custody & Allocations (`/allocations`)
*   **Purpose**: Custody assignments directory, returns processing, and transfer requests inbox.
*   **Target User**: Asset Managers, Department Heads, Employees.
*   **Layout**: Split dashboard screen. Left column displays active allocations divided by "Individual Custody" and "Departmental Custody", with a tab highlighting "Overdue Returns". Right column lists the "Transfers Request Inbox" containing pending transfers.
*   **Components**:
    *   *Return Modal*: Triggered by clicking "Process Return" on an active allocation. Fields: Condition dropdown (`EXCELLENT`, `GOOD`, `FAIR`, `DAMAGED`), and a mandatory check-in notes text area (BR-ALLOC-04).
    *   *Transfer Request Modal*: Triggered on occupied assets. Text area: "Explain reason for transfer request." (BR-ALLOC-02).
*   **Accessibility**: Return Modal shifts focus automatically to the check-in condition selection. `Escape` key closes the dialog cleanly.

---

### Screen 6: Resource Bookings Planner (`/bookings`)
*   **Purpose**: Shared bookable asset reservation calendar and calendar views.
*   **Target User**: All roles.
*   **Layout**: Left panel displays search filters (filter by category: e.g. Meeting Rooms, Projectors) and bookable item directory. Right panel renders a full calendar scheduler view (daily/weekly/monthly grids) mapping reservation blocks.
*   **Components**:
    *   *Booking Form Modal*: Triggered by clicking a timeslot. Displays selected asset name. Form: Start Time, End Time, Booker name (Defaults to user; Department Heads get a toggle to select booking on behalf of department).
*   **States**:
    *   *Overlap Warning*: Attempting to select a overlapping slot displays a red warning banner: "Time Conflict: This resource is already reserved. Please select a different slot." disables the save button (BR-BOOK-01).

---

### Screen 7: Repairs Center (`/maintenance`)
*   **Purpose**: Maintenance issue reporting, triage dashboard, and technician assignments.
*   **Target User**: All roles (Employees report; Managers approve/assign).
*   **Layout**: Trello-style kanban board columns matching maintenance status stages: `PENDING` (Triage), `APPROVED`, `ASSIGNED` (Scheduled), `IN_PROGRESS`, `RESOLVED`.
*   **Components**:
    *   *Raise Request Form*: Modal containing asset selection dropdown, description textarea, priority selector (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
    *   *Resolution Modal*: Form for technicians/managers. Text area: "Details of repair actions." Asset condition update: selection of updated status.
*   **Animations**: Drag-and-drop animations using framer-motion. Dragging a card between status columns updates the backend database. (Only active for managers).

---

### Screen 8: Compliance Audits (`/audits`, `/audits/:id`)
*   **Purpose**: Audit cycle generation, progress checklists, and auditor evaluation workspace.
*   **Target User**: Admins (creates/closes), Auditors (assigned employees).
*   **Layout**:
    *   `/audits` (List): Cycle cards showing status (`ACTIVE`/`CLOSED`), start dates, scoped department/category, progress bar (checked items vs total).
    *   `/audits/:id` (Execution): Search bar. Grid cards of assets in scope. Each card displays tag, name, last location, and three action buttons: "Verify", "Flag Damaged", "Flag Missing".
*   **States**:
    *   *Close Campaign Warning*: Admin clicking "Close Audit" opens a dialog listing unresolved discrepancies. Confirming closes the campaign and triggers status transitions (BR-AUDIT-03).

---

### Screen 9: Reports & Analytics (`/reports`)
*   **Purpose**: Metric visualization, discrepancy resolution center, and data export.
*   **Target User**: Asset Managers, Admins.
*   **Layout**: Two-column layout:
    *   **Top Column**: Utilization index line charts (asset usage frequencies over time), category distribution bar charts, maintenance cost pie charts (using Recharts).
    *   **Bottom Column (Discrepancy Inbox)**: Listing items flagged missing or damaged. Row offers a "Resolve" button. Clicking opens a modal offering resolution formats: Create Maintenance, Write-Off, Reconciled (BR-AUDIT-04).
*   **Keyboard Navigation**: Tab traverses table resolution action buttons cleanly.

---

### Screen 10: System Logs & Notification Hub (`/admin/logs`, `/notifications`)
*   **Purpose**: Security event tracking and real-time user notification center.
*   **Target User**: Admins (for Logs), All employees (for Notifications).
*   **Layout**:
    *   `/admin/logs`: Raw monospaced database tables query log. Allows sorting/filtering by Actor Email, Table Name, Action type, and Date.
    *   `/notifications`: List format feed. Unread notifications have a subtle left indigo highlight. Clicking a notification marks it as read and redirects the router to the target asset/booking/allocation.

---

## 4. UI/UX Rules & Accessibility Standards

To ensure a cohesive and accessible user experience:

*   **Keyboard Navigation**:
    *   All interactive elements must support `focus-visible` styling (subtle indigo ring highlight).
    *   Modals must bind `Escape` to close, `Tab` to cycle focus internally, and restore focus to the triggering element on unmount.
*   **Responsive Breakpoints**:
    *   Mobile (`sm`, `max-width: 640px`): Sidebar collapses to hamburger slide-over. Tables transition to flex card listings.
    *   Tablet (`md`, `max-width: 1024px`): Sidebar collapses to icons-only view. Layout changes from three columns to two columns.
    *   Desktop (`lg`, `min-width: 1025px`): Full expanded layout canvas.
*   **Loading States (Skeletons)**:
    *   Avoid blank screens or raw spinning wheels during page loads.
    *   Use animated pulse skeletons (`animate-pulse` background shapes) matching the layout shapes of tables, cards, and charts.
