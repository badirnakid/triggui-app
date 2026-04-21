# Quality Report — Come muévete y duerme

**Autor:** Tom Rath
**Ejecutado:** 2026-04-21T13-31-01
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `google_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Google Books):

The decisions you make on a daily basis are important because eventually those decisions, if correct, increase your changes of living longer and healthier lives. If you eat, exercise, and sleep better today, tomorrow you will have more energy, you will treat your family and friends better, you will have more success at work, and you will contribute more to your community. This book is an invitation to adopt healthier habits. Each of the thirty chapters of this volume bring together scientific findings about diet, exercise, and sleep.

METADATA VERIFICADA:
- Título: Come, Muévete y Duerme
- Autor: Tom Rath
- Año: 2017
- Categorías: Health & Fitness
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la importancia de las decisiones diarias en la salud
- la relación entre dieta, ejercicio y sueño
- adopción de hábitos saludables para una vida más larga
- el impacto de la energía en las relaciones y el trabajo
- contribución a la comunidad a través de elecciones saludables

**Key terms:** hábitos saludables, dieta, ejercicio, sueño, bienestar

**Voz autorial:** La voz de Tom Rath es accesible y motivadora, presentando información científica de manera clara y práctica, invitando a los lectores a reflexionar sobre sus hábitos diarios.

---

## 🎨 Visual synthesis

- hue_primary: 120
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 5
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#CFD3CF, accent=#1FD62E, ink=#171C18, contraste=11.41:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content closely reflects the ground truth of the book 'Come, Muévete y Duerme' by Tom Rath. It specifically mentions the importance of daily decisions regarding diet, exercise, and sleep, which are central themes in the book. Phrases like 'decisiones saludables' and 'adoptar hábitos saludables' directly relate to the book's focus on making healthier choices for long-term well-being. 

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the ground truth of the book by emphasizing the importance of daily decisions related to diet, exercise, and sleep, which are central themes in the book. Phrases like 'choices shape your future health' and 'embracing healthy habits' directly correlate with the book's focus on adopting healthier habits for long-term well-being. The content is specific and not,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en decisiones personales sin referencias externas.
- EN: pagina — Voz directa y enfoque en hábitos personales sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 8784
- Tiempo total: 21.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2103ms
- anchors: 2306 tokens, 4534ms
- palette: 0 tokens, 0ms
- content_es: 2396 tokens, 5305ms
- judge_es: 752 tokens, 2288ms
- content_en: 1821 tokens, 4071ms
- judge_en: 717 tokens, 1900ms
- voice: 792 tokens, 1201ms
