---
name: WinkWink
description: Notary ledger for accounts payable. Every invoice is stamped with its verdict and its reason is written beside it.
colors:
  ink-violet: "oklch(0.42 0.13 285)"
  ink-green: "oklch(0.49 0.12 152)"
  ink-red: "oklch(0.52 0.19 29)"
  ledger-ink: "oklch(0.22 0.005 60)"
  ledger-paper: "oklch(0.982 0.006 80)"
  ledger-card: "oklch(0.995 0.003 80)"
  ledger-tint: "oklch(0.93 0.012 80)"
  pencil: "oklch(0.46 0.012 70)"
  hairline: "oklch(0.87 0.012 80)"
  field-line: "oklch(0.78 0.012 80)"
  red-wash: "oklch(0.95 0.03 29)"
  violet-wash: "oklch(0.95 0.025 285)"
  green-wash: "oklch(0.95 0.03 152)"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 6.4vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3.25rem)"
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.028em"
  statement:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.22
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  lead:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 1.4vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.08em"
  typed:
    fontFamily: "Courier Prime, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 700
    fontFeature: "tnum"
  stamp-sm:
    fontFamily: "Courier Prime, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.08em"
  stamp-lg:
    fontFamily: "Courier Prime, ui-monospace, monospace"
    fontSize: "1.875rem"
    fontWeight: 700
    letterSpacing: "0.06em"
rounded:
  sm: "2px"
  md: "3px"
spacing:
  row-y: "16px"
  row-x: "12px"
  gutter-app: "16px"
  gutter-app-wide: "32px"
  gutter-site: "20px"
  section: "96px"
  touch: "44px"
components:
  button-primary:
    backgroundColor: "{colors.ledger-ink}"
    textColor: "{colors.ledger-paper}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "44px"
  button-outline:
    backgroundColor: "{colors.ledger-paper}"
    textColor: "{colors.ledger-ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "44px"
  filter-tab:
    textColor: "{colors.pencil}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  filter-tab-active:
    backgroundColor: "{colors.ledger-ink}"
    textColor: "{colors.ledger-paper}"
    rounded: "{rounded.md}"
  workspace-tab:
    textColor: "{colors.pencil}"
    height: "44px"
  workspace-tab-active:
    textColor: "{colors.ledger-ink}"
    height: "44px"
  stamp-approved:
    textColor: "{colors.ink-green}"
    typography: "{typography.stamp-sm}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
  stamp-held:
    textColor: "{colors.ink-violet}"
    typography: "{typography.stamp-sm}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
  stamp-blocked:
    textColor: "{colors.ink-red}"
    typography: "{typography.stamp-sm}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
  stamp-blocked-lg:
    backgroundColor: "{colors.red-wash}"
    textColor: "{colors.ink-red}"
    typography: "{typography.stamp-lg}"
    rounded: "{rounded.md}"
    padding: "8px 20px"
  stamp-pending:
    textColor: "{colors.pencil}"
    typography: "{typography.stamp-sm}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
  ledger-row:
    textColor: "{colors.ledger-ink}"
    padding: "16px 12px"
  ledger-row-blocked:
    backgroundColor: "{colors.red-wash}"
    textColor: "{colors.ink-red}"
    padding: "16px 12px"
  input:
    backgroundColor: "{colors.ledger-paper}"
    textColor: "{colors.ledger-ink}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "44px"
---

# Design System: WinkWink

## Overview

**Creative North Star: "The Notary Ledger"**

WinkWink reads like a notary's book of record. The ground is warm ledger paper and the text is ink. Thick ink rules frame each record and dashed hairlines separate its rows. The only color in the system is stamp ink, and it shows up where a verdict was given. The agent stamps every invoice (Aprobada, Retenida, Bloqueada, Rechazada) and writes its one-sentence reason beside the stamp. A reviewer reads the queue by scanning stamps, not pastel status pills on a gray dashboard.

The setting is dense and operational. Ruled tables, typewritten amounts and a typed audit log carry the record. Archivo sets everything a person reads or clicks. Courier Prime is kept for what the record itself "typed": stamps, amounts, IDs, counts and audit lines. Surfaces are flat paper divided by rules, never floating cards. Light and dark are both full themes: in dark mode the paper turns to a warm near-black, the ink turns to paper, and the stamp inks lighten so they still read.

