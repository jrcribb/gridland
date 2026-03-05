# Modal

## 1. Overview

Modal is a bordered container that overlays content in a TUI application. It draws a box border around its children, optionally displays a title at the top, and listens for the Escape key to trigger a close callback. It is used for dialogs, settings panels, help screens, and any content that should appear as a focused overlay.

## 2. Visual Layout

The modal fills all available vertical and horizontal space (flex grow). It renders as a bordered box with optional title.

### Default (with title, round border, blue color)

```
+-------------------------------------------+
|                                            |
|  My Dialog Title                           |
|                                            |
|  [children content goes here]              |
|                                            |
+-------------------------------------------+
```

Note: The actual border characters depend on the `borderStyle` prop. The default `round` style uses rounded corners:

```
╭───────────────────────────────────────────╮
│                                           │
│ My Dialog Title                           │
│                                           │
│ [children content goes here]              │
│                                           │
╰───────────────────────────────────────────╯
```

### Layout details

- The outer container stretches to fill available space vertically (flex column, flex grow).
- The bordered box also stretches vertically (flex column, flex grow).
- The border is drawn in the `borderColor` (default: blue).
- If a `title` is provided:
  - It appears at the top of the bordered box.
  - It has 1 character of horizontal padding on each side.
  - It has 1 line of margin below it (blank line between title and children).
  - The title text is **bold** and colored with `borderColor`.
- Children are rendered below the title (or at the top if no title).

### Without title

```
╭───────────────────────────────────────────╮
│                                           │
│ [children content goes here]              │
│                                           │
╰───────────────────────────────────────────╯
```

- No title, no extra margin at top. Children start immediately inside the border.

### Border styles

The `borderStyle` prop supports these styles:

| Style | Example corners/edges |
|-------|-----------------------|
| `single` | `┌─┐│└─┘` |
| `double` | `╔═╗║╚═╝` |
| `round` (default) | `╭─╮│╰─╯` |
| `bold` | `┏━┓┃┗━┛` |
| `singleDouble` | `╓─╖║╙─╜` |
| `doubleSingle` | `╒═╕│╘═╛` |
| `classic` | `+─+|+─+` |
| `arrow` | `↘↓↙→←↗↑↖` |

## 3. Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | Yes | -- | The content rendered inside the modal border. |
| `title` | `string` | No | `undefined` | Optional title displayed at the top inside the border. Rendered bold in the `borderColor`. |
| `borderColor` | `string` | No | `"blue"` | Color of the border and the title text. |
| `borderStyle` | `"single" \| "double" \| "round" \| "bold" \| "singleDouble" \| "doubleSingle" \| "classic" \| "arrow"` | No | `"round"` | The character set used for drawing the border. |
| `onClose` | `() => void` | No | `undefined` | Callback invoked when the Escape key is pressed. If not provided, Escape key presses are ignored. |

### Prop behavior details

- **`children`**: Any content. Rendered inside the bordered box below the title.
- **`title`**: When provided, appears inside the border at the top with 1 character horizontal padding and 1 line bottom margin. When omitted, no title area or margin is rendered.
- **`borderColor`**: Applies to both the border characters and the title text color. Changing this prop updates both simultaneously.
- **`borderStyle`**: Changes the set of Unicode characters used for corners and edges. Does not affect sizing or layout.
- **`onClose`**: When provided and the Escape key is pressed, this callback fires. When not provided, Escape key presses have no effect.

## 4. Keyboard Interactions

| Key | Action |
|-----|--------|
| `Escape` | Calls `onClose()` if the `onClose` prop is provided. No effect if `onClose` is `undefined`. |

No other keys are handled. All other input passes through to children.

## 5. Sub-components

None. Modal is a single component that wraps its children.

## 6. Edge Cases

| Case | Behavior |
|------|----------|
| **No children** | An empty bordered box is rendered. |
| **No title** | The border is drawn but no title or title margin appears. Children start at the top of the interior. |
| **No `onClose`** | The Escape key is listened for but has no effect (the handler checks for the callback before invoking it). |
| **Very long title** | The title text is rendered at full length. It may extend to fill the width of the border. No truncation. |
| **Empty string title (`""`)** | Behaves as falsy -- no title is rendered. Same as omitting the title prop. |
| **Children taller than viewport** | The modal grows vertically. No built-in scrolling; the content may overflow the visible area depending on the parent layout. |
| **Escape pressed multiple times** | `onClose` fires on each Escape press. The component does not track open/closed state internally. The parent controls visibility. |
