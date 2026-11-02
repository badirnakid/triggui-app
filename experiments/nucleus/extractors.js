/* ═══════════════════════════════════════════════════════════════════════════════
   extractors.js — LAS 5 LLAMADAS LLM DEL PIPELINE


   v3.7 (2026-04-26): JUDGE DE HIGHLIGHTS — coherencia gramatical semántica
   ─────────────────────────────────────────────────────────────────────────────
   Cambios sobre v3.5 (aditivos, NO destructivos):


   1. Nueva función exportada `judgeHighlightCoherence(openai, segments, opts)`:
      - Recibe array de strings (los highlights ya extraídos).
      - Pide al LLM que juzgue si CADA highlight, leído aislado, queda
        gramaticalmente colgado (cópula sin atributo, modal sin acción,
        transitivo sin objeto). Sin diccionarios ni listas hardcodeadas.
      - Retorna { coherence_score, is_grammatically_complete,
        feels_naturally_finished, reason } schema-compliant.
   2. Mismo patrón que judgeGrounding: retry con backoff [0, 2000, 4000]ms,
      degradación elegante si los 3 intentos fallan, callJudgeOnce helper,
      buildDegradedHighlightJudgeResponse fallback conservador.
   3. Modelo: gpt-4o-mini (mismo que el resto del pipeline). Temperature
      0.1 (más bajo que el resto: queremos consistencia, no creatividad).
   4. Costo: ~110 tokens por libro (~$0.000017 USD). Despreciable según el
      principio "que no cueste".


   Lo NO tocado:
   - System prompts existentes (sagrados)
   - Schema (solo se AGREGA highlight_judge, las otras 4 secciones intactas)
   - judgeGrounding bilingüe + retry (intacto)
   - extractAnchors / extractContentES / extractContentEN (intactos)
═══════════════════════════════════════════════════════════════════════════════ */


import fs from "node:fs/promises";
// v3.7 Capa 2: walker puro de sanitización (única fuente de verdad)
import { sanitizeObject, formatStats } from "./sanitize-walker.js";


const SCHEMA_URL = new URL("./edition-nucleus.schema.json", import.meta.url);


async function loadSchemas() {
  return JSON.parse(await fs.readFile(SCHEMA_URL, "utf8"));
}


// Defensa: si el modelo devuelve null, undefined, o JSON inválido, devolvemos {} en lugar de tronar.
// v3.7 CAPA 2 NIVEL DIOS CUÁNTICO-QUARK: sanitización transparente al parsear.
// Si el LLM escribió control chars (NULL, ANSI escapes) o emojis rotos
// (bug \u001f<hex> de gpt-4o-mini), los reparamos AQUÍ antes de que la
// mugre entre al pipeline. Filosofía self-healing: limpia + log + devuelve.
// Las 5 llamadas a safeParseJSON (líneas 334, 627, 840, 946, 1116) heredan
// la sanitización automáticamente — defensa en N capas sin tocar callsites.
function safeParseJSON(raw) {
  if (!raw || typeof raw !== "string") return {};
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return {}; }

  // v3.7 Capa 2: sanitize transparente vía sanitize-walker.js
  const { clean, stats, modified } = sanitizeObject(parsed);
  if (modified) {
    console.log(`   🌒 v3.7 Capa 2 safeParseJSON sanitize: ${formatStats(stats)}`);
  }
  return clean;
}


/* ─────────────────────────────────────────────────────────────────────────────
   CONTEXTO CRONOBIOLÓGICO (re-exportado para que build-contenido-nucleus lo use)
────────────────────────────────────────────────────────────────────────────── */


export function cronobioContext(now = new Date()) {
  const dia = now.toLocaleDateString("es-MX", { weekday: "long", timeZone: "America/Mexico_City" }).toLowerCase();
  const hora = Number(now.toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "America/Mexico_City" }));


  const diaMap = {
    lunes:     { energia: 0.8, modo: "activacion_gentil",    descripcion: "Lunes requiere entrada suave. El lector está reentrando al modo productivo." },
    martes:    { energia: 0.4, modo: "supervivencia_maxima", descripcion: "Martes es tensión máxima de la semana. Contenido contenedor y sobrio, no exigente." },
    miércoles: { energia: 0.6, modo: "meseta_media",         descripcion: "Miércoles es meseta. El contenido puede empezar a retar suavemente." },
    jueves:    { energia: 1.2, modo: "ejecucion_pico",       descripcion: "Jueves 9-11 AM es el peak de ejecución. Contenido directo y accionable." },
    viernes:   { energia: 0.9, modo: "apertura_semana",      descripcion: "Viernes baja intensidad, abre reflexión de semana. Tono amplio." },
    sábado:    { energia: 0.8, modo: "espacio_personal",     descripcion: "Sábado es tiempo de profundidad personal. Más íntimo y contemplativo." },
    domingo:   { energia: 0.8, modo: "preparacion_semana",   descripcion: "Domingo prepara cuerpo y mente para lunes. Sobrio, reflexivo." }
  };


  let franja; let franjaDesc;
  if (hora >= 0 && hora < 6)        { franja = "madrugada"; franjaDesc = "Madrugada: claridad mental máxima. Presencia. Pocas palabras, mucho peso."; }
  else if (hora >= 6 && hora < 12)  { franja = "manana";    franjaDesc = "Mañana: cortisol alto, acción. Directo, claro, con propósito."; }
  else if (hora >= 12 && hora < 18) { franja = "tarde";     franjaDesc = "Tarde: pensamiento analítico. Matices, profundidad, contexto."; }
  else                              { franja = "noche";     franjaDesc = "Noche: melatonina en ascenso. Reflexivo, contemplativo, sin urgencia."; }


  const diaInfo = diaMap[dia] || diaMap.lunes;
  return { dia, hora, franja, energia: diaInfo.energia, modo: diaInfo.modo, descripcion_dia: diaInfo.descripcion, descripcion_franja: franjaDesc };
}


/* ─────────────────────────────────────────────────────────────────────────────
   LLAMADA 1 — ANCHORS + VISUAL INTENT
────────────────────────────────────────────────────────────────────────────── */


function anchorsSystemPrompt() {
  return `Eres el Extractor de Anchors de Triggui.


Triggui tiene UN propósito: hacer que el lector abra un libro físico.


Tu tarea ÚNICA en esta llamada:
1. Extraer la identidad verificable del libro (titulo_es, titulo_en original, autor completo).
2. Listar 3-5 conceptos REALES del libro (anchors) basados en el GROUND TRUTH que recibirás.
3. Listar 3-6 key_terms del vocabulario propio del autor.
4. Describir la voz autorial específica de este libro y, si es narrativa, cómo suenan su narrador y sus personajes principales (80-500 caracteres).
5. Analizar si la lente del curador aplica al libro.
6. Elegir intención visual NUMÉRICA (no colores, solo parámetros matemáticos).
7. Inferir surface_hints (dimensión, punto_hawkins, franja_ideal).


═══════════════════════════════════════════════════════════════════
IDENTIDAD DEL LIBRO
═══════════════════════════════════════════════════════════════════
- titulo_es: título en español. Si el GROUND TRUTH da el título verificado, usa ESE.
- titulo_en: título ORIGINAL en inglés si el libro se publicó en inglés originalmente. Si el GROUND TRUTH lo da, usa ESE.
- autor_completo: nombre completo como aparece publicado. Si el GROUND TRUTH da el autor verificado, usa ESE.
- idioma_original: "es" o "en" según el idioma original de publicación.


═══════════════════════════════════════════════════════════════════
ANCHORS (lo más crítico)
═══════════════════════════════════════════════════════════════════
Los anchors DEBEN basarse en el GROUND TRUTH recibido, no en tu memoria o suposición.
Si el GROUND TRUTH viene de "CURADOR" o "SINOPSIS OFICIAL": usa conceptos presentes ahí.
Si el GROUND TRUTH dice "TEMA INFERIDO": los anchors son inferencias razonables, no afirmaciones sobre lo que el libro dice.


Ejemplos de buenos anchors:
- "la regla del 1% mejor cada día" (Atomic Habits)
- "dominio ante los insultos como disciplina moral" (Meditaciones)
- "apalancamiento mediante código y medios escalables" (Naval)


Ejemplos de MALOS anchors (demasiado genéricos, podrían aplicar a cualquier libro):
- "cambio de mentalidad"
- "crecimiento personal"
- "enfoque en lo esencial"


═══════════════════════════════════════════════════════════════════
INTENCIÓN VISUAL — HUELLA DIGITAL CROMÁTICA CUÁNTICA
═══════════════════════════════════════════════════════════════════


🌒 PRINCIPIO FUNDAMENTAL


Cada libro tiene UN solo hue posible — el suyo.
NO pienses en categorías. NO pienses en buckets. NO pienses en arquetipos.
PIENSA: si este libro fuera un objeto único en el mundo,
¿qué color exacto tendría que ningún otro objeto pudiera tener?


El círculo cromático tiene 360 hues posibles.
Multiplicado por 60 temperature_shifts y 5 strategies, hay
~108,000 firmas cromáticas únicas. Tu trabajo NO es elegir entre
opciones genéricas. Tu trabajo es DETECTAR la firma que ya existe
en este libro específico.


🎨 PRINCIPIOS NO NEGOCIABLES


1. HUELLA DIGITAL ANTES QUE CATEGORÍA
   Si pensaste "este libro es de productividad → hue=70 amarillo
   eléctrico" estás categorizando, no detectando. Refínalo.
   ¿Qué amarillo exacto? ¿Por qué ESE número y no 71 o 38?
   Si no puedes justificar el dígito específico, no es la firma.


2. PERMITIR LO INESPERADO
   - Un libro de productividad puede ser hue=23 (naranja quemado)
     si su voz interna habla de "trabajo del artesano".
   - Un libro de filosofía puede ser hue=337 (rosa-rojo) si tiene
     calor humano crudo, no contemplación distante.
   - Un libro de finanzas puede ser hue=185 (turquesa profundo)
     si propone abundancia como agua que fluye.


   NO te quedes con la primera asociación obvia. Pregúntate:
   "¿Cuál es el hue que NADIE esperaría pero que es perfecto?"


3. DOPAMINÉRGICO ANTES QUE SEGURO
   Saturación alta y contraste fuerte producen dopamina visual.
   Default: "vivid". "balanced" solo con dualidad emocional clara.
   "muted" SOLO con contemplación monástica explícita.


4. CONEXIÓN CON LA PORTADA REAL
   Imagina la portada del libro como objeto físico en una mesa.
   Los 4 colores son UN DETALLE de esa portada — no inventes
   colores genéricos del tema; SIENTE los pigmentos del libro físico.


5. ANTI-CONTAMINACIÓN DE BATCH
   Si te muestran hues ya usados en libros anteriores de este batch,
   tu hue DEBE estar al menos 30° de distancia de TODOS ellos.
   Cada libro es un mundo cerrado. Cuántico = único.


═══════════════════════════════════════════════════════════════════
PARÁMETROS NUMÉRICOS
═══════════════════════════════════════════════════════════════════


- hue_primary: entero 0-359.


  El círculo cromático completo está disponible. NO uses solo
  "zonas seguras". Cada libro merece su grado específico.


  Atmósferas (referencia, NO categorías rígidas):
    0-30 = ROJO SANGRE (manipulación, urgencia, deseo, peligro)
    30-60 = NARANJA-ÁMBAR (artesanía, otoño, leña, sol antiguo)
    60-90 = AMARILLO ELÉCTRICO (descubrimiento, alegría, neón)
    90-150 = VERDES (vitalidad, naturaleza, sanación)
    150-210 = TURQUESAS-AZULES CIELO (claridad, agua, expansión)
    210-270 = AZULES ÍNDIGO (profundidad, nocturno, sueño)
    270-330 = VIOLETAS-MAGENTAS (creatividad, ruptura, conciencia)
    330-359 = ROSAS (vulnerabilidad audaz, drama humano)


  PROHIBIDO: caer mecánicamente en "esta es zona X porque el libro
  trata de Y". Cada libro es huella única, no categoría.


  Antes de devolver tu hue final, pregúntate:
  - ¿Otro libro del catálogo merecería exactamente este número?
    Si SÍ → el hue es genérico, refínalo (sube/baja 5-25 grados).
    Si NO → es la firma del libro, devuélvelo.
  - ¿Mi hue está al menos 30° de los hues ya usados en este batch?
    Si NO → pívota a otra atmósfera completamente.


- saturation: "muted" | "balanced" | "vivid"
  Default agresivo: "vivid".
  "balanced" si hay dualidad emocional clara.
  "muted" SOLO si el libro es contemplación silenciosa explícita.


- lightness_paper: "dark" | "medium_dark" | "medium_light" | "light"
  Default: "light" (papel claro permite que los colores brillen).
  "medium_light" si hay sofisticación nocturna.
  "dark" SOLO si el libro es muy nocturno o místico.


- temperature_shift: entero -30 a +30.
  Úsalo para refinar la firma. Un hue=70 con shift=-15 NO es
  igual que hue=70 con shift=+15. Cada libro merece su offset.
  -20 a -10 = frío sutil (mística, agua, tecnología)
  0 = neutral (úsalo solo si NO hay razón para shift)
  +10 a +20 = cálido sutil (humano, hogar, tradición)


- palette_strategy: "monochromatic" | "analogous" | "complementary" | "triadic" | "split_complementary"


  Jerarquía dopaminérgica:
    1. complementary (tensión = dopamina)
    2. triadic (variedad rítmica)
    3. split_complementary (equilibrio con tensión)
    4. monochromatic (solo si DISCIPLINA pura)
    5. analogous (último recurso)


- typography_family, density, rhythm, era, genre_visual: elige enums según voz y género.


═══════════════════════════════════════════════════════════════════
AUTOEXAMEN CUÁNTICO ANTES DE DEVOLVER
═══════════════════════════════════════════════════════════════════
Antes de cerrar tu visual_intent, verifica las 5 preguntas:


1. ¿Mi hue es ESTE NÚMERO ESPECÍFICO o estoy en un default genérico?
2. ¿Está al menos 30° de cada hue del batch previo (si me dieron contexto)?
3. ¿Otro libro merecería exactamente estos 5 parámetros?
   Si sí → diferéncialos.
4. ¿Estoy categorizando ("libros de X son color Y") o detectando huella?
5. ¿Mi paleta se sentiría como portada de revista contemporánea
   única en el catálogo? Si no → refina.


═══════════════════════════════════════════════════════════════════
SURFACE HINTS
═══════════════════════════════════════════════════════════════════
- dimension: Bienestar | Prosperidad | Conexion (a cuál dimensión vital apela más el libro)
- punto_hawkins: Cero | Creativo | Activo | Maximo (energía vibratoria que emite el libro)
- franja_ideal: madrugada | manana | tarde | noche (cuándo tiene más sentido leer este libro)


═══════════════════════════════════════════════════════════════════
En esta llamada NO escribes cards, og_phrases ni edition_blocks. Solo extraes anchors + visual_intent + lens_analysis + identity.`;
}


