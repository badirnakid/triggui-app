# Quality Report — Rejection Proof

**Autor:** Jia Jiang
**Ejecutado:** 2026-04-22T14-41-30
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

The inspiring, relatable, and sometimes outrageous true story&#xa0;of how&#xa0;one man used 100 days of&#xa0;rejection therapy to overcome fear and dare to live more boldly “Rejection Proof smashes fear in the face with a one-two punch. You’ll laugh out loud at Jia’s crazy social experiments, but you’ll also go away thinking differently about what you can accomplish.”—Chris Guillebeau, New York Times bestselling author of The Happiness Pursuit &#xa0; Jia Jiang’s TEDx Talk, “What I learned from 100 days of rejection,”&#xa0;has amassed over ten million views! Jia Jiang came to the United States with the dream of being the next Bill Gates. But despite early success in the corporate world, his first attempt to pursue his entrepreneurial dream ended in rejection...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- superar el miedo a la rechazo
- técnicas de terapia de exposición
- estrategias para convertir un 'no' en algo positivo
- la importancia de la perseverancia en las relaciones
- la búsqueda activa de la aceptación

**Key terms:** rejection therapy, exposure therapy, rejection experiment, successful requests, fearlessness

**Voz autorial:** La voz de Jia Jiang es inspiradora y humorística, combinando anécdotas personales con lecciones prácticas sobre el manejo del rechazo.

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
- Razón: The content reflects key themes from 'Rejection Proof,' such as overcoming fear of rejection and the idea that each 'no' can lead to a hidden opportunity. Phrases like 'convertir un 'no' en una respuesta positiva' and 'cada intento de convertir un 'no' en una respuesta positiva es una lección' directly relate to Jia Jiang's experiences and lessons learned during his 100 days of rejection. However,

### EN
- Score: 0.30
- Usa conceptos específicos: false
- Razón: The generated content discusses the theme of rejection and its potential as a stepping stone to success, which is a general concept found in many self-help books. However, it does not reference specific concepts or anecdotes from Jia Jiang's 'Rejection Proof,' such as the 100 days of rejection experiment or specific examples from the book. Therefore, while it relates to the overarching theme of 'f

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre el rechazo.
- EN: pagina — Voz directa y reflexiones personales sobre el rechazo.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.55 ← promedio de los 2 judges
- **Combined:** **0.83**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 11093
- Tiempo total: 67.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41047ms
- anchors: 2648 tokens, 5776ms
- palette: 0 tokens, 0ms
- content_es: 2857 tokens, 7624ms
- judge_es: 1239 tokens, 2375ms
- content_en: 2314 tokens, 5729ms
- judge_en: 1198 tokens, 2329ms
- voice: 837 tokens, 2926ms
