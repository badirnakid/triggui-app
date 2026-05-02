# Quality Report — Adaptarse a la marea

**Autor:** Eduardo Punset
**Ejecutado:** 2026-05-02T11-51-32
**Pipeline:** nucleus-canonical-v3.7.1

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

Las teorías de Darwin aplicadas&#xa0;a la supervivencia cotidiana. En Adaptarse a la marea, Eduardo Punset traslada las enseñanzas de la física, la biología y la psicología evolutiva a los retos del día a día, y las convierte en la fórmula para triunfar en nuestra vida cotidiana. Así, nos recuerda que la mayor parte de la realidad es invisible, que las emociones están en el origen de todas las conductas y proyectos, que el cerebro no fue diseñado para descubrir la verdad sino para sobrevivir y que la inteligencia surge de la integración con otros, tanto o más que del proceso cognitivo. Todo ello con el objetivo de convertirnos en personas más conscientes de lo que somos y de lo que sentimos, y con más éxito en todos los ámbitos de la vida.

METADATA VERIFIC...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- las teorías de Darwin aplicadas a la supervivencia cotidiana
- la realidad invisible y las emociones como base de conductas
- la inteligencia como resultado de la integración social
- la búsqueda de la conciencia personal y emocional
- el cerebro diseñado para sobrevivir en lugar de descubrir la verdad

**Key terms:** supervivencia, emociones, inteligencia, integración, conciencia

**Voz autorial:** La voz de Eduardo Punset en este libro es reflexiva y accesible, combinando conceptos científicos con aplicaciones prácticas en la vida cotidiana.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#CFD2D3, accent=#1F99D6, ink=#171A1C, contraste=11.50:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects key concepts from the book, such as the importance of social integration for intelligence and the role of emotions in behavior. Phrases like 'la inteligencia no es un atributo aislado' and 'la supervivencia diaria se basa en la adaptación constante' are closely aligned with the themes presented in 'Adaptarse a la marea', making it highly specific to the book

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects the book's themes of intelligence through social integration and emotional connections, aligning closely with Punset's ideas about survival and success in daily life.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre la inteligencia en la convivencia.
- EN: pagina — Voz directa y reflexiones sobre la inteligencia en interacción.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.96**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9106
- Tiempo total: 21.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2126ms
- anchors: 2385 tokens, 5622ms
- palette: 0 tokens, 0ms
- content_es: 2457 tokens, 5995ms
- judge_es: 827 tokens, 2004ms
- content_en: 1880 tokens, 3352ms
- judge_en: 771 tokens, 1489ms
- voice: 786 tokens, 824ms
- highlight_judge_es_parrafoTop: 652 tokens, 0ms
- highlight_judge_es_parrafoBot: 648 tokens, 0ms
- highlight_judge_en_parrafoTop: 651 tokens, 0ms
- highlight_judge_en_parrafoBot: 633 tokens, 0ms
