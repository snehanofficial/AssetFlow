# AssetFlow — Design System

> Version 1.0 — This document is the single source of truth for every UI decision in AssetFlow. Nothing is implemented unless it is defined here. When in doubt, consult this document first.

---

## 1. Brand Philosophy

AssetFlow is an enterprise asset and resource management platform. The UI must communicate:

- **Professional** — trusted by organizations, not playful
- **Efficient** — information-dense without feeling cluttered
- **Calm** — restrained, not distracting
- **Modern** — contemporary SaaS aesthetics (2024–2026)
- **Trustworthy** — consistent, predictable, reliable

### Inspirations
Linear, GitHub, Stripe Dashboard, Vercel, Atlassian, Notion — studied for their **principles of clarity, restraint, and information hierarchy** — not their exact visual identity.

### Anti-patterns (Forbidden)
- Rainbow color palettes
- Glassmorphism everywhere
- Excessive gradients on primary surfaces
- Flashy entrance animations
- Unnecessary decoration
- Generic Bootstrap admin look
- Crypto/gaming dashboard aesthetics

---

## 2. Color System

### Philosophy
**Neutral-first.** The application canvas is built from neutral grays. A single strong brand accent (indigo/violet) provides interactive identity. All other colors are semantic — reserved for meaning, not decoration.

### Design Token Reference

All colors are defined as HSL CSS custom properties on `:root` (dark theme default) and `:root:not(.dark)` (light theme). Components reference **only** these semantic tokens — never hardcoded hex or Tailwind palette colors.

#### Canvas Tokens

| Token | Dark Value (HSL) | Light Value (HSL) | Usage |
|---|---|---|---|
| `--background` | `224 71% 4%` | `0 0% 100%` | Page canvas, outermost background |
| `--surface` | `222 47% 8%` | `240 5% 96%` | Cards, sidebar, table containers |
| `--surface-elevated` | `222 47% 11%` | `0 0% 100%` | Modals, dropdowns, popovers |
| `--surface-hover` | `222 47% 14%` | `240 5% 91%` | Row hover, interactive surface states |

#### Border & Divider Tokens

| Token | Dark Value (HSL) | Light Value (HSL) | Usage |
|---|---|---|---|
| `--border` | `220 14% 18%` | `220 13% 91%` | Card borders, input borders, dividers |
| `--border-subtle` | `220 14% 14%` | `220 13% 95%` | Table row dividers, internal separators |
| `--ring` | `263 70% 50%` | `263 70% 50%` | Focus ring color (keyboard navigation) |

#### Text Tokens

| Token | Dark Value (HSL) | Light Value (HSL) | Usage |
|---|---|---|---|
| `--text-primary` | `210 20% 98%` | `222 47% 6%` | Primary content, headings, labels |
| `--text-secondary` | `215 16% 57%` | `215 16% 40%` | Supporting text, descriptions |
| `--text-muted` | `215 16% 38%` | `215 16% 58%` | Placeholders, disabled text, timestamps |

#### Brand Tokens

| Token | Value (Both Themes) | Usage |
|---|---|---|
| `--primary` | `263 70% 50%` | Primary buttons, active nav, links, focus |
| `--primary-hover` | `262 83% 58%` | Primary button hover state |
| `--primary-active` | `263 83% 44%` | Primary button active/pressed state |
| `--primary-foreground` | `210 20% 98%` | Text on primary backgrounds |
| `--primary-subtle` | `263 70% 50% / 0.08` | Subtle primary tint for active nav items |
| `--primary-subtle-border` | `263 70% 50% / 0.20` | Border for active nav items |

#### Status Tokens

