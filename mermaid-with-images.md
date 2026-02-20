# Mermaid Flowchart Customization Guide

Deep dive into flowchart customization — shapes, colors, layout, styling, and advanced patterns.

---

## Node Shapes

Every shape has semantic meaning. Choose based on the node's purpose.

*[Diagram 1 failed to render]*


**Shape Syntax Quick Reference:**

| Shape | Syntax | Use Case |
|-------|--------|----------|
| Rectangle | `[text]` | Standard process |
| Rounded | `([text])` | Start/end points |
| Stadium | `([text])` | Same as rounded |
| Subroutine | `[[text]]` | Function call |
| Cylindrical | `[(text)]` | Database |
| Circle | `((text))` | Connection point |
| Double Circle | `(((text)))` | - |
| Asymmetric | `>text]` | Choice/flag |
| Rhombus | `{text}` | Decision |
| Hexagon | `{{text}}` | Preparation |
| Parallelogram (input) | `[/text/]` | Input data |
| Parallelogram (output) | `[\text\]` | Output data |
| Trapezoid | `[/text\]` | Manual operation |
| Inverted Trapezoid | `[\text/]` | - |

---

## Arrow Types and Line Styles

Arrows communicate relationships. Mix types to show different connection meanings.

![Diagram 2](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-2.png)


**Arrow Syntax:**

| Pattern | Code | Meaning |
|---------|------|---------|
| Solid line, arrow | `-->` | Standard flow |
| Dotted line, arrow | `-.->` | Optional/fallback |
| Thick line, arrow | `==>` | Primary/critical path |
| Solid line, no arrow | `---` | Association |
| Dotted line, no arrow | `-.-` | Weak association |
| Crossed | `--x` | Blocked |
| Circle ends | `o--o` | Bidirectional |
| Double arrow | `<-->` | Two-way communication |

**Adding Labels:**

![Diagram 3](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-3.png)


**Longer Arrows (add dashes):**

![Diagram 4](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-4.png)


---

## Color and Styling with classDef

`classDef` creates reusable style classes. Apply to multiple nodes for consistency.

### Basic classDef Pattern

![Diagram 5](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-5.png)


**classDef Syntax:**

```
classDef <className> <property>:<value>,<property>:<value>,...
class <nodeId> <className>
```

**Common Properties:**

| Property | Values | Example |
|----------|--------|---------|
| `fill` | Color hex/rgb | `fill:#ff6b6b` |
| `stroke` | Border color | `stroke:#c92a2a` |
| `stroke-width` | Border thickness | `stroke-width:3px` |
| `color` | Text color | `color:#fff` |
| `stroke-dasharray` | Dash pattern | `stroke-dasharray: 5 5` |
| `rx` | Corner radius | `rx:10px` |
| `ry` | Corner radius | `ry:10px` |

### Multiple Classes on One Node

![Diagram 6](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-6.png)


### Inline Styling (Quick One-offs)

![Diagram 7](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-7.png)


---

## Theme Customization

Apply global themes to entire diagrams.

### Pre-built Themes

![Diagram 8](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-8.png)


Available themes: `default`, `dark`, `forest`, `neutral`, `base`

### Custom Theme Variables

![Diagram 9](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-9.png)


**Common Theme Variables:**

```javascript
{
  'primaryColor': '#color',        // Main nodes
  'primaryTextColor': '#color',    // Text on primary
  'primaryBorderColor': '#color',  // Border on primary
  'secondaryColor': '#color',      // Secondary nodes
  'tertiaryColor': '#color',       // Tertiary nodes
  'lineColor': '#color',           // Connector lines
  'fontSize': '16px',              // Base font size
  'fontFamily': 'sans-serif',      // Font family
  'background': '#color',          // Diagram background
  'mainBkg': '#color',             // Node background
  'textColor': '#color',           // Default text color
  'edgeLabelBackground': '#color'  // Label background
}
```

---

## Layout and Direction

Control diagram orientation and flow.

![Diagram 10](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-10.png)


![Diagram 11](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-11.png)


![Diagram 12](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-12.png)


![Diagram 13](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-13.png)


**Direction Codes:**

- `TD` or `TB` — Top Down / Top to Bottom (default)
- `LR` — Left to Right
- `RL` — Right to Left
- `BT` — Bottom to Top

---

## Subgraphs for Grouping

Subgraphs visually group related nodes and can have their own direction.

### Basic Subgraph

![Diagram 14](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-14.png)


