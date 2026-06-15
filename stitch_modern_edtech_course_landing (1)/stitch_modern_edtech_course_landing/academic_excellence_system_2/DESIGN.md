---
name: Academic Excellence System
colors:
  surface: '#0d1322'
  surface-dim: '#0d1322'
  surface-bright: '#33394a'
  surface-container-lowest: '#080e1d'
  surface-container-low: '#151b2b'
  surface-container: '#191f2f'
  surface-container-high: '#242a3a'
  surface-container-highest: '#2f3445'
  on-surface: '#dde2f8'
  on-surface-variant: '#c5c5d3'
  inverse-surface: '#dde2f8'
  inverse-on-surface: '#2a3040'
  outline: '#8e909d'
  outline-variant: '#444651'
  surface-tint: '#b5c4ff'
  primary: '#b5c4ff'
  on-primary: '#00287c'
  primary-container: '#2e4a9e'
  on-primary-container: '#afc0ff'
  inverse-primary: '#3e59ae'
  secondary: '#ffb59a'
  on-secondary: '#5b1b00'
  secondary-container: '#cd4802'
  on-secondary-container: '#fffbff'
  tertiary: '#b7c8e1'
  on-tertiary: '#213145'
  tertiary-container: '#415167'
  on-tertiary-container: '#b3c3dd'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b5c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#234194'
  secondary-fixed: '#ffdbcf'
  secondary-fixed-dim: '#ffb59a'
  on-secondary-fixed: '#380d00'
  on-secondary-fixed-variant: '#802900'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#0d1322'
  on-background: '#dde2f8'
  surface-variant: '#2f3445'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style

The design system is engineered for a premium coaching academy, projecting a persona of scholarly authority combined with modern technological precision. It targets high-achieving students and professionals who seek structured, high-trust environments for academic advancement.

The aesthetic follows a **Corporate / Modern** style with subtle **Glassmorphic** influences to prevent the dark interface from feeling heavy. It prioritizes clarity, rigorous alignment, and a sophisticated depth model that suggests a focused, distraction-free study environment. The emotional response is one of calm confidence and elite institutional reliability.

## Colors

The palette is anchored by deep, nocturnal blues to maintain an "Academic" feel while ensuring visual comfort during long study sessions.

- **Primary:** The brand's Deep Blue is shifted to a more luminous `#2E4A9E` for better contrast against dark backgrounds, used for active states and key branding.
- **Accent:** Professional Orange (`#FF6B2C`) is reserved strictly for primary Call-to-Action (CTA) elements and progress indicators to provide a warm, motivating focal point.
- **Surfaces:** A tiered navy-charcoal system creates hierarchy. The base background is `#0B1120`, with cards and containers utilizing `#161E2E`.
- **Typography:** Headings use high-contrast White (`#F8FAFC`) to command authority, while body text uses a softer Light Grey (`#94A3B8`) to reduce eye strain and improve reading endurance.

## Typography

This design system employs a multi-typeface strategy to balance modern aesthetics with functional clarity.

- **Headlines:** `Manrope` provides a refined, balanced, and professional look. Its geometric foundations feel modern yet trustworthy.
- **Body:** `Inter` is used for its systematic and utilitarian qualities, ensuring maximum legibility for dense academic content.
- **Labels/Data:** `JetBrains Mono` is used sparingly for metadata, course codes, or technical indicators to provide a "precise" and "organized" feel.

Tighten letter-spacing on larger headlines to increase the "premium" feel. For mobile, ensure large display headings scale down to prevent excessive line-breaking.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy on desktop to maintain an organized, "columnar" feel reminiscent of traditional academic journals, transitioning to a fluid model on smaller devices.

- **Desktop:** 12-column grid, 1200px max-width, 24px gutters.
- **Tablet:** 8-column grid, 24px margins.
- **Mobile:** 4-column grid, 16px margins.

Spacing rhythm is strictly based on 8px increments. Large vertical gaps (`lg` and `xl`) should be used between major sections to emphasize a premium, airy feel that avoids the "clutter" of typical educational portals.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows, which can appear muddy in dark mode.

- **Layer 0 (Background):** `#0B1120` — The lowest level.
- **Layer 1 (Cards/Surface):** `#161E2E` — Standard container level.
- **Layer 2 (Popovers/Modals):** `#1F2937` — Elevated level, using a 1px border of `#334155` (Slate 700) to define edges.

Shadows, where used for modals, should be ultra-diffused: `0 20px 40px rgba(0, 0, 0, 0.4)` with no color tinting to keep the aesthetic clean and neutral. Semi-transparent overlays (Backdrop Blur 12px) should be used behind modals to maintain context while focusing the user.

## Shapes

The shape language is **Soft (0.25rem)**. This subtle rounding provides a modern touch without sacrificing the professional, institutional feel of a coaching academy. 

- **Small elements (Buttons, Inputs):** 4px (0.25rem) radius.
- **Medium elements (Cards, Containers):** 8px (0.5rem) radius.
- **Large elements (Hero sections):** 12px (0.75rem) radius.

Avoid fully rounded "pill" shapes for buttons to maintain a more formal, traditional corporate appearance.

## Components

### Buttons
- **Primary:** Professional Orange (`#FF6B2C`) with white text. High-contrast, used for the main conversion goal.
- **Secondary:** Deep Blue (`#2E4A9E`) or transparent with a 1px border.
- **Ghost:** No background, primary color text. Used for less critical actions.

### Inputs
Fields use the `#1F2937` background with a subtle `#334155` border. On focus, the border transitions to Primary Blue with a 2px outer glow (ring). Label text uses `label-sm` in `text-secondary`.

### Cards
Cards use the `#161E2E` surface color. For "Featured" content, a subtle 1px border in the Primary Blue (`#2E4A9E`) at 30% opacity can be applied to draw the eye without being aggressive.

### Progress Indicators
Educational progress bars should use a gradient from Deep Blue to Professional Orange to signify the "warmth" of achievement and movement toward a goal.

### Lists
Academic curriculum lists should use `JetBrains Mono` for numbering/bullets to emphasize structure and precision.