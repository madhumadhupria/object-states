# Object States

A minimal 3D prototype demonstrating an architectural interaction language for
object highlighting and focus states. When one object becomes active, the rest
of the scene visually recedes — fades, loses contrast, and reads as quiet
background massing. The selected object stays the unambiguous focal point.

This is **not** a modeling tool. There are no camera controls, gizmos, or
panels — just the state system itself.

## Run

It's a static page with no build step. Serve the folder and open it:

```bash
# Any static server works; pick one.
python3 -m http.server 5173
# then open http://localhost:5173
```

(Opening `index.html` directly via `file://` will fail — ES modules require a
real HTTP origin.)

## Interaction

| Action                 | Effect                                                  |
| ---------------------- | ------------------------------------------------------- |
| Hover an object        | Object enters **hover** state, others fade to background |
| Click an object        | Object becomes **selected** (sticky)                    |
| Click and hold         | Object enters **pressed** state                          |
| Click empty space      | Clear selection                                          |
| `Shift` + click        | Toggle **disabled** on that object                      |
| `Esc`                  | Clear everything                                         |
| Click the **Color** toggle (or press `C`) | Switch between monochrome massing and identity-colored buildings |

### Color mode

Each building has an architectural identity color (clay, slate, ochre, sage, terracotta, slate-purple). All five state behaviors carry over:

- **default** shows the building's color at full opacity
- **hover / selected / pressed** blend the accent treatment over the base color so the blue outline still leads while identity remains visible (20 / 40 / 55 % blend)
- **background** fades to white at ~45% — the rest of the scene still recedes into a quiet "context massing" state when one building is the focus
- **disabled** still nearly disappears

## State system

Five visual states, each driven by tokens pulled from the Figma source spec.

| State        | Outline                              | Surface                         |
| ------------ | ------------------------------------ | ------------------------------- |
| `default`    | `#808080` @ 1px, full opacity        | `#ffffff` solid                  |
| `hover`      | `#0696D7` @ ~1.4px                   | `#9BD5EF` @ 30%                  |
| `selected`   | `#0696D7` @ 2px                      | `#CDEAF7` @ 60%                  |
| `pressed`    | `#006EAF` @ ~2.4px                   | `#6AC0E7` @ 50%                  |
| `background` | `#D9D9D9` @ 0.5px, 50% opacity        | `#ffffff` @ 45%                  |
| `disabled`   | `#D9D9D9` @ 0.5px, 25% opacity        | `#EEEEEE` @ 20%                  |

Transitions are exponential lerps in `js/states.js` (8 Hz convergence) — soft
fades, no abrupt switching.

## Layout

```
.
├── index.html            # entry, importmap for three.js, hint UI
├── styles/main.css       # token-driven UI chrome (legend, state panel)
├── js/
│   ├── tokens.js         # design tokens + per-state visual specs
│   ├── scene.js          # renderer, camera, lighting
│   ├── buildings.js      # geometry factory + outline construction
│   ├── states.js         # state controller (focus/disabled, lerp loop)
│   └── main.js           # entry — wiring, picking, render loop
```

## Source

Design tokens and state specs from Figma node `44:3082` in
[Component testing dump](https://www.figma.com/design/PZ8hU7df3gunE3uyA5jwVT/Component-testing-dump?node-id=44-3082).
