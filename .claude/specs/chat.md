# ChatPanel

## 1. Overview

ChatPanel is a vertical chat interface that displays a scrolling list of messages between a user and an assistant, supports streaming assistant responses, shows active tool call status cards, displays a loading indicator, and provides a text input for composing new messages. It is the primary conversation UI for an AI chat application.

## 2. Visual Layout

The component is laid out vertically (top to bottom) with 1 character of horizontal padding on each side. The sections appear in this order:

1. **Messages list** (top)
2. **Tool call cards** (if any active tool calls)
3. **Streaming text** OR **loading indicator** (mutually exclusive, shown only when applicable)
4. **Chat input** (bottom, separated by 1 blank line from content above)

### Full example with messages, tool calls, streaming text, and input

```
 > Hello, can you help me?
 < Sure! Let me look into that for you.
 > Can you read my file?
     * Read file ...
     + Edit file
 < Reading the file now_
 > Type a message...
```

### Messages area detail

Each message occupies its own line:

**User message:**
```
> Hello, can you help me?
```
- Starts with `> ` (greater-than + space) as a prefix.
- The prefix `> ` is rendered in **bold** with the `userColor` (default: green).
- The message content follows immediately, with word wrapping enabled.

**Assistant message:**
```
< Here is my response.
```
- Starts with `< ` (less-than + space) as a prefix.
- The prefix `< ` is rendered in **bold** with the `assistantColor` (default: blue).
- The message content follows immediately, with word wrapping enabled.

Messages are rendered in order, top to bottom.

### Tool call cards area

Tool calls appear below the messages, each on its own line, indented 2 spaces from the left:

```
  * Read file ...
  + Edit file
```

Each tool call card shows:
- A status icon (see table below) in the status color
- A space
- The tool call title
- If the status is `pending` or `in_progress`, a dim ` ...` suffix is appended

**Status icons and colors:**

| Status | Icon | Unicode | Color |
|--------|------|---------|-------|
| `pending` | `*` | U+2022 (BULLET) | gray |
| `in_progress` | `+` | U+280B (BRAILLE PATTERN) | yellow |
| `completed` | checkmark | U+2713 (CHECK MARK) | green |
| `failed` | X | U+2717 (BALLOT X) | red |

Note: The actual Unicode characters are:
- pending: `\u2022` (bullet dot)
- in_progress: `\u280B` (braille dots, acts as a spinner frame)
- completed: `\u2713` (check mark)
- failed: `\u2717` (ballot X / cross mark)

### Streaming text area

When `streamingText` is non-empty, it renders like an assistant message with a cursor:

```
< Partial response so far_
```

- Prefix `< ` in **bold** with `assistantColor`.
- The streaming text content with word wrapping.
- A dim underscore `_` cursor character appended at the end.

### Loading indicator

When `isLoading` is `true` and `streamingText` is empty/falsy, a loading line appears:

```
  Thinking...
```

- Indented with 2 spaces.
- Rendered in **dim** styling.
- The text is configurable via `loadingText` (default: `"Thinking..."`).

### Streaming vs Loading priority

- If `streamingText` is non-empty, the streaming text is shown (loading indicator is hidden).
- If `streamingText` is empty/falsy AND `isLoading` is `true`, the loading indicator is shown.
- If neither condition is met, neither is shown.

### Chat input area

The chat input appears at the bottom, separated from the content above by 1 blank line (margin-top of 1).

**When empty (showing placeholder):**
```
> Type a message...
```
- The prompt `> ` in `promptColor` (default: green).
- The placeholder text in **dim** styling.
- A block cursor (inverse space) appended after the placeholder (when not disabled).

**When typing:**
```
> Hello worl
```
- The prompt in `promptColor`.
- The typed text in normal styling.
- A block cursor (inverse space) appended after the text (when not disabled).

**When disabled (loading/streaming):**
```
> Type a message...
```
- Same layout but NO block cursor is shown.
- Keyboard input is ignored.

## 3. Props

### ChatPanelProps

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `messages` | `ChatMessage[]` | Yes | -- | Array of messages to display in the chat. |
| `streamingText` | `string` | No | `""` | Partial text being streamed from the assistant. When non-empty, displayed as an in-progress assistant message with a cursor. |
| `isLoading` | `boolean` | No | `false` | Whether the assistant is processing (shows loading indicator when `streamingText` is empty). |
| `activeToolCalls` | `ToolCallInfo[]` | No | `[]` | Currently active tool calls to display as status cards. |
| `onSendMessage` | `(text: string) => void` | Yes | -- | Callback fired when the user submits a message. Receives the trimmed message text. |
| `onCancel` | `() => void` | No | `undefined` | Callback for cancellation (prop is accepted but not wired to any key in the current implementation). |
| `placeholder` | `string` | No | `"Type a message..."` | Placeholder text shown in the input when empty. |
| `promptChar` | `string` | No | `"> "` | The prompt string shown before user input. |
| `promptColor` | `string` | No | `"green"` | Color of the prompt character in the input. |
| `userColor` | `string` | No | `"green"` | Color of the `> ` prefix on user messages. |
| `assistantColor` | `string` | No | `"blue"` | Color of the `< ` prefix on assistant messages and streaming text. |
| `loadingText` | `string` | No | `"Thinking..."` | Text displayed when loading (and not streaming). |

