# AssetFlow — Component Library Specification

This document defines the interface specifications, design variants, states, and accessibility standards for the reusable components of the **AssetFlow** platform. 

---

## 1. Component Categories

To prevent code duplication, components are categorized into three structural tiers:

1. **Layout Components**: High-level structural grids (Sidebar, Header, Main Canvas) that establish the app viewport.
2. **Shared UI Components**: Generic, stateless design components located in `components/ui/` and `components/common/`. They use shadcn/ui and Tailwind v4.
3. **Feature Components**: Specialized stateful widgets located within feature modules (e.g. `features/booking/CalendarView.jsx`) that bind directly to services, API hooks, and local business validations.

---

## 2. Layout Components

### 2.1 AppLayout
* **Purpose**: Mounts the persistent global layout structure.
* **Layout Grid**: Handles sidebar responsiveness (desktop fixed navigation, mobile hamburger slide-over overlay).
* **Usage**: Wraps all private/protected React routes.

### 2.2 Sidebar
* **Purpose**: Displays brand identity, security clearance user details, and primary feature navigation routes.
* **Accessibility**: Navigation wrapper uses `<nav aria-label="Main Navigation">`. Active links use `aria-current="page"`.
* **Design States**: Hover highlight transitions, icon-only toggle on smaller screens.

### 2.3 GlobalHeader
* **Purpose**: Renders contextual page breadcrumbs, universal command bar shortcut button, user notification status bell, and theme switch.
* **Layout**: Sticky header (`sticky top-0 z-50`), background blur backing (`backdrop-blur`).

---

## 3. Shared UI Components

### 3.1 Button
* **Purpose**: Standard trigger action button.
* **Props**:
  * `variant`: `'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'`
  * `size`: `'sm' | 'md' | 'lg'`
  * `isLoading`: `boolean` (Disables trigger, replaces children with loading spinner)
  * `disabled`: `boolean` (Native HTML disabled)
  * `onClick`: `function`
* **States**: Idle, Hover (brightens accent background), Active (slightly scales down scale-95), Focus (`focus-visible:ring-2`), Loading, Disabled (opacity-50, pointer-events-none).
* **Accessibility**: Binds native `aria-disabled` and updates focus lockouts during loading.

### 3.2 Input
* **Purpose**: Standard single-line text input field.
* **Props**:
  * `type`: `'text' | 'email' | 'password' | 'number' | 'date'`
  * `name`: `string` (react-hook-form identifier)
  * `label`: `string` (Renders floating uppercase label text above field)
  * `error`: `string` (Validation error message banner)
  * `placeholder`: `string`
* **States**: Idle (subtle dark border), Focus (indigo outline ring), Error (rose border and text layout).
* **Accessibility**: Connects input `id` with label `htmlFor`. Includes `aria-invalid="true"` when error parameter is populated.

### 3.3 Select
* **Purpose**: Custom drop-down selector container.
* **Props**:
  * `options`: `Array<{value, label}>`
  * `value`: `string`
  * `placeholder`: `string`
  * `onChange`: `function`
  * `error`: `string`
* **Accessibility**: Replaces standard HTML drop-down with keyboard-navigable listbox (`role="listbox"`, `aria-expanded`, keyboard `ArrowUp` / `ArrowDown` focus cycles).

### 3.4 Table
* **Purpose**: Traditional tabular view for dense structural listings.
* **Structure**: Consists of `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`.
* **Design System Integration**: Alternating row hover highlights, thin border boundaries.
* **Accessibility**: Captures standard elements (`<thead>`, `<tbody>`, `<tr>`, `<th>` with `scope="col"`).

### 3.5 Data Grid (Table with Sorting, Filters, & Page Selector)
* **Purpose**: Higher-level container wrapping Tables with search boxes, multi-select filter controls, and pagination lines.
* **Props**:
  * `columns`: `Array<{key, header, renderCell}>`
  * `data`: `Array<Records>`
  * `onSort`: `function(key, order)`
  * `isLoading`: `boolean`
* **Usage**: Root structure for directory grids like `/assets` and `/allocations`. Renders automated Loading Skeleton tables on active data fetches.

### 3.6 Card
* **Purpose**: Content container card layout.
* **Props**:
  * `title`: `string`
  * `subtitle`: `string`
  * `actions`: `ReactNode` (Header button arrays)
  * `children`: `ReactNode` (Body content)
* **Elevation**: Soft border elevation mapping.

### 3.7 Dialog (Modal)
* **Purpose**: Center-aligned modal overlay for secondary transactions (e.g. Return Processing, Asset Category Schema Builder).
* **Props**:
  * `isOpen`: `boolean`
  * `title`: `string`
  * `onClose`: `function`
  * `children`: `ReactNode`
* **Accessibility**: Renders inside a React Portal. Uses `react-focus-on` or native focus traps to capture focus. Binds `Escape` to close modal. Background overlay must have `aria-hidden="true"`.

### 3.8 Drawer / Sheet
* **Purpose**: Slide-over panel docking from the right or bottom of the screen.
* **Props**:
  * `isOpen`: `boolean`
  * `title`: `string`
  * `side`: `'right' | 'bottom'`
  * `onClose`: `function`
* **Usage**: View details of an asset on mobile, or reveal notifications logs sidefeed.

