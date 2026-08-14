import { readFileSync, statSync } from "node:fs";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "@deepseek-ai/schemastery";

const name = "wallpaper";
const NS = settingsNamespace("ui-wallpaper");

// Theme token each region overrides (stable across dsh upgrades).
const REGION_TOKENS = {
  base: "--dsw-alias-bg-base",
  sidebar: "--dsw-specific-sidebar-fill",
  input: "--dsw-specific-input-major",
  bubble: "--dsw-specific-bubble",
};

// Solid region colors per palette, mirroring design-platform.css.
const REGION_SOLID = {
  base: { light: "255, 255, 255", dark: "21, 21, 23" },
  sidebar: { light: "250, 250, 250", dark: "27, 27, 28" },
  input: { light: "255, 255, 255", dark: "44, 44, 46" },
  bubble: { light: "237, 243, 254", dark: "44, 44, 46" },
};

const REGIONS = Object.keys(REGION_TOKENS);

const RegionSchema = z.object({
  opacity: z.number().min(0).max(1).default(0.5),
});

const WallpaperSchema = z.object({
  enabled: z.boolean().default(true),
  image: z.string().default(""),
  fit: z.union(["cover", "contain", "stretch"]).default("cover"),
  base: RegionSchema.default({ opacity: 0.3 }),
  sidebar: RegionSchema.default({ opacity: 0.18 }),
  input: RegionSchema.default({ opacity: 0.5 }),
  bubble: RegionSchema.default({ opacity: 0.6 }),
});

// Cache the last inlined local image (keyed by path + mtime) so a large file is
// read once, not on every index render.
let imageCache = { key: "", value: "" };

function resolveImage(value) {
  const raw = value.image || "";
  if (!raw) return "";
  if (!/^(data:|https?:|blob:)/i.test(raw)) {
    // Treat as a local file path: read and inline as a data URI.
    try {
      const st = statSync(raw);
      const key = `${raw}:${st.mtimeMs}`;
      if (imageCache.key !== key) {
        const lower = raw.toLowerCase();
        const mime = lower.endsWith(".png") ? "image/png" : lower.endsWith(".webp") ? "image/webp" : lower.endsWith(".gif") ? "image/gif" : "image/jpeg";
        imageCache = { key, value: `data:${mime};base64,${readFileSync(raw).toString("base64")}` };
      }
      return imageCache.value;
    } catch {
      return "";
    }
  }
  return raw;
}

function fitCss(fit) {
  return fit === "stretch" ? "100% 100%" : fit;
}

function imageCss(value) {
  if (!value || value.enabled === false) return "";
  const image = resolveImage(value);
  if (!image) return "";
  return `html,body{background-color:#101215}body{min-height:100vh;background-color:#101215;background-image:url("${image}");background-size:${fitCss(value.fit)};background-position:center;background-repeat:no-repeat}`;
}

function overlayCss(value) {
  if (!value || value.enabled === false) return "";
  const light = REGIONS.map((r) => `${REGION_TOKENS[r]}:rgba(${REGION_SOLID[r].light},${value[r].opacity})`).join(";");
  const dark = REGIONS.map((r) => `${REGION_TOKENS[r]}:rgba(${REGION_SOLID[r].dark},${value[r].opacity})`).join(";");
  return `body{${light} !important}body[data-ds-dark-theme]{${dark} !important}`;
}

function buildStyle(value) {
  if (!value || value.enabled === false) return "";
  const image = imageCss(value);
  const overlay = overlayCss(value);
  if (!image) return "";
  return `<style id="dsh-wallpaper">${image}${overlay}</style>`;
}

function injectWallpaper(html, value) {
  const style = buildStyle(value);
  const head = /<\/head>/i.exec(html);
  if (!head) return style ? `${style}${html}` : html;
  return `${html.slice(0, head.index)}${style}${html.slice(head.index)}`;
}

function apply(ctx) {
  ctx.inject(["settings", "webServer"], (sctx) => {
    const scope = sctx.settings.register(NS, WallpaperSchema);
    sctx.effect(() => {
      sctx.webServer.tapIndex((html) => injectWallpaper(html, scope.get()));
    }, "wallpaper: inject css");
  });
}

export { WallpaperSchema, apply, buildStyle, name };
