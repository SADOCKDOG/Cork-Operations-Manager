
--- Guide for form-factor-adaptation ---
# Adapt to the form factor

The same interface runs on phones, laptops, and foldables, with touch, mouse, or keyboard. Size controls for the input, let components adapt to their container, and keep text and controls clear of system UI.

For page-level responsive techniques (dynamic viewport units, aspect ratios, and fluid type), see `responsive-design` (via `npx -y modern-web-guidance@latest retrieve "responsive-design"`).

## Implementation

### Size targets for the input method

Make every control at least 24×24 CSS pixels (WCAG 2.5.8), and at least 44×44 on touch screens (WCAG 2.5.5). Links inside sentences are exempt. For checkboxes and radios, wrap the input in its `<label>` and size the label. To keep small icons visually compact, extend their hit area with a pseudo-element. Leave enough space around controls so extended hit areas do not overlap each other or reach past the edge of the screen.

```css
:root { --target-size: 24px; }
@media (pointer: coarse) {
  :root { --target-size: 44px; }
}
:where(button, select, textarea, input:not([type="checkbox"], [type="radio"]), [role="button"], nav a, label:has(input[type="checkbox"], input[type="radio"])) {
  min-block-size: var(--target-size);
  min-inline-size: var(--target-size);
}
:where([role="button"], nav a, label:has(input[type="checkbox"], input[type="radio"])) { display: inline-flex; align-items: center; }
.icon-button { position: relative; }
.icon-button::after {
  content: "";
  position: absolute;
  inset: -10px;
}
```

### Let components respond to their container

Use container queries instead of viewport-width media queries for component layout, so a component adapts wherever it is placed. Keep media queries for what a container can't know: the input device (such as `pointer: coarse` for touch screens) and user settings (such as `prefers-color-scheme`).

```css
.product-list {
  /* Name containers so queries inside nested containers target the right ancestor. */
  container: products / inline-size;
}
/* A container query styles the container's descendants, never the container itself. */
@container products (inline-size > 40rem) {
  .product-card { display: grid; grid-template-columns: 10rem 1fr; }
}
```

DO NOT query `height` or `block-size` on an `inline-size` container: it measures only width. Use `container-type: size` only on a container with a definite height.

- For more container query patterns, such as card layouts, see `size-aware-styling` (via `npx -y modern-web-guidance@latest retrieve "size-aware-styling"`).
- To change a component's layout based on what child elements it contains (for example, switching a card to a side-by-side layout when it includes an image), see `content-based-styling` (via `npx -y modern-web-guidance@latest retrieve "content-based-styling"`).

### Keep UI clear of notches and system bars

When drawing edge to edge with `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, pad fixed and edge-anchored UI by the safe-area insets.

```css
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0px));
  padding-left: max(0.75rem, env(safe-area-inset-left, 0px));
  padding-right: max(0.75rem, env(safe-area-inset-right, 0px));
}
```

Pad UI anchored to the top edge the same way with `safe-area-inset-top`.

### Balance headings and prettify body text

Apply `text-wrap: balance` to short headings (`h1, h2, h3`) and `text-wrap: pretty` to body text (`p, li`) to prevent typographic orphans. For full text-wrapping rules, see `improve-text-layout-and-legibility` (via `npx -y modern-web-guidance@latest retrieve "improve-text-layout-and-legibility"`). DO NOT apply either property to `*`: both incur layout overhead, and `balance` only helps short blocks of text.

### Label icon-only buttons

Give every icon-only button an accessible name using `aria-label`, an `<img alt>`, or visually hidden text, and hide decorative icons with `aria-hidden="true"`. For more accessible naming patterns, see `accessibility` (via `npx -y modern-web-guidance@latest retrieve "accessibility"`).

### Keep content inside its box

Ensure text and controls are never clipped, squished to zero dimensions, or overflowing at any viewport width down to 320 CSS pixels (WCAG 1.4.10).

```css
/* Media never overflows its column. */
img, video { max-inline-size: 100%; block-size: auto; }
/* Long words and URLs wrap instead of widening the page. */
body { overflow-wrap: anywhere; }
/* Flex and grid items don't shrink below their content by default. Let non-control items shrink so controls keep their minimum size. */
:where(.toolbar > :not(button, input, select, textarea, a, [role="button"], label)) { min-inline-size: 0; }
.toolbar { display: flex; }
/* The target-size minimum lets controls in a crowded row shrink below their text, so let nav bars and toolbars that are already rows wrap. */
:where(nav, nav ul, .toolbar) { flex-wrap: wrap; }
```

- Use `min-block-size` instead of a fixed `height` on anything that contains text.
- DO NOT truncate headings with `text-overflow: ellipsis`, and do not clip controls with `overflow: hidden` on their parents.
- To allow text and layouts to scale with operating system accessibility settings, see `respect-os-text-scale` (via `npx -y modern-web-guidance@latest retrieve "respect-os-text-scale"`). To size form controls dynamically as users type, see `form-fields-automatically-fit-contents` (via `npx -y modern-web-guidance@latest retrieve "form-fields-automatically-fit-contents"`).

## Fallback strategies

### Text wrapping

Baseline status for text-wrap: balance: Newly available. It's been Baseline since 2024-05-13.
Supported by: Chrome 114 (May 2023), Edge 114 (Jun 2023), Firefox 121 (Dec 2023), and Safari 17.5 (May 2024).

Browser support for text-wrap: pretty: Limited availability.
Supported by: Chrome 117 (Sep 2023), Edge 117 (Sep 2023), and Safari 26 (Sep 2025).
Unsupported in: Firefox.

Browsers without support ignore `text-wrap: balance` and `text-wrap: pretty` and wrap text normally. No fallback is needed.


--- Guide for color ---
# Color

## Accessible color

**Don't use color alone to indicate the presence of a user interface component or its state**: Use iconography and/or shape to help differentiate. Do not denote success/errors ONLY with color. Use icons or text (WCAG 1.4.1 Use of Color).

```html
<!-- Good: Denotes state without colors alone -->
<div class="error-msg">
  <span aria-hidden="true">❌</span>
  <span>The password entered was invalid.</span>
