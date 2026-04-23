# Quality Report — Aprendiendo de los mejores

**Autor:** Francisco Alcaide Hernández
**Ejecutado:** 2026-04-23T02-53-06
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

Decía Betrand Russell que «la mejor prueba de que algo puede hacerse es que antes alguien ya lo hizo». Por eso las personas inteligentes aprenden de la experiencia de los demás. En el libro encontrarás reflexiones y frases sobre el desarrollo personal, sobre la gestión de empresas y equipos, pero también sobre la vida misma. Personajes como Dale Carnegie, Napoleon Hill, Robert Kiyosaki, Richard Branson, John C. Maxwell, Steve Jobs, Jack Welch, Deepak Chopra, Eckhart Tolle, Brian Tracy... aparecen por estas páginas para enseñarte lo que ellos saben y lo que ellos también han aprendido anteriormente y que les ha hecho grandes.

METADATA VERIFICADA:
- Título: Aprendiendo de los mejores
- Autor: Francisco Alcaide Hernández
- Año: 2019
- Categorías: Administraci...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- aprender de la experiencia de los demás
- reflexiones sobre el desarrollo personal
- gestión de empresas y equipos
- sabiduría de líderes exitosos
- lecciones de vida de grandes personajes

**Key terms:** desarrollo personal, liderazgo, libertad financiera, espiritualidad, gestión empresarial

**Voz autorial:** La voz del autor es clara, directa y motivadora, buscando inspirar al lector a través de la sabiduría de personajes reconocidos en diversas áreas.

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
- Score: 0.80
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content closely aligns with the themes of personal development and learning from successful figures as outlined in the ground truth. It references the wisdom of leaders and the importance of learning from their experiences, which is a central concept in the book. However, while it is specific to the book's themes, it does not mention any of the specific figures listed in the ground, 

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects the themes of personal development and learning from successful leaders, which aligns with the book's focus on insights from figures like Dale Carnegie and Steve Jobs. However, while it captures the essence of the book, it lacks specific references to the named individuals and their teachings, making it somewhat generic in its phrasing.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre el aprendizaje.
- EN: pagina — Tono reflexivo y directo, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.75 ← promedio de los 2 judges
- **Combined:** **0.88**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 8972
- Tiempo total: 60.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41898ms
- anchors: 2287 tokens, 4922ms
- palette: 0 tokens, 1ms
- content_es: 2432 tokens, 4561ms
- judge_es: 799 tokens, 2058ms
- content_en: 1872 tokens, 5098ms
- judge_en: 771 tokens, 1353ms
- voice: 811 tokens, 921ms
