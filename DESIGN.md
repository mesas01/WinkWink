---
name: WinkWink
description: Clean glass for accounts payable. Translucent chrome, quiet white surfaces, one blue, and a soft chip for every decision.
colors:
  action-blue: "#0071e3"
  action-blue-soft: "#e8f1fc"
  approved-green: "#1d7a3e"
  approved-green-soft: "#e7f5ec"
  held-amber: "#a35a00"
  held-amber-soft: "#fff3e0"
  danger-red: "#c9302c"
  danger-red-soft: "#fdeceb"
  graphite: "#1d1d1f"
  secondary-gray: "#6e6e73"
  fill-gray: "#ebebf0"
  canvas: "#f5f5f7"
  surface: "#fbfbfd"
  card-white: "#ffffff"
  hairline: "rgb(0 0 0 / 0.08)"
  input-stroke: "rgb(0 0 0 / 0.14)"
  glass: "rgb(255 255 255 / 0.66)"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Geist, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 6.6vw, 5.25rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Geist, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.028em"
  statement:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Geist, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 2.6vw, 1.875rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.018em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Geist, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.022em"
  lead:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Geist, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 1.5vw, 1.3125rem)"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "-0.012em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Geist, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.47
    letterSpacing: "-0.01em"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Geist, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.3
  typed:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Geist, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    letterSpacing: "-0.005em"
    fontFeature: "tnum"
  mono:
    fontFamily: "SF Mono, Geist Mono, ui-monospace, monospace"
    fontSize: "0.92em"
    fontWeight: 400
    letterSpacing: "0"
rounded:
  sm: "8px"
  md: "10px"
  lg: "14px"
  group: "18px"
  card: "20px"
  window: "22px"
  xl: "24px"
  full: "9999px"
spacing:
  row-x: "16px"
  row-y: "14px"
  card: "24px"
  card-wide: "32px"
  gutter: "20px"
  gutter-wide: "32px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.full}"
    padding: "0 20px"
    height: "40px"
  button-primary-lg:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.full}"
    padding: "0 28px"
    height: "48px"
  button-outline:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.full}"
    padding: "0 20px"
    height: "40px"
  button-outline-hover:
    backgroundColor: "{colors.fill-gray}"
  button-secondary:
    backgroundColor: "{colors.fill-gray}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.full}"
    padding: "0 20px"
    height: "40px"
  segmented-track:
    backgroundColor: "{colors.glass}"
    rounded: "{rounded.full}"
    padding: "4px"
  segmented-thumb:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "36px"
  chip-approved:
    backgroundColor: "{colors.approved-green-soft}"
    textColor: "{colors.approved-green}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "24px"
  chip-held:
    backgroundColor: "{colors.held-amber-soft}"
    textColor: "{colors.held-amber}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "24px"
  chip-blocked:
    backgroundColor: "{colors.danger-red-soft}"
    textColor: "{colors.danger-red}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "24px"
  chip-pending:
    backgroundColor: "{colors.fill-gray}"
    textColor: "{colors.secondary-gray}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "24px"
  chip-lg:
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "44px"
  card:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.card}"
    padding: "{spacing.card}"
  group:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.group}"
  input:
    textColor: "{colors.graphite}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
---

# Design System: WinkWink

## Overview

**Creative North Star: "Clean Glass"**

WinkWink looks like a well-made Apple app for accounts payable. Chrome is translucent glass that floats over a soft ambient field; content sits on quiet white surfaces with diffuse shadows; one blue does all the acting. The world is clean, minimal and animated, and the animation is functional: a selection glides to where it went, a decision materializes when it is made, a detail panel clears out of blur when you switch to it.

Density is calm but working. Grouped lists (inset rounded groups with hairline separators) carry the queue, the rules and the KPIs, so the interface reads like Settings or Mail rather than a dashboard of cards. Status never colors the whole screen: it lives in a soft pastel chip with its own icon, and only a security block tints its row.

The product never executes payments, so the vocabulary is the decision, not the transfer: approved is never "Paid". Revoked decisions stay visible, struck through.