</div>
```

### Contrast

- **Minimum contrast standards**: Maintain 4.5:1 for normal text and 3:1 for large text (at least 24px, or at least 18.66px bold) or icons (WCAG 1.4.3 Contrast (Minimum) for text, WCAG 1.4.11 Non-text Contrast for icons).
- **Ensure non-text contrast standards**: Maintain a minimum contrast ratio of 3:1 for user interface component boundaries and states (WCAG 1.4.11 Non-text Contrast).
  - This includes visual elements (borders, backgrounds, box-shadows, underlines) that form the boundary or indicate the presence of a UI component (e.g., input field borders).
  - This also includes visual elements indicating active states within a component (e.g., checkbox checkmarks, switch thumbs or custom focus indicators).
  - **Caveat**: Meeting 3:1 non-text contrast can challenge minimalistic designs. Soft gradients or subtle inset/outset shadows can soften visual boundaries while satisfying accessibility requirements.
- **Use `prefers-contrast` only when warranted**: Reach for `@media (prefers-contrast: more)` when the design uses low-contrast accents (e.g., subtle borders, muted secondary text) that need to be reinforced; most sites that already meet baseline contrast won't need it. It strengthens colors that already meet the minimums above; it doesn't fix a default that fails them, because it only reaches users who have turned on the setting.

### Light and dark color schemes

- **Support light and dark color schemes**: Honor `@media (prefers-color-scheme: dark)` and pair it with the `color-scheme` CSS property so form controls, scrollbars, and other UA-rendered surfaces match.
See `dark-mode` (via `npx -y modern-web-guidance@latest retrieve "dark-mode"`) for more details.

### Forced Colors Mode

- **Support Forced Colors Mode**: In Forced Colors Mode (High Contrast on Windows), the browser overrides author colors with system keywords, removes `box-shadow`, `text-shadow`, and gradient backgrounds, and may also remove `border-image`. `url()` background images can't be relied on either: they may be removed, or kept in their own colors, which may not contrast with the system colors. Define system color fallbacks for color tokens using `@media (forced-colors: active)`.
- **Use `forced-color-adjust: none` only where color is essential information** (syntax highlighter, color picker swatch). **DON'T** use `forced-color-adjust: none` just to preserve aesthetics. Where the element contains text, set both its text and background colors to a pair that meets the minimums above, because a transparent background shows what is behind it, usually the user's system `Canvas` color, which can be light or dark.
- **Don't rely on `background-image`, `box-shadow`, or `border-image` to convey borders, separators, or state**: In forced colors they disappear or keep their own colors, which may not contrast with the system colors (and they often disappear in print too). If you must, ensure there's an alternative in forced colors mode, such as `outline` or `border` with system color keywords (`CanvasText`, `LinkText`, `ButtonText`, `Highlight`, `GrayText`, etc.).

## Generating tints

Before generating tints dynamically, check if you can use an existing, predefined, design token. This allows much more designer control and ensures consistency.

If you need to generate lighter or darker colors dynamically:
- **DO NOT** just adjust the lightness channel in `oklch`/`oklab` or `lch`/`lab`, e.g. `oklab(from var(--primary) 0.9 a b)`. While that is theoretically the correct way, browsers do not yet implement gamut mapping, so the resulting color is unpredictable.
- You can use `color-mix()` to mix with white or black (preferably in `oklab`). This keeps the color safely in gamut, but tends to over-desaturate colors and produce washed out tints and shades.
- You MAY combine lightness adjustment with any of the other methods (e.g. `color-mix(in oklab, oklch(from var(--primary) 0.9 c h), white 30%)`) for a balance between the two, but avoid going above 30% for the lightness adjustment.



--- Guide for responsive-table ---
# Responsive tables

Large data tables often become unreadable on small screens as columns overflow or shrink beyond legibility. This guide demonstrates how to use **sticky positioning** to keep headers visible during scrolling and how to transform the table into a mobile-friendly "stacked" layout when space is limited.

## Recommended Approach

The core of a responsive table is maintaining the relationship between data cells and their headers.

1.  **Semantic Foundation**: Use standard `<table>` elements with `<thead>`, `<tbody>`, and `<th>` elements.
2.  **Sticky Context**: Apply `position: sticky` to both column headers and row headers. This ensures that no matter how far a user scrolls in any direction, they never lose the context of what the data represents.
3.  **Adaptive Transformations**: Use `@container` queries instead of `@media` queries. This allows the table to adapt based on its own width (e.g., when placed in a sidebar or a narrow dashboard widget) rather than the entire viewport.
4.  **Label Injection**: In the stacked layout, the `<thead>` is hidden, and accessible headers are injected into each cell using `::before` pseudo-elements and CSS variables.
5.  **Legible Cells**: Keep long cell text on one line instead of letting columns shrink below legibility. See `single-line-overflow` (via `npx -y modern-web-guidance@latest retrieve "single-line-overflow"`) for techniques for truncating it and revealing the full text on demand without UX friction.

## Implementation Steps

### 1. Markup and Layout

Structure your table with standard semantic headers. Use a `.table-wrapper` to handle overflow and provide a container for queries. Add a `tabindex="0"` attribute to the container, to ensure that people using only a keyboard can consistently scroll the table.

Give the wrapper a `role="region"` attribute to communicate its purpose. Provide it with an accessible name using `aria-labelledby` (referencing the `id` attribute of an existing element that captions/names the table) or an `aria-label` attribute.

```html
<div tabindex="0" role="region" aria-labelledby="employee-table-caption" class="table-wrapper">
  <table>
    <caption id="employee-table-caption">Current employee directory</caption>
    <thead>
      <tr>
        <th>Employee</th>
        <th>Role</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <!-- Row header remains sticky horizontally on desktop, 
             and becomes a sticky card header on mobile -->
        <th>Alex Rivera</th>
        <td>Engineer</td>
        <td>Active</td>
      </tr>
    </tbody>
  </table>
