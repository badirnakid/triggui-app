# Quality Report — Conecta con la motivación

**Autor:** Brian Tracy
**Ejecutado:** 2026-04-26T19-46-39
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

Este libro muestra que la idea típica de la motivación como algo que va y viene es completamente inexacta.En su lugar existe un conjunto de leyes que aquí se explican a detalle y que conforman su ciencia. Y, si aplicas la ciencia de la motivación sistemáticamente en tu vida, tus sueños se convertirán en tu destino. La mayoría de las personas afirma que quiere ser exitosa y feliz. Sin embargo, son pocos los capaces de sostener esfuerzos prolongados para lograr sus metas. El problema central radica en mantener la motivación sin importar cuántas dificultades surjan en el camino. Brian Tracy, experto mundial en desarrollopersonal, nos muestra cómo salvar la brecha entre lo que decimos que queremos y lo que debemos hacer para lograrlo, que a menudo requiere retr...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- la ciencia de la motivación
- salvar la brecha entre deseos y acciones
- retrasar la gratificación temporal
- esfuerzos prolongados para lograr metas
- estrategias para mantener la motivación

**Key terms:** motivación, éxito, felicidad, gratificación, esfuerzo prolongado

**Voz autorial:** La voz de Brian Tracy es pragmática y directa, enfocándose en la aplicación práctica de conceptos psicológicos para el desarrollo personal.

---

## 🎨 Visual synthesis

- hue_primary: 65
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#D3D3CF, accent=#C7D61F, ink=#1B1C17, contraste=11.42:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: El contenido generado refleja de manera precisa conceptos clave del libro, como la idea de que la motivación es una ciencia y la importancia de mantener esfuerzos prolongados para alcanzar metas, lo cual está directamente relacionado con la sinopsis oficial.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the book's themes, specifically discussing motivation as a science and the importance of delaying gratification to achieve long-term goals. It uses specific concepts from the ground truth, such as bridging the gap between desires and actions, which are central to Brian Tracy's arguments.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en la aplicación de la motivación.
- EN: pagina — El texto presenta conceptos directamente relacionados con la obra sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.86 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.94**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9242
- Tiempo total: 25.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 4150ms
- anchors: 2376 tokens, 5856ms
- palette: 0 tokens, 0ms
- content_es: 2480 tokens, 6843ms
- judge_es: 840 tokens, 1454ms
- content_en: 1906 tokens, 4751ms
- judge_en: 821 tokens, 1756ms
- voice: 819 tokens, 977ms
- highlight_judge_es_parrafoTop: 640 tokens, 0ms
- highlight_judge_es_parrafoBot: 651 tokens, 0ms
- highlight_judge_en_parrafoTop: 640 tokens, 0ms
- highlight_judge_en_parrafoBot: 647 tokens, 0ms
