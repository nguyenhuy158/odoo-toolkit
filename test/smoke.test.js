"use strict";

const test = require("node:test");
const assert = require("node:assert");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const jsFiles = ["interceptor.js", "ui.js", "eslint.config.js"];

test("source JS files have valid syntax", () => {
  for (const f of jsFiles) {
    const full = path.join(root, f);
    assert.ok(fs.existsSync(full), `${f} should exist`);
    execFileSync(process.execPath, ["--check", full]);
  }
});

test("manifest.json is valid and well-formed", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  assert.equal(manifest.manifest_version, 3, "should be MV3");
  assert.ok(Array.isArray(manifest.content_scripts), "content_scripts must be an array");
});

test("referenced files in manifest exist", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  const refs = new Set();
  for (const cs of manifest.content_scripts || []) {
    for (const j of cs.js || []) refs.add(j);
  }
  for (const war of manifest.web_accessible_resources || []) {
    for (const r of war.resources || []) refs.add(r);
  }
  for (const ref of refs) {
    assert.ok(fs.existsSync(path.join(root, ref)), `manifest references missing file: ${ref}`);
  }
});