| Token | Dark Value (HSL) | Light Value (HSL) | Usage |
|---|---|---|---|
| `--success` | `142 71% 36%` | `142 71% 29%` | Available assets, resolved, verified |
| `--success-foreground` | `138 76% 97%` | `138 76% 97%` | Text on success backgrounds |
| `--success-subtle` | `142 76% 36% / 0.12` | `142 71% 29% / 0.10` | Success badge background |
| `--warning` | `38 92% 50%` | `38 92% 44%` | Pending, reserved, in-progress |
| `--warning-foreground` | `38 96% 12%` | `38 96% 10%` | Text on warning backgrounds |
| `--warning-subtle` | `38 92% 50% / 0.12` | `38 92% 44% / 0.10` | Warning badge background |
| `--danger` | `346 77% 50%` | `346 72% 45%` | Lost, overdue, errors, destructive |
| `--danger-foreground` | `355 100% 97%` | `355 100% 97%` | Text on danger backgrounds |
| `--danger-subtle` | `346 77% 50% / 0.12` | `346 72% 45% / 0.10` | Danger badge background |
| `--info` | `217 91% 60%` | `217 91% 50%` | Informational, allocated, booked |
| `--info-foreground` | `210 20% 98%` | `210 20% 98%` | Text on info backgrounds |
| `--info-subtle` | `217 91% 60% / 0.12` | `217 91% 50% / 0.10` | Info badge background |

#### Sidebar Tokens

| Token | Dark Value (HSL) | Light Value (HSL) | Usage |
|---|---|---|---|
| `--sidebar-bg` | `222 47% 6%` | `240 5% 98%` | Sidebar background |
| `--sidebar-border` | `220 14% 15%` | `220 13% 92%` | Sidebar right border |
| `--sidebar-item-active` | `263 70% 50% / 0.10` | `263 70% 50% / 0.08` | Active nav item background |
| `--sidebar-item-hover` | `220 14% 18% / 0.50` | `220 13% 91% / 0.60` | Nav item hover background |
| `--sidebar-text` | `215 16% 57%` | `215 16% 45%` | Nav item text (inactive) |
| `--sidebar-text-active` | `263 70% 65%` | `263 70% 45%` | Nav item text (active) |

#### Chart Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--chart-1` | `217 91% 60%` | Blue — Allocated, primary data |
| `--chart-2` | `142 71% 45%` | Green — Available, positive |
| `--chart-3` | `38 92% 55%` | Amber — Warning, maintenance |
| `--chart-4` | `263 70% 60%` | Violet — Brand, secondary data |
| `--chart-5` | `346 77% 60%` | Rose — Danger, lost |
| `--chart-6` | `215 16% 50%` | Gray — Retired, neutral |

#### Utility Tokens

| Token | Dark Value | Light Value | Usage |
|---|---|---|---|
| `--overlay` | `0 0% 0% / 0.65` | `0 0% 0% / 0.50` | Modal backdrop |
| `--skeleton` | `220 14% 14%` | `220 13% 92%` | Skeleton loading placeholder base |
| `--skeleton-shine` | `220 14% 20%` | `220 13% 98%` | Skeleton animation highlight |
| `--disabled` | `215 16% 30%` | `215 16% 75%` | Disabled element appearance |

#### Allowed Color Usage Rules

> **RULE**: Components may ONLY use the tokens above. Using raw Tailwind palette colors (`text-emerald-400`, `bg-rose-500`) is **forbidden** except inside the token definitions themselves.

Exception: Recharts and third-party chart libraries may use computed CSS variable values retrieved via `getComputedStyle`.

---

## 3. Typography

### Font Stack
```
--font-sans:    "Inter", system-ui, -apple-system, sans-serif
--font-display: "Outfit", system-ui, -apple-system, sans-serif  
--font-mono:    "JetBrains Mono", "Fira Code", monospace
```

Fonts are loaded via Google Fonts in `index.html`. Inter for body, Outfit for headings/display, JetBrains Mono for asset tags and code values.

### Type Scale

