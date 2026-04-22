# Quality Report — El viaje de Andrés

**Autor:** Svend Brinkmann
**Ejecutado:** 2026-04-22T14-41-30
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_4sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

¿Qué es el ser humano? Alrededor de Andrés todo eran preguntas profundas: ¿quién eres?, ¿qué quieres?, ¿qué te hace feliz? Sin embargo, jamás se había cuestionado el sentido de la existencia misma. Jamás… hasta la lectura de un misterioso manuscrito durante un viaje de aprendizaje que cambiará su vida. Andrés es un adolescente introvertido que atraviesa una depresión. Cuando más necesita cambiar de aires, Ana, su abuela paterna, le propone recorrer Europa en tren juntos. Por desgracia, Ana cae gravemente enferma. Consciente de que ya no podrá acompañarlo, le anima a embarcarse en ese viaje planeado. Incluso le regala una maleta de libros para que lo acompañen. De todos ellos, le insiste en leer ¿Qué es el ser humano?, un manuscrito filosófico que le guiará ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la búsqueda del sentido de la existencia
- la influencia de las relaciones interpersonales en el crecimiento personal
- la exploración de la identidad a través de la experiencia
- la conexión entre la literatura y la comprensión de la humanidad
- el viaje como metáfora de autodescubrimiento

**Key terms:** existencialismo, filosofía, autodescubrimiento, relaciones humanas, viaje

**Voz autorial:** La voz de Svend Brinkmann en este libro es reflexiva y filosófica, invitando al lector a cuestionar su propia existencia y a explorar su identidad a través de la narrativa de un joven en busca de respuestas.

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
- Razón: The generated content is deeply anchored in the specific themes and concepts of the book 'El viaje de Andrés'. It references Andrés' journey of self-discovery, his relationship with his grandmother, and the philosophical exploration prompted by the mysterious manuscript, all of which are central to the book's narrative. The phrases used reflect the essence of the story and its philosophical underp

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content closely reflects the themes of the book, particularly the journey of self-discovery and the philosophical exploration of existence as prompted by the manuscript. It mentions Andrés' depression and the influence of his grandmother, which are specific elements from the ground truth. However, some phrases are somewhat generic and could apply to broader philosophical discussions, slightly,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.80)
- ES: pagina — Voz directa y reflexiones sobre el viaje de Andrés.
- EN: pagina — Voz directa y reflexiones sobre el viaje de Andrés.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.9 ← del voice judge
- **specificity:** 0.87 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.91**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10114
- Tiempo total: 32.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3831ms
- anchors: 2649 tokens, 7672ms
- palette: 0 tokens, 0ms
- content_es: 2639 tokens, 7248ms
- judge_es: 971 tokens, 3175ms
- content_en: 2083 tokens, 6909ms
- judge_en: 909 tokens, 1656ms
- voice: 863 tokens, 2035ms
