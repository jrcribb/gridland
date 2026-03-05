# Made with OpenTUI

## 1. Overview

This module provides three branding components -- CornerRibbon, BadgeButton, and TextBadge -- that link back to the OpenTUI project website. They are used on pages built with OpenTUI to provide attribution. Each variant offers a different visual style (ribbon, badge, or minimal text link) suitable for different page layouts. This is a **web/HTML component** (not a TUI component).

**Rebranding note:** These components are rebranded from the original "ink web" versions. All references to "ink web" and the ink-web URL are replaced with "opentui" and the opentui URL. See section 7 for full details.

## 2. Visual Layout

### CornerRibbon

A diagonal ribbon that sits in a corner of the page. It is rendered inside a fixed (or absolute) positioned invisible container, with the text rotated 45 degrees to appear as a diagonal banner across the corner.

```
Page corner (top-right, default):

         +------------------+
         |             /   /|
         |            / R /
         |           / I /
         |          / B /
         |         / B /
         |        / O /
         |       / N /
         +------/   /--------+

Ribbon text: "made with opentui"
```

**Positioning container:**
- 200x200px invisible square
- Positioned in one of four corners (default: top-right)
- z-index: 9999
- `pointer-events: none` (clicks pass through the container)
- Positioning: `fixed` by default, or `absolute` when `absolute=true`

**Ribbon link:**
- An `<a>` tag linking to the OpenTUI URL
- `target="_blank"` with `rel="noopener noreferrer"`
- Width: 210px
- Rotated 45 degrees (or -45 degrees depending on corner)
- Translated to sit along the corner diagonal
- `pointer-events: auto` (the ribbon itself is clickable)
- Text: "made with opentui"
- Styling: 11px font, semibold, monospace, uppercase tracking
- Light mode: neutral-200 background, neutral-800 text
- Dark mode: neutral-950 background, neutral-400 text
- Small shadow

**Corner positions and rotations:**

| Position | Container anchors | Rotation | Translation |
|----------|-------------------|----------|-------------|
| `top-right` | top: 0, right: 0 | 45deg | x+14px, y+32px |
| `top-left` | top: 0, left: 0 | -45deg | x-14px, y+32px |
| `bottom-right` | bottom: 0, right: 0 | -45deg | x+14px, y-32px |
| `bottom-left` | bottom: 0, left: 0 | 45deg | x-14px, y-32px |

### BadgeButton

A small inline badge/button that can be placed anywhere in the page.

```
+----------------------------+
| >_  made with opentui      |
+----------------------------+
```

**Visual details:**
- Inline-flex layout, horizontally centered items
- Small gap between icon and text (gap: 6px / 1.5 spacing units)
- Horizontal padding: 12px (px-3)
- Vertical padding: 6px (py-1.5)
- Rounded corners (rounded-md, ~6px)
- Monospace font, 12px (text-xs), medium weight
- No text decoration (no underline)
- Leading: none (line-height: 1)
- Opacity reduces to 80% on hover (transition)
- An `<a>` tag linking to the OpenTUI URL
- `target="_blank"` with `rel="noopener noreferrer"`

**Icon:** The characters `>_` rendered at 14px (text-sm) in a `<span>`.
**Text:** "made with opentui" in a `<span>`.

**Variants:**

| Variant | Light mode | Dark mode |
|---------|------------|-----------|
| `dark` (default) | Black background, white text, transparent border | White background, black text, transparent border |
| `light` | White background, black text, neutral-200 border | Black background, white text, neutral-700 border |
| `outline` | Transparent background, current text color, current-color border | Same (inherits from parent) |

### TextBadge

A minimal inline text link, the most subtle branding option.

```
>_ made with opentui
```

**Visual details:**
- Inline-flex layout, items centered
- Small gap between parts (gap: 4px / 1 spacing unit)
- Font: 11px, monospace
- Color: inherited from parent (`text-inherit`)
- Opacity: 50% by default, 80% on hover (transition)
- No text decoration (no underline)
- An `<a>` tag linking to the OpenTUI URL
- `target="_blank"` with `rel="noopener noreferrer"`
- The `>_` prefix and "made with opentui" text are rendered together as inline content

## 3. Props

### CornerRibbon Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `position` | `"top-right" \| "top-left" \| "bottom-right" \| "bottom-left"` | No | `"top-right"` | Which corner of the viewport (or parent container) to display the ribbon in. |
| `className` | `string` | No | `undefined` | Additional CSS classes applied to the ribbon `<a>` element (not the container). |
| `absolute` | `boolean` | No | `false` | When `true`, uses `position: absolute` instead of `position: fixed`. Useful when embedding inside a relatively positioned container rather than against the viewport. |

### BadgeButton Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | `"dark" \| "light" \| "outline"` | No | `"dark"` | Visual style variant controlling background, text color, and border. |
| `className` | `string` | No | `undefined` | Additional CSS classes applied to the `<a>` element. |

### TextBadge Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `className` | `string` | No | `undefined` | Additional CSS classes applied to the `<a>` element. |

## 4. Keyboard Interactions

None. All three components are standard HTML `<a>` links and receive default browser keyboard accessibility (Tab to focus, Enter to follow link).

## 5. Sub-components

The three components (CornerRibbon, BadgeButton, TextBadge) are exported as separate, independent components from a single module. They are not sub-components of each other. Each can be used independently.

### CornerRibbon
A diagonal corner ribbon overlay. See section 2 for full visual details.

### BadgeButton
An inline badge-style link with icon and text. See section 2 for full visual details.

### TextBadge
A minimal text link with icon prefix. See section 2 for full visual details.

## 6. Edge Cases

| Case | Behavior |
|------|----------|
| **CornerRibbon in small viewport** | The 200x200px container may extend beyond the visible area. The ribbon remains positioned but may be partially clipped. |
| **CornerRibbon with `absolute` in non-relative parent** | The ribbon will position relative to the nearest positioned ancestor (standard CSS behavior), or the document body if none exists. |
| **BadgeButton with conflicting `className`** | Custom classes are appended after default variant classes. Later Tailwind classes take precedence. |
| **TextBadge in dark parent** | Inherits text color from parent (`text-inherit`). The 50% opacity applies to the inherited color. |
| **All components** | Always link to the OpenTUI URL. Links always open in a new tab (`target="_blank"`). |

## 7. Rebranding Notes

The following changes must be applied compared to the original ink-web versions:

| Original (ink-web) | Rebranded (opentui) |
|---------------------|---------------------|
| URL: `https://ink-web.dev` | URL: `https://opentui.dev` (or the appropriate OpenTUI project URL) |
| Ribbon text: `"made with ink web"` | Ribbon text: `"made with opentui"` |
| Badge text: `"made with ink web"` | Badge text: `"made with opentui"` |
| TextBadge text: `">_ made with ink web"` | TextBadge text: `">_ made with opentui"` |
| Module/file name: `made-with-ink-web` | Module/file name: `made-with-opentui` |
| Export names unchanged | Export names unchanged (CornerRibbon, BadgeButton, TextBadge) |

The visual styling, layout, positioning, variants, and all other behavior remain identical. Only the branding text and destination URL change.
