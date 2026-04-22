# Quality Report — El valor del silencio

**Autor:** Justin Zorn, Leigh Marz
**Ejecutado:** 2026-04-22T14-41-30
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `google_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.94
- **Resolution path:** evidence_fetched_3sources
- **Match score:** 0.96



### Ground truth utilizado
```
SINOPSIS OFICIAL (Google Books):

El silencio es un poder secreto que nos centra, nos sana y nos enseña. Dos especialistas en bienestar del más alto nivel nos desvelan los beneficios del silencio en un mundo más ruidoso que nunca. La proliferación del ruido no se refiere solamente al sentido auditivo y literal, sino también a las pantallas yal ruido de la información, que consume nuestra atención. Si bien el mindfulness nos puede ayudar a frenar los prejuicios del ruido constante, los estudios señalan que no todo el mundo es capaz de meditar con regularidad. Necesitamos nuevas maneras de encontrar claridad y renovación. Recurriendo a la ciencia, la psicología, la filosofía y la espiritualidad, Justin Zorn y Leigh Marz nos demuestran el poder del silencio inmersivo, un tipo de silencio más ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- el poder del silencio inmersivo
- beneficios del silencio en un mundo ruidoso
- nuevas maneras de encontrar claridad y renovación
- propuestas prácticas para eliminar el ruido
- impacto del ruido de la información en nuestra atención

**Key terms:** silencio inmersivo, mindfulness, ruido constante, avalancha sensorial, claridad

**Voz autorial:** La voz autorial es reflexiva y práctica, combinando ciencia, psicología, filosofía y espiritualidad para abordar el tema del silencio y su importancia en la vida moderna.

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
- Razón: The generated content directly references key concepts from the ground truth, such as 'silencio inmersivo' and the need to find 'claridad y renovación' in a noisy world. It also emphasizes the importance of silence as a means to eliminate distractions and cultivate a deeper connection with oneself, which aligns closely with the book's themes. The phrases used are specific to the book's focus on 'p

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects the themes and concepts presented in the ground truth, specifically focusing on the benefits of silence in a noisy world, the idea of immersive silence, and the need for mental clarity and renewal. Phrases like 'immersive silence' and 'sensory avalanche' are specific to the book's content, demonstrating a strong connection to the authors' arguments.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas retóricas sin referencias externas.
- EN: pagina — Tono directo y reflexivo, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.94 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.88 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.94**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9715
- Tiempo total: 50.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 24697ms
- anchors: 2561 tokens, 6842ms
- palette: 0 tokens, 1ms
- content_es: 2560 tokens, 7282ms
- judge_es: 923 tokens, 2370ms
- content_en: 1986 tokens, 5339ms
- judge_en: 869 tokens, 2734ms
- voice: 816 tokens, 1406ms
