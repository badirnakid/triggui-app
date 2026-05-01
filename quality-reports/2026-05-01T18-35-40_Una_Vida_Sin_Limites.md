# Quality Report — Una Vida Sin Limites

**Autor:** Alejandra Llamas
**Ejecutado:** 2026-05-01T18-35-40
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

A diez años de haber sido publicado por primera vez, Una vida sin límites se reedita para que los lectores de Alejandra Llamas, los seguidores del Tao Te Ching y los interesados en tener una vida plena encuentren las herramientas clave para eliminar los miedos y los obstáculos que les impiden vivir en equilibrio emocional. El libro incluye declaraciones diarias y una app en la que podrán descargar información extra para enriquecer su experiencia. En este libro, Alejandra Llamas realiza un profundo análisis sobre la conexión que debe tener todo ser humano con su mundo interno para lograr alejarse del miedo y acercarse a la unión y al amor. A través de 45 versos fundamentales del Tao Te Ching, texto ancestral clásico chino atribuido al filósofo Lao Tsé, Una v...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- conexión con el mundo interno
- eliminación del miedo
- unión y amor a través del Tao
- herramientas para el equilibrio emocional
- reflexión para alcanzar la serenidad

**Key terms:** Tao Te Ching, Lao Tsé, paz interior, versos fundamentales, declaraciones diarias

**Voz autorial:** La voz de Alejandra Llamas es reflexiva y espiritual, invitando al lector a una profunda introspección y a la búsqueda de una vida plena a través del entendimiento del Tao.

---

## 🎨 Visual synthesis

- hue_primary: 140
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_moderno
- Resultado: paper=#CFD3D0, accent=#1FD65C, ink=#171C19, contraste=11.41:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly references key concepts from the ground truth, such as 'conexión interna', 'eliminación del miedo', and 'Tao Te Ching', which are central to Alejandra Llamas' book. The phrases reflect the themes of emotional balance and inner peace that are explicitly mentioned in the synopsis.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects key concepts from the ground truth, such as 'inner connection', 'eliminating fear', and references to the 'Tao Te Ching'. It emphasizes emotional balance and the journey towards peace, which are central themes in Alejandra Llamas' book.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre la conexión interna.
- EN: pagina — Voz directa y reflexiones personales sobre el tema.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9389
- Tiempo total: 44.3s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 16475ms
- anchors: 2448 tokens, 8957ms
- palette: 0 tokens, 1ms
- content_es: 2514 tokens, 6469ms
- judge_es: 878 tokens, 3142ms
- content_en: 1917 tokens, 6075ms
- judge_en: 848 tokens, 1900ms
- voice: 784 tokens, 1122ms
- highlight_judge_es_parrafoTop: 639 tokens, 0ms
- highlight_judge_es_parrafoBot: 639 tokens, 0ms
- highlight_judge_en_parrafoTop: 635 tokens, 0ms
- highlight_judge_en_parrafoBot: 637 tokens, 0ms
