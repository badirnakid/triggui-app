# Quality Report — Indistractable

**Autor:** Nir Eyal
**Ejecutado:** 2026-04-22T22-52-42
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `model_inference`
- **Tier reached:** 3
- **Book identity confidence:** 0.44
- **Resolution path:** evidence_fetched_0sources → tier3_conf_0.80


### Libros similares considerados (inferencia)
- **Deep Work** (Cal Newport): Aborda la importancia de la concentración en un mundo lleno de distracciones.
- **Atomic Habits** (James Clear): Explora cómo formar buenos hábitos y romper los malos, relacionado con el control personal.
- **The Power of Habit** (Charles Duhigg): Analiza cómo los hábitos influyen en nuestras vidas y cómo podemos cambiarlos.


### Ground truth utilizado
```
TEMA INFERIDO (el modelo no conoce este libro directamente, infiere desde similares):

El libro probablemente trata sobre la gestión del tiempo y la atención, ofreciendo estrategias para evitar distracciones y mejorar la productividad personal.

VOZ INFERIDA:
La voz del autor probablemente es directa y motivadora, con un enfoque práctico y accesible para el lector.

LIBROS SIMILARES QUE COMPARTEN ADN CON ESTE:
- "Deep Work" (Cal Newport): Aborda la importancia de la concentración en un mundo lleno de distracciones.
- "Atomic Habits" (James Clear): Explora cómo formar buenos hábitos y romper los malos, relacionado con el control personal.
- "The Power of Habit" (Charles Duhigg): Analiza cómo los hábitos influyen en nuestras vidas y cómo podemos cambiarlos.
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- estrategias para evitar distracciones
- mejora de la productividad personal
- gestión del tiempo eficaz
- control de la atención
- formación de hábitos positivos

**Key terms:** indistractable, distracción, productividad, gestión del tiempo, hábitos

**Voz autorial:** La voz del autor es directa y motivadora, con un enfoque práctico y accesible para el lector.

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
- Razón: El contenido generado se centra en la gestión de la atención y la productividad personal, conceptos que están claramente alineados con el ground truth del libro. Las frases como 'la atención es un recurso valioso' y 'convertirse en indistractable' reflejan directamente el enfoque del libro sobre cómo manejar distracciones y mejorar la productividad. Además, las estrategias propuestas son prácticas

### EN
- Score: 0.90
- Usa conceptos específicos: true
- Razón: The content is highly specific to the themes of time management and attention management, which align closely with the inferred ground truth of the book. Phrases like 'Attention is a resource worth protecting' and 'Identify your distractions and conquer them' directly reflect the book's focus on strategies to avoid distractions and improve productivity. The motivational tone and practical advice,,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en estrategias personales.
- EN: pagina — Tono directo y enfoque en estrategias del libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.44 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.95 ← promedio de los 2 judges
- **Combined:** **0.79**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 8
- Tokens totales: 9090
- Tiempo total: 45.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 479 tokens, 26173ms
- anchors: 2193 tokens, 4295ms
- palette: 0 tokens, 1ms
- content_es: 2369 tokens, 4789ms
- judge_es: 767 tokens, 2738ms
- content_en: 1786 tokens, 5198ms
- judge_en: 717 tokens, 1713ms
- voice: 779 tokens, 991ms
