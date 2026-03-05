# StatusBar

## 1. Overview

StatusBar is a horizontal bar that displays keybinding hints to the user. Each hint shows a key/key-combination and its associated action label. An optional `extra` slot can display arbitrary content to the left of the keybinding hints, separated by a vertical pipe character. This component is typically placed at the bottom of the screen to show available keyboard shortcuts.

## 2. Visual Layout

All content appears on a single horizontal line with spacing between groups.

### Default (items only, no extra)

```
 Tab  switch focus   ←→  navigate   q  quit
```

- Each item consists of two parts on the same line:
  1. The **key** text, rendered with **inverse** + **bold** styling, padded with one space on each side: ` Tab `
  2. The **label** text, rendered with **dim** styling, preceded by one space: ` switch focus`
- Items are separated by 1 character of space between them (gap=1 between item groups).

### With `extra` content

```
ExtraContent  │   Tab  switch focus   ←→  navigate
```

- The `extra` content appears first on the line.
- A **dim** vertical pipe character `│` (U+2502, BOX DRAWINGS LIGHT VERTICAL) separates the extra content from the keybinding hints.
- There are 2 characters of space (gap=2) between the extra content, the pipe, and the keybinding hints section.

### ASCII art detail for a single item

```
[ Tab ] switch focus
^     ^
|     |
inverse+bold
        ^^^^^^^^^^^^^
        dim text
```

Note: `[...]` denotes inverse styling; in the actual terminal foreground and background swap.

### With no extra

```
 Tab  switch focus   ←→  navigate   q  quit
```

- No pipe separator is shown when `extra` is not provided.
- The keybinding hints start immediately.

## 3. Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `StatusBarItem[]` | Yes | -- | Array of keybinding hints to display. |
| `extra` | `ReactNode` | No | `undefined` | Optional content rendered to the left of the keybinding hints. When provided, a dim `│` separator appears between it and the hints. |

### StatusBarItem

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | `string` | Yes | The key or key combination text (e.g., `"Tab"`, `"←→"`, `"q"`, `"Ctrl+C"`). |
| `label` | `string` | Yes | Description of what the key does (e.g., `"switch focus"`, `"navigate"`, `"quit"`). |

### Prop behavior details

- **`items`**: Rendered left-to-right in array order. Each item's `key` is displayed with inverse+bold styling (padded ` key `), followed by a space, followed by the `label` in dim text.
- **`extra`**: Can be any renderable content (text, another component, etc.). When present, it is rendered first, then a dim `│` separator, then the items. When absent, no separator is shown and items render from the start.

## 4. Keyboard Interactions

None. StatusBar is a purely presentational component. It displays what keys are available but does not handle any input itself.

## 5. Sub-components

None. StatusBar is a single flat component.

## 6. Edge Cases

| Case | Behavior |
|------|----------|
| **Empty items array** (`items=[]`) | No keybinding hints are rendered. If `extra` is provided, it and the separator are still shown (followed by an empty hints area). |
| **Single item** | That one item is rendered normally. |
| **Very long key text** | Rendered in full with inverse+bold styling and space padding. No truncation. |
| **Very long label text** | Rendered in full with dim styling. No truncation. The component grows horizontally. |
| **`extra` without items** | The extra content is shown, followed by the dim pipe separator, followed by nothing. |
| **No `extra`, no items** | Nothing is rendered. |
| **Items with same key** | Each item is identified by the combination of `key` + `label` for uniqueness. Duplicate key strings are technically allowed but the combination of key+label should be unique. |
| **Special characters in key/label** | Rendered as-is. Unicode arrows, symbols, etc. display correctly. |
