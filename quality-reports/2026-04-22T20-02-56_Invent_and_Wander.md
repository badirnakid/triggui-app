# Quality Report — Invent and Wander

**Autor:** Walter Isaacson, Jeff Bezos
**Ejecutado:** 2026-04-22T20-02-56
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `openlibrary`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_1sources
- **Match score:** 1.00



### Ground truth utilizado
```
INFORMACIÓN (OpenLibrary):

Libro verificado en OpenLibrary. Publicado originalmente en 2020.

METADATA VERIFICADA:
- Título: Invent and Wander
- Autor: Walter Isaacson, Jeff Bezos
- Año: 2020
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la importancia de la curiosidad en la innovación
- la mentalidad de largo plazo en los negocios
- la capacidad de aprender de los fracasos

**Key terms:** curiosidad, innovación, mentalidad de largo plazo, aprendizaje, fracasos

**Voz autorial:** La voz autorial es reflexiva y analítica, combinando la narrativa personal de Bezos con un enfoque en la estrategia empresarial y la innovación.

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
- Score: 0.30
- Usa conceptos específicos: false
- Podría aplicar a cualquier libro: true
- Razón: The generated content discusses curiosity and innovation in a general sense, which are themes that could apply to many books on business or personal development. However, it does not reference specific concepts or ideas from 'Invent and Wander' by Walter Isaacson and Jeff Bezos, making it too generic to be considered truly anchored to the book.

### EN
- Score: 0.30
- Usa conceptos específicos: false
- Razón: The content discusses themes of curiosity and long-term vision, which are relevant to innovation and growth. However, it lacks specific references or concepts directly tied to 'Invent and Wander' by Walter Isaacson and Jeff Bezos. The phrases and ideas presented are generic and could apply to any self-help or business book, making it not sufficiently anchored to the specific ground truth of the  '

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones en primera persona sobre conceptos.
- EN: pagina — Tono directo y reflexivo, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.3 ← promedio de los 2 judges
- **Combined:** **0.75**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 10
- Tokens totales: 13507
- Tiempo total: 49.1s
- Modelos usados: gpt-4o-mini-2024-07-18, gpt-4o

### Por fase
- grounding: 0 tokens, 16742ms
- anchors: 2126 tokens, 4781ms
- palette: 0 tokens, 0ms
- content_es: 2280 tokens, 6022ms
- judge_es: 663 tokens, 2171ms
- content_es_retry: 2268 tokens, 4912ms
- judge_es_retry: 643 tokens, 0ms
- content_es_escalate: 2293 tokens, 0ms
- content_en: 1750 tokens, 5062ms
- judge_en: 642 tokens, 2469ms
- voice: 842 tokens, 983ms
