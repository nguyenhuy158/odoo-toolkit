# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Chrome (MV3) extension that adds a floating 🛠 dev panel to any Odoo web page. It hosts
developer utilities; today two tools ship — **Field Detector** (warns about view field
references missing from the model, before the client crashes) and **noupdate** (read/toggle
`ir.model.data.noupdate` for a record). The panel is designed to host more tools over time;
see `FEATURES.md` for the phased roadmap and status of planned tools.

## Commands

```bash
make install       # install dev deps (also installs the husky pre-commit hook)
make build         # compile Tailwind → toolkit.css (committed; rebuild after UI class changes)
make watch         # rebuild CSS on change
make lint          # ESLint
make format        # Prettier (write)  /  make format-check (check only)
make test          # node --test
make check         # lint + format-check + test (what the pre-commit hook runs)
```

Run a single test with the native runner's filter:

```bash
node --test --test-name-pattern="manifest.json is valid"
```

Each `make` target just delegates to the matching npm script.

## Pre-commit hook

`.husky/pre-commit` blocks a commit unless **(1)** the branch name matches the convention
checked by `scripts/check-branch-name.sh` (`main`, `develop`, or `<type>/<desc>` where
`type ∈ feature|fix|chore|docs|refactor|test|hotfix|claude`) and **(2)** `make check` passes.
Bypass only with `git commit --no-verify`.

## Architecture — the two-world split

The extension runs as two content scripts in **separate JS worlds**; this split is the core
design constraint and the reason for everything else:

- **`interceptor.js`** — `world: "MAIN"`, injected at `document_start`. Runs in the page's own
  world so it can monkey-patch `window.fetch` / `XMLHttpRequest`. It watches `call_kw` RPCs,
  and for `get_views` responses it replays Odoo's `processArch` traversal over the returned arch
  plus the `models` map to find any field reference that does not exist in `models[model]`. It
  cannot touch the extension APIs or the panel DOM, so it ships findings out via a `CustomEvent`
  (`__odoo_dev_toolkit__`) on `window`, with a deduped `problems` array in `detail`.

- **`ui.js`** — `world: "ISOLATED"`, injected at `document_idle`. Owns the UI and anything
  needing `chrome.*` APIs. It listens for the `__odoo_dev_toolkit__` event, dedupes again, and
  renders. All UI lives inside a **Shadow DOM** (`#__odoo_dev_toolkit_host__`) so Odoo's CSS and
  the extension's never collide; styles come from `toolkit.css` loaded via
  `chrome.runtime.getURL` into the shadow root. Tools that write data (e.g. noupdate) issue
  their own `call_kw` POSTs to `/web/dataset/call_kw` with `credentials: "same-origin"`, so they
  run with the logged-in user's session rights.

Implications when editing:

- The two scripts share **no variables** — only the `CustomEvent` contract. Keep the event
  `detail` shape (`{ problems: [...] }`, each problem `{ model, field, category, viewType, raw }`)
  in sync across both files.
- Detection is **read-only** and heuristic. False-positive guards live in `interceptor.js`:
  domains are validated only in search views, `SKIP_TOKENS` are ignored (`parent`, `id`, `uid`,
  …), and only the first segment of a dotted path is checked. Badge categories (`field`,
  `modifier`, `groupby`, `search-domain`) are defined in both files — `BADGE` in `ui.js` maps
  them to labels/colors.

## CSS workflow

`toolkit.css` is **compiled Tailwind and committed**. After changing utility classes in the
inline HTML template in `ui.js`, run `make build` and commit the regenerated CSS. The Tailwind
content glob is in `tailwind.config.js`.

## Scoping to one Odoo instance

`manifest.json` uses `<all_urls>`. To limit the extension to a single instance, narrow the
`matches` arrays in both `content_scripts` entries and in `web_accessible_resources`.

## Requirements

Chrome 111+ (the extension relies on `world: "MAIN"` content scripts).
