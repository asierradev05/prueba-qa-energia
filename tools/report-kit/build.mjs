// Generador de informes HTML de QA con marca BiaEnergy.
//
// Fuente: los .md de qa/ (siguen siendo la fuente de verdad).
// Salida: qa/reportes/*.html autocontenidos (CSS inline, sin recursos externos)
// más un índice qa/reportes/index.html que funciona como portal de la entrega.
//
// Uso:  node tools/report-kit/build.mjs
//
// No modifica los .md ni el código de producción.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { theme, logoMark } from './theme.mjs';
import { baseCss } from './css.mjs';
import { renderMarkdown, escapeHtml } from './markdown.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const qaDir = join(repoRoot, 'qa');
const outDir = join(qaDir, 'reportes');

const DOC_DATE = '2026-10-21';
const COMMIT = '15765d9';

// Catálogo de informes. `src` es el .md fuente (relativo a qa/).
// `nav` agrupa en el índice; `order` define el orden de la sección.
const reports = [
  {
    id: 'resumen',
    file: 'resumen-ejecutivo.html',
    src: '00_Resumen_Ejecutivo/RESUMEN.md',
    title: 'Resumen ejecutivo',
    nav: 'Dirección',
    order: 1,
    verdict: { kind: 'blocked', label: 'NO liberar a producción', detail: '1 vulnerabilidad crítica (SEC-01) y 2 defectos P1 abiertos' },
  },
  {
    id: 'plan',
    file: 'plan-de-pruebas.html',
    src: '01-plan-de-pruebas.md',
    title: 'Plan de pruebas y estrategia',
    nav: 'Planificación',
    order: 2,
  },
  {
    id: 'smoke',
    file: 'suite-de-humo.html',
    src: '02-smoke.md',
    title: 'Suite de humo',
    nav: 'Ejecución',
    order: 3,
  },
  {
    id: 'caja-negra',
    file: 'casos-caja-negra.html',
    src: '03-casos-caja-negra.md',
    title: 'Casos de caja negra',
    nav: 'Ejecución',
    order: 4,
  },
  {
    id: 'caja-blanca',
    file: 'caja-blanca.html',
    src: '04-caja-blanca.md',
    title: 'Análisis de caja blanca',
    nav: 'Ejecución',
    order: 5,
  },
  {
    id: 'defectos',
    file: 'registro-de-defectos.html',
    src: '05-defectos.md',
    title: 'Registro de defectos',
    nav: 'Hallazgos',
    order: 6,
  },
  {
    id: 'seguridad',
    file: 'reporte-de-seguridad.html',
    src: '03_Defectos_y_Seguridad/Seguridad.md',
    title: 'Reporte de seguridad',
    nav: 'Hallazgos',
    order: 7,
  },
  {
    id: 'readiness',
    file: 'produccion-readiness.html',
    src: '03_Defectos_y_Seguridad/Produccion_Readiness.md',
    title: 'Preparación para producción',
    nav: 'Hallazgos',
    order: 8,
  },
  {
    id: 'metricas',
    file: 'metricas-y-cobertura.html',
    src: '03_Defectos_y_Seguridad/Metricas_y_Cobertura.md',
    title: 'Métricas y cobertura',
    nav: 'Hallazgos',
    order: 9,
  },
].filter((r) => existsSync(join(qaDir, r.src)));

// Extrae el primer H1 como título y el primer párrafo como entradilla.
function extractLead(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  let title = null;
  let lead = null;
  for (const line of lines) {
    const m = /^#\s+(.*)$/.exec(line);
    if (m && !title) { title = m[1].trim(); continue; }
    if (title && !lead && line.trim() && !line.startsWith('#') && !line.startsWith('>') && !line.startsWith('|') && !/^[-*+\d]/.test(line.trim())) {
      lead = line.trim();
    }
    if (title && lead) break;
  }
  return { title, lead };
}

