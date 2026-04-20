# Quality Report — Viaje a las emociones

**Autor:** Eduardo Punset
**Ejecutado:** 2026-04-20T22-04-21
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

La trilogía que ha apasionado a más de medio millón de lectores, en un solo volumen. El viaje que propone Eduardo Punset es el más fascinante de cuantos podamos emprender. Empieza con la búsqueda de la felicidad, una aventura de final incierto a través de todo aquello que nos puede conducir (o apartar) del objetivo, esto es: las emociones, el estrés, los fl ujos hormonales, el envejecimiento, los factores sociales, económicos, culturales, religiosos… Explora acto seguido los fundamentos del amor, el más primordial de los instintos, sus canales de expresión y el secreto de su fórmula; y culmina en lo más íntimo del ser humano, lo que ocurre en el interior de cada uno, y el final de todo viaje: la mente, que es, a la postre, «el único poder». Un recorrido por...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la búsqueda de la felicidad como aventura
- los fundamentos del amor y su expresión
- el poder de la mente como clave del ser humano
- influencia de las emociones en nuestras decisiones
- factores sociales y culturales que afectan nuestras vidas

**Key terms:** felicidad, amor, poder, emociones, mente

**Voz autorial:** La voz de Eduardo Punset es reflexiva y accesible, combinando ciencia con un enfoque humano y emocional, invitando al lector a explorar su interior y las dinámicas de la vida.

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
- Score: 0.80
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content closely aligns with the themes of happiness, emotions, and the mind as discussed in the ground truth. It specifically references the journey of understanding emotions and their impact on decisions, which are key concepts in the book. However, some phrases, while relevant, could be considered somewhat generic and applicable to broader contexts, slightly lowering the score.

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects specific themes from the book, such as the pursuit of happiness and the role of emotions, which are central to Eduardo Punset's exploration of happiness and love. However, while it does touch on these concepts, the language is somewhat generic and could apply to various self-help contexts, which prevents it from being fully anchored to the book's unique insights.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre la búsqueda de la felicidad.
- EN: pagina — Voz directa y reflexiones personales sobre emociones.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.88 ← anti-genericidad de anchors
- **grounding_judge:** 0.75 ← promedio de los 2 judges
- **Combined:** **0.87**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9226
- Tiempo total: 62.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41629ms
- anchors: 2343 tokens, 4580ms
- palette: 0 tokens, 0ms
- content_es: 2501 tokens, 6165ms
- judge_es: 857 tokens, 2596ms
- content_en: 1917 tokens, 5025ms
- judge_en: 812 tokens, 1843ms
- voice: 796 tokens, 786ms
