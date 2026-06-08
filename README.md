# Odoo Dev Toolkit (Chrome extension)

A toolkit for Odoo developers, shown as a floating 🛠 panel with tabs.

## Tools

- **Field Detector** — flags views referencing fields missing from the model (details below).
- **noupdate** — read and toggle `ir.model.data.noupdate` for a record by XML ID
  (`module.name`) or by `model` + `res_id`. Writes run with your logged-in session rights
  via a `call_kw` RPC; remember a module upgrade can reset the flag from the XML definition.

## Field Detector

It catches the client crash:

> `TypeError: undefined is not an object (evaluating 'models[resModel][fieldName].string')`

It listens to every `get_views` RPC, replays Odoo's `processArch` traversal, and reports any
field reference that does not exist in `models[model]` — before the client crashes. The panel
is built to host more dev tools over time.

## What the Field Detector scans

| Badge     | Where                                               | Confidence |
| --------- | --------------------------------------------------- | ---------- |
| `FIELD`   | `<field name>` (incl. relational sub-views)         | High       |
| `ATTRS`   | `attrs` / `modifiers` domain leaves                 | High       |
| `GROUPBY` | `groupby` attribute and `context` `group_by`        | High       |
| `DOMAIN`  | `domain` / `filter_domain` in **search** views only | Medium     |

False-positive guards: domains validated only in search views (form/tree `<field domain>`
operands target the related model, not in the payload), special tokens skipped (`parent`,
`id`, `uid`, ...), only the first segment of dotted paths is checked. Detection is read-only.

## Architecture

| File             | World    | Role                                                            |
| ---------------- | -------- | --------------------------------------------------------------- |
| `interceptor.js` | MAIN     | Patches `fetch`/`XHR`, scans `get_views`, dispatches a DOM event |
| `ui.js`          | ISOLATED | Shadow-DOM panel (Tailwind), tools, `call_kw` RPC, JSON export    |
| `toolkit.css`    | —        | Compiled Tailwind, injected into the shadow root                 |

The UI lives in a Shadow DOM so Odoo's CSS and the extension's never collide.

## Build the CSS

The compiled `toolkit.css` is committed. To rebuild after changing UI classes:

```bash
cd tools/odoo-dev-toolkit
npm install      # or rely on npx
npm run build    # tailwindcss -i src/input.css -o toolkit.css --minify
# npm run watch  # rebuild on change
```

## Install (unpacked)

1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select this folder
3. Reload the Odoo tab. A 🛠 button appears bottom-right; a red counter shows detected issues.

Requires Chrome 111+ (`world: "MAIN"` content scripts).

## Output

- Floating panel listing `BADGE model <view> field`, with **Export JSON** and **Clear**.
- Grouped `console.error` per RPC (category, model, view, field, RPC URL).
- `window.__odooDevToolkit.problems` in the page console.

## Limit to one instance (optional)

Edit `matches` in `manifest.json`, e.g. `"matches": ["https://farmnet.techcoop.dev/*"]`
(both content scripts and `web_accessible_resources`).
