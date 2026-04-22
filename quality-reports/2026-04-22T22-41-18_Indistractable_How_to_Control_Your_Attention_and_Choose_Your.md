# Quality Report — Indistractable: How to Control Your Attention and Choose Your Life

**Autor:** Nir Eyal
**Ejecutado:** 2026-04-22T22-41-18
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `model_inference`
- **Tier reached:** 3
- **Book identity confidence:** 0.64
- **Resolution path:** evidence_fetched_0sources → tier3_conf_0.85


### Libros similares considerados (inferencia)
- **Deep Work** (Cal Newport): Aborda la importancia de la concentración profunda en un mundo lleno de distracciones.
- **Atomic Habits** (James Clear): Explora cómo formar buenos hábitos y romper los malos, relacionado con el control de la atención.
- **The Power of Now** (Eckhart Tolle): Enfocado en la atención plena y el control de la mente para vivir en el presente.
- **Mindset: The New Psychology of Success** (Carol S. Dweck): Discute cómo nuestras creencias sobre nuestras habilidades pueden influir en nuestra vida y atención.


### Ground truth utilizado
```
TEMA INFERIDO (el modelo no conoce este libro directamente, infiere desde similares):

El libro probablemente trata sobre la gestión de la atención y cómo evitar distracciones para mejorar la calidad de vida y la productividad personal.

VOZ INFERIDA:
Es probable que la voz del autor sea motivacional y práctica, enfocándose en estrategias aplicables para el lector.

LIBROS SIMILARES QUE COMPARTEN ADN CON ESTE:
- "Deep Work" (Cal Newport): Aborda la importancia de la concentración profunda en un mundo lleno de distracciones.
- "Atomic Habits" (James Clear): Explora cómo formar buenos hábitos y romper los malos, relacionado con el control de la atención.
- "The Power of Now" (Eckhart Tolle): Enfocado en la atención plena y el control de la mente para vivir en el presente.
- "Mindset: The New...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- gestión de la atención
- evitar distracciones
- mejorar la calidad de vida
- productividad personal
- estrategias aplicables

**Key terms:** indistractable, atención plena, distracciones, productividad, control personal

**Voz autorial:** La voz del autor es motivacional y práctica, enfocándose en proporcionar estrategias que el lector puede aplicar en su vida diaria.

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
- Razón: The generated content directly addresses the themes of attention management and productivity, which align closely with the inferred ground truth of the book. Phrases like 'domina tu atención' and 'indistractable' specifically reflect the book's focus on overcoming distractions to enhance quality of life and productivity. Additionally, the motivational tone and practical strategies presented are in

### EN
- Score: 0.90
- Usa conceptos específicos: true
- Razón: The content is highly specific to the themes of attention management and productivity, which align closely with the inferred themes of the book. Phrases like 'master your attention' and 'overcome distractions' directly reflect the core concepts of improving quality of life through focus. The motivational tone and practical strategies also resonate with the inferred voice of the author. While it is

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la acción personal.
- EN: pagina — Voz directa y enfoque en estrategias prácticas sin referencias meta.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.64 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.88 ← anti-genericidad de anchors
- **grounding_judge:** 0.95 ← promedio de los 2 judges
- **Combined:** **0.84**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 8
- Tokens totales: 9376
- Tiempo total: 49.2s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 543 tokens, 28425ms
- anchors: 2263 tokens, 6214ms
- palette: 0 tokens, 1ms
- content_es: 2411 tokens, 4465ms
- judge_es: 795 tokens, 2785ms
- content_en: 1824 tokens, 4355ms
- judge_en: 760 tokens, 1656ms
- voice: 780 tokens, 1267ms
