---
name: Lumina Academic
colors:
  surface: '#0e1513'
  surface-dim: '#0e1513'
  surface-bright: '#333b39'
  surface-container-lowest: '#09100e'
  surface-container-low: '#161d1b'
  surface-container: '#1a211f'
  surface-container-high: '#242b2a'
  surface-container-highest: '#2f3634'
  on-surface: '#dde4e1'
  on-surface-variant: '#bacac5'
  inverse-surface: '#dde4e1'
  inverse-on-surface: '#2b3230'
  outline: '#859490'
  outline-variant: '#3c4a46'
  surface-tint: '#3cddc7'
  primary: '#57f1db'
  on-primary: '#003731'
  primary-container: '#2dd4bf'
  on-primary-container: '#00574d'
  inverse-primary: '#006b5f'
  secondary: '#c8c6c8'
  on-secondary: '#303032'
  secondary-container: '#474649'
  on-secondary-container: '#b7b4b7'
  tertiary: '#dbd9dd'
  on-tertiary: '#303033'
  tertiary-container: '#bfbdc1'
  on-tertiary-container: '#4d4c4f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#62fae3'
  primary-fixed-dim: '#3cddc7'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005047'
  secondary-fixed: '#e4e2e4'
  secondary-fixed-dim: '#c8c6c8'
  on-secondary-fixed: '#1b1b1d'
  on-secondary-fixed-variant: '#474649'
  tertiary-fixed: '#e4e1e5'
  tertiary-fixed-dim: '#c8c6c9'
  on-tertiary-fixed: '#1b1b1e'
  on-tertiary-fixed-variant: '#47464a'
  background: '#0e1513'
  on-background: '#dde4e1'
  surface-variant: '#2f3634'
typography:
  display:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  code:
    fontFamily: Geist Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  row-height-sm: 32px
  row-height-md: 44px
---

## Brand & Style

The design system is engineered for the high-efficiency environment of academic administration. It adopts a **Modern Corporate** aesthetic with a focus on high information density, drawing inspiration from developer-centric tools like Linear.

The personality is authoritative yet precise. It avoids the playfulness of consumer apps in favor of a "pro-tool" feel, using a deep monochromatic base to let student data and attendance status occupy the visual foreground. The UI relies on structured grids, subtle borders, and a monochromatic foundation, using a vibrant teal accent strictly for primary actions and critical data indicators. The goal is to evoke a sense of focused productivity and institutional reliability.

## Colors

This design system utilizes a "Deep Dark" palette to reduce eye strain during prolonged administrative sessions. 

- **Background & Surface:** The core canvas is `#0a0a0b`. Interactive surfaces and cards use `#161618` to create a subtle layered effect.
- **Accents:** The Primary Teal (`#2dd4bf`) is the sole source of high-energy color, used for success states, primary buttons, and active navigation markers.
- **Borders:** A consistent `#27272a` is used for all structural lines, ensuring containers are defined without excessive contrast.
- **Typography:** Primary text is nearly white (`#fafafa`) for maximum legibility, while secondary metadata uses a muted zinc (`#a1a1aa`).

## Typography

The system utilizes **Geist** for its technical precision and optimal legibility in data-heavy views. 

- **Scale:** A tight scale is used to maintain high information density. Body-md (14px) is the default for most data entries and list items.
- **Hierarchy:** Headlines use semi-bold weights and slight negative letter-spacing to appear more compact and "engineered."
- **Monospace:** A monospace variant is reserved for student IDs, timestamps, and numerical attendance counts to ensure vertical alignment in tabular data.

## Layout & Spacing

This design system follows a **12-column fluid grid** for dashboard views, with a fixed sidebar for primary navigation.

- **Density:** We utilize a 4px base unit. For data tables, a "compact" mode is default, with 8px vertical padding between rows.
- **Margins:** Standard page containers feature 24px of internal padding.
- **Breakpoints:** 
  - **Desktop (1280px+):** Full 12-column layout with persistent sidebar.
  - **Tablet (768px - 1279px):** 8-column layout, sidebar collapses to icons.
  - **Mobile (<767px):** Single column layout, horizontal scrolling for data tables, and bottom-sheet navigation.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** and **Subtle Outlines** rather than dramatic shadows.

- **Level 0 (Base):** `#0a0a0b` - The main application background.
- **Level 1 (Surface):** `#161618` - Used for cards, navigation bars, and modals. These surfaces feature a 1px solid border of `#27272a`.
- **Level 2 (Interaction):** Hover states use a slightly lighter background (`#212124`) to indicate interactivity.
- **Shadows:** Only used for floating elements like dropdowns or popovers. Shadows should be ultra-soft: `0 8px 30px rgba(0, 0, 0, 0.5)` with no spread, ensuring the focus remains on the border definition.

## Shapes

The shape language is "Soft-Square," reinforcing the professional, tool-like nature of the app.

- **Components:** Standard buttons, input fields, and chips use a `4px` radius (`0.25rem`).
- **Containers:** Dashboard cards and large modular blocks use an `8px` radius (`0.5rem`).
- **Icons:** Use linear, 2px stroke icons with square terminals to match the Geist typeface and sharp corner radius of the UI components.

## Components

### Buttons
- **Primary:** Solid Teal (`#2dd4bf`) background with Black text (`#000000`) for maximum contrast.
- **Secondary:** Transparent background with a `#27272a` border and `#fafafa` text.
- **Ghost:** No border or background; text color is `#a1a1aa`, shifting to `#fafafa` on hover.

### Inputs & Selects
- Fields use a `#161618` background with a 1px `#27272a` border.
- Active/Focus state: Border changes to Teal (`#2dd4bf`) with a subtle 2px outer glow of the same color at 20% opacity.

### Attendance Chips
- **Present:** Teal text on a 10% opacity Teal background.
- **Absent:** Red/Rose text on a 10% opacity Red background.
- **Late:** Amber text on a 10% opacity Amber background.

### Data Tables
- Header rows use a slightly darker background than the body.
- Borders are only used horizontally between rows to maintain a clean vertical flow.
- Selected rows use a subtle Teal left-edge highlight (4px width).

### Sidebar
- High-contrast active states: Icons and text turn Teal when active, with a small vertical indicator on the far left.