Motion is limited to one gesture with meaning: the stamp lands (scale 1.6, then 0.96, then 1 over 280ms) when a decision is shown. Everything else is a quick press (scale 0.97) or a short fade.

**Key Characteristics:**
- Ledger paper ground, ink text, 2px ink rules framing every record, dashed hairlines between rows.
- Color is stamp ink: green approves, violet holds, red blocks or rejects. Violet is also the brand ink for the seal, the active tab and the focus ring.
- Every state is told three ways: stamp word, stamp shape (tilt, dashed border) and ink color.
- Archivo for the interface, Courier Prime for the typed record, with tabular figures on every amount.
- Square 3px corners, no soft shadows, no floating cards.

## Colors

A warm paper and ink neutral pair with three stamp inks, all in OKLCH. Every token has a dark-theme counterpart (see the sidecar).

### Primary
- **Notary Violet** (oklch(0.42 0.13 285)): the brand ink and the "held" stamp. Used for the seal logo, the active workspace-tab underline, focus rings, text caret, selection tint, step and rule numerals on the landing page, and the second line of the hero headline. Violet means "held for a person" in a stamp and "WinkWink" everywhere else, so it never appears as a generic accent.

### Secondary
- **Ledger Green** (oklch(0.49 0.12 152)): the Aprobada / Approved stamp, and nothing else.
- **Block Red** (oklch(0.52 0.19 29)): the Bloqueada and Rechazada stamps, the security-block reason, the struck-through invoice account in the bank comparison, the locked-approval note, and the red rule framing a bank mismatch. It is also the destructive color.

### Neutral
- **Ledger Ink** (oklch(0.22 0.005 60)): body text, 2px rules (the `rule` token), the primary button fill, and the active filter tab fill.
- **Ledger Paper** (oklch(0.982 0.006 80)): the page ground and button text on ink.
- **Ledger Card** (oklch(0.995 0.003 80)): a slightly brighter sheet used for the login sheet, the landing mock ledger and row hover.
- **Ledger Tint** (oklch(0.93 0.012 80)): secondary and ghost hover fills.
- **Pencil** (oklch(0.46 0.012 70)): secondary text, column headers, dates in the audit log, inactive tabs and the Pendiente stamp.
- **Hairline** (oklch(0.87 0.012 80)): default 1px borders.
- **Field Line** (oklch(0.78 0.012 80)): dashed row separators, input and outline-button strokes, and inactive filter tabs.
- **Washes** (red, violet, green at 0.95 lightness): low-chroma tints behind a blocked row, behind the large blocked stamp, and behind a notice. A wash always sits behind matching ink and never carries state alone.

### Named Rules
**The Stamp Ink Rule.** State color exists only as stamp ink: green approves, violet holds, red blocks or rejects. No other component may use these hues to mean anything else.

**The Approved-Not-Paid Rule.** The green stamp reads APROBADA / Approved. It never says Pagada / Paid, because WinkWink decides and never moves money.

## Typography

**Display Font:** Archivo (with ui-sans-serif, system-ui)
**Body Font:** Archivo, weights 400, 500, 600 and 800
**Label/Mono Font:** Courier Prime, weights 400 and 700 (with ui-monospace)

**Character:** A tight, heavy grotesque does the talking and a typewriter face keeps the books. The contrast between them sorts what a person says from what the record shows.

### Hierarchy
- **Display** (800, clamp(2.75rem, 6.4vw, 5.5rem), 0.98): landing hero and the closing statement only.
- **Headline** (800, clamp(2rem, 4vw, 3.25rem), 1.04): landing section titles.
- **Statement** (600, clamp(1.5rem, 3vw, 2.25rem), 1.22): one large pull statement per landing section, in pencil.
- **Title** (800, 1.875rem to 2.25rem, -0.025em): the page title in the app and on login.
- **Lead** (400, clamp(1.0625rem, 1.4vw, 1.25rem), 1.5): the hero's sub copy, max about 36rem.
- **Body** (400 to 600, 0.875rem to 0.9375rem, 1.5 to 1.65): row reasons, detail fields, forms. Row vendor names are 600.
- **Label** (600, 11px, 0.08em, uppercase): ledger column headers and the mock-ledger caption bar only.
- **Typed** (Courier Prime 700, tabular figures): amounts (1rem in rows, 1.875rem in the detail), IDs and dates (0.75rem, 400), filter counts, and the audit log (13px, 400, relaxed).

