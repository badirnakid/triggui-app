/* ═══════════════════════════════════════════════════════════════════════════════
   typographic-cover.js — v3.2

   Genera portada SVG 600×900 (ratio 2:3 como libro real) usando:
     - palette.paper como fondo
     - palette.ink como color del título
     - palette.accent para ornamentos y nombre del autor
     - visual_intent.typography_family para stack tipográfico
     - visual_intent.genre_visual para ornamento decorativo

   Output: SVG string + data URI base64 inline (listo para pegar en JSON).

   Cero fuentes externas. Todo inline. Escala perfecto en cualquier tamaño.
═══════════════════════════════════════════════════════════════════════════════ */

const TYPOGRAPHY_STACKS = {
  serif_clasico: '"Libre Caslon Text", "Caslon", "EB Garamond", Georgia, serif',
  serif_literario: '"Lora", "Merriweather", "Georgia", serif',
  serif_moderno: '"Playfair Display", "Libre Baskerville", Georgia, serif',
  sans_geometrico: '"Poppins", "Futura", "Montserrat", sans-serif',
  sans_humanista: '"Work Sans", "Open Sans", "Segoe UI", sans-serif',
  sans_tecnologico: '"Inter", "IBM Plex Sans", system-ui, sans-serif',
  mono_precision: '"JetBrains Mono", "Courier New", monospace',
  mixta_editorial: '"Playfair Display", "Georgia", serif'
};

