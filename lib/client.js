// schedule — browser half (v0.16.0).
// Three floating cards (每日时间安排 / 目标设置 / 日期规划) with toggle,
// drag, dark-theme, localStorage persistence.
// v0.16.0: SCHEDULE RECURRENCE + CALENDAR TIME-RANGE TASKS + SCALING DECOR.
//   * 每日时间安排 rows now carry a `kind` (每天/工作日/周末/单次) dropdown —
//     the routine is typed ONCE and applies automatically; rows inactive today
//     render dimmed. First boot seeds a day template; old rows migrate
//     (id + kind="daily"). Data: dw:schedule:data [{id,time,text,kind}].
//   * 日期规划 became date-RANGED tasks: dw:cal:data is now
//     [{id,title,desc,startDate,endDate,color}]. Each cell renders up to 3
//     coloured chips for every task covering that day (multi-day spans show on
//     each day; "+N" overflow tag). Editor: title / desc / start / end dates
//     (auto-corrects inversion) / colour swatches. Old single-day notes
//     migrate to 1-day tasks automatically.
//   * Card resize now rescales the paper decorations: the left binding stripe
//     and bottom-right folded corner use % + aspect-ratio instead of fixed
//     3px/15px (min-width guards keep them visible on tiny cards). The
//     calendar grid uses minmax(0,1fr) so chip text can't stretch columns.
// v0.15.0: WPS workbench flowchart with ortholinear edges, due-date strips,
// urgency badges, zoomable canvas (0.3x-2.5x).
// v0.12.0: WPS WORKBENCH-STYLE FLOWCHART. The 📊 flowchart panel is rebuilt
// from scratch around the WPS-Flowchart interaction model:
//   - LEFT palette (5 flowchart shapes: 流程 / 起止 / 判断 / 输入 / 准备).
//     Drag any shape onto the canvas → a new node is created at the drop
//     point. If a node was selected at the time, the new node is auto-linked
//     as its child.
//   - NODES have 4 connection dots (N/E/S/W). Press-and-drag from a dot →
//     a ghost Bézier follows the cursor; release on another node → a new
//     EDGE is created. Edges are the single source of truth for parent/
//     child relationships (children cache is derived on every persist).
//   - CLICK a node → select (blue ring + dots show); DELETE / BACKSPACE →
//     remove node (and all edges touching it); ESC → deselect/close.
//   - CLICK a selected edge → its midpoint × button deletes it.
//   - DRAG a node body → free positioning (the root, the dot edges, and
//     auto-layout fallback for orphans / un-dragged children, all coexist).
//   - BACKWARDS COMPAT: pre-v0.12.0 trees stored hierarchy only via the
//     children[] array. openFlow() now auto-migrates by deriving edges
//     from children on first open; from then on, edges are the truth.
// Side column (recursive SolidWorks tree) is unchanged. cleanTree() now
// also whitelists shape + edges so the new fields survive serialization.
// v0.11.0: PERSISTENCE BUG FIX. Previously paint()/layout() tagged live nodes
// with transient render fields (_parentRef, _x, _y, _idx) DIRECTLY on the
// objects that live inside the `items` array — and `_parentRef` is a back-
// reference to the parent, creating a CIRCULAR reference. The next persist()
// → JSON.stringify(items) would throw "Converting circular structure to JSON",
// and lsSet()'s silent `catch(e){}` SWALLOWED it: every save after the first
// paint silently dropped on the floor. That is why grandchild additions
// (2nd-level sub-tasks) never reached localStorage in v0.10.0/v0.10.1 even
// though the live items had them. persist() now serializes a CLEANED deep
// clone via cleanTree() that drops render-only fields but keeps the user's
// drag _manual position. lsSet() also logs to console.error instead of being
// silent, so future regressions are visible.
// v0.10.1: side project-tree is now RECURSIVELY collapsible (each branch
// folds into its parent branch like a SolidWorks feature tree); the
// background wallpaper was swapped for the user's new image and now covers
// the WHOLE flow overlay (not just the canvas); and nodes can be DRAGGED to
// reposition them freely (click still adds a child; drag = move + subtree
// follows). Positions persist via node._manual.
// v0.10.0: the root goal (=最终目的) is AUTO-checked once every sub-node is
// done (the parent can no longer be checked by hand once it has children); a
// bordered SIDE column lists ALL big goals and expands each one's sub-project
// tree (click a name to switch which flowchart is shown); the flowchart canvas
// background is now an EMBEDDED anime wallpaper (data URI) under a dark
// gradient so nodes stay readable. Source image:
// https://safebooru.org/images/3396/a116e850c9de5f84f2c21f5a7b31202570971a6d.jpg
// v0.9.1: roll-up SUMMARY — the flowchart header shows a live "🌿 子目标 已完成
// N/M · P%"; the goal card mirrors it, and once a goal HAS sub-nodes its main
// progress bar is AUTO-COMPUTED from completed sub-nodes (the manual −/+ range
// is swapped out). IMPORTANT: profiles/desktop/node_modules/<name> is a real
// COPY, not a symlink — it must be re-synced after every source edit, or DSH
// keeps running the stale build (that is exactly why the summary "vanished").
// v0.9.0: each big goal can be DECOMPOSED — a "📊 流程图" button opens a
// full-screen horizontal multi-branch flowchart (root on the left). Click any
// flow node (or its "＋ 子节点" button) to add a child frame; node text is
// edited inline; parent→child are joined by bezier connector lines; nodes can
// be marked done (strike + fade) and deleted; the tree persists in
// dw:goals:data[i].tree and the root title/done stay in sync with the card.
// v0.8.1: goal cards get a circular "done" check — click to strike-through +
// fade + fill the check, with a small pop; completion persists to localStorage.
// v0.8.0: every content block now uses the SAME sticky-note paper skin — the
// countdown notes (v0.7.0), the schedule time rows, the goal cards and the
// month calendar all render as tinted, slightly tilted paper sheets with a
// binding stripe + folded corner, cycling through five paper colours. The
// generic ".dww-paper" class carries the look; controls inside a sheet use
// DARK text on the tinted paper.
// v0.7.0: the countdown became a stack of STICKY NOTES (no analog clock).
// v0.6.0 changes:
//   * Card shell is now FULLY TRANSPARENT (background:transparent) — only a
//     gradient hairline border + an ambient drop-shadow delineate the card,
//     so the desktop wallpaper shows through completely. Content controls
//     (inputs/buttons/fields) keep a faint veil so they remain operable.
//   * Resize is far more discoverable: a BIGGER bottom-right corner handle
//     (drag = width+height) plus a NEW bottom-centre three-bar grip
//     (drag vertically = height). Both persist size to localStorage.
// The 小组件 launcher stays a FREE-FLOATING, draggable pill: drag it anywhere
// (position persisted); a short press toggles all three cards.
window.__ModuleLoader__.load({
  id: "schedule",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const TAG = "[schedule]";
    const log = (...a) => { try { console.log(TAG, ...a); } catch (e) {} };

    // ---------- tiny helpers ----------
    function lsGet(k, def) {
      try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); }
      catch (e) { return def; }
    }
    function lsSet(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); }
      catch (e) { try { console.error(TAG, "lsSet failed", k, e); } catch (e2) {} }
    }
    function el(tag, props, children) {
      const e = document.createElement(tag);
      if (props) for (const k in props) {
        const v = props[k];
        if (v == null) continue;
        if (k === "class") e.className = v;
        else if (k === "text") e.textContent = v;
        else if (k === "html") e.innerHTML = v;
        else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
        else if (k === "value") e.value = v;
        else if (k.length > 2 && k.startsWith("on") && typeof v === "function")
          e.addEventListener(k.slice(2).toLowerCase(), v);
        else e.setAttribute(k, v);
      }
      if (children != null) {
        (Array.isArray(children) ? children : [children]).forEach((c) => {
          if (c == null) return;
          e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
        });
      }
      return e;
    }
    function uid() { return "n" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); }
    // Relative luminance of a CSS colour string, or null if transparent/unparseable.
    function luminanceOf(str) {
      const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/.exec(str || "");
      if (!m) return null;
      const a = m[4] === undefined ? 1 : parseFloat(m[4]);
      if (a < 0.1) return null; // effectively transparent -> not a usable signal
      return (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255;
    }

    // Robust dark-mode detection. The DSH desktop wallpaper is a GRADIENT
    // (background-image), so background-color is transparent — reading only
    // background-color would wrongly report light mode on a dark wallpaper.
    function detectDark() {
      // 1) solid background-color on body / html
      for (const node of [document.body, document.documentElement]) {
        if (!node) continue;
        const l = luminanceOf(getComputedStyle(node).backgroundColor);
        if (l !== null) return l < 0.5;
      }
      // 2) gradient / image background: average the colour stops
      for (const node of [document.body, document.documentElement]) {
        if (!node) continue;
        const bi = getComputedStyle(node).backgroundImage || "";
        if (!bi || bi === "none") continue;
        const stops = bi.match(/rgba?\([^)]*\)/g) || [];
        let sum = 0, n = 0;
        for (const s of stops) {
          const l = luminanceOf(s);
          if (l !== null) { sum += l; n++; }
        }
        if (n) return (sum / n) < 0.5;
      }
      // 3) theme hints exposed by the host app
      try {
        const cls = (document.documentElement.className || "") + " " + (document.body.className || "");
        if (/dark|night|dim/i.test(cls)) return true;
        if (/\blight\b|day/i.test(cls)) return false;
        const attr =
          document.documentElement.getAttribute("data-theme") ||
          document.body.getAttribute("data-theme") || "";
        if (/dark/i.test(attr)) return true;
        if (/light/i.test(attr)) return false;
      } catch (e) {}
      // 4) OS preference
      return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }

    // ---------- styles ----------
    function injectStyles() {
      if (document.getElementById("dww-style")) return;
      const s = document.createElement("style");
      s.id = "dww-style";
      // Decorative wave used as a MASK, so it inherits the accent gradient
      // and adapts to light/dark automatically.
      const WAVE =
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 10' preserveAspectRatio='none'>" +
          "<path d='M0,5 C15,10 25,0 40,4 C55,8 68,0 82,4 C96,8 108,1 120,5 L120,10 L0,10 Z' fill='#000'/></svg>"
        );
      s.textContent = [
        // ---------- light theme tokens ----------
        // v0.6.0: the card SHELL is now FULLY TRANSPARENT (background:transparent)
        // with only a gradient hairline border. Only content controls (inputs,
        // buttons, fields) keep a faint veil so they stay operable.
        ".dww-root{",
        "  --bg:transparent;",
        "  --head:transparent;",
        "  --fg:#16203a;",
        "  --dim:#44536f;",
        "  --border:rgba(120,150,210,.34);",
        "  --border-strong:rgba(90,140,230,.55);",
        "  --card:rgba(255,255,255,.40);",
        "  --field:rgba(255,255,255,.35);",
        "  --hover:rgba(255,255,255,.55);",
        "  --accent:#2b6cff;",
        "  --accent2:#0fb5a5;",
        "  --danger:#e5484d;",
        "  --shadow:0 10px 30px rgba(15,30,70,.20);",
        "  --glow:rgba(43,108,255,.28);",
        "  --blur:none;",
        "  --wave-op:.34;",
        "  --grip:rgba(40,70,140,.55);",
        "  --sheen:rgba(255,255,255,.60);",
        "  --halo:0 1px 0 rgba(255,255,255,.45);",
        "}",
        // ---------- dark tokens: transparent shell over the deep-navy wallpaper ----------
        ".dww-root.dww-dark{",
        "  --bg:transparent;",
        "  --head:transparent;",
        "  --fg:#f2f6ff;",
        "  --dim:#b7c7e6;",
        "  --border:rgba(180,215,255,.28);",
        "  --border-strong:rgba(160,205,255,.55);",
        "  --card:rgba(255,255,255,.07);",
        "  --field:rgba(255,255,255,.08);",
        "  --hover:rgba(255,255,255,.14);",
        "  --accent:#7db8ff;",
        "  --accent2:#56d8cc;",
        "  --danger:#ff7b7b;",
        "  --shadow:0 14px 40px rgba(0,0,0,.40);",
        "  --glow:rgba(120,185,255,.40);",
        "  --blur:none;",
        "  --wave-op:.55;",
        "  --grip:rgba(190,220,255,.65);",
        "  --sheen:rgba(255,255,255,.10);",
        "  --halo:0 1px 0 rgba(255,255,255,.14);",
        "}",
        // ---------- card shell: FULLY TRANSPARENT ----------
        ".dww-root{",
        "  position:fixed;",
        "  z-index:2147482000;",
        "  background:transparent;",
        "  color:var(--fg);",
        "  border:1px solid transparent;",
        "  border-radius:18px;",
        "  box-shadow:none;",
        "  font-family:'Microsoft YaHei','PingFang SC','Segoe UI',system-ui,sans-serif;",
        "  font-size:13px;",
        "  overflow:hidden;",
        "  display:flex;",
        "  flex-direction:column;",
        "  transition:box-shadow .22s ease;",
        "}",
        // A faint ambient blur glow under the card makes floating text pop on the
        // wallpaper without adding any opaque fill (the shell stays transparent).
        ".dww-root::before{",
        "  content:'';",
        "  position:absolute;",
        "  inset:-1px;",
        "  border-radius:18px;",
        "  padding:1px;",
        "  background:linear-gradient(135deg,var(--accent),transparent 36%,transparent 64%,var(--accent2));",
        "  opacity:.55;",
        "  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);",
        "  -webkit-mask-composite:xor;",
        "  mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);",
        "  mask-composite:exclude;",
        "  pointer-events:none;",
        "  transition:opacity .22s ease;",
        "  filter:drop-shadow(0 6px 14px rgba(0,0,0,.22));",
        "}",
        ".dww-root:hover::before{opacity:.95;}",
        // text safety: on a DARK wallpaper (the common case) give glyphs a faint
        // shadow since the card no longer has a frosted fill behind them
        ".dww-root.dww-dark *:not(.dww-btn):not(.dww-x):not(.dww-mini):not(input):not(textarea):not(.dww-block):not(.dww-title){text-shadow:0 1px 3px rgba(0,0,0,.55);}",
        // sticky notes / paper sheets are opaque coloured paper with DARK text —
        // a dark shadow would smear them. The rule above has a very high
        // specificity (the long :not() chain), so opting the subtrees out needs !important.
        ".dww-root.dww-dark .dww-note,.dww-root.dww-dark .dww-note *,.dww-root.dww-dark .dww-paper,.dww-root.dww-dark .dww-paper *{text-shadow:none!important;}",
        ".dww-root.dww-min .dww-body{display:none;}",
        ".dww-root.dww-min .dww-resize{display:none;}",
        ".dww-root.dww-min .dww-egrip{display:none;}",
        ".dww-hidden{display:none!important;}",
        // ---------- header: gradient + wave motif echoing the desktop wallpaper ----------
        ".dww-head{",
        "  position:relative;",
        "  display:flex;",
        "  align-items:center;",
        "  gap:10px;",
        "  padding:10px 13px 13px;",
        "  cursor:move;",
        "  background:transparent;",
        "  user-select:none;",
        "  overflow:hidden;",
        "}",
        ".dww-head::after{",
        "  content:'';",
        "  position:absolute;",
        "  left:0;right:0;bottom:0;",
        "  height:9px;",
        "  background:linear-gradient(90deg,var(--accent),var(--accent2));",
        "  -webkit-mask-image:url(\"" + WAVE + "\");",
        "  mask-image:url(\"" + WAVE + "\");",
        "  -webkit-mask-size:120px 9px;",
        "  mask-size:120px 9px;",
        "  -webkit-mask-repeat:repeat-x;",
        "  mask-repeat:repeat-x;",
        "  opacity:var(--wave-op);",
        "  pointer-events:none;",
        "  filter:drop-shadow(0 1px 6px rgba(0,0,0,.35));",
        "}",
        ".dww-title{",
        "  position:relative;z-index:1;",
        "  font-weight:800;font-size:15px;flex:1;",
        "  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;",
        "  letter-spacing:.4px;",
        "  background:linear-gradient(90deg,var(--fg),var(--accent));",
        "  -webkit-background-clip:text;background-clip:text;color:transparent;",
        "  text-shadow:none;",
        "  filter:drop-shadow(0 2px 5px rgba(0,0,0,.28));",
        "}",
        ".dww-btn{",
        "  position:relative;z-index:1;",
        "  border:1px solid var(--border);",
        "  background:var(--card);",
        "  color:var(--fg);",
        "  border-radius:8px;",
        "  width:26px;height:26px;",
        "  cursor:pointer;",
        "  font-size:14px;line-height:1;",
        "  display:flex;align-items:center;justify-content:center;",
        "  flex:0 0 auto;",
        "  transition:all .16s;",
        "}",
        ".dww-btn:hover{",
        "  background:var(--hover);",
        "  border-color:var(--accent);",
        "  color:var(--accent);",
        "  box-shadow:0 0 0 3px var(--glow);",
        "}",
        ".dww-body{padding:2px 14px 46px;overflow:auto;flex:1;min-height:0;background:transparent;box-sizing:border-box;}",
        ".dww-list{display:flex;flex-direction:column;gap:8px;margin-bottom:8px;}",
        ".dww-empty{",
        "  color:var(--dim);font-size:12px;line-height:1.6;",
        "  padding:12px 8px;text-align:center;",
        "  background:var(--field);",
        "  border-radius:11px;",
        "  border:1px dashed var(--border-strong);",
        "}",
        ".dww-time{width:82px;flex:0 0 auto;background:var(--field);border:1px solid var(--border);color:var(--fg);border-radius:8px;padding:5px 7px;font-size:12px;font-family:inherit;transition:all .16s;}",
        ".dww-time:focus,.dww-text:focus,.dww-goal-title:focus,.dww-cal-ta:focus{border-color:var(--accent);outline:none;box-shadow:0 0 0 3px var(--glow);}",
        ".dww-text{flex:1;min-width:0;background:var(--field);border:1px solid var(--border);color:var(--fg);border-radius:8px;padding:6px 10px;font-size:12px;font-family:inherit;transition:all .16s;}",
        ".dww-x{border:1px solid var(--border);background:var(--card);color:var(--dim);border-radius:8px;width:26px;height:26px;cursor:pointer;font-size:14px;line-height:1;flex:0 0 auto;align-self:flex-start;transition:all .16s;}",
        ".dww-x:hover{color:var(--danger);border-color:var(--danger);background:var(--hover);box-shadow:0 0 0 3px rgba(229,72,77,.16);}",
        ".dww-add{",
        "  width:100%;",
        "  border:1.5px dashed var(--border-strong);",
        "  background:var(--card);",
        "  color:var(--accent);",
        "  border-radius:11px;",
        "  padding:9px;",
        "  cursor:pointer;",
        "  font-size:12px;font-weight:700;font-family:inherit;",
        "  letter-spacing:.4px;",
        "  transition:all .18s;",
        "}",
        ".dww-add:hover{",
        "  background:var(--hover);",
        "  border-color:var(--accent);",
        "  border-style:solid;",
        "  box-shadow:0 0 0 3px var(--glow);",
        "}",
        // ---------- goals ----------
        ".dww-goal{",
        "  display:flex;flex-direction:column;gap:8px;",
        "  background:linear-gradient(135deg,var(--field),var(--card));",
        "  border:1px solid var(--border);",
        "  border-radius:12px;padding:11px;",
        "  transition:border-color .18s,box-shadow .18s,opacity .26s,filter .26s,transform .26s;",
        "}",
        ".dww-goal:hover{border-color:var(--border-strong);box-shadow:0 0 18px var(--glow);}",
        ".dww-goal-top{display:none;}",
        ".dww-goal .dww-flowbtn{margin-left:0;padding:2px 5px;font-size:12px;flex:0 0 auto;}",
        ".dww-goal .dww-x{width:22px;height:22px;font-size:12px;flex:0 0 auto;}",
        ".dww-goal .dww-check{width:18px;height:18px;font-size:12px;flex:0 0 auto;}",
        ".dww-goal-title{flex:1;min-width:0;width:auto;box-sizing:border-box;background:var(--bg);border:1px solid var(--border);color:var(--fg);border-radius:7px;padding:4px 8px;font-size:12px;font-family:inherit;transition:all .16s;}",
        // editable percent field (plain goals) / read-only 🌿n/m badge (tree goals)
        ".dww-pct-edit{width:46px;flex:0 0 auto;text-align:center;background:rgba(255,255,255,.5);border:1px solid rgba(40,45,60,.18);color:#1f2531;border-radius:7px;padding:4px 2px;font-size:11.5px;font-weight:700;font-family:inherit;font-variant-numeric:tabular-nums;transition:border-color .16s;}",
        ".dww-pct-edit:focus{outline:none;border-color:rgba(40,45,60,.6);}",
        ".dww-pct-sum{flex:0 0 auto;font-size:11px;font-weight:700;color:#1f2531;background:rgba(255,255,255,.4);border:1px solid rgba(40,45,60,.14);border-radius:7px;padding:4px 6px;white-space:nowrap;font-variant-numeric:tabular-nums;}",
        ".dww-pct{font-size:12px;font-weight:700;color:var(--accent2);min-width:38px;text-align:right;font-variant-numeric:tabular-nums;}",
        // v0.16.2: segmented block progress (10 blocks x 10%) replaces the full-width bar —
        // blocks are clickable to jump the progress; keeps rows compact.
        ".dww-blocks{flex:1;min-width:0;display:flex;align-items:center;gap:2px;}",
        ".dww-block{width:10px;height:10px;flex:0 0 auto;border-radius:2.5px;border:none;padding:0;cursor:pointer;background:rgba(45,50,66,.14);transition:background .14s,transform .14s,box-shadow .14s;}",
        ".dww-block:hover{transform:scale(1.15);}",
        ".dww-block.dww-on{background:linear-gradient(135deg,#2b6cff,#0fb5a5);box-shadow:0 0 5px rgba(43,108,255,.4);}",
        ".dww-block.dww-ro{cursor:default;}",
        ".dww-block.dww-ro:hover{transform:none;}",
        ".dww-goal-ctrl{display:flex;align-items:center;gap:6px;}",
        ".dww-mini{border:1px solid var(--border);background:var(--card);color:var(--fg);border-radius:8px;padding:4px 11px;cursor:pointer;font-size:12px;font-family:inherit;flex:0 0 auto;transition:all .16s;}",
        ".dww-mini:hover{background:var(--hover);border-color:var(--accent);color:var(--accent);box-shadow:0 0 0 3px var(--glow);}",
        ".dww-mini.dww-on{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border-color:transparent;box-shadow:0 2px 10px var(--glow);}",
        // ---------- calendar ----------
        ".dww-cal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;}",
        ".dww-cal-ym{font-weight:700;font-size:14px;letter-spacing:.4px;}",
        ".dww-cal-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;}",
        ".dww-cal-wd{text-align:center;font-size:11px;color:var(--dim);padding:3px 0;font-weight:700;letter-spacing:.5px;}",
        ".dww-cal-cell{position:relative;text-align:center;font-size:12px;padding:7px 0;border-radius:9px;cursor:pointer;border:1px solid transparent;transition:all .14s;}",
        ".dww-cal-cell:hover{background:var(--hover);border-color:var(--border-strong);transform:translateY(-1px);}",
        ".dww-cal-empty{visibility:hidden;cursor:default;}",
        ".dww-today{",
        "  background:linear-gradient(135deg,var(--accent),var(--accent2));",
        "  color:#fff;font-weight:700;border-color:transparent;",
        "  box-shadow:0 3px 12px var(--glow);",
        "}",
        ".dww-today:hover{transform:translateY(-1px);}",
        ".dww-marked:not(.dww-today){background:var(--field);border-color:var(--accent2);}",
        ".dww-dot{position:absolute;top:3px;right:5px;width:6px;height:6px;border-radius:50%;background:var(--accent2);box-shadow:0 0 6px var(--accent2);}",
        ".dww-cal-edit{margin-top:11px;display:flex;flex-direction:column;gap:8px;padding-top:11px;border-top:1px dashed var(--border-strong);}",
        ".dww-cal-sel{font-size:12px;font-weight:700;color:var(--dim);display:flex;align-items:center;gap:6px;letter-spacing:.3px;}",
        ".dww-cal-ta{width:100%;box-sizing:border-box;background:var(--field);border:1px solid var(--border);color:var(--fg);border-radius:9px;padding:8px 10px;font-size:12px;font-family:inherit;resize:vertical;transition:all .16s;}",
        // v0.13.0: calendar cell day-number + event chips + overflow tag
        ".dww-cal-cell{display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;gap:2px;padding:4px 2px 4px;min-height:54px;}",
        ".dww-cal-dnum{font-size:12px;line-height:1.1;text-align:center;}",
        ".dww-evchip{",
          "font-size:10px;line-height:1.1;padding:1px 3px;border-radius:3px;cursor:pointer;",
          "background:color-mix(in srgb, var(--ec) 22%, transparent);",
          "border-left:3px solid var(--ec);color:var(--fg);",
          "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;",
          "transition:filter .14s;",
        "}",
        ".dww-evchip:hover{filter:brightness(1.08);}",
        ".dww-evmore{font-size:10px;text-align:center;color:var(--dim);cursor:default;line-height:1.1;}",
        // editor: per-day event row, date range picker, color swatches
        ".dww-evrow{display:flex;align-items:center;gap:6px;padding:5px 7px;border-radius:7px;background:var(--field);border:1px solid var(--border);font-size:11.5px;}",
        ".dww-evdot{flex:0 0 auto;width:8px;height:8px;border-radius:50%;}",
        ".dww-evtitle{flex:1;min-width:0;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
        ".dww-evrange{flex:0 0 auto;color:var(--dim);font-size:10.5px;font-variant-numeric:tabular-nums;}",
        ".dww-cal-dates{display:flex;align-items:center;gap:5px;flex-wrap:wrap;}",
        ".dww-cal-dates label{font-size:11px;color:var(--dim);font-weight:700;}",
        ".dww-cal-dates input[type=date]{flex:1;min-width:110px;background:rgba(255,255,255,.5);border:1px solid rgba(40,45,60,.18);color:#2b3040;border-radius:7px;padding:5px 7px;font-size:11px;font-family:inherit;color-scheme:light;}",
        ".dww-cal-color{display:flex;align-items:center;gap:5px;flex-wrap:wrap;}",
        ".dww-cal-color label{font-size:11px;color:var(--dim);font-weight:700;}",
        ".dww-cal-color input[type=color]{width:30px;height:26px;border:1px solid var(--border);border-radius:6px;background:transparent;cursor:pointer;padding:1px;}",
        ".dww-sw{width:18px;height:18px;border:1px solid rgba(0,0,0,.15);border-radius:5px;cursor:pointer;padding:0;}",
        ".dww-sw.dww-on{outline:2px solid var(--accent);outline-offset:1px;}",
        // ---------- countdown: STICKY NOTES (v0.7.0) ----------
        ".dww-section{margin-top:15px;padding-top:13px;border-top:1px dashed var(--border-strong);}",
        ".dww-section-h{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:var(--dim);margin-bottom:10px;letter-spacing:1.2px;text-transform:uppercase;opacity:.9;}",
        ".dww-notes{display:flex;flex-direction:column;gap:9px;}",
        // each countdown = one little paper note: tinted gradient, a binding
        // stripe on the left, a folded corner bottom-right, slight tilt
        ".dww-note{",
        "  position:relative;",
        "  padding:8px 11px 9px 13px;",
        "  border-radius:2px 11px 2px 11px;",
        "  background:linear-gradient(158deg,var(--na),var(--nb));",
        "  box-shadow:0 6px 15px rgba(0,0,0,.26),inset 0 1px 0 rgba(255,255,255,.38);",
        "  color:#2f3440;",
        "  transform:rotate(var(--nr,-.5deg));",
        "  transition:transform .18s ease,box-shadow .18s ease;",
        "}",
        ".dww-note:hover{transform:rotate(0deg) translateY(-1px);box-shadow:0 10px 22px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.38);}",
        // v0.13.0: binding stripe + folded corner scale with the card width via %.
        // Was a fixed 3px stripe / 15px corner that did NOT follow the card resize handle.
        ".dww-note::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3.5%;background:var(--nc);opacity:.9;border-radius:2px 0 0 2px;}",
        ".dww-note::after{content:'';position:absolute;right:0;bottom:0;width:14%;aspect-ratio:1/1;background:linear-gradient(135deg,transparent 50%,rgba(0,0,0,.15) 50%);border-bottom-right-radius:2px;}",
        ".dww-note-top{display:flex;align-items:center;gap:6px;}",
        ".dww-note-title{",
        "  flex:1;min-width:0;",
        "  background:transparent;border:0;",
        "  border-bottom:1px dashed rgba(40,45,60,.22);",
        "  color:#2b3040;font-size:13px;font-weight:800;",
        "  font-family:inherit;padding:1px 1px 2px;letter-spacing:.2px;",
        "  transition:border-color .16s;",
        "}",
        ".dww-note-title::placeholder{color:rgba(45,50,66,.42);font-weight:600;}",
        ".dww-note-title:focus{outline:none;border-bottom-color:rgba(40,45,60,.6);}",
        ".dww-note-x{",
        "  flex:0 0 auto;width:19px;height:19px;display:flex;align-items:center;justify-content:center;",
        "  border:0;border-radius:5px;cursor:pointer;",
        "  background:rgba(45,50,66,.10);color:#3a4050;",
        "  font-size:14px;line-height:1;font-family:inherit;",
        "  transition:background .15s,color .15s;",
        "}",
        ".dww-note-x:hover{background:rgba(200,45,60,.85);color:#fff;}",
        // remaining time: big day count + a small h:m:s line
        ".dww-note-main{display:flex;align-items:baseline;gap:5px;margin-top:5px;}",
        ".dww-note-days{font-size:23px;font-weight:800;line-height:1;letter-spacing:-.6px;font-variant-numeric:tabular-nums;color:#1f2531;}",
        ".dww-note-unit{font-size:11px;font-weight:800;color:rgba(45,50,66,.6);}",
        ".dww-note-hms{font-size:11.5px;font-weight:700;font-variant-numeric:tabular-nums;color:rgba(45,50,66,.72);letter-spacing:.4px;margin-top:2px;}",
        // the target date: a bare, quiet datetime field — click to edit
        ".dww-note-date{",
        "  margin-top:5px;width:100%;box-sizing:border-box;",
        "  background:transparent;border:0;padding:0;",
        "  color:rgba(45,50,66,.72);font-size:10.5px;font-weight:700;",
        "  font-family:inherit;letter-spacing:.3px;",
        "  color-scheme:light;",
        "}",
        ".dww-note-date:focus{outline:none;color:#1f2531;}",
        ".dww-note-date::-webkit-datetime-edit{padding:0;}",
        // "already reached" state: grey the note out
        ".dww-note.dww-past{filter:saturate(.25) brightness(1.06);}",
        ".dww-note.dww-past .dww-note-days{color:rgba(45,50,66,.55);font-size:18px;}",
        // ---------- generic paper (便签) skin for the other three sections ----------
        // same tinted-paper look as the countdown notes, reusable by any block
        ".dww-paper{",
        "  position:relative;",
        "  border-radius:2px 11px 2px 11px;",
        "  background:linear-gradient(158deg,var(--na),var(--nb));",
        "  box-shadow:0 6px 15px rgba(0,0,0,.26),inset 0 1px 0 rgba(255,255,255,.38);",
        "  color:#2f3440;",
        "  transform:rotate(var(--nr,-.4deg));",
        "  transition:transform .18s ease,box-shadow .18s ease;",
        "}",
        ".dww-paper:hover{transform:rotate(0deg) translateY(-1px);box-shadow:0 10px 22px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.38);}",
        // v0.13.0: same treatment as the countdown note — the binding stripe +
        // folded corner now scale with the card width (was fixed 3px / 15px).
        ".dww-paper::before{content:'';position:absolute;left:0;top:0;bottom:0;width:1%;min-width:3px;background:var(--nc);opacity:.9;border-radius:2px 0 0 2px;}",
        ".dww-paper::after{content:'';position:absolute;right:0;bottom:0;width:5%;min-width:12px;aspect-ratio:1/1;background:linear-gradient(135deg,transparent 50%,rgba(0,0,0,.15) 50%);border-bottom-right-radius:2px;}",
        // controls inside a paper sheet must read as DARK text on the tinted paper
        ".dww-paper .dww-time,.dww-paper .dww-text,.dww-paper .dww-goal-title,.dww-paper .dww-cal-ta{background:rgba(255,255,255,.5);border:1px solid rgba(40,45,60,.18);color:#2b3040;}",
        ".dww-paper .dww-time::placeholder,.dww-paper .dww-text::placeholder,.dww-paper .dww-goal-title::placeholder,.dww-paper .dww-cal-ta::placeholder{color:rgba(45,50,66,.45);}",
        ".dww-paper .dww-x,.dww-paper .dww-mini{background:rgba(45,50,66,.1);color:#3a4050;border:1px solid rgba(45,50,66,.18);}",
        ".dww-paper .dww-x:hover{background:rgba(200,45,60,.85);color:#fff;border-color:transparent;}",
        ".dww-paper .dww-mini:hover{background:rgba(45,50,66,.18);color:#1f2531;}",
        ".dww-paper .dww-mini.dww-on{background:linear-gradient(135deg,#2b6cff,#0fb5a5);color:#fff;border-color:transparent;}",
        ".dww-paper .dww-pct{color:#1f2531;}",
        ".dww-paper .dww-block{background:rgba(45,50,66,.15);}",
        ".dww-paper .dww-block.dww-on{background:linear-gradient(135deg,#2b6cff,#0fb5a5);}",
        ".dww-paper .dww-empty{background:rgba(45,50,66,.08);color:#3a4050;border-color:rgba(45,50,66,.18);}",
        // v0.13.0: kind selector + off-today visual cue for schedule rows
        ".dww-kind{flex:0 0 auto;background:rgba(255,255,255,.5);border:1px solid rgba(40,45,60,.18);color:#2b3040;border-radius:8px;padding:5px 4px;font-size:11px;font-family:inherit;cursor:pointer;transition:all .16s;min-width:0;}",
        ".dww-kind:focus{outline:none;border-color:rgba(40,45,60,.6);box-shadow:0 0 0 2px rgba(40,45,60,.18);}",
        ".dww-sch-row.dww-off{opacity:.42;filter:saturate(.55);}",
        // schedule rows: a compact paper sheet
        // v0.16.1: TASK on the LEFT (input + kind stacked), TIME RANGE on the RIGHT
        // (start over end, stacked). The × floats at the row's top-right corner.
        // v0.16.4: overall scale-down per user request — smaller gaps/padding/
        // font so narrow cards never crowd.
        ".dww-sch-row{display:flex;align-items:stretch;gap:5px;padding:6px 8px 7px 12px;}",
        ".dww-sch-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;justify-content:center;overflow:hidden;}",
        ".dww-sch-main .dww-text{width:100%;min-width:0;box-sizing:border-box;padding:4px 7px;font-size:11.5px;}",
        ".dww-sch-meta{display:flex;align-items:center;gap:4px;}",
        ".dww-sch-time{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:1px;justify-content:center;}",
        ".dww-sch-time .dww-time{width:72px;padding:3px 4px;font-size:11px;}",
        ".dww-sch-sep{font-size:8px;line-height:1;color:rgba(45,50,66,.45);font-style:normal;font-weight:700;}",
        ".dww-kind{flex:0 0 auto;background:rgba(255,255,255,.5);border:1px solid rgba(40,45,60,.18);color:#2b3040;border-radius:7px;padding:3px 2px;font-size:10.5px;font-family:inherit;cursor:pointer;transition:all .16s;min-width:0;}",
        // goals: paper sheet with progress
        // v0.16.4: STRIP layout — one compact row per goal, data-dense:
        // [check] [name] [% editable or 🌿n/m] [📊] [×]
        ".dww-list.dww-goal-list{display:flex;flex-direction:column;gap:5px;}",
        ".dww-goal{display:flex;flex-direction:row;align-items:center;gap:5px;padding:5px 7px 5px 11px;min-width:0;}",
        // goals: circular "done" check + completed micro-interaction (v0.8.1)
        ".dww-check{flex:0 0 auto;width:20px;height:20px;border-radius:50%;border:2px solid rgba(40,45,60,.4);background:rgba(255,255,255,.45);color:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;padding:0;transition:background .22s,border-color .22s,color .22s,transform .22s;}",
        ".dww-check::after{content:\"\";transition:opacity .22s;}",
        ".dww-goal.dww-done .dww-check{background:var(--nc,#2fa96b);border-color:var(--nc,#2fa96b);color:#fff;transform:scale(1.06);}",
        ".dww-goal.dww-done .dww-check::after{content:\"\\2713\";}",
        ".dww-goal.dww-done{opacity:.58;filter:saturate(.55);}",
        ".dww-goal.dww-done .dww-goal-title{text-decoration:line-through;text-decoration-color:rgba(40,45,60,.55);color:rgba(43,48,64,.6);}",
        ".dww-goal.dww-done .dww-block.dww-on{filter:grayscale(.45);}",
        ".dww-goal.dww-pop{animation:dwwPop .3s ease;}",
        "@keyframes dwwPop{0%{transform:scale(1);}45%{transform:scale(.965);}100%{transform:scale(1);}}",
        // ---------- goal flowchart (v0.9.0): horizontal multi-branch tree ----------
        ".dww-flowbtn{flex:0 0 auto;border:1px solid var(--border);background:var(--card);color:var(--fg);border-radius:8px;padding:4px 8px;cursor:pointer;font-size:13px;line-height:1;transition:all .16s;}",
        ".dww-flowbtn:hover{background:var(--hover);border-color:var(--accent);color:var(--accent);}",
        ".dww-flow{position:fixed;inset:0;z-index:2147483500;display:flex;flex-direction:column;font-family:inherit;background-color:#eef2f8;background-image:linear-gradient(160deg,rgba(238,242,250,.9),rgba(226,233,245,.94));}",
        // ---------- v0.15.0: the flow editor is a floating RESIZABLE window ----------
        // Geometry lives inline (left/top/width/height set by applyWin()); the old
        // inset:0 rule stays as a harmless fallback for the pre-JS first frame.
        ".dww-flow-backdrop{position:fixed;inset:0;z-index:2147483499;background:rgba(10,16,30,.38);}",
        ".dww-flow{box-sizing:border-box;border-radius:14px;overflow:hidden;border:1px solid rgba(30,40,60,.16);box-shadow:0 26px 80px rgba(8,16,34,.45);}",
        ".dww-flow.dww-max{border-radius:0;box-shadow:none;border:none;}",
        // 8 frame handles (inner strips so overflow:hidden can't clip them)
        ".dww-fh{position:absolute;z-index:2147483601;touch-action:none;}",
        ".dww-fh-n{top:0;left:12px;right:12px;height:6px;cursor:ns-resize;}",
        ".dww-fh-s{bottom:0;left:12px;right:12px;height:6px;cursor:ns-resize;}",
        ".dww-fh-e{right:0;top:12px;bottom:12px;width:6px;cursor:ew-resize;}",
        ".dww-fh-w{left:0;top:12px;bottom:12px;width:6px;cursor:ew-resize;}",
        ".dww-fh-ne{top:0;right:0;width:14px;height:14px;cursor:nesw-resize;}",
        ".dww-fh-nw{top:0;left:0;width:14px;height:14px;cursor:nwse-resize;}",
        ".dww-fh-se{bottom:0;right:0;width:14px;height:14px;cursor:nwse-resize;}",
        ".dww-fh-sw{bottom:0;left:0;width:14px;height:14px;cursor:nesw-resize;}",
        ".dww-flow.dww-max .dww-fh{display:none;}",
        // the head doubles as the window title bar
        ".dww-flow-head{cursor:grab;}",
        ".dww-flow.dww-max .dww-flow-head{cursor:default;}",
        ".dww-flow-maxbtn{flex:0 0 auto;width:30px;height:30px;border:1px solid rgba(30,40,60,.2);background:#f4f6fa;color:#2b3040;border-radius:8px;cursor:pointer;font-size:13px;line-height:1;display:flex;align-items:center;justify-content:center;transition:all .16s;}",
        ".dww-flow-maxbtn:hover{background:#e8edf6;border-color:#3b7bff;}",
        ".dww-flow-head{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#ffffff;border-bottom:1px solid rgba(30,40,60,.12);}",
        ".dww-flow-back{border:1px solid rgba(30,40,60,.2);background:#f4f6fa;color:#2b3040;border-radius:8px;padding:6px 13px;cursor:pointer;font-size:13px;font-family:inherit;transition:all .16s;}",
        ".dww-flow-back:hover{background:#e8edf6;}",
        ".dww-flow-title{font-weight:800;font-size:15px;letter-spacing:.3px;color:#1f2531;flex:0 0 auto;}",
        ".dww-flow-hint{font-size:11px;color:rgba(60,70,90,.6);}",
        // WPS-style canvas: light gray with subtle graph-paper grid
        ".dww-flow-canvas{flex:1;overflow:auto;position:relative;background-color:#f7f9fc;background-image:linear-gradient(rgba(15,23,42,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(15,23,42,.06) 1px,transparent 1px);background-size:24px 24px;background-position:-1px -1px;cursor:grab;}",
        ".dww-flow-stage{position:absolute;left:0;top:0;transform-origin:0 0;transform:scale(1);will-change:transform;}",
        ".dww-flow-spacer{position:absolute;left:0;top:0;width:300px;height:220px;pointer-events:none;}",
        ".dww-flow-zoom{display:flex;align-items:center;gap:3px;margin-left:auto;background:#f4f6fa;border:1px solid rgba(30,40,60,.12);border-radius:8px;padding:2px;}",
        ".dww-flow-zoom button{width:26px;height:26px;border:none;background:transparent;color:#2b3040;border-radius:6px;cursor:pointer;font-size:15px;line-height:1;display:flex;align-items:center;justify-content:center;transition:background .15s;}",
        ".dww-flow-zoom button:hover{background:#e6ebf3;}",
        ".dww-flow-zoom .dww-zoom-val{min-width:48px;text-align:center;font-size:12px;font-weight:700;color:#2b3040;cursor:pointer;border-radius:6px;padding:0 4px;}",
        ".dww-flow-zoom .dww-zoom-val:hover{background:#e6ebf3;}",
        ".dww-flow-canvas.dww-canvas-panning{cursor:grabbing;}",
        ".dww-flow-lines{position:absolute;left:0;top:0;pointer-events:none;}",
        // v0.12.9: border-box is ESSENTIAL — the connection dots and every edge path are
        // computed from NODE_W(128) x NODE_H(40). With content-box the padding inflated the
        // rendered box to 140x47, so the dots sat ~12px outside the geometry and every
        // connector visibly missed the shape's border.
        ".dww-node{position:absolute;width:128px;background-color:transparent;background-size:100% 100%;background-repeat:no-repeat;border:none;padding:3px 6px 4px;box-sizing:border-box;display:flex;flex-direction:column;gap:2px;cursor:pointer;transition:opacity .25s,filter .25s;touch-action:none;user-select:none;will-change:transform;}",
        ".dww-node:hover{filter:drop-shadow(0 3px 7px rgba(20,30,50,.22));}",
        ".dww-node.dww-dragging{transition:none;filter:drop-shadow(0 2px 9px rgba(59,123,255,.7));}",
        // v0.12.9: WPS-style box — the label sits CENTERED inside the shape silhouette and
        // the checkbox floats outside (mirrors the delete × badge) so the shape stays clean.
        ".dww-node-body{flex:1;display:flex;align-items:center;justify-content:center;min-height:30px;padding:1px 7px;}",
        ".dww-node-text{width:100%;min-width:0;background:transparent;border:none;color:#2b3040;border-radius:4px;padding:2px 4px;font-size:12px;line-height:1.35;text-align:center;font-family:inherit;transition:background .16s,border-color .16s,box-shadow .16s;}",
        ".dww-node-text:hover{background:rgba(30,40,60,.05);}",
        ".dww-node-text:focus{outline:none;background:rgba(43,108,255,.07);box-shadow:inset 0 0 0 1.5px rgba(43,108,255,.6);}",
        ".dww-node.dww-done{opacity:.5;filter:saturate(.5);}",
        ".dww-node.dww-done .dww-node-text{text-decoration:line-through;text-decoration-color:rgba(40,45,60,.55);color:rgba(43,48,64,.6);}",
        ".dww-node.dww-done .dww-check{background:#2fa96b;border-color:#2fa96b;color:#fff;transform:scale(1.06);}",
        ".dww-node.dww-done .dww-check::after{content:\"\\2713\";}",
        // smaller, quieter completion toggle inside flow nodes
        ".dww-node .dww-check{width:15px;height:15px;border-width:1.5px;font-size:10px;border-color:rgba(40,45,60,.35);background:rgba(255,255,255,.4);}",
        ".dww-node-add{display:flex;justify-content:flex-start;}",
        ".dww-goal-sum{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:700;color:rgba(40,50,66,.82);padding:1px 2px 0;font-variant-numeric:tabular-nums;letter-spacing:.2px;}",
        ".dww-goal-sumtext{flex:0 0 auto;white-space:nowrap;}",
        ".dww-flow-sum{font-size:12px;font-weight:700;color:#1f9d63;font-variant-numeric:tabular-nums;}",
        // v0.10.0: side project-tree column + derived root check
        ".dww-flow-body{flex:1;display:flex;min-height:0;}",
        ".dww-flow-side{width:238px;flex:0 0 auto;overflow:auto;background:#f8fafd;border-right:1px solid rgba(30,40,60,.12);padding:10px 9px 14px;}",
        ".dww-flow-side-h{font-size:12px;font-weight:800;color:#3a4a66;letter-spacing:.4px;padding:2px 4px 9px;}",
        ".dww-side-goal{display:flex;align-items:center;gap:6px;padding:6px 7px;border-radius:8px;cursor:pointer;color:#2b3040;font-size:12px;font-weight:700;}",
        ".dww-side-goal:hover{background:rgba(30,40,60,.06);}",
        ".dww-side-goal.dww-cur{background:linear-gradient(135deg,rgba(59,123,255,.16),rgba(34,199,192,.12));}",
        ".dww-side-tw{flex:0 0 auto;width:14px;text-align:center;color:rgba(60,70,90,.6);}",
        ".dww-side-nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
        ".dww-side-bd{flex:0 0 auto;font-size:10px;color:#1f9d63;background:rgba(47,169,107,.12);border-radius:99px;padding:1px 6px;}",
        ".dww-side-subs{margin:0 0 6px 14px;border-left:1px solid rgba(30,40,60,.16);padding-left:4px;}",
        ".dww-side-row{display:flex;align-items:center;gap:6px;padding:3px 6px;border-radius:6px;color:rgba(40,50,70,.85);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
        ".dww-side-row.dww-side-row-branch{cursor:pointer;}",
        ".dww-side-row.dww-side-row-branch:hover{background:rgba(30,40,60,.06);}",
        ".dww-side-row.dww-side-row-leaf{padding-top:2px;padding-bottom:2px;}",
        ".dww-side-row.dww-side-empty{color:rgba(60,70,90,.4);font-style:italic;}",
        ".dww-side-ic{flex:0 0 auto;width:14px;text-align:center;font-size:11px;color:rgba(60,70,90,.7);}",
        ".dww-side-row .dww-side-ic{color:#1f9d63;}",
        ".dww-side-row .dww-side-tw{flex:0 0 auto;width:12px;text-align:center;color:rgba(60,70,90,.55);}",
        ".dww-side-row .dww-side-nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
        ".dww-side-row.dww-side-row-leaf .dww-side-nm{color:rgba(60,70,90,.7);}",
        ".dww-side-row.dww-side-row-leaf.dww-done .dww-side-nm,.dww-side-row.dww-side-row-branch.dww-done .dww-side-nm{color:#1f9d63;text-decoration:line-through;}",
        ".dww-check.dww-autock{cursor:default;border-style:dashed;}",
        // ---------- v0.12.0: WPS-style flowchart (palette + free-form edges) ----------
        ".dww-flow-palette{width:228px;flex:0 0 228px;overflow:auto;background:#ffffff;border-right:1px solid rgba(30,40,60,.12);padding:0 0 14px;}",
        ".dww-pal-tabs{display:flex;gap:18px;padding:10px 14px 8px;border-bottom:1px solid rgba(30,40,60,.08);}",
        ".dww-pal-tab{padding:4px 0;font-size:13px;font-weight:700;color:rgba(60,70,90,.55);cursor:pointer;border-bottom:2px solid transparent;user-select:none;}",
        ".dww-pal-tab.dww-on{color:#3b7bff;border-bottom-color:#3b7bff;}",
        ".dww-pal-head{display:flex;align-items:center;gap:6px;padding:8px 14px 4px;}",
        ".dww-pal-theme{font-size:11px;color:#3a4a66;display:flex;align-items:center;gap:4px;cursor:pointer;padding:3px 7px;border:1px solid rgba(30,40,60,.15);border-radius:7px;background:#fff;}",
        ".dww-pal-theme::before{content:'';width:12px;height:12px;border-radius:50%;background:linear-gradient(135deg,#fff5b8 49%,#5b6b7d 50%,#5b6b7d);border:1px solid rgba(0,0,0,.1);}",
        ".dww-pal-search{flex:1;text-align:right;color:rgba(60,70,90,.5);font-size:14px;cursor:pointer;}",
        ".dww-pal-cat{font-size:11px;font-weight:800;color:rgba(60,70,90,.7);padding:10px 14px 4px;display:flex;align-items:center;gap:4px;cursor:pointer;user-select:none;}",
        ".dww-pal-cat::before{content:'▾';font-size:9px;color:rgba(60,70,90,.45);transition:transform .15s;}",
        ".dww-pal-cat.dww-collapsed::before{transform:rotate(-90deg);}",
        ".dww-pal-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:3px;padding:4px 12px 6px;}",
        ".dww-pal-item{display:flex;align-items:center;justify-content:center;height:34px;background:#ffffff;border:1px solid rgba(30,40,60,.12);border-radius:6px;cursor:grab;color:#3a4a66;transition:background .12s,border-color .12s;}",
        ".dww-pal-item:hover{background:#eaf1ff;border-color:rgba(59,123,255,.4);}",
        ".dww-pal-item:active{cursor:grabbing;background:rgba(59,123,255,.15);}",
        ".dww-pal-item svg{width:80%;height:80%;pointer-events:none;}",
        // selected node: drop-shadow glow follows the SVG silhouette (box-shadow would show a rectangle)
        ".dww-node.dww-sel{filter:drop-shadow(0 2px 10px rgba(59,123,255,.85));z-index:5;}",
        ".dww-node.dww-done.dww-sel{filter:saturate(.5) drop-shadow(0 2px 10px rgba(59,123,255,.85));}",
        // connection handles: hidden until the node is hovered or selected (cleaner look)
        ".dww-conn-dot{position:absolute;width:12px;height:12px;border-radius:50%;background:#3b7bff;border:1.5px solid #fff;box-shadow:0 1px 3px rgba(20,30,50,.3);cursor:crosshair;z-index:4;opacity:0;transform:scale(.5);transition:opacity .15s,transform .15s;touch-action:none;user-select:none;pointer-events:auto;}",
        ".dww-node:hover .dww-conn-dot,.dww-node.dww-sel .dww-conn-dot{opacity:1;}",
        ".dww-conn-dot:hover{transform:scale(1.4);background:#22c7c0;}",
        ".dww-conn-dot.dww-conn-n{left:50%;top:-7px;transform:translateX(-50%) scale(.5);}",
        ".dww-conn-dot.dww-conn-s{left:50%;bottom:-7px;transform:translateX(-50%) scale(.5);}",
        ".dww-conn-dot.dww-conn-e{right:-7px;top:50%;transform:translateY(-50%) scale(.5);}",
        ".dww-conn-dot.dww-conn-w{left:-7px;top:50%;transform:translateY(-50%) scale(.5);}",
        ".dww-node:hover .dww-conn-dot,.dww-node.dww-sel .dww-conn-dot{opacity:1;transform:none;}",
        ".dww-node:hover .dww-conn-dot.dww-conn-n,.dww-node.dww-sel .dww-conn-dot.dww-conn-n{transform:translateX(-50%);}",
        ".dww-node:hover .dww-conn-dot.dww-conn-s,.dww-node.dww-sel .dww-conn-dot.dww-conn-s{transform:translateX(-50%);}",
        ".dww-node:hover .dww-conn-dot.dww-conn-e,.dww-node.dww-sel .dww-conn-dot.dww-conn-e{transform:translateY(-50%);}",
        ".dww-node:hover .dww-conn-dot.dww-conn-w,.dww-node.dww-sel .dww-conn-dot.dww-conn-w{transform:translateY(-50%);}",
        ".dww-conn-dot.dww-conn-n:hover{transform:translateX(-50%) scale(1.4);}",
        ".dww-conn-dot.dww-conn-s:hover{transform:translateX(-50%) scale(1.4);}",
        ".dww-conn-dot.dww-conn-e:hover{transform:translateY(-50%) scale(1.4);}",
        ".dww-conn-dot.dww-conn-w:hover{transform:translateY(-50%) scale(1.4);}",
        // v0.12.9: while an edge is being dragged every side MIDPOINT on every node lights up,
        // so the user can see exactly which 4 points are legal drop targets.
        ".dww-flow-canvas.dww-edging{cursor:crosshair;}",
        ".dww-flow-canvas.dww-edging .dww-conn-dot{opacity:1;background:rgba(59,123,255,.45);}",
        ".dww-flow-canvas.dww-edging .dww-conn-dot.dww-conn-n{transform:translateX(-50%) scale(1);}",
        ".dww-flow-canvas.dww-edging .dww-conn-dot.dww-conn-s{transform:translateX(-50%) scale(1);}",
        ".dww-flow-canvas.dww-edging .dww-conn-dot.dww-conn-e{transform:translateY(-50%) scale(1);}",
        ".dww-flow-canvas.dww-edging .dww-conn-dot.dww-conn-w{transform:translateY(-50%) scale(1);}",
        // the midpoint currently locked on: solid green ring (transform is direction-aware)
        ".dww-conn-dot.dww-snap{opacity:1!important;background:#2fa96b!important;border-color:#fff!important;box-shadow:0 0 0 4px rgba(47,169,107,.38),0 1px 3px rgba(20,30,50,.3)!important;}",
        ".dww-conn-dot.dww-conn-n.dww-snap,.dww-conn-dot.dww-conn-s.dww-snap{transform:translateX(-50%) scale(1.5)!important;}",
        ".dww-conn-dot.dww-conn-e.dww-snap,.dww-conn-dot.dww-conn-w.dww-snap{transform:translateY(-50%) scale(1.5)!important;}",
        ".dww-edge-sel .dww-edge-path{stroke:rgba(59,123,255,.95)!important;stroke-width:2.5!important;}",
        ".dww-edge-path.dww-edge-hover{stroke:#3b7bff!important;stroke-width:2.5!important;cursor:pointer;}",
        // WPS-style delete badge (top-right ×, appears on hover/select)
        ".dww-node-del{position:absolute;top:-9px;right:-9px;width:18px;height:18px;border-radius:50%;background:#e5484d;color:#fff;border:2px solid #fff;cursor:pointer;font-size:13px;line-height:1;padding:0;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.35);z-index:6;opacity:0;transform:scale(.6);transition:opacity .15s,transform .15s,background .15s;}",
        ".dww-node:hover .dww-node-del,.dww-node.dww-sel .dww-node-del{opacity:1;transform:scale(1);}",
        ".dww-node-del:hover{background:#c9302c;transform:scale(1.15);}",
        ".dww-edge-del{position:absolute;width:18px;height:18px;border-radius:50%;background:var(--danger,#e5484d);color:#fff;border:none;cursor:pointer;font-size:11px;line-height:1;display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);box-shadow:0 2px 6px rgba(0,0,0,.5);}",
        // shape variants: shapes are drawn as SVG background; pad the text into the silhouette
        ".dww-node .dww-node-body{padding:1px 7px;}",
        ".dww-node[data-shape=\"oval\"] .dww-node-body{padding:2px 20px;}",
        ".dww-node[data-shape=\"diamond\"] .dww-node-body{padding:5px 27px;}",
        ".dww-node[data-shape=\"parallelogram\"] .dww-node-body{padding:2px 14px 2px 30px;}",
        ".dww-node[data-shape=\"hexagon\"] .dww-node-body{padding:2px 20px;}",
        ".dww-node[data-shape=\"triangle\"] .dww-node-body{padding:10px 33px 0;}",
        ".dww-node[data-shape=\"pentagon\"] .dww-node-body{padding:5px 24px;}",
        ".dww-node[data-shape=\"cylinder\"] .dww-node-body{padding:5px 25px;}",
        ".dww-node[data-shape=\"document\"] .dww-node-body{padding:2px 12px;}",
        // done-check badge: floats at the TOP-LEFT of the shape, only on hover/select
        ".dww-node-chk{position:absolute;top:-9px;left:-9px;width:18px;height:18px;border-radius:50%;background:#ffffff;border:2px solid rgba(40,45,60,.35);color:transparent;cursor:pointer;font-size:11px;line-height:1;padding:0;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.28);z-index:6;opacity:0;transform:scale(.6);transition:opacity .15s,transform .15s,background .15s,border-color .15s,color .15s;}",
        ".dww-node:hover .dww-node-chk,.dww-node.dww-sel .dww-node-chk{opacity:1;transform:scale(1);}",
        ".dww-node-chk:hover{transform:scale(1.15);border-color:#2fa96b;}",
        ".dww-node-chk.dww-autock{border-style:dashed;cursor:default;}",
        ".dww-node.dww-done .dww-node-chk{background:#2fa96b;border-color:#2fa96b;color:#fff;}",
        ".dww-node.dww-done .dww-node-chk::after{content:\"\\2713\";}",
        // v0.13.0: due-date strip. It lives OUTSIDE the shape (top:100%) and is absolutely
        // positioned, so the card keeps its exact 128x40 geometry — every connector dot and
        // edge path is computed from NODE_W x NODE_H and must not shift by a single pixel.
        ".dww-node-date{position:absolute;top:100%;left:0;right:0;margin-top:4px;display:flex;justify-content:center;z-index:5;pointer-events:none;}",
        ".dww-date-chip{pointer-events:auto;max-width:100%;border:1px solid transparent;border-radius:99px;padding:1px 7px;font-size:10px;line-height:1.5;font-family:inherit;font-weight:700;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 1px 3px rgba(20,30,50,.16);transition:opacity .15s,filter .15s,transform .15s;font-variant-numeric:tabular-nums;}",
        ".dww-date-chip:hover{filter:brightness(.96);transform:translateY(-1px);}",
        ".dww-date-chip.dww-date-empty{opacity:.42;font-weight:600;}",
        ".dww-node:hover .dww-date-chip.dww-date-empty{opacity:.95;}",
        ".dww-date-input{pointer-events:auto;width:118px;border:1px solid rgba(59,123,255,.7);border-radius:6px;background:#fff;color:#2b3040;font-size:10px;font-family:inherit;padding:1px 3px;box-shadow:0 2px 8px rgba(20,30,50,.2);}",
        ".dww-date-input:focus{outline:none;box-shadow:0 0 0 2px rgba(59,123,255,.35);}",
        ".dww-node.dww-done .dww-node-date{opacity:.5;}",
        // toolbar row for the deadline
        ".dww-tb-due{font-size:10px;font-family:inherit;border:1px solid rgba(30,40,60,.25);border-radius:6px;padding:2px 4px;background:#fff;color:#2b3040;height:22px;}",
        ".dww-tb-mini{font-size:10px;border:1px solid rgba(30,40,60,.22);background:#fff;color:#3a4a66;border-radius:99px;padding:2px 7px;cursor:pointer;font-family:inherit;line-height:1.3;}",
        ".dww-tb-mini:hover{background:rgba(59,123,255,.14);border-color:rgba(59,123,255,.5);}",
        ".dww-flow-due{font-size:11px;font-weight:800;padding:1px 7px;border-radius:99px;font-variant-numeric:tabular-nums;white-space:nowrap;}",
        // floating format toolbar (appears on node selection) — WPS-style shape/color controls
        // v0.15.0: absolute (not fixed) so the toolbar is anchored to the floating
        // window's top-right corner instead of the browser viewport.
        ".dww-flow-toolbar{position:absolute;top:64px;right:16px;z-index:2147483600;display:flex;flex-direction:column;gap:6px;padding:9px 10px;background:#ffffff;border:1px solid rgba(30,40,60,.18);border-radius:12px;box-shadow:0 10px 30px rgba(20,30,50,.24);color:#2b3040;font-size:12px;font-family:inherit;max-width:280px;}",
        ".dww-tb-label{font-size:10px;font-weight:800;color:rgba(60,70,90,.55);letter-spacing:.6px;padding:0 2px;}",
        ".dww-tb-row{display:flex;align-items:center;gap:4px;flex-wrap:wrap;}",
        ".dww-flow-toolbar .dww-tb-shape button{width:26px;height:26px;border:1px solid transparent;background:transparent;color:#3a4a66;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:2px;}",
        ".dww-flow-toolbar .dww-tb-shape button:hover{background:rgba(59,123,255,.14);}",
        ".dww-flow-toolbar .dww-tb-shape button.dww-on{background:linear-gradient(135deg,#3b7bff,#22c7c0);}",
        ".dww-flow-toolbar .dww-tb-shape button svg{width:100%;height:100%;pointer-events:none;}",
        ".dww-tb-swatch{width:20px;height:20px;border-radius:5px;border:1px solid rgba(30,40,60,.25);cursor:pointer;flex:0 0 auto;padding:0;}",
        ".dww-tb-swatch.dww-on{outline:2px solid #3b7bff;outline-offset:1px;}",
        ".dww-tb-custom{width:24px;height:20px;border:none;background:none;cursor:pointer;padding:0;flex:0 0 auto;}",
        // drag-preview (the ghost shape following cursor during a drop)
        ".dww-drop-ghost{position:fixed;width:128px;height:40px;opacity:.85;pointer-events:none;z-index:2147483600;display:flex;align-items:center;justify-content:center;font-size:12px;color:#3a4a66;}",
        ".dww-drop-ghost svg{width:100%;height:100%;filter:drop-shadow(0 4px 12px rgba(20,30,50,.3));}",
        ".dww-canvas-ghost{position:absolute;width:128px;height:40px;opacity:.45;pointer-events:none;border:2px dashed rgba(120,180,255,.7);border-radius:8px;display:flex;align-items:center;justify-content:center;color:rgba(59,123,255,.9);font-size:22px;font-weight:700;font-family:sans-serif;}",
        ".dww-canvas-ghost.dww-canvas-ghost-insert{border-color:rgba(232,180,30,.95);background:rgba(255,247,200,.5);color:rgba(180,120,0,.95);}",
        // calendar: one big paper sheet wrapping the month grid
        ".dww-cal-note{padding:11px 12px 13px 14px;}",
        ".dww-cal-note .dww-cal-ym{color:#1f2531;font-weight:800;}",
        ".dww-cal-note .dww-cal-wd{color:rgba(45,50,66,.6);}",
        ".dww-cal-note .dww-cal-cell{color:#2b3040;}",
        ".dww-cal-note .dww-cal-cell:hover{background:rgba(45,50,66,.1);border-color:rgba(45,50,66,.2);}",
        ".dww-cal-note .dww-cal-empty{color:transparent;}",
        ".dww-cal-note .dww-cal-sel{color:rgba(45,50,66,.7);}",
        ".dww-cal-note .dww-cal-edit{border-top-color:rgba(45,50,66,.2);}",
        ".dww-cal-note .dww-cal-ta:focus{accent-color:#2b6cff;}",
        // ---------- resize affordances (v0.6.0: bigger corner + bottom grip) ----------
        // Bigger bottom-right corner handle; revealed & emphasized on hover/focus.
        ".dww-resize{",
        "  position:absolute;right:3px;bottom:3px;",
        "  width:26px;height:26px;",
        "  cursor:nwse-resize;opacity:.45;",
        "  border-radius:9px;",
        "  transition:opacity .16s,background .16s;",
        "  z-index:3;",
        "}",
        ".dww-resize::after{",
        "  content:'';position:absolute;right:6px;bottom:6px;",
        "  width:9px;height:9px;",
        "  border-right:2.5px solid var(--grip);border-bottom:2.5px solid var(--grip);",
        "  border-bottom-right-radius:4px;",
        "  filter:drop-shadow(0 1px 2px rgba(0,0,0,.35));",
        "}",
        ".dww-root:hover .dww-resize{opacity:.9;}",
        ".dww-resize:hover{opacity:1;background:var(--hover);}",
        ".dww-resize:hover::after{border-color:var(--accent);}",
        // Bottom-centre grip: grab & drag straight down/up to change the card HEIGHT.
        // Fully covered by the faint glass pill so it reads as a resize handle on
        // an otherwise transparent card.
        ".dww-egrip{",
        "  position:absolute;left:50%;bottom:10px;",
        "  transform:translateX(-50%);",
        "  width:62px;height:8px;",
        "  display:flex;align-items:center;justify-content:center;gap:4px;",
        "  background:var(--card);",
        "  border:1px solid var(--border);",
        "  border-radius:99px;",
        "  cursor:ns-resize;opacity:.5;",
        "  transition:opacity .16s,background .16s;",
        "  z-index:3;",
        "  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);",
        "  box-shadow:0 3px 10px rgba(0,0,0,.22);",
        "}",
        ".dww-egrip i{display:block;width:2.5px;height:8px;border-radius:2px;background:var(--grip);opacity:.9;}",
        ".dww-root:hover .dww-egrip{opacity:.95;}",
        ".dww-egrip:hover{opacity:1;background:var(--hover);}",
        ".dww-egrip:hover i{background:var(--accent);}",
        ".dww-egrip:active{cursor:ns-resize;background:var(--accent);}",
        ".dww-egrip:active i{background:#fff;}",
        // Floating draggable launcher (悬浮模式：可拖动到任意位置)
        ".dww-launcher{",
        "  position:fixed;",
        "  z-index:2147483001;",
        "  padding:11px 18px;",
        "  border:1px solid rgba(255,255,255,.28);",
        "  border-radius:999px;",
        "  cursor:grab;",
        "  background:linear-gradient(135deg,#3b7bff,#22c7c0);",
        "  color:#fff;",
        "  font:700 13px 'Microsoft YaHei',system-ui,sans-serif;",
        "  display:flex;",
        "  align-items:center;",
        "  gap:8px;",
        "  box-shadow:0 10px 28px rgba(43,108,255,.50),inset 0 1px 0 rgba(255,255,255,.40);",
        "  -webkit-backdrop-filter:blur(12px) saturate(140%);",
        "  backdrop-filter:blur(12px) saturate(140%);",
        "  user-select:none;",
        "  touch-action:none;",
        "  letter-spacing:.4px;",
        "  transition:transform .16s,box-shadow .16s,filter .16s;",
        "}",
        ".dww-launcher:hover{transform:scale(1.06);box-shadow:0 14px 34px rgba(43,108,255,.62),inset 0 1px 0 rgba(255,255,255,.5);}",
        ".dww-launcher:active{cursor:grabbing;transform:scale(0.96);}",
        ".dww-launcher.dww-dragging{cursor:grabbing;transform:scale(1.1);box-shadow:0 16px 40px rgba(43,108,255,.72),inset 0 1px 0 rgba(255,255,255,.5);}",
        // dimmed / desaturated when the three cards are collapsed
        ".dww-launcher:not(.dww-active){",
        "  background:linear-gradient(135deg,#5b6478,#7d869a);",
        "  box-shadow:0 6px 18px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.16);",
        "  border-color:rgba(255,255,255,.14);",
        "}",
        ".dww-launcher:not(.dww-active):hover{box-shadow:0 10px 24px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.2);}",
        ".dww-launcher-icon{font-size:16px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25));}",
        ".dww-launcher-text{letter-spacing:.4px;}"
      ].join("\n");
      document.head.appendChild(s);
    }

    // ---------- drag ----------
    function enableDrag(root, handle, getPos, setPos) {
      handle.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".dww-btn, .dww-resize, input, textarea")) return;
        e.preventDefault();
        try { handle.setPointerCapture(e.pointerId); } catch (err) {}
        const sx = e.clientX, sy = e.clientY;
        const ox = root.offsetLeft, oy = root.offsetTop;
        const onMove = (ev) => {
          let nx = ox + (ev.clientX - sx);
          let ny = oy + (ev.clientY - sy);
          nx = Math.max(0, Math.min(nx, window.innerWidth - root.offsetWidth));
          ny = Math.max(0, Math.min(ny, window.innerHeight - 40));
          root.style.left = nx + "px";
          root.style.top = ny + "px";
          root.style.right = "auto";
        };
        const onUp = () => {
          try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
          handle.removeEventListener("pointermove", onMove);
          handle.removeEventListener("pointerup", onUp);
          handle.removeEventListener("pointercancel", onUp);
          setPos({ left: root.offsetLeft, top: root.offsetTop });
        };
        handle.addEventListener("pointermove", onMove);
        handle.addEventListener("pointerup", onUp);
        handle.addEventListener("pointercancel", onUp);
      });
    }

    // ---------- resize (bottom-right corner: width + height) ----------
    function enableResize(root, handle, getSize, setSize) {
      handle.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        try { handle.setPointerCapture(e.pointerId); } catch (err) {}
        const sx = e.clientX, sy = e.clientY;
        const startW = root.offsetWidth, startH = root.offsetHeight;
        const MIN_W = 240, MIN_H = 200;
        const MAX_W = Math.min(window.innerWidth - 20, 980);
        const MAX_H = Math.min(window.innerHeight - 20, 900);
        const onMove = (ev) => {
          const nw = Math.max(MIN_W, Math.min(MAX_W, startW + (ev.clientX - sx)));
          const nh = Math.max(MIN_H, Math.min(MAX_H, startH + (ev.clientY - sy)));
          root.style.width = nw + "px";
          root.style.height = nh + "px";
        };
        const onUp = () => {
          try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
          handle.removeEventListener("pointermove", onMove);
          handle.removeEventListener("pointerup", onUp);
          handle.removeEventListener("pointercancel", onUp);
          setSize({ w: root.offsetWidth, h: root.offsetHeight });
        };
        handle.addEventListener("pointermove", onMove);
        handle.addEventListener("pointerup", onUp);
        handle.addEventListener("pointercancel", onUp);
      });
    }

    // ---------- resize (bottom-centre grip: height only) ----------
    function enableVResize(root, handle, getSize, setSize) {
      handle.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        try { handle.setPointerCapture(e.pointerId); } catch (err) {}
        const sy = e.clientY;
        const startH = root.offsetHeight;
        const MIN_H = 200;
        const MAX_H = Math.min(window.innerHeight - 20, 900);
        const onMove = (ev) => {
          const nh = Math.max(MIN_H, Math.min(MAX_H, startH + (ev.clientY - sy)));
          root.style.height = nh + "px";
        };
        const onUp = () => {
          try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
          handle.removeEventListener("pointermove", onMove);
          handle.removeEventListener("pointerup", onUp);
          handle.removeEventListener("pointercancel", onUp);
          setSize({ w: root.offsetWidth, h: root.offsetHeight });
        };
        handle.addEventListener("pointermove", onMove);
        handle.addEventListener("pointerup", onUp);
        handle.addEventListener("pointercancel", onUp);
      });
    }

    // ---------- card shell ----------
    function makeCard(opts) {
      const posKey = "dw:" + opts.id + ":pos";
      const sizeKey = "dw:" + opts.id + ":size";
      let pos = lsGet(posKey, opts.defaultPos);
      if (!pos || typeof pos.left !== "number") pos = opts.defaultPos;
      let size = lsGet(sizeKey, { w: opts.width || 320, h: opts.defaultH || 360 });
      const root = el("div", { class: "dww-root", id: "dww-" + opts.id });
      root.style.left = pos.left + "px";
      root.style.top = pos.top + "px";
      if (size.w) root.style.width = size.w + "px";
      if (size.h) root.style.height = size.h + "px";
      const head = el("div", { class: "dww-head" }, [
        el("span", { class: "dww-title", text: opts.title }),
        el("button", { class: "dww-btn", title: "最小化", text: "–", onclick: (e) => { e.stopPropagation(); root.classList.toggle("dww-min"); } }),
        el("button", { class: "dww-btn", title: "关闭（隐藏本卡片）", text: "×", onclick: (e) => { e.stopPropagation(); hideCard(opts.id, root); } })
      ]);
      const body = el("div", { class: "dww-body" });
      const resize = el("div", { class: "dww-resize", title: "拖动右下角：同时调整宽高" });
      // bottom-centre grip: three thin bars, drag to change HEIGHT
      const egrip = el("div", { class: "dww-egrip", title: "上下拖动：调整卡片高度" }, [
        el("i"), el("i"), el("i")
      ]);
      root.append(head, body, resize, egrip);
      document.body.appendChild(root);
      enableDrag(root, head, () => pos, (p) => { pos = p; lsSet(posKey, p); });
      enableResize(root, resize, () => size, (s) => { size = s; lsSet(sizeKey, s); });
      enableVResize(root, egrip, () => size, (s) => { size = s; lsSet(sizeKey, s); });
      const hidden = lsGet("dw:hidden", {});
      if (hidden[opts.id]) root.classList.add("dww-hidden");
      return { root, body, id: opts.id };
    }
    function hideCard(id, root) {
      root.classList.add("dww-hidden");
      const hidden = lsGet("dw:hidden", {});
      hidden[id] = true;
      lsSet("dw:hidden", hidden);
    }

    // ---------- widget: 每日时间安排 (with countdown) ----------
    // ---- shared paper palette: tinted sheets cycle through 5 colours ----
    const NOTE_COLORS = [
      ["#ffe07a", "#ffd24a", "#e0a800"],
      ["#ffc6d2", "#ffa1b6", "#e0537a"],
      ["#c4e2ff", "#95c9ff", "#3d8ae0"],
      ["#caf0da", "#a0e3be", "#2fa96b"],
      ["#e0d3ff", "#c5b0ff", "#7a5ae0"]
    ];
    const NOTE_TILT = [-0.7, 0.5, -0.4, 0.8, -0.6];
    // (Roll-up stats live in goalsBody() as treeStat() — see below.)

    function scheduleBody() {
      const KEY = "dw:schedule:data";
      const CD_KEY = "dw:countdown:data";
      let items = lsGet(KEY, []);
      if (!Array.isArray(items)) items = [];
      // v0.13.0 migration: every item gets an id; pre-existing rows get kind="daily"
      // so they keep showing every day (no silent schedule loss).
      let migrated = false;
      items.forEach((it) => {
        if (!it.id) { it.id = uid(); migrated = true; }
        if (!it.kind) { it.kind = "daily"; migrated = true; }
      });
      // first-time seed: when the user has NEVER set up a routine, drop in a
      // minimal day template so the card is useful immediately. A SEEDED flag
      // prevents us from re-adding on every boot.
      const SEED_KEY = "dw:schedule:seeded:v2";
      if (!lsGet(SEED_KEY, false) && items.length === 0) {
        items = [
          { id: uid(), time: "07:00", text: "起床 / 洗漱",       kind: "daily" },
          { id: uid(), time: "07:30", text: "早餐",               kind: "daily" },
          { id: uid(), time: "08:00", text: "工作 / 学习开始",    kind: "weekdays" },
          { id: uid(), time: "12:00", text: "午餐",               kind: "daily" },
          { id: uid(), time: "13:00", text: "午休",               kind: "daily" },
          { id: uid(), time: "18:00", text: "晚餐",               kind: "daily" },
          { id: uid(), time: "22:30", text: "睡前阅读",           kind: "daily" },
          { id: uid(), time: "23:00", text: "睡觉",               kind: "daily" }
        ];
        lsSet(SEED_KEY, true);
      }
      let countdowns = lsGet(CD_KEY, []);
      if (!Array.isArray(countdowns)) countdowns = [];
      const wrap = el("div");

      // Schedule list — each row supports a `kind` (周期) so the user only
      // types a routine ONCE and it keeps applying every day.
      const list = el("div", { class: "dww-list" });
      const persist = () => lsSet(KEY, items);
      const KIND_LABELS = { daily: "每天", weekdays: "工作日", weekends: "周末" };
      function isKindActiveToday(it) {
        if (it.kind === "once") return false; // one-off events shown only on the date set elsewhere
        if (it.kind === "daily") return true;
        const dow = new Date().getDay(); // 0=Sun .. 6=Sat
        if (it.kind === "weekdays") return dow >= 1 && dow <= 5;
        if (it.kind === "weekends") return dow === 0 || dow === 6;
        return true;
      }
      function render() {
        list.innerHTML = "";
        // group: today's routine first (sorted by time), then every other routine row
        // for transparency (the user can still see what is "off today").
        const todays = items.filter(isKindActiveToday).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
        const others = items.filter((it) => !isKindActiveToday(it)).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
        const sorted = todays.concat(others);
        if (sorted.length === 0) list.appendChild(el("div", { class: "dww-empty", text: "暂无安排。点下方「+ 添加安排」规划你的一天吧。" }));
        sorted.forEach((it, i) => {
          const inactive = !isKindActiveToday(it);
          // v0.16.1 layout: TASK on the LEFT, TIME RANGE on the RIGHT.
          // Left column: the task input (top) + kind dropdown (bottom).
          // Right column: start time (top) + end time (bottom), stacked.
          const kindSel = (function () {
            const sel = el("select", { class: "dww-kind", title: "周期：决定这条安排哪一天生效", onchange: (e) => { it.kind = e.target.value; persist(); render(); } });
            ["daily", "weekdays", "weekends"].forEach((k) => {
              const opt = el("option", { value: k, text: KIND_LABELS[k] });
              if (it.kind === k) opt.selected = true;
              sel.appendChild(opt);
            });
            return sel;
          })();
          const timeCol = el("div", { class: "dww-sch-time" }, [
            el("input", { class: "dww-time", type: "time", title: "开始时间", value: it.time || "", onchange: (e) => { it.time = e.target.value; persist(); render(); } }),
            el("i", { class: "dww-sch-sep", text: "↓" }),
            el("input", { class: "dww-time", type: "time", title: "结束时间（可留空）", value: it.endTime || "", onchange: (e) => { it.endTime = e.target.value; persist(); } })
          ]);
          const row = el("div", { class: "dww-sch-row dww-paper" + (inactive ? " dww-off" : "") }, [
            el("div", { class: "dww-sch-main" }, [
              el("input", { class: "dww-text", type: "text", placeholder: "事项", value: it.text || "", oninput: (e) => { it.text = e.target.value; persist(); } }),
              el("div", { class: "dww-sch-meta" }, [kindSel])
            ]),
            timeCol,
            el("button", { class: "dww-x", title: "删除", text: "×", onclick: () => { items = items.filter((x) => x !== it); persist(); render(); } })
          ]);
          const pal = NOTE_COLORS[i % NOTE_COLORS.length];
          row.style.setProperty("--na", pal[0]);
          row.style.setProperty("--nb", pal[1]);
          row.style.setProperty("--nc", pal[2]);
          row.style.setProperty("--nr", NOTE_TILT[i % NOTE_TILT.length] + "deg");
          list.appendChild(row);
        });
      }
      render();
      wrap.append(list, el("button", { class: "dww-add", text: "+ 添加安排", onclick: () => { items.push({ id: uid(), time: "", endTime: "", text: "", kind: "daily" }); persist(); render(); } }));

      // Countdown section
      const cdWrap = el("div", { class: "dww-section" });
      cdWrap.appendChild(el("div", { class: "dww-section-h", text: "⏳ 倒计时" }));
      const cdList = el("div", { class: "dww-notes" });
      const cdPersist = () => lsSet(CD_KEY, countdowns);

      function fmtRemain(ms) {
        if (ms <= 0) return { text: "已到达", past: true };
        const sec = Math.floor(ms / 1000);
        const d = Math.floor(sec / 86400);
        const h = Math.floor((sec % 86400) / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        const pad = (n) => String(n).padStart(2, "0");
        let out = "";
        if (d > 0) out += d + " 天 ";
        out += pad(h) + " : " + pad(m) + " : " + pad(s);
        return { text: out, past: false };
      }

      const pad2 = (n) => String(n).padStart(2, "0");

      // Renders one countdown as a sticky note: title, big day count and a
      // small h:m:s line, plus a quiet datetime field for the target date.
      function renderCD() {
        cdList.innerHTML = "";
        if (countdowns.length === 0) {
          cdList.appendChild(el("div", { class: "dww-empty", text: "暂无便签。点下方「+ 添加便签」标记重要日期。" }));
        }
        countdowns.forEach((c, idx) => {
          const note = el("div", { class: "dww-note" });
          const days = el("div", { class: "dww-note-days" });
          const unit = el("span", { class: "dww-note-unit", text: "天" });
          const hms = el("div", { class: "dww-note-hms" });

          function tick() {
            const tgt = c.t ? new Date(c.t).getTime() : 0;
            const rem = tgt - Date.now();
            const r = fmtRemain(rem);
            if (r.past) {
              days.textContent = "0";
              unit.textContent = "已到达";
              hms.textContent = c.t ? "目标：" + c.t.replace("T", " ") : "未设置日期";
              note.classList.add("dww-past");
              return;
            }
            const sec = Math.floor(rem / 1000);
            const d = Math.floor(sec / 86400);
            days.textContent = String(d);
            unit.textContent = "天";
            hms.textContent =
              pad2(Math.floor((sec % 86400) / 3600)) + " : " +
              pad2(Math.floor((sec % 3600) / 60)) + " : " +
              pad2(sec % 60);
            note.classList.remove("dww-past");
          }
          tick();

          // paper colour + tilt for this note
          const pal = NOTE_COLORS[idx % NOTE_COLORS.length];
          note.style.setProperty("--na", pal[0]);
          note.style.setProperty("--nb", pal[1]);
          note.style.setProperty("--nc", pal[2]);
          note.style.setProperty("--nr", NOTE_TILT[idx % NOTE_TILT.length] + "deg");

          note.append(
            el("div", { class: "dww-note-top" }, [
              el("input", {
                class: "dww-note-title", type: "text",
                placeholder: "目标（如：考研）", value: c.title || "",
                oninput: (e) => { c.title = e.target.value; cdPersist(); }
              }),
              el("button", {
                class: "dww-note-x", title: "删除", text: "×",
                onclick: () => { countdowns = countdowns.filter((x) => x !== c); cdPersist(); renderCD(); }
              })
            ]),
            el("div", { class: "dww-note-main" }, [days, unit]),
            hms,
            el("input", {
              class: "dww-note-date", type: "datetime-local", value: c.t || "",
              onchange: (e) => { c.t = e.target.value; cdPersist(); tick(); }
            })
          );
          // expose tick() so the shared 1s interval can drive every note
          note.__tick = tick;
          cdList.appendChild(note);
        });
      }
      renderCD();
      cdWrap.append(cdList, el("button", { class: "dww-add", text: "+ 添加便签", onclick: () => {
        const def = new Date(Date.now() + 7 * 86400 * 1000);
        const defStr = def.getFullYear() + "-" + pad2(def.getMonth() + 1) + "-" + pad2(def.getDate()) + "T" + pad2(def.getHours()) + ":" + pad2(def.getMinutes());
        countdowns.push({ title: "", t: defStr });
        cdPersist(); renderCD();
      } }));
      wrap.appendChild(cdWrap);

      // Live tick — one shared interval refreshes every note's readout
      const tickInterval = setInterval(() => {
        const notes = cdList.querySelectorAll(".dww-note");
        notes.forEach((n) => { if (typeof n.__tick === "function") n.__tick(); });
      }, 1000);

      // Cleanup if card is destroyed
      wrap._cleanup = () => clearInterval(tickInterval);

      return wrap;
    }

    // ---------- widget: 目标设置 ----------
    function goalsBody() {
      const KEY = "dw:goals:data";
      let items = lsGet(KEY, []);
      if (!Array.isArray(items)) items = [];
      const wrap = el("div");
      const list = el("div", { class: "dww-list dww-goal-list" });
      // v0.11.0 FIX: paint()/layout() tag live nodes with transient render fields
      // (_parentRef, _x, _y, _idx) directly on the SAME objects that live inside
      // `items`. _parentRef is a circular back-reference, so JSON.stringify(items)
      // used to throw and lsSet()'s empty catch silently dropped EVERY save after
      // the first render — grandchild additions never reached localStorage.
      // persist() now serializes a CLEANED deep-clone that drops render-only
      // fields but keeps the persisted _manual drag position.
      // cleanTree serializes the flow tree for localStorage. v0.12.0 uses a FLAT
// children list (no nesting) — every non-root node is a sibling at the top
// level, regardless of connection depth. Edges carry the hierarchy.
      function cleanTree(node) {
        return {
          id: node.id, text: node.text, done: node.done,
          shape: node.shape || "rect",
          fill: node.fill, stroke: node.stroke,
          date: node.date || "",
          children: (node.children || []).map(cleanSubNode),
          edges: Array.isArray(node.edges) ? node.edges.map((e) => ({ from: e.from, to: e.to, fromDir: e.fromDir, toDir: e.toDir })) : [],
          ...(node._manual ? { _manual: { x: node._manual.x, y: node._manual.y } } : {})
        };
      }
      function cleanSubNode(c) {
        return {
          id: c.id, text: c.text, done: c.done, shape: c.shape || "rect",
          fill: c.fill, stroke: c.stroke,
          date: c.date || "",
          children: [], // FLAT — do not nest
          edges: [],
          ...(c._manual ? { _manual: { x: c._manual.x, y: c._manual.y } } : {})
        };
      }
      // Persist helper.
      const persist = () => lsSet(KEY, items.map((g) => {
        if (g.tree && typeof g.tree === "object") return Object.assign({}, g, { tree: cleanTree(g.tree) });
        return g;
      }));
      // aggregate a goal's sub-goal tree: count every descendant frame (root excluded).
      // v0.12.0 flat model: (node.children || []).map(c) counts every non-root node
      // once. Each sub-node has empty children (flat), so recursion stops correctly.
      function treeStat(node) {
        let total = 0, done = 0;
        (node.children || []).forEach((c) => { total++; if (c.done) done++; });
        return { total, done, pct: total ? Math.round(done / total * 100) : 0 };
      }
      function render() {
        list.innerHTML = "";
        if (items.length === 0) list.appendChild(el("div", { class: "dww-empty", text: "还没有目标。定一个，并标出完成进度。" }));
        items.forEach((g, i) => {
          g.done = !!g.done;
          const hasTree = !!(g.tree && g.tree.children && g.tree.children.length);
          const stat = hasTree ? treeStat(g.tree) : null;
          const pct = hasTree ? stat.pct : Math.max(0, Math.min(100, g.pct | 0));
          if (hasTree) g.done = stat.done === stat.total; // derived: all subs done
          // v0.16.4: STRIP layout — one goal = one compact row, maximum data in
          // minimum space: [check] [name] [progress data] [📊] [×].
          // No bar / blocks / foot row. The % is an editable field (type a
          // number); for tree goals it becomes a read-only 🌿n/m badge.
          const check = el("button", { class: "dww-check" + (hasTree ? " dww-autock" : ""), title: hasTree ? "全部子任务完成后自动勾选" : (g.done ? "取消完成" : "标记完成"), onclick: (e) => {
            if (hasTree) return;
            g.done = !g.done;
            if (g.tree) g.tree.done = g.done;
            row.classList.toggle("dww-done", g.done);
            e.currentTarget.title = g.done ? "取消完成" : "标记完成";
            row.classList.remove("dww-pop"); void row.offsetWidth; row.classList.add("dww-pop");
            persist();
          } });
          let pctCell;
          if (hasTree) {
            // v0.16.5: tree goals show the same percent readout as plain goals
            // (auto-computed); the n/m detail stays in the hover tooltip only.
            pctCell = el("span", { class: "dww-pct dww-pct-sum", title: "进度由子目标自动计算（" + stat.done + "/" + stat.total + " 已完成）", text: pct + "%" });
          } else {
            pctCell = el("input", {
              class: "dww-pct-edit", type: "text", inputmode: "numeric", title: "输入进度 0-100",
              value: pct + "%",
              onchange: (e) => {
                const n = parseInt(String(e.target.value).replace(/[^\d]/g, ""), 10);
                g.pct = isNaN(n) ? 0 : Math.max(0, Math.min(100, n));
                persist(); render();
              },
              onfocus: (e) => { e.target.select(); }
            });
          }
          const row = el("div", { class: "dww-goal dww-paper" + (hasTree ? " dww-goal-tree" : "") }, [
            check,
            el("input", { class: "dww-goal-title", type: "text", placeholder: "目标名称", value: g.title || "", oninput: (e) => { g.title = e.target.value; persist(); } }),
            pctCell,
            el("button", { class: "dww-flowbtn", text: "📊", title: "流程图（分解子目标）", onclick: () => openFlow(g, render) }),
            el("button", { class: "dww-x", title: "删除", text: "×", onclick: () => { items = items.filter((x) => x !== g); persist(); render(); } })
          ]);
          if (g.done) row.classList.add("dww-done");
          const pal = NOTE_COLORS[i % NOTE_COLORS.length];
          row.style.setProperty("--na", pal[0]);
          row.style.setProperty("--nb", pal[1]);
          row.style.setProperty("--nc", pal[2]);
          row.style.setProperty("--nr", NOTE_TILT[i % NOTE_TILT.length] + "deg");
          list.appendChild(row);
        });
      }
      function openFlow(g, rerender) {
        if (!g.tree || typeof g.tree !== "object") g.tree = { id: uid(), text: g.title || "主目标", done: g.done, shape: "rect", children: [], edges: [] };
        if (!Array.isArray(g.tree.edges)) g.tree.edges = [];
        if (!Array.isArray(g.tree.children)) g.tree.children = [];
        if (!g.tree.shape) g.tree.shape = "rect";
        // Migration: pre-v0.12.0 trees stored NESTED children (and possibly _loose).
        //   1) Convert _loose into flat children (orphans become top-level).
        //   2) If no edges yet but nested children present, derive edges by walking
        //      the old nested children. Then flatten: all non-root nodes go into
        //      root.children flat (deduped).
        if (Array.isArray(g.tree._loose) && g.tree._loose.length) {
          g.tree._loose.forEach((n) => { if (!g.tree.children.some((c) => c.id === n.id)) g.tree.children.push(n); });
          delete g.tree._loose;
        }
        if (g.tree.edges.length === 0 && g.tree.children.length > 0) {
          // derive edges from old nested children
          (function migrate(n) {
            (n.children || []).forEach((c) => { g.tree.edges.push({ from: n.id, to: c.id }); migrate(c); });
          })(g.tree);
          // flatten: gather every node (including root), then keep all NON-root as flat siblings
          const flat = [];
          (function visit(n) { flat.push(n); (n.children || []).forEach(visit); })(g.tree);
          g.tree.children = flat.filter((n) => n !== g.tree);
        }
        let cur = g, root = cur.tree;
        const overlay = el("div", { class: "dww-flow" });
        const titleEl = el("span", { class: "dww-flow-title", text: "🎯 " + (root.text || "主目标") + " · 流程图" });
        const back = el("button", { class: "dww-flow-back", text: "← 返回", onclick: () => closeFlow() });
        const hint = el("span", { class: "dww-flow-hint", text: "左库拖形状入画布 · 拖空白整体平移 · 节点边框圆点拖连线 · 选中可改形状/颜色/截止日期 · Delete 删" });
        const sumEl = el("span", { class: "dww-flow-sum" });
        const dueEl = el("span", { class: "dww-flow-due" }); // v0.13.0: closest deadline / overdue count
        const head = el("div", { class: "dww-flow-head" }, [back, titleEl, hint, sumEl, dueEl]);
        // v0.14.0: zoomable canvas — a scaled stage + an invisible spacer that defines the
        // scrollable bounds. All node/SVG coordinates stay in model space; only the stage
        // transform changes, so every pointer interaction must go through toModel().
        const zoomWrap = el("div", { class: "dww-flow-zoom" });
        const zOut = el("button", { class: "dww-zoom-out", text: "−", title: "缩小" });
        const zVal = el("span", { class: "dww-zoom-val", text: "100%", title: "点击恢复 100%" });
        const zIn = el("button", { class: "dww-zoom-in", text: "+", title: "放大" });
        zoomWrap.appendChild(zOut); zoomWrap.appendChild(zVal); zoomWrap.appendChild(zIn);
        zOut.addEventListener("click", () => applyZoom(zoom * 0.9));
        zIn.addEventListener("click", () => applyZoom(zoom * 1.1));
        zVal.addEventListener("click", () => applyZoom(1));
        head.appendChild(zoomWrap);
        const canvas = el("div", { class: "dww-flow-canvas" });
        const stage = el("div", { class: "dww-flow-stage" });
        const spacer = el("div", { class: "dww-flow-spacer" });
        canvas.appendChild(spacer);
        canvas.appendChild(stage);
        const side = el("div", { class: "dww-flow-side" });
        const palette = el("div", { class: "dww-flow-palette" });
        const bodyRow = el("div", { class: "dww-flow-body" }, [side, palette, canvas]);
        overlay.append(head, bodyRow);
        // ---------- v0.15.0: floating resizable window ----------
        // The editor used to be a hard fullscreen overlay. It is now a floating window:
        //   · drag any edge/corner (8 handles)  → resize  (min 560x400, clamped to viewport)
        //   · drag the head (title bar)         → move
        //   · ⛶ button / double-click the head  → maximize & restore
        // Geometry persists in localStorage and survives reopen / browser restart.
        const WIN_KEY = "schedule.flowWin";
        const WIN_MIN_W = 560, WIN_MIN_H = 400;
        let winGeo = (() => { try { const s = JSON.parse(localStorage.getItem(WIN_KEY) || "null"); return (s && typeof s === "object" && s) || {}; } catch (_) { return {}; } })();
        if (!Number.isFinite(winGeo.w) || !Number.isFinite(winGeo.h)) { winGeo.w = Math.round(innerWidth * 0.88); winGeo.h = Math.round(innerHeight * 0.88); }
        if (!Number.isFinite(winGeo.x) || !Number.isFinite(winGeo.y)) { winGeo.x = Math.max(0, Math.round((innerWidth - winGeo.w) / 2)); winGeo.y = Math.max(0, Math.round((innerHeight - winGeo.h) / 2)); }
        const clampWin = () => {
          winGeo.w = Math.max(WIN_MIN_W, Math.min(winGeo.w, innerWidth));
          winGeo.h = Math.max(WIN_MIN_H, Math.min(winGeo.h, innerHeight));
          winGeo.x = Math.max(-winGeo.w + 120, Math.min(winGeo.x, innerWidth - 120));
          winGeo.y = Math.max(0, Math.min(winGeo.y, innerHeight - 48));
        };
        const applyWin = () => {
          if (winGeo.max) {
            overlay.style.left = "0px"; overlay.style.top = "0px";
            overlay.style.width = innerWidth + "px"; overlay.style.height = innerHeight + "px";
            overlay.classList.add("dww-max");
          } else {
            clampWin();
            overlay.style.left = winGeo.x + "px"; overlay.style.top = winGeo.y + "px";
            overlay.style.width = winGeo.w + "px"; overlay.style.height = winGeo.h + "px";
            overlay.classList.remove("dww-max");
          }
        };
        const saveWin = () => { try { localStorage.setItem(WIN_KEY, JSON.stringify(winGeo)); } catch (_) {} };
        const backdrop = el("div", { class: "dww-flow-backdrop" });
        document.body.appendChild(backdrop);
        const maxBtn = el("button", { class: "dww-flow-maxbtn", text: winGeo.max ? "❐" : "⛶", title: winGeo.max ? "还原大小" : "最大化" });
        head.appendChild(maxBtn);
        const setMax = (on) => {
          if (on && !winGeo.max) { winGeo.rest = { x: winGeo.x, y: winGeo.y, w: winGeo.w, h: winGeo.h }; winGeo.max = true; }
          else if (!on && winGeo.max) {
            winGeo.max = false;
            if (winGeo.rest && Number.isFinite(winGeo.rest.w)) { winGeo.x = winGeo.rest.x; winGeo.y = winGeo.rest.y; winGeo.w = winGeo.rest.w; winGeo.h = winGeo.rest.h; }
          }
          maxBtn.textContent = winGeo.max ? "❐" : "⛶";
          maxBtn.title = winGeo.max ? "还原大小" : "最大化";
          applyWin(); saveWin();
        };
        maxBtn.addEventListener("click", (e) => { e.stopPropagation(); setMax(!winGeo.max); });
        // --- 8-direction resize (pointer capture on the overlay) ---
        const FH_DIRS = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
        FH_DIRS.forEach((d) => { const h = el("div", { class: "dww-fh dww-fh-" + d }); h.dataset.dir = d; overlay.appendChild(h); });
        let rs = null;
        overlay.addEventListener("pointerdown", (e) => {
          const h = e.target.closest ? e.target.closest(".dww-fh") : null;
          if (!h || winGeo.max) return;
          e.preventDefault(); e.stopPropagation();
          rs = { dir: h.dataset.dir, sx: e.clientX, sy: e.clientY, g: { x: winGeo.x, y: winGeo.y, w: winGeo.w, h: winGeo.h }, id: e.pointerId };
          try { overlay.setPointerCapture(e.pointerId); } catch (_) {}
        });
        overlay.addEventListener("pointermove", (e) => {
          if (!rs || e.pointerId !== rs.id) return;
          const dx = e.clientX - rs.sx, dy = e.clientY - rs.sy, d = rs.dir, g = rs.g;
          if (d.indexOf("e") >= 0) winGeo.w = g.w + dx;
          if (d.indexOf("s") >= 0) winGeo.h = g.h + dy;
          if (d.indexOf("w") >= 0) { winGeo.w = g.w - dx; winGeo.x = g.x + dx; }
          if (d.indexOf("n") >= 0) { winGeo.h = g.h - dy; winGeo.y = g.y + dy; }
          // dragging n/w below the minimum must anchor the OPPOSITE edge, not drift it
          if (winGeo.w < WIN_MIN_W && d.indexOf("w") >= 0) winGeo.x = g.x + g.w - WIN_MIN_W;
          if (winGeo.h < WIN_MIN_H && d.indexOf("n") >= 0) winGeo.y = g.y + g.h - WIN_MIN_H;
          clampWin(); applyWin();
        });
        const endResize = (e) => { if (!rs || e.pointerId !== rs.id) return; rs = null; saveWin(); };
        overlay.addEventListener("pointerup", endResize);
        overlay.addEventListener("pointercancel", endResize);
        // --- title-bar drag to move + double-click to maximize ---
        let mv = null;
        head.addEventListener("pointerdown", (e) => {
          if (winGeo.max) return;
          if (e.target.closest && e.target.closest("button,input,.dww-flow-zoom")) return;
          e.preventDefault();
          mv = { sx: e.clientX, sy: e.clientY, x: winGeo.x, y: winGeo.y, id: e.pointerId };
          try { head.setPointerCapture(e.pointerId); } catch (_) {}
        });
        head.addEventListener("pointermove", (e) => {
          if (!mv || e.pointerId !== mv.id) return;
          winGeo.x = mv.x + (e.clientX - mv.sx); winGeo.y = mv.y + (e.clientY - mv.sy);
          clampWin(); applyWin();
        });
        const endMove = (e) => { if (!mv || e.pointerId !== mv.id) return; mv = null; saveWin(); };
        head.addEventListener("pointerup", endMove);
        head.addEventListener("pointercancel", endMove);
        head.addEventListener("dblclick", (e) => {
          if (e.target.closest && e.target.closest("button,input,.dww-flow-zoom")) return;
          setMax(!winGeo.max);
        });
        // keep the window inside the viewport when the browser window changes
        const onWinResize = () => { clampWin(); applyWin(); };
        window.addEventListener("resize", onWinResize);
        applyWin();
        const expanded = new Set();
        expanded.add(root.id);
        let focusId = null;
        let selectedId = null;
        let selectedEdge = null; // index into root.edges
        let hoveredEdge = null;  // index into root.edges (for hover × delete)
        const NODE_W = 128, NODE_H = 40, GAP_X = 56, GAP_Y = 18, PAD = 30;
        let zoom = 1;            // v0.14.0: canvas zoom factor (0.3 … 2.5)
        let contentW = NODE_W + PAD, contentH = NODE_H + PAD; // v0.14.0: model bounds (set in drawEdges)
        // Snap radius for edge END points: a connection may only land on one of the four
        // side MIDPOINTS of a node. Releasing anywhere else — over the node body, a corner,
        // or empty canvas — creates NO edge.
        // NOTE: must stay BELOW NODE_H/2 (20) or the dead centre of a box would sit inside
        // the n/s capture circles and "drop anywhere on the node" would silently come back.
        // 16px = a ~32px-wide target around each midpoint, generous to aim at yet far from
        // the box centre (20px) and the corners (16.5px).
        const SNAP_R = 16;
        // ---------- shape catalog (WPS-style, SVG-rendered with fill + stroke) ----------
        // yellow monochrome theme (matches the screenshot): light cream fill + dark slate stroke
        const SHAPE_DEFS = {
          // ---- basic shapes (基础图形) ----
          text: { label: "文本", fill: "#ffffff", stroke: "#3a4a66", body: (f, s) => '<text x="64" y="26" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="' + s + '">T</text>' },
          folder: { label: "文件夹", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<path d="M2,10 h38 l8,6 h76 v18 a2,2 0 0 1 -2,2 h-118 a2,2 0 0 1 -2,-2 z" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          line: { label: "直线", fill: "none", stroke: "#5b6b7d", body: (f, s) => '<line x1="6" y1="34" x2="122" y2="6" stroke="' + s + '" stroke-width="2" stroke-linecap="round"/>' },
          rect: { label: "矩形", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<rect x="1.6" y="1.6" width="124.8" height="36.8" rx="6" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          oval: { label: "椭圆", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<ellipse cx="64" cy="20" rx="61" ry="18.4" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          triangle: { label: "三角形", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<polygon points="64,2.4 126.4,38.4 1.6,38.4" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          rtriangle: { label: "直角三角形", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<polygon points="2,38.4 126.4,38.4 2,2.4" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          diamond: { label: "菱形", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<polygon points="64,1.6 126.4,20 64,38.4 1.6,20" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          pentagon: { label: "五边形", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<polygon points="64,1.6 126.4,14 112,38.4 16,38.4 1.6,14" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          hexagon: { label: "六边形", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<polygon points="22,1.6 106,1.6 126.4,20 106,38.4 22,38.4 1.6,20" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          star: { label: "五角星", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<polygon points="64,3 76,30 122,30 84,49 96,76 64,58 32,76 44,49 6,30 52,30" transform="translate(0,-18) scale(0.6)" fill="' + f + '" stroke="' + s + '" stroke-width="2"/>' },
          cloud: { label: "云形", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<path d="M18,30 a10,10 0 0 1 6,-18 a14,14 0 0 1 26,2 a11,11 0 0 1 16,4 a12,12 0 0 1 -4,22 h-44 a10,10 0 0 1 -10,-10 z" transform="translate(2,-2)" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          bubble: { label: "对话气泡", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<path d="M8,8 a6,6 0 0 1 6,-6 h100 a6,6 0 0 1 6,6 v18 a6,6 0 0 1 -6,6 h-58 l-12,10 v-10 h-30 a6,6 0 0 1 -6,-6 z" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          arrowRight: { label: "右箭头", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<path d="M2,12 h80 v-8 l36,16 l-36,16 v-8 h-80 z" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          arrowLeft: { label: "左箭头", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<path d="M126,12 h-80 v-8 l-36,16 l36,16 v-8 h80 z" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          arrowUp: { label: "上箭头", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<path d="M52,38 v-76 h-8 l20,-36 l20,36 h-8 v76 z" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          arrowDown: { label: "下箭头", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<path d="M52,2 v76 h-8 l20,36 l20,-36 h-8 v-76 z" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          arrowBoth: { label: "双向箭头", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<path d="M36,20 h-30 l8,-12 l-22,12 l22,12 l-8,-12 h30 l-8,-12 l22,12 l-22,12 z" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          brace: { label: "大括号", fill: "none", stroke: "#5b6b7d", body: (f, s) => '<path d="M52,2 v14 a8,8 0 0 1 -8,8 v6 a8,8 0 0 1 8,8 v14 m0,-50 v14 a8,8 0 0 0 8,8 v6 a8,8 0 0 0 -8,8 v14" fill="none" stroke="' + s + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' },
          code: { label: "代码", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<rect x="2" y="6" width="124" height="28" rx="4" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/><text x="64" y="26" text-anchor="middle" font-family="monospace" font-size="14" font-weight="700" fill="' + s + '">&lt;/&gt;</text>' },
          // ---- flowchart (流程图) ----
          f_rect: { label: "流程", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<rect x="1.6" y="1.6" width="124.8" height="36.8" rx="4" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          f_rounded: { label: "圆角矩形", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<rect x="2" y="1.6" width="124" height="36.8" rx="14" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          f_oval: { label: "起止", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<ellipse cx="64" cy="20" rx="61" ry="18.4" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          f_diamond: { label: "判断", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<polygon points="64,1.6 126.4,20 64,38.4 1.6,20" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          f_parallelogram: { label: "输入/输出", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<polygon points="24,1.6 126.4,1.6 104,38.4 1.6,38.4" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          f_hexagon: { label: "准备", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<polygon points="22,1.6 106,1.6 126.4,20 106,38.4 22,38.4 1.6,20" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          f_cylinder: { label: "存储", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<path d="M20,12 a44,8 0 0 0 88,0 v16 a44,8 0 0 1 -88,0 z" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/><ellipse cx="64" cy="12" rx="44" ry="8" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' },
          f_document: { label: "文档", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<path d="M2,1.6 h84 l40,14 v22.8 h-124 z" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/><path d="M86,1.6 l40,14 h-40 z" fill="' + s + '" fill-opacity=".22" stroke="' + s + '" stroke-width="1"/>' },
          f_pentagon: { label: "五边形", fill: "#fff5b8", stroke: "#5b6b7d", body: (f, s) => '<polygon points="64,1.6 126.4,14 112,38.4 16,38.4 1.6,14" fill="' + f + '" stroke="' + s + '" stroke-width="1.6"/>' }
        };
        // shape groups for the palette (each renders as its own collapsible section)
        const SHAPE_GROUPS = [
          { id: "basic", label: "基础图形", items: ["text","folder","line","rect","oval","triangle","rtriangle","diamond","pentagon","hexagon","star","cloud","bubble","arrowRight","arrowLeft","arrowUp","arrowDown","arrowBoth","brace","code"] },
          { id: "flow", label: "Flowchart 流程图", items: ["f_rect","f_rounded","f_oval","f_diamond","f_parallelogram","f_hexagon","f_pentagon","f_cylinder","f_document"] }
        ];
        const SHAPES = Object.keys(SHAPE_DEFS).map((id) => ({ id: id, label: SHAPE_DEFS[id].label }));
        const FILL_COLORS = ["#ffffff", "#fff5b8", "#fffae6", "#fff0dd", "#e6f7ef", "#e8f1ff", "#ffe9e9", "#f7e9ff", "#eef0ff", "#f2f4f8"];
        const STROKE_COLORS = ["#5b6b7d", "#3b7bff", "#e8b41e", "#0fb5a5", "#e58037", "#9b5ac8", "#e5484d", "#2b3040", "#6e87cd", "#8a94a6"];
        // full SVG data-URI used as the node background (fill + stroke parameterized)
        function nodeBg(shape, fill, stroke) {
          const def = SHAPE_DEFS[shape] || SHAPE_DEFS.rect;
          const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 40" preserveAspectRatio="none">' + def.body(fill || def.fill, stroke || def.stroke) + '</svg>';
          return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")';
        }
        // small palette preview (default colors)
        function paletteSvg(shape) {
          const def = SHAPE_DEFS[shape] || SHAPE_DEFS.rect;
          return '<svg viewBox="0 0 128 40" xmlns="http://www.w3.org/2000/svg">' + def.body(def.fill, def.stroke) + '</svg>';
        }
        // ---------- tree helpers ----------
        // FLAT model (v0.12.0 final):
        //   root.children = flat array of EVERY non-root node (orphans + connected, all levels).
        //   root.edges   = parent->child relations used for: connector lines, childrenOf(),
        //                  buildSide nested tree, and auto-layout anchoring.
        //   A node's own .children stays [] — we do NOT nest nodes. treeStat(root)
        //                  counts flat children, which equals total sub-nodes (correct).
        // This removes the v0.11.x dual-registry (_loose vs children) bug entirely.
        function ensureShape() {
          if (!Array.isArray(root.children)) root.children = [];
          if (!Array.isArray(root.edges)) root.edges = [];
        }
        function walkAll(fn) {
          fn(root, null);
          (root.children || []).forEach((c) => fn(c, null));
        }
        function childrenOf(n) {
          const out = [];
          root.edges.forEach((e) => { if (e.from === n.id) { const c = findNode(e.to); if (c) out.push(c); } });
          return out;
        }
        function findNode(id) {
          if (root.id === id) return root;
          for (let i = 0; i < (root.children || []).length; i++) if (root.children[i].id === id) return root.children[i];
          return null;
        }
        // WPS-style: delete a node and all edges touching it (root is protected)
        function removeNode(id) {
          if (id === root.id) return false;
          const target = findNode(id);
          if (!target) return false;
          root.edges = root.edges.filter((x) => x.from !== id && x.to !== id);
          root.children = root.children.filter((n) => n !== target);
          ensureShape();
          if (selectedId === id) selectedId = null;
          if (selectedEdge !== null && !root.edges[selectedEdge]) selectedEdge = null;
          persist();
          paint();
          buildSide();
          return true;
        }
        // ---------- sync root done (unchanged semantically) ----------
        function syncRootDone(updateDom) {
          const s = treeStat(root);
          if (s.total === 0) { g.done = root.done; return; }
          const allDone = s.done === s.total;
          if (root.done !== allDone || g.done !== allDone) { root.done = allDone; g.done = allDone; persist(); }
          if (updateDom) {
            const rc = canvas.querySelector('[data-nid="' + root.id + '"]');
            if (rc) { rc.classList.toggle("dww-done", root.done); const c = rc.querySelector(".dww-check"); if (c) c.title = "全部子任务完成后自动勾选"; }
          }
        }
        function switchTo(g2) {
          if (!g2.tree || typeof g2.tree !== "object") g2.tree = { id: uid(), text: g2.title || "主目标", done: g2.done, shape: "rect", children: [], edges: [] };
          if (!Array.isArray(g2.tree.edges)) g2.tree.edges = [];
          if (!Array.isArray(g2.tree.children)) g2.tree.children = [];
          cur = g2; root = cur.tree;
          titleEl.textContent = "🎯 " + (root.text || "主目标") + " · 流程图";
          expanded.add(root.id);
          selectedId = null; selectedEdge = null;
          ensureShape();
          buildPalette(); buildSide(); paint();
        }
        // ---------- side column (SolidWorks tree, unchanged) ----------
        function buildSide() {
          side.innerHTML = "";
          side.appendChild(el("div", { class: "dww-flow-side-h", text: "🗂 全部项目树" }));
          const renderNode = (n, depth, container) => {
            const ch = childrenOf(n);
            if (!ch.length) return;
            ch.forEach((c) => {
              const hasKids = childrenOf(c).length > 0;
              const isOpen = expanded.has(c.id);
              const row = el("div", { class: "dww-side-row" + (hasKids ? " dww-side-row-branch" : " dww-side-row-leaf") + (c.done ? " dww-done" : "") + (c.id === selectedId ? " dww-cur" : ""), style: { paddingLeft: (8 + depth * 14) + "px" } });
              const tw = el("span", { class: "dww-side-tw", text: hasKids ? (isOpen ? "▾" : "▸") : "·" });
              const ic = el("span", { class: "dww-side-ic", text: c.done ? "✓" : "○" });
              const nm = el("span", { class: "dww-side-nm", text: c.text || "（未命名）", title: c.text || "（未命名）" });
              row.append(tw, ic, nm);
              if (hasKids) {
                const cs = treeStat(c);
                row.appendChild(el("span", { class: "dww-side-bd", text: cs.done + "/" + cs.total }));
                const toggle = () => { if (expanded.has(c.id)) expanded.delete(c.id); else expanded.add(c.id); buildSide(); };
                const focus = () => { selectedId = c.id; selectedEdge = null; ensureNodeVisible(c); paint(); buildSide(); };
                tw.addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
                nm.addEventListener("click", (e) => { e.stopPropagation(); focus(); });
              } else {
                const focus = () => { selectedId = c.id; selectedEdge = null; ensureNodeVisible(c); paint(); buildSide(); };
                nm.addEventListener("click", (e) => { e.stopPropagation(); focus(); });
              }
              row.addEventListener("click", (e) => { e.stopPropagation(); });
              container.appendChild(row);
              if (hasKids && isOpen) {
                const sub = el("div", { class: "dww-side-subs" });
                container.appendChild(sub);
                renderNode(c, depth + 1, sub);
              }
            });
          };
          items.forEach((it) => {
            if (!it.tree || typeof it.tree !== "object") it.tree = { id: uid(), text: it.title || "主目标", done: it.done, shape: "rect", children: [], edges: [] };
            if (!Array.isArray(it.tree.edges)) it.tree.edges = [];
            if (!Array.isArray(it.tree.children)) it.tree.children = [];
            const s = treeStat(it.tree);
            const isOpen = expanded.has(it.tree.id);
            const row = el("div", { class: "dww-side-goal" + (it === cur ? " dww-cur" : "") });
            const tw = el("span", { class: "dww-side-tw", text: isOpen ? "▾" : "▸" });
            const nm = el("span", { class: "dww-side-nm", text: it.tree.text || it.title || "未命名", title: it.tree.text || it.title || "未命名" });
            const bd = el("span", { class: "dww-side-bd", text: s.done + "/" + s.total });
            row.append(tw, nm, bd);
            tw.addEventListener("click", (e) => { e.stopPropagation(); if (expanded.has(it.tree.id)) expanded.delete(it.tree.id); else expanded.add(it.tree.id); buildSide(); });
            nm.addEventListener("click", (e) => { e.stopPropagation(); if (it !== cur) switchTo(it); });
            side.appendChild(row);
            if (!isOpen) return;
            const box = el("div", { class: "dww-side-subs" });
            renderNode(it.tree, 0, box);
            if (!childrenOf(it.tree).length) box.appendChild(el("div", { class: "dww-side-row dww-side-row-leaf dww-side-empty", style: { paddingLeft: "8px" }, text: "（暂无子目标）" }));
            side.appendChild(box);
          });
        }
        // ---------- palette (left shape library) ----------
        let paletteTab = "library"; // "library" | "my"
        const collapsedGroups = new Set();
        function buildPalette() {
          palette.innerHTML = "";
          // tabs
          const tabs = el("div", { class: "dww-pal-tabs" });
          const tLib = el("div", { class: "dww-pal-tab" + (paletteTab === "library" ? " dww-on" : ""), text: "图形库" });
          const tMy = el("div", { class: "dww-pal-tab" + (paletteTab === "my" ? " dww-on" : ""), text: "我的组件" });
          tLib.addEventListener("click", () => { paletteTab = "library"; buildPalette(); });
          tMy.addEventListener("click", () => { paletteTab = "my"; buildPalette(); });
          tabs.append(tLib, tMy);
          palette.appendChild(tabs);
          if (paletteTab !== "library") {
            palette.appendChild(el("div", { class: "dww-pal-cat", text: "（暂无自定义组件）" }));
            return;
          }
          // head row: color theme chip + search icon
          const head = el("div", { class: "dww-pal-head" }, [
            el("span", { class: "dww-pal-theme", text: "单色" }),
            el("span", { class: "dww-pal-search", text: "🔍" })
          ]);
          palette.appendChild(head);
          // groups
          SHAPE_GROUPS.forEach((g) => {
            const collapsed = collapsedGroups.has(g.id);
            const cat = el("div", { class: "dww-pal-cat" + (collapsed ? " dww-collapsed" : ""), text: g.label });
            cat.addEventListener("click", () => { if (collapsedGroups.has(g.id)) collapsedGroups.delete(g.id); else collapsedGroups.add(g.id); buildPalette(); });
            palette.appendChild(cat);
            if (collapsed) return;
            const grid = el("div", { class: "dww-pal-grid" });
            g.items.forEach((id) => {
              const def = SHAPE_DEFS[id];
              if (!def) return;
              const item = el("div", { class: "dww-pal-item", title: def.label + " — 拖到画布生成节点，或拖到连线中部插入" });
              item.innerHTML = paletteSvg(id);
              item.setAttribute("draggable", "true");
              item.addEventListener("dragstart", (e) => {
                try { e.dataTransfer.setData("text/x-dww-shape", id); e.dataTransfer.effectAllowed = "copy"; } catch (e2) {}
              });
              grid.appendChild(item);
            });
            palette.appendChild(grid);
          });
        }
        // ---------- auto-layout ----------
        // _x/_y are runtime-only (never persisted); the persisted position lives in _manual.
        // On load we must restore _manual → _x/_y, otherwise every node snaps back to a
        // default stack (the "layout reset after restart" bug).
        function autoLayout() {
          // restore persisted manual positions
          walkAll((n) => {
            if (!n) return;
            if ((n._x == null || n._y == null) && n._manual) { n._x = n._manual.x; n._y = n._manual.y; }
          });
          // root defaults to top-left if never placed
          if (root._x == null || root._y == null) { root._x = PAD; root._y = PAD; }
          // any node that still has no position (legacy data) → give it a spot
          let orphanY = PAD;
          walkAll((n) => {
            if (!n) return;
            if (n === root) return;
            if (n._x == null || n._y == null) { n._x = PAD + 2 * (NODE_W + GAP_X); n._y = orphanY; orphanY += NODE_H + GAP_Y; }
          });
        }
        // ---------- selection & viewport helpers ----------
        function ensureNodeVisible(n) {
          const nLeft = (n._x || 0) * zoom, nTop = (n._y || 0) * zoom;
          const sx = canvas.scrollLeft, sy = canvas.scrollTop;
          if (nLeft < sx) canvas.scrollLeft = nLeft - 20;
          if (nTop < sy) canvas.scrollTop = nTop - 20;
          if (nLeft + NODE_W * zoom > sx + canvas.clientWidth) canvas.scrollLeft = nLeft + NODE_W * zoom - canvas.clientWidth + 20;
          if (nTop + NODE_H * zoom > sy + canvas.clientHeight) canvas.scrollTop = nTop + NODE_H * zoom - canvas.clientHeight + 20;
        }
        // v0.14.0: convert a screen/client point to MODEL coordinates (zoom-aware).
        function toModel(clientX, clientY) {
          const r = canvas.getBoundingClientRect();
          return { x: (clientX - r.left + canvas.scrollLeft) / zoom, y: (clientY - r.top + canvas.scrollTop) / zoom };
        }
        function updateStageBounds() {
          spacer.style.width = Math.max(contentW * zoom, canvas.clientWidth) + "px";
          spacer.style.height = Math.max(contentH * zoom, canvas.clientHeight) + "px";
        }
        function applyZoom(z) {
          z = Math.max(0.3, Math.min(2.5, z));
          zoom = z;
          stage.style.transform = "scale(" + z + ")";
          updateStageBounds();
          if (zVal) zVal.textContent = Math.round(z * 100) + "%";
        }
        // ---------- v0.13.0: due dates & urgency colour ramp ----------
        // Dates are stored as plain "YYYY-MM-DD" strings on n.date (persisted by
        // cleanTree/cleanSubNode). Every colour decision flows from daysUntil().
        function todayMidnight() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
        function parseDue(s) {
          if (!s) return null;
          const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
          if (!m) return null;
          const d = new Date(+m[1], +m[2] - 1, +m[3]);
          if (isNaN(d.getTime())) return null;
          d.setHours(0, 0, 0, 0);
          return d;
        }
        // whole days from today to the due date: <0 overdue, 0 today, >0 upcoming
        function daysUntil(s) {
          const d = parseDue(s);
          if (!d) return null;
          return Math.round((d - todayMidnight()) / 86400000);
        }
        function fmtMD(s) { const d = parseDue(s); if (!d) return ""; const p = (x) => String(x).padStart(2, "0"); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
        // Urgency ramp: cool slate when far away -> amber -> orange -> deep red as the
        // deadline approaches; past the deadline it locks to the reddest tone.
        const DUE_STOPS = [
          { d: -100000, bg: [255, 205, 205], fg: [150, 16, 28], bd: [226, 62, 68] },   // overdue
          { d: 0, bg: [255, 222, 219], fg: [193, 28, 36], bd: [238, 88, 90] },          // today
          { d: 3, bg: [255, 238, 222], fg: [196, 74, 28], bd: [242, 138, 84] },         // within 3 days
          { d: 7, bg: [255, 248, 224], fg: [166, 108, 18], bd: [234, 186, 74] },        // within a week
          { d: 15, bg: [246, 249, 235], fg: [110, 126, 58], bd: [188, 201, 128] },      // within 2 weeks
          { d: 30, bg: [239, 244, 249], fg: [88, 104, 124], bd: [186, 196, 210] },      // within a month
          { d: 100000, bg: [239, 244, 249], fg: [122, 134, 150], bd: [196, 205, 218] }  // far off
        ];
        function rampAt(days) {
          let a = DUE_STOPS[0], b = DUE_STOPS[DUE_STOPS.length - 1];
          for (let i = 0; i < DUE_STOPS.length - 1; i++) {
            if (days >= DUE_STOPS[i].d && days <= DUE_STOPS[i + 1].d) { a = DUE_STOPS[i]; b = DUE_STOPS[i + 1]; break; }
          }
          const span = b.d - a.d;
          const t = span > 0 && span < 1e6 ? (days - a.d) / span : 0;
          const mix = (p, q) => Math.round(p + (q - p) * t);
          return { bg: [mix(a.bg[0], b.bg[0]), mix(a.bg[1], b.bg[1]), mix(a.bg[2], b.bg[2])], fg: [mix(a.fg[0], b.fg[0]), mix(a.fg[1], b.fg[1]), mix(a.fg[2], b.fg[2])], bd: [mix(a.bd[0], b.bd[0]), mix(a.bd[1], b.bd[1]), mix(a.bd[2], b.bd[2])] };
        }
        const rgb = (c) => "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
        // chip text: the date itself plus a compact relative countdown
        function dueLabel(ds) {
          if (!ds) return "📅 设置日期";
          const d = daysUntil(ds);
          if (d === null) return "📅 " + ds;
          if (d < 0) return "⚠ " + fmtMD(ds) + " · 逾期" + Math.abs(d) + "天";
          if (d === 0) return "🔥 " + fmtMD(ds) + " · 今天";
          if (d === 1) return "⏰ " + fmtMD(ds) + " · 明天";
          return "📅 " + fmtMD(ds) + " · " + d + "天";
        }
        // paint a chip (or clear it when no date is set)
        function applyDueChip(n, chip) {
          const ds = n.date || "";
          const d = daysUntil(ds);
          chip.textContent = dueLabel(ds);
          const empty = !ds || d === null;
          chip.classList.toggle("dww-date-empty", empty);
          if (empty) {
            chip.style.background = "rgba(255,255,255,.82)";
            chip.style.color = "rgba(60,70,90,.85)";
            chip.style.borderColor = "rgba(40,45,60,.2)";
            return;
          }
          const t = rampAt(d);
          chip.style.background = rgb(t.bg);
          chip.style.color = rgb(t.fg);
          chip.style.borderColor = rgb(t.bd);
        }
        // swap the chip for a real <input type="date">; commit on change, revert on blur
        function editDue(n, wrap, chip) {
          const input = el("input", { type: "date", class: "dww-date-input", value: n.date || "" });
          let closed = false;
          const close = () => {
            if (closed) return; closed = true;
            if (input.parentNode) input.parentNode.replaceChild(chip, input);
            wrap.style.pointerEvents = "";
          };
          input.addEventListener("change", () => { n.date = input.value || ""; persist(); applyDueChip(n, chip); updateSum(); close(); });
          input.addEventListener("blur", () => close());
          input.addEventListener("keydown", (e) => { if (e.key === "Enter") { input.blur(); } if (e.key === "Escape") { close(); } });
          wrap.replaceChild(input, chip);
          try { input.focus(); input.showPicker && input.showPicker(); } catch (_) {}
        }
        // "YYYY-MM-DD" for today + N days (used by the toolbar's quick-pick buttons)
        function offsetDate(days) {
          const d = todayMidnight();
          d.setDate(d.getDate() + days);
          const p = (x) => String(x).padStart(2, "0");
          return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
        }
        // Single write path for a node's deadline: model -> storage -> that node's chip only.
        // Deliberately no paint(): a full repaint would blow away focus and the toolbar.
        function setNodeDate(n, v) {
          n.date = v || "";
          persist();
          const c = canvas.querySelector('[data-nid="' + n.id + '"] .dww-date-chip');
          if (c) applyDueChip(n, c);
          updateSum();
          buildToolbar();
        }
        // ---------- node rendering ----------
        function makeNode(n, isRoot) {
          const shape = n.shape || "f_rect";
          const fill = n.fill || SHAPE_DEFS[shape].fill;
          const stroke = n.stroke || SHAPE_DEFS[shape].stroke;
          const card = el("div", {
            class: "dww-node" + (n.done ? " dww-done" : "") + (n.id === selectedId ? " dww-sel" : ""),
            "data-nid": n.id,
            "data-shape": shape,
            style: { left: (n._x || 0) + "px", top: (n._y || 0) + "px", width: NODE_W + "px", minHeight: NODE_H + "px", backgroundImage: nodeBg(shape, fill, stroke) }
          });
          const rootAuto = isRoot && treeStat(root).total > 0;
          // v0.12.9: the completion check is a floating badge on the shape's top-left corner
          // (mirrors the delete × on the top-right) so the box body holds only the label.
          const chk = el("button", { class: "dww-node-chk" + (rootAuto ? " dww-autock" : ""), title: rootAuto ? "全部子任务完成后自动勾选" : (n.done ? "取消完成" : "标记完成"), onclick: (e) => {
            e.stopPropagation();
            if (rootAuto) return;
            n.done = !n.done;
            card.classList.toggle("dww-done", n.done);
            persist(); syncRootDone(true); updateSum(); buildSide();
          } });
          const inp = el("input", { class: "dww-node-text", type: "text", value: n.text || "", placeholder: isRoot ? "最终目的" : "节点…", oninput: (e) => {
            e.stopPropagation();
            n.text = e.target.value;
            if (isRoot) { g.title = n.text; titleEl.textContent = "🎯 " + (n.text || "主目标") + " · 流程图"; }
            persist(); buildSide();
          } });
          inp.addEventListener("click", (e) => e.stopPropagation());
          inp.addEventListener("focus", (e) => e.stopPropagation());
          const body = el("div", { class: "dww-node-body" }, [inp]);
          card.appendChild(body);
          card.appendChild(chk);
          // v0.13.0: due-date strip sits BELOW the shape. Kept absolutely positioned so the
          // 128x40 node box never changes (all connector maths depend on it).
          const dateWrap = el("div", { class: "dww-node-date" });
          const chip = el("button", {
            class: "dww-date-chip",
            title: n.date ? "点击修改截止日期" : "点击设置截止日期（越临近越红）"
          });
          applyDueChip(n, chip);
          // NOTE: do NOT call paint() here — it rebuilds every node and would detach the very
          // chip we are about to swap for the editor. Select by toggling classes in place.
          chip.addEventListener("click", (e) => {
            e.stopPropagation();
            selectedId = n.id; selectedEdge = null;
            Array.from(canvas.querySelectorAll(".dww-node.dww-sel")).forEach((c) => c.classList.remove("dww-sel"));
            card.classList.add("dww-sel");
            buildToolbar();
            editDue(n, dateWrap, chip);
          });
          chip.addEventListener("pointerdown", (e) => e.stopPropagation());
          dateWrap.appendChild(chip);
          card.appendChild(dateWrap);
          // connection dots (4 directions, only visible when selected — pure CSS via .dww-sel)
          const dots = ["n", "e", "s", "w"].map((dir) => {
            const d = el("div", { class: "dww-conn-dot dww-conn-" + dir, "data-dir": dir });
            d.addEventListener("pointerdown", (e) => {
              e.stopPropagation();
              startEdgeDrag(n, dir, e, d);
            });
            // move/up handlers live on the dot itself, which owns the pointer capture
            bindEdgeDragHandlers(d);
            card.appendChild(d);
            return d;
          });
          // WPS-style delete badge (top-right ×) — only for non-root nodes
          if (!isRoot) {
            const del = el("button", {
              class: "dww-node-del", title: "删除此节点",
              text: "×",
              onclick: (e) => { e.stopPropagation(); removeNode(n.id); }
            });
            card.appendChild(del);
          }
          // click on the card background (NOT on input/check/dots) → select
          card.addEventListener("click", (e) => {
            // only treat card-level click as selection if it bubbled here (children stopPropagation)
            selectedId = n.id; selectedEdge = null; ensureNodeVisible(n); paint(); buildSide();
          });
          // drag-to-move: pointerdown on card body (NOT on input/check/dots/buttons)
          let dragState = null;
          card.addEventListener("pointerdown", (e) => {
            if (e.button !== 0) return;
            // ignore if the event target is a control (input, button, .dww-conn-dot)
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "BUTTON" || (t.classList && t.classList.contains("dww-conn-dot")))) return;
            dragState = { startX: e.clientX, startY: e.clientY, baseX: n._x, baseY: n._y, moved: false, pointerId: e.pointerId };
            // capture immediately so subsequent moves come straight to this card
            try { card.setPointerCapture(e.pointerId); } catch (_) {}
          });
          card.addEventListener("pointermove", (e) => {
            if (!dragState) return;
            const dx = e.clientX - dragState.startX, dy = e.clientY - dragState.startY;
            // v0.12.3: lower threshold (2px instead of 4px) for snappier drag response
            if (!dragState.moved && Math.hypot(dx, dy) < 2) return;
            if (!dragState.moved) { dragState.moved = true; card.classList.add("dww-dragging"); }
            n._x = dragState.baseX + dx / zoom; n._y = dragState.baseY + dy / zoom;
            card.style.left = n._x + "px"; card.style.top = n._y + "px";
            scheduleDrawEdges();
          });
          card.addEventListener("pointerup", (e) => {
            if (!dragState) return;
            const wasMoved = dragState.moved;
            try { card.releasePointerCapture(dragState.pointerId); } catch (_) {}
            dragState = null;
            card.classList.remove("dww-dragging");
            if (!wasMoved) return;
            n._manual = { x: n._x, y: n._y };
            persist();
            paint();
          });
          return card;
        }
        // ---------- edge drag (from a connection-dot) ----------
        let edgeDrag = null; // { fromId, fromDir, fromX, fromY, dot }
        function startEdgeDrag(src, dir, ev, dot) {
          // anchor exactly at the center of the chosen side
          const port = sidePort(src, dir);
          edgeDrag = { fromId: src.id, fromDir: dir, fromX: port.x, fromY: port.y, dot: dot };
          // create ghost path overlay
          ensureGhostSvg();
          // CRITICAL: capture the pointer on the dot so every move/up event is routed
          // to this element — without this, moving the cursor off the dot (or over another
          // node) makes the browser fire events at a different target and the drag dies.
          try { dot.setPointerCapture(ev.pointerId); } catch (_) {}
          // reveal every node's side midpoints so the user can aim at them
          canvas.classList.add("dww-edging");
          ev.preventDefault();
          ev.stopPropagation();
        }
        // exact center of a node's side (n/e/s/w)
        function sidePort(n, dir) {
          const x = n._x || 0, y = n._y || 0;
          if (dir === "n") return { x: x + NODE_W / 2, y: y };
          if (dir === "s") return { x: x + NODE_W / 2, y: y + NODE_H };
          if (dir === "e") return { x: x + NODE_W, y: y + NODE_H / 2 };
          return { x: x, y: y + NODE_H / 2 }; // w
        }
        // Nearest side-MIDPOINT among every node (except `excludeId`) within `thresh` canvas px.
        // Returns { node, dir, port:{x,y}, dist } or null.
        // This is what enforces "edges may ONLY attach to a side midpoint".
        function findSnapPort(cx, cy, excludeId, thresh) {
          let best = null;
          const dirs = ["n", "e", "s", "w"];
          walkAll((n) => {
            if (!n || n.id === excludeId) return;
            for (let i = 0; i < dirs.length; i++) {
              const p = sidePort(n, dirs[i]);
              const dx = cx - p.x, dy = cy - p.y;
              const d = Math.hypot(dx, dy);
              if (d < thresh && (!best || d < best.dist)) best = { node: n, dir: dirs[i], port: p, dist: d };
            }
          });
          return best;
        }
        // highlight the port an in-flight edge would snap to (visual affordance)
        let snapHighlight = null;
        function highlightSnapPort(snap) {
          if (snapHighlight && snapHighlight.classList) snapHighlight.classList.remove("dww-snap");
          snapHighlight = null;
          if (!snap) return;
          const card = canvas.querySelector('[data-nid="' + snap.node.id + '"]');
          if (!card) return;
          const dot = card.querySelector(".dww-conn-dot.dww-conn-" + snap.dir);
          if (!dot) return;
          dot.classList.add("dww-snap");
          snapHighlight = dot;
        }
        function clearSnapHighlight() { highlightSnapPort(null); }
// distance from point (px,py) to an orthogonal polyline made of the given points
        function distToPolyline(px, py, pts) {
          let best = Infinity;
          for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1], b = pts[i];
            const dx = b.x - a.x, dy = b.y - a.y;
            const len2 = dx * dx + dy * dy;
            let t = len2 === 0 ? 0 : ((px - a.x) * dx + (py - a.y) * dy) / len2;
            if (t < 0) t = 0; else if (t > 1) t = 1;
            const cx = a.x + t * dx, cy = a.y + t * dy;
            const d = Math.hypot(px - cx, py - cy);
            if (d < best) best = d;
          }
          return best;
        }
        // return { idx, dist } of the nearest edge to (cx,cy), or null if all are farther than `thresh`
        function findEdgeNear(cx, cy, thresh) {
          let best = null;
          root.edges.forEach((e, idx) => {
            const a = findNode(e.from), b = findNode(e.to);
            if (!a || !b) return;
            const fromDir = e.fromDir || "e";
            const toDir = e.toDir || facingSide(b, (a._x || 0) + NODE_W / 2, (a._y || 0) + NODE_H / 2);
            const p1 = sidePort(a, fromDir), p2 = sidePort(b, toDir);
            const d = orthoPath(p1, fromDir, p2, toDir);
            // parse "M x y L x y L x y ..." into [{x,y}]*
            const tokens = d.replace(/[ML]/g, " ").trim().split(/\s+/).map(Number);
            const pts = [];
            for (let i = 0; i + 1 < tokens.length; i += 2) pts.push({ x: tokens[i], y: tokens[i + 1] });
            const dist = distToPolyline(cx, cy, pts);
            if (dist < thresh && (!best || dist < best.dist)) best = { idx: idx, dist: dist };
          });
          return best;
        }
        // Build an orthogonal (axis-aligned, 横平竖直) path from side port p1 to p2.
        // Turns at right angles; no diagonal segments. Exits perpendicular to dir1
        // and enters perpendicular to dir2.
        function orthoPath(p1, dir1, p2, dir2) {
          const horizontal = dir1 === "e" || dir1 === "w";
          if (horizontal) {
            // exit horizontally: first move along X toward target, then vertical
            const midX = p1.x + (p2.x - p1.x) / 2;
            // if target is on the opposite side, bend at midpoint; else straight-ish
            if ((dir1 === "e" && p2.x >= p1.x) || (dir1 === "w" && p2.x <= p1.x)) {
              // same horizontal direction or target beyond → route: H out, V, H in (or simple L if aligned)
              if (Math.abs(p2.y - p1.y) < 2) return "M " + p1.x + " " + p1.y + " L " + p2.x + " " + p2.y;
              const bendX = p1.x + (p2.x - p1.x) / 2;
              return "M " + p1.x + " " + p1.y + " L " + bendX + " " + p1.y + " L " + bendX + " " + p2.y + " L " + p2.x + " " + p2.y;
            } else {
              // target is behind → detour out, down/up, back
              const outX = dir1 === "e" ? p1.x + 20 : p1.x - 20;
              const inX = dir2 === "e" ? p2.x + 20 : p2.x - 20;
              const midY = (p1.y + p2.y) / 2;
              return "M " + p1.x + " " + p1.y + " L " + outX + " " + p1.y + " L " + outX + " " + midY + " L " + inX + " " + midY + " L " + inX + " " + p2.y + " L " + p2.x + " " + p2.y;
            }
          } else {
            // exit vertically: first move along Y toward target, then horizontal
            if ((dir1 === "s" && p2.y >= p1.y) || (dir1 === "n" && p2.y <= p1.y)) {
              if (Math.abs(p2.x - p1.x) < 2) return "M " + p1.x + " " + p1.y + " L " + p2.x + " " + p2.y;
              const bendY = p1.y + (p2.y - p1.y) / 2;
              return "M " + p1.x + " " + p1.y + " L " + p1.x + " " + bendY + " L " + p2.x + " " + bendY + " L " + p2.x + " " + p2.y;
            } else {
              const outY = dir1 === "s" ? p1.y + 20 : p1.y - 20;
              const inY = dir2 === "s" ? p2.y + 20 : p2.y - 20;
              const midX = (p1.x + p2.x) / 2;
              return "M " + p1.x + " " + p1.y + " L " + p1.x + " " + outY + " L " + midX + " " + outY + " L " + midX + " " + inY + " L " + p2.x + " " + inY + " L " + p2.x + " " + p2.y;
            }
          }
        }
        function ensureGhostSvg() {
          let g = canvas.querySelector(".dww-flow-ghost");
          if (!g) {
            g = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            g.setAttribute("class", "dww-flow-lines dww-flow-ghost");
            g.style.position = "absolute"; g.style.left = "0"; g.style.top = "0";
            g.style.pointerEvents = "none";
            stage.appendChild(g);
          }
          return g;
        }
        // redraw the in-progress ghost line (orthogonal: horizontal-then-vertical)
        function updateEdgeGhost(clientX, clientY) {
          if (!edgeDrag) return;
          const r = canvas.getBoundingClientRect();
          const m = toModel(clientX, clientY);
          const cx = m.x, cy = m.y;
          const p1 = { x: edgeDrag.fromX, y: edgeDrag.fromY };
          const dir1 = edgeDrag.fromDir;
          // SNAP: the end point locks onto the nearest side-midpoint when in range.
          const snap = findSnapPort(cx, cy, edgeDrag.fromId, SNAP_R);
          const p2 = snap ? snap.port : { x: cx, y: cy };
          highlightSnapPort(snap);
          // simple orthogonal: if exiting horizontally, go H then V; else V then H
          let d;
          if (dir1 === "e" || dir1 === "w") {
            const bendX = p1.x + (p2.x - p1.x) / 2;
            d = "M " + p1.x + " " + p1.y + " L " + bendX + " " + p1.y + " L " + bendX + " " + p2.y + " L " + p2.x + " " + p2.y;
          } else {
            const bendY = p1.y + (p2.y - p1.y) / 2;
            d = "M " + p1.x + " " + p1.y + " L " + p1.x + " " + bendY + " L " + p2.x + " " + bendY + " L " + p2.x + " " + p2.y;
          }
          const g = ensureGhostSvg();
          // snapped → solid green (ready to connect); free → dashed blue
          const stroke = snap ? "rgba(47,169,107,.95)" : "rgba(59,123,255,.95)";
          const dash = snap ? "" : ' stroke-dasharray="6 4"';
          g.innerHTML = '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"' + dash + '/>';
        }
        // edge drag move/up are bound to the DOTS (which own the pointer capture), not the canvas
        function bindEdgeDragHandlers(dot) {
          dot.addEventListener("pointermove", (e) => {
            if (!edgeDrag) return;
            updateEdgeGhost(e.clientX, e.clientY);
          });
          dot.addEventListener("pointerup", (e) => {
            if (!edgeDrag) return;
            try { dot.releasePointerCapture(e.pointerId); } catch (_) {}
            finishEdgeDrag(e.clientX, e.clientY);
          });
          dot.addEventListener("pointercancel", (e) => {
            if (!edgeDrag) return;
            try { dot.releasePointerCapture(e.pointerId); } catch (_) {}
            cancelEdgeDrag();
          });
        }
        // v0.12.9: an edge may ONLY be created when the pointer is released near one of the
        // four side MIDPOINTS of another node. Releasing over any other part of a node
        // (its body / corners / empty canvas) creates nothing, so edges always land
        // exactly where they are aimed. `toDir` comes straight from the snapped port,
        // so the incoming direction is always the midpoint the pointer released on.
        function finishEdgeDrag(clientX, clientY) {
          const m = toModel(clientX, clientY);
          const cx = m.x, cy = m.y;
          const snap = findSnapPort(cx, cy, edgeDrag.fromId, SNAP_R);
          if (snap) {
            const exists = root.edges.some((x) => x.from === edgeDrag.fromId && x.to === snap.node.id);
            if (!exists) {
              root.edges.push({ from: edgeDrag.fromId, to: snap.node.id, fromDir: edgeDrag.fromDir, toDir: snap.dir });
              ensureShape();
              persist();
              syncRootDone(true);
            }
          }
          edgeDrag = null;
          clearSnapHighlight();
          canvas.classList.remove("dww-edging");
          const g = canvas.querySelector(".dww-flow-ghost");
          if (g) g.innerHTML = "";
          paint();
        }
        function cancelEdgeDrag() {
          edgeDrag = null;
          clearSnapHighlight();
          canvas.classList.remove("dww-edging");
          const g = canvas.querySelector(".dww-flow-ghost");
          if (g) g.innerHTML = "";
        }
        // return the side of node n that FACES toward point (px,py)
        // (i.e. if the point is to the LEFT of the node, return "w"; below → "s", etc.)
        function facingSide(n, px, py) {
          const cx = (n._x || 0) + NODE_W / 2, cy = (n._y || 0) + NODE_H / 2;
          const dx = px - cx, dy = py - cy;
          if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "e" : "w";
          return dy >= 0 ? "s" : "n";
        }
        // ---------- canvas drop target (palette drag → new node) ----------
        canvas.addEventListener("dragover", (e) => {
          // accept palette drops
          if (e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf("text/x-dww-shape") >= 0) {
            e.preventDefault();
            try { e.dataTransfer.dropEffect = "copy"; } catch (e2) {}
            // ghost preview
            showDropGhost(e);
          }
        });
        canvas.addEventListener("dragleave", (e) => {
          hideDropGhost();
        });
        canvas.addEventListener("drop", (e) => {
          e.preventDefault();
          hideDropGhost();
          let shape = "f_rect";
          try { shape = e.dataTransfer.getData("text/x-dww-shape") || "f_rect"; } catch (e2) {}
          if (!SHAPE_DEFS[shape]) shape = "f_rect";
          const r = canvas.getBoundingClientRect();
          const m = toModel(e.clientX, e.clientY);
          const cx = m.x, cy = m.y;
          // detect "drop on an existing edge" — split that edge by inserting a new node in the middle
          const hitEdge = findEdgeNear(cx, cy, 18);
          const newNode = { id: uid(), text: "", done: false, shape: shape, children: [], _x: cx - NODE_W / 2, _y: cy - NODE_H / 2, _manual: { x: cx - NODE_W / 2, y: cy - NODE_H / 2 } };
          if (hitEdge) {
            // remove the original edge, replace with two new edges (from → newNode, newNode → to)
            const original = root.edges[hitEdge.idx];
            const fDir = original.fromDir || "e";
            const tDir = original.toDir || "w";
            root.edges.splice(hitEdge.idx, 1);
            // mid-edge ports toward the new node (best-effort: keep same dirs so visual stays similar)
            root.edges.push({ from: original.from, to: newNode.id, fromDir: fDir, toDir: tDir });
            root.edges.push({ from: newNode.id, to: original.to, fromDir: fDir, toDir: tDir });
          }
          root.children.push(newNode);
          ensureShape();
          persist();
          selectedId = newNode.id;
          focusId = newNode.id;
          paint(); buildSide();
        });
        let dropGhost = null;
        function showDropGhost(e) {
          if (!dropGhost) {
            dropGhost = el("div", { class: "dww-canvas-ghost" });
            stage.appendChild(dropGhost);
          }
          const r = canvas.getBoundingClientRect();
          const m = toModel(e.clientX, e.clientY);
          const cx = m.x, cy = m.y;
          dropGhost.style.left = (cx - NODE_W / 2) + "px";
          dropGhost.style.top = (cy - NODE_H / 2) + "px";
          dropGhost.style.width = NODE_W + "px";
          dropGhost.style.height = NODE_H + "px";
          // visual cue: if dropping onto an existing edge, show "+" to indicate "insert between"
          const hit = findEdgeNear(cx, cy, 18);
          if (hit) {
            dropGhost.classList.add("dww-canvas-ghost-insert");
            dropGhost.textContent = "+";
          } else {
            dropGhost.classList.remove("dww-canvas-ghost-insert");
            dropGhost.textContent = "";
          }
        }
        function hideDropGhost() {
          if (dropGhost) { dropGhost.remove(); dropGhost = null; }
        }
        // ---------- WPS-style: drag blank canvas to move the ENTIRE layout together ----------
        let moveAll = null;
        let suppressNextCanvasClick = false;
        canvas.addEventListener("pointerdown", (e) => {
          if (e.button !== 0) return;
          if (e.target.closest && e.target.closest(".dww-node")) return;   // node drag handles itself
          if (e.target.closest && e.target.closest(".dww-edge-del")) return;
          moveAll = { startX: e.clientX, startY: e.clientY, moved: false, id: e.pointerId };
          try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
          canvas.classList.add("dww-canvas-panning");
        });
        canvas.addEventListener("pointermove", (e) => {
          if (!moveAll) return;
          const dx = e.clientX - moveAll.startX, dy = e.clientY - moveAll.startY;
          if (!moveAll.moved && Math.hypot(dx, dy) < 3) return;
          moveAll.moved = true;
          walkAll((n) => { n._x = (n._x || 0) + dx / zoom; n._y = (n._y || 0) + dy / zoom; });
          Array.from(canvas.querySelectorAll(".dww-node")).forEach((c) => {
            const n = findNode(c.dataset.nid);
            if (n) { c.style.left = n._x + "px"; c.style.top = n._y + "px"; }
          });
          moveAll.startX = e.clientX; moveAll.startY = e.clientY;
          scheduleDrawEdges();
        });
        canvas.addEventListener("pointerup", (e) => {
          if (!moveAll) return;
          const wasMoved = moveAll.moved;
          try { canvas.releasePointerCapture(moveAll.id); } catch (_) {}
          moveAll = null;
          canvas.classList.remove("dww-canvas-panning");
          if (wasMoved) {
            walkAll((n) => { n._manual = { x: n._x, y: n._y }; });
            persist();
            paint();
            // the browser still fires a click after this pointerup — suppress it so the
            // selection (and toolbar) are preserved after the user finishes the pan.
            suppressNextCanvasClick = true;
          }
        });
        // ---------- click on blank canvas: deselect (but not right after a whole-pan) ----------
        canvas.addEventListener("click", (e) => {
          if (suppressNextCanvasClick) { suppressNextCanvasClick = false; return; }
          // only if no node was clicked
          if (!e.target.closest || !e.target.closest(".dww-node")) {
            selectedId = null; selectedEdge = null; paint(); buildSide();
          }
        });
        // ---------- edge hover (shows × delete button when hovering over an edge) ----------
        // we use mousemove (not pointermove) so it works without interfering with drag handlers.
        canvas.addEventListener("mousemove", (e) => {
          if (moveAll) return; // don't fight with the whole-pan gesture
          const m = toModel(e.clientX, e.clientY);
          const cx = m.x, cy = m.y;
          // ignore if hovering over a node
          if (e.target.closest && e.target.closest(".dww-node")) {
            if (hoveredEdge !== null) { hoveredEdge = null; drawEdges(); }
            return;
          }
          const hit = findEdgeNear(cx, cy, 10);
          const newHover = hit ? hit.idx : null;
          if (newHover !== hoveredEdge) { hoveredEdge = newHover; drawEdges(); }
        });
        canvas.addEventListener("mouseleave", () => {
          if (hoveredEdge !== null) { hoveredEdge = null; drawEdges(); }
        });
        // v0.14.0: Ctrl/Cmd + wheel zooms the canvas (plain wheel scrolls normally).
        canvas.addEventListener("wheel", (e) => {
          if (!(e.ctrlKey || e.metaKey)) return;
          e.preventDefault();
          applyZoom(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
        }, { passive: false });
        // rAF-coalesced edge redraw (dragging calls this instead of drawEdges directly)
        let rafPending = false;
        function scheduleDrawEdges() {
          if (rafPending) return;
          rafPending = true;
          requestAnimationFrame(() => { rafPending = false; drawEdges(); });
        }
        // ---------- edges rendering (SVG) ----------
        function drawEdges() {
          // compute bounds
          let maxX = NODE_W, maxY = NODE_H;
          walkAll((n) => { maxX = Math.max(maxX, (n._x || 0) + NODE_W); maxY = Math.max(maxY, (n._y || 0) + NODE_H); });
          const W = maxX + PAD, H = maxY + PAD;
          // v0.14.0: remember model bounds so the zoom spacer can size the scroll area.
          contentW = W; contentH = H; updateStageBounds();

          // v0.12.3: incremental path update — only re-write the `d` attribute on existing
          // <path> nodes instead of innerHTML-ing the whole SVG on every pointermove.
          // Keeps node dragging smooth on large graphs.
          let svg = canvas.querySelector("svg.dww-flow-lines:not(.dww-flow-ghost)");
          const existingPaths = svg ? Array.from(svg.querySelectorAll(".dww-edge-path")) : [];
          const rebuild = !svg || existingPaths.length !== root.edges.length;
          if (rebuild) {
            if (svg) svg.remove();
            svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("class", "dww-flow-lines");
            svg.setAttribute("width", W); svg.setAttribute("height", H);
            svg.setAttribute("viewBox", "0 0 " + W + " " + H);
            svg.style.position = "absolute"; svg.style.left = "0"; svg.style.top = "0";
            svg.style.pointerEvents = "none";
            // shared marker defs — WPS-style chunky yellow filled triangle
            const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
            marker.setAttribute("id", "dww-arrow");
            marker.setAttribute("viewBox", "0 0 12 12");
            marker.setAttribute("refX", "11"); marker.setAttribute("refY", "6");
            marker.setAttribute("markerWidth", "9"); marker.setAttribute("markerHeight", "9");
            marker.setAttribute("orient", "auto-start-reverse");
            const mp = document.createElementNS("http://www.w3.org/2000/svg", "path");
            mp.setAttribute("d", "M0,0 L12,6 L0,12 L3,6 Z");
            mp.setAttribute("fill", "#e8b41e");
            marker.appendChild(mp);
            defs.appendChild(marker);
            svg.appendChild(defs);
          } else {
            // size may have changed
            svg.setAttribute("width", W); svg.setAttribute("height", H);
            svg.setAttribute("viewBox", "0 0 " + W + " " + H);
          }

          root.edges.forEach((e, i) => {
            const a = findNode(e.from), b = findNode(e.to);
            if (!a || !b) return;
            const fromDir = e.fromDir || "e";
            const toDir = e.toDir || facingSide(b, (a._x || 0) + NODE_W / 2, (a._y || 0) + NODE_H / 2);
            const p1 = sidePort(a, fromDir), p2 = sidePort(b, toDir);
            // v0.12.6: orthogonal (横平竖直) routing — turns at right angles, no diagonal
            const d = orthoPath(p1, fromDir, p2, toDir);
            const isSel = selectedEdge === i || (selectedId && (e.from === selectedId || e.to === selectedId));
            let path;
            if (rebuild) {
              path = document.createElementNS("http://www.w3.org/2000/svg", "path");
              path.setAttribute("fill", "none");
              path.setAttribute("stroke", "#5b6b7d");
              path.setAttribute("stroke-width", "1.8");
              path.setAttribute("stroke-linecap", "round");
              path.setAttribute("marker-end", "url(#dww-arrow)");
              path.setAttribute("pointer-events", "stroke");
              path.style.cursor = "pointer";
              path.addEventListener("click", (ev) => { ev.stopPropagation(); selectedEdge = i; selectedId = null; hoveredEdge = null; drawEdges(); buildSide(); });
              svg.appendChild(path);
            } else {
              path = existingPaths[i];
              if (path.getAttribute("d") === d && path.getAttribute("data-edge") === String(i)) return;
            }
            path.setAttribute("d", d);
            path.setAttribute("class", "dww-edge-path" + (isSel ? " dww-edge-sel" : "") + (hoveredEdge === i ? " dww-edge-hover" : ""));
            path.setAttribute("data-edge", String(i));
          });

          if (rebuild) stage.appendChild(svg);
          // edge × delete: ALWAYS visible on selected edge OR hovered edge (more discoverable than before)
          const oldDel = canvas.querySelector(".dww-edge-del");
          if (oldDel) oldDel.remove();
          const delIdx = hoveredEdge !== null && hoveredEdge !== selectedEdge ? hoveredEdge : selectedEdge;
          if (delIdx !== null && root.edges[delIdx]) {
            const e = root.edges[delIdx];
            const a = findNode(e.from), b = findNode(e.to);
            if (a && b) {
              const mx = ((a._x || 0) + NODE_W + (b._x || 0)) / 2;
              const my = ((a._y || 0) + (b._y || 0) + NODE_H) / 2;
              const del = el("button", { class: "dww-edge-del", title: "删除连线（也可点中后按 Delete）", text: "×", style: { left: mx + "px", top: my + "px" }, onclick: (ev) => {
                ev.stopPropagation();
                const idx = root.edges.indexOf(e);
                if (idx >= 0) root.edges.splice(idx, 1);
                ensureShape();
                selectedEdge = null; hoveredEdge = null;
                persist();
                paint(); buildSide();
              } });
              stage.appendChild(del);
            }
          }
        }
        // ---------- paint (full re-render) ----------
        function paint() {
          syncRootDone(false);
          // assign _idx for color cycling
          let idx = 0;
          walkAll((n) => { n._idx = idx++; });
          // position (restores _manual, defaults root, stacks legacy orphans)
          autoLayout();
          ensureShape();
          drawEdges();
          // remove old node DOM
          Array.from(stage.querySelectorAll(".dww-node, .dww-drop-ghost")).forEach((d) => d.remove());
          // render nodes
          walkAll((n) => stage.appendChild(makeNode(n, n === root)));
          // focus & select
          if (focusId) { const f = canvas.querySelector('[data-nid="' + focusId + '"] .dww-node-text'); if (f) { f.focus(); } focusId = null; }
          buildToolbar();
          updateSum();
        }
        function updateSum() {
          const s = treeStat(root);
          sumEl.textContent = "🌿 子目标 " + s.done + "/" + s.total + " 已完成 · " + s.pct + "%";
          updateDueSum();
        }
        // v0.13.0: header badge — overdue count wins; otherwise show the nearest deadline,
        // tinted with the very same urgency ramp the node chips use.
        function updateDueSum() {
          let overdue = 0, soonest = null, soonestDays = null;
          walkAll((n) => {
            if (!n || n.done) return;
            const d = daysUntil(n.date);
            if (d === null) return;
            if (d < 0) overdue++;
            if (soonestDays === null || d < soonestDays) { soonestDays = d; soonest = n.date; }
          });
          if (overdue > 0) {
            dueEl.textContent = "⚠ 已逾期 " + overdue + " 项";
            const t = rampAt(-1);
            dueEl.style.background = rgb(t.bg);
            dueEl.style.color = rgb(t.fg);
          } else if (soonest) {
            dueEl.textContent = "⏰ 最近 " + fmtMD(soonest) + "（" + (soonestDays === 0 ? "今天" : soonestDays + "天后") + "）";
            const t = rampAt(soonestDays);
            dueEl.style.background = rgb(t.bg);
            dueEl.style.color = rgb(t.fg);
          } else {
            dueEl.textContent = "";
            dueEl.style.background = "transparent";
          }
        }
        // ---------- floating format toolbar (shape + fill/stroke color), WPS-style ----------
        function buildToolbar() {
          const node = selectedId ? findNode(selectedId) : null;
          let tb = overlay.querySelector(".dww-flow-toolbar");
          if (!node) { if (tb) tb.remove(); return; }
          if (!tb) { tb = el("div", { class: "dww-flow-toolbar" }); overlay.appendChild(tb); }
          tb.innerHTML = "";
          // shape switcher — focused set (flowchart + a few common basics)
          tb.appendChild(el("div", { class: "dww-tb-label", text: "形状" }));
          const shapeRow = el("div", { class: "dww-tb-row dww-tb-shape" });
          const toolbarShapes = ["f_rect","f_rounded","f_oval","f_diamond","f_parallelogram","f_hexagon","f_pentagon","f_cylinder","f_document","rect","oval","triangle"];
          toolbarShapes.forEach((sid) => {
            if (!SHAPE_DEFS[sid]) return;
            const b = el("button", {
              class: (node.shape || "f_rect") === sid ? "dww-on" : "",
              title: SHAPE_DEFS[sid].label,
              html: paletteSvg(sid),
              onclick: (ev) => { ev.stopPropagation(); node.shape = sid; persist(); paint(); }
            });
            shapeRow.appendChild(b);
          });
          tb.appendChild(shapeRow);
          // fill color
          tb.appendChild(el("div", { class: "dww-tb-label", text: "填充" }));
          const fillRow = el("div", { class: "dww-tb-row" });
          FILL_COLORS.forEach((c) => {
            fillRow.appendChild(el("button", {
              class: "dww-tb-swatch" + (node.fill === c ? " dww-on" : ""),
              style: { background: c },
              title: c,
              onclick: (ev) => { ev.stopPropagation(); node.fill = c; persist(); paint(); }
            }));
          });
          fillRow.appendChild(el("input", {
            type: "color", class: "dww-tb-custom", title: "自定义填充色", value: node.fill || "#ffffff",
            oninput: (ev) => { node.fill = ev.target.value; const c = canvas.querySelector('[data-nid="' + node.id + '"]'); if (c) c.style.backgroundImage = nodeBg(node.shape, node.fill, node.stroke); },
            onchange: (ev) => { node.fill = ev.target.value; persist(); }
          }));
          tb.appendChild(fillRow);
          // stroke color
          tb.appendChild(el("div", { class: "dww-tb-label", text: "边框" }));
          const strokeRow = el("div", { class: "dww-tb-row" });
          STROKE_COLORS.forEach((c) => {
            strokeRow.appendChild(el("button", {
              class: "dww-tb-swatch" + (node.stroke === c ? " dww-on" : ""),
              style: { background: c },
              title: c,
              onclick: (ev) => { ev.stopPropagation(); node.stroke = c; persist(); paint(); }
            }));
          });
          strokeRow.appendChild(el("input", {
            type: "color", class: "dww-tb-custom", title: "自定义边框色", value: node.stroke || "#3b7bff",
            oninput: (ev) => { node.stroke = ev.target.value; const c = canvas.querySelector('[data-nid="' + node.id + '"]'); if (c) c.style.backgroundImage = nodeBg(node.shape, node.fill, node.stroke); },
            onchange: (ev) => { node.stroke = ev.target.value; persist(); }
          }));
          tb.appendChild(strokeRow);
          // v0.13.0: deadline row — the chip under the node reddens as the date approaches
          tb.appendChild(el("div", { class: "dww-tb-label", text: "截止日期" }));
          const dueRow = el("div", { class: "dww-tb-row" });
          dueRow.appendChild(el("input", {
            type: "date", class: "dww-tb-due", title: "截止日期（越临近越红）",
            value: node.date || "",
            onchange: (ev) => { ev.stopPropagation(); setNodeDate(node, ev.target.value || ""); }
          }));
          [["今天", 0], ["明天", 1], ["一周", 7], ["一月", 30]].forEach((q) => {
            dueRow.appendChild(el("button", {
              class: "dww-tb-mini", text: q[0], title: "设为 " + offsetDate(q[1]),
              onclick: (ev) => { ev.stopPropagation(); setNodeDate(node, offsetDate(q[1])); }
            }));
          });
          dueRow.appendChild(el("button", {
            class: "dww-tb-mini", text: "清除", title: "移除截止日期",
            onclick: (ev) => { ev.stopPropagation(); setNodeDate(node, ""); }
          }));
          tb.appendChild(dueRow);
        }
        // ---------- keyboard: Delete removes selection, Esc deselects/closes ----------
        function onKey(e) {
          // v0.12.9: Esc while an edge is being dragged aborts just the drag (keeps selection)
          if (e.key === "Escape") {
            if (edgeDrag) { cancelEdgeDrag(); return; }
            if (selectedId || selectedEdge !== null) { selectedId = null; selectedEdge = null; paint(); buildSide(); } else { closeFlow(); }
          }
          else if (e.key === "Delete" || e.key === "Backspace") {
            // don't intercept if user is typing in an input
            const ae = document.activeElement;
            if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA")) return;
            if (selectedEdge !== null && root.edges[selectedEdge]) {
              root.edges.splice(selectedEdge, 1);
              ensureShape();
              selectedEdge = null;
              persist(); paint(); buildSide();
            } else if (selectedId && selectedId !== root.id) {
              removeNode(selectedId);
            }
          }
        }
        function closeFlow() {
          document.removeEventListener("keydown", onKey);
          window.removeEventListener("resize", onWinResize);
          backdrop.remove();
          overlay.remove();
          if (rerender) rerender();
        }
        document.addEventListener("keydown", onKey);
        // CDP/test hook (only when URL has ?dww-test=1): exposes internals so
        // headless verification scripts can drive the flowchart reliably.
        // Synthetic HTML5 drag events in headless Chromium do NOT carry a
        // real DataTransfer, so the palette→canvas drop is untestable without
        // this seam. Stripped in production by the query-string gate.
        if (/[?&]dww-test=1\b/.test(location.search)) {
          window.__dww = {
            root: root,
            edges: root.edges,
            addNode: function(shape, x, y) {
              if (!SHAPE_DEFS[shape]) shape = "f_rect";
              const nx = (x == null ? PAD + 2 * (NODE_W + GAP_X) : x) - NODE_W / 2;
              const ny = (y == null ? PAD : y) - NODE_H / 2;
              const newNode = { id: uid(), text: "", done: false, shape: shape, children: [], _x: nx, _y: ny, _manual: { x: nx, y: ny } };
              root.children.push(newNode);
              ensureShape();
              persist();
              selectedId = newNode.id;
              focusId = newNode.id;
              paint(); buildSide();
              return newNode.id;
            },
            addEdge: function(fromId, toId) {
              if (root.edges.some((e) => e.from === fromId && e.to === toId)) return false;
              const a = findNode(fromId), b = findNode(toId);
              const fDir = facingSide(a, (b._x || 0) + NODE_W / 2, (b._y || 0) + NODE_H / 2);
              const tDir = facingSide(b, (a._x || 0) + NODE_W / 2, (a._y || 0) + NODE_H / 2);
              root.edges.push({ from: fromId, to: toId, fromDir: fDir, toDir: tDir });
              ensureShape();
              persist();
              syncRootDone(true);
              paint();
              return true;
            },
            removeNodeById: function(id) {
              return removeNode(id);
            },
            // v0.12.9 test hooks for the midpoint-snap constraint
            sidePortOf: function(id, dir) {
              const n = findNode(id);
              return n ? sidePort(n, dir) : null;
            },
            snapAt: function(cx, cy, excludeId, thresh) {
              const s = findSnapPort(cx, cy, excludeId, thresh == null ? SNAP_R : thresh);
              return s ? { id: s.node.id, dir: s.dir, port: s.port, dist: +s.dist.toFixed(2) } : null;
            },
            getRoot: function() { return root; },
            getZoom: function() { return zoom; },
            setZoom: function(z) { applyZoom(z); return zoom; },
            // v0.15.0 test hooks: floating-window geometry + maximize
            flowWin: function() { const r = overlay.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), max: !!winGeo.max }; },
            setFlowMax: function(on) { setMax(!!on); return window.__dww.flowWin(); },
            resizeFlowTo: function(w, h) { winGeo.w = w; winGeo.h = h; clampWin(); applyWin(); saveWin(); return window.__dww.flowWin(); },
            __measureDragPerf: function(moves) {
              // simulate N pointermove-style style.left updates and count actual DOM path mutations
              const ns = Array.from(canvas.querySelectorAll(".dww-node"));
              if (ns.length < 2) return -1;
              const n = ns[1];
              const svg = canvas.querySelector("svg.dww-flow-lines:not(.dww-flow-ghost)");
              const paths = svg ? Array.from(svg.querySelectorAll(".dww-edge-path")) : [];
              if (!paths.length) return -2;
              // monkey-patch setAttribute on the first path to count how many times drawEdges
              // actually writes a NEW d (when d is unchanged → returns early without calling setAttribute)
              let writes = 0;
              const orig = paths[0].setAttribute;
              paths[0].setAttribute = function(k, v) { if (k === "d") writes++; return orig.apply(this, arguments); };
              const t0 = performance.now();
              const baseLeft = parseFloat(n.style.left) || n._x || 0;
              const baseTop = parseFloat(n.style.top) || n._y || 0;
              for (let i = 0; i < moves; i++) {
                n._x = baseLeft + i * 1.5; n._y = baseTop + i * 0.5;
                n.style.left = n._x + "px"; n.style.top = n._y + "px";
                drawEdges();
              }
              const t1 = performance.now();
              paths[0].setAttribute = orig;
              return { moves: moves, writes: writes, ms: +(t1 - t0).toFixed(2) };
            }
          };
        }
        document.body.appendChild(overlay);
        ensureShape();
        buildPalette();
        buildSide();
        paint();
      }
      render();
      wrap.append(list, el("button", { class: "dww-add", text: "+ 添加目标", onclick: () => { items.push({ title: "", pct: 0 }); persist(); render(); } }));
      return wrap;
    }

    // ---------- widget: 日期规划 ----------
    function calendarBody() {
      const KEY = "dw:cal:data";
      // v0.13.0: data shape changed from {"YYYY-MM-DD": {text, mark}} to
      //   [{id, title, desc, startDate, endDate, color}]
      // so each entry represents a date-RANGED task that can span several days
      // and is rendered as a coloured chip inside every cell it covers.
      let events = lsGet(KEY, []);
      if (!Array.isArray(events)) {
        // migration from the v0.12.0 {date: {text, mark}} shape:
        // every non-empty entry becomes a 1-day event so nothing is lost.
        const legacy = events; // lsGet returned the old object map
        events = [];
        if (legacy && typeof legacy === "object") {
          Object.keys(legacy).forEach((k) => {
            const v = legacy[k] || {};
            if ((v.text && v.text.trim()) || v.mark) {
              events.push({ id: uid(), title: v.text || (v.mark ? "★" : ""), desc: "", startDate: k, endDate: k, color: "#2fa96b" });
            }
          });
        }
      }
      // ensure every event has the required fields
      events.forEach((ev) => {
        if (!ev.id) ev.id = uid();
        if (!ev.color) ev.color = "#2fa96b";
        if (!ev.startDate) ev.startDate = keyOf(new Date());
        if (!ev.endDate) ev.endDate = ev.startDate;
      });
      let view = new Date(); view.setDate(1);
      let selKey = null;
      let selEventId = null;
      const wrap = el("div");
      const head = el("div", { class: "dww-cal-head" });
      const grid = el("div", { class: "dww-cal-grid" });
      const editor = el("div", { class: "dww-cal-edit" });
      const persist = () => lsSet(KEY, events);
      const keyOf = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      function eventsOnDate(k) {
        return events.filter((ev) => ev.startDate <= k && ev.endDate >= k);
      }
      function renderHead() {
        head.innerHTML = "";
        head.append(
          el("button", { class: "dww-mini", text: "‹", onclick: () => { view.setMonth(view.getMonth() - 1); renderAll(); } }),
          el("span", { class: "dww-cal-ym", text: view.getFullYear() + " 年 " + (view.getMonth() + 1) + " 月" }),
          el("button", { class: "dww-mini", text: "›", onclick: () => { view.setMonth(view.getMonth() + 1); renderAll(); } })
        );
      }
      function renderGrid() {
        grid.innerHTML = "";
        ["日", "一", "二", "三", "四", "五", "六"].forEach((w) => grid.appendChild(el("div", { class: "dww-cal-wd", text: w })));
        const y = view.getFullYear(), mo = view.getMonth();
        const first = new Date(y, mo, 1).getDay();
        const days = new Date(y, mo + 1, 0).getDate();
        const todayKey = keyOf(new Date());
        for (let i = 0; i < first; i++) grid.appendChild(el("div", { class: "dww-cal-cell dww-cal-empty" }));
        for (let d = 1; d <= days; d++) {
          const k = y + "-" + String(mo + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
          const dayEvents = eventsOnDate(k);
          const cell = el("div", {
            class: "dww-cal-cell" + (k === todayKey ? " dww-today" : "") + (dayEvents.length ? " dww-marked" : "")
          });
          cell.appendChild(el("div", { class: "dww-cal-dnum", text: String(d) }));
          // up to 3 chip rows so the cell keeps its grid height; "+N" overflow tag if more
          const MAX = 3;
          dayEvents.slice(0, MAX).forEach((ev) => {
            const chip = el("div", { class: "dww-evchip", title: (ev.title || "(未命名)") + " · " + ev.startDate + " → " + ev.endDate });
            chip.style.setProperty("--ec", ev.color || "#2fa96b");
            chip.textContent = ev.title || "(未命名)";
            // click chip → open its editor (don't bubble to cell-select)
            chip.addEventListener("click", (e) => { e.stopPropagation(); selectEvent(ev.id); });
            cell.appendChild(chip);
          });
          if (dayEvents.length > MAX) cell.appendChild(el("div", { class: "dww-evmore", text: "+" + (dayEvents.length - MAX) }));
          cell.addEventListener("click", () => selectDay(k));
          grid.appendChild(cell);
        }
      }
      function selectDay(k) {
        selKey = k;
        selEventId = null;
        editor.innerHTML = "";
        const dayEvents = eventsOnDate(k);
        editor.append(
          el("div", { class: "dww-cal-sel", text: "📅 " + k }),
          el("button", { class: "dww-add", text: "+ 在这一天新建任务", onclick: () => {
            const ev = { id: uid(), title: "", desc: "", startDate: k, endDate: k, color: pickColor() };
            events.push(ev);
            persist(); renderGrid();
            selectEvent(ev.id);
          }})
        );
        if (dayEvents.length) {
          editor.appendChild(el("div", { class: "dww-section-h", text: "当日任务（" + dayEvents.length + "）" }));
          dayEvents.forEach((ev) => {
            const row = el("div", { class: "dww-evrow" }, [
              el("span", { class: "dww-evdot", style: { background: ev.color || "#2fa96b" } }),
              el("span", { class: "dww-evtitle", text: ev.title || "(未命名)" }),
              el("span", { class: "dww-evrange", text: shortRange(ev) }),
              el("button", { class: "dww-x", title: "编辑", text: "✎", onclick: () => selectEvent(ev.id) })
            ]);
            editor.appendChild(row);
          });
        }
      }
      function shortRange(ev) {
        if (ev.startDate === ev.endDate) return ev.startDate.slice(5); // "MM-DD"
        return ev.startDate.slice(5) + " → " + ev.endDate.slice(5);
      }
      function pickColor() {
        const palette = ["#2fa96b", "#3d8ae0", "#7a5ae0", "#e0537a", "#e0a800", "#0fb5a5"];
        return palette[events.length % palette.length];
      }
      function selectEvent(id) {
        selEventId = id;
        const ev = events.find((x) => x.id === id);
        if (!ev) return;
        editor.innerHTML = "";
        editor.append(
          el("div", { class: "dww-cal-sel", text: "🎯 编辑任务" }),
          el("input", { class: "dww-text", type: "text", placeholder: "任务标题", value: ev.title || "",
            oninput: (e) => { ev.title = e.target.value; persist(); renderGrid(); updateEditorPreview(); } }),
          el("textarea", { class: "dww-cal-ta", placeholder: "备注（可选）", rows: "2",
            oninput: (e) => { ev.desc = e.target.value; persist(); } }, []),
          el("div", { class: "dww-cal-dates" }, [
            el("label", { text: "开始" }),
            el("input", { type: "date", value: ev.startDate,
              onchange: (e) => { ev.startDate = e.target.value; if (ev.endDate < ev.startDate) ev.endDate = ev.startDate; persist(); renderAll(); } }),
            el("label", { text: "结束" }),
            el("input", { type: "date", value: ev.endDate,
              onchange: (e) => { ev.endDate = e.target.value; if (ev.endDate < ev.startDate) ev.startDate = ev.endDate; persist(); renderAll(); } })
          ]),
          el("div", { class: "dww-cal-color" }, [
            el("label", { text: "颜色" }),
            el("input", { type: "color", value: ev.color || "#2fa96b",
              onchange: (e) => { ev.color = e.target.value; persist(); renderGrid(); } }),
            ...["#2fa96b", "#3d8ae0", "#7a5ae0", "#e0537a", "#e0a800", "#0fb5a5"].map((c) =>
              el("button", { class: "dww-sw" + (ev.color === c ? " dww-on" : ""), title: c,
                style: { background: c }, onclick: () => { ev.color = c; persist(); renderGrid(); updateEditorPreview(); } })
            )
          ]),
          el("div", { class: "dww-goal-ctrl" }, [
            el("button", { class: "dww-mini", text: "← 返回该日", onclick: () => { selEventId = null; if (selKey) selectDay(selKey); else editor.innerHTML = '<div class="dww-empty">点击某个日期，可查看 / 新建任务。</div>'; } }),
            el("button", { class: "dww-mini", text: "🗑 删除", onclick: () => {
              events = events.filter((x) => x.id !== id);
              selEventId = null;
              persist(); renderAll();
              if (selKey) selectDay(selKey);
            } })
          ])
        );
        function updateEditorPreview() {
          // refresh chip-row swatches if user changes color via picker
          const swatches = editor.querySelectorAll(".dww-sw");
          swatches.forEach((s) => {
            if (s.title === ev.color) s.classList.add("dww-on"); else s.classList.remove("dww-on");
          });
        }
      }
      function renderAll() {
        renderHead();
        renderGrid();
        if (selKey && !eventsOnDate(selKey).length) selKey = null;
        if (selEventId) { selectEvent(selEventId); return; }
        if (selKey) { selectDay(selKey); return; }
        editor.innerHTML = '<div class="dww-empty">点击某个日期，可查看 / 新建跨天任务。</div>';
      }
      renderAll();
      // wrap the whole month calendar in one big paper sheet (便签风)
      const calPaper = el("div", { class: "dww-paper dww-cal-note" });
      calPaper.style.setProperty("--na", "#eaf6f1");
      calPaper.style.setProperty("--nb", "#d3efe5");
      calPaper.style.setProperty("--nc", "#2fa96b");
      calPaper.style.setProperty("--nr", "-0.3deg");
      calPaper.append(head, grid, editor);
      wrap.append(calPaper);
      return wrap;
    }

    // ---------- floating draggable launcher ----------
    // A free-floating pill button (悬浮模式). Drag it anywhere; a short,
    // movement-free press is treated as a click that toggles all three cards.
    function mountFloatingLauncher(cards) {
      const POS_KEY = "dw:launcher:pos";
      const btn = el("button", {
        class: "dww-launcher",
        id: "dww-launcher",
        title: "点击：显示 / 隐藏小组件\n拖动：移动按钮位置",
        type: "button"
      }, [
        el("span", { class: "dww-launcher-icon", text: "🧩" }),
        el("span", { class: "dww-launcher-text", text: "小组件" })
      ]);

      // Position: restored from localStorage, clamped inside the viewport.
      function clamp(p) {
        const w = btn.offsetWidth || 96;
        const h = btn.offsetHeight || 40;
        const maxL = Math.max(0, window.innerWidth - w - 4);
        const maxT = Math.max(0, window.innerHeight - h - 4);
        return {
          left: Math.max(4, Math.min(p.left, maxL)),
          top: Math.max(4, Math.min(p.top, maxT))
        };
      }
      function defaultPos() {
        const w = btn.offsetWidth || 96;
        const h = btn.offsetHeight || 40;
        return { left: Math.max(8, window.innerWidth - w - 24), top: Math.max(8, window.innerHeight - h - 24) };
      }

      // Toggle state: when false, hide ALL cards together (overrides per-card hide).
      let shown = lsGet("dw:launcherShown", true);
      function apply() {
        btn.classList.toggle("dww-active", shown);
        cards.forEach((c) => {
          if (!shown) c.root.classList.add("dww-hidden");
          else c.root.classList.remove("dww-hidden");
        });
      }

      // Drag with click/tap discrimination
      let moved = false;
      btn.addEventListener("pointerdown", (e) => {
        moved = false;
        e.preventDefault();
        try { btn.setPointerCapture(e.pointerId); } catch (err) {}
        const sx = e.clientX, sy = e.clientY;
        const ox = btn.offsetLeft, oy = btn.offsetTop;
        const onMove = (ev) => {
          const dx = ev.clientX - sx, dy = ev.clientY - sy;
          if (!moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
            moved = true;
            btn.classList.add("dww-dragging");
          }
          if (!moved) return;
          const p = clamp({ left: ox + dx, top: oy + dy });
          btn.style.left = p.left + "px";
          btn.style.top = p.top + "px";
        };
        const onUp = () => {
          try { btn.releasePointerCapture(e.pointerId); } catch (err) {}
          btn.removeEventListener("pointermove", onMove);
          btn.removeEventListener("pointerup", onUp);
          btn.removeEventListener("pointercancel", onUp);
          btn.classList.remove("dww-dragging");
          if (moved) {
            lsSet(POS_KEY, { left: btn.offsetLeft, top: btn.offsetTop });
          } else {
            // treat as a click -> toggle
            shown = !shown;
            lsSet("dw:launcherShown", shown);
            apply();
          }
        };
        btn.addEventListener("pointermove", onMove);
        btn.addEventListener("pointerup", onUp);
        btn.addEventListener("pointercancel", onUp);
      });

      // Keep the button inside the viewport when the window resizes
      window.addEventListener("resize", () => {
        const p = clamp({ left: btn.offsetLeft, top: btn.offsetTop });
        btn.style.left = p.left + "px";
        btn.style.top = p.top + "px";
        lsSet(POS_KEY, p);
      });

      document.body.appendChild(btn);

      // Apply saved/default position now that the button has real dimensions
      let pos = lsGet(POS_KEY, null);
      if (!pos || typeof pos.left !== "number" || typeof pos.top !== "number") pos = defaultPos();
      pos = clamp(pos);
      btn.style.left = pos.left + "px";
      btn.style.top = pos.top + "px";

      apply();
      log("floating launcher mounted (draggable)");
      return btn;
    }

    // ---------- theme ----------
    let darkRoots = [];
    function applyTheme() {
      const dark = detectDark();
      darkRoots.forEach((r) => r.classList.toggle("dww-dark", dark));
    }
    function observeTheme() {
      const cb = () => applyTheme();
      try {
        new MutationObserver(cb).observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
        new MutationObserver(cb).observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
      } catch (e) {}
      if (window.matchMedia) {
        try { window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", cb); } catch (e) {}
      }
    }

    // ---------- boot ----------
    function whenReady(fn) {
      if (document.body) { fn(); return; }
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => fn(), { once: true });
      else { const t = setInterval(() => { if (document.body) { clearInterval(t); fn(); } }, 30); }
    }
    function boot() {
      if (window.__dww_booted) return;
      window.__dww_booted = true;
      injectStyles();
      log("boot: mounting floating desktop widgets");
      const defs = [
        { id: "schedule", title: "🗓 每日时间安排", defaultPos: { left: 24, top: 96 }, width: 340, defaultH: 480, body: scheduleBody() },
        { id: "goals", title: "🎯 目标设置", defaultPos: { left: 384, top: 96 }, width: 340, defaultH: 380, body: goalsBody() },
        { id: "calendar", title: "📆 日期规划", defaultPos: { left: 24, top: 602 }, width: 340, defaultH: 480, body: calendarBody() }
      ];
      const cards = defs.map((c) => {
        const shell = makeCard(c);
        shell.body.appendChild(c.body);
        return shell;
      });
      mountFloatingLauncher(cards);
      darkRoots = cards.map(c => c.root);
      applyTheme();
      observeTheme();
      log("boot done: " + cards.length + " widgets mounted");
    }
    function apply(ctx) {
      try { whenReady(boot); } catch (e) { console.warn(TAG, "apply error", e); }
    }
    exports.apply = apply;
    exports.inject = [];
    return module.exports;
  }
});