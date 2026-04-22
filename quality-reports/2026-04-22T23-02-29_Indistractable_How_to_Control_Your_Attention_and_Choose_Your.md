# Quality Report — Indistractable: How to Control Your Attention and Choose Your Life

**Autor:** Nir Eyal
**Ejecutado:** 2026-04-22T23-02-29
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `model_inference`
- **Tier reached:** 3
- **Book identity confidence:** 0.60
- **Resolution path:** evidence_fetched_0sources → tier3_conf_0.80


### Libros similares considerados (inferencia)
- **Deep Work** (Cal Newport): Explora la importancia de la concentración en un mundo lleno de distracciones.
- **The Power of Habit** (Charles Duhigg): Analiza cómo los hábitos afectan nuestra vida y cómo podemos cambiarlos.
- **Atomic Habits** (James Clear): Ofrece estrategias sobre cómo construir buenos hábitos y eliminar los malos.
- **Digital Minimalism** (Cal Newport): Propone un enfoque más consciente sobre el uso de la tecnología y su impacto en nuestra atención.


### Ground truth utilizado
```
TEMA INFERIDO (el modelo no conoce este libro directamente, infiere desde similares):

La gestión de la atención y el control de las distracciones en la vida moderna, así como el desarrollo de hábitos positivos.

VOZ INFERIDA:
Práctica y motivacional, con un enfoque en la autoayuda y el desarrollo personal.

LIBROS SIMILARES QUE COMPARTEN ADN CON ESTE:
- "Deep Work" (Cal Newport): Explora la importancia de la concentración en un mundo lleno de distracciones.
- "The Power of Habit" (Charles Duhigg): Analiza cómo los hábitos afectan nuestra vida y cómo podemos cambiarlos.
- "Atomic Habits" (James Clear): Ofrece estrategias sobre cómo construir buenos hábitos y eliminar los malos.
- "Digital Minimalism" (Cal Newport): Propone un enfoque más consciente sobre el uso de la tecnología y su impact...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- gestión de la atención en un mundo lleno de distracciones
- desarrollo de hábitos positivos
- estrategias para evitar interrupciones
- técnicas de enfoque y concentración
- la importancia de la autodisciplina

**Key terms:** indistractable, atención, distracciones, hábitos, autodisciplina

**Voz autorial:** Práctica y motivacional, con un enfoque en la autoayuda y el desarrollo personal.

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
- Razón: The generated content is highly specific to the themes of attention management and positive habit development, which are central to the inferred ground truth. Phrases like 'La gestión de la atención es clave para el éxito personal' and 'La autodisciplina no es un don, sino una habilidad que se puede cultivar' directly reflect the core concepts of the book. The content is not generic and is clearly

### EN
- Score: 0.90
- Usa conceptos específicos: true
- Razón: The content is highly relevant to the inferred themes of attention management and habit development, using specific phrases like 'cultivate habits' and 'mastering attention' that align closely with the ground truth. It avoids generic language and instead focuses on actionable strategies, making it specific to the book's themes.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en el lector sin referencias externas.
- EN: pagina — Voz directa y consejos prácticos sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.6 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.95 ← promedio de los 2 judges
- **Combined:** **0.84**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 8
- Tokens totales: 9459
- Tiempo total: 51.1s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 517 tokens, 29235ms
- anchors: 2262 tokens, 5936ms
- palette: 0 tokens, 1ms
- content_es: 2429 tokens, 5839ms
- judge_es: 813 tokens, 1951ms
- content_en: 1862 tokens, 5360ms
- judge_en: 750 tokens, 1870ms
- voice: 826 tokens, 901ms
