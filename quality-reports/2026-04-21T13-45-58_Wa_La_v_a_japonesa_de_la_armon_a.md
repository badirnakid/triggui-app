# Quality Report — Wa La vía japonesa de la armonía

**Autor:** Laura Imai Messina
**Ejecutado:** 2026-04-21T13-45-58
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
- el compromiso con uno mismo como camino hacia la armonía
- paciencia y cuidado en las acciones diarias
- la belleza y el civismo como construcciones colectivas
- la renovación a través de las setenta y dos estaciones del calendario lunar japonés

**Key terms:** wa, armonía, civismo, paciencia, belleza, renovación

**Voz autorial:** La voz de Laura Imai Messina es reflexiva y poética, invitando al lector a una profunda conexión con la cultura japonesa y sus valores.

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
- Razón: The generated content directly references the concept of 'wa' and its significance in Japanese culture, aligning closely with the ground truth. It emphasizes the themes of community, commitment, and the pursuit of happiness through shared experiences, which are central to the book's message. Phrases like 'la búsqueda de la verdadera felicidad' and 'el compromiso con uno mismo' reflect specific ten

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content directly references the concept of 'wa' as a guiding principle in Japanese culture, emphasizing shared happiness and community, which aligns closely with the book's themes. Additionally, it discusses the importance of patience and care in daily actions, reflecting the book's focus on personal commitment and harmony. The phrases used are specific to the book's exploration of Japanese文化,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre la vida diaria sin referencias externas.
- EN: pagina — Voz directa y reflexiones sobre la vida cotidiana.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.87 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.94**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10293
- Tiempo total: 28.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 4113ms
- anchors: 2555 tokens, 6204ms
- palette: 0 tokens, 0ms
- content_es: 2715 tokens, 8256ms
- judge_es: 1052 tokens, 2040ms
- content_en: 2141 tokens, 5353ms
- judge_en: 1017 tokens, 1754ms
- voice: 813 tokens, 785ms
