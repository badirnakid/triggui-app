# Quality Report — El código del dinero

**Autor:** Raimon Samsó Queraltó
**Ejecutado:** 2026-05-01T18-35-40
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_1sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

LO QUE NADIE TE ENSEÑÓ SOBRE EL DINEROINTELIGENCIA FINANCIERA APLICADACÓMO SUPERAR LOS TIEMPOS DE CRISIS¿INVERTIR O APOSTAR?EL VOCABULARIO DE LA RIQUEZACÓMO CONVERTIR TU TALENTO EN INGRESOSLAS 10 HABILIDADES IMPRESCINDIBLES DEL EMPRENDEDORLA DEUDA ÓPTIMA Y LA PÉSIMALA NOVENA MARAVILLA DEL MUNDO: LOS INGRESOS PASIVOSLA GESTIÓN RENTABLE DE TU TIEMPOEMPIEZA EN PEQUEÑO, PIENSA EN GRANDEEl Código del Dinero® te revelará lo que nunca te han enseñado en la escuela, en la universidad o en casa sobre el dinero: estar al mando de tu economía, hacerla prosperar y ser libre.

METADATA VERIFICADA:
- Título: El código del dinero
- Autor: Raimon Samsó Queraltó
- Año: 2010
- Categorías: Finanzas personales, Libros, Negocios y finanzas personales
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- inteligencia financiera aplicada
- superar los tiempos de crisis
- ingresos pasivos
- gestión rentable del tiempo
- convertir talento en ingresos

**Key terms:** deuda óptima, riqueza, habilidades del emprendedor, economía personal, prosperidad financiera

**Voz autorial:** La voz de Raimon Samsó es práctica y motivadora, enfocándose en la aplicación real de conceptos financieros para lograr la libertad económica.

---

## 🎨 Visual synthesis

- hue_primary: 65
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#D3D3CF, accent=#C7D61F, ink=#1B1C17, contraste=11.42:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The content directly references key concepts from the book, such as converting talent into income, managing time for profitability, and achieving financial freedom. Phrases like 'inteligencia financiera aplicada' and 'ingresos pasivos' are specific to the book's themes, demonstrating a strong connection to the ground truth.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content closely aligns with the book's themes of financial intelligence and transforming skills into income, which are explicitly mentioned in the ground truth. Phrases like 'turning your skills and talents into a source of income' and 'managing your time profitably' reflect specific concepts from the book. However, the language is somewhat generic and could be adapted for other self-help or a



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en habilidades personales.
- EN: pagina — Voz directa y consejos prácticos sin referencias meta.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.93**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9074
- Tiempo total: 47.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 16733ms
- anchors: 2322 tokens, 10990ms
- palette: 0 tokens, 0ms
- content_es: 2436 tokens, 7631ms
- judge_es: 820 tokens, 2186ms
- content_en: 1874 tokens, 5149ms
- judge_en: 840 tokens, 2590ms
- voice: 782 tokens, 1143ms
- highlight_judge_es_parrafoTop: 641 tokens, 0ms
- highlight_judge_es_parrafoBot: 639 tokens, 0ms
- highlight_judge_en_parrafoTop: 643 tokens, 0ms
- highlight_judge_en_parrafoTop_retry: 652 tokens, 0ms
- highlight_judge_en_parrafoBot: 636 tokens, 0ms
