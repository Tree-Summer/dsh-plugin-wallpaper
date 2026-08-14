window.__ModuleLoader__.load({
  id: "dsh-plugin-wallpaper",
  factory: (require) => {
    const { jsx, jsxs } = require("react/jsx-runtime");
    const { useState, useEffect } = require("react");
    const { defineStore } = require("@deepseek-ai/dsh-client-runtime/client");

    const NS = "ui-wallpaper";

    const REGION_TOKENS = {
      base: "--dsw-alias-bg-base",
      sidebar: "--dsw-specific-sidebar-fill",
      input: "--dsw-specific-input-major",
      bubble: "--dsw-specific-bubble",
    };
    const REGION_SOLID = {
      base: { light: "255, 255, 255", dark: "21, 21, 23" },
      sidebar: { light: "250, 250, 250", dark: "27, 27, 28" },
      input: { light: "255, 255, 255", dark: "44, 44, 46" },
      bubble: { light: "237, 243, 254", dark: "44, 44, 46" },
    };
    const REGIONS = Object.keys(REGION_TOKENS);
    const REGION_LABELS = {
      base: "主界面",
      sidebar: "侧边栏",
      input: "输入框",
      bubble: "气泡",
    };

    // ---- wallpaper CSS (overlay alpha = stored opacity; UI shows visibility = 1 - opacity) ----
    // Only token overrides here — never backdrop-filter on app surfaces, which
    // would distort the settings dialog. The image lives on body (host-injected).
    function overlayCss(value) {
      if (!value || value.enabled === false) return "";
      const light = REGIONS.map((r) => `${REGION_TOKENS[r]}:rgba(${REGION_SOLID[r].light},${value[r].opacity})`).join(";");
      const dark = REGIONS.map((r) => `${REGION_TOKENS[r]}:rgba(${REGION_SOLID[r].dark},${value[r].opacity})`).join(";");
      return `body{${light} !important}body[data-ds-dark-theme]{${dark} !important}`;
    }

    function ensureStyle(id) {
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement("style");
        el.id = id;
        document.head.appendChild(el);
      }
      return el;
    }

    function setOverlayCss(value) {
      ensureStyle("dsh-wallpaper-live-overlay").textContent = overlayCss(value);
    }

    // ---- store ----
    function createStore() {
      return defineStore({
        init: () => ({ value: null, revision: -1 }),
        actions: {
          sync: (d, value, revision) => {
            if (revision <= d.revision) return;
            d.value = value;
            d.revision = revision;
          },
        },
      });
    }

    function regionChanged(a, b) {
      return REGIONS.some((r) => a[r].opacity !== b[r].opacity);
    }

    // ---- UI helpers ----
    const rowStyle = { display: "flex", alignItems: "center", gap: "10px" };
    const smallStyle = { width: "76px", flex: "none", fontSize: "12px", color: "var(--dsw-alias-label-secondary)" };
    const valStyle = { width: "46px", flex: "none", fontSize: "12px", color: "var(--dsw-alias-label-secondary)", textAlign: "right" };

    // Native-feel slider: local state drives the thumb instantly; drag/click-to-jump
    // are never fought by async settings writes. Preview applies the CSS live;
    // the settings write commits on release.
    function Slider({ label, value, min, max, step, format, onInput, onCommit }) {
      const [local, setLocal] = useState(value);
      useEffect(() => {
        setLocal(value);
      }, [value]);
      const handleChange = (e) => {
        const v = parseFloat(e.target.value);
        setLocal(v);
        if (onInput) onInput(v);
      };
      const handleCommit = (e) => {
        if (onCommit) onCommit(parseFloat(e.target.value));
      };
      return jsxs("label", { style: rowStyle, children: [
        jsx("span", { style: smallStyle, children: label }),
        jsx("input", {
          type: "range",
          min,
          max,
          step,
          style: { flex: 1 },
          value: local,
          onChange: handleChange,
          onPointerUp: handleCommit,
          onKeyUp: handleCommit,
          onBlur: handleCommit,
        }),
        jsx("span", { style: valStyle, children: format(local) }),
      ]});
    }

    function WallpaperRow({ useStore, scope }) {
      const value = useStore((s) => s.value);
      const [open, setOpen] = useState(false);
      if (!value) return jsx("div", {});

      const setRegion = (key, patch) => scope.set(key, Object.assign({}, value[key], patch));
      const preview = (key, patch) => setOverlayCss(Object.assign({}, value, { [key]: Object.assign({}, value[key], patch) }));
      const pct = (opacity) => Math.round((1 - opacity) * 100) + "%";

      const root = { display: "flex", flexDirection: "column", gap: "8px", padding: "16px 0", borderBottom: "1px solid var(--dsw-alias-border-l2)" };
      const title = { fontSize: "14px", fontWeight: "600", color: "var(--dsw-alias-label-primary)" };
      const hint = { fontSize: "12px", color: "var(--dsw-alias-label-tertiary)" };
      const toggle = { cursor: "pointer", border: "1px solid var(--dsw-alias-border-l2)", borderRadius: "6px", padding: "2px 10px", fontSize: "12px", background: "transparent", color: "var(--dsw-alias-label-secondary)" };
      const regionBox = { display: "flex", flexDirection: "column", gap: "4px", padding: "6px 0" };
      const fieldLabel = { width: "76px", flex: "none", fontSize: "12px", color: "var(--dsw-alias-label-secondary)" };

      return jsxs("div", { style: root, children: [
        jsxs("div", { style: rowStyle, children: [
          jsx("div", { style: title, children: "壁纸" }),
          jsx("label", { style: { display: "flex", alignItems: "center", gap: "4px" }, children: [
            jsx("input", { type: "checkbox", checked: value.enabled, onChange: (e) => scope.set("enabled", e.target.checked) }),
            jsx("span", { style: hint, children: "启用" }),
          ]}),
          jsx("button", { type: "button", style: toggle, onClick: () => setOpen(!open), children: open ? "收起 ▴" : "展开 ▾" }),
        ]}),
        !open && jsx("div", { style: hint, children: "可见度：" + REGIONS.map((r) => `${REGION_LABELS[r]} ${pct(value[r].opacity)}`).join(" · ") }),
        open && jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: [
          jsx("div", { style: hint, children: "壁纸可见度 = 壁纸透出程度：0% 完全隐藏，100% 完全透明可见" }),
          jsx("label", { style: rowStyle, children: [
            jsx("span", { style: fieldLabel, children: "图片" }),
            jsx("input", { type: "text", style: { flex: 1, fontSize: "13px" }, defaultValue: value.image, placeholder: "留空则无壁纸；data URI、http(s) URL 或本地图片路径", onBlur: (e) => { if (e.target.value !== value.image) scope.set("image", e.target.value); } }),
          ]}),
          jsx("label", { style: rowStyle, children: [
            jsx("span", { style: fieldLabel, children: "铺满" }),
            jsx("select", { style: { flex: 1 }, value: value.fit, onChange: (e) => scope.set("fit", e.target.value), children: [
              jsx("option", { value: "cover", children: "cover（铺满裁剪）" }),
              jsx("option", { value: "contain", children: "contain（完整显示）" }),
              jsx("option", { value: "stretch", children: "stretch（拉伸）" }),
            ]}),
          ]}),
          ...REGIONS.map((r) => jsxs("div", { key: r, style: regionBox, children: [
            jsx("div", { style: hint, children: REGION_LABELS[r] }),
            jsx(Slider, {
              label: "壁纸可见度",
              value: 1 - value[r].opacity,
              min: 0,
              max: 1,
              step: 0.01,
              format: (v) => Math.round(v * 100) + "%",
              onInput: (v) => preview(r, { opacity: 1 - v }),
              onCommit: (v) => setRegion(r, { opacity: 1 - v }),
            }),
          ]})),
        ]}),
      ]});
    }

    // ---- plugin ----
    const inject = ["slots", "locale", "connection", "remote", "settingsScope"];

    function apply(ctx) {
      const scope = ctx.settingsScope.bind({ namespace: NS });
      const store = createStore();
      let bound;
      let prev = null;
      const sync = () => {
        const snap = scope.getSnapshot();
        const v = snap.value;
        if (!v) return;
        bound?.sync(v, snap.revision ?? 0);
        if (prev) {
          if (prev.enabled !== v.enabled || prev.image !== v.image || prev.fit !== v.fit) {
            window.location.reload();
            return;
          }
          if (regionChanged(prev, v)) setOverlayCss(v);
        }
        prev = v;
      };
      ctx.effect(() => scope.subscribe(sync), "wallpaper: scope subscription");
      const injected = (actions) => {
        bound = actions;
        sync();
        return { scope };
      };
      ctx.slots.inject("settings.general.item", () => ctx.slots.register({
        name: "settings.general.item",
        id: "wallpaper",
        order: 11,
        store,
        inject: injected,
      }, WallpaperRow));
    }

    return { apply, inject };
  },
});
