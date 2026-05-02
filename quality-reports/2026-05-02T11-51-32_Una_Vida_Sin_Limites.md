# Quality Report — Una Vida Sin Limites

**Autor:** Alejandra Llamas
**Ejecutado:** 2026-05-02T11-51-32
**Pipeline:** nucleus-canonical-v3.7.1

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

A diez años de haber sido publicado por primera vez, Una vida sin límites se reedita para que los lectores de Alejandra Llamas, los seguidores del Tao Te Ching y los interesados en tener una vida plena encuentren las herramientas clave para eliminar los miedos y los obstáculos que les impiden vivir en equilibrio emocional. El libro incluye declaraciones diarias y una app en la que podrán descargar información extra para enriquecer su experiencia. En este libro, Alejandra Llamas realiza un profundo análisis sobre la conexión que debe tener todo ser humano con su mundo interno para lograr alejarse del miedo y acercarse a la unión y al amor. A través de 45 versos fundamentales del Tao Te Ching, texto ancestral clásico chino atribuido al filósofo Lao Tsé, Una v...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- conexión con el mundo interno
- alejarse del miedo
- unión y amor a través del Tao
- serenidad y paz interior
- herramientas para una vida plena

**Key terms:** Tao Te Ching, Lao Tsé, equilibrio emocional, declaraciones diarias, reflexión

**Voz autorial:** La voz de Alejandra Llamas es profunda y reflexiva, invitando al lector a una introspección sobre su vida y su conexión con el entorno.

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
- Razón: The generated content directly references key themes from 'Una vida sin límites', such as the importance of internal connection, overcoming fear, and the influence of the Tao. Phrases like 'la conexión con el mundo interno' and 'aleja el miedo, abraza la unión y el amor' are specific to the book's teachings, making it highly relevant and not generic.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly references concepts from the book, such as 'inner world', 'serenity', 'Tao', and 'love', which are central to Alejandra Llamas' teachings. It emphasizes emotional balance and reflection, aligning closely with the themes of 'Una vida sin límites'.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre el tema.
- EN: pagina — Voz directa y reflexiva, sin referencias externas al libro.

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
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9378
- Tiempo total: 29.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 1377ms
- anchors: 2432 tokens, 7253ms
- palette: 0 tokens, 0ms
- content_es: 2505 tokens, 7114ms
- judge_es: 880 tokens, 1627ms
- content_en: 1920 tokens, 4721ms
- judge_en: 851 tokens, 3552ms
- voice: 790 tokens, 3910ms
- highlight_judge_es_parrafoTop: 640 tokens, 0ms
- highlight_judge_es_parrafoBot: 647 tokens, 0ms
- highlight_judge_es_parrafoBot_retry: 654 tokens, 0ms
- highlight_judge_en_parrafoTop: 638 tokens, 0ms
- highlight_judge_en_parrafoBot: 640 tokens, 0ms
