# Quality Report — Rejection Proof

**Autor:** Jia Jiang
**Ejecutado:** 2026-04-21T13-45-58
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
- superar el miedo al rechazo
- experimentos sociales audaces
- técnicas para convertir un 'no' en algo positivo
- estrategias de negociación efectivas
- aplicación de la terapia de rechazo en la vida diaria

**Key terms:** terapia de rechazo, exposición al rechazo, autoconfianza, negociación, resiliencia

**Voz autorial:** La voz de Jia Jiang es inspiradora y humorística, combinando anécdotas personales con lecciones prácticas que desafían al lector a enfrentarse a sus miedos.

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
- Razón: The content reflects specific concepts from the book, such as confronting fear of rejection and the idea of transforming 'no' into opportunities, which are central themes in Jia Jiang's journey. However, some phrases are somewhat generic and could apply to broader self-help contexts, slightly reducing the grounded score.

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects the themes of overcoming fear of rejection and the transformative power of facing rejection, which are central to Jia Jiang's 'Rejection Proof.' Phrases like 'practicing rejection therapy' and 'turn every refusal into an invaluable lesson' directly relate to the book's concepts. However, the language is somewhat generic and could apply to various self-help contexts, which is a

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre el rechazo.
- EN: pagina — Voz directa y reflexiones personales sobre el tema.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.75 ← promedio de los 2 judges
- **Combined:** **0.88**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 11077
- Tiempo total: 23.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2564ms
- anchors: 2653 tokens, 4892ms
- palette: 0 tokens, 0ms
- content_es: 2873 tokens, 5793ms
- judge_es: 1213 tokens, 2404ms
- content_en: 2317 tokens, 4273ms
- judge_en: 1200 tokens, 2064ms
- voice: 821 tokens, 992ms
