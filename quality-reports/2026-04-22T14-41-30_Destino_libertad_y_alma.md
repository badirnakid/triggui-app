# Quality Report — Destino libertad y alma

**Autor:** Osho
**Ejecutado:** 2026-04-22T14-41-30
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
- los riesgos de la búsqueda existencial
- la represión y sustitución de la búsqueda interna

**Key terms:** significado de la vida, búsqueda existencial, naturaleza humana

**Voz autorial:** La voz de Osho es reflexiva y provocativa, invitando al lector a cuestionar su propia existencia y creencias.

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
- Razón: The generated content closely reflects the themes and concepts outlined in the ground truth of the book 'Destino, libertad y alma' by Osho. It specifically addresses the inherent search for meaning in life, the risks associated with this search, and the idea that repression does not eliminate this quest, all of which are central to the book's message. The phrases used are directly aligned with the

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes and concepts presented in the ground truth, particularly the intrinsic search for meaning in life and the idea that this search is an essential part of human nature. Phrases like 'the quest for the meaning of life' and 'the need for answers intensifies' directly echo the book's focus on the search for life's meaning and the risks involved in that. 

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre la búsqueda de significado.
- EN: pagina — Voz directa y reflexiones sobre la búsqueda interna del ser.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
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
- Tokens totales: 8849
- Tiempo total: 58.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 33496ms
- anchors: 2212 tokens, 6270ms
- palette: 0 tokens, 0ms
- content_es: 2400 tokens, 7043ms
- judge_es: 792 tokens, 2197ms
- content_en: 1850 tokens, 6033ms
- judge_en: 757 tokens, 2267ms
- voice: 838 tokens, 1397ms
