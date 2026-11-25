/* Prediction Journal: pop-up entry form. Builds a Markdown entry (YAML frontmatter + body) in the browser.
   Nothing is uploaded: output is a local draft, a .md download, clipboard, or (public entries only) GitHub's new-file page. */
(() => {
  "use strict";

  const REPO = "Greiye/prediction-journal";
  const DOMAINS = ["", "tech", "market", "career", "health", "relationships", "place"];
  const LANES = ["world", "circle", "me"];
  const ROWS = {
    events:  [["date", "YYYY-MM", "text"], ["lane", "", LANES], ["label", "What happened", "text"], ["approx", "Approx.", "check"]],
    forks:   [["date", "YYYY-MM", "text"], ["question", "Decision", "text"], ["taken", "What I did", "text"], ["alt", "Alternative", "text"], ["alt_outcome", "Likely result of alt", "text"]],
    signals: [["date", "YYYY-MM", "text"], ["label", "Signal", "text"], ["source", "Source", "text"], ["acted", "Acted on it", "check"]],
  };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const str = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v == null ? "" : String(v));
  const today = () => new Date().toISOString().slice(0, 10);
  const slug = (s) => String(s || "entry").toLowerCase().replace(/^backtest:\s*/, "backtest ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "entry";
  const TEMPLATE_BODY = {};

  async function templateBody(type) {
    if (TEMPLATE_BODY[type] != null) return TEMPLATE_BODY[type];
    try {
      const raw = await (await fetch(`templates/${type === "backtest" ? "backtest" : "prediction"}.md`, { cache: "no-store" })).text();
      TEMPLATE_BODY[type] = raw.replace(/^---[\s\S]*?\n---\r?\n?/, "").trim();
    } catch (_) { TEMPLATE_BODY[type] = ""; }
    return TEMPLATE_BODY[type];
  }

  // ---------- dialog markup ----------
  function rowHtml(kind, data = {}) {
    const cells = ROWS[kind].map(([k, ph, t]) => {
      const v = data[k];
      if (t === "check") return `<label class="f-check"><input type="checkbox" data-k="${k}" ${v ? "checked" : ""}> ${esc(ph)}</label>`;
      if (Array.isArray(t)) return `<select data-k="${k}" aria-label="${k}">${t.map((o) => `<option ${o === (v || "me") ? "selected" : ""}>${o}</option>`).join("")}</select>`;
      return `<input type="text" data-k="${k}" placeholder="${esc(ph)}" aria-label="${esc(ph || k)}" value="${esc(str(v))}" class="${k === "date" ? "f-date" : ""}">`;
    }).join("");
    return `<div class="f-row f-row-${kind}" data-row="${kind}">${cells}<button type="button" class="f-x" title="Remove" aria-label="Remove row">×</button></div>`;
  }

  function dialogHtml() {
    return `
    <dialog id="entry-dialog" class="f-dialog">
      <form method="dialog" id="entry-form" novalidate>
        <header class="f-head">
          <h2 id="f-title">New entry</h2>
          <div class="f-seg" role="radiogroup" aria-label="Entry type">
            <label><input type="radio" name="type" value="prediction" checked> Prediction</label>
            <label><input type="radio" name="type" value="backtest"> Backtest</label>
          </div>
          <button type="button" class="f-x f-close" aria-label="Close">×</button>
        </header>
        <div class="f-body">
          <label class="f-private"><input type="checkbox" name="private"> <span><b>Private</b>: names people or my employer. Saved to <code>entries/private/</code> and never published.</span></label>

          <div class="f-grid">
            <label class="f-id" title="Skips IDs listed in entries/reserved-ids.json (used by private entries).">ID<input name="id" required></label>
            <label class="f-span">Title<input name="title" required placeholder="e.g. Discovering AI (ChatGPT 3.5)"></label>
            <label><span class="f-bt-only">Date run</span><span class="f-pr-only">Date noticed</span><input name="date_noticed" placeholder="YYYY-MM-DD"></label>
            <label>Domain<select name="domain">${DOMAINS.map((d) => `<option value="${d}">${d || "—"}</option>`).join("")}</select></label>
            <label class="f-bt-only">Cutoff date<input name="cutoff" placeholder="YYYY-MM-DD (freeze date)"></label>
            <label class="f-bt-only">Replays entry<select name="backtest_of"></select></label>
            <label class="f-full"><span class="f-pr-only">Prediction (one falsifiable sentence)</span><span class="f-bt-only">Blind prediction, as of the cutoff</span><input name="claim"></label>
            <label>Timeframe<input name="timeframe" placeholder="e.g. 18 months"></label>
            <label>Confidence <output name="conf_out">–</output><input name="confidence" type="range" min="0" max="100" step="5"></label>
            <label>Score<select name="score"><option>open</option><option>hit</option><option>partial</option><option>miss</option></select></label>
            <label class="f-pr-only">Review on<input name="review_on" type="date"></label>
          </div>
          <p class="f-hint f-bt-only">Lookahead guard: fill the blind prediction and confidence using only what you knew before the cutoff. Score it after.</p>

          <fieldset><legend>Timeline events</legend><p class="f-hint">Lanes: <b>world</b> (news, launches), <b>circle</b> (friends, family), <b>me</b>. Dates can be YYYY, YYYY-MM or YYYY-MM-DD.</p>
            <div class="f-rows" data-rows="events"></div><button type="button" class="btn ghost f-add" data-add="events">+ Event</button></fieldset>

          <fieldset class="f-pr-only"><legend>Decision forks</legend><p class="f-hint">A point where you chose one path. The alternative is drawn as the "What if" lane.</p>
            <div class="f-rows" data-rows="forks"></div><button type="button" class="btn ghost f-add" data-add="forks">+ Fork</button></fieldset>

          <fieldset class="f-bt-only"><legend>Signals before the cutoff</legend><p class="f-hint">Things you could see at the time. Tick "Acted on it" only if you did something.</p>
            <div class="f-rows" data-rows="signals"></div><button type="button" class="btn ghost f-add" data-add="signals">+ Signal</button></fieldset>

          <label class="f-bt-only f-block">Rules extracted <span class="f-hint">(one per line)</span><textarea name="rules" rows="3" placeholder="If a tool I use daily gets 100M users, research public suppliers within a week"></textarea></label>

          <label class="f-block">Notes <span class="f-hint">(Markdown; template sections pre-filled)</span><textarea name="body" rows="14" spellcheck="true"></textarea></label>
        </div>
        <footer class="f-foot">
          <span class="f-status" role="status"></span>
          <button type="button" class="btn ghost" data-act="copy">Copy .md</button>
          <button type="button" class="btn ghost" data-act="download">Download .md</button>
          <button type="button" class="btn ghost" data-act="github" title="Opens GitHub's new-file page with this entry filled in">Publish on GitHub</button>
          <button type="button" class="btn" data-act="preview">Save draft &amp; preview</button>
        </footer>
      </form>
    </dialog>`;
  }

  // ---------- build markdown ----------
  function collect(form) {
    const f = form.elements;
    const type = f.type.value;
    const rows = (kind) => [...form.querySelectorAll(`[data-row="${kind}"]`)].map((r) => {
      const o = {};
      r.querySelectorAll("[data-k]").forEach((el) => {
        const k = el.dataset.k;
        if (el.type === "checkbox") { if (el.checked || kind === "signals") o[k] = el.checked; }
        else if (el.value.trim()) o[k] = el.value.trim();
      });
      return o;
    }).filter((o) => o.label || o.question);

    const m = {};
    m.id = f.id.value.trim();
    if (type === "backtest") m.type = "backtest";
    if (type === "backtest" && f.backtest_of.value) m.backtest_of = f.backtest_of.value;
    m.title = f.title.value.trim();
    m.date_noticed = f.date_noticed.value.trim();
    if (type === "backtest") m.cutoff = f.cutoff.value.trim();
    if (f.domain.value) m.domain = f.domain.value;
    m.claim = f.claim.value.trim();
    m.timeframe = f.timeframe.value.trim();
    if (f.confidence.dataset.set) m.confidence = +f.confidence.value;
    m.score = f.score.value;
    if (type !== "backtest" && f.review_on.value) m.review_on = f.review_on.value;
    m.tags = type === "backtest" ? ["backtest"] : ["prediction"];
    const ev = rows("events"); if (ev.length) m.events = ev;
    if (type !== "backtest") { const fk = rows("forks"); if (fk.length) m.forks = fk; }
    if (type === "backtest") {
      const sg = rows("signals"); if (sg.length) m.signals = sg;
      const rl = f.rules.value.split("\n").map((s) => s.trim()).filter(Boolean); if (rl.length) m.rules = rl;
    }
    Object.keys(m).forEach((k) => { if (m[k] === "") delete m[k]; });
    const isPrivate = f.private.checked;
    const base = form.dataset.file && !form.dataset.file.startsWith("draft:") ? form.dataset.file.replace(/^private\//, "") : `${m.id}-${slug(m.title)}.md`;
    const file = (isPrivate ? "private/" : "") + base;
    const yaml = jsyaml.dump(m, { lineWidth: -1, noRefs: true, flowLevel: 2 });
    const raw = `---\n${yaml}---\n\n${f.body.value.trim()}\n`;
    return { meta: m, file, raw, isPrivate, valid: !!(m.id && m.title) };
  }

  // ---------- controller ----------
  let ctx = null; // { entries, onDraft }

  function setType(form, type) {
    form.dataset.type = type;
    form.elements.type.value = type;
  }

  function addRow(form, kind, data) {
    form.querySelector(`[data-rows="${kind}"]`).insertAdjacentHTML("beforeend", rowHtml(kind, data));
  }

  // IDs used by private entries (not on the site). Numbers only, kept in entries/reserved-ids.json.
  let RESERVED = [];
  fetch("entries/reserved-ids.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])).then((ids) => { RESERVED = (ids || []).map(String); }).catch(() => {});

  function nextId(entries) {
    const n = Math.max(0, ...[...entries.map((e) => e.id), ...RESERVED].map((x) => parseInt(x, 10)).filter((x) => !isNaN(x)));
    return String(n + 1).padStart(3, "0");
  }

  async function fillBody(form, type, title, id) {
    const body = await templateBody(type);
    form.elements.body.value = body.replace(/NNN/g, id || "NNN").replace(/\{\{title\}\}/g, String(title || "").replace(/^Backtest:\s*/i, "")).replace(/\{\{date:[^}]+\}\}/g, today());
    form.dataset.bodyTouched = "";
  }

  async function open(opts = {}) {
    const dlg = document.getElementById("entry-dialog");
    const form = dlg.querySelector("form");
    const entries = ctx.entries();
    const src = opts.entry;
    const m = src ? src.meta : {};
    const type = opts.type || (m.type === "backtest" ? "backtest" : "prediction");
    form.reset();
    form.querySelectorAll(".f-rows").forEach((el) => (el.innerHTML = ""));
    form.dataset.file = src ? src.file : "";
    form.dataset.published = src && !src.draft ? "1" : "";
    form.querySelector("#f-title").textContent = src ? `Edit #${src.id}` : "New entry";
    setType(form, type);
    const f = form.elements;
    f.backtest_of.innerHTML = `<option value="">—</option>` + entries.filter((e) => e.meta.type !== "backtest").map((e) => `<option value="${esc(e.id)}">#${esc(e.id)} ${esc(e.meta.title || "")}</option>`).join("");

    f.private.checked = !!(src && (src.file.startsWith("private/") || m.private));
    f.id.value = src ? src.id : nextId(entries);
    f.title.value = str(m.title) || (type === "backtest" && opts.backtestOf ? `Backtest: ${str(entries.find((e) => e.id === opts.backtestOf)?.meta.title)}` : "");
    f.date_noticed.value = str(m.date_noticed) || today();
    f.domain.value = str(m.domain);
    f.cutoff.value = str(m.cutoff);
    f.backtest_of.value = str(m.backtest_of || opts.backtestOf || "");
    f.claim.value = str(m.claim);
    f.timeframe.value = str(m.timeframe);
    if (typeof m.confidence === "number") { f.confidence.value = m.confidence; f.confidence.dataset.set = "1"; f.conf_out.value = m.confidence + "%"; }
    else { f.confidence.value = 50; delete f.confidence.dataset.set; f.conf_out.value = "–"; }
    f.score.value = str(m.score) || "open";
    f.review_on.value = /^\d{4}-\d{2}-\d{2}$/.test(str(m.review_on)) ? str(m.review_on) : "";
    f.rules.value = (m.rules || []).join("\n");
    (m.events || []).forEach((e) => addRow(form, "events", e));
    (m.forks || []).forEach((e) => addRow(form, "forks", e));
    (m.signals || []).forEach((e) => addRow(form, "signals", e));
    ["events", "forks", "signals"].forEach((k) => { if (!form.querySelector(`[data-row="${k}"]`)) addRow(form, k, {}); });
    if (src) { f.body.value = src.body.trim(); form.dataset.bodyTouched = "1"; }
    else await fillBody(form, type, f.title.value, f.id.value);
    status(form, "");
    dlg.showModal();
    f.title.focus();
  }

  function status(form, msg, bad) {
    const el = form.querySelector(".f-status");
    el.textContent = msg;
    el.classList.toggle("bad", !!bad);
  }

  function wire() {
    document.body.insertAdjacentHTML("beforeend", dialogHtml());
    const dlg = document.getElementById("entry-dialog");
    const form = dlg.querySelector("form");
    const f = form.elements;

    form.addEventListener("click", async (ev) => {
      const t = ev.target;
      if (t.closest(".f-close")) { dlg.close(); return; }
      if (t.matches(".f-row .f-x")) { t.parentElement.remove(); return; }
      if (t.dataset.add) { addRow(form, t.dataset.add, {}); form.querySelector(`[data-rows="${t.dataset.add}"]`).lastElementChild.querySelector("input").focus(); return; }
      const act = t.dataset.act;
      if (!act) return;
      const out = collect(form);
      if (!out.valid) { status(form, "ID and title are required.", true); return; }
      if (act === "download") { ctx.download(out.file.split("/").pop(), out.raw); status(form, `Downloaded. Save it to entries/${out.file}`); }
      if (act === "copy") {
        try { await navigator.clipboard.writeText(out.raw); status(form, "Copied."); } catch (_) { status(form, "Clipboard blocked. Use Download.", true); }
      }
      if (act === "github") {
        if (out.isPrivate) { status(form, "Private entries never go to GitHub. Use Download and keep it in your vault.", true); return; }
        const existing = form.dataset.file && !form.dataset.file.startsWith("private/") && out.file === form.dataset.file && form.dataset.published;
        if (existing) {
          try { await navigator.clipboard.writeText(out.raw); } catch (_) { /* ignore */ }
          window.open(`https://github.com/${REPO}/edit/main/entries/${out.file}`, "_blank", "noopener");
          status(form, "Copied. On GitHub, select all, paste, then Commit changes.");
          return;
        }
        const url = `https://github.com/${REPO}/new/main?filename=${encodeURIComponent("entries/" + out.file)}&value=${encodeURIComponent(out.raw)}`;
        if (url.length > 7500) {
          try { await navigator.clipboard.writeText(out.raw); } catch (_) { /* ignore */ }
          window.open(`https://github.com/${REPO}/new/main?filename=${encodeURIComponent("entries/" + out.file)}`, "_blank", "noopener");
          status(form, "Entry is long: copied to clipboard. Paste it into GitHub, then Commit.");
        } else {
          window.open(url, "_blank", "noopener");
          status(form, "Opened GitHub. Review, then Commit changes.");
        }
      }
      if (act === "preview") { const id = ctx.saveDraft(out); dlg.close(); location.hash = "#/entry/" + encodeURIComponent(id); }
    });

    form.addEventListener("change", async (ev) => {
      if (ev.target.name === "type") {
        setType(form, ev.target.value);
        if (!form.dataset.bodyTouched) await fillBody(form, ev.target.value, f.title.value, f.id.value);
      }
    });
    form.addEventListener("input", (ev) => {
      if (ev.target.name === "confidence") { f.confidence.dataset.set = "1"; f.conf_out.value = f.confidence.value + "%"; }
      if (ev.target.name === "body") form.dataset.bodyTouched = "1";
      if ((ev.target.name === "title" || ev.target.name === "id") && !form.dataset.bodyTouched) {
        const id = f.id.value, title = f.title.value;
        templateBody(form.dataset.type).then((b) => {
          if (!form.dataset.bodyTouched) f.body.value = b.replace(/NNN/g, id || "NNN").replace(/\{\{title\}\}/g, title.replace(/^Backtest:\s*/i, "")).replace(/\{\{date:[^}]+\}\}/g, today());
        });
      }
    });
    dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
  }

  window.EntryForm = {
    init(c) { ctx = c; wire(); },
    open,
  };
})();
