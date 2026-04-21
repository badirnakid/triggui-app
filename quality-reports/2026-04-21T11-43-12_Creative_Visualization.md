# Quality Report — Creative Visualization

**Autor:** Shakti Gawain
**Ejecutado:** 2026-04-21T11-43-12
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `google_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_4sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Google Books):

Provides exercises, meditations, affirmations, and other techniques designed to help individuals learn to use mental energy to transform and improve health, beauty, prosperity, relationships, and other aspects of life.

METADATA VERIFICADA:
- Título: Creative Visualization
- Autor: Shakti Gawain
- Año: 2002
- Editorial: New World Library
- Categorías: Business & Economics
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- uso de la energía mental para transformar la salud
- técnicas de visualización para mejorar relaciones
- afirmaciones para alcanzar la prosperidad
- meditaciones para el desarrollo personal
- ejercicios prácticos para el empoderamiento

**Key terms:** visualización creativa, energía mental, afirmaciones, meditaciones, transformación personal

**Voz autorial:** La voz de Gawain es clara, accesible y motivacional, ofreciendo un enfoque práctico y empoderador hacia la autoayuda y el desarrollo personal.

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
- Razón: The generated content directly references key concepts from the ground truth, such as 'mental energy', 'visualization', 'affirmations', and 'transforming aspects of life'. These terms are specific to the book 'Creative Visualization' by Shakti Gawain, indicating a strong alignment with the book's themes and techniques.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects the concepts outlined in the ground truth, specifically mentioning 'mental energy', 'creative visualization techniques', 'affirmations', and 'meditations'. These terms are central to Shakti Gawain's work and are used in a way that is specific to the themes of the book, making it clear that the content is anchored to the book's teachings.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y tono coherente con el contenido del libro.
- EN: pagina — Uso de voz directa y preguntas retóricas.

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
- Tokens totales: 8398
- Tiempo total: 23.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 4081ms
- anchors: 2257 tokens, 4078ms
- palette: 0 tokens, 0ms
- content_es: 2318 tokens, 6684ms
- judge_es: 667 tokens, 1531ms
- content_en: 1738 tokens, 4021ms
- judge_en: 651 tokens, 2073ms
- voice: 767 tokens, 994ms