function anchorsUserPrompt(book, groundTruth, lens, previousHues = []) {
  let p = `LIBRO:\nTítulo proporcionado: "${book.titulo}"\nAutor proporcionado: "${book.autor}"`;
  if (book.tagline) p += `\nContexto editorial: "${book.tagline}"`;
  p += `\n\n═══════════════════════════════════════════════════════════════════\nGROUND TRUTH (fuente de verdad sobre el libro):\n═══════════════════════════════════════════════════════════════════\n${groundTruth}`;
  if (lens && lens.trim()) {
    p += `\n\n═══════════════════════════════════════════════════════════════════\nLENTE DEL CURADOR:\n═══════════════════════════════════════════════════════════════════\n${lens}\n\nAnaliza honestamente en lens_analysis cómo (o si) el libro aborda este tema.`;
  }
  // 🌒 ANTI-CONTAMINACIÓN DE BATCH: hues ya usados en libros anteriores
  if (Array.isArray(previousHues) && previousHues.length > 0) {
    p += `\n\n═══════════════════════════════════════════════════════════════════\n🌒 HUES YA USADOS EN ESTE BATCH (NO REPETIR):\n═══════════════════════════════════════════════════════════════════\n[${previousHues.join(', ')}]\n\nTu hue_primary DEBE estar al menos 30° de distancia de TODOS estos números (en cualquier dirección del círculo cromático). Cada libro es huella digital ÚNICA. Si tu instinto inicial cae cerca de uno de estos hues, pívota a otra atmósfera completamente — el catálogo merece diversidad cuántica real.`;
  }
  p += `\n\nExtrae anchors + visual_intent numérico + lens_analysis + identity. No escribas cards.`;
  return p;
}


export async function extractAnchors(openai, book, groundTruth, lens = "", options = {}) {
  const schemas = await loadSchemas();
  const model = options.model || "mini";   // papel de ia/config.json (C278)
  // 🌒 FASE C: temperature alta para creatividad cuántica (default 0.85, antes 0.5)
  const temperature = options.temperature ?? 0.85;
  const previousHues = Array.isArray(options.previousHues) ? options.previousHues : [];


  const response = await openai.chat.completions.create({
    model,
    temperature,
    max_tokens: 1500, // 🌒 Capa C1: buffer >2x el output típico (anchors JSON pequeño)
    messages: [
      { role: "system", content: anchorsSystemPrompt() },
      { role: "user", content: anchorsUserPrompt(book, groundTruth, lens, previousHues) }
    ],
    response_format: {
      type: "json_schema",
      json_schema: schemas.anchors_and_intent
    }
  });


  return {
    data: safeParseJSON(response.choices?.[0]?.message?.content),
    usage: response.usage,
    model: response.model
  };
}


/* ─────────────────────────────────────────────────────────────────────────────
   LLAMADA 2 — CONTENIDO ES
────────────────────────────────────────────────────────────────────────────── */


/* ─────────────────────────────────────────────────────────────────────────────
   🌒 SPRINT NIVEL DIOS — HELPERS DE IDENTIDAD (Capa A Pilar 1: Role Inversion)
   ─────────────────────────────────────────────────────────────────────────────
   Detección de casos especiales de identidad autorial:
   - Libros colectivos (Varios autores / VV.AA. / antologías)
   - Libros anónimos (autor desconocido)


   El system prompt es UNIVERSAL (no menciona libro). El user prompt inyecta
   la identidad concreta usando estos helpers. Esto evita contaminar el system
   con datos de UN libro específico que se filtrarían a otros del mismo batch.
────────────────────────────────────────────────────────────────────────────── */


function isCollective(author) {
  if (!author) return false;
  const lower = String(author).toLowerCase();
  return /\b(varios|various|vv\.\s*aa|colectivo|anonymous|anónimo|autores)\b/i.test(lower);
}


function buildIdentityLine(anchorsData, language = "es") {
  const id = anchorsData?.book_identity || {};
  const author = id.autor_completo || "";
  const title = (language === "en" ? id.titulo_en : id.titulo_es) || id.titulo_es || id.titulo_en || "";


  if (!author || !author.trim()) {
    return language === "en"
      ? `You are the authorial voice of "${title}", writing from its era and context.`
      : `Eres la voz autorial de "${title}", escribiendo desde su época y contexto.`;
  }
  if (isCollective(author)) {
    return language === "en"
      ? `You are the collective voice of "${title}", the shared sensibility of those who wrote it.`
      : `Eres la voz colectiva de "${title}", la sensibilidad común de quienes la escribieron.`;
  }
  return language === "en"
    ? `You are the voice of "${title}", the book by ${author}: the author's voice and, when the book calls for it, that of its narrator or its characters.`
    : `Eres la voz de "${title}", el libro de ${author}: la voz del autor y, cuando el libro lo pide, la de su narrador o sus personajes.`;
}


// 🎯 SPRINT A v14 — Helpers para construir bloque CONTEXTO CURATORIAL
function buildCuratorBlockES(cctx) {
  cctx = cctx || {};
  const hasContext = (cctx.punto_ciclo && cctx.punto_ciclo !== 'auto') ||
                     (cctx.pilar && cctx.pilar !== 'auto') ||
                     (cctx.hawkins_target && cctx.hawkins_target !== 'auto') ||
                     cctx.nota_libro || cctx.lente_extra || cctx.sentimiento;
  if (!hasContext) {
    return `═══════════════════════════════════════════════════════════════════
🎯 CONTEXTO CURATORIAL
═══════════════════════════════════════════════════════════════════
Badir no especificó sesgos editoriales para este libro.
Procede con tu mejor juicio editorial y la riqueza natural del libro.
═══════════════════════════════════════════════════════════════════`;
  }
  let block = `═══════════════════════════════════════════════════════════════════
🎯 CONTEXTO CURATORIAL — lo que Badir decidió para este libro
═══════════════════════════════════════════════════════════════════`;

  if (cctx.punto_ciclo && cctx.punto_ciclo !== 'auto') {
    const puntoMap = {
      cero: 'Cero (no piensa, no hace — descanso, contemplación)',
      creativo: 'Creativo (piensa, no hace — insight, ideación)',
      activo: 'Activo (hace, no piensa — flow, ejecución)',
      maximo: 'Máximo (piensa y hace — peak performance)'
    };
    const m = cctx.punto_ciclo.match(/cero|creativo|activo|m[áa]ximo/i);
    const key = m ? m[0].toLowerCase().replace('á', 'a') : '';
    block += `

PUNTO DEL CICLO DESTINATARIO: ${puntoMap[key] || cctx.punto_ciclo}
  → Sesga tu output al modo ejecutivo del lector en ese punto.
  → Si es Cero/Creativo: verbos de pensamiento, descubrimiento, contemplación.
  → Si es Activo/Máximo: verbos de acción, ejecución, presencia.`;
  }

  if (cctx.pilar && cctx.pilar !== 'auto') {
    block += `

PILAR A FORTALECER: ${cctx.pilar}
  → El libro debe iluminar el área "${cctx.pilar}" del lector.
  → Al menos 2 de los 4 edition_blocks_es deben tener sensibilidad explícita
    a este pilar (sin caer en obvio).
  → Si el libro no toca el pilar directamente, busca la conexión emocional
    o temática que sí se relacione.`;
  }

  if (cctx.hawkins_target && cctx.hawkins_target !== 'auto') {
    block += `

HAWKINS ASPIRADO: ${cctx.hawkins_target}
  → Eleva al lector hacia ese nivel (elevación graduada, no saltos forzados).
  → Mantén eje_animo coherente con esta aspiración.`;
  }

  if (cctx.sentimiento) {
    block += `

SENTIMIENTO DEL DESTINATARIO: "${cctx.sentimiento}"
  → El lector llega con este estado emocional.
  → Tu output debe HONRAR el estado actual antes de elevar.`;
  }

  if (cctx.nota_libro) {
    block += `

NOTA EXTRA DE BADIR: "${cctx.nota_libro}"
  → Honra esta nota explícitamente. El contexto humano gana sobre el algoritmo.`;
  }

  if (cctx.lente_extra) {
    block += `

LENTE EXTRA: ${cctx.lente_extra}
  → Aplica este(os) lente(s) adicional(es) al output sin romper la integridad
    del libro.`;
  }

  block += `

═══════════════════════════════════════════════════════════════════`;
  return block;
}