</div>
```

### 2. Configure Sticky Headers
Enable scrolling and make headers sticky. Use logical properties and explicit z-index values to manage the stacking order.

```css
.table-wrapper {
  overflow: auto;
  max-inline-size: 100%;
  max-block-size: min(500px, 80vh);
  container-type: inline-size;
}

table {
  border-collapse: separate;
  border-spacing: 0;
}

/* Sticky column headers (desktop) */
thead {
  position: sticky;
  inset-block-start: 0;
  z-index: 1; /* Above sticky row headers */
}

/* Sticky row headers (desktop) */
tbody th {
  position: sticky;
  inset-inline-start: 0;
  background: white; /* Required to cover background during scroll */
}
```

### 3. Responsive Stacked Layout
When space is limited, hide the original header row and transform the table into cards. Inject labels using pseudo-elements. Only provide alternative text for non-text content, otherwise this may result in both the text content and accessible name being announced by screen readers.

```css
@container (width < 600px) {
  table, thead, tbody, tr, th, td {
    display: block;
  }

  thead {
    /* MANDATORY: Hide column header from layout and screen readers. */
    display: none
  }

  tr {
    margin-block-end: 1.5rem;
    border: 1px solid #ccc;
  }

  /* Sticky row headers at the top of each block/card */
  tbody th {
    position: sticky;
    inset-block-start: 0;
    z-index: 2;
    background: #eee;
  }

  /* Define column labels as CSS variables (often set via JS) */
  table {
    --label-1: "Employee";
    --label-2: "Role";
    --label-3: "Status";
  }

  /* Inject labels */
  td:nth-child(2)::before {
    /* MANDATORY: If using non-text content, provide the accessible name (after the /) which ensures screen readers hear the text alternative. */
    content: var(--label-2) ": ";
  }
  /* MANDATORY: Map the label for each column */
  td:nth-child(3)::before {
    content: var(--label-3) ": ";
  }
}
```