| Style | Class Pattern | Size | Weight | Line Height | Font | Usage |
|---|---|---|---|---|---|---|
| **Display** | `font-display text-4xl font-extrabold` | 2.25rem (36px) | 800 | 1.1 | Outfit | Auth page headlines |
| **H1** | `font-display text-2xl font-bold` | 1.5rem (24px) | 700 | 1.3 | Outfit | Page titles |
| **H2** | `font-display text-xl font-semibold` | 1.25rem (20px) | 600 | 1.4 | Outfit | Section titles |
| **H3** | `font-display text-base font-semibold` | 1rem (16px) | 600 | 1.5 | Outfit | Widget titles, card headers |
| **H4** | `text-sm font-semibold` | 0.875rem (14px) | 600 | 1.5 | Inter | Sub-section headers |
| **Body Large** | `text-sm` | 0.875rem (14px) | 400 | 1.5 | Inter | Primary body text |
| **Body** | `text-xs` | 0.75rem (12px) | 400 | 1.5 | Inter | Secondary body, form labels, nav items |
| **Small** | `text-[11px]` | 0.6875rem (11px) | 400 | 1.5 | Inter | Captions, helper text, timestamps |
| **Mono** | `font-mono text-xs` | 0.75rem (12px) | 500 | 1.5 | JetBrains Mono | Asset tags, serial numbers, IDs |

### Letter Spacing Rules
- Page titles, section headers: `tracking-tight` (-0.015em)
- Table column headers: `tracking-wide` (0.05em) + `uppercase`
- Asset tags (mono): `tracking-wider` (0.08em)
- Body text: default (0)

---

## 4. Spacing System

Base unit: **4px (0.25rem)**. All spacing must be multiples of this unit.

| Token | Value | Use cases |
|---|---|---|
| `1` (4px) | `p-1`, `gap-1` | Icon padding, tight micro-spacing |
| `2` (8px) | `p-2`, `gap-2` | Badge padding, icon button padding |
| `3` (12px) | `p-3`, `gap-3` | Form field spacing, small card padding |
| `4` (16px) | `p-4`, `gap-4` | Standard component padding |
| `5` (20px) | `p-5`, `gap-5` | Medium card padding |
| `6` (24px) | `p-6`, `gap-6` | Card padding, page section gaps |
| `8` (32px) | `p-8`, `gap-8` | Page header padding, large sections |
| `10` (40px) | `p-10` | Auth form padding |
| `12` (48px) | `p-12` | Auth layout column padding |
| `16` (64px) | `p-16` | Maximum outer padding |

### Forbidden
- No arbitrary spacing (e.g., `p-[13px]`, `mt-[7px]`)
- No spacing values between defined tokens without justification

---

## 5. Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-none` | 0 | Never use unless intentional flat design context |
| `rounded-sm` | 2px | Very tight chips, thin tags |
| `rounded` | 4px | Badges, status pills (within tables) |
| `rounded-md` | 6px | Inputs, selects, small buttons |
| `rounded-lg` | 8px | Cards, panels, standard buttons |
| `rounded-xl` | 12px | Modals/dialogs, large cards |
| `rounded-2xl` | 16px | Auth form card |
| `rounded-full` | 9999px | Avatar circles, toggle pills |

---

## 6. Elevation / Shadow System

Enterprise dashboards use **borders over shadows** in dark mode, **subtle ambient shadows** in light mode.

| Level | Usage | Dark Theme | Light Theme |
|---|---|---|---|
| **Flat** | Base page | No shadow, no border | No shadow |
| **Level 1** | Cards, tables, sidebar | `border border-border/60` | `border border-border shadow-sm` |
| **Level 2** | Sticky headers, toolbars | `border-b border-border` | `border-b border-border shadow-md` |
| **Level 3** | Dropdowns, tooltips | `border border-border shadow-lg` | `border border-border shadow-xl` |
| **Level 4** | Modals, dialogs | `border border-border shadow-2xl` | `border border-border shadow-2xl` |

Shadow tokens in Tailwind:
- `shadow-sm`: `0 1px 2px rgba(0,0,0,0.08)`
- `shadow-md`: `0 4px 6px rgba(0,0,0,0.10)`
- `shadow-lg`: `0 10px 15px rgba(0,0,0,0.15)`
- `shadow-xl`: `0 20px 25px rgba(0,0,0,0.20)`
- `shadow-2xl`: `0 25px 50px rgba(0,0,0,0.30)`

---

## 7. Icon System

