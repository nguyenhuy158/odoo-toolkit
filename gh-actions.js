(function () {
  "use strict";

  if (!/^https:\/\/github\.com\//.test(location.href)) return;

  const HOST_ID = "__odt_gh_runner_badge__";
  const BACK_ID = "__odt_gh_back_pr__";
  let observer = null;
  let lastUrl = location.href;
  let lastInfo = null;
  let lastBack = null;

  function isActionsPage() {
    return /\/actions\/runs\/\d+/.test(location.pathname);
  }

  function extractRunnerInfo(text) {
    if (!text) return null;
    const info = {};
    const patterns = {
      version: /Current runner version:\s*['"]?([^'"\n]+)['"]?/i,
      name: /Runner name:\s*['"]?([^'"\n]+)['"]?/i,
      group: /Runner group name:\s*['"]?([^'"\n]+)['"]?/i,
      machine: /Machine name:\s*['"]?([^'"\n]+)['"]?/i
    };
    for (const [k, re] of Object.entries(patterns)) {
      const m = text.match(re);
      if (m) info[k] = m[1].replace(/['"]+$/g, "").trim();
    }
    return Object.keys(info).length ? info : null;
  }

  function scanLogText() {
    const setupHeader = Array.from(
      document.querySelectorAll("summary, button, .ActionListItem")
    ).find((el) => /set up job/i.test(el.textContent || ""));
    if (setupHeader) {
      const container =
        setupHeader.closest("details, .js-checks-step, .timeline-comment, section") ||
        setupHeader.parentElement;
      if (container) {
        const txt = container.innerText || container.textContent || "";
        const info = extractRunnerInfo(txt);
        if (info) return info;
      }
    }
    const body = document.body ? document.body.innerText : "";
    return extractRunnerInfo(body.slice(0, 10000));
  }

  function sameInfo(a, b) {
    if (!a || !b) return a === b;
    return (
      a.name === b.name && a.group === b.group && a.machine === b.machine && a.version === b.version
    );
  }

  function ensureHost() {
    let host = document.getElementById(HOST_ID);
    if (host) return host;
    host = document.createElement("div");
    host.id = HOST_ID;
    host.style.cssText =
      "position:fixed;top:60px;right:16px;z-index:2147483646;pointer-events:auto;";
    document.documentElement.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      :host { all: initial; }
      .badge {
        font-family: "JetBrains Mono","SF Mono",Menlo,monospace;
        background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
        color: #e2e8f0;
        border: 1px solid rgba(52,211,153,0.5);
        box-shadow: 0 8px 24px -8px rgba(0,0,0,0.5), 0 0 0 1px rgba(15,23,42,0.5), 0 0 20px rgba(52,211,153,0.15);
        border-radius: 8px;
        padding: 8px 12px;
        min-width: 240px;
        max-width: 360px;
        cursor: default;
        user-select: text;
        transition: transform .15s, box-shadow .15s, opacity .2s;
        opacity: 0;
        transform: translateY(-6px);
      }
      .badge.show { opacity: 1; transform: translateY(0); }
      .badge:hover { box-shadow: 0 12px 30px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(15,23,42,0.5), 0 0 24px rgba(52,211,153,0.25); }
      .badge .head {
        display: flex; align-items: center; gap: 8px;
        font: 700 9px/1 inherit;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #f59e0b;
        margin-bottom: 6px;
      }
      .badge .head .dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: #34d399;
        box-shadow: 0 0 8px #34d399;
        animation: pulse 1.6s ease-in-out infinite;
      }
      @keyframes pulse { 50% { opacity: 0.35; } }
      .badge .head .spacer { flex: 1; }
      .badge .head .close {
        cursor: pointer; color: #64748b;
        font-size: 12px; line-height: 1;
        padding: 2px 6px; border-radius: 3px;
      }
      .badge .head .close:hover { background: rgba(148,163,184,0.15); color: #fff; }
      .badge .name {
        font: 700 13px/1.2 inherit;
        color: #34d399;
        margin-bottom: 4px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        cursor: pointer;
      }
      .badge .name:hover { color: #6ee7b7; text-decoration: underline; }
      .badge .row {
        display: flex; gap: 6px; align-items: baseline;
        font: 11px/1.4 inherit;
        color: #94a3b8;
      }
      .badge .row .k {
        font-size: 9px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #64748b;
        min-width: 46px;
      }
      .badge .row .v { color: #cbd5e1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .badge .row .v.cyan { color: #7dd3fc; }
      .badge .row .v.violet { color: #c4b5fd; }
    `;
    shadow.appendChild(style);
    const root = document.createElement("div");
    root.className = "badge";
    shadow.appendChild(root);
    host.__root = root;
    return host;
  }

  function render(info) {
    if (!info) {
      removeBadge();
      return;
    }
    const host = ensureHost();
    const root = host.__root;
    const name = escapeHtml(info.name || "(unknown)");
    root.innerHTML = `
      <div class="head">
        <span class="dot"></span>
        <span>runner</span>
        <span class="spacer"></span>
        <span class="close" title="hide">×</span>
      </div>
      <div class="name" title="click to copy">${name}</div>
      ${info.group ? `<div class="row"><span class="k">group</span><span class="v cyan">${escapeHtml(info.group)}</span></div>` : ""}
      ${info.machine ? `<div class="row"><span class="k">machine</span><span class="v">${escapeHtml(info.machine)}</span></div>` : ""}
      ${info.version ? `<div class="row"><span class="k">version</span><span class="v violet">${escapeHtml(info.version)}</span></div>` : ""}
    `;
    requestAnimationFrame(() => root.classList.add("show"));
    root.querySelector(".close").addEventListener("click", removeBadge);
    root.querySelector(".name").addEventListener("click", () => {
      navigator.clipboard.writeText(info.name || "").catch(() => {});
      const el = root.querySelector(".name");
      const orig = el.textContent;
      el.textContent = "✓ copied";
      setTimeout(() => {
        el.textContent = orig;
      }, 1000);
    });
  }

  function removeBadge() {
    const host = document.getElementById(HOST_ID);
    if (host) host.remove();
  }

  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );
  }

  function findBackLink() {
    const candidates = document.querySelectorAll("a");
    for (const a of candidates) {
      const txt = (a.textContent || "").trim();
      if (/^[←‹<\s]*\s*back to pull request/i.test(txt) && a.href) {
        const m = txt.match(/#(\d+)/);
        return { href: a.href, label: txt, prNumber: m ? m[1] : null };
      }
    }
    return null;
  }

  function ensureBackHost() {
    let host = document.getElementById(BACK_ID);
    if (host) return host;
    host = document.createElement("div");
    host.id = BACK_ID;
    host.style.cssText =
      "position:fixed;bottom:20px;left:20px;z-index:2147483646;pointer-events:auto;";
    document.documentElement.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      :host { all: initial; }
      .back {
        display: inline-flex; align-items: center; gap: 8px;
        font-family: "JetBrains Mono","SF Mono",Menlo,monospace;
        font-size: 12px; font-weight: 600;
        text-decoration: none;
        background: linear-gradient(180deg,#0f172a 0%,#1e293b 100%);
        color: #e2e8f0;
        border: 1px solid rgba(125,211,252,0.5);
        border-radius: 999px;
        padding: 8px 14px 8px 12px;
        box-shadow: 0 8px 22px -8px rgba(0,0,0,0.55), 0 0 18px rgba(56,189,248,0.18);
        cursor: pointer;
        opacity: 0; transform: translateY(8px);
        transition: opacity .18s, transform .18s, box-shadow .15s, color .12s, border-color .15s;
      }
      .back.show { opacity: 1; transform: translateY(0); }
      .back:hover {
        color: #fff;
        border-color: #38bdf8;
        box-shadow: 0 12px 28px -8px rgba(0,0,0,0.6), 0 0 24px rgba(56,189,248,0.35);
      }
      .back .arrow {
        font-size: 14px; line-height: 1;
        color: #7dd3fc;
        transition: transform .18s;
      }
      .back:hover .arrow { transform: translateX(-3px); }
      .back .pr { color: #34d399; }
      .back .label {
        font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
        color: #94a3b8;
      }
    `;
    shadow.appendChild(style);
    const link = document.createElement("a");
    link.className = "back";
    shadow.appendChild(link);
    host.__link = link;
    return host;
  }

  function renderBack(info) {
    if (!info) {
      removeBack();
      return;
    }
    const host = ensureBackHost();
    const link = host.__link;
    link.href = info.href;
    link.innerHTML = `
      <span class="arrow">←</span>
      <span class="label">back to</span>
      <span class="pr">PR${info.prNumber ? " #" + escapeHtml(info.prNumber) : ""}</span>
    `;
    requestAnimationFrame(() => link.classList.add("show"));
  }

  function removeBack() {
    const host = document.getElementById(BACK_ID);
    if (host) host.remove();
  }

  function sameBack(a, b) {
    if (!a || !b) return a === b;
    return a.href === b.href && a.prNumber === b.prNumber;
  }

  function check() {
    if (!isActionsPage()) {
      removeBadge();
      removeBack();
      lastInfo = null;
      lastBack = null;
      return;
    }
    const info = scanLogText();
    if (info && !sameInfo(info, lastInfo)) {
      lastInfo = info;
      render(info);
    }
    const back = findBackLink();
    if (back && !sameBack(back, lastBack)) {
      lastBack = back;
      renderBack(back);
    } else if (!back && lastBack) {
      lastBack = null;
      removeBack();
    }
  }

  function start() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        lastInfo = null;
        lastBack = null;
        removeBadge();
        removeBack();
      }
      check();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
    check();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  window.addEventListener("popstate", () => setTimeout(check, 200));
  window.addEventListener("pageshow", () => setTimeout(check, 200));
})();