// Quita el bloque de metadatos del vault (callouts de la cabecera) del cuerpo.
function stripLeadingTitle(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let seenTitle = false;
  for (const line of lines) {
    if (!seenTitle && /^#\s+/.test(line)) { seenTitle = true; continue; }
    out.push(line);
  }
  return out.join('\n').replace(/^\s*\n/, '');
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60);
}

// Construye el índice de navegación lateral a partir de los H2 del cuerpo.
function buildToc(htmlBody) {
  const re = /<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g;
  const items = [];
  let m;
  while ((m = re.exec(htmlBody))) {
    const text = m[2].replace(/<[^>]+>/g, '');
    items.push({ id: m[1], text });
  }
  return items;
}

function navSections(reportsList, activeId) {
  const groups = new Map();
  for (const r of [...reportsList].sort((a, b) => a.order - b.order)) {
    if (!groups.has(r.nav)) groups.set(r.nav, []);
    groups.get(r.nav).push(r);
  }
  let html = '';
  for (const [group, items] of groups) {
    html += `<h4>${escapeHtml(group)}</h4>`;
    for (const it of items) {
      const active = it.id === activeId ? ' class="active"' : '';
      html += `<a href="${it.file}"${active}>${escapeHtml(it.title)}</a>`;
    }
  }
  return html;
}

function tocList(toc) {
  if (!toc.length) return '';
  let html = `<h4>En esta página</h4>`;
  for (const t of toc) html += `<a href="#${t.id}"><span class="n">·</span>${escapeHtml(t.text.length > 42 ? t.text.slice(0, 40) + '…' : t.text)}</a>`;
  return html;
}

function verdictBanner(v) {
  if (!v) return '';
  return `<div class="verdict verdict--${v.kind}"><span class="verdict__dot"></span><div class="verdict__text"><b>${escapeHtml(v.label)}</b><span>${escapeHtml(v.detail)}</span></div></div>`;
}

function metaGrid(report) {
  const cells = [
    ['Proyecto', `${theme.product} · prueba técnica`],
    ['Cliente', theme.name],
    ['Tipo', 'Informe de QA'],
    ['Fecha', DOC_DATE],
    ['Commit', COMMIT],
  ];
  return `<div class="meta-grid">${cells.map(([k, v]) => `<div class="meta-cell"><div class="k">${escapeHtml(k)}</div><div class="v">${escapeHtml(v)}</div></div>`).join('')}</div>`;
}

function renderReport(report) {
  const md = readFileSync(join(qaDir, report.src), 'utf8');
  const bodyMd = stripLeadingTitle(md);
  const htmlBody = renderMarkdown(bodyMd);
  const toc = buildToc(htmlBody);
  const subtitle = report.title;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(subtitle)} · QA ${theme.product} · ${theme.name}</title>
<meta name="author" content="Equipo de QA">
<style>${baseCss}</style>
</head>
<body>
<div class="layout">
  <aside class="sidebar">
    <a class="brand" href="index.html" style="text-decoration:none;color:inherit">${logoMark}<span class="brand-text"><b>${escapeHtml(theme.name)}</b><span>QA · ${escapeHtml(theme.product)}</span></span></a>
    <nav class="nav">
      <h4>Informes</h4>
      ${navSections(reports, report.id)}
      ${tocList(toc)}
    </nav>
  </aside>
  <main class="main">
    <div class="doc">
      <header class="report-head">
        <span class="eyebrow">Informe de QA · ${escapeHtml(theme.name)}</span>
        <h1>${escapeHtml(subtitle)}</h1>
        ${extractLead(md).lead ? `<p class="lede">${renderMarkdown(extractLead(md).lead).replace(/^<p>|<\/p>$/g, '')}</p>` : ''}
        ${metaGrid(report)}
        ${verdictBanner(report.verdict)}
      </header>
      <article class="content">
        ${htmlBody}
      </article>
      <footer class="foot">
        <span>${escapeHtml(theme.name)} · Informe de QA · ${escapeHtml(theme.product)}</span>
        <span>${DOC_DATE} · commit ${COMMIT} · <a href="index.html">Índice de informes</a></span>
      </footer>
    </div>
  </main>