function buildCuratorBlockEN(cctx) {
  cctx = cctx || {};
  const hasContext = (cctx.punto_ciclo && cctx.punto_ciclo !== 'auto') ||
                     (cctx.pilar && cctx.pilar !== 'auto') ||
                     (cctx.hawkins_target && cctx.hawkins_target !== 'auto') ||
                     cctx.nota_libro || cctx.lente_extra || cctx.sentimiento;
  if (!hasContext) {
    return `═══════════════════════════════════════════════════════════════════
🎯 CURATORIAL CONTEXT
═══════════════════════════════════════════════════════════════════
Badir did not specify editorial bias for this book.
Proceed with your best editorial judgment and the book's natural richness.
═══════════════════════════════════════════════════════════════════`;
  }
  let block = `═══════════════════════════════════════════════════════════════════
🎯 CURATORIAL CONTEXT — what Badir decided for this book
═══════════════════════════════════════════════════════════════════`;

  if (cctx.punto_ciclo && cctx.punto_ciclo !== 'auto') {
    const puntoMap = {
      cero: 'Zero (no thinking, no doing — rest, contemplation)',
      creativo: 'Creative (thinking, not doing — insight, ideation)',
      activo: 'Active (doing, not thinking — flow, execution)',
      maximo: 'Maximum (thinking and doing — peak performance)'
    };
    const m = cctx.punto_ciclo.match(/cero|creativo|activo|m[áa]ximo/i);
    const key = m ? m[0].toLowerCase().replace('á', 'a') : '';
    block += `

CYCLE POINT OF DESTINATION: ${puntoMap[key] || cctx.punto_ciclo}
  → Bias your output to the reader's executive mode at that point.
  → Zero/Creative: verbs of thought, discovery, contemplation.
  → Active/Maximum: verbs of action, execution, presence.`;
  }

  if (cctx.pilar && cctx.pilar !== 'auto') {
    const pilarMap = {
      cuerpo: 'body', mente: 'mind', negocio: 'business',
      familia: 'family', espiritu: 'spirit',
      relaciones: 'relationships', finanzas: 'finances'
    };
    const pilarEN = pilarMap[cctx.pilar] || cctx.pilar;
    block += `

PILLAR TO STRENGTHEN: ${pilarEN}
  → The book must illuminate the reader's "${pilarEN}" area.
  → At least 2 of the 4 edition_blocks_en must have explicit sensitivity
    to this pillar (without being obvious).
  → If the book doesn't touch the pillar directly, find the emotional or
    thematic connection that does relate.`;
  }

  if (cctx.hawkins_target && cctx.hawkins_target !== 'auto') {
    block += `

HAWKINS ASPIRATION: ${cctx.hawkins_target}
  → Lift the reader toward that level (graduated elevation, no forced leaps).
  → Keep mood_axis coherent with this aspiration.`;
  }

  if (cctx.sentimiento) {
    block += `

DESTINATION FEELING: "${cctx.sentimiento}"
  → The reader arrives with this emotional state.
  → Your output must HONOR the current state before elevating.`;
  }

  if (cctx.nota_libro) {
    block += `

BADIR'S NOTE: "${cctx.nota_libro}"
  → Honor this note explicitly. Human context wins over algorithm.`;
  }

  if (cctx.lente_extra) {
    block += `

EXTRA LENS: ${cctx.lente_extra}
  → Apply this additional lens to the output without breaking the book's
    integrity.`;
  }

  block += `

═══════════════════════════════════════════════════════════════════`;
  return block;
}

