# AssetFlow — Design System Specification

This document details the global design tokens, styling rules, typography systems, and theme variables for the **AssetFlow** platform. These specifications guide the UI aesthetics to deliver a premium, modern, accessible Enterprise SaaS experience.

---

## 1. Design Principles

Every user interface layout, element, state, and motion must adhere to four design principles:

1. **Information Hierarchy**: Clean visual prioritization. High-density grids must use distinct type sizes, weights, and subtle border dividers so critical elements stand out.
2. **Intentional Contrast**: Interactive items must look obviously clickable. Muted statuses must look distinct from active ones. Theme colors must meet WCAG accessibility ratios.
3. **Micro-Interactions**: Use fluid animations for hover, active, loading, and transition states. The UI must feel responsive and alive.
4. **Adaptive Canvas**: Designs must be mobile-responsive by default. Tables must transition to stacked cards on narrow viewports, and sidebars must collapse to minimal icons or hide completely.

---

## 2. Global Design Tokens (CSS Variables)

We define all styling properties as CSS Variables. Developers must use these semantic custom properties instead of hardcoded hex values, pixel sizes, or inline radius overrides.

### 2.1 CSS Variable Definitions (`src/index.css`)

```css
@theme {
  /* Brand Typography */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-display: "Outfit", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Spacing Scale (4px Increment System) */
  --spacing-1: 0.25rem;  /* 4px */
  --spacing-2: 0.5rem;   /* 8px */
  --spacing-3: 0.75rem;  /* 12px */
  --spacing-4: 1rem;     /* 16px */
  --spacing-5: 1.25rem;  /* 20px */
  --spacing-6: 1.5rem;   /* 24px */
  --spacing-8: 2rem;     /* 32px */
  --spacing-10: 2.5rem;  /* 40px */
  --spacing-12: 3rem;    /* 48px */
  --spacing-16: 4rem;    /* 64px */

  /* Border Radius */
  --radius-xs: 0.125rem; /* 2px */
  --radius-sm: 0.25rem;  /* 4px */
  --radius-md: 0.5rem;   /* 8px */
  --radius-lg: 0.75rem;  /* 12px */
  --radius-xl: 1rem;     /* 16px */
  --radius-2xl: 1.5rem;  /* 24px */
  --radius-full: 9999px; /* Pill */

  /* Breakpoints */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;

  /* Motion Dynamics */
  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;
  --animate-fade-in: fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  --animate-slide-up: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 3. Theme Systems

AssetFlow supports a system-wide Dark Theme (Default) and Light Theme. We map semantic tokens to CSS variables dynamically changed by toggling the `.dark` class on the `<html>` node.

### 3.1 Dark Theme Tokens (Default)

```css
:root {
  /* Canvas Backgrounds */
  --background: 224 71% 4%;       /* Slate HSL - deep dark canvas */
  --surface: 224 71% 7%;          /* Slightly lighter card surface */
  --surface-hover: 224 71% 10%;    /* Surface hover highlights */
  --popover: 224 71% 6%;          /* Dropdown overlays */

  /* Borders & Dividers */
  --border: 220 14.3% 16%;        /* Dark border lines */
  --border-focus: 263 70% 50%;    /* Indigo focus outline */

  /* Text Contrasts */
  --text-primary: 210 20% 98%;    /* Off-white readable text */
  --text-secondary: 215.4 16.3% 56.9%; /* Muted slate gray */
  --text-muted: 215.4 16.3% 40%;  /* Muted placeholder text */

  /* Brand Colors */
  --primary: 263.4 70% 50.4%;     /* Royal Indigo primary brand */
  --primary-hover: 262.1 83.3% 57.8%; /* Accented bright purple */
  --primary-foreground: 210 20% 98%;

  /* Status Tokens */
  --success: 142.1 76.2% 36.3%;   /* Emerald Green */
  --success-foreground: 138 76% 97%;
  --warning: 47.9 95.8% 51.2%;    /* Amber Gold */
  --warning-foreground: 48 96% 12%;
  --destructive: 346.8 77.2% 49.8%;/* Rose Red */
  --destructive-foreground: 355 100% 97%;
}
```

### 3.2 Light Theme Tokens

```css
.dark {
  /* Override variables when dark class is absent (defining light variables) */
}

/* For structural clarity, standard light styles populate when the .dark class is omitted,
   mapping the following variables: */
