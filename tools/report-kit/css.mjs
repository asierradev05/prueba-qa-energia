// Hoja de estilo corporativa de los informes de QA (BiaEnergy / EnergIA).
// Diseño oscuro como el producto, con menta #08ddbc como acento.
// Autocontenida (sin recursos externos) para que cada .html sea portable.

import { theme } from './theme.mjs';

export const baseCss = `
:root {
  color-scheme: dark;
  --paper: ${theme.paper};
  --paper-soft: ${theme.paperSoft};
  --sheet: ${theme.sheet};
  --sheet-alt: ${theme.sheetAlt};
  --ink: ${theme.ink};
  --ink-muted: ${theme.inkMuted};
  --ink-faint: ${theme.inkFaint};
  --form: ${theme.form};
  --form-strong: ${theme.formStrong};
  --form-wash: ${theme.formWash};
  --rule: ${theme.rule};
  --rule-strong: ${theme.ruleStrong};
  --greenbar: ${theme.greenbar};
  --critical: ${theme.critical};
  --critical-wash: ${theme.criticalWash};
  --alert: ${theme.alert};
  --alert-wash: ${theme.alertWash};
  --ok: ${theme.ok};
  --ok-wash: ${theme.okWash};
  --info: ${theme.info};
  --info-wash: ${theme.infoWash};
  --sidebar-w: 292px;
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', 'Cascadia Code', Consolas, monospace;
}
* { box-sizing: border-box; }
html { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--paper);
  background-image: radial-gradient(70rem 28rem at 70% -10rem, rgb(8 221 188 / 0.07), transparent 70%);
  background-repeat: no-repeat;
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 15.5px;
  line-height: 1.65;
}
a { color: var(--form); text-decoration: none; text-underline-offset: 3px; }
a:hover { text-decoration: underline; text-decoration-color: var(--form-strong); }
:focus-visible { outline: 2px solid var(--form); outline-offset: 2px; border-radius: 6px; }
::selection { background: var(--form); color: var(--paper); }
*::-webkit-scrollbar { width: 10px; height: 10px; }
*::-webkit-scrollbar-thumb { background: var(--rule-strong); border-radius: 8px; }
*::-webkit-scrollbar-track { background: transparent; }

/* ---------- Layout ---------- */
.layout { display: grid; grid-template-columns: var(--sidebar-w) minmax(0, 1fr); min-height: 100vh; }

/* ---------- Sidebar ---------- */
.sidebar {
  position: sticky; top: 0; align-self: start;
  height: 100vh; overflow-y: auto;
  background: linear-gradient(180deg, var(--sheet-alt), var(--paper));
  border-right: 1px solid var(--rule);
  padding: 22px 18px 40px;
}
.brand { display: flex; align-items: center; gap: 12px; padding-bottom: 18px; border-bottom: 1px solid var(--rule); }
.brand-mark { flex: none; border-radius: 9px; box-shadow: 0 6px 20px rgb(8 221 188 / 0.18); }
.brand-text { display: flex; flex-direction: column; line-height: 1.2; }
.brand-text b { font-size: 15px; letter-spacing: -0.01em; }
.brand-text span { font-size: 11.5px; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.14em; }
.nav { margin-top: 20px; }
.nav h4 { margin: 18px 0 8px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.16em; color: var(--ink-faint); font-weight: 600; }
.nav a {
  display: block; padding: 7px 11px; margin: 2px 0; border-radius: 9px;
  color: var(--ink-muted); font-size: 13.5px; border-left: 2px solid transparent;
}
.nav a:hover { background: var(--sheet); color: var(--ink); text-decoration: none; }
.nav a.active { background: var(--form-wash); color: var(--form-strong); border-left-color: var(--form); font-weight: 600; }
.nav a .n { display: inline-block; width: 20px; color: var(--ink-faint); font-variant-numeric: tabular-nums; }

/* ---------- Main ---------- */
.main { min-width: 0; }
.doc { max-width: 960px; margin: 0 auto; padding: 0 40px 120px; }

/* ---------- Report header ---------- */
.report-head { padding: 46px 0 26px; border-bottom: 1px solid var(--rule); }
.eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em; color: var(--form); font-weight: 600; }
.eyebrow::before { content: ''; width: 22px; height: 1px; background: var(--form); }
.report-head h1 { margin: 14px 0 6px; font-size: 34px; line-height: 1.15; letter-spacing: -0.02em; }
.report-head .lede { color: var(--ink-muted); font-size: 15px; max-width: 70ch; }
.meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1px; margin-top: 26px; background: var(--rule); border: 1px solid var(--rule); border-radius: 12px; overflow: hidden; }
.meta-cell { background: var(--sheet); padding: 12px 14px; }
.meta-cell .k { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--ink-faint); }
.meta-cell .v { font-size: 14px; font-weight: 600; margin-top: 3px; }

/* ---------- Verdict banner ---------- */
.verdict { display: flex; align-items: center; gap: 14px; margin-top: 22px; padding: 16px 18px; border-radius: 12px; border: 1px solid; }
.verdict--blocked { background: var(--critical-wash); border-color: rgb(248 113 113 / 0.4); }
.verdict--go { background: var(--ok-wash); border-color: rgb(74 222 128 / 0.4); }
.verdict__dot { width: 12px; height: 12px; border-radius: 50%; flex: none; }
.verdict--blocked .verdict__dot { background: var(--critical); box-shadow: 0 0 0 5px rgb(248 113 113 / 0.16); }
.verdict--go .verdict__dot { background: var(--ok); box-shadow: 0 0 0 5px rgb(74 222 128 / 0.16); }
.verdict__text b { display: block; font-size: 15px; }
.verdict__text span { color: var(--ink-muted); font-size: 13px; }

/* ---------- Content ---------- */
.content { padding-top: 8px; }
.content h1 { font-size: 30px; margin: 40px 0 12px; letter-spacing: -0.02em; }
.content h2 { font-size: 23px; margin: 44px 0 12px; padding-top: 20px; border-top: 1px solid var(--rule); letter-spacing: -0.01em; }
.content h2:first-child { border-top: none; padding-top: 6px; margin-top: 20px; }
.content h3 { font-size: 17.5px; margin: 30px 0 10px; color: var(--form-strong); }
.content h4 { font-size: 14px; margin: 22px 0 8px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-muted); }
.content p { margin: 11px 0; }
.content strong { color: #fff; font-weight: 650; }
.content em { color: var(--ink); }
.content code {
  font-family: var(--font-mono); font-size: 0.86em; background: var(--sheet);
  border: 1px solid var(--rule); border-radius: 6px; padding: 1.5px 6px; color: var(--form-strong);
}
.content .rule { border: none; border-top: 1px solid var(--rule); margin: 34px 0; }
.content blockquote {
  margin: 16px 0; padding: 6px 18px; border-left: 3px solid var(--rule-strong);
  color: var(--ink-muted); background: var(--sheet-alt); border-radius: 0 10px 10px 0;
}
.content ul.list, .content ol.list { margin: 11px 0; padding-left: 22px; }
.content .list li { margin: 5px 0; }
.content li.task { list-style: none; position: relative; padding-left: 4px; }
.content li.task .task__box {
  display: inline-grid; place-items: center; width: 17px; height: 17px; margin-right: 8px;
  border: 1.5px solid var(--rule-strong); border-radius: 5px; font-size: 11px; vertical-align: -3px; color: var(--paper);
}
.content li.task--done .task__box { background: var(--form); border-color: var(--form); color: var(--paper); }
.content li.task--done { color: var(--ink-muted); }

/* ---------- Code block ---------- */
pre.codeblock {
  background: #0b0b0b; border: 1px solid var(--rule); border-radius: 12px;
  padding: 16px 18px; overflow-x: auto; margin: 16px 0; position: relative;
}
pre.codeblock code { background: none; border: none; padding: 0; color: #e4e4e7; font-size: 12.5px; line-height: 1.6; }
pre.codeblock[data-lang]::before {
  content: attr(data-lang); position: absolute; top: 8px; right: 12px;
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-faint);
}

/* ---------- Tables ---------- */
.table-wrap { overflow-x: auto; margin: 18px 0; border: 1px solid var(--rule); border-radius: 12px; }
table.data-table { border-collapse: collapse; width: 100%; font-size: 13.5px; }
table.data-table thead th {
  background: var(--sheet-alt); text-align: left; padding: 11px 14px; font-size: 11px;
  text-transform: uppercase; letter-spacing: 0.07em; color: var(--ink-muted); font-weight: 600;
  border-bottom: 1px solid var(--rule-strong); white-space: nowrap;
}
table.data-table td { padding: 10px 14px; border-bottom: 1px solid var(--rule); vertical-align: top; }
table.data-table tbody tr:last-child td { border-bottom: none; }
table.data-table tbody tr:nth-child(even) { background: var(--greenbar); }
table.data-table td .badge { white-space: nowrap; }

/* ---------- Badges ---------- */
.badge {
  display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 11.5px;
  font-weight: 650; letter-spacing: 0.02em; border: 1px solid transparent; line-height: 1.5;
}
.badge--critical { background: var(--critical-wash); color: var(--critical); border-color: rgb(248 113 113 / 0.35); }
.badge--alert { background: var(--alert-wash); color: var(--alert); border-color: rgb(251 191 36 / 0.35); }
.badge--info { background: var(--info-wash); color: var(--info); border-color: rgb(96 165 250 / 0.35); }
.badge--ok { background: var(--ok-wash); color: var(--ok); border-color: rgb(74 222 128 / 0.35); }

/* ---------- Callouts ---------- */
.callout { margin: 20px 0; padding: 14px 18px; border-radius: 12px; border: 1px solid var(--rule-strong); border-left-width: 4px; background: var(--sheet-alt); }
.callout__title { font-weight: 650; margin-bottom: 4px; }
.callout__body p { margin: 4px 0; color: var(--ink-muted); }
.callout--critical { border-left-color: var(--critical); background: var(--critical-wash); }
.callout--critical .callout__title { color: var(--critical); }
.callout--alert { border-left-color: var(--alert); background: var(--alert-wash); }
.callout--alert .callout__title { color: var(--alert); }
.callout--info { border-left-color: var(--info); background: var(--info-wash); }
.callout--info .callout__title { color: var(--info); }
.callout--ok { border-left-color: var(--ok); background: var(--ok-wash); }
.callout--ok .callout__title { color: var(--ok); }

/* ---------- Footer ---------- */
.foot { margin-top: 60px; padding-top: 22px; border-top: 1px solid var(--rule); color: var(--ink-faint); font-size: 12.5px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }

/* ---------- Responsive ---------- */
@media (max-width: 920px) {
  .layout { grid-template-columns: 1fr; }
  .sidebar { position: static; height: auto; border-right: none; border-bottom: 1px solid var(--rule); }
  .doc { padding: 0 20px 90px; }
  .report-head h1 { font-size: 26px; }
}

/* ---------- Print ---------- */
@media print {
  :root { color-scheme: light; }
  body { background: #fff; color: #111; }
  .sidebar { display: none; }
  .layout { grid-template-columns: 1fr; }
  .doc { max-width: none; padding: 0 0 40px; }
  .report-head h1, .content h1, .content h2, .content h3 { color: #111; }
  .content h3, .brand-text span { color: #0a7a68; }
  a { color: #0a7a68; }
  .meta-cell, .callout, .table-wrap, pre.codeblock { border-color: #ddd; background: #fafafa; }
  .badge { border: 1px solid #999; }
}
`;