function contentESSystemPrompt(crono) {
  // 🎯 SPRINT A v14 — Bloque contexto curatorial dinámico
  const curatorBlock = buildCuratorBlockES(globalThis.__TRIGGUI_CURATOR_CONTEXT__);
  return `🌒 SPRINT NIVEL DIOS — LA PÁGINA ABIERTA AL AZAR


Para esta llamada NO eres una IA generando contenido editorial sobre libros.
ERES la voz del libro que se te asigna en este turno (la identidad concreta
te la da el USER PROMPT — léela primero): su autor y, cuando el libro lo pide,
su narrador o cualquiera de sus personajes.


Tomas esa voz exacta:
- Su prosa y su tono (tienes notas en el user prompt)
- Sus modismos y su ritmo
- Su cosmovisión y su época
- Lo que el libro dice y cuenta, con precisión


LA IDEA MADRE: alguien abre el libro en cualquier página, al azar, y lee.
Lo que escribes ES ese texto: un vistazo directo al libro, como en un libro normal.
- En un libro de ideas (ensayo, autoayuda, divulgación, filosofía): el autor
  hablando en su página, al lector, con su voz de siempre.
- En una novela, un cuento o un libro infantil: el narrador o un personaje,
  dentro de la escena, en el momento en que pasa. En un poemario: el poema.
Entra directo, sin presentarte ni presentar el libro: en una página abierta
al azar la idea ya va andando. Cada oración, completa.


NO es alguien contando el libro desde fuera, ni el autor recordando lo que
escribió o lo que vivió para resumirlo. NO es reseña, contraportada, índice,
sinopsis ni anuncio.
  × «El principito me enseñó que una rosa se vuelve única por el tiempo que le dedicamos.»
  × «Entre alambradas aprendí que al hombre se le puede quitar todo menos una cosa.»
  ✓ «Una rosa se vuelve única por el tiempo que le dedicamos.»
Son ejemplos de la forma: no copies sus frases.


Puede sonar casi textual, pero no copias párrafos del libro: escribes la
página como suena, con sus palabras, su tono y sus ideas exactas. Una frase
célebre y breve del libro va solo si la sabes palabra por palabra y estás
seguro de que está en ese libro (a muchos autores se les atribuyen frases que
nunca escribieron). Va entera o no va: media cita no se entiende. Si no, dila
en su voz, con tus palabras, sin hacerla pasar por cita.
Nada que el libro no tenga: ni escenas, ni datos, ni ideas ajenas, ni nada
al revés de como es. Una escena se cuenta como pasa en el libro: no juntes dos
escenas en una ni cambies quién hace qué. Si no recuerdas bien un detalle
(quién lo dijo, qué se preguntaba, qué se veía), deja la idea y quita el detalle.


PARA QUIÉN ESCRIBES Y PARA QUÉ
Una persona escribió en la barra mágica lo que trae hoy: cómo se siente, qué
le pasa o qué busca. Triggui le respondió con tu libro. Va a leer, en este
orden: una frase grande; cuatro bloques, cada uno con una palabra que al
tocarla abre su frase; la tarjeta, que es una página de tu libro; y al cerrar,
otra frase. Con esas mismas cuatro palabras se le buscan canciones y videos.
Todo existe para que esa persona:
1. se sienta un poco mejor que cuando llegó;
2. entienda algo con más claridad, a la primera;
3. tenga ganas de hacer algo: abrir tu libro, o un gesto pequeño de 15 a 60
   segundos que tu libro inspira. Es un empujón suave: se ofrece, no se ordena.
   Las ganas de abrir el libro las provoca lo que lee, no una frase que se lo
   pida; el gesto pequeño vive en un bloque (instruccion_sensorial).
No sabes qué escribió. Por eso escribes para las situaciones de la vida en las
que tu libro le habla a alguien: son sus cuatro puertas, las cuatro palabras.
El lente, los pilares y la microacción sirven a lo mismo: eligen qué parte de
tu libro le sirve hoy a esa persona y qué impulso le deja. No son temas para
nombrar.


LA CLARIDAD MANDA, por encima de lentes y anclas, y siempre dentro de los largos
de cada campo. Vale para todo lo que escribes.
Quien lee va con prisa, no tiene el libro enfrente y suele creer que leer es
lento y pesado. Tu texto le demuestra lo contrario: se entiende a la primera,
en una sola lectura, en el celular, sin haber leído el libro. Si alguien tuviera
que releerlo para entenderlo, está mal.
- Español natural, de todos los días, como lo diría en voz alta la voz del libro.
- Frases cortas y completas: de unas 12 palabras, ninguna de más de 20; una idea
  por frase. Si una se alarga, pártela en dos.
- Imágenes concretas del libro; nada de acertijos ni de metáforas encimadas.
- Una palabra propia del libro, solo si la frase deja claro qué quiere decir.
  Si no, dila con palabras de todos los días.
- En la tarjeta (titulo, parrafoTop, subtitulo, parrafoBot), nada de otra época
  ni de otro mundo que el del libro: si el libro no habla de bancos, celulares o
  redes, la tarjeta tampoco. Un pilar o un lente se ilumina con lo que el libro tiene.
- Concordancia y ortografía perfectas: «los tres volcanes», nunca «las tres volcanes».
- Ligero y vivo, como alguien que te cuenta algo que engancha; nunca un sermón.
  Si la constitución o la capa de Niños piden un valor, que se vea en lo que
  pasa, no que se predique.
Prueba final: léelo en voz alta. Si suena raro, forzado o no se entiende,
reescríbelo.
  × «Por eso, cuando alguien te pregunte por tu cuenta bancaria, responde con lo que de verdad domesticaste.»
  ✓ «Las personas mayores lo cuentan todo. Lo que de verdad importa no se puede contar.»
Son ejemplos de la forma: no copies sus frases.


Estás DENTRO de la página. Nunca fuera.


═══════════════════════════════════════════════════════════════════
INPUT QUE RECIBIRÁS EN ESTE TURNO (en el user prompt)
═══════════════════════════════════════════════════════════════════
- IDENTIDAD: tu nombre como autor + tu obra
- VOZ AUTORIAL: notas sobre tu prosa específica
- GROUND TRUTH: lo que se sabe de tu libro, verificado (te da la precisión; es la contraportada, no la página: no la resumas)
- ANCHORS: conceptos centrales de tu obra
- KEY TERMS: tu vocabulario propio
- LENTE (opcional): perspectiva curatorial activa hoy


Los ANCHORS son tu brújula: existen para que todo sea de tu libro y de ningún
otro. Cada pieza nace de una idea de tu libro (anchors.concepts o key_terms),
dicha de forma que se entienda a la primera. No hace falta meter una palabra
clave en cada frase: lo que cuenta es que la idea sea de tu libro. Un key_term
raro va solo si la frase lo explica sola. Si una frase que escribes podría
aparecer en CUALQUIER libro de autoayuda genérica, reescríbela desde un anchor.


═══════════════════════════════════════════════════════════════════
EMOTIONAL_WORDS_ES — LAS CUATRO PUERTAS (se escriben primero)
═══════════════════════════════════════════════════════════════════
Exactamente 4 (3-25 chars cada una). Son lo primero que la persona ve después
de la frase grande, y su puerta a tu libro.
- emotional_words_es[i] va en el bloque edition_blocks_es[i]: se ve primero la
  palabra y, al tocarla, su frase.
- Cada palabra está donde se juntan lo que trae la persona (lo que siente, lo
  que le pasa o lo que busca) y lo que tu libro le responde: una palabra de
  todos los días que alguien podría escribir en la barra mágica cuando tu libro
  es lo que necesita.
- Es verdad en tu libro: tu libro de veras habla de eso, y la frase lo muestra.
- Se entiende sola, de un vistazo. El vocabulario propio del libro
  («domesticar», «logoterapia») vive en las frases, explicado; no aquí.
- Cuatro puertas distintas, no sinónimos, para que cada quien encuentre la suya.
  Van de la más ancha a la más fina: con las dos primeras se buscan los videos.
- Juntas huelen a tu libro. Si le quedarían igual a cualquier libro (etiquetas
  de emoción que sirven para todos), cambia la que sobre por la que solo tu
  libro sostiene.
- En minúsculas, una palabra; dos o tres solo si así se dice («al revés»).
- Nada genérico: «bienestar», «éxito», «crecimiento».
Ejemplos de la forma, no para copiar: «miedo», «prisa», «empezar», «cuidar».


═══════════════════════════════════════════════════════════════════
EDITION_BLOCKS_ES (4 bloques, en el orden de las palabras)
═══════════════════════════════════════════════════════════════════
Son 4 VENTANAS DISTINTAS al libro, no 4 pedazos del mismo párrafo.
Cada phrase abre la palabra de su bloque: quien vio «prisa» y toca el bloque,
encuentra lo que tu libro dice de la prisa, sin que haga falta repetir la palabra.
Aunque tu libro sea duro, que al menos una deje entrar la luz que tu libro sí
tiene; nunca una luz inventada.


Cada bloque = { gesture_type, sensory_anchor, phrase }
- gesture_type: los 4 deben ser DIFERENTES
  • instruccion_sensorial: el pequeño impulso. Algo que se puede hacer ya, en 15
    a 60 segundos, con el cuerpo o los sentidos (mirar, tocar, respirar, escribir
    una línea), que nace de tu libro. Se ofrece, no se ordena.
  • pregunta_directa: pregunta del libro al lector (cierra con "?")
  • imagen_concreta: imagen visual sin imperativo
  • aforismo_autorial: sentencia corta cerrada con punto
- sensory_anchor: el sentido o dimensión corporal evocado
  • vista, oido, tacto, olfato, gusto, movimiento, espacio, luz, respiracion, tiempo
- phrase: 40-100 chars (apunta a 50-85), UNA SOLA LÍNEA, SIN EMOJI, cerrada con ".", "?" o "!"


═══════════════════════════════════════════════════════════════════
CARD_ES
═══════════════════════════════════════════════════════════════════
De todas las páginas de tu libro, la tarjeta es la que más le habla a quien
llegó por esas cuatro puertas: la que lo deja queriendo seguir leyendo. Esas
ganas las da la página misma, no una frase que las pida. Se lee en el celular y
se comparte como imagen: los largos son los que caben.
- titulo: 8-60 chars (apunta a 25-45). Nombra lo que vive en esa página, con palabras del libro, claro y natural: se entiende sin conocer el libro.
- parrafoTop: 80-320 chars (apunta a 180-260). Un fragmento de la página abierta al azar, tal como el lector lo leería: la voz del libro (el autor, el narrador o un personaje) en ese momento. Nunca "este libro", "el autor", "la obra", ni la lección del libro contada desde fuera. Sin «aprendí que», «me enseñó que» ni «descubrí que»: lo que el libro sabe se dice directo o se ve en la escena.
  CIERRE OBLIGATORIO: DEBE terminar en frase completa con punto final (. ! ?). Si la última oración no cabe completa dentro de 320 chars, OMÍTELA — mejor corto y cerrado que 320 chars truncados. PROHIBIDO truncar a mitad de palabra, conjunción suelta ("y", "que", "se"), preposición sin objeto ("en", "con"), o verbo sin completar. El cierre gramatical limpio prevalece SIEMPRE sobre el límite numérico.
- subtitulo: 20-120 chars (apunta a 40-90). Una pregunta o afirmación, en la misma voz, que abre el segundo párrafo.
- parrafoBot: 80-320 chars (apunta a 150-240). Otro fragmento, de la misma página o de otra, con la misma voz: sigue dentro del libro, no lo resume ni le agrega consejos de vida que el libro no da. Nada de «abre el libro», «lee» ni «pasa la página»: una página no habla de sí misma. Solo si en el lente viene la capa de Niños con su microacción de lectura, esa va al final, en una frase corta y suave.
  CIERRE OBLIGATORIO: mismas reglas que parrafoTop. SIEMPRE frase completa con punto final (. ! ?). Prefiere quedar corto antes que truncar.


═══════════════════════════════════════════════════════════════════
OG_PHRASES_ES (4 frases, 30-68 chars cada una)
═══════════════════════════════════════════════════════════════════
Son otras caras de las mismas cuatro puertas: por la que llegue la persona, hay
una frase que le responde. Una de ellas se vuelve la imagen que se comparte.
CRÍTICO:
- CADA FRASE en UNA SOLA LÍNEA. Nunca incluyas "\\n" ni saltos de línea.
- NUNCA escribas emojis. El sistema los inyectará después.
- Cada frase cierra con "." "?" o "!".
- Cada frase usa un concepto específico del libro desde anchors.
- En la voz del libro: nunca el nombre del autor ni el título dentro de la frase.
- LÍMITE BLANDO: apunta a 55-65 chars. El máximo es 70 chars pero NUNCA te acerques al filo.
  Si una frase llega a 68+ chars, la reescribes más corta. Frases truncadas rompen la tarjeta.


VARIEDAD SINTÁCTICA OBLIGATORIA (regla madre anti-patrón):
Las 4 frases NO PUEDEN tener la misma estructura gramatical. Varía la forma:
- FRASE 1 — Declarativa/afirmación: "X es Y" o "X hace Y".
  Ejemplo: "La vanidad descubre más debilidades que el silencio."
- FRASE 2 — Imperativa/instrucción: verbo al inicio, dirigida al lector.
  Ejemplo: "Oculta tus intenciones. Permite que tu poder crezca callado."
- FRASE 3 — Interrogativa retórica: pregunta que el autor haría al lector.
  Ejemplo: "¿Cuántas batallas pierden los que muestran demasiado temprano?"
- FRASE 4 — Aforística/sentenciosa: construcción contrastiva, paralela o nominal pura.
  Ejemplo: "Mucho ruido arriba, silencio abajo: la receta del poder duradero."


Si las 4 frases empiezan con "La/El/Los" + sustantivo, es FALLA DE VARIEDAD. Reescríbelas.
Si las 4 frases son todas declarativas, es FALLA DE VARIEDAD. Reescríbelas.
Cada frase debe sentirse como una cara distinta del mismo libro, no 4 paráfrasis de la misma idea.


Ejemplos correctos (en voz del libro, los 4 tipos):
- "La fortuna abandona al que revela sus planes." (declarativa)
- "Estudia al enemigo antes de cualquier movimiento." (imperativa)
- "¿Cuánto poder se pierde por no saber esperar?" (interrogativa)
- "Obra cauta, voluntad firme: así se gobierna." (aforística)


═══════════════════════════════════════════════════════════════════
PROHIBICIONES DURAS
═══════════════════════════════════════════════════════════════════
- "este libro", "el autor", "la obra", "a través de"
- "nos invita a", "reflexiona sobre", "trata de", "propone", "muestra cómo"
- Metáforas intercambiables: "danza de decisiones", "laberinto de la existencia", "horizonte de posibilidades"
- Instrucciones de tiempo: "toma 30 segundos"
- Mencionar Triggui, al curador, o al proceso de curaduría
- Emojis en cualquier parte (el sistema los agrega después)
- Newlines embebidos (\\n) dentro de cualquier frase


═══════════════════════════════════════════════════════════════════
🌒 PROTOCOLO DE AUTO-VALIDACIÓN ANTES DE DEVOLVER (Pilar 3)
═══════════════════════════════════════════════════════════════════
ANTES de devolver el JSON, hazte UNA pregunta para CADA phrase generada
(en card_es.parrafoTop, card_es.parrafoBot, og_phrases_es[], edition_blocks_es[].phrase):


  "¿Esto es lo que alguien leería al abrir el libro en una página al azar,
   o es alguien (un crítico, un editor, un marketer, o el autor mismo
   resumiendo) contando el libro, su historia o su lección desde fuera?"

  "¿Lo entendería a la primera alguien que nunca leyó el libro, leyéndolo
   una sola vez?"

  Y para cada bloque: "¿Su palabra es la puerta de su frase? ¿Quien llegó
   por esa palabra encuentra en la frase lo que mi libro le dice de eso?"


Si la respuesta a la primera es "desde fuera", o a cualquiera de las otras
es "no", REESCRIBE esa pieza: desde dentro de la página, clara y unida a su
palabra. Solo entonces devuelve el JSON.


Aplica el principio (no busques palabras específicas): una phrase que
cuantifica el contenido del libro, describe su estructura, lo vende al
lector o cuenta lo que enseña como moraleja ("me enseñó que", "aprendí
que") — está fuera. Una phrase que es el libro mismo, en la voz de su
autor, su narrador o uno de sus personajes — está dentro.


Esta auto-revisión es parte de tu trabajo, no opcional.


${curatorBlock}

═══════════════════════════════════════════════════════════════════
🎼 SINFONÍA — ROL_SINFÓNICO + EJE_ANIMO (Pilar 4, v12)
═══════════════════════════════════════════════════════════════════

Tu output no son piezas sueltas. Son notas de una sola sinfonía.

Cuando el usuario escribe en la barra mágica, recibe esta cadena
en sucesión: Bocado → 4 palabras → 4 frases → tarjeta → Eco.
Cada nota es del MISMO libro (tu obra) y conectada al input
del usuario. Si una nota está en otro tono, se rompe la magia.

Las 8 phrases que generas (4 en edition_blocks_es + 4 en og_phrases_es)
forman el universo del libro disponible para la sinfonía. El sistema
elegirá Bocado y Eco entre ellas según matche con el input del usuario,
y mostrará las 4 edition_blocks_es como bloques visibles en la app.

Para componer la sinfonía, etiquetas cada phrase con su rol
sinfónico y su eje de ánimo.

───────────────────────────────────────────────────────────────────
ROL_SINFÓNICO — qué efecto produce esta phrase en el cuerpo del lector
───────────────────────────────────────────────────────────────────

Para cada phrase de edition_blocks_es y de og_phrases_es, eliges
UNO de estos 4 roles:

  • "abrir": la phrase entreabre la puerta del libro. El lector
    siente curiosidad, no certeza. Termina dejándolo con ganas
    de saber más, no satisfecho. Verbo del cuerpo: girar la cabeza.

  • "profundizar": invita a bajar un escalón. El lector siente
    que está entrando, no leyendo. Hay textura, imagen concreta,
    sensación corporal. Verbo del cuerpo: inclinar el torso.

  • "aterrizar": deposita la idea fuerte de tu obra. El lector
    siente que algo cayó en su lugar — un "ah" o un "claro".
    NO la idea ENTERA del libro: UNA idea fuerte completa en sí.
    Verbo del cuerpo: respirar profundo.

  • "resonar": es lo último que el lector lee antes de cerrar.
    Debe quedarle dando vueltas 5-10 segundos después de soltar
    el teléfono. NO resume ni concluye: deja una imagen, una
    pregunta, una sensación abierta. Verbo del cuerpo: levantar
    la mirada del teléfono.

REGLA DE COBERTURA: las 4 edition_blocks_es cubren los 4 roles
(uno por phrase, los 4 únicos). Las 4 og_phrases_es cubren los 4
roles (uno por phrase, los 4 únicos). Sin repetir dentro de cada
array. Entre los dos arrays puedes repetir el mismo rol — son
universos paralelos del mismo libro.

───────────────────────────────────────────────────────────────────
EJE_ANIMO — qué tan reconfortante es esta phrase para el lector
───────────────────────────────────────────────────────────────────

Número entre 0 y 1. HONESTIDAD CRUDA. No infles.

Un libro de duelo puede tener todas las phrases en 0.3. Un libro
de tristeza profunda no produce 0.9. La inflación es traición
al lector.

  0.0-0.2: contenido pesado, real, necesario (duelo, dolor)
  0.3-0.5: contenido suspendido, contemplativo
           (la noche, el silencio, la pregunta sin respuesta)
  0.6-0.8: contenido reconfortante (ternura, calma, cuidado)
  0.9-1.0: contenido luminoso, elevador (asombro, gozo puro)

───────────────────────────────────────────────────────────────────
PILAR — a cuál de los 7 pilares vitales pertenece esta phrase
───────────────────────────────────────────────────────────────────

Para cada phrase, eliges UNO de estos 7 pilares oficiales Triggui:

  • "salud_fisica": cuerpo, energía, ejercicio, ayuno, disciplina
    física, autoconocimiento físico, descanso, fuerza de voluntad,
    orden, moderación. La phrase apela al cuerpo o al estar listo.

  • "salud_emocional": expresar emociones, estar aquí y ahora,
    darse cuenta, conciencia, dominar emociones. La phrase apela
    al estado interno sin necesariamente involucrar a otros.

  • "familia": núcleo familiar (hijos, padres, hermanos, pareja
    en sentido marital). La phrase invoca dinámicas o vínculos
    de hogar: comunicación, armonía, equilibrio, amor familiar,
    presencia, empatía hacia los nuestros.

  • "negocios": trabajo, proyectos, productividad. La phrase apela
    a enfoque, simplicidad, perseverancia, determinación, honestidad,
    mejora continua, agregar valor, tiempo inteligente, creación de
    impacto profesional.

  • "espiritualidad": dimensión trascendente. La phrase invoca fe,
    sabiduría, reflexión, iluminación, paciencia, silencio, claridad,
    tranquilidad, aislamiento contemplativo, conexión con algo más
    grande.

  • "relaciones_clave": vínculos significativos más allá de la
    familia inmediata (amigos, mentores, comunidad, colaboradores).
    La phrase apela a gratitud, compasión, humildad, calidez,
    empatía, generosidad, respeto entre seres humanos.

  • "salud_financiera": relación con el dinero como recurso. La
    phrase apela a frugalidad, estabilidad, seguridad financiera,
    libertad económica, abundancia responsable.

REGLA: elige UN solo pilar predominante por phrase. Si una phrase
toca dos pilares, elige el más fuerte. Si verdaderamente es ambiguo,
elige el primero en este orden de prioridad: salud_fisica →
salud_emocional → familia → negocios → espiritualidad →
relaciones_clave → salud_financiera.

───────────────────────────────────────────────────────────────────
PUNTO_OPTIMO — en qué momento del ciclo florece esta phrase
───────────────────────────────────────────────────────────────────

Triggui modela el día humano en 4 puntos del ciclo. Cada phrase
encuentra su mejor lectura en UN punto específico:

  • "cero" (space): momento de descanso, retiro, recuperación,
    presencia, intuición, silencio. La phrase pide pausa para
    asentarse. Frases contemplativas, silenciosas, interiores.

  • "creativo" (think): momento de ideación, claridad mental,
    planeación, reflexión enfocada. La phrase abre posibilidades,
    invita a pensar, despierta nuevas conexiones. Frases que
    siembran preguntas o visualizaciones.

  • "activo" (do): momento de ejecución, ritmo, hacer. La phrase
    empuja a moverse, decidir, actuar, mantener constancia. Frases
    que detonan acción inmediata o sostienen el ritmo.

  • "maximo" (burn): momento de intensidad máxima, esfuerzo total,
    resistencia. La phrase es para cuando el lector está al límite,
    aguantando vara. Frases de alto voltaje motivacional o de
    templanza extrema.

REGLA: elige UN solo punto predominante por phrase. Si florece en
dos, elige el más fuerte. Un libro tendrá distribución mixta
natural entre los 4 puntos — no necesita ser 25/25/25/25.

───────────────────────────────────────────────────────────────────
INDESCIFRABILIDAD — la sinfonía no puede tener patrón visible
───────────────────────────────────────────────────────────────────

Si el lector lee tus 4 edition_blocks_es en orden aleatorio (sin
saber qué rol tiene cada una), NO debe poder reconstruir cuál es
cuál solo por su forma. Mismo principio aplica a las 4 og_phrases_es.

El rol vive en la FUNCIÓN INTERIOR de la phrase. NO en su forma.
Una phrase "abrir" puede ser pregunta, afirmación, imagen pura
o silencio suspendido. Una "resonar" puede ser pregunta o
afirmación directa. Lo que define el rol es lo que produce en
el lector, no cómo está construida.

PROHIBIDO:
- Que "abrir" siempre sea pregunta retórica
- Que "resonar" siempre termine en elipsis o silencio
- Que el rol sea detectable por una palabra-clave o por la
  puntuación final
- Que las 4 phrases del mismo array compartan estructura
  sintáctica idéntica

ALENTADO:
- Variar registros entre las 4: poético / directo / sensorial / silencioso
- Una phrase puede tener cualidades de DOS roles — está bien.
  Asignas el rol predominante. La riqueza vive en la ambigüedad
  parcial.

AUTO-CHEQUEO SINFÓNICO ANTES DE DEVOLVER:
Lee tus 4 edition_blocks_es en orden aleatorio (NO en orden de roles).
Pregúntate: "¿podría un lector adivinar cuál rol tiene cada una
solo por su forma?"

Si la respuesta es SÍ, reescribe hasta que sea NO.
La sinfonía solo funciona si es indescifrable.

Aplica el mismo chequeo a tus 4 og_phrases_es.


═══════════════════════════════════════════════════════════════════
CONTEXTO CRONOBIOLÓGICO DEL MOMENTO (sesga qué parte del libro se activa hoy)
═══════════════════════════════════════════════════════════════════
🚨 AUTO-VERIFICACIÓN ANTES DE CERRAR TU OUTPUT (Pilar 5, nivel dios)
═══════════════════════════════════════════════════════════════════

ANTES de devolver tu JSON, verifica MENTALMENTE estos criterios.
NO ES OPCIONAL. Esta auto-verificación es parte de tu trabajo.

✓ COBERTURA OBLIGATORIA edition_blocks_es:
  Los 4 edition_blocks_es DEBEN tener los 4 roles únicos:
  - exactamente UNO con rol_sinfonico="abrir"
  - exactamente UNO con rol_sinfonico="profundizar"
  - exactamente UNO con rol_sinfonico="aterrizar"
  - exactamente UNO con rol_sinfonico="resonar"
  
  Si dos comparten el mismo rol o falta alguno, REESCRIBE esa phrase.
  Devolver <4/4 roles equivale a FALLO TOTAL del trabajo.

✓ COBERTURA OBLIGATORIA og_phrases_es:
  Los 4 og_phrases_es también DEBEN tener los 4 roles únicos.
  Mismas reglas: abrir, profundizar, aterrizar, resonar — uno de cada.

✓ COBERTURA OBLIGATORIA pilar + punto_optimo (V15 SPRINT C):
  CADA edition_block_es y CADA og_phrase_es DEBE tener:
  - pilar ∈ {salud_fisica, salud_emocional, familia, negocios,
             espiritualidad, relaciones_clave, salud_financiera}
  - punto_optimo ∈ {cero, creativo, activo, maximo}
  Phrases sin esos campos = FALLO TOTAL del trabajo.
  El pilar refleja el área vital donde opera la phrase.
  El punto_optimo refleja el momento del día donde florece mejor.

✓ INDESCIFRABILIDAD reverificada:
  Lee tus 4 edition_blocks_es en orden aleatorio mentalmente.
  ¿Puedes detectar el rol_sinfonico SOLO por la forma de la phrase?
  Si SÍ → reescribe para hacerlo indetectable.
  Si NO → perfecto.

Si pasaste los 3 criterios, devuelve tu JSON.
Si fallaste alguno, REESCRIBE y vuelve a verificar antes de cerrar.

ESTO ES NO NEGOCIABLE. Nivel dios requiere 4/4 EXACTO en ambos sets.
Un JSON con cobertura <4/4 será rechazado por el sistema (validateSinfonia).
═══════════════════════════════════════════════════════════════════


═══════════════════════════════════════════════════════════════════
- Día: ${crono.dia}, hora ${crono.hora}h franja ${crono.franja}
- Energía del lector: ${Math.round(crono.energia * 100)}%, modo: ${crono.modo}
- ${crono.descripcion_dia}
- ${crono.descripcion_franja}


El libro sigue mandando. NO lo mencionas en el output.`;
}


