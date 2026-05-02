# Quality Report — Viaje a las emociones

**Autor:** Eduardo Punset
**Ejecutado:** 2026-05-02T03-23-41
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

La trilogía que ha apasionado a más de medio millón de lectores, en un solo volumen. El viaje que propone Eduardo Punset es el más fascinante de cuantos podamos emprender. Empieza con la búsqueda de la felicidad, una aventura de final incierto a través de todo aquello que nos puede conducir (o apartar) del objetivo, esto es: las emociones, el estrés, los fl ujos hormonales, el envejecimiento, los factores sociales, económicos, culturales, religiosos… Explora acto seguido los fundamentos del amor, el más primordial de los instintos, sus canales de expresión y el secreto de su fórmula; y culmina en lo más íntimo del ser humano, lo que ocurre en el interior de cada uno, y el final de todo viaje: la mente, que es, a la postre, «el único poder». Un recorrido por...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- la búsqueda de la felicidad como aventura
- los fundamentos del amor y su expresión
- el poder de la mente como fuerza última
- la influencia de emociones y estrés en nuestra vida
- los factores sociales y culturales que afectan nuestras emociones

**Key terms:** felicidad, amor, poder, emociones, estrés

**Voz autorial:** La voz de Eduardo Punset es reflexiva y accesible, combinando ciencia y humanismo para explorar temas complejos de manera comprensible y atractiva.

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
- Razón: The generated content directly reflects key themes from the book, such as the journey of happiness, the influence of emotions, and the significance of the mind as power. Phrases like 'la búsqueda de la felicidad' and 'las emociones son el hilo conductor de nuestra existencia' are explicitly tied to the book's exploration of happiness and emotions.

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects key themes from the book, such as the pursuit of happiness and the influence of emotions, which are central to Eduardo Punset's work. Phrases like 'emotional landscapes' and 'understanding is the true power of the mind' connect directly to the book's exploration of emotions and the mind. However, the language is somewhat generic and could be adapted to other self-help contexts



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y tono coherente con la obra.
- EN: pagina — Voz directa y tono coherente con la obra.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.86 ← anti-genericidad de anchors
- **grounding_judge:** 0.85 ← promedio de los 2 judges
- **Combined:** **0.9**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 2 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9294
- Tiempo total: 42.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 17633ms
- anchors: 2325 tokens, 6312ms
- palette: 0 tokens, 0ms
- content_es: 2499 tokens, 6337ms
- judge_es: 864 tokens, 1744ms
- content_en: 1934 tokens, 6173ms
- judge_en: 859 tokens, 2953ms
- voice: 813 tokens, 1021ms
- highlight_judge_es_parrafoTop: 637 tokens, 0ms
- highlight_judge_es_parrafoBot: 652 tokens, 0ms
- highlight_judge_es_parrafoBot_retry: 651 tokens, 0ms
- highlight_judge_en_parrafoTop: 640 tokens, 0ms
- highlight_judge_en_parrafoBot: 643 tokens, 0ms
- highlight_judge_en_parrafoBot_retry: 651 tokens, 0ms
