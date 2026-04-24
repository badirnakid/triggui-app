# Quality Report — Destino libertad y alma

**Autor:** Osho
**Ejecutado:** 2026-04-24T03-08-01
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

Respuestas para saber cuál es el significado de la vida. Desde el momento en que nace empieza a surgir una gran búsqueda en lo más profundo de cada ser humano. Podemos reprimir esa búsqueda, desviarla y sustituirla, pero no podemos eliminarla, ya que es intrínseca a la naturaleza humana. Hasta que no se resuelve, seguiremos buscando. Por supuesto, hay muchas formas de equivocarse y solo una forma de acertar, así que la búsqueda está llena de riesgos.

METADATA VERIFICADA:
- Título: Destino, libertad y alma
- Autor: Osho
- Año: 2014
- Categorías: Superación personal, Libros, Salud, mente y cuerpo, Religión y espiritualidad
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la búsqueda intrínseca del significado de la vida
- la represión de la búsqueda espiritual
- los riesgos de la búsqueda existencial
- la necesidad de resolver la búsqueda interna

**Key terms:** significado de la vida, búsqueda espiritual, naturaleza humana, errores en la búsqueda, acierto en la vida

**Voz autorial:** La voz de Osho es reflexiva y provocativa, invitando al lector a cuestionar sus creencias y a explorar su propia espiritualidad.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_moderno
- Resultado: paper=#CFD2D3, accent=#1F99D6, ink=#171A1C, contraste=11.50:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content closely reflects the themes and concepts presented in the ground truth of the book 'Destino, libertad y alma' by Osho. It specifically addresses the intrinsic human search for meaning, the inevitability of errors in this journey, and the idea that this search is fundamental to human nature, all of which are central to the book's synopsis. Phrases like 'la búsqueda del sentido

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely mirrors the themes and concepts presented in the ground truth. It explicitly discusses the quest for the meaning of life, the intrinsic nature of this search, and the inevitability of mistakes along the way, all of which are central to Osho's work. Phrases like 'insatiable urge to uncover the meaning of life' and 'each deviation on the path' directly reflect the book,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre la búsqueda de significado.
- EN: pagina — Voz directa y reflexiones personales sobre la búsqueda de significado.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- author_truncated: "Osho"

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 8938
- Tiempo total: 72.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 42665ms
- anchors: 2249 tokens, 12092ms
- palette: 0 tokens, 1ms
- content_es: 2433 tokens, 5708ms
- judge_es: 799 tokens, 2244ms
- content_en: 1868 tokens, 6881ms
- judge_en: 761 tokens, 1696ms
- voice: 828 tokens, 1282ms
