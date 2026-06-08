(function () {
  "use strict";

  const EVENT = "__odoo_dev_toolkit__";
  const problems = [];
  const seen = new Set();

  const BADGE = {
    field: { label: "FIELD", cls: "bg-rose-400 text-slate-900" },
    modifier: { label: "ATTRS", cls: "bg-amber-300 text-slate-900" },
    groupby: { label: "GROUPBY", cls: "bg-cyan-300 text-slate-900" },
    "search-domain": { label: "DOMAIN", cls: "bg-violet-300 text-slate-900" }
  };

  let shadow, panel, launcher, listEl, countEl, dotEl;

  async function callKw(model, method, args, kwargs) {
    const res = await fetch("/web/dataset/call_kw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: { model, method, args: args || [], kwargs: kwargs || {} }
      })
    });
    const data = await res.json();
    if (data.error) {
      const e = data.error.data || {};
      throw new Error(e.message || data.error.message || "RPC error");
    }
    return data.result;
  }

  function build() {
    const host = document.createElement("div");
    host.id = "__odoo_dev_toolkit_host__";
    document.documentElement.appendChild(host);
    shadow = host.attachShadow({ mode: "open" });

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("toolkit.css");
    shadow.appendChild(link);

    const root = document.createElement("div");
    root.innerHTML = `
      <button id="odt-launcher"
        class="fixed bottom-4 right-4 z-[2147483647] h-11 w-11 rounded-full bg-emerald-500 text-white shadow-lg flex items-center justify-center cursor-pointer hover:bg-emerald-400 text-lg">
        <span class="relative">🛠
          <span id="odt-dot"
            class="hidden absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-4 text-center">0</span>
        </span>
      </button>

      <div id="odt-panel"
        class="hidden fixed bottom-4 right-4 z-[2147483647] w-[460px] max-h-[62vh] flex flex-col rounded-xl bg-slate-900 text-slate-100 shadow-2xl ring-1 ring-rose-500/40 overflow-hidden">

        <div class="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-700 bg-slate-800/60">
          <div class="flex flex-col">
            <span class="text-sm font-semibold text-emerald-300">🛠 Odoo Dev Toolkit</span>
            <span class="text-[11px] text-slate-400">developer utilities</span>
          </div>
          <button id="odt-min"
            class="rounded-md px-2 py-1 text-[11px] font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 cursor-pointer">—</button>
        </div>

        <div class="flex gap-1 px-3 pt-2 border-b border-slate-700">
          <button data-tab="detector"
            class="odt-tab px-3 py-1 text-xs rounded-t-md bg-slate-800 cursor-pointer border-b-2 border-emerald-400 text-slate-100">Field Detector</button>
          <button data-tab="noupdate"
            class="odt-tab px-3 py-1 text-xs rounded-t-md bg-slate-800 cursor-pointer border-b-2 border-transparent text-slate-400 hover:text-slate-200">noupdate</button>
        </div>

        <div id="odt-tab-detector" class="flex-1 overflow-auto flex flex-col">
          <div id="odt-list" class="flex-1 overflow-auto px-3 py-2 space-y-1.5 text-xs font-mono">
            <div class="text-slate-500 text-center py-6">No issues detected yet. Navigate Odoo views…</div>
          </div>
          <div class="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-slate-700 bg-slate-800/60">
            <span id="odt-count" class="text-[11px] text-slate-400">0 issue(s)</span>
            <div class="flex items-center gap-1.5">
              <button id="odt-export"
                class="rounded-md px-2 py-1 text-[11px] font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 cursor-pointer">Export JSON</button>
              <button id="odt-clear"
                class="rounded-md px-2 py-1 text-[11px] font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 cursor-pointer">Clear</button>
            </div>
          </div>
        </div>

        <div id="odt-tab-noupdate" class="hidden flex-1 overflow-auto space-y-3 px-3 py-3 text-xs">
          <div>
            <label class="block text-[11px] text-slate-400 mb-1">XML ID (module.name)</label>
            <input id="odt-xmlid" type="text" placeholder="farmnet_user_role.data_role_directory"
              class="w-full rounded-md bg-slate-800 border border-slate-600 px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400"/>
          </div>
          <div class="text-center text-[11px] text-slate-500">— or —</div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] text-slate-400 mb-1">model</label>
              <input id="odt-model" type="text" placeholder="res.users.role"
                class="w-full rounded-md bg-slate-800 border border-slate-600 px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400"/>
            </div>
            <div>
              <label class="block text-[11px] text-slate-400 mb-1">res_id</label>
              <input id="odt-resid" type="number" placeholder="2"
                class="w-full rounded-md bg-slate-800 border border-slate-600 px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400"/>
            </div>
          </div>
          <button id="odt-load"
            class="rounded-md px-3 py-1.5 text-xs font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 cursor-pointer">Load record</button>

          <div id="odt-nu-status" class="hidden rounded-md bg-slate-800/70 border border-slate-700 px-3 py-2 text-xs space-y-1"></div>

          <div id="odt-nu-actions" class="hidden flex items-center gap-2">
            <button id="odt-set-true"
              class="rounded-md px-3 py-1.5 text-xs font-medium bg-amber-500 text-slate-900 hover:bg-amber-400 cursor-pointer">noupdate = True</button>
            <button id="odt-set-false"
              class="rounded-md px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer">noupdate = False</button>
          </div>

          <p class="text-[11px] text-slate-500">Writes <span class="font-mono">ir.model.data.noupdate</span> with your session rights. A module upgrade can reset it from the XML definition.</p>
        </div>
      </div>
    `;
    shadow.appendChild(root);

    launcher = shadow.getElementById("odt-launcher");
    panel = shadow.getElementById("odt-panel");
    listEl = shadow.getElementById("odt-list");
    countEl = shadow.getElementById("odt-count");
    dotEl = shadow.getElementById("odt-dot");

    launcher.addEventListener("click", () => toggle(true));
    shadow.getElementById("odt-min").addEventListener("click", () => toggle(false));
    shadow.getElementById("odt-clear").addEventListener("click", clear);
    shadow.getElementById("odt-export").addEventListener("click", exportJson);
    shadow
      .querySelectorAll(".odt-tab")
      .forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));
    shadow.getElementById("odt-load").addEventListener("click", loadRecord);
    shadow.getElementById("odt-set-true").addEventListener("click", () => setNoupdate(true));
    shadow.getElementById("odt-set-false").addEventListener("click", () => setNoupdate(false));
  }

  function toggle(open) {
    panel.classList.toggle("hidden", !open);
    launcher.classList.toggle("hidden", open);
  }

  function switchTab(tab) {
    shadow.querySelectorAll(".odt-tab").forEach((b) => {
      const active = b.dataset.tab === tab;
      b.classList.toggle("border-emerald-400", active);
      b.classList.toggle("text-slate-100", active);
      b.classList.toggle("border-transparent", !active);
      b.classList.toggle("text-slate-400", !active);
    });
    shadow.getElementById("odt-tab-detector").classList.toggle("hidden", tab !== "detector");
    shadow.getElementById("odt-tab-noupdate").classList.toggle("hidden", tab !== "noupdate");
  }

  function clear() {
    problems.length = 0;
    seen.clear();
    renderList();
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(problems, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "odoo-missing-fields.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function renderList() {
    const n = problems.length;
    countEl.textContent = `${n} issue(s)`;
    dotEl.textContent = String(n);
    dotEl.classList.toggle("hidden", n === 0);

    if (!n) {
      listEl.innerHTML = `<div class="text-slate-500 text-center py-6">No issues detected yet. Navigate Odoo views…</div>`;
      return;
    }
    listEl.innerHTML = problems
      .map((p) => {
        const b = BADGE[p.category] || {
          label: p.category.toUpperCase(),
          cls: "bg-slate-300 text-slate-900"
        };
        const inRaw =
          p.raw !== p.field ? ` <span class="text-slate-500">in ${escapeHtml(p.raw)}</span>` : "";
        return `
        <div class="rounded-md bg-slate-800/70 px-3 py-2 border border-slate-700">
          <span class="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold mr-1.5 ${b.cls}">${b.label}</span>
          <span class="text-sky-300">${escapeHtml(p.model)}</span>
          <span class="text-slate-500">&lt;${escapeHtml(p.viewType)}&gt;</span><br>
          <span class="text-amber-200 font-bold">${escapeHtml(p.field)}</span>
          <span class="text-slate-500">not in model</span>${inRaw}
        </div>`;
      })
      .join("");
  }

  let currentImd = null;

  async function loadRecord() {
    const xmlid = shadow.getElementById("odt-xmlid").value.trim();
    const model = shadow.getElementById("odt-model").value.trim();
    const resId = shadow.getElementById("odt-resid").value.trim();
    let domain;
    if (xmlid.includes(".")) {
      const idx = xmlid.indexOf(".");
      domain = [
        ["module", "=", xmlid.slice(0, idx)],
        ["name", "=", xmlid.slice(idx + 1)]
      ];
    } else if (model && resId) {
      domain = [
        ["model", "=", model],
        ["res_id", "=", parseInt(resId, 10)]
      ];
    } else {
      return showStatus(
        `<span class="text-rose-300">Enter an XML ID, or both model and res_id.</span>`,
        false
      );
    }
    try {
      const rows = await callKw(
        "ir.model.data",
        "search_read",
        [domain, ["id", "module", "name", "model", "res_id", "noupdate"]],
        { limit: 1 }
      );
      if (!rows.length) {
        currentImd = null;
        showActions(false);
        return showStatus(
          `<span class="text-rose-300">No ir.model.data record found.</span>`,
          true
        );
      }
      currentImd = rows[0];
      renderStatus();
      showActions(true);
    } catch (e) {
      currentImd = null;
      showActions(false);
      showStatus(`<span class="text-rose-300">Error: ${escapeHtml(e.message)}</span>`, true);
    }
  }

  function renderStatus() {
    const r = currentImd;
    const pill = r.noupdate
      ? `<span class="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold bg-amber-300 text-slate-900">True</span>`
      : `<span class="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold bg-emerald-400 text-slate-900">False</span>`;
    showStatus(
      `<div><span class="text-slate-400">xml id:</span> <span class="font-mono text-emerald-300">${escapeHtml(r.module)}.${escapeHtml(r.name)}</span></div>` +
        `<div><span class="text-slate-400">target:</span> <span class="font-mono text-sky-300">${escapeHtml(r.model)}</span> #${r.res_id}</div>` +
        `<div><span class="text-slate-400">noupdate:</span> ${pill}</div>`,
      true
    );
  }

  function showStatus(html, show) {
    const el = shadow.getElementById("odt-nu-status");
    el.innerHTML = html;
    el.classList.toggle("hidden", !show);
  }

  function showActions(show) {
    shadow.getElementById("odt-nu-actions").classList.toggle("hidden", !show);
  }

  async function setNoupdate(value) {
    if (!currentImd) return;
    if (!window.confirm(`Set noupdate = ${value} on ${currentImd.module}.${currentImd.name}?`))
      return;
    try {
      await callKw("ir.model.data", "write", [[currentImd.id], { noupdate: value }]);
      currentImd.noupdate = value;
      renderStatus();
    } catch (e) {
      showStatus(`<span class="text-rose-300">Write failed: ${escapeHtml(e.message)}</span>`, true);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );
  }

  function ingest(list) {
    let added = false;
    for (const p of list) {
      const key = `${p.model}|${p.field}|${p.category}|${p.viewType}`;
      if (seen.has(key)) continue;
      seen.add(key);
      problems.push(p);
      added = true;
    }
    if (added) renderList();
  }

  window.addEventListener(EVENT, (e) => {
    if (e.detail && Array.isArray(e.detail.problems)) ingest(e.detail.problems);
  });

  build();
})();
