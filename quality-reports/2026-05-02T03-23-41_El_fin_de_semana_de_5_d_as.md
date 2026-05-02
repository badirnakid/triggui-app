# Quality Report — El fin de semana de 5 días

**Autor:** Nik Halik
**Ejecutado:** 2026-05-02T03-23-41
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `model_inference`
- **Tier reached:** 3
- **Book identity confidence:** 0.60
- **Resolution path:** evidence_fetched_0sources → tier3_conf_0.80


### Libros similares considerados (inferencia)
- **Los secretos de la mente millonaria** (T. Harv Eker): Aborda la mentalidad necesaria para alcanzar la libertad financiera.
- **Piense y hágase rico** (Napoleon Hill): Un clásico sobre la mentalidad y estrategias para lograr el éxito financiero.
- **La semana laboral de 4 horas** (Tim Ferriss): Explora la optimización del tiempo y la búsqueda de un estilo de vida más libre.
- **El hombre más rico de Babilonia** (George S. Clason): Ofrece lecciones sobre la gestión del dinero y la creación de riqueza.


### Ground truth utilizado
```
TEMA INFERIDO (el modelo no conoce este libro directamente, infiere desde similares):

Superación personal y libertad financiera, con un enfoque en la gestión del tiempo y la búsqueda de un estilo de vida más satisfactorio.

VOZ INFERIDA:
Motivacional y práctico, con un enfoque en la acción y el cambio personal.

LIBROS SIMILARES QUE COMPARTEN ADN CON ESTE:
- "Los secretos de la mente millonaria" (T. Harv Eker): Aborda la mentalidad necesaria para alcanzar la libertad financiera.
- "Piense y hágase rico" (Napoleon Hill): Un clásico sobre la mentalidad y estrategias para lograr el éxito financiero.
- "La semana laboral de 4 horas" (Tim Ferriss): Explora la optimización del tiempo y la búsqueda de un estilo de vida más libre.
- "El hombre más rico de Babilonia" (George S. Clason): Ofrece lec...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- libertad financiera como objetivo de vida
- gestión efectiva del tiempo
- estilo de vida satisfactorio y pleno
- acción hacia el cambio personal
- superación personal a través de la planificación

**Key terms:** libertad financiera, gestión del tiempo, superación personal, estilo de vida, acción

**Voz autorial:** La voz es motivacional y práctica, enfocándose en el empoderamiento del lector para tomar acción y transformar su vida.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#CFD2D3, accent=#129DE2, ink=#171A1C, contraste=11.50:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: El contenido generado se ancla firmemente en el tema de la libertad financiera y la superación personal, utilizando conceptos específicos como la gestión del tiempo y la acción hacia el éxito. Las frases reflejan claramente la voz motivacional y práctica del libro, lo que demuestra una conexión directa con el ground_truth.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content directly addresses financial freedom and personal growth, aligning closely with the inferred themes of self-improvement and financial independence. Phrases like 'effective time management' and 'transform your life' reflect specific concepts from the ground truth, making it highly relevant to the book's focus.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y motivacional, sin referencias externas al libro.
- EN: pagina — Voz directa y motivacional, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.6 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.83 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.83**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 8
- Tokens totales: 9697
- Tiempo total: 39.3s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 562 tokens, 19564ms
- anchors: 2286 tokens, 5425ms
- palette: 0 tokens, 0ms
- content_es: 2454 tokens, 5641ms
- judge_es: 823 tokens, 1312ms
- content_en: 1912 tokens, 3984ms
- judge_en: 809 tokens, 2178ms
- voice: 851 tokens, 764ms
- highlight_judge_es_parrafoTop: 648 tokens, 0ms
- highlight_judge_es_parrafoBot: 643 tokens, 0ms
- highlight_judge_en_parrafoTop: 639 tokens, 0ms
- highlight_judge_en_parrafoBot: 633 tokens, 0ms
