# Quality Report — El sendero del yoga

**Autor:** Osho
**Ejecutado:** 2026-04-22T20-02-56
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

En la actualidad sobreviven del yoga, sobre todo, los ejercicios físicos que ayudan a lograr un estado vital más relajado y equilibrado. No obstante, como explica Osho, las posturas no vinieron primero, sino que los practicantes se dieron cuenta de que al alcanzar un estado meditativo, el cuerpo adoptaba ciertas posturas de modo natural. Al estar cuerpo y mente tan íntimamente conectados, es posible lograr cierta paz de espítritu mediante una postura corporal que corresponda a esta paz. Pero sería un error creer que el carro tira del caballo. Al retroceder a las enseñanzas originales como punto de partida. Osho aclara la relación cuerpo-mente y revela que el yoga no es una serie de ejercicios físicos, sino lo que él llama "una ciencia del alma". En El sende...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la conexión entre cuerpo y mente
- el yoga como ciencia del alma
- posturas corporales y estados meditativos
- enseñanzas originales de Patañjali
- autoconocimiento a través del yoga

**Key terms:** Patañjali, raja yoga, ciencia del alma, posturas, meditación

**Voz autorial:** Osho presenta un enfoque contemporáneo y profundo sobre el yoga, resaltando su esencia espiritual más allá de los ejercicios físicos.

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
- Razón: The generated content is deeply anchored in the ground truth of 'El sendero del Yoga' by Osho. It specifically references the connection between body and mind, the teachings of Patañjali, and the concept of yoga as a 'science of the soul.' The phrases used in the content reflect the book's themes and terminology, making it highly relevant and specific to the text.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly references key concepts from the ground truth, such as the connection between body and mind, the teachings of Patañjali, and the idea of yoga as a vehicle for self-knowledge. Phrases like 'science of the soul' and 'transformative meditative state' are specifically aligned with Osho's interpretations in 'El sendero del Yoga', making the content highly relevant and not

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre la práctica del yoga.
- EN: pagina — Tono directo y reflexivo, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.96**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- author_truncated: "Osho"

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10158
- Tiempo total: 67.3s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40897ms
- anchors: 2478 tokens, 4669ms
- palette: 0 tokens, 0ms
- content_es: 2676 tokens, 7250ms
- judge_es: 1048 tokens, 2504ms
- content_en: 2113 tokens, 6021ms
- judge_en: 1001 tokens, 4682ms
- voice: 842 tokens, 1326ms
