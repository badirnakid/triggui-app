# Quality Report — El mesias mistico

**Autor:** Allan Cohen
**Ejecutado:** 2026-05-04T13-39-45
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.93
- **Resolution path:** evidence_preloaded
- **Match score:** 0.96



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

Muchos sentimos una conexión intuitiva con el maestro Jesús y, sin embargo, hallamos que el modo en que se ha articulado quién fue y lo que enseñó crea una desconexión con nuestra alma. En este libro innovador, Alan Cohen nos ofrece un nuevo marco de interpretación en el que desmantela los esquemas de pensamiento tradicionales. El autor hace comprensibles las enseñanzas de Jesús para nuestro mundo moderno.&#xa0; A través de su inspiración, el Maestro se dirige directa y personalmente a cada uno de nosotros, hablando a nuestro crecimiento espiritual. El Mesías Místico demuestra que Jesús iluminó profundos principios psicológicos que cambian las vidas de quienes los aplican. Mientras parecemos estar batallando con entidades externas, en realidad estamos lidia...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- desmantelamiento de esquemas de pensamiento tradicionales
- interpretación moderna de las enseñanzas de Jesús
- principios psicológicos que transforman vidas
- dinámicas internas frente a entidades externas
- herramientas para el crecimiento personal y espiritual

**Key terms:** crecimiento espiritual, enseñanzas de Jesús, principios psicológicos, dinámicas internas, sanación profunda

**Voz autorial:** La voz de Allan Cohen es accesible y contemporánea, fusionando la espiritualidad con la psicología moderna, lo que permite una conexión directa y personal con el lector.

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
- Razón: El contenido generado refleja de manera precisa las enseñanzas de Jesús y el enfoque en la sanación interna, conceptos clave del libro. Utiliza términos como 'dinámicas internas' y 'transformación', que están directamente relacionados con la sinopsis del libro. Además, se enfoca en el crecimiento personal y espiritual, alineándose con el mensaje central de 'El Mesías Místico'.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content directly reflects the book's themes of inner transformation and healing through Jesus' teachings. It uses specific concepts like 'inner dynamics' and 'spiritual growth,' which are central to the book's premise.



---

## 🎭 Voice verdict

- Consolidated: **resena** (conf 0.90)
- ES: pagina — Voz directa y tono coherente con el contenido del libro.
- EN: resena — Habla del libro y sus enseñanzas desde una perspectiva externa.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.93 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.32 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.83**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9477
- Tiempo total: 32.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2ms
- anchors: 2393 tokens, 11084ms
- palette: 0 tokens, 1ms
- content_es: 2544 tokens, 4583ms
- judge_es: 892 tokens, 2804ms
- content_en: 1985 tokens, 9664ms
- judge_en: 845 tokens, 2141ms
- voice: 818 tokens, 2434ms
- highlight_judge_es_parrafoTop: 646 tokens, 0ms
- highlight_judge_es_parrafoBot: 645 tokens, 0ms
- highlight_judge_es_parrafoBot_retry: 652 tokens, 0ms
- highlight_judge_en_parrafoTop: 635 tokens, 0ms
- highlight_judge_en_parrafoBot: 645 tokens, 0ms
