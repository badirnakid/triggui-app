# Quality Report — El sendero del yoga

**Autor:** Osho
**Ejecutado:** 2026-04-22T03-47-25
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
- la conexión entre cuerpo y mente como clave para la paz espiritual
- el yoga como una ciencia del alma
- la meditación como precursor de las posturas de yoga
- la interpretación de los sutras de Patañjali
- el yoga como herramienta para el autoconocimiento

**Key terms:** ciencia del alma, estado meditativo, posturas corporales, sutras de Patañjali, raja yoga

**Voz autorial:** La voz de Osho es reflexiva y profunda, combinando sabiduría antigua con una perspectiva contemporánea que invita a la introspección y al autoconocimiento.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_literario
- Resultado: paper=#CFD2D3, accent=#1F99D6, ink=#171A1C, contraste=11.50:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly references key concepts from the ground truth, such as the idea of yoga as 'a science of the soul' and the connection between body and mind. It also mentions the sutras of Patañjali, which are specifically highlighted in the book's synopsis. The phrases used are not generic and are closely tied to the themes and teachings presented by Osho in 'El sendero del Yoga'.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the ground truth of 'El sendero del Yoga' by Osho. It specifically mentions the concepts of yoga as a 'science of the soul' and references the sutras of Patanjali, which are central to the book's themes. The phrases about the bond between body and mind and the journey toward self-discovery align perfectly with Osho's teachings, making it highly specific to 'E

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en la práctica del yoga.
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
- Tokens totales: 10155
- Tiempo total: 60.1s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40680ms
- anchors: 2520 tokens, 5491ms
- palette: 0 tokens, 0ms
- content_es: 2699 tokens, 5169ms
- judge_es: 1036 tokens, 1823ms
- content_en: 2109 tokens, 4421ms
- judge_en: 993 tokens, 1935ms
- voice: 798 tokens, 603ms
