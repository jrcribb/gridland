# TabBar

## 1. Overview

TabBar is a horizontal, single-line selector that displays a row of text options, one of which is visually marked as "selected." It optionally shows a leading label (e.g. "View" or "Mode") before the options. It is a **display-only** component -- it does not handle keyboard input itself. The parent is responsible for tracking and updating `selectedIndex`.

## 2. Visual Layout

All content appears on a single horizontal line. Each option is padded with one space on each side.

### Default (focused, with label)

```
View  Option1  Option2  Option3
      ^^^^^^^^
```

- `View` is rendered in **bold**.
- `Option1` (the selected option at index 0) is rendered with **inverse** + **bold** styling in the `activeColor` (default: cyan). The text is surrounded by one space on each side: ` Option1 `.
- `Option2` and `Option3` are rendered in normal styling, each also padded with one space on each side: ` Option2 `, ` Option3 `.
- There is exactly one space between the label and the first option.

### Focused, no label

```
 Option1  Option2  Option3
```

- The leading label is omitted entirely.
- A single space still appears before the first option (there is always one space before the options block).

### Unfocused (focused=false)

```
View  Option1  Option2  Option3
```

- The label is rendered with **dim** styling (not bold).
- The selected option is rendered with **inverse** + **bold** + **dim** styling, but without `activeColor`.
- All non-selected options are rendered with **dim** styling.

### Selected index in the middle

With `selectedIndex=1`:

```
View  Option1  Option2  Option3
               ^^^^^^^^
```

- `Option2` gets the inverse+bold treatment; all others are normal.

### ASCII art detail (focused, selectedIndex=0)

```
Label [Option1] Option2  Option3
      ^       ^
      |       |
      inverse+bold+cyan
```

Note: `[...]` is used here to denote inverse styling; in the actual terminal the background and foreground colors swap.

## 3. Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | No | `undefined` | Text label shown before the options. When omitted, no label is rendered but the leading space before options is still present. |
| `options` | `string[]` | Yes | -- | Array of option strings to display. |
| `selectedIndex` | `number` | Yes | -- | Zero-based index of the currently selected option. |
| `focused` | `boolean` | No | `true` | Whether the tab bar appears focused. Affects bold/dim/color styling. |
| `activeColor` | `string` | No | `"cyan"` | The foreground color applied to the selected option text when `focused` is `true`. Has no effect when `focused` is `false`. |

### Prop behavior details

- **`label`**: When provided, rendered first on the line. When `focused=true`, rendered bold. When `focused=false`, rendered dim. When omitted, nothing is rendered for the label but the separator space is still present.
- **`options`**: Each option is rendered with one leading space and one trailing space (i.e., ` text `). Options are placed consecutively with no additional separator between them.
- **`selectedIndex`**: The option at this index receives inverse+bold styling. If `focused=true`, it also receives the `activeColor` foreground color. Out-of-range values will result in no option being highlighted.
- **`focused`**: Controls the visual distinction between active and inactive states. When `false`, all text becomes dim.
- **`activeColor`**: Applied as the text color (foreground) on the selected option when focused. The inverse styling swaps foreground and background, so this color effectively becomes the background of the selected option in most terminals.

## 4. Keyboard Interactions

None. TabBar is a purely presentational component. The parent component is responsible for listening to keyboard input (e.g., left/right arrow keys) and updating `selectedIndex` accordingly.

## 5. Sub-components

None. TabBar is a single flat component.

## 6. Edge Cases

| Case | Behavior |
|------|----------|
| **Empty options array** (`options=[]`) | Only the label (if provided) and the separator space are rendered. No options appear. |
| **Single option** (`options=["Only"]`) | That option is displayed. If `selectedIndex=0`, it gets the selected styling. |
| **`selectedIndex` out of range** | No option receives inverse/bold styling. All options render as non-selected. |
| **Very long option text** | The option text is rendered at its full length with the padding spaces. No truncation is performed. The component grows horizontally. |
| **Very long label** | The label is rendered at full length. No truncation. |
| **`label` is empty string `""`** | The label element IS rendered (as empty), but visually it produces no text. The separator space still appears. This is distinct from `label={undefined}` where the label element is not rendered at all. |
| **Special characters in options** | Rendered as-is. No escaping or sanitization. |
