# Quality Report — El hombre en busca de sentido

**Autor:** Viktor Frankl
**Ejecutado:** 2026-04-22T23-22-26
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `model_inference`
- **Tier reached:** 2.5
- **Book identity confidence:** 0.81
- **Resolution path:** evidence_fetched_0sources → tier3_conf_0.95


### Libros similares considerados (inferencia)
- **El arte de la felicidad** (Dalai Lama y Howard Cutler): Explora la búsqueda de la felicidad y el sentido de la vida desde una perspectiva filosófica y psicológica.
- **Man's Search for Meaning** (Viktor Frankl): Es la versión en inglés del mismo libro, que aborda el sentido de la vida a través de la experiencia en campos de concentración.
- **La conquista de la felicidad** (Bertrand Russell): Reflexiona sobre la búsqueda de la felicidad y el sentido en la vida desde un enfoque filosófico.
- **El poder del ahora** (Eckhart Tolle): Se centra en la importancia de vivir el presente y encontrar significado en la existencia.
- **El hombre en busca de sí mismo** (Rollo May): Aborda la búsqueda de identidad y sentido en la vida, similar a los temas de Frankl.


### Ground truth utilizado
```
TEMA INFERIDO (el modelo no conoce este libro directamente, infiere desde similares):

La búsqueda de sentido en la vida, especialmente en situaciones adversas y difíciles.

VOZ INFERIDA:
Reflexiva y filosófica, con un enfoque en la psicología y la experiencia humana.

LIBROS SIMILARES QUE COMPARTEN ADN CON ESTE:
- "El arte de la felicidad" (Dalai Lama y Howard Cutler): Explora la búsqueda de la felicidad y el sentido de la vida desde una perspectiva filosófica y psicológica.
- "Man's Search for Meaning" (Viktor Frankl): Es la versión en inglés del mismo libro, que aborda el sentido de la vida a través de la experiencia en campos de concentración.
- "La conquista de la felicidad" (Bertrand Russell): Reflexiona sobre la búsqueda de la felicidad y el sentido en la vida desde un enfoque filos...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la búsqueda de sentido en la vida
- enfrentar el sufrimiento con dignidad
- la libertad de elegir nuestra actitud ante el sufrimiento

**Key terms:** logoterapia, sentido de la vida, sufrimiento, experiencia humana, voluntad de sentido

**Voz autorial:** Reflexiva y filosófica, con un enfoque en la psicología y la experiencia humana.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: muted
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_literario
- Resultado: paper=#CFD2D3, accent=#3D8FB8, ink=#171A1C, contraste=11.50:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects the themes of seeking meaning in life, especially in adversity, which aligns perfectly with the inferred ground truth. Phrases like 'la búsqueda de sentido' and 'la capacidad de decidir nuestra actitud frente a las circunstancias' are specific to the book's themes and concepts, demonstrating a deep connection to the philosophical and psychological exploratio

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content directly addresses the themes of finding meaning in suffering and the importance of attitude in adversity, which are central to the inferred theme of the book. Phrases like 'the quest for meaning becomes a beacon amidst adversity' and 'the ability to decide our attitude in the face of circumstances' specifically reflect the philosophical and psychological exploration of life's meaning,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones en primera persona sobre la actitud.
- EN: pagina — Voz directa y reflexiones en primera persona sobre el sufrimiento.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.81 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.89 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.91**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 8
- Tokens totales: 9760
- Tiempo total: 50.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 581 tokens, 30724ms
- anchors: 2305 tokens, 4415ms
- palette: 0 tokens, 1ms
- content_es: 2471 tokens, 4749ms
- judge_es: 860 tokens, 1864ms
- content_en: 1907 tokens, 6026ms
- judge_en: 828 tokens, 2462ms
- voice: 808 tokens, 689ms