function escapeXml(unsafe) {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Inteligencia de tamaño: título largo → font-size menor + wrap
function fitTitulo(titulo, maxWidth = 520) {
  const t = String(titulo || "").trim();
  const len = t.length;
  if (len === 0) return { lines: ["Sin título"], fontSize: 72 };
  if (len <= 18) return { lines: [t], fontSize: 84 };
  if (len <= 32) return { lines: wrapText(t, 2), fontSize: 64 };
  if (len <= 50) return { lines: wrapText(t, 3), fontSize: 48 };
  return { lines: wrapText(t, 4), fontSize: 38 };
}

function wrapText(text, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = [];
  const targetLen = Math.ceil(text.length / maxLines);

  for (const word of words) {
    const proposed = [...current, word].join(" ");
    if (proposed.length > targetLen * 1.15 && current.length > 0) {
      lines.push(current.join(" "));
      current = [word];
      if (lines.length === maxLines - 1) {
        // Última línea, meter el resto
        current = [word, ...words.slice(words.indexOf(word) + 1)];
        break;
      }
    } else {
      current.push(word);
    }
  }
  if (current.length > 0) lines.push(current.join(" "));
  return lines.slice(0, maxLines);
}

/* ─────────────────────────────────────────────────────────────────────────────
   ORNAMENTOS POR GÉNERO VISUAL
────────────────────────────────────────────────────────────────────────────── */

function ornamentForGenre(genre, accentColor, centerX, topY, bottomY) {
  switch (genre) {
    case "academico":
    case "ensayo":
      // Dos líneas paralelas finas
      return `
  <line x1="${centerX - 80}" y1="${topY}" x2="${centerX + 80}" y2="${topY}" stroke="${accentColor}" stroke-width="1.5" />
  <line x1="${centerX - 60}" y1="${topY + 8}" x2="${centerX + 60}" y2="${topY + 8}" stroke="${accentColor}" stroke-width="0.8" />
  <line x1="${centerX - 60}" y1="${bottomY - 8}" x2="${centerX + 60}" y2="${bottomY - 8}" stroke="${accentColor}" stroke-width="0.8" />
  <line x1="${centerX - 80}" y1="${bottomY}" x2="${centerX + 80}" y2="${bottomY}" stroke="${accentColor}" stroke-width="1.5" />`;

    case "manifiesto":
      // Bloques sólidos contrastantes
      return `
  <rect x="${centerX - 60}" y="${topY - 4}" width="120" height="8" fill="${accentColor}" />
  <rect x="${centerX - 90}" y="${bottomY - 4}" width="180" height="8" fill="${accentColor}" />`;

    case "literario":
    case "narrativa":
      // Flourish orgánico simétrico
      return `
  <path d="M ${centerX - 60} ${topY} Q ${centerX - 30} ${topY - 12}, ${centerX} ${topY} T ${centerX + 60} ${topY}" 
        stroke="${accentColor}" stroke-width="1.8" fill="none" stroke-linecap="round" />
  <circle cx="${centerX}" cy="${topY}" r="2.5" fill="${accentColor}" />
  <path d="M ${centerX - 60} ${bottomY} Q ${centerX - 30} ${bottomY + 12}, ${centerX} ${bottomY} T ${centerX + 60} ${bottomY}" 
        stroke="${accentColor}" stroke-width="1.8" fill="none" stroke-linecap="round" />
  <circle cx="${centerX}" cy="${bottomY}" r="2.5" fill="${accentColor}" />`;

    case "poesia":
      // Puntos suspensivos decorativos
      return `
  <circle cx="${centerX - 24}" cy="${topY}" r="3" fill="${accentColor}" />
  <circle cx="${centerX}" cy="${topY}" r="4" fill="${accentColor}" />
  <circle cx="${centerX + 24}" cy="${topY}" r="3" fill="${accentColor}" />
  <circle cx="${centerX - 24}" cy="${bottomY}" r="3" fill="${accentColor}" opacity="0.7" />
  <circle cx="${centerX}" cy="${bottomY}" r="4" fill="${accentColor}" opacity="0.7" />
  <circle cx="${centerX + 24}" cy="${bottomY}" r="3" fill="${accentColor}" opacity="0.7" />`;

    case "espiritual":
      // Mandala geométrico simple — 6 pétalos
      return `
  <g transform="translate(${centerX},${topY})" opacity="0.85">
    <circle r="18" fill="none" stroke="${accentColor}" stroke-width="1.2" />
    <circle r="8" fill="none" stroke="${accentColor}" stroke-width="1" />
    <line x1="-22" y1="0" x2="22" y2="0" stroke="${accentColor}" stroke-width="0.8" />
    <line x1="0" y1="-22" x2="0" y2="22" stroke="${accentColor}" stroke-width="0.8" />
    <line x1="-16" y1="-16" x2="16" y2="16" stroke="${accentColor}" stroke-width="0.6" opacity="0.6" />
    <line x1="16" y1="-16" x2="-16" y2="16" stroke="${accentColor}" stroke-width="0.6" opacity="0.6" />
  </g>
  <g transform="translate(${centerX},${bottomY})" opacity="0.6">
    <circle r="12" fill="none" stroke="${accentColor}" stroke-width="1" />
    <circle r="4" fill="${accentColor}" />
  </g>`;

    case "tecnico":
      // Grid minimal
      return `
  <g stroke="${accentColor}" stroke-width="1" fill="none" opacity="0.7">
    <line x1="${centerX - 50}" y1="${topY}" x2="${centerX + 50}" y2="${topY}" />
    <line x1="${centerX - 50}" y1="${topY - 3}" x2="${centerX - 50}" y2="${topY + 3}" />
    <line x1="${centerX}" y1="${topY - 3}" x2="${centerX}" y2="${topY + 3}" />
    <line x1="${centerX + 50}" y1="${topY - 3}" x2="${centerX + 50}" y2="${topY + 3}" />
    <line x1="${centerX - 50}" y1="${bottomY}" x2="${centerX + 50}" y2="${bottomY}" />
    <line x1="${centerX - 50}" y1="${bottomY - 3}" x2="${centerX - 50}" y2="${bottomY + 3}" />
    <line x1="${centerX}" y1="${bottomY - 3}" x2="${centerX}" y2="${bottomY + 3}" />
    <line x1="${centerX + 50}" y1="${bottomY - 3}" x2="${centerX + 50}" y2="${bottomY + 3}" />
  </g>`;

    default:
      // Chevron doble (atemporal)
      return `
  <path d="M ${centerX - 30} ${topY} L ${centerX} ${topY - 8} L ${centerX + 30} ${topY}" 
        stroke="${accentColor}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M ${centerX - 20} ${topY + 8} L ${centerX} ${topY + 2} L ${centerX + 20} ${topY + 8}" 
        stroke="${accentColor}" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.65" />
  <path d="M ${centerX - 30} ${bottomY} L ${centerX} ${bottomY + 8} L ${centerX + 30} ${bottomY}" 
        stroke="${accentColor}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   SVG GENERATOR
────────────────────────────────────────────────────────────────────────────── */

export function generateTypographicCoverSVG(book, palette, visualIntent = {}) {
  const titulo = book.titulo || "Sin título";
  const autor = book.autor || "Autor desconocido";

  const paper = palette.paper || "#F0F0EF";
  const ink = palette.ink || "#1A1A1A";
  const accent = palette.accent || "#B8993D";
  const border = palette.border || ink;

  const fontStack = TYPOGRAPHY_STACKS[visualIntent.typography_family] || TYPOGRAPHY_STACKS.serif_clasico;
  const genre = visualIntent.genre_visual || "atemporal";

  const width = 600;
  const height = 900;
  const centerX = width / 2;

  const { lines, fontSize } = fitTitulo(titulo);
  const totalTitleHeight = lines.length * fontSize * 1.15;
  const titleStartY = (height - totalTitleHeight) / 2 - 20;

  const titleLines = lines.map((line, i) => {
    const y = titleStartY + (i + 1) * fontSize * 1.15;
    return `  <text x="${centerX}" y="${y}" fill="${ink}" font-family='${fontStack}' font-size="${fontSize}" font-weight="700" text-anchor="middle" letter-spacing="-0.01em">${escapeXml(line)}</text>`;
  }).join("\n");

  const autorY = titleStartY + totalTitleHeight + 60;
  const autorFontSize = Math.max(22, Math.min(34, fontSize * 0.42));

  // Ornamentos: uno arriba del título, uno abajo del autor
  const ornamentTopY = titleStartY - 30;
  const ornamentBottomY = autorY + 50;
  const ornament = ornamentForGenre(genre, accent, centerX, ornamentTopY, ornamentBottomY);

  // Marco sutil interno
  const margin = 24;
  const innerBorder = `<rect x="${margin}" y="${margin}" width="${width - 2 * margin}" height="${height - 2 * margin}" fill="none" stroke="${border}" stroke-width="0.8" opacity="0.35" />`;

  // Triángulo de textura sutil al fondo (da sensación de papel)
  const texturePattern = `
  <defs>
    <pattern id="paperGrain" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="0.3" fill="${ink}" opacity="0.04" />
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#paperGrain)" />`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(`${titulo} — ${autor}`)}">
  <rect width="${width}" height="${height}" fill="${paper}" />
${texturePattern}
${innerBorder}
${ornament}
${titleLines}
  <text x="${centerX}" y="${autorY}" fill="${accent}" font-family='${fontStack}' font-size="${autorFontSize}" font-style="italic" font-weight="400" text-anchor="middle" letter-spacing="0.03em">${escapeXml(autor)}</text>
  <text x="${centerX}" y="${height - 50}" fill="${ink}" font-family='${fontStack}' font-size="12" text-anchor="middle" letter-spacing="0.25em" opacity="0.45">TRIGGUI</text>
</svg>`;

  return svg;
}

/* ─────────────────────────────────────────────────────────────────────────────
   DATA URI — para pegar inline en JSON
────────────────────────────────────────────────────────────────────────────── */

export function svgToDataURI(svg) {
  // Base64 es más confiable que URL-encoding para inline
  const base64 = Buffer.from(svg, "utf8").toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   API PÚBLICA
────────────────────────────────────────────────────────────────────────────── */

export function generateFallbackCover(book, palette, visualIntent = {}) {
  const svg = generateTypographicCoverSVG(book, palette, visualIntent);
  const dataUri = svgToDataURI(svg);
  return {
    svg,
    data_uri: dataUri,
    size_bytes: svg.length,
    size_uri_bytes: dataUri.length,
    source: "typographic_svg_fallback",
    dimensions: { width: 600, height: 900, ratio: "2:3" }
  };
}
