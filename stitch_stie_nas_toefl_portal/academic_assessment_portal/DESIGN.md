---
name: Academic Assessment Portal
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#554336'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#887364'
  outline-variant: '#dbc2b0'
  surface-tint: '#904d00'
  primary: '#8d4b00'
  on-primary: '#ffffff'
  primary-container: '#b15f00'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb77d'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#006948'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855d'
  on-tertiary-container: '#f5fff7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc3'
  primary-fixed-dim: '#ffb77d'
  on-primary-fixed: '#2f1500'
  on-primary-fixed-variant: '#6e3900'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-mono:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.25rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a high-stakes, focused, and collegiate atmosphere engineered specifically for standardized English proficiency testing. Drawing cues from formal academic institutions and the emblem of STIE Nasional Banjarmasin, the design language embodies rigor, clarity, and institutional authority while mitigating candidate anxiety.

The visual style is **Corporate / Modern** inflected with strict **Utilitarian Minimalism**:
- **Cognitive Clarity:** The UI reduces non-essential cognitive load during exam workflows. Every screen emphasizes high information density without visual crowding, predictable navigation structures, and accessible typography.
- **Institutional Dignity:** Colors borrow from collegiate heritage—anchored by institutional amber gold and grounded by commanding deep navy and slate, supported by functional emerald accents for progress and submission confirmation.
- **Distraction-Free Environment:** Eliminates extraneous decorative treatments, saturated background graphics, and abrupt micro-interactions in favor of calm, high-contrast, reading-optimized surfaces.

## Colors

The palette is tuned for prolonged readability under timed testing conditions:

- **Primary (`#D97706` - Institutional Amber):** Reflects the official torch and insignia yellow of the academy. Applied deliberately to primary action triggers, current question status markers, active tab indicators, and institutional branding. Provides warmth and distinct focus without triggering visual panic.
- **Secondary (`#0F172A` - Collegiate Midnight Slate):** Serves as the bedrock of structural elements—top headers, candidate identity bars, section banners, and critical typography. Delivers optimal contrast against neutral work surfaces.
- **Tertiary (`#059669` - Academic Emerald):** Reserved strictly for positive completion states, answered question beads, audio playback confirmation, and successful test-token verifications.
- **Neutral Palette (`#F8FAFC`, `#F1F5F9`, `#FFFFFF`, `#334155`):** Clean, off-white slate backdrops prevent retina fatigue during 120-minute testing intervals. Surface boundaries rely on soft gray borders (`#E2E8F0`) to segregate reading passages from question viewports.
- **Alert / Timer Accent (`#DC2626`):** Deployed selectively when the exam countdown timer drops beneath 5 minutes or for audio recording error alerts.

## Typography

The typographic hierarchy balances structural authority with effortless reading comprehension:

- **Headlines & Section Prompts (`Plus Jakarta Sans`):** Selected for crisp, contemporary letterforms with balanced geometric proportions. Delivers clarity in section headers (Listening Comprehension, Structure & Written Expression, Reading Comprehension) and exam metadata.
- **Passages & Multiple-Choice Body (`Inter`):** Selected for exceptional screen legibility, tall x-height, and neutral character design. Long reading comprehension passages remain comfortable to parse across multiple paragraphs.
- **Numerical Timers & Question Badges (`label-mono` / `Inter tabular-nums`):** Numbers in countdown timers and question index grids utilize tabular numerals to prevent layout jitter during active countdowns.

## Layout & Spacing

The portal adheres to a robust, dual-pane examination layout model:

- **Exam Viewport Layout (Split-Screen Master):**
  - **Left Pane (50% or 55% Desktop Width):** Dedicated passage, audio player controller, or context prompt. Independent vertical scrolling ensures test-takers never lose sight of reading context.
  - **Right Pane (45% or 50% Desktop Width):** Houses the active question prompt, choice radio fields, question flagging tools, and section pagination.
