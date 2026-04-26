# Quality Report — Liderazgo Consciente y Acción Transformadora

**Autor:** DORALY. MAYORGA, Jose Manuel Vega Baez
**Ejecutado:** 2026-04-26T13-44-55
**Pipeline:** nucleus-canonical-v3.6

---

## 🌐 Grounding

- **Source:** `identity_sealed_with_evidence`
- **Tier reached:** 1.5
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_preloaded
- **Match score:** 1.00



### Ground truth utilizado
```
LIBRO SELECCIONADO POR EL CURADOR AUTOMÁTICO:
Título: Liderazgo Consciente y Acción Transformadora
Autor: DORALY. MAYORGA, Jose Manuel Vega Baez

SINOPSIS OFICIAL (Google Books):

Este libro es una invitación a recorrer un camino hacia un liderazgo que transforma vidas. A través de conceptos claros, herramientas aplicables y casos prácticos, exploraremos cómo la expansión de la consciencia en el liderazgo puede abrir nuevas posibilidades. Te acompañaremos en un viaje personal y profesional que te permitirá profundizar en tu autoconocimiento, fortalecer tus relaciones y desarrollar un liderazgo que inspire y motive de manera genuina, con lo que descubrirás que el liderazgo consciente no solo transforma empresas, sino que impacta profundamente a cada persona que se cruza en tu camino. ¡Ánimo...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- expansión de la consciencia en el liderazgo
- autoconocimiento como base del liderazgo efectivo
- fortalecimiento de relaciones interpersonales
- liderazgo que inspira y motiva genuinamente
- impacto del liderazgo consciente en la vida personal y profesional

**Key terms:** liderazgo consciente, transformación, autoconocimiento, relaciones interpersonales, acción transformadora

**Voz autorial:** La voz del autor es motivadora y práctica, centrada en el desarrollo personal y profesional a través de un liderazgo consciente, utilizando un lenguaje accesible y directo.

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
- Razón: The generated content directly reflects key concepts from the book, such as 'expansión de la consciencia', 'autoconocimiento', and the transformative nature of conscious leadership. It uses specific phrases and ideas that align closely with the book's themes, making it highly relevant and anchored to the ground truth.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content closely aligns with the book's themes of self-awareness and conscious leadership. Phrases like 'expansion of consciousness' and 'self-awareness as the cornerstone' directly reflect the book's focus on personal growth and transformative leadership. However, some phrases are slightly generic, which prevents a perfect score.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en el liderazgo personal.
- EN: pagina — Voz directa y reflexiones sobre liderazgo sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9202
- Tiempo total: 24.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2ms
- anchors: 2326 tokens, 8601ms
- palette: 0 tokens, 1ms
- content_es: 2491 tokens, 5030ms
- judge_es: 829 tokens, 1832ms
- content_en: 1922 tokens, 5895ms
- judge_en: 810 tokens, 1667ms
- voice: 824 tokens, 890ms