### 3.9 Badge
* **Purpose**: Micro-pill representing status metrics.
* **Variants**:
  * `'success'`: Emerald green backing (`AVAILABLE`, `APPROVED`, `VERIFIED`).
  * `'warning'`: Amber gold backing (`PENDING`, `RESERVED`, `ONGOING`).
  * `'destructive'`: Rose red backing (`LOST`, `REJECTED`, `CANCELLED`, `OVERDUE`).
  * `'default'`: Slate gray backing (`RETIRED`, `DISPOSED`).
* **Design Style**: Low opacity solid backdrops (`bg-emerald-500/10 text-emerald-400` in dark theme).

### 3.10 Avatar
* **Purpose**: Displays user identity circles (initials or profile image).
* **Props**:
  * `src`: `string`
  * `name`: `string`
  * `size`: `'sm' | 'md' | 'lg'`
* **Fallback**: Renders user initials (e.g. `JD` for John Doe) if image fails.

### 3.11 Search & Filter Bar
* **Purpose**: Input toolbar containing a text search input and filter buttons.
* **Props**:
  * `onSearchChange`: `function(search)`
  * `filters`: `Array<{key, type, options}>`
  * `onFiltersChange`: `function(activeFilters)`
* **Keyboard Shortcut**: Command+K (macOS) / Ctrl+K (Windows) focuses search automatically.

### 3.12 Pagination
* **Purpose**: Page selector controls for list views.
* **Props**:
  * `currentPage`: `number`
  * `totalPages`: `number`
  * `onPageChange`: `function(page)`
* **Design**: Standard Prev/Next icons alongside numbered buttons. Disables buttons at bounds.

### 3.13 Timeline
* **Purpose**: Monospaced history event stream tracker (e.g., Asset History Log).
* **Props**:
  * `events`: `Array<{title, subtitle, timestamp, iconType}>`
* **Usage**: Renders on asset details panel.

### 3.14 Tabs
* **Purpose**: Switcher component toggle for sub-views.
* **Props**:
  * `tabs`: `Array<{id, label, content}>`
  * `activeTabId`: `string`
  * `onChange`: `function(tabId)`
* **Accessibility**: Implements WAI-ARIA Tabs pattern (`role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-controls`, `aria-selected`).

### 3.15 Breadcrumb
* **Purpose**: Navigation path helper below header bar.
* **Props**:
  * `items`: `Array<{label, href}>`

### 3.16 Toast
* **Purpose**: Non-blocking toast alerts for transaction status confirmation.
* **Props**:
  * `type`: `'success' | 'error' | 'info'`
  * `message`: `string`
* **Aesthetics**: Floating card at top-right or bottom-right with slide-in animations.
* **Accessibility**: Uses `role="status"` or `role="alert"` dynamically based on type.

### 3.17 Empty State
* **Purpose**: Visual card rendered when grids or feeds have zero entries.
* **Props**:
  * `title`: `string`
  * `description`: `string`
  * `actionButton`: `ReactNode` (Optional trigger button)
* **Aesthetics**: Clean container display housing description text.

### 3.18 Loading Skeleton
* **Purpose**: Renders pulse shapes during page loads.
* **Props**:
  * `variant`: `'table' | 'cards' | 'kpi'`
* **Aesthetics**: Muted slate rectangles with `animate-pulse`.

### 3.19 QR Display
* **Purpose**: Renders an asset tag tag as a QR code for mobile scanning.
* **Props**:
  * `tagValue`: `string` (e.g., `AF-0014`)
  * `size`: `number`

### 3.20 KPI Card
* **Purpose**: High-level numerical KPI block.
* **Props**:
  * `title`: `string`
  * `value`: `string | number`
  * `trend`: `string` (Optional trend description, e.g. "+12% this week")
  * `status`: `'default' | 'success' | 'warning' | 'destructive'`
* **Aesthetics**: High contrast large text. Destructive status card displays thin red left border bounds if overdue returns > 0.

---

## 4. Feature-Specific Components

### 4.1 Planner Calendar (`features/booking/PlannerCalendar.jsx`)
* **Purpose**: Renders daily/weekly/monthly grids mapping reservation blocks of shared assets.
* **Interactivity**: Clicking empty cell spaces opens booking form pre-populated with hours. Hovering block reveals tooltips showing employee details.

### 4.2 Maintenance Board (`features/maintenance/MaintenanceKanban.jsx`)
* **Purpose**: Trello-style kanban layout mapping status columns (`PENDING`, `APPROVED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`).
* **Interactivity**: Drag-and-drop actions for managers updating ticket states. Triggers transition validators (e.g. locks technician assignment requirements).

### 4.3 Category Schema Builder (`features/admin/SchemaBuilder.jsx`)
* **Purpose**: Allows Admins to construct JSON schemas for asset categories dynamically.
* **Interactivity**: Interactive form rows. User adds custom attributes defining data-type constraints.

---

## 5. Analytics & Visualization Components

### 5.1 Asset Utilization Line Chart (`features/reports/UtilizationChart.jsx`)
* **Purpose**: Renders usage counts of categories over time.
* **Library**: Recharts `ResponsiveContainer`, `LineChart`, `Tooltip`.
* **Aesthetics**: Smooth curves, gradient fills, custom HSL tooltips.

### 5.2 Category Distribution Bar Chart (`features/reports/DistributionChart.jsx`)
* **Purpose**: Displays inventory allocation counts.
* **Library**: Recharts `BarChart`, `XAxis`, `YAxis`.
* **Aesthetics**: Thin bars, rounded edge radius.
