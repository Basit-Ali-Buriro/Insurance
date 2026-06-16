---
name: Obsidian Enterprise
colors:
  surface: '#131319'
  surface-dim: '#131319'
  surface-bright: '#39383f'
  surface-container-lowest: '#0d0e13'
  surface-container-low: '#1b1b21'
  surface-container: '#1f1f25'
  surface-container-high: '#2a2930'
  surface-container-highest: '#34343b'
  on-surface: '#e4e1ea'
  on-surface-variant: '#c1c6d7'
  inverse-surface: '#e4e1ea'
  inverse-on-surface: '#303036'
  outline: '#8b90a0'
  outline-variant: '#414755'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e69'
  primary-container: '#4b8eff'
  on-primary-container: '#00285c'
  inverse-primary: '#005bc1'
  secondary: '#ecb2ff'
  on-secondary: '#520071'
  secondary-container: '#6f258e'
  on-secondary-container: '#e59dff'
  tertiary: '#c8c6c5'
  on-tertiary: '#313030'
  tertiary-container: '#929090'
  on-tertiary-container: '#2a2a29'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#f8d8ff'
  secondary-fixed-dim: '#ecb2ff'
  on-secondary-fixed: '#320047'
  on-secondary-fixed-variant: '#6c228c'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474646'
  background: '#131319'
  on-background: '#e4e1ea'
  surface-variant: '#34343b'
  deep-charcoal: '#0F0F12'
  slate-gray: '#1E1E24'
  electric-blue: '#007AFF'
  emerald-green: '#10B981'
  vivid-orange: '#F59E0B'
  crimson-red: '#EF4444'
  royal-purple: '#8E44AD'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  sidebar-width: 260px
  table-row-height: 40px
---

## Brand & Style

The design system is engineered for high-stakes enterprise resource planning, where data density and clarity are paramount. The brand personality is **authoritative, precise, and sophisticated**, evoking a sense of security and institutional strength.

The chosen design style is **Modern Corporate with a Minimalist lean**. It utilizes a "Deep Dark" aesthetic to reduce eye strain during long working sessions while employing high-chroma accents to guide user attention toward critical actions and system statuses. The interface relies on a strict structural grid, tonal layering for depth, and premium typography to differentiate it from legacy, cluttered ERP software. 

Key visual principles include:
- **Functional High-Contrast:** Color is used exclusively for information hierarchy and status signaling.
- **Data-First Density:** Maximum information visibility with minimal decorative chrome.
- **Architectural Rigor:** Perfectly aligned elements and consistent stroke weights to reinforce a sense of reliability.

## Colors

The palette is optimized for a premium dark-mode experience, utilizing a tiered grayscale for depth and vibrant semantic colors for data state communication.

- **Surface Strategy:** The background uses `deep-charcoal` (#0F0F12) to provide a true-black foundation. `slate-gray` (#1E1E24) is used for cards, sidebars, and elevated surfaces to create a clear visual hierarchy.
- **Primary Action:** `electric-blue` is the signature brand color, used for primary buttons, active states, and selection indicators.
- **Semantic Signaling:**
    - **Success (`emerald-green`):** Positive trends, completed transactions, and "Ok" statuses.
    - **Warning (`vivid-orange`):** Pending actions, 7-day license alerts, and non-critical system notifications.
    - **Danger (`crimson-red`):** Critical errors, expired licenses, and data deletion.
- **Accents:** `royal-purple` is used sparingly for secondary hierarchy, such as specific category tags or distinct departmental modules.

## Typography

This design system uses a dual-font strategy to balance character with utility. 

- **Outfit (Headlines):** Used for large displays and section headers. Its geometric construction provides a modern, premium feel.
- **Inter (Body/Data):** Used for all functional text, tables, and labels. Its high x-height and excellent legibility make it ideal for data-heavy ERP environments.

**Data Display:** Use `mono-data` (Inter with Medium weight) for numerical values in tables to ensure vertical alignment and quick scanning. All labels for status or metadata should use `label-sm` with uppercase styling to clearly distinguish them from interactive content.

## Layout & Spacing

The layout utilizes a **Fixed-Fluid Hybrid Grid** optimized for 1440p desktop displays, the standard for enterprise workflows.

- **Sidebar:** A persistent 260px left-hand navigation ensures top-level modules are always accessible.
- **Grid Rhythm:** A tight 4px base unit drives all spacing. ERP efficiency is achieved by reducing white space in data views while maintaining clear grouping.
- **Tables:** Rows are capped at a 40px height to maximize the "above-the-fold" record count. Sticky headers are mandatory for all scrollable data containers.
- **Margins:** Standard page containers use 32px (`xl`) padding from the viewport edge, while internal card padding is set to 16px (`md`) to maintain density.

## Elevation & Depth

In this "Deep Dark" system, depth is conveyed through **Tonal Layering** and **Subtle Outlines** rather than traditional drop shadows, which can appear muddy on near-black backgrounds.

1.  **Level 0 (Background):** `deep-charcoal` (#0F0F12). The furthest back layer.
2.  **Level 1 (Surface):** `slate-gray` (#1E1E24). Used for primary content cards and sidebars.
3.  **Level 2 (Overlay):** A lighter tint of gray with a 1px inner border (10% opacity white) to define modals or dropdown menus.
4.  **Interactive States:** Hovering over a card or table row should trigger a subtle increase in luminosity or a 1px `electric-blue` border, rather than a shadow.

For critical status banners (Warning/Urgency), use flat, high-saturation color blocks to "pull" the element to the front of the user's visual field.

## Shapes

The design system uses a **Soft (0.25rem)** shape language. This subtle rounding provides a modern touch without sacrificing the professional, "engineered" feel of the application.

- **Buttons & Inputs:** 4px (`rounded-sm`) corner radius.
- **KPI Cards:** 8px (`rounded-md`) corner radius.
- **Status Tags:** Fully rounded (pill) to distinguish them from interactive buttons.
- **Data Tables:** The main container uses an 8px radius, but internal cells and rows remain sharp to ensure grid lines are perfectly clean.

## Components

### Buttons
- **Primary:** Solid `electric-blue` with white text.
- **Secondary:** Transparent background with a 1px `slate-gray` border.
- **Ghost:** No background or border; uses `electric-blue` text for actions within table rows.

### Tables (High-Fidelity)
- **Header:** `slate-gray` background, `label-sm` typography, and 1px bottom border.
- **Rows:** Zebra-striping is avoided; use 1px subtle dividers instead. 
- **Sticky Header:** The header remains fixed at the top of the `.datatable-wrapper` during vertical scrolls.
- **Search Highlight:** Search results must use a temporary yellow background highlight that fades out over 4 seconds.

### KPI Cards
- **Structure:** Headline-sm for the value, label-md for the title.
- **Trend Indicators:** Up/Down arrows using `emerald-green` (positive) or `crimson-red` (negative).
- **Background:** `slate-gray` with a subtle 1px border.

### Sidebar Navigation
- **Active State:** A vertical 4px `electric-blue` bar on the left edge of the menu item.
- **Icons:** Linear, 20px icons with a medium stroke weight.

### Input Fields
- **Default:** `deep-charcoal` background with a 1px `slate-gray` border.
- **Focus:** Border changes to `electric-blue` with a subtle outer glow (0px 0px 4px).