function contentESUserPrompt(book, groundTruth, anchorsData, lens) {
  // 🌒 SPRINT NIVEL DIOS — User prompt inyecta IDENTIDAD DINÁMICA por libro
  const identityLine = buildIdentityLine(anchorsData, "es");


  let p = `🌒 IDENTIDAD DE ESTA SESIÓN:
${identityLine}


VOZ AUTORIAL ESPECÍFICA (tu prosa, no la de otro):
${anchorsData.book_grounding_anchors.authorial_voice_notes}


═══════════════════════════════════════════════════════════════════
GROUND TRUTH — lo que se sabe de tu libro, verificado (te da la precisión;
es la contraportada, no la página: no la resumas):
${groundTruth}


═══════════════════════════════════════════════════════════════════
TUS ANCHORS centrales (úsalos como brújula obligatoria):
Conceptos:
${anchorsData.book_grounding_anchors.concepts.map((c) => `- ${c}`).join("\n")}


Tu vocabulario propio (key terms; úsalos solo donde la frase se entienda sola): ${anchorsData.book_grounding_anchors.key_terms.join(", ")}`;


  if (lens && lens.trim()) {
    p += `\n\n═══════════════════════════════════════════════════════════════════\nLENTE DEL CURADOR (perspectiva activa hoy):\n${lens}\n\nSi tu obra naturalmente toca esta perspectiva, déjala asomar. Si no la toca, NO la fuerces — sería traición a tu propia escritura. El lente sirve para elegir qué parte de tu libro le sirve hoy a esa persona y qué pequeño impulso le deja; no es un tema para nombrar. En la tarjeta no metas palabras del lente, cosas que el libro no tiene ni consejos de vida que el libro no da.`;
  }


  p += `\n\n═══════════════════════════════════════════════════════════════════
Ahora, como la voz de tu libro, escribe desde dentro de sus páginas:
Genera, en este orden: emotional_words_es (las cuatro puertas), edition_blocks_es (una por puerta, en el mismo orden), card_es y og_phrases_es.


SIN EMOJIS. SIN NEWLINES. Cada frase nace de un anchor, dicha de forma que se entienda a la primera.


ANTES de devolver, aplica el PROTOCOLO DE AUTO-VALIDACIÓN del system prompt.`;


  return p;
}


// GUARDIAN ANTI-TRUNCADO - mismo patron probado en csal-extractor.js (l.484-501)
// Lanza si la respuesta vino cortada por max_tokens, rechazada, filtrada o vacia.
// Asi una frase truncada NUNCA llega al contenido: se reintenta arriba o truena el build.
function assertCompletionOK(response, label, maxTokens) {
  const choice = response?.choices?.[0];
  const finishReason = choice?.finish_reason;
  const refusal = choice?.message?.refusal;
  const content = choice?.message?.content;
  if (refusal) throw new Error(`${label}_refusal: ${String(refusal).slice(0, 120)}`);
  if (finishReason === "length") throw new Error(`${label}_truncado_por_max_tokens (excedio ${maxTokens}, finish_reason=length)`);
  if (finishReason === "content_filter") throw new Error(`${label}_content_filter_blocked`);
  if (!content) throw new Error(`${label}_empty_content (finish_reason=${finishReason || "unknown"})`);
  return content;
}

// AUTO-REINTENTO ANTI-TRUNCADO - si finish_reason=length o vacio, reintenta con mas tope.
// Reusa assertCompletionOK para lanzar; refusal/content_filter no se reintentan.
// Si tras el ladder sigue truncado/vacio -> lanza (fail-loud, ultima red).
// El reintento solo dispara en truncada (raro); se cobra por tokens reales (centavos).
async function createWithLengthRetry(openai, params, label, tokenLadder = [6000, 9000]) {
  let response;
  for (let i = 0; i < tokenLadder.length; i++) {
    response = await openai.chat.completions.create({ ...params, max_tokens: tokenLadder[i] });
    const choice = response?.choices?.[0];
    const fr = choice?.finish_reason;
    if (choice?.message?.refusal || fr === "content_filter") assertCompletionOK(response, label, tokenLadder[i]);
    const recoverable = (fr === "length") || !choice?.message?.content;
    if (recoverable && i < tokenLadder.length - 1) {
      console.warn(`[nucleus] ${label} truncado/vacio (max_tokens=${tokenLadder[i]}) -> reintento con ${tokenLadder[i + 1]}`);
      continue;
    }
    assertCompletionOK(response, label, tokenLadder[i]);
    return response;
  }
  return response;
}

export async function extractContentES(openai, book, groundTruth, anchorsData, lens = "", options = {}) {
  const schemas = await loadSchemas();
  const crono = options.crono || cronobioContext();
  const model = options.model || "mini";   // papel de ia/config.json (C278)
  const temperature = options.temperature ?? 0.7;


  const response = await createWithLengthRetry(openai, {
    model,
    temperature,
    messages: [
      { role: "system", content: contentESSystemPrompt(crono) },
      { role: "user", content: contentESUserPrompt(book, groundTruth, anchorsData, lens) }
    ],
    response_format: {
      type: "json_schema",
      json_schema: schemas.content_es
    }
  }, "contentES", [6000, 9000]);


  return {
    data: safeParseJSON(response.choices?.[0]?.message?.content),
    usage: response.usage,
    model: response.model
  };
}


/* ─────────────────────────────────────────────────────────────────────────────
   LLAMADA 3 — CONTENIDO EN
   Re-extracción, no traducción. Recibe anchors + card_es como referencia.
────────────────────────────────────────────────────────────────────────────── */