**Key Characteristics:**
- Translucent glass only on chrome: sticky bars, segmented tracks, floating round controls.
- Solid white surfaces with soft, wide, low-opacity shadows; no borders on cards.
- One blue accent (action, selection, step numbers, caret); everything else neutral cool gray.
- Pill geometry for every control; generous squircle-ish radii for surfaces.
- Critically damped springs for repositioning, ease-out under 300ms for UI feedback.
- Full light and dark themes; both honor reduced motion and reduced transparency.

## Colors

A neutral cool-gray system with a single saturated blue and three pastel status pairs.

### Primary
- **Action Blue** (light #0071e3, dark #0a84ff): primary buttons, the selected-row inset bar, step numbers and rule indices (R1, 1/3), links, focus ring (at 55-65% alpha), caret and text selection. The only color that means "you can act here".
- **Blue Wash** (light #e8f1fc, dark blue at 18%): selected queue row background at 60%.

### Secondary
- **Approved Green** (#1d7a3e on #e7f5ec; dark #4cd178 on green at 14%): the Aprobada chip.
- **Held Amber** (#a35a00 on #fff3e0; dark #ffb340 on amber at 14%): the Retenida chip.
- **Danger Red** (#c9302c on #fdeceb; dark #ff6961 on red at 16%): Bloqueada, Rechazada and Error chips, destructive buttons, block reasons, nonzero risk KPIs, and the tint on a blocked row (wash at 50-60%).

### Neutral
- **Graphite** (light #1d1d1f, dark #f5f5f7): all primary text.
- **Secondary Gray** (light #6e6e73, dark #a1a1a6): metadata, captions, second hero line, inactive segments, pending chip text.
- **Fill Gray** (light #ebebf0, dark #2c2c2e): secondary buttons, outline-button hover, pending chip fill.
- **Canvas** (light #f5f5f7, dark #000000): app background behind everything.
- **Surface** (light #fbfbfd, dark #0f0f11): alternate band behind landing sections and the login page.
- **Card White** (light #ffffff, dark #1c1c1e): cards, groups, outline buttons, segmented thumb.
- **Hairline** (black 8% / white 10%): separators inside groups, glass edge ring, bar bottom border.
- **Input Stroke** (black 14% / white 18%): field borders and scrollbar thumb.
- **Glass** (white 66% / #1c1c1e at 62%): translucent chrome fill.
- **Ambient** (blue at 10% and violet at 7%, slightly stronger in dark): two radial light spots on the fixed ambient layer.

### Named Rules
**The One Blue Rule.** Blue marks action, selection and sequence only. It never carries status; decisions use the pastel chips.

**The Chip Owns Status Rule.** A decision's color appears in its chip, plus a red wash on a blocked row. No status color floods cards, headers or backgrounds.

## Typography

**Display Font:** SF Pro Display via -apple-system (with bundled Geist as the cross-platform face)
**Body Font:** SF Pro Text via -apple-system (with Geist)
**Label/Mono Font:** SF Mono (with Geist Mono), used sparingly; figures normally use the UI face with tabular numerals

**Character:** One sans family at every size, tracked tighter as it grows, so headlines feel dense and engineered while body stays open.

### Hierarchy
- **Display** (700, clamp 2.75-5.25rem, 1.04, -0.035em, balanced): landing hero and closing line only. The hero's second line drops to Secondary Gray.
- **Headline** (700, clamp 2-3rem, 1.08, -0.028em): section titles and the /agente page title.
- **Statement** (600, clamp 1.375-1.875rem, 1.25, -0.018em): one large explanatory sentence under a headline, in Secondary Gray.
- **Title** (600, 26px, -0.022em): the invoice name in the detail panel. Row titles step down to 20-24px bold.
- **Lead** (400, clamp 1.0625-1.3125rem, 1.45): hero subcopy, max-width about 42rem.
- **Body** (400, 15px, 1.47, -0.01em): default. Lists and detail text run 13-14px.
- **Label** (500, 12-13px): segmented controls, chips (600), form labels (14px, 500-600). Table column headers are 11px uppercase at 0.08em.
- **Typed** (700, tabular numerals, -0.005em): amounts, invoice IDs, timestamps, KPI values, step and rule indices.

### Named Rules
**The Tabular Figures Rule.** Every amount, ID, date and count uses tabular numerals so columns of figures align without a monospace face.

## Layout

Centered max-width containers: 72rem (max-w-6xl) on the landing and login, 80rem (max-w-7xl) in /agente, with 20px gutters rising to 32px at sm. Landing sections breathe at 96px vertical (80px for the process band); the hero is centered text with the product mock below it.

/agente is a two-column workspace at lg: the queue (1fr) beside a sticky detail card (1.1fr) that pins at 96px from the top; below lg they stack. Primary navigation inside the workspace is a segmented control, not a sidebar. Grouped-list rows sit at 16px by 14px; cards pad 24px rising to 32px. KPIs are a single group split into 2 then 4 cells by hairlines.

Controls keep a 40px minimum hit height (36px for compact segments, 32px for small).

## Elevation & Depth

A hybrid of translucency and soft shadow. Chrome floats as glass (blur 20-24px, saturate 180%) with a 1px inner top highlight and a hairline ring; content surfaces are opaque white lifted by wide, faint shadows. Depth comes from the ambient light field behind the glass, not from heavy shadows.

### Shadow Vocabulary
- **Crisp** (`0 0 0 1px var(--hairline)`): outline buttons and in-card controls; a border drawn as shadow.
- **Soft** (`0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px -12px rgb(15 23 42 / 0.12)`): every card and group at rest.
- **Lift** (`0 2px 6px rgb(15 23 42 / 0.05), 0 24px 48px -24px rgb(15 23 42 / 0.22)`): a focused standalone card such as the login panel.
- **Hero** (`0 4px 12px rgb(15 23 42 / 0.05), 0 40px 80px -40px rgb(15 23 42 / 0.32)`): the landing's macOS-window mock only.
- **CTA** (`0 1px 2px rgb(0 113 227 / 0.25)`): primary buttons.

### Named Rules
**The No Glass On Glass Rule.** Glass is for chrome over content. Never stack a glass element on another glass element; content inside a bar sits directly on it.

**The Solid Fallback Rule.** Under prefers-reduced-transparency, glass and glass bars become opaque Card White with no backdrop filter.

## Shapes

Pills for every control: buttons, segmented tracks and thumbs, chips, the role select, the theme toggle (a 40px circle). Surfaces use large continuous-feeling radii: groups 18px, cards 20px, the window mock 22px; fields 10px; the logo mark is a 32-unit squircle with a 9-unit corner. Borders are rare: separators are hairlines inside groups, and card edges come from shadow, not stroke.

## Components

### Buttons
Rounded, light and confident; they press in.
- **Shape:** full pill (9999px).
- **Primary:** Action Blue fill, white text, CTA shadow; 40px tall with 20px sides (48px and 28px at lg, 32px and 14px at sm). Hover brightens by 10%.
- **Press:** scale to 0.97 over 160ms ease-out-quint; color and shadow ease over 200ms.
- **Outline:** Card White with the crisp hairline ring; hover fills Fill Gray. **Secondary:** Fill Gray. **Ghost:** graphite at 80% with a 5% foreground hover. **Destructive:** Danger Red fill.
- **Focus:** 2px ring in the blue ring color, offset 2px.

### Segmented Control (signature)
The navigation and toggle primitive (workspace tabs, language switch). A glass pill track with 4px inset holds pill segments in 13px medium (12px small). The selected thumb is one shared white pill (white at 14% in dark) with a tiny double shadow that glides between segments on a critically damped spring (bounce 0, 380ms). Inactive labels are Secondary Gray and darken on hover. Uses aria-current for navigation and aria-pressed for toggles.

### Decision Chips
Soft pastel pills, never the only signal: each tone carries an icon (check, hand, shield, x, clock, alert).
- **Labels:** Aprobada / Retenida / Bloqueada / Rechazada / Pendiente (Approved / Held / Blocked / Rejected / Pending), plus Error.
- **Sizes:** 24px with a 14px icon and 12px semibold text in lists; 44px with a 20px icon and 17px text when a decision is the subject of the panel.
- **Materialize:** a chip lands only at the moment its decision is shown, by scaling from 0.94 with a 6px blur clearing over 320ms ease-out-quint. On the landing mock the chips land row by row, 350ms apart.
- **Struck:** a revoked decision's chip and its audit line are struck through at 55% opacity. They are never removed.

### Cards / Containers
- **Card:** Card White, 20px radius, soft shadow, 24-32px padding. The detail panel is the canonical card.
- **Group:** Card White, 18px radius, soft shadow, clipped, rows divided by hairlines. Queue, rules, KPIs and the landing outcomes all use it.
- **Queue row:** title semibold over a typed ID; amount and chip right-aligned. Hover fills Card White, selection gets the Blue Wash plus a 3px blue inset bar on the leading edge, blocked rows get the red wash.

### Inputs / Fields
36px tall, 10px radius, Input Stroke border, transparent fill, 12px sides; 14px text on desktop. Focus draws a 1px ring in the blue ring color. The employee selector in the bar is a 36px glass pill.

### Navigation
A sticky glass bar (blur 24px, hairline bottom) holds the logo, the language segmented control and a round glass theme toggle whose icon swaps by rotating 45 degrees through a 2px blur in 220ms. Landing links are 14px semibold Secondary Gray, darkening on hover.

### Logo Mark
An app-icon squircle in graphite holding a closed eye in the card color: the wink is the agent's nod of approval, and its three lashes read as the three checks (account, tax ID, policy). Set at 28px beside "WinkWink" in 17px semibold at -0.02em.

### Audit Log
A typed, append-only list at 13px: tabular timestamp, uppercase actor tag, the plain-language message, and the decision chip. A superseded decision stays in place, struck through in Secondary Gray.

### Motion
- **Reposition:** critically damped springs (bounce 0): segmented thumb 380ms, hero mock entrance 900ms.
- **UI feedback:** ease-out-quint `cubic-bezier(0.23, 1, 0.32, 1)` at or under 300ms: detail switch 280ms, theme icon 220ms, press 160ms.
- **Detail switch:** a blur crossfade; the incoming detail rises 6px out of a 4px blur.
- **Row entrance:** queue rows rise 8px over 320ms, staggered 40ms per row, capped at 8 rows.
- **Hero entrance:** the headline rises out of an 8px blur over 700ms; subcopy and actions follow at 120ms and 200ms.
- **Reduced motion:** all animations and transitions collapse to 0.01ms, press scale is disabled, smooth scrolling is turned off. Theme switching suppresses transitions so colors change in one frame.

## Do's and Don'ts

### Do:
- **Do** put glass only on chrome (bars, segmented tracks, round floating controls), over the ambient field.
- **Do** use grouped lists with hairline separators for collections, and a single card for the item in focus.
- **Do** give every decision a pastel chip with its icon and its Spanish or English label; materialize it only when the decision appears.
- **Do** strike through revoked decisions and keep them in the audit log.
- **Do** use tabular numerals for every amount, ID and timestamp.
- **Do** reposition with critically damped springs and keep UI feedback ease-out at or under 300ms; respect prefers-reduced-motion and prefers-reduced-transparency.
- **Do** keep pills for controls and 18-20px radii for surfaces.

### Don't:
- **Don't** label an approved invoice "Paid" or imply a payment executed; the product stops at the decision.
- **Don't** stack glass on glass.
- **Don't** use blue for status or status colors for action.
- **Don't** signal a decision by color alone.
- **Don't** delete or hide a revoked decision.
- **Don't** add borders to cards; their edge is the soft shadow.
- **Don't** let animation overshoot or bounce when something moves to a new position.
