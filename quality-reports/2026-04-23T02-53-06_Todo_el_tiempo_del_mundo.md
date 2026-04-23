# Quality Report — Todo el tiempo del mundo

**Autor:** Lisa Broderick
**Ejecutado:** 2026-04-23T02-53-06
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

Nos pasamos el día corriendo, dándonos prisa, abrumados… nos faltan horas incluso para dormir. El tiempo es algo de lo que no podemos escapar, y también es un concepto que aún no comprendemos del todo. En lo único en lo que casi todos nos ponemos de acuerdo es en que tenemos muy poco. Hoy en día la idea de que el tiempo no es algo lineal, ni una fuerza inamovible, empieza a ser más conocida. Pero las implicaciones que esto tiene en nuestro día a día todavía se nos escapan y parecen accesibles solo a ciertos teóricos de la física cuántica con muchos doctorados a sus espaldas. En este libro (con prólogo del renombrado maestro espiritual Don Miguel Ruiz) Lisa Broderick examina la ciencia y la metafísica de la construcción humana del tiempo. Lisa Broderick nos ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- el tiempo como energía maleable
- manipulación del tiempo
- recursos abundantes de tiempo
- creación de experiencias personales
- liberación del tiempo

**Key terms:** energía maleable, metafísica del tiempo, física cuántica, creadores de experiencias, técnicas de gestión del tiempo

**Voz autorial:** La voz de Lisa Broderick es reflexiva y motivadora, combinando conceptos científicos con prácticas de autoayuda para empoderar al lector en su relación con el tiempo.

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
- Razón: The generated content directly reflects the core concepts of the book, such as the idea of time as a malleable energy and the notion of manipulating time to create desired experiences. Phrases like 'el tiempo como energía maleable' and 'liberar el tiempo' are explicitly aligned with the book's themes, demonstrating a strong connection to the ground truth.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects the core concepts of the book, particularly the idea of time as a malleable energy and the ability to manipulate it for personal benefit. Phrases like 'Time is not a chain; it is a malleable force' and 'Manipulating time becomes a daily practice' echo the book's themes of time's fluidity and the empowerment of individuals to shape their experiences. This is,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre el tiempo sin referencias externas.
- EN: pagina — Voz directa y enfoque en la experiencia personal.

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
- Tokens totales: 9994
- Tiempo total: 67.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 42373ms
- anchors: 2464 tokens, 5753ms
- palette: 0 tokens, 0ms
- content_es: 2630 tokens, 7470ms
- judge_es: 990 tokens, 2066ms
- content_en: 2089 tokens, 6250ms
- judge_en: 967 tokens, 2576ms
- voice: 854 tokens, 961ms