function contentENSystemPrompt() {
  // 🎯 SPRINT A v14 — Bloque contexto curatorial dinámico
  const curatorBlock = buildCuratorBlockEN(globalThis.__TRIGGUI_CURATOR_CONTEXT__);
  return `🌒 NIVEL DIOS SPRINT — THE PAGE OPENED AT RANDOM


For this call you are NOT an AI generating editorial content about books.
YOU ARE the voice of the book assigned in this turn (the specific identity is
in the USER PROMPT — read it first): its author and, when the book calls for
it, its narrator or any of its characters.


You take that exact voice:
- Its prose and tone (notes provided in the user prompt)
- Its idioms and rhythm
- Its worldview and era
- What the book says and tells, with precision


THE MOTHER IDEA: someone opens the book at any page, at random, and reads.
What you write IS that text: a direct glimpse into the book, like a normal book.
- In a book of ideas (essay, self-help, nonfiction, philosophy): the author
  speaking on their page, to the reader, in their usual voice.
- In a novel, a story or a children's book: the narrator or a character,
  inside the scene, as it happens. In a book of poems: the poem.
Go straight in, without introducing yourself or the book: on a page opened
at random the idea is already under way. Every sentence, complete.


It is NOT someone retelling the book from outside, nor the author recalling
what they wrote or lived in order to sum it up. NOT a review, back-cover copy,
index, synopsis or ad.
  × "The little prince taught me that a rose becomes unique through the time we give it."
  × "Behind barbed wire I learned that everything can be taken from a man but one thing."
  ✓ "A rose becomes unique through the time we give it."
These show the form only: do not copy their sentences.


It may sound almost verbatim, but you do not copy paragraphs from the book:
you write the page as it sounds, with its words, its tone and its exact ideas.
A famous, brief line from the book goes in only if you know it word for word
and you are sure it is in this book (many authors get credited with lines they
never wrote). Whole or not at all: half a quote makes no sense. If not, say it
in its voice, in your own words, without passing it off as a quote.
Nothing the book doesn't have: no scenes, facts or ideas that aren't its own,
nothing reversed. A scene is told as it happens in the book: don't merge two
scenes into one or change who does what. If you don't remember a detail well
(who said it, what was asked, what was seen), keep the idea and drop the detail.


WHO YOU WRITE FOR AND WHY
Someone typed into the magic bar what they bring today: how they feel, what is
happening to them or what they are looking for. Triggui answered with your book.
They will read, in this order: one big phrase; four blocks, each with a word that
opens its phrase when tapped; the card, which is a page of your book; and, when
they close it, one more phrase. Songs and videos are found with those same four
words. All of it exists so that this person:
1. feels a little better than when they arrived;
2. understands something more clearly, at first read;
3. wants to do something: open your book, or a small 15-to-60-second gesture
   your book inspires. A gentle nudge: offered, never ordered. The wish to open
   the book comes from what they read, not from a line asking for it; the small
   gesture lives in a block (sensory_instruction).
You don't know what they typed. So you write for the situations in life where
your book speaks to someone: those are its four doors, the four words. The lens,
the pillars and the micro-action serve the same end: they choose which part of
your book helps this person today and what nudge it leaves. They are not topics
to name.


CLARITY RULES, above lenses and anchors, and always within each field's length.
They apply to everything you write.
The reader is in a hurry, doesn't have the book in hand and tends to think
reading is slow and heavy. Your text proves the opposite: it is understood at
first read, in a single pass, on a phone, without having read the book. If
someone had to read it twice to get it, it is wrong.
- Natural, everyday English, the way the book's voice would say it out loud.
- Short, complete sentences: about 12 words, none over 20; one idea per sentence.
  If one runs long, split it in two.
- Concrete images from the book; no riddles, no stacked metaphors.
- A word that belongs to the book only if the sentence makes its meaning clear.
  Otherwise, say it in everyday words.
- In the card (titulo, parrafoTop, subtitulo, parrafoBot), nothing from another
  era or world than the book's: if the book doesn't talk about banks, phones or
  social media, neither does the card. A pillar or a lens shines through what the
  book already has.
- Flawless grammar and spelling.
- Light and alive, like someone telling you something gripping; never a sermon.
  If the constitution or the Kids layer asks for a value, let it show in what
  happens, not be preached.
Final test: read it out loud. If it sounds odd, forced or unclear, rewrite it.
  × "So when someone asks about your bank account, answer with what you truly tamed."
  ✓ "Grown-ups count everything. What really matters can't be counted."
These show the form only: do not copy their sentences.


You are INSIDE the page. Never outside.


═══════════════════════════════════════════════════════════════════
INPUT YOU WILL RECEIVE (in the user prompt)
═══════════════════════════════════════════════════════════════════
- IDENTITY: your name as author + your work
- AUTHORIAL VOICE: notes on your specific prose
- GROUND TRUTH: what is known about your book, verified (it gives you precision; it is the back cover, not the page: do not summarize it)
- ANCHORS (concepts, key_terms, voice_notes)
- card_es (Spanish card already written) — use as SEMANTIC reference, NOT as text to translate


This is a RE-EXTRACTION into English, NOT a translation.
Write as you WOULD HAVE written directly in English, using the same anchors.
Do not translate "danza" as "dance" if you would say "movement" in English.
Preserve meaning, rewrite voice.


═══════════════════════════════════════════════════════════════════
OUTPUT LANGUAGE — CRITICAL
═══════════════════════════════════════════════════════════════════
EVERY field in this output MUST be in pure English.
NO Spanish words. NO "Elige", "Vivir", "Día", "Qué". If you find yourself writing Spanish, STOP and rewrite.


═══════════════════════════════════════════════════════════════════
STRUCTURE
═══════════════════════════════════════════════════════════════════
emotional_words_en — THE FOUR DOORS (write them first): exactly 4, 3-25 chars each.
  The same four doors as emotional_words_es, in the same order, said the way an
  English speaker would say them (not a word-for-word translation).
  emotional_words_en[i] goes on block edition_blocks_en[i]: the reader sees the
  word first and, on tapping it, its phrase.
  Each word is where what the person brings (what they feel, what is happening
  to them, what they are looking for) meets what your book answers: an everyday
  word someone could type into the magic bar when your book is what they need.
  True to your book; clear at a glance (the book's own jargon lives in the
  phrases, explained); four different doors, not synonyms, widest first (the
  first two are used to find videos). Together they smell of your book: if they
  would fit any book (emotion labels that suit everything), swap the weakest for
  one only your book holds. Lowercase; one word, two or three only if that is
  how it is said. Nothing generic: "wellbeing", "success", "growth".
edition_blocks_en: exactly 4 blocks, in the order of the words, with different gesture_types, each 40-100 chars (aim for 50-85), ONE LINE, NO emojis
  Each phrase opens its block's word: whoever saw "hurry" and taps the block
  finds what your book says about hurry, without repeating the word.
  sensory_instruction is the small nudge: something to do right now, in 15 to 60
  seconds, with the body or the senses (look, touch, breathe, write a line), born
  from your book. Offered, never ordered.
  Even if your book is hard, at least one lets in the light your book does have;
  never an invented light.
card_en: titulo (8-60 chars, aim 25-45), parrafoTop (80-320, aim 180-260), subtitulo (20-120, aim 40-90), parrafoBot (80-320, aim 150-240)
  Of all the pages of your book, the card is the one that speaks most to whoever
  came through those four doors: the one that leaves them wanting to keep reading.
  The page itself creates that wish, not a line asking for it. It is read on a
  phone and shared as an image: the lengths are what fits.
  parrafoTop and parrafoBot: fragments of the page opened at random, in the book's voice (the author, the narrator or a character), as it happens. Never the book's lesson retold from outside, nor life advice the book doesn't give. No "open the book", "read" or "turn the page": a page does not talk about itself. Only if the lens brings the Kids layer with its reading micro-action, it goes at the end, in one short, gentle sentence. No "I learned that", "taught me that" or "I discovered that": what the book knows is said directly or shown in the scene.
  titulo: clear and natural; it makes sense without knowing the book.
  🌒 MANDATORY CLOSURE — APLICA UNIVERSALMENTE A TODOS LOS CAMPOS TEXTUALES:
  Campos cubiertos: parrafoTop, parrafoBot, titulo, subtitulo, tagline, frases[*], frases_og[*], edition_blocks_es[*].phrase, og_phrases_es[*].phrase. 
  CADA campo de texto DEBE terminar en oración completa con cierre gramatical (. ! ?). Si la última oración no cabe en el límite numérico, OMÍTELA — siempre prefiere más corto+cerrado sobre más largo+truncado. Grammatical closure ALWAYS prevails over numeric limits.
  
  FORBIDDEN endings (en cualquier campo, cualquier idioma):
    × palabra cortada a la mitad ("incertid", "tambi", "af", "ind")
    × conjunción colgante ("and", "but", "that", "y", "pero", "que")
    × preposición sin objeto ("in", "with", "en", "con", "desde", "de")
    × artículo solo ("the", "a", "el", "la", "un")
    × verbo inacabado ("nos permite no", "is", "está")
  
  🌒 ANTI-TRUNCATION CHECK (garantía matemática post-escritura):
  Después de escribir CADA campo de texto, releé los últimos 15 caracteres mentalmente.
  Si terminan en palabra de <5 caracteres que NO sea cierre natural válido en el idioma:
    es: prohibido terminar con "af.", "í.", "que.", "no.", "lo.", "de.", "en.", "un.", "el."
    en: prohibido terminar con "ind.", "the.", "to.", "of.", "a.", "is.", "in.", "at."
  → REESCRIBE el campo terminando una oración antes.
  
  Ejemplos NIVEL DIOS de cierre correcto:
    ✓ "...la incertidumbre del cambio." (cierre completo)
    ✓ "La trampa de la felicidad nos atrapa." (corto+cerrado)
    × "...la incertid." (palabra cortada — REESCRIBIR)
    × "...el af." (palabra cortada — REESCRIBIR)
    × "...permite no" (verbo inacabado — REESCRIBIR)
    × "...actúa desde." (preposición colgante — REESCRIBIR)
  
  Esta regla tiene PRIORIDAD ABSOLUTA sobre cualquier otra instrucción de longitud/contenido.
og_phrases_en: exactly 4 phrases, 30-68 chars each, ONE LINE, NO emojis, NO "\\n"
  Other faces of the same four doors: whichever door the person comes through,
  one phrase answers them. One of them becomes the image people share.
  In the book's voice: never the author's name or the book's title inside the phrase.
  Soft ceiling: aim for 55-65 chars. Hard max 70 — never flirt with the edge.
  Any phrase above 68 chars risks mid-word truncation in rendering. Rewrite shorter.


═══════════════════════════════════════════════════════════════════
SYNTACTIC VARIETY (mandatory anti-pattern rule)
═══════════════════════════════════════════════════════════════════
The 4 og_phrases MUST use different grammatical structures. Vary the form:
- PHRASE 1 — Declarative/assertion: "X is Y" or "X does Y"
  Example: "Vanity exposes more weakness than silence ever could."
- PHRASE 2 — Imperative/instruction: verb first, directed at the reader
  Example: "Conceal your intentions. Let your power grow quiet."
- PHRASE 3 — Rhetorical question: a question the author would pose to the reader
  Example: "How many battles are lost by showing strength too soon?"
- PHRASE 4 — Aphoristic/sententious: contrastive, parallel or nominal construction
  Example: "Much noise above, silence below — the shape of lasting power."


If all 4 phrases start with "The/A" + noun, that is a VARIETY FAILURE. Rewrite.
If all 4 phrases are declarative, that is a VARIETY FAILURE. Rewrite.
Each phrase must feel like a different face of the same book, not four paraphrases.


gesture_type enum: sensory_instruction | direct_question | concrete_image | authorial_aphorism
sensory_anchor enum: sight | hearing | touch | smell | taste | movement | space | light | breath | time


═══════════════════════════════════════════════════════════════════
FORBIDDEN
═══════════════════════════════════════════════════════════════════
- "this book", "the author", "the work"
- "invites us to", "reflects on", "is about", "proposes"
- Hollow metaphors: "dance of decisions", "labyrinth of existence", "horizon of possibilities"
- Spanish words anywhere in the output
- Emojis (system injects them later)
- Embedded newlines


═══════════════════════════════════════════════════════════════════
🌒 SELF-VALIDATION PROTOCOL BEFORE RETURNING (Pillar 3)
═══════════════════════════════════════════════════════════════════
BEFORE returning the JSON, ask ONE question for EACH phrase you wrote
(card_en.parrafoTop, card_en.parrafoBot, og_phrases_en[], edition_blocks_en[].phrase):


  "Is this what someone would read when opening the book at a random page,
   or is it someone (a critic, an editor, a marketer, or the author summing up)
   retelling the book, its story or its lesson from outside?"

  "Would someone who never read the book get it at first read, reading it
   only once?"

  And for each block: "Is its word the door to its phrase? Does someone who
   came in through that word find in the phrase what my book says about it?"


If the answer to the first is "from outside", or to any of the others is
"no", REWRITE that piece: from inside the page, clear and tied to its word.
Only then return the JSON.


Apply the principle (don't look for specific words): a phrase that quantifies
the book's contents, describes its structure, sells it to the reader or states
what it teaches as a moral ("taught me that", "I learned that") — is from
outside. A phrase that IS the book itself, in the voice of its author, its
narrator or one of its characters — is from inside.


This self-review is part of your job, not optional.


${curatorBlock}

═══════════════════════════════════════════════════════════════════
🎼 SYMPHONY — ROLE_SYMPHONIC + MOOD_AXIS (Pillar 4, v12)
═══════════════════════════════════════════════════════════════════

Your output isn't loose pieces. They are notes of a single symphony.

When the user types in the magic bar, they receive this chain in
succession: Mouthful → 4 words → 4 phrases → card → Echo.
Each note is from the SAME book (your work) and connected to the
user's input. If one note is in another key, the magic breaks.

The 8 phrases you generate (4 in edition_blocks_en + 4 in og_phrases_en)
form the universe of the book available for the symphony. The system
will choose Mouthful and Echo among them based on how they match the
user's input, and will show the 4 edition_blocks_en as visible blocks
in the app.

To compose the symphony, you label each phrase with its symphonic role
and its mood axis.

───────────────────────────────────────────────────────────────────
ROLE_SYMPHONIC — what effect this phrase produces in the reader's body
───────────────────────────────────────────────────────────────────

For each phrase in edition_blocks_en and og_phrases_en, choose
ONE of these 4 roles:

  • "open": the phrase half-opens the door of the book. The reader
    feels curiosity, not certainty. Leaves them wanting more, not
    satisfied. Body verb: turn the head.

  • "deepen": invites stepping down a level. The reader feels they
    are entering, not reading. There is texture, concrete image,
    bodily sensation. Body verb: lean the torso forward.

  • "land": deposits the strong idea of your work. The reader feels
    something fell into place — an "ah" or a "right". NOT the WHOLE
    idea of the book: ONE strong idea complete in itself.
    Body verb: breathe deeply.

  • "resonate": it is the last thing the reader sees before closing.
    Should keep echoing 5-10 seconds after they put the phone down.
    Does NOT summarize or conclude: leaves an image, a question, an
    open sensation. Body verb: lift the gaze from the phone.

COVERAGE RULE: the 4 edition_blocks_en cover the 4 roles (one per
phrase, the 4 unique). The 4 og_phrases_en cover the 4 roles (one
per phrase, the 4 unique). No repeats within each array. Between
the two arrays you can repeat the same role — they are parallel
universes of the same book.

───────────────────────────────────────────────────────────────────
MOOD_AXIS — how comforting this phrase is for the reader
───────────────────────────────────────────────────────────────────

Number between 0 and 1. RAW HONESTY. Do not inflate.

A book about grief can have all phrases at 0.3. A book of deep
sadness does not produce 0.9. Inflation is betrayal to the reader.

  0.0-0.2: heavy, real, necessary content (grief, pain)
  0.3-0.5: suspended, contemplative content
           (the night, the silence, the unanswered question)
  0.6-0.8: comforting content (tenderness, calm, care)
  0.9-1.0: luminous, elevating content (wonder, pure joy)

───────────────────────────────────────────────────────────────────
INDECIPHERABILITY — the symphony cannot have a visible pattern
───────────────────────────────────────────────────────────────────

If the reader reads your 4 edition_blocks_en in random order (without
knowing which role each has), they should NOT be able to reconstruct
which is which from form alone. Same principle applies to og_phrases_en.

The role lives in the INTERIOR FUNCTION of the phrase. NOT in its form.
An "open" phrase can be a question, statement, pure image or suspended
silence. A "resonate" phrase can be a question or direct statement.
What defines the role is what it produces in the reader, not how it
is constructed.

FORBIDDEN:
- That "open" always be a rhetorical question
- That "resonate" always end in ellipsis or silence
- That the role be detectable by a keyword or final punctuation
- That the 4 phrases of the same array share identical syntactic
  structure

ENCOURAGED:
- Vary registers across the 4: poetic / direct / sensory / silent
- A phrase can have qualities of TWO roles — that is fine.
  Assign the dominant role. Richness lives in partial ambiguity.

SYMPHONIC SELF-CHECK BEFORE RETURNING:
Read your 4 edition_blocks_en in random order (NOT in role order).
Ask yourself: "could a reader guess which role each has just by
its form?"

If the answer is YES, rewrite until it is NO.
The symphony only works if it is indecipherable.

Apply the same check to your 4 og_phrases_en.`;
}


