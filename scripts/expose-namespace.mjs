#!/usr/bin/env node
/**
 * Adds "ui-wallpaper" to WEB_SETTINGS_NAMESPACES in the installed
 * @deepseek-ai/dsh-host-apiproxy, so the Web client can read/write the
 * wallpaper settings. Idempotent: an entry already present is left alone.
 *
 * Usage:
 *   node scripts/expose-namespace.mjs [path-to-dsh-host-apiproxy/lib/index.js]
 *
 * Without an argument it auto-resolves the file from the standard dsh home
 * profiles layout ($DSH_HOME/profiles/<name>), falling back to resolving from
 * this package's own location.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";

const NS = "ui-wallpaper";

function apiproxyIndexFrom(pkgJson) {
  // dsh-host-apiproxy does not export "./lib/index.js", so resolve the exposed
  // "./package.json" and derive the lib path from the package directory.
  const pkg = createRequire(pkgJson).resolve("@deepseek-ai/dsh-host-apiproxy/package.json");
  return pkg.slice(0, -"package.json".length) + "lib/index.js";
}

function resolveApiproxy() {
  const home = process.env.DSH_HOME || `${process.env.USERPROFILE}/.dsh`;
  for (const profile of ["web", "default"]) {
    const anchor = `${home}/profiles/${profile}/package.json`;
    if (!existsSync(anchor)) continue;
    try {
      return apiproxyIndexFrom(anchor);
    } catch {
      /* next profile */
    }
  }
  return apiproxyIndexFrom(import.meta.url);
}

const file = process.argv[2] || resolveApiproxy();
const src = readFileSync(file, "utf8");

const marker = "const WEB_SETTINGS_NAMESPACES = [";
const idx = src.indexOf(marker);
if (idx === -1) {
  console.error(`expose-namespace: WEB_SETTINGS_NAMESPACES not found in ${file}`);
  process.exit(1);
}
if (src.includes(`"${NS}"`)) {
  console.log(`expose-namespace: "${NS}" is already in WEB_SETTINGS_NAMESPACES (${file})`);
  process.exit(0);
}

const close = src.indexOf("];", idx);
if (close === -1) {
  console.error(`expose-namespace: could not find the closing "];" of WEB_SETTINGS_NAMESPACES in ${file}`);
  process.exit(1);
}

const head = src.slice(0, close).replace(/,\s*$/, "");
const patched = `${head},\n\t"${NS}"\n];${src.slice(close + 2)}`;
writeFileSync(file, patched);
console.log(`expose-namespace: added "${NS}" to WEB_SETTINGS_NAMESPACES (${file})`);
console.log("expose-namespace: restart dsh web for the change to take effect.");