</div>
<script>
// Resalta el enlace activo y el encabezado visible durante el scroll.
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var heads = links.map(function (a) { return document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); });
  function onScroll() {
    var pos = window.scrollY + 140, best = -1;
    heads.forEach(function (h, i) { if (h && h.offsetTop <= pos) best = i; });
    links.forEach(function (a, i) { a.classList.toggle('active', i === best); });
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
</script>
</body>
</html>`;
}

function renderIndex() {
  const groups = new Map();
  for (const r of [...reports].sort((a, b) => a.order - b.order)) {
    if (!groups.has(r.nav)) groups.set(r.nav, []);
    groups.get(r.nav).push(r);
  }
  let cards = '';
  for (const [group, items] of groups) {
    cards += `<h2>${escapeHtml(group)}</h2><div class="cards">`;
    for (const it of items) {
      const md = readFileSync(join(qaDir, it.src), 'utf8');
      const lead = extractLead(md).lead || '';
      const plain = lead.replace(/[*`\[\]]/g, '').slice(0, 150);
      cards += `<a class="card-link" href="${it.file}"><div class="card-link__t">${escapeHtml(it.title)}</div><div class="card-link__d">${escapeHtml(plain)}</div><span class="card-link__go">Abrir informe →</span></a>`;
    }
    cards += `</div>`;
  }
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Índice de informes de QA · ${theme.product} · ${theme.name}</title>
<style>${baseCss}
.index-hero { padding: 60px 0 20px; }
.index-hero h1 { font-size: 38px; margin: 14px 0 8px; letter-spacing: -0.02em; }
.index-hero .lede { color: var(--ink-muted); max-width: 72ch; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; margin: 14px 0 34px; }
.card-link { display: flex; flex-direction: column; gap: 8px; padding: 18px; border: 1px solid var(--rule); border-radius: 14px; background: var(--sheet); color: inherit; text-decoration: none; transition: border-color .18s, transform .18s, background .18s; }
.card-link:hover { border-color: var(--form); background: var(--form-wash); transform: translateY(-2px); text-decoration: none; }
.card-link__t { font-weight: 650; font-size: 15.5px; }
.card-link__d { color: var(--ink-muted); font-size: 13px; flex: 1; }
.card-link__go { color: var(--form); font-size: 12.5px; font-weight: 600; }
</style>
</head>
<body>
<div class="doc" style="padding-top:0">
  <header class="report-head index-hero">
    <span class="eyebrow">BiaEnergy · Informes de QA</span>
    <h1>Informes de QA · ${escapeHtml(theme.product)}</h1>
    <p class="lede">Conjunto de informes de la prueba técnica de QA sobre ${escapeHtml(theme.product)} (backend Go + frontend React). Todos los resultados se obtuvieron ejecutando el sistema real; cada informe enlaza su evidencia.</p>
    ${metaGrid({})}
    ${verdictBanner({ kind: 'blocked', label: 'NO liberar a producción', detail: '1 vulnerabilidad crítica (SEC-01) y 2 defectos P1 abiertos' })}
  </header>
  <div class="content">${cards}</div>
  <footer class="foot">
    <span>${escapeHtml(theme.name)} · Informes de QA · ${escapeHtml(theme.product)}</span>
    <span>${DOC_DATE} · commit ${COMMIT}</span>
  </footer>
</div>
</body>
</html>`;
}

function main() {
  mkdirSync(outDir, { recursive: true });
  let count = 0;
  for (const r of reports) {
    const html = renderReport(r);
    writeFileSync(join(outDir, r.file), html, 'utf8');
    count++;
    console.log(`  ✓ ${r.file}  (${r.title})`);
  }
  writeFileSync(join(outDir, 'index.html'), renderIndex(), 'utf8');
  count++;
  console.log(`  ✓ index.html  (portal de informes)`);
  console.log(`\n${count} informes generados en qa/reportes/`);
}

main();
