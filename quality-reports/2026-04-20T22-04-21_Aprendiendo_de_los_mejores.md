# Quality Report — Aprendiendo de los mejores

**Autor:** Francisco Alcaide Hernández
**Ejecutado:** 2026-04-20T22-04-21
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
- gestión efectiva de empresas y equipos
- sabiduría de líderes exitosos
- lecciones de vida de grandes personajes

**Key terms:** desarrollo personal, liderazgo, libertad financiera, espiritualidad, gestión empresarial

**Voz autorial:** La voz del autor es reflexiva, motivadora y práctica, enfocándose en la síntesis de conocimientos de grandes pensadores y líderes para ofrecer lecciones aplicables en la vida diaria.

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
- Razón: The generated content closely aligns with the themes of personal development and learning from successful figures as outlined in the ground truth. Phrases like 'aprender de la experiencia ajena' and references to 'grandes personajes' reflect the book's focus on learning from notable individuals like Dale Carnegie and Steve Jobs. However, while it is specific to the book's themes, it lacks direct, 

### EN
- Score: 0.30
- Usa conceptos específicos: false
- Razón: The generated content discusses themes of learning from the experiences of others and personal development, which are relevant to the book's focus. However, it does not reference any specific figures or concepts from the ground truth, making it generic and applicable to any self-help or business book.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sin referencias meta.
- EN: pagina — Tono directo y reflexivo, sin referencias meta.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.55 ← promedio de los 2 judges
- **Combined:** **0.82**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 8902
- Tiempo total: 66.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41414ms
- anchors: 2310 tokens, 5530ms
- palette: 0 tokens, 0ms
- content_es: 2436 tokens, 6736ms
- judge_es: 804 tokens, 1768ms
- content_en: 1843 tokens, 8016ms
- judge_en: 740 tokens, 2334ms
- voice: 769 tokens, 1074ms
