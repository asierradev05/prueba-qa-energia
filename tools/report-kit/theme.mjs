// Tokens de marca de BiaEnergy / EnergIA.
// Fuente de la verdad: frontend/src/styles/index.css (paleta del producto).
// Se mantienen los nombres reales para que los reportes combinen con la app.

export const theme = {
  name: 'BiaEnergy',
  product: 'EnergIA',
  // Núcleo de color (dark, como el producto).
  paper: '#0f0f0f',
  paperSoft: '#121212',
  sheet: '#1a1a1a',
  sheetAlt: '#181818',
  ink: '#fafafa',
  inkMuted: '#a1a1aa',
  inkFaint: '#71717a',
  form: '#08ddbc',
  formStrong: '#17ffdb',
  formWash: '#16302b',
  rule: '#27272a',
  ruleStrong: '#3f3f46',
  greenbar: '#202023',
  critical: '#f87171',
  criticalWash: '#2c1717',
  alert: '#fbbf24',
  alertWash: '#2d2410',
  ok: '#4ade80',
  okWash: '#12291b',
  info: '#60a5fa',
  infoWash: '#152238',
};

// Logo vectorial de EnergIA (rayo menta sobre cuadrado grafito), tomado del
// favicon del producto. Se inlinea el SVG para que el reporte sea autocontenido.
export const logoMark = `<svg class="brand-mark" viewBox="0 0 32 32" width="40" height="40" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#08ddbc"/><path d="M18 5 9 18h6l-2 9 10-14h-6l1-8z" fill="#0f0f0f"/></svg>`;
