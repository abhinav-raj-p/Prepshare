---
name: Academic Excellence System
colors:
  surface: '#f5fafe'
  surface-dim: '#d5dbdf'
  surface-bright: '#f5fafe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4f8'
  surface-container: '#e9eff3'
  surface-container-high: '#e3e9ed'
  surface-container-highest: '#dee3e7'
  on-surface: '#161c1f'
  on-surface-variant: '#45464f'
  inverse-surface: '#2b3134'
  inverse-on-surface: '#ecf1f5'
  outline: '#757680'
  outline-variant: '#c5c6d0'
  surface-tint: '#4d5d8b'
  primary: '#021541'
  on-primary: '#ffffff'
  primary-container: '#1a2b56'
  on-primary-container: '#8393c5'
  inverse-primary: '#b5c5f9'
  secondary: '#5344d3'
  on-secondary: '#ffffff'
  secondary-container: '#6d5fee'
  on-secondary-container: '#fffbff'
  tertiary: '#310c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#531b00'
  on-tertiary-container: '#fb6514'
  error: '#EF4444'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b5c5f9'
  on-primary-fixed: '#051944'
  on-primary-fixed-variant: '#354572'
  secondary-fixed: '#e4dfff'
  secondary-fixed-dim: '#c5c0ff'
  on-secondary-fixed: '#140067'
  on-secondary-fixed-variant: '#3d28be'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb597'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7e2c00'
  background: '#f5fafe'
  on-background: '#161c1f'
  surface-variant: '#dee3e7'
  surface-subtle: '#F8FAFC'
  success: '#10B981'
  pending: '#F59E0B'
  border-light: '#E2E8F0'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

This design system is engineered for a high-fidelity educational environment tailored to Indian MCA aspirants. The brand personality is **authoritative, premium, and reliable**, positioning the platform as a serious partner in a student's career journey. 

The visual direction follows a **Modern Corporate** aesthetic. It prioritizes clarity and conversion through structured layouts and a sophisticated color application. The experience should feel like a prestigious digital campus—spacious enough to reduce cognitive load during intense study sessions, yet dense enough to provide comprehensive information at a glance. We lean into high-quality typography and subtle depth to differentiate the platform from more chaotic, mass-market educational tools.

## Colors

The palette is anchored by a **Deep Blue (#1A2B56)**, chosen to evoke stability and institutional trust. This is the primary color used for global navigation, primary buttons, and heavy headers. 

- **Primary:** Deep Blue for core branding and high-importance interactions.
- **Secondary:** A vibrant Indigo-Violet (#5A4BDA) used for secondary actions and progress indicators, bridging the gap between education and technology.
- **Tertiary/Accent:** A high-visibility Orange (#FB6514) reserved strictly for CTA buttons and "New" badges to drive conversion.
- **Status Colors:** Functional tokens for payments and performance tracking—Success (Green), Pending (Amber), and Error (Red)—are used at moderate saturations to ensure legibility against white surfaces.
- **Neutral:** We use a deep Charcoal (#1B2124) for text to maintain high contrast, while surfaces utilize a clean White (#FFFFFF) with very light Cool Gray (#F8FAFC) for sectional backgrounds.

## Typography

This design system exclusively uses **Plus Jakarta Sans** to achieve a modern, SaaS-inspired look that feels energetic and approachable. 

- **Headlines:** Use Bold (700) or ExtraBold (800) weights with tighter letter-spacing to create a strong visual anchor for course titles and marketing hero sections.
- **Body:** Standard body text is set to 16px for optimal readability of educational content. A 1.6 line-height is strictly enforced to prevent eye fatigue during long reading sessions.
- **Labels:** Small labels and UI metadata utilize Medium or SemiBold weights to remain distinct from body copy at smaller sizes.
- **Mobile Scaling:** Headline sizes are reduced significantly for mobile to ensure clear hierarchies on smaller screens without excessive wrapping.

## Layout & Spacing

The design utilizes a **Fixed Grid** model for desktop to maintain the premium, structured feel of a professional institution. 

- **Grid:** A 12-column grid with a 1280px max-width container. 
- **Rhythm:** An 8px base unit (0.5rem) governs all spacing. All margins and paddings must be multiples of 8.
- **Responsive Behavior:** 
  - **Desktop (1024px+):** 12 columns, 40px margins.
  - **Tablet (768px - 1023px):** 8 columns, 24px margins. Content cards generally switch to 2-column stacks.
  - **Mobile (Up to 767px):** 4 columns, 16px margins. Layouts reflow to a single column vertical stack, with horizontal scrolling reserved for "related courses" or "featured tutors" modules.

## Elevation & Depth

To convey a sense of quality and "premium coaching," this design system uses **Tonal Layers** combined with **Ambient Shadows**.

- **Level 0 (Background):** White (#FFFFFF) or Subtle Gray (#F8FAFC).
- **Level 1 (Cards):** White background with a very soft, diffused shadow (0px 4px 20px rgba(26, 43, 86, 0.06)).
- **Level 2 (Hover/Active):** Slightly deeper shadow (0px 8px 30px rgba(26, 43, 86, 0.10)) and a 1px border using `border-light`.
- **Level 3 (Modals/Overlays):** Distinct elevation with a 15% opacity Deep Blue shadow and a backdrop blur of 8px to maintain focus on the task at hand.

Avoid harsh black shadows; always tint shadows with the Primary Deep Blue to maintain color harmony.

## Shapes

The shape language is consistently **Rounded**, striking a balance between friendly education and professional rigor.

- **Standard Elements:** Cards, input fields, and standard buttons use a 0.5rem (8px) radius.
- **Large Containers:** Hero sections or large modal overlays use a 1rem (16px) radius.
- **Interactive Small Elements:** Tags and badges should use a "Pill" shape (full rounding) to differentiate them from functional buttons.

## Components

- **Buttons:** 
  - *Primary:* Deep Blue background, white text. No gradient. 8px radius.
  - *Secondary:* Ghost style with 1px `border-light` or a light tint of the Secondary color.
  - *Conversion:* Tertiary Orange (#FB6514) background, Bold weight text. Used for "Enroll Now" or "Pay Securely."
- **Cards:** White background, 12px rounded corners, Level 1 shadow. Header sections of cards may have a subtle `surface-subtle` top-border.
- **Input Fields:** 8px radius, 1px `border-light`. On focus, the border transitions to Primary Deep Blue with a 2px outer glow.
- **Status Chips:** Small, semi-transparent backgrounds of the status color with high-contrast text (e.g., light green background with dark green text for "Payment Success").
- **Lists:** Use a 1px horizontal separator (#E2E8F0). In dashboards, list items should have a hover state that lightens the background to `surface-subtle`.
- **Course Progress Bars:** Use the Secondary Indigo color for the fill and a light version of the same hue for the track.