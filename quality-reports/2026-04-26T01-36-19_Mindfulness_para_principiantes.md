# Quality Report — Mindfulness para principiantes

**Autor:** Jon Kabat-Zinn
**Ejecutado:** 2026-04-26T01-36-19
**Pipeline:** nucleus-canonical-v3.3

---

## 🌐 Grounding

- **Source:** `model_inference`
- **Tier reached:** 3
- **Book identity confidence:** 0.64
- **Resolution path:** evidence_fetched_0sources → tier3_conf_0.85


### Libros similares considerados (inferencia)
- **El poder del ahora** (Eckhart Tolle): Ambos libros tratan sobre la importancia de vivir en el presente y la conciencia plena.
- **La práctica de la atención plena** (Jon Kabat-Zinn): Escrito por el mismo autor, se centra en la meditación y la atención plena.
- **Despierta tu héroe interior** (Victor Hugo): Aunque es más sobre el desarrollo personal, también toca el tema de la conciencia y el presente.
- **Mindfulness en la vida cotidiana** (Jon Kabat-Zinn): Otro libro del mismo autor que explora la aplicación del mindfulness en la vida diaria.


### Ground truth utilizado
```
TEMA INFERIDO (el modelo no conoce este libro directamente, infiere desde similares):

La práctica de la atención plena y la importancia de vivir en el presente, así como técnicas para mejorar la concentración y reducir el estrés.

VOZ INFERIDA:
Reflexiva y accesible, con un enfoque práctico y orientado a la autoayuda.

LIBROS SIMILARES QUE COMPARTEN ADN CON ESTE:
- "El poder del ahora" (Eckhart Tolle): Ambos libros tratan sobre la importancia de vivir en el presente y la conciencia plena.
- "La práctica de la atención plena" (Jon Kabat-Zinn): Escrito por el mismo autor, se centra en la meditación y la atención plena.
- "Despierta tu héroe interior" (Victor Hugo): Aunque es más sobre el desarrollo personal, también toca el tema de la conciencia y el presente.
- "Mindfulness en la vida coti...
```

---

## 🖼️ Portada

- **Source:** `n/a`



---

## ⚓ Anchors extraídos

**Conceptos:**
- la práctica de la atención plena
- vivir en el presente
- técnicas para mejorar la concentración
- reducción del estrés
- enfoque en el aquí y el ahora

**Key terms:** atención plena, mindfulness, concentración, estrés, presencia

**Voz autorial:** Reflexiva y accesible, con un enfoque práctico y orientado a la autoayuda en la práctica del mindfulness.

---

## 🎨 Visual synthesis

- hue_primary: 140
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#CFD3D0, accent=#1FD65C, ink=#171C19, contraste=11.41:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content is deeply anchored in the themes of mindfulness and living in the present, which are central to the inferred ground truth of the book. Phrases like 'cada respiración consciente' and 'vivir en el presente es un regalo' directly reflect the importance of mindfulness and present awareness. The content is specific and relevant to the book's focus, making it unsuitable for generic

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content is deeply anchored in the themes of mindfulness and living in the present, which are central to the inferred ground truth of the book. Phrases like 'Each conscious breath reconnects us with the moment' and 'Living in the present is a gift we give ourselves' directly reflect the book's focus on mindfulness and present awareness. The content is specific and relevant, making it 

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre la práctica de atención plena.
- EN: pagina — Voz directa y reflexiones sobre la práctica de mindfulness.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.64 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.86**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 8
- Tokens totales: 9590
- Tiempo total: 49.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 542 tokens, 27390ms
- anchors: 2260 tokens, 5624ms
- palette: 0 tokens, 1ms
- content_es: 2451 tokens, 5606ms
- judge_es: 838 tokens, 3028ms
- content_en: 1879 tokens, 4990ms
- judge_en: 799 tokens, 1924ms
- voice: 821 tokens, 898ms
