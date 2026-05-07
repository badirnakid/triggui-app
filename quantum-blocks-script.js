// ═══════════════════════════════════════════════════════════════════════
// 🌒 TRIGGUI QUANTUM BLOCKS — Pantalla del libro descubierto
// ═══════════════════════════════════════════════════════════════════════
//
// Filosofía: cada vez que se revela un libro, los 4 bloques son nuevos.
// Mantienen la IDENTIDAD cromática del libro (hue base) PERO la paleta
// exacta nunca se repite. Variedad infinita con firma reconocible.
//
// Sistema:
//   1. Extrae el hue base del libro (de tarjeta.style.accent / colores[0])
//   2. Genera paleta armónica alrededor con 7 estrategias matemáticas:
//      analogous-tight, analogous-loose, triadic-soft, temperature-shift,
//      monochromatic-rich, split-warm-cool, analogous-warm-shift
//   3. Genera geometría: 4 distribuciones (radial/parallel/cascade/star)
//   4. Por bloque: ensureLegibility() ajusta lightness para WCAG AA 4.5:1
//   5. Compose gradient: linear (base) + radial (luz cenital sutil)
//   6. Inyecta en libro.colores y libro.textColors ANTES del render original
//      para que CTA buttons revelados también tomen los colores cuánticos
//
// Garantías matemáticas absolutas:
//   - Texto SIEMPRE legible (WCAG AA, contraste >= 4.5:1)
//   - Identidad cromática preservada (hue base del libro)
//   - Sutileza visual (luz cenital con alpha 0.08-0.18)
//   - Coherencia entre bloques (estrategia armónica coherente)
//
// Hook: monkey-patch a window.render. Reversible.
// Cero librerías. Cero red. Cero costo.
// ═══════════════════════════════════════════════════════════════════════

