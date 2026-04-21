# Quality Report — Aprende a silenciar la mente

**Autor:** Osho
**Ejecutado:** 2026-04-21T02-16-30
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.94
- **Resolution path:** evidence_fetched_3sources
- **Match score:** 0.98



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

<p style="text-align:center">Un camino a la paz, la alegría y la creatividad.</b></p> "La meditación, para mí, tiene todo el espacio, toda la existencia, a su disposición. Tú eres el observador, puedes observar toda la escena. No existe el esfuerzo de concentrarse en algo, no existe el esfuerzo de contemplar algo. No estás haciendo ninguna de estas cosas, simplemente estás observando, siendo consiente. Es un truco. No es una ciencia, no es un arte, no es una habilidad; es un truco". Desde siempre la humanidad se ha enajenado con hacer en lugar de ser. Vivimos en un mundo donde pocas veces nos detenemos a contemplar nuestro entorno y esto ha ocasionado que nuestra mente divague en múltiples problemas sin darnos la oportunidad de descubrir cuál es la finalida...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la meditación como observación consciente
- la importancia de ser en lugar de hacer
- el truco de la meditación sin esfuerzo
- la conexión entre paz interior y creatividad
- la finalidad de la existencia a través de la contemplación

**Key terms:** meditación, observador, consciencia, bienestar, enajenación, finalidad

**Voz autorial:** La voz de Osho es reflexiva y provocativa, invitando al lector a cuestionar sus creencias y a explorar la meditación como un camino hacia la paz y la creatividad.

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
- Razón: The generated content closely reflects the themes and concepts presented in the ground truth, particularly the emphasis on meditation as a state of being rather than doing, and the importance of observation and contemplation. Phrases like 'la meditación no es un ejercicio, es la pureza del ser' and 'detenerse a contemplar es el primer paso hacia la paz interior' directly align with Osho's views on

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes presented in the ground truth, particularly the emphasis on meditation as a means of being and observation. Phrases like 'observing without attachments' and 'the essence of our existence' reflect Osho's ideas about meditation and consciousness. However, some phrases are slightly more generic and could apply to broader self-help contexts, which h

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre la meditación sin referencias externas.
- EN: pagina — Voz directa y reflexiones sobre la meditación sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.94 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.92 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- author_truncated: "Osho"

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9509
- Tiempo total: 63.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41109ms
- anchors: 2376 tokens, 5523ms
- palette: 0 tokens, 0ms
- content_es: 2556 tokens, 7534ms
- judge_es: 909 tokens, 1843ms
- content_en: 1983 tokens, 5177ms
- judge_en: 855 tokens, 1924ms
- voice: 830 tokens, 685ms
