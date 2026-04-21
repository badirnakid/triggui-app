# Quality Report — Viaje a las emociones

**Autor:** Eduardo Punset
**Ejecutado:** 2026-04-21T11-02-04
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

La trilogía que ha apasionado a más de medio millón de lectores, en un solo volumen. El viaje que propone Eduardo Punset es el más fascinante de cuantos podamos emprender. Empieza con la búsqueda de la felicidad, una aventura de final incierto a través de todo aquello que nos puede conducir (o apartar) del objetivo, esto es: las emociones, el estrés, los fl ujos hormonales, el envejecimiento, los factores sociales, económicos, culturales, religiosos… Explora acto seguido los fundamentos del amor, el más primordial de los instintos, sus canales de expresión y el secreto de su fórmula; y culmina en lo más íntimo del ser humano, lo que ocurre en el interior de cada uno, y el final de todo viaje: la mente, que es, a la postre, «el único poder». Un recorrido por...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la búsqueda de la felicidad a través de las emociones
- el amor como instinto primordial
- el poder de la mente como motor del ser humano
- impacto del estrés y los flujos hormonales en nuestras vidas
- la influencia de factores sociales y culturales en nuestras emociones

**Key terms:** felicidad, amor, poder, emociones, estrés, mente

**Voz autorial:** La voz de Eduardo Punset es reflexiva, accesible y profundamente analítica, combinando ciencia y filosofía para explorar temas complejos de manera comprensible.

---

## 🎨 Visual synthesis

- hue_primary: 60
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_moderno
- Resultado: paper=#D3D3CF, accent=#D6D61F, ink=#1C1C17, contraste=11.39:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects the themes and concepts presented in the ground truth of 'Viaje a las emociones' by Eduardo Punset. It discusses the journey of happiness through emotions, which aligns with the book's exploration of happiness, love, and the mind as central themes. Phrases like 'la búsqueda de la felicidad' and 'la mente es el poder' are explicitly connected to the book's内容,

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The generated content reflects specific themes from the ground truth, such as the pursuit of happiness and the role of emotions in shaping our experiences. Phrases like 'Happiness is a journey shaped by our emotions' and 'Exploring our emotions is essential to understanding how they impact our pursuit of happiness' directly relate to the book's focus on happiness and emotions. However, the content

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de preguntas directas y tono reflexivo propio del texto.
- EN: pagina — Uso de voz directa y preguntas reflexivas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.89 ← anti-genericidad de anchors
- **grounding_judge:** 0.85 ← promedio de los 2 judges
- **Combined:** **0.9**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9220
- Tiempo total: 22.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2736ms
- anchors: 2335 tokens, 4940ms
- palette: 0 tokens, 0ms
- content_es: 2497 tokens, 5209ms
- judge_es: 854 tokens, 2113ms
- content_en: 1924 tokens, 5306ms
- judge_en: 820 tokens, 1470ms
- voice: 790 tokens, 1039ms
