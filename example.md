# Mermaid Markdown Editor Example

Welcome to the **Mermaid Markdown Editor**! This tool lets you edit markdown files with live preview and interactive mermaid diagrams.

## Features

- Real-time markdown preview
- Mermaid diagram rendering with pan and zoom
- Bidirectional file sync
- Multiple tabs support

## Flowchart Example

```mermaid
flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Editor
    participant Server
    participant FileSystem

    User->>Editor: Edit markdown
    Editor->>Server: Save request
    Server->>FileSystem: Write file
    FileSystem-->>Server: Success
    Server-->>Editor: Saved

    FileSystem->>Server: File changed externally
    Server->>Editor: WebSocket notification
    Editor->>User: Show updated content
```

## Class Diagram

```mermaid
classDiagram
    class Editor {
        +content: string
        +dirty: boolean
        +setContent(string)
        +getContent(): string
    }

    class TabManager {
        +tabs: Tab[]
        +activeTab: Tab
        +addTab(path, content)
        +removeTab(id)
        +switchToTab(id)
    }

    class Tab {
        +id: string
        +path: string
        +content: string
        +dirty: boolean
    }

    TabManager --> Tab
    Editor --> TabManager
```

## Code Example

Here's some TypeScript code:

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet("World"));
```

## Lists

### Unordered
- Item one
- Item two
- Item three

### Ordered
1. First
2. Second
3. Third

## Blockquote

> This is a blockquote. It can span multiple lines and contain **formatted** text.

## Table

| Feature | Status |
|---------|--------|
| Editor | Done |
| Preview | Done |
| Tabs | Done |
| Sync | Done |

---

*Edit this file to see live updates!*
