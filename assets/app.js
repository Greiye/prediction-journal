/* Prediction Journal: static viewer for Markdown entries with YAML frontmatter. */
(() => {
  "use strict";

  const LANES = {
    world:  { label: "World",   color: "--world" },
    circle: { label: "Circle",  color: "--circle" },
    me:     { label: "Me",      color: "--me" },
    whatif: { label: "What if", color: "--whatif" },
  };
  const SCORE_VALUE = { hit: 1, partial: 0.5, miss: 0 };
  const app = document.getElementById("app");
  let ENTRIES = [];

  // ---------- helpers ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const str = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v == null ? "" : String(v));

  function parseDate(v) {
    const s = str(v).trim();
    const m = s.match(/^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?/);
    if (!m) return null;
    return new Date(Date.UTC(+m[1], m[2] ? +m[2] - 1 : 0, m[3] ? +m[3] : 1));
  }
  const monthsBetween = (a, b) => Math.round((b - a) / (1000 * 60 * 60 * 24 * 30.44));
  const fmtLag = (mo) => (mo < 12 ? `${mo} mo` : `${(mo / 12).toFixed(mo % 12 ? 1 : 0)} yr`);
  function fmtDate(v) {
    const s = str(v);
    const d = parseDate(s);
    if (!d) return s;
    const parts = s.split("-").length;
    const opts = parts >= 3 ? { year: "numeric", month: "short", day: "numeric" } : parts === 2 ? { year: "numeric", month: "short" } : { year: "numeric" };
    return d.toLocaleDateString(undefined, { ...opts, timeZone: "UTC" });
  }

  function splitFrontmatter(text) {
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!m) return { meta: {}, body: text };
    let meta = {};
    try { meta = jsyaml.load(m[1]) || {}; } catch (e) { console.warn("YAML error", e); }
    return { meta, body: m[2] };
  }

  function wrap(text, max) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length > max && cur) { lines.push(cur); cur = w; }
      else cur = (cur + " " + w).trim();
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 3);
  }

  function download(name, content, type = "text/markdown") {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ---------- data ----------
  async function loadEntries() {
    const res = await fetch("entries/manifest.json", { cache: "no-store" });
    const files = await res.json();
    const out = await Promise.all(files.map(async (file) => {
      const raw = await (await fetch("entries/" + file, { cache: "no-store" })).text();
      const { meta, body } = splitFrontmatter(raw);
      return { file, raw, meta, body, id: str(meta.id || file.replace(/\.md$/, "")) };
    }));
    return out.sort((a, b) => (parseDate(b.meta.date_noticed) || 0) - (parseDate(a.meta.date_noticed) || 0));
  }

  // ---------- timeline ----------
  function renderTimeline(meta, width) {
    const events = (meta.events || []).filter((e) => parseDate(e.date)).map((e) => ({ ...e, d: parseDate(e.date), lane: (e.lane || "me").toLowerCase() }));
    const forks = (meta.forks || []).filter((f) => parseDate(f.date)).map((f) => ({ ...f, d: parseDate(f.date) }));
    const review = parseDate(meta.review_on);
    const now = new Date();
    const dates = [...events.map((e) => e.d), ...forks.map((f) => f.d), now];
    if (review) dates.push(review);
    if (!events.length && !forks.length) return { svg: `<div class="empty">No events yet. Add <code>events:</code> to the frontmatter.</div>`, lag: [] };

    const min = new Date(Math.min(...dates)); min.setUTCMonth(min.getUTCMonth() - 4);
    const max = new Date(Math.max(...dates)); max.setUTCMonth(max.getUTCMonth() + 8);

    const laneKeys = ["world", "circle", "me"];
    if (forks.length) laneKeys.push("whatif");
    const W = Math.max(width, 760), padL = 96, padR = 28, top = 56, laneH = 108;
    const H = top + laneKeys.length * laneH + (forks.length ? 30 : 12);
    const x = (d) => padL + ((d - min) / (max - min)) * (W - padL - padR);
    const laneY = (k) => top + laneKeys.indexOf(k) * laneH + laneH / 2;
    const col = (k) => cssVar(LANES[k].color);
    const parts = [];
    const endX = x(new Date(Math.max(...dates)));

    // year grid
    for (let y = min.getUTCFullYear(); y <= max.getUTCFullYear() + 1; y++) {
      const d = new Date(Date.UTC(y, 0, 1));
      if (d < min || d > max) continue;
      const xx = x(d);
      parts.push(`<line class="tl-grid" x1="${xx}" x2="${xx}" y1="${top - 8}" y2="${H - 8}"/>`);
      parts.push(`<text class="tl-axis" x="${xx + 4}" y="${top - 30}">${y}</text>`);
    }

    // lanes
    laneKeys.forEach((k) => {
      const y = laneY(k);
      const c = col(k);
      parts.push(`<rect x="0" y="${y - laneH / 2 + 4}" width="${W}" height="${laneH - 8}" fill="${c}" opacity="0.045" rx="10"/>`);
      parts.push(`<text class="tl-lane-label" x="16" y="${y + 4}" fill="${c}" style="fill:${c}">${LANES[k].label}</text>`);
      if (k !== "whatif") {
        const laneEvents = events.filter((e) => e.lane === k);
        if (laneEvents.length) {
          const x0 = x(new Date(Math.min(...laneEvents.map((e) => e.d))));
          parts.push(`<line x1="${x0}" x2="${endX}" y1="${y}" y2="${y}" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>`);
        }
      }
    });

    // today
    parts.push(`<line class="tl-now" x1="${x(now)}" x2="${x(now)}" y1="${top - 8}" y2="${H - 8}"/>`);
    parts.push(`<text class="tl-sub" x="${x(now) + 4}" y="${H - 12}">Today</text>`);

    // forks
    forks.forEach((f) => {
      const fx = x(f.d), my = laneY("me"), wy = laneY("whatif"), c = col("whatif"), mc = col("me");
      const end = endX;
      parts.push(`<path d="M${fx},${my} C${fx + 40},${my} ${fx + 30},${wy} ${fx + 80},${wy} L${end},${wy}" fill="none" stroke="${c}" stroke-width="2.5" stroke-dasharray="6 5"/>`);
      parts.push(`<rect x="${fx - 7}" y="${my - 7}" width="14" height="14" transform="rotate(45 ${fx} ${my})" fill="var(--surface)" stroke="${mc}" stroke-width="2.5"><title>${esc(f.question)}</title></rect>`);
      const ql = wrap(f.question, 30).slice(0, 2);
      ql.forEach((ln, i) => parts.push(`<text class="tl-label" font-weight="600" x="${fx + 12}" y="${my - 14 - (f.taken ? 14 : 0) - (ql.length - 1 - i) * 14}">${esc(ln)}</text>`));
      const altLines = [...wrap(f.alt, 30), ...wrap(f.alt_outcome ? "→ " + f.alt_outcome : "", 34)];
      altLines.slice(0, 4).forEach((ln, i) => parts.push(`<text class="${i < wrap(f.alt, 30).length ? "tl-label" : "tl-sub"}" x="${Math.min(fx + 90, W - 230)}" y="${wy + 22 + i * 14}">${esc(ln)}</text>`));
      parts.push(`<circle cx="${end}" cy="${wy}" r="5" fill="var(--surface)" stroke="${c}" stroke-width="2.5" stroke-dasharray="2 2"/>`);
      if (f.taken) parts.push(`<text class="tl-sub" x="${fx + 12}" y="${my - 12}">${esc("Taken: " + f.taken)}</text>`);
    });

    // events, with simple collision handling per lane (alternate above / below)
    const slots = {};
    events.sort((a, b) => a.d - b.d).forEach((e) => {
      const ex = x(e.d), y = laneY(e.lane), c = col(e.lane in LANES ? e.lane : "me");
      const lines = wrap(e.label, 24);
      const wpx = Math.max(...lines.map((l) => l.length)) * 6.6 + 10;
      const s = (slots[e.lane] ||= { above: -1e9, below: -1e9 });
      const forkHere = forks.some((f) => e.lane === "me" && Math.abs(x(f.d) - ex) < wpx);
      let pos = "above";
      if (ex < s.above || (forkHere && ex >= s.below)) pos = "below";
      if (pos === "below" && ex < s.below) pos = "above";
      s[pos] = ex + wpx;
      const ty = pos === "above" ? y - 16 - (lines.length - 1) * 14 : y + 24;
      const dateY = pos === "above" ? ty - 14 : ty + lines.length * 14;
      parts.push(`<g class="tl-event"><title>${esc(fmtDate(e.date))}${e.approx ? " (approx.)" : ""}: ${esc(e.label)}</title>`);
      parts.push(`<circle cx="${ex}" cy="${y}" r="6.5" fill="${e.approx ? "var(--surface)" : c}" stroke="${c}" stroke-width="2.5" ${e.approx ? 'stroke-dasharray="3 2"' : ""}/>`);
      lines.forEach((ln, i) => parts.push(`<text class="tl-label" x="${ex - 4}" y="${ty + i * 14}">${esc(ln)}</text>`));
      parts.push(`<text class="tl-sub" x="${ex - 4}" y="${dateY}">${esc(fmtDate(e.date))}${e.approx ? " ~" : ""}</text></g>`);
    });

    // review flag
    if (review) {
      const rx = x(review), y = laneY("me");
      parts.push(`<g><title>Review on ${esc(fmtDate(meta.review_on))}</title><path d="M${rx},${y - 8} L${rx},${y + 30} L${rx + 14},${y + 25} L${rx},${y + 20}" fill="${col("me")}" stroke="${col("me")}" stroke-width="2" stroke-linejoin="round"/><text class="tl-sub" x="${rx + 18}" y="${y + 29}">Review ${esc(fmtDate(meta.review_on))}</text></g>`);
    }

    // lag
    const first = (k) => events.filter((e) => e.lane === k).map((e) => e.d).sort((a, b) => a - b)[0];
    const last = (k) => events.filter((e) => e.lane === k).map((e) => e.d).sort((a, b) => b - a)[0];
    const lag = [];
    if (first("world") && first("me") && first("world") < first("me")) lag.push(["World → Me", monthsBetween(first("world"), first("me"))]);
    if (first("me") && last("circle") && first("me") < last("circle")) lag.push(["Me → Circle", monthsBetween(first("me"), last("circle"))]);

    return { svg: `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Timeline for ${esc(meta.title)}">${parts.join("")}</svg>`, lag };
  }

  // ---------- calibration ----------
  function renderCalibration(entries) {
    const scored = entries.filter((e) => typeof e.meta.confidence === "number" && e.meta.score in SCORE_VALUE);
    if (scored.length < 3) {
      return `<div class="empty">Calibration appears after 3+ entries have both <code>confidence</code> and a <code>score</code> (hit / partial / miss). ${scored.length} so far.</div>`;
    }
    const buckets = {};
    scored.forEach((e) => {
      const b = Math.min(9, Math.floor(e.meta.confidence / 10));
      (buckets[b] ||= []).push(SCORE_VALUE[e.meta.score]);
    });
    const S = 300, p = 36, sc = (v) => p + v * (S - 2 * p);
    let g = `<line x1="${sc(0)}" y1="${S - sc(0)}" x2="${sc(1)}" y2="${S - sc(1)}" stroke="var(--grid)" stroke-width="2" stroke-dasharray="4 4"/>`;
    g += `<line x1="${p}" y1="${S - p}" x2="${S - p}" y2="${S - p}" stroke="var(--border)"/><line x1="${p}" y1="${p}" x2="${p}" y2="${S - p}" stroke="var(--border)"/>`;
    [0, 0.5, 1].forEach((t) => {
      g += `<text class="tl-axis" x="${sc(t)}" y="${S - p + 16}" text-anchor="middle">${t * 100}%</text>`;
      g += `<text class="tl-axis" x="${p - 6}" y="${S - sc(t) + 4}" text-anchor="end">${t * 100}%</text>`;
    });
    Object.entries(buckets).forEach(([b, vals]) => {
      const cx = sc((+b * 10 + 5) / 100), rate = vals.reduce((a, v) => a + v, 0) / vals.length;
      g += `<circle cx="${cx}" cy="${S - sc(rate)}" r="${5 + Math.sqrt(vals.length) * 2}" fill="var(--accent)" opacity=".85"><title>${b * 10}-${b * 10 + 9}% confidence: ${Math.round(rate * 100)}% right (n=${vals.length})</title></circle>`;
    });
    g += `<text class="tl-sub" x="${S / 2}" y="${S - 4}" text-anchor="middle">Stated confidence</text>`;
    g += `<text class="tl-sub" transform="translate(10 ${S / 2}) rotate(-90)" text-anchor="middle">Actually right</text>`;
    return `<svg viewBox="0 0 ${S} ${S}" role="img" aria-label="Calibration chart">${g}</svg><p class="muted" style="font-size:13px">On the dashed line = well calibrated. Below it = overconfident.</p>`;
  }

  // ---------- views ----------
  const scoreBadge = (s) => `<span class="badge ${esc(s || "open")}">${esc((s || "open").replace(/^./, (c) => c.toUpperCase()))}</span>`;
  const badges = (m) => `<div class="badges">${scoreBadge(m.score)}${m.domain ? `<span class="badge">${esc(m.domain)}</span>` : ""}${typeof m.confidence === "number" ? `<span class="badge">${m.confidence}% sure</span>` : ""}${m.private ? `<span class="badge">Private</span>` : ""}</div>`;

  function viewHome() {
    const scored = ENTRIES.filter((e) => e.meta.score in SCORE_VALUE);
    const hitRate = scored.length ? Math.round((scored.reduce((a, e) => a + SCORE_VALUE[e.meta.score], 0) / scored.length) * 100) + "%" : "–";
    const open = ENTRIES.filter((e) => !(e.meta.score in SCORE_VALUE)).length;
    const nextReview = ENTRIES.map((e) => parseDate(e.meta.review_on)).filter((d) => d && d >= new Date()).sort((a, b) => a - b)[0];
    app.innerHTML = `
      <h1>Prediction Journal</h1>
      <p class="lead">What I noticed, what I predicted, what I did, and how it turned out.</p>
      <section class="stats">
        <div class="card stat"><div class="k">Entries</div><div class="v">${ENTRIES.length}</div></div>
        <div class="card stat"><div class="k">Hit rate</div><div class="v">${hitRate}</div></div>
        <div class="card stat"><div class="k">Open</div><div class="v">${open}</div></div>
        <div class="card stat"><div class="k">Next review</div><div class="v" style="font-size:20px;padding-top:6px">${nextReview ? fmtDate(nextReview.toISOString().slice(0, 10)) : "–"}</div></div>
      </section>
      <h2>Entries</h2>
      <section class="entries">
        ${ENTRIES.map((e) => `
          <a class="card entry-card" href="#/entry/${encodeURIComponent(e.id)}">
            <div class="num">#${esc(e.id)}</div>
            <div><div class="t">${esc(e.meta.title || e.file)}</div><div class="c">${esc(e.meta.claim || "")}</div></div>
            <div>${badges(e.meta)}<div class="muted" style="font-size:12px;margin-top:6px;text-align:right">${esc(fmtDate(e.meta.date_noticed))}</div></div>
          </a>`).join("") || `<div class="card empty">No entries yet.</div>`}
      </section>
      <h2>Calibration</h2>
      <section class="card calib">${renderCalibration(ENTRIES)}</section>`;
  }

  function viewEntry(id) {
    const e = ENTRIES.find((x) => x.id === id);
    if (!e) { app.innerHTML = `<a class="back" href="#/">← All entries</a><div class="card empty">Entry not found.</div>`; return; }
    const m = e.meta;
    const body = e.body.replace(/```mermaid[\s\S]*?```/g, "");
    app.innerHTML = `
      <a class="back" href="#/">← All entries</a>
      <div class="entry-head">
        <div>
          <div class="muted" style="font-family:'JetBrains Mono',monospace;font-size:13px">#${esc(e.id)} · noticed ${esc(fmtDate(m.date_noticed))}</div>
          <h1>${esc(m.title || e.file)}</h1>
          ${m.claim ? `<p class="lead" style="margin-bottom:10px">“${esc(m.claim)}”${m.timeframe ? ` <span class="muted">${/^(by|in|within|before|after)\b/i.test(m.timeframe) ? "" : "within "}${esc(m.timeframe)}</span>` : ""}</p>` : ""}
          ${badges(m)}
        </div>
        <button class="btn ghost" id="dl-md" type="button">Download .md</button>
      </div>
      <section class="card timeline-card">
        <div class="timeline-scroll" id="tl"></div>
        <div class="legend">
          <span><i style="color:var(--world);border-color:var(--world)"></i>World</span>
          <span><i style="color:var(--circle);border-color:var(--circle)"></i>Circle</span>
          <span><i style="color:var(--me);border-color:var(--me)"></i>Me</span>
          <span><i class="dash" style="border-color:var(--whatif)"></i>Path not taken</span>
          <span><i class="dot" style="border-color:var(--muted);border-style:dashed"></i>Approx. date</span>
        </div>
        <div class="lag" id="lag"></div>
      </section>
      <article class="prose">${marked.parse(body)}</article>`;
    const draw = () => {
      const host = document.getElementById("tl");
      if (!host) return;
      const { svg, lag } = renderTimeline(m, host.clientWidth);
      host.innerHTML = svg;
      document.getElementById("lag").innerHTML = lag.map(([k, mo]) => `<span class="pill">${esc(k)}: <b>${fmtLag(mo)}</b></span>`).join("");
    };
    draw();
    window.onresize = draw;
    document.getElementById("dl-md").onclick = () => download(e.file, e.raw);
  }

  async function exportVault() {
    const zip = new JSZip();
    const root = zip.folder("Prediction Journal");
    ENTRIES.forEach((e) => root.folder("Entries").file(e.file.replace(/^private\//, "Private/"), e.raw));
    try {
      const tpl = await (await fetch("templates/prediction.md")).text();
      root.folder("Templates").file("prediction.md", tpl);
    } catch (_) { /* template optional */ }
    root.file("README.md", "# Prediction Journal\n\nOpen this folder in Obsidian as a vault.\n\nNew entry: Settings → Core plugins → Templates → set template folder to `Templates`, then run *Templates: Insert template* → `prediction`.\n");
    download("prediction-journal-vault.zip", await zip.generateAsync({ type: "blob" }));
  }

  function route() {
    const m = location.hash.match(/^#\/entry\/(.+)$/);
    window.onresize = null;
    if (m) viewEntry(decodeURIComponent(m[1])); else viewHome();
    window.scrollTo(0, 0);
  }

  document.getElementById("export-vault").onclick = exportVault;
  loadEntries().then((list) => { ENTRIES = list; route(); window.addEventListener("hashchange", route); })
    .catch((err) => { app.innerHTML = `<div class="card empty">Could not load entries (${esc(err.message)}). Serve the folder over HTTP, not file://.</div>`; });
})();
