(function () {
  "use strict";

  const RPC_MATCH = "call_kw";
  const EVENT = "__odoo_dev_toolkit__";
  const CTX_EVENT = "__odoo_dev_toolkit_ctx__";
  const RPC_EVENT = "__odoo_dev_toolkit_rpc__";
  const TRACK_METHODS = new Set([
    "web_search_read",
    "web_read",
    "read",
    "read_group",
    "web_read_group"
  ]);
  let rpcSeq = 0;
  const OPERATORS = new Set([
    "=",
    "!=",
    "<",
    ">",
    "<=",
    ">=",
    "in",
    "not in",
    "like",
    "not like",
    "ilike",
    "not ilike",
    "=like",
    "=ilike",
    "child_of",
    "parent_of",
    "any",
    "not any"
  ]);
  const SKIP_TOKENS = new Set(["parent", "id", "uid", "active_id", "context", "self"]);

  const seen = new Set();
  const allProblems = [];
  let fresh = [];

  function firstSegment(path) {
    return String(path).split(".")[0].split(":")[0].trim();
  }

  function shouldSkip(path) {
    const seg = firstSegment(path);
    return !seg || SKIP_TOKENS.has(seg) || /^[0-9]/.test(seg);
  }

  function checkField(model, path, models, viewType, category) {
    if (shouldSkip(path)) return;
    const seg = firstSegment(path);
    const modelFields = models[model];
    if (!modelFields) return;
    if (!modelFields[seg]) push({ viewType, model, field: seg, category, raw: path });
  }

  function push(p) {
    const key = `${p.model}|${p.field}|${p.category}|${p.viewType}`;
    if (seen.has(key)) return;
    seen.add(key);
    allProblems.push(p);
    fresh.push(p);
  }

  function walkModifiers(node, model, models, viewType) {
    if (Array.isArray(node)) {
      if (typeof node[0] === "string" && OPERATORS.has(node[1])) {
        checkField(model, node[0], models, viewType, "modifier");
        return;
      }
      for (const item of node) walkModifiers(item, model, models, viewType);
    } else if (node && typeof node === "object") {
      for (const value of Object.values(node)) walkModifiers(value, model, models, viewType);
    }
  }

  function domainOperands(str) {
    const out = [];
    const re = /\(\s*(['"])([\w.:]+)\1\s*,/g;
    let m;
    while ((m = re.exec(str))) out.push(m[2]);
    return out;
  }

  function groupByFields(str) {
    const out = [];
    const re = /group_by['"]?\s*:\s*(\[[^\]]*\]|['"][\w.:]+['"])/g;
    let m;
    while ((m = re.exec(str))) {
      const tokenRe = /['"]([\w.:]+)['"]/g;
      let t;
      while ((t = tokenRe.exec(m[1]))) out.push(t[1]);
    }
    return out;
  }

  function checkAttributes(el, model, models, viewType) {
    const modifiers = el.getAttribute("modifiers");
    if (modifiers) {
      try {
        walkModifiers(JSON.parse(modifiers), model, models, viewType);
      } catch (e) {}
    }
    const attrs = el.getAttribute("attrs");
    if (attrs)
      domainOperands(attrs).forEach((f) => checkField(model, f, models, viewType, "modifier"));

    const groupby = el.getAttribute("groupby");
    if (groupby) checkField(model, groupby, models, viewType, "groupby");

    const context = el.getAttribute("context");
    if (context)
      groupByFields(context).forEach((f) => checkField(model, f, models, viewType, "groupby"));

    if (viewType === "search") {
      for (const attr of ["domain", "filter_domain"]) {
        const val = el.getAttribute(attr);
        if (val)
          domainOperands(val).forEach((f) =>
            checkField(model, f, models, viewType, "search-domain")
          );
      }
    }
  }

  function traverse(node, model, models, viewType) {
    const modelFields = models[model];
    if (!modelFields || !node) return;
    for (const child of node.children) {
      checkAttributes(child, model, models, viewType);
      if (child.tagName === "field") {
        const fieldName = child.getAttribute("name");
        const fieldDef = modelFields[fieldName];
        if (!fieldDef) {
          push({ viewType, model, field: fieldName, category: "field", raw: fieldName });
          continue;
        }
        if (child.children.length && fieldDef.relation) {
          traverse(child, fieldDef.relation, models, viewType);
        }
      } else {
        traverse(child, model, models, viewType);
      }
    }
  }

  function checkResult(result, url) {
    if (!result || !result.views || !result.models) return;
    const models = result.models;
    fresh = [];
    for (const [viewType, view] of Object.entries(result.views)) {
      if (!view || !view.arch) continue;
      const doc = new DOMParser().parseFromString(view.arch, "application/xml");
      if (doc.querySelector("parsererror")) continue;
      traverse(doc.documentElement, view.model, models, viewType);
    }
    if (fresh.length) emit(fresh.slice(), url);
  }

  function emit(problems, url) {
    console.groupCollapsed(
      `%c[Odoo Dev Toolkit] ${problems.length} missing field reference(s)`,
      "color:#fff;background:#c0392b;padding:2px 6px;border-radius:3px;font-weight:bold"
    );
    for (const p of problems) {
      console.error(
        `[${p.category}] model "${p.model}" <${p.viewType}> -> "${p.field}"` +
          (p.raw !== p.field ? ` (in "${p.raw}")` : "") +
          " does NOT exist"
      );
    }
    console.info("RPC:", url);
    console.groupEnd();
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { problems, url } }));
  }

  function maybeEmitCtx(rawBody) {
    if (typeof rawBody !== "string") return;
    try {
      const j = JSON.parse(rawBody);
      const p = j && j.params;
      if (!p || !p.model || !TRACK_METHODS.has(p.method)) return;
      let resId = null;
      const args = p.args;
      if (Array.isArray(args) && args.length) {
        const first = args[0];
        if (typeof first === "number") resId = first;
        else if (Array.isArray(first) && typeof first[0] === "number") resId = first[0];
      }
      window.dispatchEvent(new CustomEvent(CTX_EVENT, { detail: { model: p.model, resId } }));
    } catch (e) {}
  }

  function parseCallKw(rawBody) {
    if (typeof rawBody !== "string") return null;
    try {
      const j = JSON.parse(rawBody);
      const p = j && j.params;
      if (!p) return null;
      return {
        model: p.model || null,
        method: p.method || null,
        args: p.args || [],
        kwargs: p.kwargs || {}
      };
    } catch (e) {
      return null;
    }
  }

  function startRpc(rawBody, url) {
    const meta = parseCallKw(rawBody);
    if (!meta) return null;
    const id = ++rpcSeq;
    const entry = {
      id,
      t: Date.now(),
      url,
      model: meta.model,
      method: meta.method,
      args: meta.args,
      kwargs: meta.kwargs,
      reqSize: rawBody.length,
      resSize: 0,
      duration: 0,
      status: "pending",
      error: null,
      result: undefined,
      _start: performance.now()
    };
    window.dispatchEvent(new CustomEvent(RPC_EVENT, { detail: { kind: "start", entry } }));
    return entry;
  }

  function finishRpc(entry, rawText, ok) {
    if (!entry) return;
    entry.duration = Math.max(0, performance.now() - entry._start);
    entry.resSize = rawText ? rawText.length : 0;
    delete entry._start;
    let parsed = null;
    if (rawText) {
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {}
    }
    if (parsed && parsed.error) {
      entry.status = "error";
      const e = parsed.error.data || {};
      entry.error = e.message || parsed.error.message || "RPC error";
    } else if (!ok) {
      entry.status = "error";
      entry.error = "HTTP error";
    } else {
      entry.status = "ok";
      if (parsed) entry.result = parsed.result;
    }
    window.dispatchEvent(new CustomEvent(RPC_EVENT, { detail: { kind: "end", entry } }));
  }

  function maybeCheck(rawText, url) {
    try {
      const data = JSON.parse(rawText);
      if (data && data.result) checkResult(data.result, url);
    } catch (e) {}
  }

  const origFetch = window.fetch;
  window.fetch = function (...args) {
    let entry = null;
    let url = "";
    try {
      url = typeof args[0] === "string" ? args[0] : (args[0] && args[0].url) || "";
      if (url.includes(RPC_MATCH)) {
        const init = args[1];
        if (init && typeof init.body === "string") {
          maybeEmitCtx(init.body);
          entry = startRpc(init.body, url);
        }
      }
    } catch (e) {}
    return origFetch.apply(this, args).then(
      (res) => {
        try {
          if (url.includes(RPC_MATCH)) {
            res
              .clone()
              .text()
              .then((t) => {
                maybeCheck(t, url);
                finishRpc(entry, t, res.ok);
              })
              .catch(() => finishRpc(entry, "", res.ok));
          }
        } catch (e) {}
        return res;
      },
      (err) => {
        finishRpc(entry, "", false);
        throw err;
      }
    );
  };

  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__odt_url = url;
    return origOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    if (this.__odt_url && String(this.__odt_url).includes(RPC_MATCH)) {
      if (typeof body === "string") maybeEmitCtx(body);
      const entry = typeof body === "string" ? startRpc(body, this.__odt_url) : null;
      this.addEventListener("load", function () {
        if (this.responseText) maybeCheck(this.responseText, this.__odt_url);
        finishRpc(entry, this.responseText || "", this.status >= 200 && this.status < 400);
      });
      this.addEventListener("error", function () {
        finishRpc(entry, "", false);
      });
      this.addEventListener("abort", function () {
        finishRpc(entry, "", false);
      });
    }
    return origSend.apply(this, arguments);
  };

  window.__odooDevToolkit = { problems: allProblems };
  console.info("%c[Odoo Dev Toolkit] interceptor active", "color:#00b894");
})();
