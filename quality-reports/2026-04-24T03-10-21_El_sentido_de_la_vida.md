# Quality Report — El sentido de la vida

**Autor:** Viktor Frankl
**Ejecutado:** 2026-04-24T03-10-21
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `model_inference`
- **Tier reached:** 3
- **Book identity confidence:** 0.68
- **Resolution path:** evidence_fetched_0sources → tier3_conf_0.90


### Libros similares considerados (inferencia)
- **El hombre en busca de sentido** (Viktor Frankl): Escrito por el mismo autor, aborda la búsqueda de significado en la vida a través de experiencias en campos de concentración.
- **La vida tiene sentido** (Victor Frankl): También del mismo autor, explora la importancia de encontrar un propósito en la vida.
- **El poder del ahora** (Eckhart Tolle): Aunque es diferente en enfoque, trata sobre la búsqueda de significado y la conciencia en el presente.
- **La búsqueda del sentido** (Irvin D. Yalom): Reflexiona sobre la búsqueda de significado en la vida, especialmente en el contexto de la muerte y la existencia.
- **Man's Search for Meaning** (Viktor Frankl): El título original en inglés del libro de Frankl que también trata sobre la búsqueda de sentido.


### Ground truth utilizado
```
TEMA INFERIDO (el modelo no conoce este libro directamente, infiere desde similares):

La búsqueda de significado en la vida, especialmente en situaciones adversas y ante la muerte.

VOZ INFERIDA:
Reflexiva y filosófica, con un enfoque en la psicología y la experiencia humana.

LIBROS SIMILARES QUE COMPARTEN ADN CON ESTE:
- "El hombre en busca de sentido" (Viktor Frankl): Escrito por el mismo autor, aborda la búsqueda de significado en la vida a través de experiencias en campos de concentración.
- "La vida tiene sentido" (Victor Frankl): También del mismo autor, explora la importancia de encontrar un propósito en la vida.
- "El poder del ahora" (Eckhart Tolle): Aunque es diferente en enfoque, trata sobre la búsqueda de significado y la conciencia en el presente.
- "La búsqueda del sentido"...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la búsqueda de significado en situaciones adversas
- encontrar propósito incluso ante la muerte
- la importancia de la libertad interior

**Key terms:** logoterapia, significado, experiencia humana, adversidad, propósito

**Voz autorial:** Reflexiva y filosófica, enfocada en la psicología y la experiencia humana, invitando a la introspección.

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
- Razón: The generated content is deeply anchored in the themes of the book, specifically the search for meaning in adversity and the transformative power of suffering. Phrases like 'la búsqueda de significado' and 'libertad interior' directly reflect the core concepts inferred from the ground truth, aligning closely with the philosophical and psychological exploration of human experience in difficult life

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content strongly reflects the themes of seeking meaning in adversity and the transformative power of suffering, which are central to the inferred ground truth. Phrases like 'the search for meaning becomes the beacon guiding our existence' and 'suffering can be transformed into a bridge toward inner freedom' directly align with the philosophical and psychological exploration found in similar to

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre la experiencia humana.
- EN: pagina — Tono reflexivo y directo, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.68 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.89 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.84**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 8
- Tokens totales: 9698
- Tiempo total: 44.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 576 tokens, 27520ms
- anchors: 2285 tokens, 4575ms
- palette: 0 tokens, 1ms
- content_es: 2477 tokens, 5353ms
- judge_es: 855 tokens, 1787ms
- content_en: 1891 tokens, 3493ms
- judge_en: 817 tokens, 1197ms
- voice: 797 tokens, 843ms
