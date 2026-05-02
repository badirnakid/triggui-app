# Quality Report — Viaje al optimismo

**Autor:** Eduardo Punset
**Ejecutado:** 2026-05-02T11-51-32
**Pipeline:** nucleus-canonical-v3.7.1

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

Nos sobran razones para pensar en un futuro mejor. «El pasado fue siempre peor, y no hay duda de que el futuro será mejor.» Ese mensaje orienta el Viaje al optimismo al que nos invita Eduardo Punset. Los constantes avances científicos, que recorreremos con el autor, justifican abordar con entusiasmo el futuro. En este viaje, Punset desmiente que la crisis sea planetaria, proclama la obligada redistribución del trabajo mientras la esperanza de vida aumenta dos años y medio cada década, y recuerda que ya no es posible vivir sin las redes sociales. Hoy, afirma, «la manada reclama el liderazgo de los jóvenes», es más necesario que nunca «aprender a desaprender» y debemos asumir que la gestión de las emociones es una prioridad inexcusable.

METADATA VERIFICADA:
...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- el pasado siempre fue peor
- el futuro será mejor
- redistribución del trabajo
- esperanza de vida en aumento
- gestión de las emociones

**Key terms:** optimismo, ciencia, redes sociales, liderazgo juvenil, aprender a desaprender

**Voz autorial:** La voz de Eduardo Punset es reflexiva y esperanzadora, combinando análisis científico con un enfoque positivo hacia el futuro.

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
- Razón: The generated content directly reflects key concepts from the ground truth, such as the idea that 'the past was always worse' and the importance of 'learning to unlearn.' It also emphasizes the need for 'redistribution of work' and managing emotions, which are central themes in Eduardo Punset's 'Viaje al optimismo.' The phrases used are specific and relevant to the book's message, making it well-­

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes and concepts from 'Viaje al optimismo' by Eduardo Punset. It directly references the idea that the past was worse and emphasizes optimism for the future, aligning with Punset's message about scientific advancements and the importance of adapting to change. Phrases like 'redistributing work' and 'learning to unlearn' are specific to the book's core.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre el futuro sin referencias externas.
- EN: pagina — Voz directa y reflexiones sobre el futuro sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 2 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9126
- Tiempo total: 36.1s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2007ms
- anchors: 2325 tokens, 8869ms
- palette: 0 tokens, 0ms
- content_es: 2434 tokens, 13793ms
- judge_es: 843 tokens, 1938ms
- content_en: 1879 tokens, 4086ms
- judge_en: 829 tokens, 3996ms
- voice: 816 tokens, 1002ms
- highlight_judge_es_parrafoTop: 639 tokens, 0ms
- highlight_judge_es_parrafoBot: 647 tokens, 0ms
- highlight_judge_es_parrafoBot_retry: 653 tokens, 0ms
- highlight_judge_en_parrafoTop: 640 tokens, 0ms
- highlight_judge_en_parrafoBot: 645 tokens, 0ms
- highlight_judge_en_parrafoBot_retry: 641 tokens, 0ms
