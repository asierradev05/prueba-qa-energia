// Mini-renderizador de Markdown -> HTML, sin dependencias externas.
// Cubre el subconjunto usado por los informes de QA: encabezados, tablas,
// listas, bloques de código, citas/callouts de Obsidian, enlaces, énfasis,
// código inline, reglas horizontales y checkboxes.

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Énfasis e inline formatting dentro de una línea de texto ya escapada.
function inline(text) {
  let out = escapeHtml(text);
  // Código inline primero para no procesar su interior.
  const codeStore = [];
  out = out.replace(/`([^`]+)`/g, (_, code) => {
    codeStore.push(code);
    return `\u0000CODE${codeStore.length - 1}\u0000`;
  });
  // Enlaces [texto](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const safe = href.replace(/"/g, '%22');
    const external = /^https?:/i.test(safe);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${safe}"${attrs}>${label}</a>`;
  });
  // Negrita, itálica, tachado.
  out = out
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');
  // Restaurar código inline.
  out = out.replace(/\u0000CODE(\d+)\u0000/g, (_, i) => `<code>${escapeHtml(codeStore[i])}</code>`);
  return out;
}

// Convierte una fila de tabla markdown en celdas.
function splitRow(row) {
  let r = row.trim();
  if (r.startsWith('|')) r = r.slice(1);
  if (r.endsWith('|')) r = r.slice(0, -1);
  return r.split('|').map((c) => c.trim());
}

// Heurística de severidad/estado para pintar badges dentro de tablas o texto.
export function badgeFor(word) {
  const w = word.trim().toUpperCase();
  const table = {
    'CRÍTICA': 'critical', CRITICA: 'critical', CRITICAL: 'critical',
    ALTA: 'alert', P1: 'alert', ALERTA: 'alert', ALERT: 'alert',
    MEDIA: 'info', P2: 'info', BAJA: 'ok', P3: 'ok', P4: 'ok',
    PASS: 'ok', 'PASÓ': 'ok', OK: 'ok', VERDE: 'ok',
    FAIL: 'critical', 'FALLÓ': 'critical', ERROR: 'critical',
    BLOCKED: 'critical', 'NO-GO': 'critical', GO: 'ok',
    'BLOQUEADO': 'critical', 'NO LIBERAR': 'critical',
    WARN: 'alert', WARNING: 'alert', 'ADVERTENCIA': 'alert',
    INFO: 'info', PENDIENTE: 'info',
  };
  return table[w] || null;
}

// Renderiza un bloque completo de Markdown a HTML semántico.
export function renderMarkdown(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let i = 0;

  const isTableSep = (s) => /^\s*\|?[\s:|-]+\|[\s:|-]+\|?\s*$/.test(s) && s.includes('-');

  while (i < lines.length) {
    const line = lines[i];

    // Bloques de código ```
    if (/^```/.test(line.trim())) {
      const lang = line.trim().slice(3).trim();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        buf.push(lines[i]);
        i++;
      }
      i++; // saltar cierre
      html.push(`<pre class="codeblock"${lang ? ` data-lang="${escapeHtml(lang)}"` : ''}><code>${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }

    // Regla horizontal
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      html.push('<hr class="rule" />');
      i++;
      continue;
    }

    // Encabezados
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const raw = h[2].trim();
      const text = inline(raw);
      const slug = raw.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60);
      html.push(`<h${level} id="${slug}">${text}</h${level}>`);
      i++;
      continue;
    }

    // Callouts de Obsidian: > [!tipo] Título
    if (/^\s*>\s*\[!/.test(line)) {
      const m = /^\s*>\s*\[!(\w+)\]\s*(.*)$/.exec(line);
      const kind = m[1].toLowerCase();
      const title = m[2].trim();
      const buf = [];
      i++;
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      const body = buf.map((l) => l.trim()).filter(Boolean).map((l) => `<p>${inline(l)}</p>`).join('');
      const cls = badgeFor(title) || (['danger', 'warning', 'caution'].includes(kind) ? 'alert' : 'info');
      html.push(
        `<aside class="callout callout--${cls}">` +
          (title ? `<div class="callout__title">${inline(title)}</div>` : '') +
          `<div class="callout__body">${body}</div>` +
        `</aside>`
      );
      continue;
    }

    // Cita simple
    if (/^\s*>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      html.push(`<blockquote>${buf.map((l) => `<p>${inline(l)}</p>`).join('')}</blockquote>`);
      continue;
    }

    // Tabla
    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(splitRow(lines[i]));
        i++;
      }
      const thead = head.map((c) => `<th>${inline(c)}</th>`).join('');
      const tbody = rows
        .map((r) => {
          const cells = r
            .map((c) => {
              const b = badgeFor(c);
              const content = b ? `<span class="badge badge--${b}">${inline(c)}</span>` : inline(c);
              return `<td>${content}</td>`;
            })
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');
      html.push(`<div class="table-wrap"><table class="data-table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`);
      continue;
    }

    // Lista de tareas / listas con viñetas y numeradas
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
        let content = lines[i].replace(/^\s*([-*+]|\d+\.)\s+/, '');
        let cls = '';
        if (/^\[[ xX]\]\s/.test(content)) {
          const done = /^\[[xX]\]/.test(content);
          content = content.replace(/^\[[ xX]\]\s/, '');
          cls = 'task';
          items.push(`<li class="task ${done ? 'task--done' : ''}"><span class="task__box">${done ? '✓' : ''}</span>${inline(content)}</li>`);
          i++;
          continue;
        }
        // continuación multilínea simple (líneas indentadas)
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
          content += ' ' + lines[i].trim();
          i++;
        }
        items.push(`<li>${inline(content)}</li>`);
      }
      const tag = ordered ? 'ol' : 'ul';
      html.push(`<${tag} class="list"${items.some((x) => x.includes('class="task')) ? ' data-has-tasks="true"' : ''}>${items.join('')}</${tag}>`);
      continue;
    }

    // Línea vacía
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Párrafo
    const buf = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^```/.test(lines[i].trim()) &&
      !/^\s*>/.test(lines[i]) &&
      !/^\s*([-*+]|\d+\.)\s+/.test(lines[i]) &&
      !(lines[i].includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) &&
      !/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    html.push(`<p>${inline(buf.join(' '))}</p>`);
  }

  return html.join('\n');
}

export { escapeHtml };
