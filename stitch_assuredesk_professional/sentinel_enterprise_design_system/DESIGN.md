---
name: Sentinel Enterprise Design System
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#1e293b'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#bec6e0'
  on-secondary: '#283044'
  secondary-container: '#3f465c'
  on-secondary-container: '#adb4ce'
  tertiary: '#bcc7de'
  on-tertiary: '#263143'
  tertiary-container: '#8691a7'
  on-tertiary-container: '#1f2a3c'
  error: '#ef4444'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
  success: '#10b981'
  warning: '#f59e0b'
  surface-deep: '#020617'
  border-subtle: '#334155'
typography:
  display-kpi:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
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
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  table-header:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  mono-data:
    fontFamily: Inter
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
  sidebar-width: 260px
  container-max: 1440px
  gutter: 1.5rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
  section-padding: 2.5rem
---

## Brand & Style

The design system is engineered for high-stakes Insurance Records Management, where reliability, security, and data density are paramount. The brand personality is **Technical, Secure, and Authoritative**, designed to instill confidence in users handling sensitive financial and personal data.

The visual style follows a **Corporate / Modern** aesthetic with a lean toward **Minimalism** to manage information density. The interface prioritizes clarity over decoration, using a sophisticated dark mode to reduce eye strain during prolonged administrative sessions. Depth is communicated through subtle tonal shifts rather than aggressive shadows, maintaining a sleek, high-fidelity appearance that feels like a precision instrument.

**Key Principles:**
- **Data-First:** Visual hierarchy always prioritizes key performance indicators and record accuracy.
- **Fortified Trust:** Use of structured grids and cold-toned neutrals to evoke a sense of digital security.
- **Operational Efficiency:** Minimalistic interactions and reduced visual noise to facilitate rapid data entry and auditing.

## Colors

This design system utilizes a **sophisticated dark mode** anchored by a deep navy and slate palette. The foundation is built on `surface-deep` for the primary background, providing a high-contrast base for data visualization.

- **Primary (#3b82f6):** A professional blue used for primary actions, active navigation states, and key interactive elements.
- **Surface Palette:** Layers are constructed using `secondary` (navigation/sidebar) and `tertiary` (card backgrounds) to create a clear spatial hierarchy without relying on light-source shadows.
- **Semantic Colors:** Green is reserved strictly for "Success" or "Valid" states, Orange for "Expiring Soon" warnings (30 days), and Red for "Urgent" alerts (7 days) or system errors.
- **Neutrals:** A range of slates (`#94a3b8`) provides accessible contrast for body text and labels against the dark background.

## Typography

The typography system relies exclusively on **Inter** to maximize legibility across dense data tables and complex forms. 

- **Data Hierarchy:** The `display-kpi` style is used for critical metrics on the dashboard to ensure immediate recognition.
- **Clarity:** Table headers and labels use a slightly smaller, medium-weight font with increased letter spacing (`label-caps`) to differentiate metadata from actual record content.
- **Adaptability:** For mobile contexts, headlines scale down to maintain vertical space, while body text remains consistent at 14px-16px to ensure accessibility.
- **Mono-styling:** While Inter is a sans-serif, its numerical clarity is utilized for policy numbers and currency values to ensure alignment in tabular layouts.

## Layout & Spacing

The system employs a **fixed-fluid hybrid grid**. The sidebar remains fixed at `260px`, while the main content area utilizes a fluid 12-column grid that conforms to a `1440px` maximum width to prevent excessive line lengths on ultra-wide monitors.

- **Rhythm:** An 8px (0.5rem) base unit governs all spacing.
- **Dashboard Structure:** Content is organized into distinct horizontal rows. Vertical spacing between dashboard "widgets" is set to `stack-lg`, while internal card elements use `stack-sm` to maintain a tight, information-dense feel.
- **Forms:** Input fields are grouped logically using `stack-md`. Multi-column forms (e.g., Policy Registration) switch from 2-column to 1-column layouts at the `768px` breakpoint.
- **Data Density:** Tables use a compact padding model (`0.75rem` vertical) to maximize the number of records visible above the fold.

## Elevation & Depth

In this dark-themed enterprise environment, depth is established through **Tonal Layers** rather than traditional shadows, which can appear "muddy" on deep navy backgrounds.

- **Level 0 (Base):** `surface-deep` (#020617) for the main application background.
- **Level 1 (Navigation):** `secondary` (#0f172a) for the sidebar and top header, creating a structural "frame."
- **Level 2 (Cards/Widgets):** `tertiary` (#1e293b) for content containers. These use a **low-contrast outline** (`border-subtle`) to define boundaries.
- **Level 3 (Modals/Popovers):** `surface-bright` (#1e293b) with a subtle `10% white` inner glow on the top border and a diffused `24px` black shadow to lift the element above the UI.

Transitions between levels are sharp and intentional, reinforcing the "secure" and "structured" nature of the software.

## Shapes

The shape language is **Soft (0.25rem)**, leaning towards a more geometric and rigid professional look.

- **Standard Elements:** Buttons, input fields, and small badges use the base `rounded` (4px) setting.
- **Large Containers:** Dashboard cards and Modals use `rounded-lg` (8px) to provide a subtle distinction between the container and the elements within it.
- **Systemic Consistency:** Sharp corners are avoided to prevent the UI from feeling aggressive, but large "pill" shapes are restricted to status badges and toggle switches only.

## Components

**Buttons & Triggers**
- **Primary:** Solid `#3b82f6` with white text. High-contrast, 4px rounded corners.
- **Secondary:** Transparent background with `border-subtle` and hover states that shift to `tertiary`.
- **Loading State:** Buttons must display a center-aligned spinner; the label text is hidden to maintain button dimensions.

**Cards & Widgets**
- **Structure:** `tertiary` background with a 1px solid `border-subtle`.
- **Header:** Cards include a 48px height header with a divider for "Smart Widget" toggles.
- **Hierarchy:** KPI cards feature prominent `display-kpi` numbers with a secondary "trend indicator" (e.g., +12% in success green).

**Input Fields**
- **State:** Default state uses `surface-deep` background to create an "inset" feel. Focus state uses a 2px `primary` border.
- **Validation:** Error states use `named-colors.error` for both the border and a small 12px caption text below the field.

**Data Tables**
- **Headers:** Sticky headers with a `surface-bright` background and `label-caps` typography.
- **Rows:** Zebra striping is avoided in favor of 1px bottom borders. Hovering over a row should highlight it in a slightly lighter slate to assist horizontal tracking.

**Badges & Status Icons**
- **Role Badges:** Subdued backgrounds (e.g., 10% opacity of the role color) with high-contrast text.
- **Indicators:** Small 8px circles (Success/Warning/Error) used in table rows for rapid status scanning.