All icons from **Lucide React**. No mixing icon libraries.

| Size | Class | Usage |
|---|---|---|
| Tiny | `w-3 h-3` | Inline text icons, badge decorators |
| Small | `w-3.5 h-3.5` | Button leading icons |
| Default | `w-4 h-4` | Nav icons, action icons, form icons |
| Medium | `w-5 h-5` | Notification icons, feature icons |
| Large | `w-6 h-6` | Page header icons |
| Display | `w-8 h-8` | Empty state icons, error state icons |

All icon-only buttons must include `aria-label` and `title` attributes.

---

## 8. Button System

### Variants

| Variant | Background | Text | Border | Hover | Use case |
|---|---|---|---|---|---|
| **Primary** | `primary` | `primary-foreground` | none | `primary-hover` | Main CTA (Register, Submit, Save) |
| **Secondary** | `surface` | `text-primary` | `border` | `surface-hover` | Secondary actions |
| **Outline** | transparent | `text-primary` | `border` | `surface` | Tertiary actions |
| **Ghost** | transparent | `text-secondary` | none | `surface-hover` | Subtle actions, nav buttons |
| **Danger** | `danger-subtle` | `danger` | `danger-subtle-border` | deeper red | Destructive actions |
| **Icon** | transparent | `text-secondary` | none | `surface-hover` + border-radius | Icon-only actions |

### Sizes

| Size | Padding | Text | Icon size | Usage |
|---|---|---|---|---|
| `sm` | `px-3 py-1.5` | `text-xs` | `w-3.5 h-3.5` | Table inline actions, badges |
| `md` | `px-4 py-2` | `text-sm` | `w-4 h-4` | Standard form buttons |
| `lg` | `px-5 py-2.5` | `text-sm` | `w-4 h-4` | Auth page submit buttons |

### States
- **Loading**: show Spinner, disable click, maintain width (no layout shift)
- **Disabled**: 50% opacity, `cursor-not-allowed`, no hover effects
- **Focus**: `ring-2 ring-ring ring-offset-2`

---

## 9. Input System

### Base Input
- Background: `background`
- Border: `border-border`, focus: `ring-2 ring-ring`
- Radius: `rounded-md`
- Padding: `px-3 py-2`
- Text: `text-sm text-text-primary`
- Placeholder: `text-text-muted`

### States
- **Default**: border `border`
- **Focus**: `ring-2 ring-ring border-ring`
- **Error**: `border-danger ring-danger` + error message below
- **Disabled**: `opacity-50 cursor-not-allowed bg-surface`
- **Success**: `border-success` (use sparingly, e.g., password strength)

### Field Layout
```
[Label] (required marker if needed)
[Input Field]
[Helper text] or [Error message]
```
Label: `text-xs font-medium text-text-secondary`
Helper: `text-[11px] text-text-muted`
Error: `text-[11px] text-danger font-medium`

### Select
Same styles as Input. Native `<select>` with custom chevron icon overlay. 

### Textarea
Same as Input. Min-height: 80px. Resize: vertical only.

### Search Input
Left icon slot for Search icon. No border-focus ring if used in header (transparent style).

---

## 10. Badge / Status Tag System

### Structure
`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold`

### Variants

| Variant | Background | Text | Border | Use case |
|---|---|---|---|---|
| `success` | `success-subtle` | `success` | `success/30` | Available, resolved, approved |
| `warning` | `warning-subtle` | `warning` | `warning/30` | Pending, reserved, in-progress |
| `danger` | `danger-subtle` | `danger` | `danger/30` | Lost, overdue, rejected, error |
| `info` | `info-subtle` | `info` | `info/30` | Allocated, booked, assigned |
| `primary` | `primary-subtle` | `primary-hover` | `primary/20` | Brand-tinted tags |
| `muted` | `surface-hover` | `text-muted` | `border-subtle` | Retired, disposed, neutral |

### Asset Status → Badge Variant Mapping