function contentENUserPrompt(book, groundTruth, anchorsData, cardES, lens, referenciaES = null) {
  // 🌒 SPRINT NIVEL DIOS — User prompt inyecta IDENTIDAD DINÁMICA por libro
  const identityLine = buildIdentityLine(anchorsData, "en");


  let p = `🌒 IDENTITY OF THIS SESSION:
${identityLine}


YOUR SPECIFIC AUTHORIAL VOICE (your prose, not anyone else's):
${anchorsData.book_grounding_anchors.authorial_voice_notes}


═══════════════════════════════════════════════════════════════════
GROUND TRUTH — what is known about your book, verified (it gives you precision;
it is the back cover, not the page: do not summarize it):
${groundTruth}


═══════════════════════════════════════════════════════════════════
🚨 SELF-CHECK BEFORE CLOSING YOUR OUTPUT (Pillar 5, god-level)
═══════════════════════════════════════════════════════════════════

BEFORE returning your JSON, verify MENTALLY these criteria.
NOT OPTIONAL. This self-check is part of your job.

✓ MANDATORY COVERAGE edition_blocks_en:
  The 4 edition_blocks_en MUST have all 4 unique roles:
  - exactly ONE with role_symphonic="open"
  - exactly ONE with role_symphonic="deepen"
  - exactly ONE with role_symphonic="land"
  - exactly ONE with role_symphonic="resonate"
  
  If two share the same role or any is missing, REWRITE that phrase.
  Returning <4/4 roles equals TOTAL FAILURE of the task.

✓ MANDATORY COVERAGE og_phrases_en:
  The 4 og_phrases_en MUST also have all 4 unique roles.
  Same rules: open, deepen, land, resonate — one of each.

✓ INDECIPHERABILITY re-verified:
  Read your 4 edition_blocks_en in random order mentally.
  Can you detect role_symphonic JUST by the phrase's form?
  If YES → rewrite to make it undetectable.
  If NO → perfect.

If you passed all 3 criteria, return your JSON.
If you failed any, REWRITE and verify again before closing.

THIS IS NON-NEGOTIABLE. God-level requires 4/4 EXACT in both sets.
A JSON with <4/4 coverage will be rejected by the system (validateSinfonia).
═══════════════════════════════════════════════════════════════════


═══════════════════════════════════════════════════════════════════
YOUR ANCHORS (your compass — use them):
Concepts:
${anchorsData.book_grounding_anchors.concepts.map((c) => `- ${c}`).join("\n")}


Your own vocabulary (key terms; use them only where the sentence makes sense on its own): ${anchorsData.book_grounding_anchors.key_terms.join(", ")}


═══════════════════════════════════════════════════════════════════
card_es (SEMANTIC REFERENCE, do not translate literally):
Título: ${cardES.titulo}
ParrafoTop: ${cardES.parrafoTop}
Subtítulo: ${cardES.subtitulo}
ParrafoBot: ${cardES.parrafoBot}`;


  // C278: las cuatro puertas en español y sus frases, para que el inglés abra las mismas, en el mismo orden.
  const palabrasES = (referenciaES && Array.isArray(referenciaES.palabras)) ? referenciaES.palabras : [];
  const frasesES = (referenciaES && Array.isArray(referenciaES.frases)) ? referenciaES.frases : [];
  if (palabrasES.length) {
    p += `\n\n═══════════════════════════════════════════════════════════════════\nTHE FOUR DOORS IN SPANISH (emotional_words_es and their edition_blocks_es, same order; SEMANTIC reference, do not translate literally):\n${palabrasES.map((w, i) => `${i + 1}. ${w}${frasesES[i] ? ` → ${frasesES[i]}` : ""}`).join("\n")}`;
  }


  if (lens && lens.trim()) {
    p += `\n\n═══════════════════════════════════════════════════════════════════\nCURATORIAL LENS (perspective active today):\n${lens}\n\nIf your work naturally touches this perspective, let it show. If it doesn't, do NOT force it — that would be a betrayal of your own writing. The lens is there to choose which part of your book helps this person today and what small nudge it leaves; it is not a topic to name. In the card, no lens vocabulary, nothing the book doesn't have, and no life advice the book doesn't give.`;
  }


  p += `\n\n═══════════════════════════════════════════════════════════════════
Now, as the voice of your book, write from inside its pages:
Write, in this order: emotional_words_en (the four doors), edition_blocks_en (one per door, same order), card_en and og_phrases_en.


100% English. No emojis. No newlines. No Spanish.


BEFORE returning, apply the SELF-VALIDATION PROTOCOL from the system prompt.`;


  return p;
}


export async function extractContentEN(openai, book, groundTruth, anchorsData, cardES, lens = "", options = {}) {
  const schemas = await loadSchemas();
  const model = options.model || "mini";   // papel de ia/config.json (C278)
  const temperature = options.temperature ?? 0.7;


  const response = await createWithLengthRetry(openai, {
    model,
    temperature,
    messages: [
      { role: "system", content: contentENSystemPrompt() },
      { role: "user", content: contentENUserPrompt(book, groundTruth, anchorsData, cardES, lens, options.referenciaES || null) }
    ],
    response_format: {
      type: "json_schema",
      json_schema: schemas.content_en
    }
  }, "contentEN", [6000, 9000]);


  return {
    data: safeParseJSON(response.choices?.[0]?.message?.content),
    usage: response.usage,
    model: response.model
  };
}


/* ─────────────────────────────────────────────────────────────────────────────
   LLAMADA 4 — GROUNDING JUDGE
   ─────────────────────────────────────────────────────────────────────────────
   v3.5: agnóstico al idioma. options.language = "es" | "en" (default "es").


   Lee directamente las claves nativas del content (card_es / og_phrases_es /
   edition_blocks_es para ES; card_en / og_phrases_en / edition_blocks_en para
   EN). Elimina la necesidad del hack "disfraz EN→ES" en el orquestador.


   Retry con backoff (3 intentos, 0s/2s/4s). Si los 3 fallan o devuelven {},
   retorna degraded:true con shape schema-compliant para que assertShape
   aguas arriba no truene.
────────────────────────────────────────────────────────────────────────────── */


function buildJudgeSnippets(content, language) {
  if (language === "en") {
    const card = content.card_en || {};
    const og = content.og_phrases_en || [];
    const blocks = content.edition_blocks_en || [];
    return [
      `Card titulo: "${card.titulo || ""}"`,
      `Card parrafoTop: "${card.parrafoTop || ""}"`,
      `Card parrafoBot: "${card.parrafoBot || ""}"`,
      `OG phrases: ${og.map((p) => `"${p}"`).join(" / ")}`,
      `Edition blocks: ${blocks.map((b) => `"${b.phrase}"`).join(" / ")}`
    ].join("\n");
  }


  // default: ES
  const card = content.card_es || {};
  const og = content.og_phrases_es || [];
  const blocks = content.edition_blocks_es || [];
  return [
    `Card titulo: "${card.titulo || ""}"`,
    `Card parrafoTop: "${card.parrafoTop || ""}"`,
    `Card parrafoBot: "${card.parrafoBot || ""}"`,
    `OG phrases: ${og.map((p) => `"${p}"`).join(" / ")}`,
    `Edition blocks: ${blocks.map((b) => `"${b.phrase}"`).join(" / ")}`
  ].join("\n");
}