### Named Rules
**The Typewriter Rule.** Courier Prime is used only for the typed record: stamps, amounts, invoice numbers, dates, counts and audit-log lines. Labels, headings and buttons stay in Archivo. The bank comparison follows this rule: labels in Archivo, account values in Courier.

**The Tabular Figures Rule.** Every amount uses tabular figures and is right-aligned in its column, so the eye can compare amounts down the ledger.

## Layout

The app is one ruled column: a top bar closed by a 2px ink rule, a page title with its primary action at the right, filter tabs, then the ledger. The ledger is a three-column grid on desktop (invoice, a 160px amount column, a 150px decision column). Below `sm` the stamp moves under the invoice text. The app container is 80rem with 16px gutters (32px from `sm`). The landing page and login use a 72rem container with 20px gutters (32px from `sm`).

Rhythm is dense in the app (rows 16px by 12px, 24px column gap) and open on the landing page (sections 80 to 96px tall, alternating paper and surface bands closed by 2px rules). Every button, input and select is at least 44px tall. Filter tabs and the language switch are 40px tall. Workspace tabs scroll sideways on mobile and wrap from `sm`, with the employee-view toggle pushed to the right.

The invoice detail is a dialog up to 48rem wide: the large stamp, the typed amount, the reason under a dashed hairline, the bank comparison when the verdict is a security block, the fields, the actions, then the typed audit log. When a document preview is open it moves into a second column.

### Named Rules
**The Reason-Beside-the-Stamp Rule.** Every verdict appears with its one-sentence reason in the same row or the same block. A stamp is never shown alone.

## Elevation & Depth

The system is flat. Depth comes from rules and paper tone, never from shadows: a 2px ink rule frames a record, a dashed hairline separates rows, and a brighter card tone or a wash marks a row on hover or a blocked state. The `lift`, `cta` and `hero` shadow tokens are deliberately set to `none`. The only shadow token with a value is `crisp` (a 1px border ring).

### Named Rules
**The Ruled-Not-Raised Rule.** Separation is drawn with rules (2px ink for a record, 1px dashed field line for rows, 1px hairline for minor divisions). Nothing floats on a shadow.

## Shapes

Corners are nearly square: 3px on buttons, inputs, tabs, stamps and the language switch, and 2px on inner segments. The only round forms are the seal (a solid ring, a dashed inner ring and a closed-eye wink, tilted -6deg) and the illustrated rule toggles on the landing page. Borders carry meaning by weight and style. 2px solid ink frames a record, dashed marks rows and provisional stamps (pending, error), and 2px or 3px stamp ink outlines a verdict.

### Named Rules
**The Tilt Rule.** Final stamps sit slightly off square, the way a hand-pressed stamp lands. Approved is -3deg, held 2deg, blocked -4deg and rejected 3deg. Pending and error stay at 0deg with a dashed border, because nothing has been decided yet.

## Components

### Buttons
- **Shape:** near-square (3px), at least 44px tall in practice.
- **Primary:** ink fill with paper text, semibold Archivo, an icon at 16px. Used once per view for the main action (Upload invoice, Approve, Enter).
- **Outline:** paper fill, field-line stroke and ink text. Used for secondary actions (Reject, See how it works).
- **Ghost:** no fill, ledger-tint on hover. Used for the theme toggle.
- **Hover / Focus:** a 160ms color shift and a 0.97 press on active (the `press` utility, turned off under reduced motion). Focus is a 2px violet outline offset by 2px.

### Filter tabs
- **Style:** 3px square tabs, 40px tall, semibold Archivo with a typed count. Inactive tabs have a field-line stroke and pencil text. The active tab is filled with ink and has paper text.
- **State:** `aria-pressed` toggles. These tabs filter the ledger and never navigate.

