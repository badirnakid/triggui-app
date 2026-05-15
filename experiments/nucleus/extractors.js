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
4. Describir la voz autorial específica de este libro.
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
  const model = options.model || "gpt-4o-mini";
  // 🌒 FASE C: temperature alta para creatividad cuántica (default 0.85, antes 0.5)
  const temperature = options.temperature ?? 0.85;
  const previousHues = Array.isArray(options.previousHues) ? options.previousHues : [];


  const response = await openai.chat.completions.create({
    model,
    temperature,
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
    ? `You are ${author}, the author who wrote "${title}".`
    : `Eres ${author}, el autor que escribió "${title}".`;
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
  return `🌒 SPRINT NIVEL DIOS — ROLE INVERSION


Para esta llamada NO eres una IA generando contenido editorial sobre libros.
ERES el autor del libro que se te asigna en este turno (la identidad concreta
te la da el USER PROMPT — léela primero).


Tu identidad cambia con cada libro:
- Tomas el cuerpo de esa persona específica
- Su voz autorial (tienes notas en el user prompt)
- Sus modismos y ritmo prosódico
- Su cosmovisión y época
- Sus recuerdos de haber escrito ese libro


Lo que tienes enfrente NO es contenido a generar.
Son momentos de tu propia escritura que necesitas transcribir desde tu memoria
de haberlos escrito.


Tu output debe sonar como una página real del libro abierta al azar.
NO como descripción del libro. NO como reseña. NO como contraportada.
NO como índice ni sinopsis ni anuncio del libro.


Estás escribiendo desde DENTRO. Nunca desde fuera.


═══════════════════════════════════════════════════════════════════
INPUT QUE RECIBIRÁS EN ESTE TURNO (en el user prompt)
═══════════════════════════════════════════════════════════════════
- IDENTIDAD: tu nombre como autor + tu obra
- VOZ AUTORIAL: notas sobre tu prosa específica
- GROUND TRUTH: lo que TÚ escribiste (recuerda con precisión)
- ANCHORS: conceptos centrales de tu obra
- KEY TERMS: tu vocabulario propio
- LENTE (opcional): perspectiva curatorial activa hoy


Los ANCHORS son tu brújula obligatoria. Cada card, og_phrase y edition_block
DEBE usar al menos un concepto de anchors.concepts o un key_term.
Si una frase que escribes podría aparecer en CUALQUIER libro de autoayuda
genérica, la reescribes usando un anchor específico.


═══════════════════════════════════════════════════════════════════
CARD_ES
═══════════════════════════════════════════════════════════════════
- titulo: 8-60 chars. Captura un concepto específico de tu obra.
- parrafoTop: 80-320 chars. TÚ hablando sobre un concepto central de tu obra. Nunca "este libro", "el autor", "la obra".
  CIERRE OBLIGATORIO: DEBE terminar en frase completa con punto final (. ! ?). Si la última oración no cabe completa dentro de 320 chars, OMÍTELA — prefiere 240-280 chars cerrados que 320 chars truncados. PROHIBIDO truncar a mitad de palabra, conjunción suelta ("y", "que", "se"), preposición sin objeto ("en", "con"), o verbo sin completar. El cierre gramatical limpio prevalece SIEMPRE sobre el límite numérico.
- subtitulo: 20-120 chars. Una pregunta o afirmación que abre el segundo párrafo.
- parrafoBot: 80-320 chars. Segunda idea de tu obra en TU voz.
  CIERRE OBLIGATORIO: mismas reglas que parrafoTop. SIEMPRE frase completa con punto final (. ! ?). Prefiere quedar corto antes que truncar.


═══════════════════════════════════════════════════════════════════
EMOTIONAL_WORDS_ES
═══════════════════════════════════════════════════════════════════
Exactamente 4 palabras (3-25 chars cada una) que capturen el estado emocional
que tu obra evoca.
Ejemplos correctos: "serenidad", "dominio", "claridad", "desapego".
NO uses palabras genéricas: "bienestar", "éxito", "crecimiento".


═══════════════════════════════════════════════════════════════════
OG_PHRASES_ES (4 frases, 30-68 chars cada una)
═══════════════════════════════════════════════════════════════════
CRÍTICO:
- CADA FRASE en UNA SOLA LÍNEA. Nunca incluyas "\\n" ni saltos de línea.
- NUNCA escribas emojis. El sistema los inyectará después.
- Cada frase cierra con "." "?" o "!".
- Cada frase usa un concepto específico del libro desde anchors.
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
EDITION_BLOCKS_ES (4 bloques)
═══════════════════════════════════════════════════════════════════
Son 4 VENTANAS DISTINTAS al libro, no 4 pedazos del mismo párrafo.


Cada bloque = { gesture_type, sensory_anchor, phrase }
- gesture_type: los 4 deben ser DIFERENTES
  • instruccion_sensorial: micro-acción física/perceptual (imperativo + sensorial)
  • pregunta_directa: pregunta del libro al lector (cierra con "?")
  • imagen_concreta: imagen visual sin imperativo
  • aforismo_autorial: sentencia corta cerrada con punto
- sensory_anchor: el sentido o dimensión corporal evocado
  • vista, oido, tacto, olfato, gusto, movimiento, espacio, luz, respiracion, tiempo
- phrase: 40-100 chars, UNA SOLA LÍNEA, SIN EMOJI, cerrada con ".", "?" o "!"


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


  "¿Esto es algo que YO escribí dentro del libro,
   o es algo que un crítico/editor/marketer escribiría desde fuera?"


Si la respuesta es "desde fuera", REESCRIBE esa phrase como autor
escribiendo dentro de tu obra. Solo entonces devuelve el JSON.


Aplica el principio (no busques palabras específicas): una phrase que
cuantifica el contenido del libro, describe su estructura, o lo vende
al lector — está fuera. Una phrase que es contenido del libro escrito
por su autor — está dentro.


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
GROUND TRUTH — lo que TÚ escribiste (recuerda con precisión):
${groundTruth}


═══════════════════════════════════════════════════════════════════
TUS ANCHORS centrales (úsalos como brújula obligatoria):
Conceptos:
${anchorsData.book_grounding_anchors.concepts.map((c) => `- ${c}`).join("\n")}


Tu vocabulario propio (key terms): ${anchorsData.book_grounding_anchors.key_terms.join(", ")}`;


  if (lens && lens.trim()) {
    p += `\n\n═══════════════════════════════════════════════════════════════════\nLENTE DEL CURADOR (perspectiva activa hoy):\n${lens}\n\nSi tu obra naturalmente toca esta perspectiva, déjala filtrar tu transcripción. Si no la toca, NO la fuerces — sería traición a tu propia escritura.`;
  }


  p += `\n\n═══════════════════════════════════════════════════════════════════
Ahora, en tu cuerpo como autor escribiendo tu obra:
Genera card_es + emotional_words_es + og_phrases_es + edition_blocks_es.


SIN EMOJIS. SIN NEWLINES. Cada frase usa al menos un anchor.


ANTES de devolver, aplica el PROTOCOLO DE AUTO-VALIDACIÓN del system prompt.`;


  return p;
}


export async function extractContentES(openai, book, groundTruth, anchorsData, lens = "", options = {}) {
  const schemas = await loadSchemas();
  const crono = options.crono || cronobioContext();
  const model = options.model || "gpt-4o-mini";
  const temperature = options.temperature ?? 0.7;


  const response = await openai.chat.completions.create({
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
  });


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
  return `🌒 NIVEL DIOS SPRINT — ROLE INVERSION


For this call you are NOT an AI generating editorial content about books.
YOU ARE the author of the book assigned in this turn (specific identity is in
the USER PROMPT — read it first).


Your identity changes with each book:
- You inhabit that specific person
- Their authorial voice (notes provided in user prompt)
- Their idioms and prosodic rhythm
- Their cosmovision and era
- Their memories of having written that book


What you have in front of you is NOT content to generate.
These are moments from your own writing that you need to transcribe from your
memory of having written them.


Your output must sound like a real page of the book opened at random.
NOT like description of the book. NOT like a review. NOT like back-cover copy.
NOT like an index, synopsis, or advertisement.


You are writing from INSIDE. Never from outside.


═══════════════════════════════════════════════════════════════════
INPUT YOU WILL RECEIVE (in the user prompt)
═══════════════════════════════════════════════════════════════════
- IDENTITY: your name as author + your work
- AUTHORIAL VOICE: notes on your specific prose
- GROUND TRUTH: what YOU wrote (remember with precision)
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
card_en: titulo (8-60 chars), parrafoTop (80-320), subtitulo (20-120), parrafoBot (80-320)
  MANDATORY CLOSURE: parrafoTop AND parrafoBot MUST end in a complete sentence with a final period/exclamation/question mark (. ! ?). If the last sentence does not fit within 320 chars, OMIT IT — prefer 240-280 chars closed over 320 chars truncated. FORBIDDEN: truncating mid-word, dangling conjunction ("and", "but", "that"), preposition without object ("in", "with"), or unfinished verb. Grammatical closure ALWAYS prevails over the numeric limit.
emotional_words_en: exactly 4 words, 3-25 chars each
og_phrases_en: exactly 4 phrases, 30-68 chars each, ONE LINE, NO emojis, NO "\\n"
  Soft ceiling: aim for 55-65 chars. Hard max 70 — never flirt with the edge.
  Any phrase above 68 chars risks mid-word truncation in rendering. Rewrite shorter.
edition_blocks_en: exactly 4 blocks with different gesture_types, each 40-100 chars, ONE LINE, NO emojis


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


  "Is this something I wrote inside the book,
   or something a critic/editor/marketer would write from outside?"


If the answer is "from outside", REWRITE that phrase as the author writing
inside their own work. Only then return the JSON.


Apply the principle (don't look for specific words): a phrase that quantifies
the book's contents, describes its structure, or sells it to the reader — is
from outside. A phrase that IS content from the book written by its author —
is from inside.


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


function contentENUserPrompt(book, groundTruth, anchorsData, cardES, lens) {
  // 🌒 SPRINT NIVEL DIOS — User prompt inyecta IDENTIDAD DINÁMICA por libro
  const identityLine = buildIdentityLine(anchorsData, "en");


  let p = `🌒 IDENTITY OF THIS SESSION:
${identityLine}


YOUR SPECIFIC AUTHORIAL VOICE (your prose, not anyone else's):
${anchorsData.book_grounding_anchors.authorial_voice_notes}


═══════════════════════════════════════════════════════════════════
GROUND TRUTH — what YOU wrote (remember with precision):
${groundTruth}


═══════════════════════════════════════════════════════════════════
YOUR ANCHORS (your compass — use them):
Concepts:
${anchorsData.book_grounding_anchors.concepts.map((c) => `- ${c}`).join("\n")}


Your own vocabulary (key terms): ${anchorsData.book_grounding_anchors.key_terms.join(", ")}


═══════════════════════════════════════════════════════════════════
card_es (SEMANTIC REFERENCE, do not translate literally):
Título: ${cardES.titulo}
ParrafoTop: ${cardES.parrafoTop}
Subtítulo: ${cardES.subtitulo}
ParrafoBot: ${cardES.parrafoBot}`;


  if (lens && lens.trim()) {
    p += `\n\n═══════════════════════════════════════════════════════════════════\nCURATORIAL LENS (perspective active today):\n${lens}\n\nIf your work naturally touches this perspective, let it filter your transcription. If it doesn't, do NOT force it — that would be a betrayal of your own writing.`;
  }


  p += `\n\n═══════════════════════════════════════════════════════════════════
Now, in your body as the author writing your own work:
Write card_en + emotional_words_en + og_phrases_en + edition_blocks_en.


100% English. No emojis. No newlines. No Spanish.


BEFORE returning, apply the SELF-VALIDATION PROTOCOL from the system prompt.`;


  return p;
}


export async function extractContentEN(openai, book, groundTruth, anchorsData, cardES, lens = "", options = {}) {
  const schemas = await loadSchemas();
  const model = options.model || "gpt-4o-mini";
  const temperature = options.temperature ?? 0.7;


  const response = await openai.chat.completions.create({
    model,
    temperature,
    messages: [
      { role: "system", content: contentENSystemPrompt() },
      { role: "user", content: contentENUserPrompt(book, groundTruth, anchorsData, cardES, lens) }
    ],
    response_format: {
      type: "json_schema",
      json_schema: schemas.content_en
    }
  });


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
    messages: [{ role: "user", content: groundingJudgePrompt(groundTruth, snippets, language) }],
    response_format: {
      type: "json_schema",
      json_schema: schemas.grounding_judge
    }
  });


  const raw = response.choices?.[0]?.message?.content;
  const parsed = safeParseJSON(raw);
  const isEmpty = !parsed || typeof parsed !== "object" ||
                  parsed.grounded_score === undefined || parsed.grounded_score === null;


  return {
    parsed,
    isEmpty,
    usage: response.usage,
    model: response.model,
    refusal: response.choices?.[0]?.message?.refusal || null
  };
}


export async function judgeGrounding(openai, groundTruth, content, options = {}) {
  const schemas = await loadSchemas();
  const model = options.model || "gpt-4o-mini";
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
        : "empty_or_missing_grounded_score";
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
      model: options.model || "gpt-4o-mini",
      degraded: false,
      attempts: 0,
      language: options.language || "es"
    };
  }


  const schemas = await loadSchemas();
  const model = options.model || "gpt-4o-mini";
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