### ChatMessage

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the message. Used as a list key. |
| `role` | `"user" \| "assistant"` | Yes | Determines the prefix character and color. |
| `content` | `string` | Yes | The message text content. |
| `toolCalls` | `ToolCallInfo[]` | No | Tool calls associated with this message (type defined but not rendered inline with the message in the current implementation; `activeToolCalls` prop is used instead). |

### ToolCallInfo

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the tool call. Used as a list key. |
| `title` | `string` | Yes | Display name/description of the tool call (e.g., "Read file", "Search"). |
| `status` | `"pending" \| "in_progress" \| "completed" \| "failed"` | Yes | Current status, determines the icon and color. |
| `result` | `string` | No | Result text from the tool call (accepted but not displayed in the current implementation). |

## 4. Keyboard Interactions

Keyboard input is handled by the ChatInput sub-component. Input is ignored when the input is disabled (i.e., when `isLoading` is `true` or `streamingText` is non-empty).

| Key | Condition | Action |
|-----|-----------|--------|
| **Any printable character** | Not disabled, no Ctrl/Meta modifier held | Appends the character to the current input value. |
| **Backspace** or **Delete** | Not disabled | Removes the last character from the input value. |
| **Enter/Return** | Not disabled | Trims the input value. If the trimmed value is non-empty, calls `onSendMessage(trimmedValue)` and clears the input to empty string. If the trimmed value is empty, does nothing (no callback, input stays empty). |
| **Ctrl+key** or **Meta+key** | -- | Ignored. No characters are appended for modified key combinations. |

### Input state management

- The input maintains an internal text buffer (starts empty).
- Characters are appended one at a time as typed.
- Backspace/Delete removes the last character (not per-word or per-line).
- On successful submit (non-empty trimmed text), the buffer is cleared.
- When disabled, all key handlers are skipped entirely.

## 5. Sub-components

### MessageBubble

Renders a single chat message (user or assistant).

**Visual output:**
- User: `> message content` with `> ` in bold+userColor
- Assistant: `< message content` with `< ` in bold+assistantColor
- Content has word wrapping enabled.

**Props:** `message` (ChatMessage), `userColor` (string, default "green"), `assistantColor` (string, default "blue")

### StreamingText

Renders the in-progress assistant streaming response.

**Visual output:**
```
< partial text here_
```
- `< ` prefix in bold+assistantColor
- Text content with word wrapping
- Dim cursor character `_` appended at the end
- Returns null/nothing when `text` is empty/falsy

**Props:** `text` (string), `assistantColor` (string, default "blue"), `cursorChar` (string, default "_")

### ToolCallCard

Renders a single tool call status line.

**Visual output:**
```
  [icon] [title] [optional ...]
```
- 2 characters of left indentation (padding)
- Status icon in status color
- Space
- Tool call title in status color
- If status is `pending` or `in_progress`: dim ` ...` appended

**Props:** `toolCall` (ToolCallInfo)

### ChatInput

Handles text input with a prompt, placeholder, and block cursor.

**Visual output (empty, enabled):**
```
> Type a message...
                   ^
                   inverse space (block cursor)
```

**Visual output (with text, enabled):**
```
> Hello world
             ^
             inverse space (block cursor)
```

**Visual output (disabled):**
```
> Type a message...
```
(No block cursor)

**Props:** `onSubmit` ((text: string) => void), `placeholder` (string, default "Type a message..."), `prompt` (string, default "> "), `promptColor` (string, default "green"), `disabled` (boolean, default false)

**Behavior:**
- Maintains internal text state starting at `""`.
- Handles character input, backspace, and enter/return.
- Ignores all input when `disabled` is `true`.
- On Enter: trims value, if non-empty calls `onSubmit` and resets to `""`.
- Block cursor (inverse space character) is shown only when not disabled.

## 6. Edge Cases

| Case | Behavior |
|------|----------|
| **Empty messages array** | No messages rendered. Tool calls, streaming text, loading, and input still appear as applicable. |
| **Single message** | Rendered normally on one line. |
| **Very long message text** | Word wrapping is enabled. Text wraps to the next line at the container width. The `> ` or `< ` prefix only appears on the first line. |
| **Empty `streamingText` (`""`)** | Streaming text component returns null. Loading indicator may show if `isLoading` is true. |
| **Both `isLoading` and `streamingText` set** | Streaming text takes priority. Loading indicator is hidden. |
| **Empty `activeToolCalls` array** | No tool call section rendered. |
| **Submitting only whitespace** | Input trims the value. All-whitespace input produces empty string after trim, so `onSendMessage` is NOT called. Input is NOT cleared. |
| **Rapid typing** | Characters are appended individually. Each keystroke updates the display. |
| **Backspace on empty input** | No-op. The value stays as `""`. Slicing empty string returns empty string. |
| **Multiple Enter presses on empty input** | Each is a no-op. No callbacks fire, no state changes. |
| **Message with `toolCalls` field** | The `toolCalls` field on individual messages is accepted in the type but is not rendered by the MessageBubble. Active tool calls are only shown via the `activeToolCalls` prop on ChatPanel. |
| **`onCancel` prop** | Accepted but not connected to any key handler. Available for future use. |