| Asset Status | Badge Variant |
|---|---|
| AVAILABLE | `success` |
| ALLOCATED | `info` |
| UNDER_MAINTENANCE | `warning` |
| RESERVED | `warning` |
| LOST | `danger` |
| RETIRED | `muted` |
| DISPOSED | `muted` |

---

## 11. Layout System

### Container & Widths

| Context | Width | Notes |
|---|---|---|
| Page max-width | `max-w-7xl` (1280px) | Standard content container |
| Full width tables | `w-full` | Tables span full container |
| Form max-width | `max-w-2xl` | Constrain wide forms |
| Notification feed | `max-w-3xl` | Constrained reading width |
| Auth form | `max-w-md` | Login/signup form width |

### Sidebar
- **Desktop** (≥1280px): Permanent, full-width (256px). User can collapse to 64px icon rail.
- **Laptop** (1024–1279px): Permanent, full-width (256px). Toggle collapse available.
- **Tablet** (768–1023px): Collapsed icon rail (64px) by default. Tap to expand.
- **Mobile** (<768px): Hidden. Slide-in drawer on hamburger press.

Sidebar width tokens:
- Expanded: `w-64` (256px)
- Collapsed: `w-16` (64px)
- Mobile drawer: `w-72` (288px)

### Navbar Height
`h-14` (56px) — consistent across all screens.

### Page Spacing

| Context | Value |
|---|---|
| Page padding (desktop) | `p-6` (24px) |
| Page padding (mobile) | `p-4` (16px) |
| Section gap | `space-y-6` |
| Card-to-card gap | `gap-4` or `gap-6` |

### Grid Layout

| Context | Desktop | Tablet | Mobile |
|---|---|---|---|
| Stat cards | `grid-cols-4` | `grid-cols-2` | `grid-cols-2` |
| Dashboard panels | `grid-cols-3` | `grid-cols-1` | `grid-cols-1` |
| Analytics charts | `grid-cols-2` | `grid-cols-1` | `grid-cols-1` |
| Export cards | `grid-cols-3` | `grid-cols-2` | `grid-cols-1` |

---

## 12. Responsive Strategy

### Breakpoints
```
mobile:  < 640px  (sm breakpoint)
tablet:  640–1023px (sm–lg)
laptop:  1024–1279px (lg–xl)
desktop: ≥ 1280px (xl+)
```

### Desktop-First Philosophy
Layouts are designed for desktop. Responsive modifiers reduce density, stack elements, and simplify navigation on smaller screens.

### Key Responsive Behaviors

| Component | Desktop | Tablet | Mobile |
|---|---|---|---|
| Sidebar | Permanent (256px) | Collapsed (64px) | Drawer |
| Header search | Full width input | Hidden | Hidden |
| Stat cards | 4 columns | 2 columns | 2 columns |
| Tables | Full columns visible | Horizontal scroll | Horizontal scroll |
| Modal width | `max-w-lg` to `max-w-2xl` | Full with 16px margins | Full with 8px margins |
| Page padding | `p-6` | `p-4` | `p-4` |
| Auth layout | 2-column | 1-column | 1-column |

---

## 13. Table Design

### Structure
```
[Toolbar: Search + Filters + Actions]
[Table: thead > tr > th / tbody > tr > td]
[Pagination]
```

### Header (`thead`)
- `bg-surface/50` with sticky positioning when `overflow-y-auto` container
- Text: `text-[11px] font-semibold text-text-muted uppercase tracking-wide`
- Padding: `px-4 py-3`
- Bottom border: `border-b border-border`

### Rows (`tbody tr`)
- Divider: `divide-y divide-border/40`
- Default: transparent background
- Hover: `hover:bg-surface-hover/60 transition-colors duration-100`
- Cursor: `cursor-pointer` when clickable
- Cell padding: `px-4 py-3`

### Skeleton Loading
Show 8 skeleton rows instead of any spinner or text. Each row matches real row height.

### Empty State
Centered icon + title + description + optional CTA. Minimum height 200px.

### Pagination
Always show: record range + total count + prev/next buttons.
Page number display when ≥3 pages.

---

## 14. Form Design

