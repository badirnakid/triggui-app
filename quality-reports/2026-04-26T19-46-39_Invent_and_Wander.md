# Quality Report — Invent and Wander

**Autor:** Walter Isaacson, Jeff Bezos
**Ejecutado:** 2026-04-26T19-46-39
**Pipeline:** nucleus-canonical-v3.7.1

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

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- la importancia de la innovación en los negocios
- la mentalidad de largo plazo en la toma de decisiones
- la conexión entre la curiosidad y el éxito empresarial

**Key terms:** mentalidad de innovación, largo plazo, curiosidad, e-commerce, transformación digital

**Voz autorial:** La voz autorial es reflexiva y analítica, combinando la experiencia personal de Bezos con el estilo narrativo de Isaacson, lo que permite una comprensión profunda de las estrategias empresariales.

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
- Score: 0.30
- Usa conceptos específicos: false
- Podría aplicar a cualquier libro: true
- Razón: The content discusses curiosity and innovation, which are general themes in business literature. However, it does not reference specific concepts or ideas from 'Invent and Wander' by Walter Isaacson and Jeff Bezos, making it applicable to any similar book.

### EN
- Score: 0.30
- Usa conceptos específicos: false
- Razón: The content discusses innovation and curiosity in a business context, which are broad themes not specifically tied to 'Invent and Wander.' It lacks direct references to the book's unique insights or concepts, making it applicable to any business literature.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.80)
- ES: pagina — Tono directo y reflexivo, sin referencias externas al autor.
- EN: pagina — Tono directo y reflexivo, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.9 ← del voice judge
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
- Tokens totales: 13448
- Tiempo total: 52.4s
- Modelos usados: gpt-4o-mini-2024-07-18, gpt-4o

### Por fase
- grounding: 0 tokens, 18907ms
- anchors: 2133 tokens, 5303ms
- palette: 0 tokens, 0ms
- content_es: 2284 tokens, 6144ms
- judge_es: 640 tokens, 2821ms
- content_es_retry: 2300 tokens, 6019ms
- judge_es_retry: 655 tokens, 0ms
- content_es_escalate: 2287 tokens, 0ms
- content_en: 1723 tokens, 5247ms
- judge_en: 621 tokens, 1622ms
- voice: 805 tokens, 913ms
- highlight_judge_es_parrafoTop: 639 tokens, 0ms
- highlight_judge_es_parrafoBot: 644 tokens, 0ms
- highlight_judge_en_parrafoTop: 639 tokens, 0ms
- highlight_judge_en_parrafoBot: 640 tokens, 0ms