- **Top Utility Header (Fixed 64px):** Always pinned. Accommodates candidate identity (Photo, Name, Student ID), persistent section timer, volume control, and the "Submit Section" emergency review trigger.
- **Bottom Navigation Ribbon (Fixed 60px):** Includes question status matrix (answered, unanswered, flagged for review), "Previous", and "Next" question controllers.
- **Breakpoints:**
  - **Desktop (1024px+):** Pinned split-pane reading and answering workspace.
  - **Tablet (768px - 1023px):** Side-by-side or stacked pane with sticky split-tab toggling ("View Passage" / "Answer Question").
  - **Mobile (< 768px):** Dedicated verification, score lookup, and instruction workflows. Active exam engines mandate minimum 1024px resolution for formal assessment integrity.

## Elevation & Depth

To maximize testing focus and minimize visual noise, elevation is constructed strictly through **tonal layering and low-contrast architectural borders**:

- **Canvas Base:** `#F8FAFC` provides a calm backdrop.
- **Surface Elevation 1 (Cards, Passages, Question Boxes):** `#FFFFFF` surfaces bounded by crisp `1px solid #E2E8F0` borders. No drop shadows are used inside the active testing interface to prevent blurred distractions.
- **Surface Elevation 2 (Sticky Headers, Footers, Modals):** Pinned bars utilize `#FFFFFF` with a subtle bottom divider `1px solid #CBD5E1` and a soft ambient rim shadow: `0 4px 12px -2px rgba(15, 23, 42, 0.05)`.
- **Active Selection & Focus States:** Question options chosen by the student feature a `1.5px solid #D97706` outline and a soft amber background tint (`rgba(217, 119, 6, 0.04)`), creating definitive state feedback.
- **Overlay Dialogs (Section Submit / Review Grid):** Background backdrop utilizes a deep slate blur `rgba(15, 23, 42, 0.45)` with `backdrop-filter: blur(4px)`.

## Shapes

The design system employs a **Soft (`1`)** shape language:
- Standard elements (buttons, inputs, question option cards) utilize `0.25rem` (4px) to `0.375rem` (6px) border radii.
- Larger modular containers (passage cards, verification camera viewport, modal frames) utilize `0.5rem` (8px).
- Navigation beads and timer status indicators utilize full round (`9999px`) geometries to represent atomic state indicators.

This structured, restrained corner radius reinforces an institutional, certified examination feel—avoiding overly playful pill shapes while maintaining comfortable softness.

## Components

### Buttons
- **Primary Exam Actions ("Next Question", "Confirm & Proceed"):** Filled institutional amber (`#D97706`) with white bold text, subtle hover shift (`#B45309`), active state inset.
- **Secondary Actions ("Previous Question", "Clear Answer"):** Transparent surface with `#0F172A` text, bordered in `1px solid #CBD5E1`.
- **Utility / Review ("Review Flagged", "Review Section"):** Midnight slate `#0F172A` filled button with crisp white typography.
- **Critical / Final Submit:** Emerald green `#059669` trigger with warning confirmation modal.

### Question Option Cards (Radio Selectors)
- Bordered modular blocks spanning the full right-pane width.
- Default: `#FFFFFF` background, `1px solid #E2E8F0` border, `0.375rem` radius, containing option letter badge `(A, B, C, D)` in muted slate.
- Hover: Border shifts to `#94A3B8`.
- Selected: Border illuminates to `2px solid #D97706`, option badge fills with `#D97706` with white text, background receives `#FFFBEB` fill.

### Audio Player Component (Listening Section)
- Streamlined player containing non-scrubable track bar (preventing test manipulation), discrete play count counter ("Plays Remaining: 1/1"), sound level regulator, and visual waveform status indicator.

### Question Matrix & Flagging Palette
- Circular beads (28px × 28px):
  - **Unanswered:** Light gray outline `#CBD5E1` with slate number.
  - **Answered:** Solid `#059669` fill with white number.
  - **Flagged for Review:** `#D97706` filled upper-right bookmark tag with bold stroke.
  - **Current Question:** Double-ring outline in `#0F172A`.

### Timer Display
- Tabular numeric card with amber icon indicator. Switches to high-contrast red warning badge (`#DC2626`) when under 5 minutes remaining with non-disruptive pulse transition.

### Student Verification Viewport
- Clean framing card housing candidate biometric photo validation, webcam feed frame with alignment oval, institutional ID display, and secure test-token input field with uppercase letter spacing.