:root:not(.dark) {
  /* Canvas Backgrounds */
  --background: 0 0% 100%;        /* Pure White */
  --surface: 240 4.8% 95.9%;      /* Off-white light surface */
  --surface-hover: 240 4.8% 90%;   /* Light hover */
  --popover: 0 0% 100%;

  /* Borders & Dividers */
  --border: 240 5.9% 90%;         /* Soft gray divider lines */
  --border-focus: 263 70% 50%;

  /* Text Contrasts */
  --text-primary: 240 10% 3.9%;   /* Off-black text */
  --text-secondary: 240 3.8% 46.1%;/* Muted gray text */
  --text-muted: 240 3.8% 65%;

  /* Brand Colors */
  --primary: 263.4 70% 50.4%;
  --primary-hover: 262.1 83.3% 57.8%;
  --primary-foreground: 210 20% 98%;

  /* Status Tokens */
  --success: 142.1 72% 29%;
  --success-foreground: 138 76% 97%;
  --warning: 38 92% 50%;
  --warning-foreground: 48 96% 12%;
  --destructive: 346.8 72% 45%;
  --destructive-foreground: 355 100% 97%;
}
```

---

## 4. Semantic Color Mapping

To maintain clean theme compliance, developers must map functional elements to their semantic tokens:

| UI Element Type | Variable Name | Dark Theme Value (HSL) | Light Theme Value (HSL) | Usage Rule |
|---|---|---|---|---|
| Page Background | `var(--background)` | `224 71% 4%` | `0 0% 100%` | Apply to base layouts and dashboard view canvases. |
| Container / Card | `var(--surface)` | `224 71% 7%` | `240 4.8% 95.9%` | Apply to tables, form panels, KPI widgets, calendar cells. |
| Border Divider | `var(--border)` | `220 14.3% 16%` | `240 5.9% 90%` | Apply to table cells, card boundaries, input lines. |
| Interactive Accent| `var(--primary)` | `263.4 70% 50.4%` | `263.4 70% 50.4%` | Buttons, checkboxes, active state links, focus outline rings. |
| Status: Available | `var(--success)` | `142.1 76.2% 36.3%`| `142.1 72% 29%` | Success badges, verified assets, resolved maintenance. |
| Status: Pending | `var(--warning)` | `47.9 95.8% 51.2%` | `38 92% 50%` | Reserved assets, ongoing bookings, pending maintenance. |
| Status: Lost/Alert | `var(--destructive)`| `346.8 77.2% 49.8%`| `346.8 72% 45%` | Lost assets, canceled items, overdue returns, errors. |

---

## 5. Typography Scales

Primary font rendering uses the CSS variable `var(--font-sans)` with size scales structured in rem configurations:

* **Headers & Page Titles** (Outfit Font, tracking-tight):
  * Page Title (`h1`): `1.875rem` (30px), font-weight: 700, line-height: `2.25rem`.
  * Section Title (`h2`): `1.5rem` (24px), font-weight: 600, line-height: `2rem`.
  * Widget Title (`h3`): `1.25rem` (20px), font-weight: 600, line-height: `1.75rem`.
* **Body & Form Text** (Inter Font):
  * Core Body Text: `0.875rem` (14px), font-weight: 400, line-height: `1.25rem`.
  * Table Header / Label: `0.75rem` (12px), font-weight: 600, letter-spacing: 0.05em, uppercase.
  * Captions & Descriptions: `0.75rem` (12px), font-weight: 400, color: `var(--text-secondary)`.
* **Identifications & Monospace** (JetBrains Mono Font):
  * Code Logs & Tags: `0.8125rem` (13px), font-weight: 500, letter-spacing: -0.02em (e.g. `AF-0014`).

---

## 6. Elevation & Shadows

Dark theme leverages border borders rather than shadows to define elevation. Light theme relies on ambient soft shadows to draw structural depth.

* **Flat Level (Border-only)**:
  * Dark: Border `1px solid var(--border)`. No shadow.
  * Light: Border `1px solid var(--border)`, shadow none.
* **Low Elevation (KPI Cards, Tables)**:
  * Dark: Background `var(--surface)`, border `1px solid var(--border)`.
  * Light: Background `var(--surface)`, shadow: `0 1px 3px rgba(0,0,0,0.05)`.
* **High Elevation (Dropdowns, Dialog Modals)**:
  * Dark: Background `var(--popover)`, border `1px solid var(--border)`, shadow: `0 20px 25px -5px rgba(0,0,0,0.5)`.
  * Light: Background `var(--popover)`, shadow: `0 10px 15px -3px rgba(240, 240, 240, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)`.

---

## 7. Motion & Transition Guidelines

Transitions must feel instant but smooth. The default transition duration is **150ms** using standard cubic-bezier functions.

* **Interactive Elements (Buttons, Table Rows, Cards)**:
  * Property: background-color, border-color, opacity.
  * Transition: `all 150ms cubic-bezier(0.4, 0, 0.2, 1)`.
* **Dialog Overlays & Slide-Out Sheets**:
  * Backdrop Blur Fade-in: Opacity 0 to 1, duration 200ms.
  * Content Slide-up: TranslateY (5%) to (0%), scale (95%) to (100%), duration 200ms easing out.
* **Micro-Animations (Pulse Skeletons)**:
  * Infinite pulse cycling opacity between 30% and 70% at a rate of 1.5 seconds.
  * Infinite spin duration 1s linear for loader tracks.

---

## 8. Accessibility (a11y) Standards

AssetFlow targets WCAG 2.1 Level AA compliance guidelines:

1. **Color Contrast Guidelines**:
   * Text colors against backgrounds must exceed **4.5:1** contrast.
   * Large heading text (>18pt) must exceed **3:1** contrast.
2. **Keyboard Traversal Traps**:
   * All clickable buttons, inputs, links, and select filters must have a visible `:focus-visible` state mapping `outline: 2px solid hsl(var(--border-focus))` with an offset of 2px.
   * Modal dialogs must trap focus inside their frame using React focus-trap patterns, preventing tab-focus from leaking to inactive background links.
3. **Screen Reader Assistive Markup**:
   * Icon buttons (e.g. table actions showing Lucide trashcan) must include `aria-label="Delete Asset Category"`.
   * Form inputs must bind directly to `<label>` tags using explicit `htmlFor` matching.