### Ledger
- **Frame:** 2px ink rules top and bottom, a header row of 11px uppercase column labels above a 1px ink rule, and dashed field-line separators between rows.
- **Row:** the vendor (600, truncated) with a verified-account shield when the account matches, then a typed line of number, date and submitter, then the reason (two lines, pencil). The typed amount is right-aligned and the small stamp sits in the decision column.
- **Blocked row:** a half-strength red wash and a semibold red reason.
- **Hover:** the row brightens to the card tone.
- **Empty:** the same 2px frame around a centered message and an outline Upload button.

### Inputs / Fields
- **Style:** a 1px field-line stroke on paper, 3px corners and 44px height.
- **Focus:** a 2px violet outline, matching every other focus state.

### Navigation
- **Top bar:** the seal wordmark on the left. On the right are the user's name and role, the ES/EN switch (a 3px segmented control where the active language is ink-filled), the theme toggle and sign-out. A 2px ink rule closes the bar.
- **Workspace tabs:** semibold Archivo with a 16px line icon, 44px tall. The active tab has a 2px violet underline sitting on the row's 1px hairline. Inactive tabs are pencil and turn ink on hover.

### Verdict Stamp (signature)
A rubber stamp, not a badge. Courier Prime 700 in uppercase inside a 2px stamp-ink border with 3px corners, tilted according to the Tilt Rule.
- **Small** (11px, 0.08em tracking): in ledger rows and the transfer demo.
- **Large** (1.875rem, 0.06em tracking, 3px border): heads the invoice detail. A large blocked stamp also gets the red wash behind it.
- **Labels:** Aprobada / Approved, Retenida / Held, Bloqueada / Blocked, Rechazada / Rejected, Pendiente / Pending, Error. A security block outranks the decision status.
- **Stamp-in:** the stamp lands with a scale of 1.6, then 0.96, then 1 over 280ms on the out-quint curve (cubic-bezier(0.23, 1, 0.32, 1)). This plays only at the moment a decision is shown: when the detail opens or changes, and staggered by row on the landing mock ledger. It never plays on ordinary list renders.

### Bank Comparison
This block appears only on a security block. It is a definition list framed by 2px red rules. "On the invoice" shows the invoice account in red, struck through with a 2px line, and "Verified in Blinka" shows the verified account in ink. Labels are in Archivo pencil and account values are typed in bold Courier.

### Audit Log
A typed ordered list (Courier Prime 13px, relaxed). Each line has a short date and time in pencil, then the bilingual message. The log only ever grows.

## Do's and Don'ts

### Do:
- **Do** carry every state as a stamp word, a stamp shape and a stamp ink at the same time.
- **Do** put the one-sentence reason next to every stamp, in red and semibold when the verdict is a security block.
- **Do** frame every record with 2px ink rules and separate rows with dashed field-line hairlines.
- **Do** set amounts, IDs, dates, counts and audit lines in Courier Prime with tabular figures, and everything else in Archivo.
- **Do** keep corners at 3px (2px for inner segments) and touch targets at 44px or more.
- **Do** play the stamp-in only at the moment a decision is shown, and let reduced motion turn it off.
- **Do** keep light and dark both complete: stamp inks lighten in dark mode instead of keeping their light-mode values.

### Don't:
- **Don't** show state as a pastel rounded pill or a colored dot. State lives in a stamp.
- **Don't** label the approved stamp Pagada / Paid or suggest a payment was executed.
- **Don't** use green, violet or red as decoration or a generic accent. Violet is the only exception, used as brand ink for the seal, the active tab and focus.
- **Don't** lift surfaces with shadows or float soft rounded cards. Separate with rules and paper tone.
- **Don't** set labels, headings or buttons in Courier Prime.
- **Don't** delete a decision from the record. The audit log only grows.

## Open Items

- **Struck-through revocation (contract raise, not shipped).** The direction contract says a revoked decision should be struck through instead of removed. The Stamp component accepts a `struck` treatment (line-through, 60% opacity), but no screen uses it, because `invoice_events` has no event kind or superseded flag to say that a decision was revoked. Treat this as unbuilt until the data model can express revocation.
