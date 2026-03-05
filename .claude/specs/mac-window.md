# MacWindow

## 1. Overview

MacWindow is a decorative container that mimics the appearance of a macOS application window. It renders a title bar with three colored "traffic light" buttons (close, minimize, maximize), an optional centered title, and a content area below. This is a **web/HTML component** (not a TUI component) designed for use in documentation sites, demos, or landing pages to frame terminal content in a familiar macOS-style chrome.

## 2. Visual Layout

The component is a rounded rectangle with a border, card background, and drop shadow.

### Full example (with title)

```
+--------------------------------------------------+
| [red] [yellow] [green]       my-terminal          |
|--------------------------------------------------|
|                                                  |
|  [children content here]                         |
|                                                  |
+--------------------------------------------------+
```

### Title bar detail

The title bar is a horizontal 3-column grid layout:

```
| [*] [*] [*]    |        Title        |           |
  ^                        ^                ^
  Left column              Center column    Right column
  (traffic lights)         (title, centered)(empty, for balance)
```

- **Left column**: Three small circular buttons in a row with a small gap between them.
  - Red button (close): 12px diameter, red-500 background, red-600 on hover
  - Yellow button (minimize): 12px diameter, yellow-500 background, yellow-600 on hover
  - Green button (maximize): 12px diameter, green-500 background, green-600 on hover
  - Each button has a smooth color transition on hover
  - Each has an appropriate ARIA label: "Close", "Minimize", "Maximize"
  - Each is a `<button>` element with `type="button"`

- **Center column**: The title text (if provided), centered, in a small muted-foreground color, user-select disabled.

- **Right column**: Empty div for symmetrical layout balance.

- The title bar has:
  - Horizontal padding: ~12px (px-3)
  - Vertical padding: ~10px (py-2.5)
  - Bottom border separating it from content
  - Subtle muted background (bg-muted/50, i.e., muted at 50% opacity)

### Without title

```
+--------------------------------------------------+
| [red] [yellow] [green]                            |
|--------------------------------------------------|
|                                                  |
|  [children content here]                         |
|                                                  |
+--------------------------------------------------+
```

- The center column is simply omitted (no title element rendered).
- The 3-column grid still balances the layout.

### Content area

- Below the title bar
- Has `overflow: hidden`
- Renders children directly

### Overall container styling

- Rounded corners: large (rounded-2xl, ~16px)
- Border: standard card border
- Background: card background color
- Shadow: large drop shadow (shadow-lg)
- Overflow: hidden (clips content to rounded corners)
- Optional `className` can extend/override styling
- Optional `minWidth` sets a minimum width (via inline style)

## 3. Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | Yes | -- | Content rendered inside the window below the title bar. |
| `className` | `string` | No | `undefined` | Additional CSS classes applied to the outermost container. Merged with the default classes. |
| `title` | `string` | No | `undefined` | Text displayed centered in the title bar. When omitted, the center area is empty. |
| `minWidth` | `number \| string` | No | `undefined` | Minimum width of the window. Applied as an inline `style.minWidth`. Can be a number (pixels) or string (e.g., `"400px"`, `"50%"`). |
| `onClose` | `() => void` | No | `undefined` | Callback fired when the red (close) button is clicked. |
| `onMinimize` | `() => void` | No | `undefined` | Callback fired when the yellow (minimize) button is clicked. |
| `onMaximize` | `() => void` | No | `undefined` | Callback fired when the green (maximize) button is clicked. |

### Prop behavior details

- **`children`**: Any HTML/JSX content. Rendered in a div with `overflow: hidden`.
- **`className`**: Appended to the default container classes. Can be used to override dimensions, background, etc.
- **`title`**: When provided, rendered as a centered div in the title bar. Uses small text size, muted-foreground color, and `user-select: none`. When omitted, the center column of the title bar grid is not rendered (but the grid column still exists for balance).
- **`minWidth`**: Applied to the root element via inline style only when the value is not null/undefined.
- **`onClose`/`onMinimize`/`onMaximize`**: Click handlers for the respective traffic light buttons. When not provided, the buttons still render but clicking them does nothing.

## 4. Keyboard Interactions

None. The traffic light buttons are standard HTML buttons and are accessible via Tab key / Enter / Space by default browser behavior, but the component does not add any custom keyboard handlers.

## 5. Sub-components

None. MacWindow is a single component. The traffic light buttons are inline elements, not extracted as sub-components.

## 6. Edge Cases

| Case | Behavior |
|------|----------|
| **No title** | Title bar still renders with traffic lights. Center area is empty. The 3-column grid layout keeps the buttons left-aligned. |
| **No callbacks** | All three buttons render but are non-functional (clicks do nothing). |
| **No children** | The content area renders as an empty div. The title bar and window chrome still appear. |
| **Very long title** | Title is rendered in the center column. If it overflows, it is constrained by the grid column width. No explicit truncation is applied. |
| **`minWidth` as number** | Applied directly as `style.minWidth` in pixels. |
| **`minWidth` as string** | Applied directly as `style.minWidth` (e.g., "50%", "400px"). |
| **`className` conflicts** | Custom classes are appended after default classes. In Tailwind CSS, later classes generally take precedence for conflicting properties. |
| **Nested MacWindows** | Supported. Each renders its own title bar and chrome. |