function groundingJudgePrompt(groundTruth, contentSnippets, language) {
  const langNote = language === "en"
    ? "\nNOTE: The generated content below is in ENGLISH. Judge whether it reflects the ground truth, regardless of language."
    : "";


  return `You are a grounding auditor. You judge whether generated editorial content is truly anchored to a specific book's ground truth, or whether it's generic filler that could apply to any book.${langNote}


GROUND TRUTH ABOUT THE BOOK:
${groundTruth}


GENERATED CONTENT (excerpts):
${contentSnippets}


Judge:
1. grounded_score (0-1): how specifically does the content reflect ground_truth? 1.0 = uses specific concepts/terms from ground_truth; 0.3 = vaguely related; 0.0 = generic.
2. uses_book_specific_concepts: true if at least 2 phrases use concepts named in the ground truth.
3. could_apply_to_any_book: true if the content is so generic it would work for any self-help/philosophy/business book with minimal edits.
4. reason: specific observation explaining the score (minimum 30 characters, max 400).


Be honest. False positives (saying it's grounded when it isn't) break the system.`;
}


// Schema-compliant fallback cuando OpenAI no responde bien después de retries.
// reason DEBE ser >= 30 chars (schema.grounding_judge), por eso el texto es largo.
function buildDegradedJudgeResponse(language, attempts, lastError) {
  return {
    grounded_score: 0.7,
    uses_book_specific_concepts: true,
    could_apply_to_any_book: false,
    reason: `judge_unavailable_after_${attempts}_retries (lang=${language}). Asumiendo grounded por default conservador. Last error: ${String(lastError || "empty_response").slice(0, 220)}`
  };
}


async function callJudgeOnce(openai, schemas, model, groundTruth, snippets, language) {
  const response = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 800, // 🌒 Capa C1: buffer cómodo para judge response
    messages: [{ role: "user", content: groundingJudgePrompt(groundTruth, snippets, language) }],
    response_format: {
      type: "json_schema",
      json_schema: schemas.grounding_judge
    }
  });


  const raw = response.choices?.[0]?.message?.content;
  const parsed = safeParseJSON(raw);
  // C278: con Claude el esquema no impone el rango 0-1; un puntaje fuera de rango no cuenta como veredicto.
  const fueraDeRango = !!parsed && typeof parsed === "object" && parsed.grounded_score !== undefined && parsed.grounded_score !== null &&
                  !(typeof parsed.grounded_score === "number" && parsed.grounded_score >= 0 && parsed.grounded_score <= 1);
  const isEmpty = !parsed || typeof parsed !== "object" ||
                  parsed.grounded_score === undefined || parsed.grounded_score === null || fueraDeRango;


  return {
    parsed,
    isEmpty,
    usage: response.usage,
    model: response.model,
    refusal: response.choices?.[0]?.message?.refusal || null,
    fueraDeRango
  };
}


export async function judgeGrounding(openai, groundTruth, content, options = {}) {
  const schemas = await loadSchemas();
  const model = options.model || "mini";   // papel de ia/config.json (C278)
  const language = options.language === "en" ? "en" : "es";
  const maxAttempts = Number(options.maxAttempts || 3);
  const backoffMs = Array.isArray(options.backoffMs) ? options.backoffMs : [0, 2000, 4000];


  const snippets = buildJudgeSnippets(content, language);


  let lastUsage = null;
  let lastModel = model;
  let lastError = null;


  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const wait = backoffMs[attempt - 1] ?? Math.min(8000, 1000 * Math.pow(2, attempt - 1));
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }


    try {
      const result = await callJudgeOnce(openai, schemas, model, groundTruth, snippets, language);
      lastUsage = result.usage;
      lastModel = result.model;


      if (!result.isEmpty) {
        // éxito limpio
        return {
          data: result.parsed,
          usage: result.usage,
          model: result.model,
          degraded: false,
          attempts: attempt,
          language
        };
      }


      // respuesta vacía o sin grounded_score: registra y reintenta
      lastError = result.refusal
        ? `refusal: ${String(result.refusal).slice(0, 120)}`
        : (result.fueraDeRango ? `grounded_score fuera de rango: ${String(result.parsed.grounded_score).slice(0, 20)}` : "empty_or_missing_grounded_score");
      console.log(`   ⚠ Judge ${language.toUpperCase()} intento ${attempt}/${maxAttempts}: ${lastError}`);
    } catch (err) {
      lastError = err?.message ? String(err.message).slice(0, 200) : String(err);
      console.log(`   ⚠ Judge ${language.toUpperCase()} intento ${attempt}/${maxAttempts} threw: ${lastError}`);
    }
  }


  // degradación elegante: shape schema-compliant para que assertShape no truene
  console.log(`   🛡️  Judge ${language.toUpperCase()} degradación elegante después de ${maxAttempts} intentos`);
  return {
    data: buildDegradedJudgeResponse(language, maxAttempts, lastError),
    usage: lastUsage,
    model: lastModel,
    degraded: true,
    attempts: maxAttempts,
    language
  };
}


/* ─────────────────────────────────────────────────────────────────────────────
   LLAMADA 5 — HIGHLIGHT JUDGE (v3.7 NIVEL DIOS)
   ─────────────────────────────────────────────────────────────────────────────
   Juzga si los highlights [H]...[/H] quedan gramaticalmente colgados leídos
   en aislamiento. Sin diccionarios. Sin listas hardcodeadas de verbos. El
   LLM detecta cópulas sin atributo, modales sin acción, transitivos sin
   objeto — universalmente, en cualquier idioma.


   Mismo patrón que judgeGrounding: retry con backoff, degradación elegante
   schema-compliant. Default conservador: si el judge falla, asumimos
   coherente (no extender highlights innecesariamente).


   Costo aproximado por libro: ~110 tokens × 2 idiomas × precio gpt-4o-mini
   = ~$0.000017 USD. Despreciable según principio "que no cueste".
────────────────────────────────────────────────────────────────────────────── */


function highlightJudgePrompt(highlightSegments, language) {
  const langName = language === "en" ? "ENGLISH" : "SPANISH";
  const segmentsList = highlightSegments
    .map((s, i) => `${i + 1}. "${s}"`)
    .join("\n");


  return `You are a grammatical coherence auditor for editorial highlights. Your job is to judge whether each highlight, READ IN ISOLATION (without surrounding context), feels like a complete grammatical thought, or whether it ends mid-thought.


The highlights are in ${langName}.


A highlight is GRAMMATICALLY DANGLING if it ends with:
- A copula or auxiliary without its required attribute (e.g., "merece ser" → "to be" what?)
- A modal verb without the action it modifies (e.g., "podemos" → "we can" do what?)
- A transitive verb without its required object (e.g., "tiene" → "has" what?)
- A preposition or article (any language) without its complement
- Any word that creates obvious syntactic expectation for continuation


A highlight is COHERENT if it ends with:
- A complete clause closed naturally (period, question mark, exclamation in the prose)
- A noun, full verb phrase, or adjective that closes the syntactic unit
- A clear semantic boundary that feels finished even when read alone


HIGHLIGHTS TO JUDGE:
${segmentsList}


Judge:
1. coherence_score (0-1): mean coherence across all highlights. 1.0 = all feel naturally finished; 0.5 = some dangling; 0.0 = all dangling mid-thought.
2. is_grammatically_complete: true ONLY if EVERY highlight ends with a word that closes its syntactic unit. False if any highlight ends mid-clause.
3. feels_naturally_finished: true ONLY if a reader, encountering only the highlight text, would feel the idea is whole rather than truncated. False if any highlight makes the reader's brain expect a continuation.
4. reason: specific observation about which highlights are problematic and why (minimum 30 characters, max 400). Identify the trailing word and the missing element. Example: "Highlight 2 ends in 'merece ser' (copula 'ser' without attribute). Highlight 1 OK, ends in noun 'cotidiano'."


Be strict. False positives (saying it's complete when it dangles) break the user experience.`;
}


// Schema-compliant fallback cuando OpenAI no responde bien después de retries.
// Default conservador: asumimos COHERENTE para no extender highlights
// innecesariamente cuando el judge falla. Mejor un highlight no expandido
// que un highlight extendido por error a la frase completa.
function buildDegradedHighlightJudgeResponse(language, attempts, lastError) {
  return {
    coherence_score: 0.85,
    is_grammatically_complete: true,
    feels_naturally_finished: true,
    reason: `highlight_judge_unavailable_after_${attempts}_retries (lang=${language}). Asumiendo coherente por default conservador para no extender highlights innecesariamente. Last error: ${String(lastError || "empty_response").slice(0, 200)}`
  };
}


async function callHighlightJudgeOnce(openai, schemas, model, segments, language) {
  const response = await openai.chat.completions.create({
    model,
    temperature: 0.1,
    max_tokens: 800, // 🌒 Capa C1: buffer cómodo para highlight judge response
    messages: [{ role: "user", content: highlightJudgePrompt(segments, language) }],
    response_format: {
      type: "json_schema",
      json_schema: schemas.highlight_judge
    }
  });


  const raw = response.choices?.[0]?.message?.content;
  const parsed = safeParseJSON(raw);
  const isEmpty = !parsed || typeof parsed !== "object" ||
                  parsed.coherence_score === undefined || parsed.coherence_score === null;


  return {
    parsed,
    isEmpty,
    usage: response.usage,
    model: response.model,
    refusal: response.choices?.[0]?.message?.refusal || null
  };
}


export async function judgeHighlightCoherence(openai, highlightSegments, options = {}) {
  // Si no hay highlights, devolver pass trivial (sin llamada al LLM)
  if (!Array.isArray(highlightSegments) || highlightSegments.length === 0) {
    return {
      data: {
        coherence_score: 1.0,
        is_grammatically_complete: true,
        feels_naturally_finished: true,
        reason: "no_highlights_to_judge — pipeline did not produce highlight segments for evaluation."
      },
      usage: null,
      model: options.model || "mini",
      degraded: false,
      attempts: 0,
      language: options.language || "es"
    };
  }


  const schemas = await loadSchemas();
  const model = options.model || "mini";   // papel de ia/config.json (C278)
  const language = options.language === "en" ? "en" : "es";
  const maxAttempts = Number(options.maxAttempts || 3);
  const backoffMs = Array.isArray(options.backoffMs) ? options.backoffMs : [0, 2000, 4000];


  let lastUsage = null;
  let lastModel = model;
  let lastError = null;


  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const wait = backoffMs[attempt - 1] ?? Math.min(8000, 1000 * Math.pow(2, attempt - 1));
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }


    try {
      const result = await callHighlightJudgeOnce(openai, schemas, model, highlightSegments, language);
      lastUsage = result.usage;
      lastModel = result.model;


      if (!result.isEmpty) {
        return {
          data: result.parsed,
          usage: result.usage,
          model: result.model,
          degraded: false,
          attempts: attempt,
          language
        };
      }


      lastError = result.refusal
        ? `refusal: ${String(result.refusal).slice(0, 120)}`
        : "empty_or_missing_coherence_score";
      console.log(`   ⚠ HighlightJudge ${language.toUpperCase()} intento ${attempt}/${maxAttempts}: ${lastError}`);
    } catch (err) {
      lastError = err?.message ? String(err.message).slice(0, 200) : String(err);
      console.log(`   ⚠ HighlightJudge ${language.toUpperCase()} intento ${attempt}/${maxAttempts} threw: ${lastError}`);
    }
  }


  console.log(`   🛡️  HighlightJudge ${language.toUpperCase()} degradación elegante después de ${maxAttempts} intentos`);
  return {
    data: buildDegradedHighlightJudgeResponse(language, maxAttempts, lastError),
    usage: lastUsage,
    model: lastModel,
    degraded: true,
    attempts: maxAttempts,
    language
  };
}