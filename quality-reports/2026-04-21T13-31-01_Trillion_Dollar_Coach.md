# Quality Report — Trillion Dollar Coach

**Autor:** Eric Schmidt, Jonathan Rosenberg & Alan Eagle
**Ejecutado:** 2026-04-21T13-31-01
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_3sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

#1 Wall Street Journal Bestseller New York Times Bestseller USA Today Bestseller The team behind How Google Works returns with management lessons from legendary coach and business executive, Bill Campbell, whose mentoring of some of our most successful modern entrepreneurs has helped create well over a trillion dollars in market value. Bill Campbell played an instrumental role in the growth of several prominent companies, such as Google, Apple, and Intuit, fostering deep relationships with Silicon Valley visionaries, including Steve Jobs, Larry Page, and Eric Schmidt. In addition, this business genius mentored dozens of other important leaders on both coasts, from entrepreneurs to venture capitalists to educators to football players, leaving behind a legacy...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- principios de gestión de Bill Campbell
- creación de una cultura de equipo primero
- importancia de la confianza en el liderazgo
- valores de amor y respeto en el lugar de trabajo
- estrategias para la toma de decisiones efectivas

**Key terms:** envelope of trust, doers, aberrant genius, psicología de equipos, cultura de alta performance

**Voz autorial:** La voz autoral es cercana, reflexiva y práctica, enfocándose en compartir lecciones aprendidas y experiencias vividas con un tono inspirador y orientado a la acción.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#CFD2D3, accent=#1F99D6, ink=#171A1C, contraste=11.50:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly references key concepts from the book, such as the 'envelope of trust' and the importance of love and respect in the workplace, which are central themes in 'Trillion Dollar Coach'. The phrases and ideas presented are specific to Bill Campbell's principles as outlined in the book, demonstrating a clear connection to the ground truth.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects key concepts from the ground truth, such as 'envelope of trust', 'high-performance culture', and the importance of 'love and respect' in leadership. These phrases are specific to the principles outlined in 'Trillion Dollar Coach', demonstrating a clear connection to the book's themes and teachings.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en conceptos del libro.
- EN: pagina — Voz directa y enfoque en conceptos del libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.96**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10692
- Tiempo total: 23.1s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3113ms
- anchors: 2759 tokens, 5539ms
- palette: 0 tokens, 0ms
- content_es: 2778 tokens, 6078ms
- judge_es: 1118 tokens, 1753ms
- content_en: 2182 tokens, 4283ms
- judge_en: 1063 tokens, 1499ms
- voice: 792 tokens, 803ms