### Field Spacing
`space-y-4` between form fields. `space-y-6` between field groups.

### Validation
- All validation via React Hook Form + Zod
- Error messages appear below the input, never as popups
- Required fields: label has no marker by default; use placeholder text to communicate requirement
- Show inline error on blur + on submit attempt

### Loading on Submit
Button shows spinner, is disabled, text changes to past-tense action (e.g., "Saving...", "Creating...")

---

## 15. Feedback System

### Toast Notifications
- Position: `bottom-right`
- Max visible: 3 at once (queue older ones out)
- Duration: 4 seconds (auto-dismiss)
- Has close button (×)
- Has leading status icon (CheckCircle, XCircle, AlertTriangle, Info)
- Animation: slide-up from bottom-right on enter, fade-out on exit
- Variants: `success`, `error`, `warning`, `info`

### Dialog / Confirmation
- Use shared Dialog component for all modals
- Destructive confirmations: red danger button, warning text inside dialog
- Non-destructive: standard primary button

### Inline Alerts
For page-level errors (failed to load), show:
- `Alert` component with appropriate variant
- Retry button when applicable
- Clear error message — no technical jargon shown to user

---

## 16. Empty States

### Policy
Every data list/table must have an empty state. Never show a blank container.

### Structure
```
[Icon — 32px, text-muted at 40% opacity]
[Title — "No assets found" — text-sm font-medium]
[Description — "..." — text-xs text-text-muted]
[Optional: CTA button]
```

### When filters are active
Message: "No results match your filters" with a "Clear filters" link.

### First-time empty
Message: "No [things] yet" with "Register your first [thing]" CTA button (visible only if user has permission).

---

## 17. Loading Strategy

### Principle
**Never show a blank page.** Show the layout immediately with skeleton content.

### Skeleton Strategy
- Tables: 6–8 skeleton rows matching real row dimensions
- Stat cards: 4 skeleton card outlines
- Forms: skeleton inputs at same height as real inputs
- Charts: skeleton rectangle matching chart container height

### Skeleton Animation
`animate-pulse` with bg-skeleton color.

### Spinner Use Cases
Spinners (small, inline) ONLY for:
- Button loading state
- Initial app load (auth check)
- Inline refetch indicator

### Optimistic UI
Apply optimistic updates for:
- Marking notifications as read
- Status changes (booking cancel, maintenance status)
- Toggle operations

Always rollback with toast error if request fails.

---

## 18. Animation

### Principle
Animations should feel **instant but smooth**. Every animation serves a functional purpose (signals state change, guides attention, provides context). No decorative animations.

### Timing

| Action | Duration | Easing |
|---|---|---|
| Hover states | 100ms | `ease-out` |
| Press/active | 75ms | `ease-in` |
| Color transitions | 150ms | `ease-out` |
| Skeleton pulse | 1500ms | linear infinite |
| Toast entrance | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Modal backdrop | 200ms | `ease-out` |
| Modal content | 200ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Sidebar collapse | 250ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Sidebar drawer | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Accordion | 200ms | `ease-out` |

### Keyframes Required
```
fade-in: opacity 0 → 1
slide-up: translateY(8px) → 0, opacity 0 → 1
slide-in-right: translateX(100%) → 0
slide-in-left: translateX(-100%) → 0
modal-in: scale(0.96) → 1, opacity 0 → 1
accordion-down: height 0 → auto
accordion-up: height auto → 0
skeleton-pulse: opacity 0.5 → 1 → 0.5
```

---

## 19. Accessibility

### Target: WCAG 2.2 Level AA

### Color Contrast
- Text on background: minimum **4.5:1** ratio
- Large text (≥18pt or 14pt bold): minimum **3:1** ratio
- Interactive elements (buttons, links): minimum **3:1** against adjacent color

### Keyboard Navigation
- All interactive elements must be keyboard-accessible
- Tab order must follow logical reading order
- Focus ring: `ring-2 ring-ring ring-offset-2 ring-offset-background` — always visible
- Modal dialogs must trap focus inside
- Pressing Escape closes modals/dialogs

