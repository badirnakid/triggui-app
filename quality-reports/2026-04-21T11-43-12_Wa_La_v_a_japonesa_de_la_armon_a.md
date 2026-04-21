# Quality Report — Wa La vía japonesa de la armonía

**Autor:** Laura Imai Messina
**Ejecutado:** 2026-04-21T11-43-12
**Pipeline:** nucleus-canonical-v3

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

¿En qué consiste exactamente el espíritu japonés? 72 palabras para entender que la verdadera felicidad es la compartida. Wa significa armonía, pero como todas las palabras japonesas evoca mucho más. Wa es, de hecho, todo lo que es suave, sereno y moderado, pero también hace referencia a todo lo que es japonés. Wa es un prefijo que se aplica tanto a cosas como a conceptos. A través de wa, Japón nos enseña su mejor lección: la belleza, la alegría y el civismo se construyen con grandes dosis de compromiso, mediante el trabajo continuo en uno mismo, ejercitando la paciencia, haciendo las cosas con cuidado y nunca a expensas de otros, porque una felicidad verdaderamente duradera es un proyecto de todos y nunca de uno solo. Laura Imai Messina, autora italiana afi...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la verdadera felicidad es la compartida
- el compromiso con uno mismo
- la paciencia y el cuidado en las acciones
- la belleza y el civismo como construcciones colectivas
- la renovación a través de las estaciones del calendario lunar japonés

**Key terms:** wa, armonía, civismo, paciencia, belleza, renovación

**Voz autorial:** La voz de Laura Imai Messina es reflexiva y poética, con un enfoque en la conexión cultural y la enseñanza de valores japoneses que trascienden fronteras.

---

## 🎨 Visual synthesis

- hue_primary: 140
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_literario
- Resultado: paper=#CFD3D0, accent=#1FD65C, ink=#171C19, contraste=11.41:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content explicitly references the concept of 'wa' and emphasizes the importance of shared happiness and harmony, which are central themes in the book's synopsis. Phrases like 'la verdadera felicidad se encuentra en la conexión con los demás' and 'el compromiso con uno mismo es fundamental' directly align with the book's exploration of Japanese values and the essence of community and,

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the concepts outlined in the ground truth, specifically the idea of 'wa' as harmony and the importance of shared happiness. Phrases like 'the beauty of shared happiness' and 'commitment to oneself' directly relate to the teachings of the book. The content emphasizes collective joy and civility, which are central themes in the book's exploration of Japanese文化.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre la vida, sin referencias externas.
- EN: pagina — Voz directa y reflexiones sobre la vida, sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.89 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10541
- Tiempo total: 21.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3262ms
- anchors: 2540 tokens, 4286ms
- palette: 0 tokens, 0ms
- content_es: 2737 tokens, 4225ms
- judge_es: 1078 tokens, 1811ms
- content_en: 2222 tokens, 5641ms
- judge_en: 1071 tokens, 1822ms
- voice: 893 tokens, 861ms