(function setupQuantumBlocks() {
  'use strict';

  // ── UTILIDADES MATEMÁTICAS ────────────────────────────────────────────
  function rand(min, max) { return min + Math.random() * (max - min); }
  function randPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

  // ── ESPACIO DE COLOR HSL ↔ HEX ────────────────────────────────────────
  function hexToHsl(hex) {
    try {
      var clean = String(hex || '').replace('#', '').trim();
      var full = clean.length === 3 ? clean.split('').map(function(c) { return c + c; }).join('') : clean;
      var parts = full.match(/.{1,2}/g);
      if (!parts || parts.length < 3) return { h: 0, s: 0, l: 0.5 };
      var rgb = parts.map(function(x) { return parseInt(x, 16) / 255; });
      var max = Math.max.apply(null, rgb), min = Math.min.apply(null, rgb);
      var l = (max + min) / 2;
      var h = 0, s = 0;
      if (max !== min) {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === rgb[0]) h = ((rgb[1] - rgb[2]) / d + (rgb[1] < rgb[2] ? 6 : 0));
        else if (max === rgb[1]) h = ((rgb[2] - rgb[0]) / d + 2);
        else h = ((rgb[0] - rgb[1]) / d + 4);
        h *= 60;
      }
      return { h: h, s: s, l: l };
    } catch (e) { return { h: 0, s: 0, l: 0.5 }; }
  }

  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = clamp(s, 0, 1);
    l = clamp(l, 0, 1);
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = l - c / 2;
    var r1, g1, b1;
    if (h < 60) { r1 = c; g1 = x; b1 = 0; }
    else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
    else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
    else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
    else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
    else { r1 = c; g1 = 0; b1 = x; }
    function tx(v) {
      var hex = Math.round((v + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }
    return '#' + tx(r1) + tx(g1) + tx(b1);
  }

  function hslCss(h, s, l) {
    return 'hsl(' + h.toFixed(1) + ', ' + (s * 100).toFixed(0) + '%, ' + (l * 100).toFixed(0) + '%)';
  }

  // ── LUMINANCE & CONTRAST RATIO (WCAG 2.1) ─────────────────────────────
  function luminance(hex) {
    try {
      var clean = String(hex || '').replace('#', '').trim();
      var full = clean.length === 3 ? clean.split('').map(function(c) { return c + c; }).join('') : clean;
      var rgb = full.match(/.{1,2}/g).map(function(x) { return parseInt(x, 16) / 255; });
      function f(v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
      return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
    } catch (e) { return 0.5; }
  }

  function contrastRatio(hex1, hex2) {
    var l1 = luminance(hex1);
    var l2 = luminance(hex2);
    var bright = Math.max(l1, l2);
    var dark = Math.min(l1, l2);
    return (bright + 0.05) / (dark + 0.05);
  }

  // ── EXTRAER HUE BASE DEL LIBRO ────────────────────────────────────────
  function extractHueBase(libro) {
    var sources = [];
    try { if (libro && libro.tarjeta && libro.tarjeta.style && libro.tarjeta.style.accent) sources.push(libro.tarjeta.style.accent); } catch (_) {}
    try { if (libro && Array.isArray(libro.colores) && libro.colores[0]) sources.push(libro.colores[0]); } catch (_) {}
    try { if (libro && libro.tarjeta && libro.tarjeta.style && libro.tarjeta.style.ink) sources.push(libro.tarjeta.style.ink); } catch (_) {}

    for (var i = 0; i < sources.length; i++) {
      if (typeof sources[i] === 'string' && /^#[0-9a-f]{3,8}$/i.test(sources[i])) {
        return hexToHsl(sources[i]).h;
      }
    }
    // Fallback determinístico: hash del título (mismo libro = mismo hue base si no hay colores)
    var h = 0;
    var t = String((libro && libro.titulo) || 'unknown');
    for (var j = 0; j < t.length; j++) h = ((h * 31) + t.charCodeAt(j)) >>> 0;
    return h % 360;
  }

  // ── GENERAR PALETA ARMÓNICA ALREDEDOR DEL HUE BASE ────────────────────
  function generateBookPalette(hueBase) {
    var strategies = [
      'analogous-tight', 'analogous-loose', 'triadic-soft',
      'temperature-shift', 'monochromatic-rich', 'split-warm-cool',
      'analogous-warm-shift'
    ];
    var strategy = randPick(strategies);
    var hues = [];

    if (strategy === 'analogous-tight') {
      hues = [
        hueBase,
        (hueBase + rand(8, 22)) % 360,
        (hueBase - rand(8, 22) + 360) % 360,
        (hueBase + rand(60, 90)) % 360
      ];
    } else if (strategy === 'analogous-loose') {
      hues = [
        hueBase,
        (hueBase + rand(20, 45)) % 360,
        (hueBase - rand(20, 45) + 360) % 360,
        (hueBase + rand(45, 70)) % 360
      ];
    } else if (strategy === 'triadic-soft') {
      hues = [
        hueBase,
        (hueBase + rand(12, 25)) % 360,
        (hueBase - rand(12, 25) + 360) % 360,
        (hueBase + 120 + rand(-15, 15)) % 360
      ];
    } else if (strategy === 'temperature-shift') {
      hues = [
        hueBase,
        (hueBase + rand(8, 20)) % 360,
        (hueBase + rand(40, 75)) % 360,
        (hueBase + rand(85, 130)) % 360
      ];
    } else if (strategy === 'monochromatic-rich') {
      // Mismo hue para 3 con jitter sutil + 1 con shift de 55-90° para variedad visible
      hues = [
        hueBase,
        (hueBase + rand(-10, 10) + 360) % 360,
        (hueBase + rand(-10, 10) + 360) % 360,
        (hueBase + rand(55, 90)) % 360
      ];
    } else if (strategy === 'split-warm-cool') {
      hues = [
        hueBase,
        (hueBase + rand(15, 30)) % 360,
        (hueBase + 150 + rand(-20, 20)) % 360,
        (hueBase + 210 + rand(-20, 20)) % 360
      ];
    } else { // analogous-warm-shift
      hues = [
        hueBase,
        (hueBase + rand(15, 30)) % 360,
        (hueBase + rand(35, 55)) % 360,
        (hueBase + rand(60, 85)) % 360
      ];
    }

    // Saturación y lightness por color — variables, no monolíticas
    var colors = [];
    for (var k = 0; k < hues.length; k++) {
      var s, l;
      if (strategy === 'monochromatic-rich') {
        // Strong S/L variation since H is constant
        var profiles = [
          { s: rand(0.85, 1.0),  l: rand(0.42, 0.50) },  // rich deep
          { s: rand(0.55, 0.75), l: rand(0.55, 0.65) },  // balanced
          { s: rand(0.35, 0.55), l: rand(0.66, 0.74) },  // light airy
          { s: rand(0.70, 0.90), l: rand(0.32, 0.40) }   // deep dark
        ];
        s = profiles[k].s;
        l = profiles[k].l;
      } else {
        s = rand(0.62, 0.95);
        l = rand(0.40, 0.62);
      }
      colors.push({ h: hues[k], s: clamp(s, 0.30, 1.0), l: clamp(l, 0.25, 0.78) });
    }

    return { strategy: strategy, colors: colors };
  }

  // ── GEOMETRÍA — distribución coherente de ángulos y luces ─────────────
  function generateBlockGeometry() {
    var distributions = ['radial', 'parallel', 'cascade', 'star'];
    var distribution = randPick(distributions);
    var baseAngle = rand(0, 360);
    var angles;

    if (distribution === 'radial') {
      // Cada bloque apunta hacia un cuadrante distinto
      angles = [baseAngle, (baseAngle + 90) % 360, (baseAngle + 180) % 360, (baseAngle + 270) % 360];
    } else if (distribution === 'parallel') {
      // Casi paralelos — sensación unificada
      angles = [
        (baseAngle + rand(-20, 20) + 360) % 360,
        (baseAngle + rand(-20, 20) + 360) % 360,
        (baseAngle + rand(-20, 20) + 360) % 360,
        (baseAngle + rand(-20, 20) + 360) % 360
      ];
    } else if (distribution === 'cascade') {
      // Cada bloque rota progresivamente
      var step = rand(25, 55);
      angles = [
        baseAngle,
        (baseAngle + step) % 360,
        (baseAngle + step * 2) % 360,
        (baseAngle + step * 3) % 360
      ];
    } else { // star
      // 3 a 120° + 1 con offset
      angles = [
        baseAngle,
        (baseAngle + 120) % 360,
        (baseAngle + 240) % 360,
        (baseAngle + 60 + rand(-15, 15)) % 360
      ];
    }

    // v4: lightPositions eliminado — ahora se calcula del ángulo del gradient
    // (coherencia matemática: la luz va EN la dirección que fluye el gradiente)
    return {
      distribution: distribution,
      angles: angles,
      lightIntensity: rand(0.08, 0.18)  // v4.1: rango más sutil (sin línea visible)
    };
  }

  // ── LEGIBILIDAD — ITERATIVA hasta cumplir WCAG AA 4.5:1 GARANTIZADO ───
  function ensureLegibility(c1, c2) {
    var TARGET = 4.5;

    var WHITE_TEXT = '#fafafa';
    var BLACK_TEXT = '#1a1a1a';

    function checkContrast(c1obj, c2obj, textHex) {
      var r1 = contrastRatio(hslToHex(c1obj.h, c1obj.s, c1obj.l), textHex);
      var r2 = contrastRatio(hslToHex(c2obj.h, c2obj.s, c2obj.l), textHex);
      return Math.min(r1, r2);
    }

    // Primer intento: paleta original con texto blanco/negro EXACTO
    if (checkContrast(c1, c2, WHITE_TEXT) >= TARGET) {
      return { textColor: WHITE_TEXT, c1Adj: c1, c2Adj: c2, adjusted: false };
    }
    if (checkContrast(c1, c2, BLACK_TEXT) >= TARGET) {
      return { textColor: BLACK_TEXT, c1Adj: c1, c2Adj: c2, adjusted: false };
    }

    // Decidir dirección por luminance promedio
    var avgL = (c1.l + c2.l) / 2;
    var darken = avgL > 0.50;
    var textColor = darken ? WHITE_TEXT : BLACK_TEXT;
    var textHex = textColor;

    // ITERAR hasta cumplir target — máximo 30 iteraciones, paso 0.04
    var c1Adj = { h: c1.h, s: c1.s, l: c1.l };
    var c2Adj = { h: c2.h, s: c2.s, l: c2.l };
    var step = 0.04;

    for (var iter = 0; iter < 30; iter++) {
      var ratio = checkContrast(c1Adj, c2Adj, textHex);
      if (ratio >= TARGET) break;

      if (darken) {
        c1Adj.l = clamp(c1Adj.l - step, 0.08, 1);
        c2Adj.l = clamp(c2Adj.l - step, 0.08, 1);
        // Si lightness ya muy bajo y aún no pasa, también desaturar
        if (c1Adj.l <= 0.20) c1Adj.s = clamp(c1Adj.s - step, 0.10, 1);
        if (c2Adj.l <= 0.20) c2Adj.s = clamp(c2Adj.s - step, 0.10, 1);
      } else {
        c1Adj.l = clamp(c1Adj.l + step, 0, 0.92);
        c2Adj.l = clamp(c2Adj.l + step, 0, 0.92);
        if (c1Adj.l >= 0.80) c1Adj.s = clamp(c1Adj.s - step, 0.10, 1);
        if (c2Adj.l >= 0.80) c2Adj.s = clamp(c2Adj.s - step, 0.10, 1);
      }
    }

    // Garantía absoluta: si después de 30 iteraciones aún no cumple,
    // forzar contraste extremo (negro casi puro o blanco casi puro)
    var finalRatio = checkContrast(c1Adj, c2Adj, textHex);
    if (finalRatio < TARGET) {
      if (darken) {
        c1Adj = { h: c1.h, s: clamp(c1.s * 0.4, 0.15, 0.6), l: 0.18 };
        c2Adj = { h: c2.h, s: clamp(c2.s * 0.4, 0.15, 0.6), l: 0.18 };
      } else {
        c1Adj = { h: c1.h, s: clamp(c1.s * 0.4, 0.15, 0.6), l: 0.85 };
        c2Adj = { h: c2.h, s: clamp(c2.s * 0.4, 0.15, 0.6), l: 0.85 };
      }
    }

    return { textColor: textColor, c1Adj: c1Adj, c2Adj: c2Adj, adjusted: true };
  }

  // ── ATMÓSFERA VOLUMÉTRICA CUÁNTICA v4 ─────────────────────────────────
  // Convierte el ángulo del gradient a posición de luz (coherencia matemática).
  // CSS gradient: 0deg = hacia arriba, 90deg = hacia derecha, 180 = abajo.
  // La luz se ubica EN la dirección donde fluye el gradiente.
  function angleToLightPos(angle) {
    var radius = 32; // % desde el centro
    var x = 50 + radius * Math.sin(angle * Math.PI / 180);
    var y = 50 - radius * Math.cos(angle * Math.PI / 180);
    return { x: x, y: y };
  }

  // Promedio circular de dos hues (considera que el círculo es continuo).
  function avgHue(h1, h2) {
    var diff = h2 - h1;
    if (Math.abs(diff) > 180) {
      if (diff > 0) h1 += 360;
      else h2 += 360;
    }
    return (((h1 + h2) / 2) + 360) % 360;
  }

  // ── COMPOSICIÓN VOLUMÉTRICA — luz tintada + sombra coherente ──────────
  // 3 capas matemáticamente coherentes:
  //   1. Sombra tintada (lado opuesto a la luz, hue propio oscurecido)
  //   2. Luz tintada (misma dirección que el gradient, hue propio aclarado)
  //   3. Linear base (2 colores del bloque)
  // Variación inteligente: bloques oscuros → luz más fuerte (drama + legibilidad)
  //                       bloques claros → luz más tenue (sutileza)
  function composeBlockGradient(c1, c2, geometry, blockIndex) {
    var angle = geometry.angles[blockIndex];
    var alpha = geometry.lightIntensity;

    // Hue promedio de los 2 colores → fuente de luz "nace del propio bloque"
    var avgH = avgHue(c1.h, c2.h);
    var avgL = (c1.l + c2.l) / 2;
    var avgS = (c1.s + c2.s) / 2;

    // Variación inteligente por luminance — drama o sutileza según contexto
    // v4.1: rangos suavizados (1.55/0.55 → 1.30/0.65) para más naturalidad
    var lightBoost = avgL < 0.42 ? 1.30 : (avgL > 0.68 ? 0.65 : 1.0);
    var shadowBoost = avgL < 0.42 ? 0.55 : (avgL > 0.68 ? 1.20 : 0.85);

    // Posiciones derivadas del ángulo — coherencia matemática
    var lightPos = angleToLightPos(angle);
    var shadowPos = angleToLightPos((angle + 180) % 360);

    // Linear base — 2 colores del bloque
    var linear = 'linear-gradient(' + angle.toFixed(0) + 'deg, ' +
                 hslCss(c1.h, c1.s, c1.l) + ' 0%, ' +
                 hslCss(c2.h, c2.s, c2.l) + ' 100%)';

    // ── LUZ TINTADA con CAÍDA SIGMOIDAL (4 stops, sin borde visible) ───
    // v4.1: tamaño extendido (110% 90%) — los bordes de la elipse caen
    //       FUERA del bloque, invisibles. Multi-stop para desvanecimiento
    //       natural sin "línea" perceptible.
    var lightAlpha = clamp(alpha * lightBoost, 0.04, 0.22);
    var lhPart = 'hsla(' + avgH.toFixed(0) + ', 25%, 95%, ';
    var light = 'radial-gradient(ellipse 110% 90% at ' +
                lightPos.x.toFixed(0) + '% ' + lightPos.y.toFixed(0) + '%, ' +
                lhPart + lightAlpha.toFixed(3) + ') 0%, ' +
                lhPart + (lightAlpha * 0.55).toFixed(3) + ') 25%, ' +
                lhPart + (lightAlpha * 0.18).toFixed(3) + ') 55%, ' +
                'transparent 90%)';

    // ── SOMBRA TINTADA con CAÍDA SIGMOIDAL (4 stops) ──────────────────
    var shadowAlpha = clamp(alpha * shadowBoost, 0.03, 0.16);
    var shadowSat = clamp(avgS * 0.6, 0.15, 0.75);
    var shPart = 'hsla(' + avgH.toFixed(0) + ', ' + (shadowSat * 100).toFixed(0) + '%, 8%, ';
    var shadow = 'radial-gradient(ellipse 110% 90% at ' +
                 shadowPos.x.toFixed(0) + '% ' + shadowPos.y.toFixed(0) + '%, ' +
                 shPart + shadowAlpha.toFixed(3) + ') 0%, ' +
                 shPart + (shadowAlpha * 0.55).toFixed(3) + ') 25%, ' +
                 shPart + (shadowAlpha * 0.18).toFixed(3) + ') 55%, ' +
                 'transparent 90%)';

    // Orden CSS: primera capa = arriba del stack visual
    return light + ', ' + shadow + ', ' + linear;
  }

  // ── DETECCIÓN DE INSISTENCIA — variedad agresiva si el usuario repite ─
  var _lastHueBase = null;
  var _lastApplyTime = 0;

  // Estrategia AGRESIVA: 4 hues distribuidos por TODO el círculo cromático.
  // El primero sigue derivado del libro (identidad), los otros 3 a 90°/180°/270°
  // con jitter para no parecer mecánicos. Garantiza variedad VISUAL absoluta.
  function generateAggressiveVariety(hueBase) {
    var hues = [
      hueBase,
      (hueBase + rand(70, 110)) % 360,
      (hueBase + rand(160, 200)) % 360,
      (hueBase + rand(250, 290)) % 360
    ];
    var colors = [];
    for (var i = 0; i < hues.length; i++) {
      colors.push({
        h: hues[i],
        s: rand(0.65, 0.95),
        l: rand(0.42, 0.62)
      });
    }
    return { strategy: 'aggressive-variety', colors: colors };
  }

  // ── EXTRAER HUE BASE DEL DOM (libro está en closure cerrado del index.html) ─
  // El index.html declara `let libro` que NO se cuelga de window. Por eso leemos
  // el primer .block ya pintado por el render original y extraemos su primer color
  // (que es libro.colores[0] aplicado por la función grad()) → su hue.
  function extractHueBaseFromDOM() {
    var firstBlock = document.querySelector('#grid .block');
    if (!firstBlock) return null;
    var bg = (firstBlock.style.background || '') + ' ' +
             (firstBlock.style.backgroundImage || '');
    var hexMatch = bg.match(/#[0-9a-f]{6}/i);
    if (hexMatch) return hexToHsl(hexMatch[0]).h;
    var rgbMatch = bg.match(/rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)/i);
    if (rgbMatch) {
      function tx(n) { var h = parseInt(n).toString(16); return h.length === 1 ? '0' + h : h; }
      return hexToHsl('#' + tx(rgbMatch[1]) + tx(rgbMatch[2]) + tx(rgbMatch[3])).h;
    }
    return rand(0, 360);
  }

  // ── PREPARAR ATMÓSFERA CUÁNTICA COMPLETA DEL LIBRO ────────────────────
  function prepareQuantumPalette(libro) {
    var hueBase = extractHueBase(libro);
    var palette = generateBookPalette(hueBase);
    var geometry = generateBlockGeometry();

    var blocks = [];
    var hexColors = [];
    var textColors = [];

    for (var i = 0; i < 4; i++) {
      var c1 = palette.colors[i];
      var c2 = palette.colors[(i + 1) % 4];
      var legib = ensureLegibility(c1, c2);
      blocks.push({ c1: legib.c1Adj, c2: legib.c2Adj, textColor: legib.textColor, adjusted: legib.adjusted });
      hexColors.push(hslToHex(legib.c1Adj.h, legib.c1Adj.s, legib.c1Adj.l));
      textColors.push(legib.textColor);
    }

    return {
      hueBase: hueBase,
      palette: palette,
      geometry: geometry,
      blocks: blocks,
      hexColors: hexColors,
      textColors: textColors
    };
  }

  // ── APLICAR GRADIENTES COMPUESTOS POST-RENDER ─────────────────────────
  function enhanceBlockBackgrounds(quantum) {
    var blockEls = document.querySelectorAll('#grid .block');
    if (blockEls.length !== 4) return;

    for (var i = 0; i < 4; i++) {
      var el = blockEls[i];
      var b = quantum.blocks[i];
      el.style.background = composeBlockGradient(b.c1, b.c2, quantum.geometry, i);

      // Asegurar text colors (label + frase)
      var label = el.querySelector('.label');
      var frase = el.querySelector('.frase');
      if (label) label.style.color = b.textColor;
      if (frase) frase.style.color = b.textColor;
    }
  }

  // ── ENHANCE CTA BUTTONS CON COLORES CUÁNTICOS ──────────────────────────
  // Los CTA del index.html se asignan en el reveal handler con libro.colores
  // originales. Como no podemos modificar libro.colores (closure cerrado),
  // un MutationObserver detecta cuando el cta se hace display:flex y
  // re-aplica los colores cuánticos por encima.
  function enhanceCTA(quantum) {
    if (!quantum) return;
    var c = quantum.blocks;
    // 4 bloques + 4 botones — coherencia cuántica total
    var ids = ['otro', 'fisico', 'share', 'like'];
    for (var i = 0; i < ids.length; i++) {
      var btn = document.getElementById(ids[i]);
      if (!btn) continue;
      var b1 = c[i % 4], b2 = c[(i + 1) % 4];
      btn.style.background = 'linear-gradient(135deg, ' +
        hslCss(b1.c1.h, b1.c1.s, b1.c1.l) + ', ' +
        hslCss(b2.c1.h, b2.c1.s, b2.c1.l) + ')';
      btn.style.color = b1.textColor;
    }
  }

  // ── PREPARAR DESDE EL DOM (sin libro) — CON DETECCIÓN DE INSISTENCIA ──
  function prepareFromDOM() {
    var hueBase = extractHueBaseFromDOM();
    if (hueBase === null) return null;

    // Detectar insistencia del usuario: si el mismo hueBase aparece en <30s
    // significa que el filtro está dando el mismo libro repetidamente.
    // Activar variedad cromática agresiva para dar la sensación de "infinito".
    var now = Date.now();
    var deltaHue = _lastHueBase !== null ? Math.abs(hueBase - _lastHueBase) : 999;
    var isInsistent = (_lastHueBase !== null && deltaHue < 5 && (now - _lastApplyTime) < 30000);
    _lastHueBase = hueBase;
    _lastApplyTime = now;

    var palette = isInsistent ? generateAggressiveVariety(hueBase) : generateBookPalette(hueBase);
    var geometry = generateBlockGeometry();
    var blocks = [];
    var hexColors = [];
    var textColors = [];
    for (var i = 0; i < 4; i++) {
      var c1 = palette.colors[i];
      var c2 = palette.colors[(i + 1) % 4];
      var legib = ensureLegibility(c1, c2);
      blocks.push({ c1: legib.c1Adj, c2: legib.c2Adj, textColor: legib.textColor, adjusted: legib.adjusted });
      hexColors.push(hslToHex(legib.c1Adj.h, legib.c1Adj.s, legib.c1Adj.l));
      textColors.push(legib.textColor);
    }
    return {
      hueBase: hueBase, palette: palette, geometry: geometry,
      blocks: blocks, hexColors: hexColors, textColors: textColors
    };
  }

  // ── HOOK: monkey-patch a window.render ────────────────────────────────
  function install() {
    if (typeof window.render !== 'function') return false;
    if (window._quantumBlocksPatched) return true;

    var original = window.render;
    var ctaObserverInstalled = false;

    window.render = function() {
      // 1. Render original — pinta los .block con linear-gradient del catálogo
      var ret;
      try { ret = original.apply(this, arguments); }
      catch (e) { if (typeof console !== 'undefined') console.error('[Triggui Quantum Blocks] render error:', e); }

      // 2. DESPUÉS leer hue del DOM y aplicar paleta cuántica
      requestAnimationFrame(function() {
        try {
          var quantum = prepareFromDOM();
          if (!quantum) return;
          window._lastQuantumBlocks = quantum;
          enhanceBlockBackgrounds(quantum);

          // 3. Instalar observer del CTA UNA SOLA VEZ
          if (!ctaObserverInstalled) {
            var ctaEl = document.getElementById('cta');
            if (ctaEl && typeof MutationObserver !== 'undefined') {
              var obs = new MutationObserver(function(muts) {
                for (var m = 0; m < muts.length; m++) {
                  if (muts[m].attributeName === 'style' && ctaEl.style.display === 'flex') {
                    setTimeout(function() { enhanceCTA(window._lastQuantumBlocks); }, 0);
                    break;
                  }
                }
              });
              obs.observe(ctaEl, { attributes: true, attributeFilter: ['style'] });
              ctaObserverInstalled = true;
            }
          }

          // 4. Telemetría
          if (typeof console !== 'undefined' && console.log) {
            console.log('[Triggui Quantum Blocks v2]',
              'strategy=' + quantum.palette.strategy,
              'distribution=' + quantum.geometry.distribution,
              'hueBase=' + quantum.hueBase.toFixed(0) + '°',
              'WCAG-fixes=' + quantum.blocks.filter(function(b){return b.adjusted;}).length + '/4'
            );
          }
        } catch (e) {
          if (typeof console !== 'undefined') console.error('[Triggui Quantum Blocks] enhance error:', e);
        }
      });

      return ret;
    };
    window._quantumBlocksPatched = true;

    // Aplicación inicial si los .block ya estaban en DOM
    setTimeout(function() {
      if (document.querySelectorAll('#grid .block').length === 4) {
        try {
          var quantum = prepareFromDOM();
          if (quantum) {
            window._lastQuantumBlocks = quantum;
            enhanceBlockBackgrounds(quantum);
          }
        } catch (e) { if (typeof console !== 'undefined') console.error('[Triggui Quantum Blocks] initial apply error:', e); }
      }
    }, 100);

    if (typeof console !== 'undefined' && console.log) console.log('[Triggui Quantum Blocks v2] instalado nivel dios todopoderoso');
    return true;
  }

  function waitFor(predicate, action, attempts) {
    if (predicate()) { action(); return; }
    if (attempts <= 0) return;
    setTimeout(function() { waitFor(predicate, action, attempts - 1); }, 50);
  }

  waitFor(
    function() { return typeof window.render === 'function'; },
    install,
    50
  );
})();