### Semantic HTML
- One `<h1>` per page
- Proper heading hierarchy (h1 → h2 → h3)
- `<nav>` for sidebar navigation
- `<main>` for page content
- `<header>` for top bar
- `<aside>` for sidebar
- `<button>` for interactive elements (never `<div onClick>`)

### ARIA
- Icon-only buttons: `aria-label="..."` required
- Loading states: `aria-busy="true"` on container
- Dialogs: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Status messages: `role="status"` for dynamic updates
- Tables: proper `scope="col"` on `<th>` elements

### Touch Targets
Minimum 44×44px touch target for all interactive elements on mobile.

---

## 20. Performance Guidelines

### Target
< 400ms perceived interaction for all user actions.

### Code Splitting
- Route-level lazy loading with `React.lazy` and `Suspense`
- Feature components lazy-loaded when behind modals

### Memoization
- `React.memo` for pure list items (table rows, kanban cards)
- `useMemo` for expensive filtering/sorting operations
- `useCallback` for event handlers passed as props

### TanStack Query
- `staleTime: 5 * 60 * 1000` (5 min) for reference data (categories, departments)
- `staleTime: 0` for real-time data (notifications, dashboard metrics)
- `keepPreviousData: true` on paginated tables
- `refetchInterval` only where real-time updates are critical

### Optimistic Updates
Pattern:
```js
onMutate: async (variables) => {
  await queryClient.cancelQueries({ queryKey })
  const previous = queryClient.getQueryData(queryKey)
  queryClient.setQueryData(queryKey, optimisticUpdate)
  return { previous }
},
onError: (err, variables, context) => {
  queryClient.setQueryData(queryKey, context.previous)
  showToast('Action failed. Changes reverted.', 'error')
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey })
}
```

### Layout Stability
- Always define explicit height for skeleton containers
- Use `min-h-*` on empty state containers to prevent layout shifts
- Sidebar width: use CSS `transition-[width]` not `display:none`

---

## 21. Component Inventory

Every reusable component lives in `client/src/components/ui/` or `client/src/components/common/`.

### UI Primitives (`components/ui/`)
| Component | File | Status |
|---|---|---|
| Button | `Button.jsx` | To be created |
| Input | `Input.jsx` | To be created |
| Select | `Select.jsx` | To be created |
| Textarea | `Textarea.jsx` | To be created |
| Badge | `Badge.jsx` | To be created |
| Dialog | `Dialog.jsx` | To be created |
| Skeleton | `Skeleton.jsx` | To be created |
| Spinner | `Spinner.jsx` | To be created |
| Card | `Card.jsx` | To be created |
| PageHeader | `PageHeader.jsx` | To be created |
| EmptyState | `EmptyState.jsx` | To be created |
| Alert | `Alert.jsx` | To be created |

### Layout Components (`components/common/`)
| Component | File | Status |
|---|---|---|
| AppLayout | `AppLayout.jsx` | To be enhanced |
| Sidebar | `Sidebar.jsx` | To be enhanced |
| GlobalHeader | `GlobalHeader.jsx` | To be enhanced |
| AuthLayout | `AuthLayout.jsx` | To be enhanced |
| ProtectedLayout | `ProtectedLayout.jsx` | No changes |
| Providers | `Providers.jsx` | Toast to be enhanced |

---

## 22. Implementation Rules

1. **No hardcoded colors** — use design tokens only
2. **No arbitrary Tailwind values** — use defined spacing scale
3. **No duplicate component patterns** — reference shared components
4. **No inline styles** — use Tailwind classes only
5. **Every modal uses `Dialog.jsx`** — no raw fixed-position divs
6. **Every loading state uses skeletons** — no spinner text except buttons
7. **Every empty state uses `EmptyState.jsx`** — consistent messaging
8. **Every icon button has `aria-label`** — no silent interactive elements
9. **Every form uses React Hook Form** — no manual state for form values
10. **Every status uses `Badge.jsx`** — no custom badge patterns per feature

---

*Last updated: 2026-07-12*
*Version: 1.0*
