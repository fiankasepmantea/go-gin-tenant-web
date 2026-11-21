---
version: alpha
name: Tenant Console
description: Responsive admin console and marketing site for go-gin-tenant-template (multi-tenant SaaS). Light-first with dark mode, one teal accent, Inter variable typography, dense and calm.
colors:
  # Our own palette. Structure and scales are informed by measured extractions of
  # linear.app, resend.com and vercel.com (see Overview); no color is copied from them.
  background: "#FAFAF9"
  surface: "#FFFFFF"
  surface-muted: "#F4F4F2"
  border: "#E4E4E0"
  text: "#18181B"
  text-muted: "#5C5C66"
  primary: "#0F766E"
  primary-hover: "#0B5F58"
  on-primary: "#FFFFFF"
  accent-soft: "#E6F4F2"
  focus-ring: "#0F766E"
  success: "#166534"
  warning: "#B45309"
  danger: "#B91C1C"
  info: "#1D4ED8"
  dark-background: "#0B0C0E"
  dark-surface: "#131518"
  dark-border: "rgba(255,255,255,0.08)"
  dark-text: "#F4F4F5"
  dark-text-muted: "#A1A1AA"
  dark-primary: "#2DD4BF"
typography:
  display:
    fontFamily: Inter
    fontSize: 64px
    fontWeight: 510
    lineHeight: 1.04
    letterSpacing: -0.03em
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: 510
    lineHeight: 1.15
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 590
    lineHeight: 1.33
    letterSpacing: -0.012em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 510
    lineHeight: 1.4
  code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  s1: 4px
  s2: 8px
  s3: 12px
  s4: 16px
  s5: 20px
  s6: 24px
  s8: 32px
  s10: 40px
  s12: 48px
  s16: 64px
  touch-target: 44px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 12px
  button-marketing:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.full}"
    height: 44px
    padding: 20px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 12px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 12px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: 24px
  badge-success:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.success}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: 8px
---

# Tenant Console

## Overview
A calm, dense admin console for operators, platform admins and client admins of a multi-tenant product, plus the marketing site that sells work built on it. Priorities: scan speed, clear state, safe destructive actions. It must look designed, not generated: one accent, one typeface family, real content in every state, no decorative gradients or stock illustrations.

**Provenance.** The structure and scales below were checked against measured extractions of the public pages of linear.app, resend.com and vercel.com (designmd.me, 20 Nov 2026, one to six pages each). What the three agree on, and what we adopted:
- a 4px spacing base with steps at 4, 8, 12, 16, 20, 24, 32, 40, 48, 64;
- display type with negative letter-spacing (Linear about -0.022em, Resend about -0.01em, Vercel about -0.06em); we use -0.02em to -0.03em;
- body copy at 14 to 16px and dense UI text at 13px;
- 1px hairline borders in low-alpha white on dark surfaces instead of heavy shadows;
- touch targets of at least 44px and measured breakpoints at 375, 768, 1024, 1280 and 1440px.
From Linear we also took the variable-font weights 510 and 590 for headings (Inter on Google Fonts supports any weight from 100 to 900).

**Not adopted, on purpose.** All three extractions are dark marketing pages. Their color values, display faces (Resend's Domaine and aBCFavorit are commercial, Linear's Berkeley Mono is commercial) and decorative gradients are theirs, not ours. The extraction tool also flags its own light themes as derived rather than measured, and a few entries are artifacts (for example Linear's `hairline` is really a light button fill, and Vercel's `success` blue is really its link and focus color). Treat those files as reference only and do not commit them to a public repository.

## Colors
Neutrals carry the interface; `primary` (teal) is reserved for the single main action per screen, links and focus rings. Status colors (`success`, `warning`, `danger`, `info`) communicate state only and are always paired with an icon or text, never color alone. Dark mode uses the `dark-*` tokens, with borders as `rgba(255,255,255,0.08)` so one token works on any dark surface. Text/background pairs meet WCAG AA (4.5:1 body, 3:1 large text and UI); the contrast ratios were computed, not estimated. In code, tokens are OKLCH CSS variables so a tenant can later override base, accent and contrast (Linear-style three inputs) without touching components.

## Typography
Inter (variable) for all UI text, JetBrains Mono for ids, tokens and code. Headings use weight 510 (display, h1) and 590 (h2); body is 400. Body is 14px in dense tables and 16px in forms on mobile (prevents iOS zoom on inputs); 13px is allowed for table cells and metadata. Use sentence case. Tabular numbers (`font-variant-numeric: tabular-nums`) in tables and counters. Heading size scales with the viewport: display about 38px at 375px, 56px at 768px and 64px from 1280px.

## Layout
Mobile-first, verified at 375, 768, 1024, 1280 and 1440 px. 4px base unit. Page gutter is 16px on mobile and 24px from 768px. Content max width 1180px for marketing and 1280px for the console. Grid: 2 columns below 1024px, up to 6 from 1024px, with no intermediate counts. Desktop console: fixed left sidebar (256px) plus content. Below 768px the sidebar stacks above the content or becomes a drawer. Data tables scroll horizontally inside their container on small screens, or collapse to stacked cards for list views with few columns. Every interactive target is at least 44px on touch layouts. No horizontal page scroll at any width.

## Elevation & Depth
Flat by default: depth comes from 1px borders and surface tone, not shadows. One soft shadow is allowed for popovers, dialogs and the mobile drawer. Overlays dim the page with a scrim. Z-order: content 1, sticky header 100, dropdown 200, modal 500.

## Shapes
Controls use 8px radius, cards 12px, large containers 16px, pills and avatars fully round. In the console, primary actions use 8px; marketing call-to-action buttons may be pill-shaped (`button-marketing`). Do not mix sharp and rounded corners on one screen.

## Components
Built on shadcn/ui with Radix primitives (keyboard and screen-reader support included), extended with vetted 21st.dev components where they fit. Required states for every component: default, hover, focus-visible, active, disabled, loading, error, empty.
- Hover: a subtle overlay or small brightness change, not a different color.
- Active: `transform: scale(0.97)` on buttons.
- Focus-visible: 2px ring in `focus-ring` with a 2px offset, never removed.
- Disabled: 50% opacity and no pointer events.

Forms show field-level errors from the API envelope (`error.details[].field` and `rule`). Destructive actions (delete user, delete tenant) need a confirm dialog that names the target; the signed-in user cannot delete or deactivate themselves (the API returns 403, the UI hides the action).

## Do's and Don'ts
- Do use the accent only for the primary action, links and focus.
- Do show the tenant code and environment in the shell so people know where they are.
- Do handle 401 (refresh once, then sign in), 403 (explain permission), 429 (show Retry-After) and 5xx (show the request id from `X-Request-ID`).
- Do test every screen at 375, 768 and 1280 px and in both themes.
- Do keep the language switch (ID and EN) visible in the header of marketing pages.
- Don't copy another site's layout, wordmark, imagery, colors or licensed fonts.
- Don't convey status by color alone.
- Don't use placeholder text such as "Lorem ipsum" or "Item 1" in any shipped screen.