### Named Subgraphs with Custom Direction

![Diagram 15](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-15.png)


### Nested Subgraphs

![Diagram 16](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-16.png)


### Styled Subgraphs

![Diagram 17](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-17.png)


---

## Advanced Styling Patterns

### Individual Node Styling

![Diagram 18](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-18.png)


### Link Styling by Index

![Diagram 19](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-19.png)


**Link Styling Properties:**

```
linkStyle <index> stroke:<color>,stroke-width:<width>,stroke-dasharray:<pattern>
```

### Default Styles for All Nodes/Links

![Diagram 20](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-20.png)


**Curve Options:**

- `basis` — Smooth curves
- `linear` — Straight lines
- `step` — Step-like connections
- `stepBefore` — Step before
- `stepAfter` — Step after

---

## Practical Styling Patterns

### Status Indicators

![Diagram 21](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-21.png)


### Priority Levels

![Diagram 22](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-22.png)


### Environment Layers

![Diagram 23](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-23.png)


### Data Flow with Emphasis

![Diagram 24](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-24.png)


---

## Interactive Features

### Clickable Nodes

*[Diagram 25 failed to render]*


**Click Syntax:**

```
click <nodeId> "<url>" "<tooltip>" [_blank/_self/_parent/_top]
click <nodeId> href "<url>" "<tooltip>"
click <nodeId> call <function>() "<tooltip>"
```

### Tooltips (via title attribute)

*[Diagram 26 failed to render]*


---

## Layout Optimization

### Managing Complex Layouts

**Problem: Messy crossing lines**

![Diagram 27](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-27.png)


**Solution: Use invisible nodes for routing**

![Diagram 28](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-28.png)


### Rank Separation Control

Force nodes onto the same level:

![Diagram 29](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-29.png)


---

## Real-World Examples

### CI/CD Pipeline

![Diagram 30](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-30.png)


### Authentication Flow with Error Handling

![Diagram 31](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-31.png)


---

## Debugging Tips

1. **Test incrementally** — Add nodes/styling one at a time
2. **Use mermaid.live** for real-time preview
3. **Comment out sections** to isolate issues:

![Diagram 32](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-32.png)


4. **Validate class names** — must be alphanumeric
5. **Check link indices** — `linkStyle 0` is the first arrow, counting from top

---

## Cheat Sheet: Property Values

**Colors:**
- Hex: `#ff6b6b`
- RGB: `rgb(255, 107, 107)`
- RGBA: `rgba(255, 107, 107, 0.5)`
- Named: `red`, `blue`, `green`

**Sizes:**
- Pixels: `2px`, `10px`
- Percent: `50%`
- Em: `1.5em`

**Stroke Patterns:**
- Solid: `stroke-width:2px`
- Dashed: `stroke-dasharray: 5 5`
- Dotted: `stroke-dasharray: 1 3`
- Long dash: `stroke-dasharray: 10 5`

**Font Families:**
- `monospace`
- `sans-serif`
- `serif`
- `'Inter', system-ui, sans-serif`

---

## Common Color Palettes

### Status Colors (Friendly)

```
Success: fill:#51cf66,stroke:#2b8a3e,color:#fff
Warning: fill:#ffd43b,stroke:#f59f00,color:#000
Error: fill:#ff6b6b,stroke:#c92a2a,color:#fff
Info: fill:#4dabf7,stroke:#1971c2,color:#fff
Neutral: fill:#adb5bd,stroke:#495057,color:#fff
```

### Priority Levels

```
P0 Critical: fill:#fa5252,stroke:#c92a2a,color:#fff
P1 High: fill:#ff922b,stroke:#e8590c,color:#fff
P2 Medium: fill:#ffd43b,stroke:#fab005,color:#000
P3 Low: fill:#94d82d,stroke:#5c940d,color:#000
```

### Environment Tiers

```
Dev: fill:#e3f2fd,stroke:#1976d2,color:#000
Staging: fill:#fff3e0,stroke:#f57c00,color:#000
Production: fill:#ffebee,stroke:#c62828,color:#000
```

---

## Quick Customization Workflow

1. **Build structure** (nodes + arrows)
2. **Define classDef** for common styles
3. **Apply classes** to nodes
4. **Style links** if needed
5. **Add subgraphs** for grouping
6. **Apply theme** if needed
7. **Test and refine**

**Template:**

![Diagram 33](file:///home/exoulster/.openclaw/workspace/mermaid-diagrams/diagram-33.png)

