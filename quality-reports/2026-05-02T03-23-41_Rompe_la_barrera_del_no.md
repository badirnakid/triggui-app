# Quality Report — Rompe la barrera del no

**Autor:** Chris Voss
**Ejecutado:** 2026-05-02T03-23-41
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_1sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

El prestigioso ex negociador internacional del FBI Chris Voss, especializado en secuestros con rehenes, nos enseña un método de negociación rompedor: tácticas para negociaciones duras que son aplicables en múltiples aspectos de nuestras vidas. Rompe la barrera del no es un manual de negociación imprescindible desarrollado y perfeccionado a lo largo de la extraordinaria carrera de Chris Voss como negociador en secuestros con rehenes y como reconocido profesor en las escuelas de negocio más prestigiosas del mundo. Voss ha puesto a prueba estas técnicas en todo tipo de situaciones y ha comprobado su efectividad, tanto en los inicios de su carrera cuando patrullaba las peligrosas calles de Kansas City como en los cursos que imparte en las mejores universidades....
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- técnicas de negociación aplicables en la vida cotidiana
- importancia de la inteligencia emocional en negociaciones
- estrategias de negociación en situaciones críticas
- método de negociación basado en experiencias reales
- tácticas para superar el rechazo y conseguir acuerdos

**Key terms:** negociación, inteligencia emocional, tácticas de negociación, acuerdos, estrategias

**Voz autorial:** La voz de Chris Voss es práctica, directa y basada en experiencias reales, lo que proporciona un enfoque auténtico y aplicable a la negociación.

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
- Score: 0.80
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The content reflects specific concepts from the book, such as 'inteligencia emocional' and 'tácticas de negociación', which are central to Chris Voss's teachings. However, some phrases are somewhat generic and could apply to broader negotiation contexts, slightly reducing the score.

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects key themes from the book, such as emotional intelligence and negotiation techniques, which are central to Chris Voss's teachings. However, it lacks specific references to Voss's unique experiences or examples from the book, making it somewhat generic in its application.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Tono directo y consejos prácticos sin referencias externas.
- EN: pagina — Tono directo y enfoque en técnicas del libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.92 ← anti-genericidad de anchors
- **grounding_judge:** 0.75 ← promedio de los 2 judges
- **Combined:** **0.88**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10827
- Tiempo total: 40.2s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 17017ms
- anchors: 2757 tokens, 6257ms
- palette: 0 tokens, 0ms
- content_es: 2776 tokens, 6218ms
- judge_es: 1127 tokens, 1636ms
- content_en: 2229 tokens, 5713ms
- judge_en: 1141 tokens, 2279ms
- voice: 797 tokens, 724ms
- highlight_judge_es_parrafoTop: 643 tokens, 0ms
- highlight_judge_es_parrafoBot: 642 tokens, 0ms
- highlight_judge_es_parrafoBot_retry: 650 tokens, 0ms
- highlight_judge_en_parrafoTop: 643 tokens, 0ms
- highlight_judge_en_parrafoBot: 634 tokens, 0ms
