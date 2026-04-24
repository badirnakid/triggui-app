# Quality Report — Todo el tiempo del mundo

**Autor:** Lisa Broderick
**Ejecutado:** 2026-04-24T03-08-01
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
- liberación activa del tiempo
- creación de la propia experiencia
- dejar de ser esclavos del tiempo

**Key terms:** energía, metafísica, tiempo no lineal, creadores de experiencia, física cuántica

**Voz autorial:** La voz de Lisa Broderick es accesible y reflexiva, combinando conceptos científicos con un enfoque práctico para la autoayuda.

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
- Razón: The generated content directly reflects the key concepts from the ground truth, such as the idea of time as a 'malleable energy' and the notion of breaking free from the constraints of linear time. Phrases like 'liberación activa del tiempo' and 'transformar nuestra relación con él' are specific to the themes discussed in the book, making it clear that the content is anchored to the book's core.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the core concepts presented in the ground truth, specifically the idea of time as a malleable energy and its non-linear nature. Phrases like 'Time is not merely a limited resource; it is a malleable energy we can manipulate' and 'understanding its non-linear nature' directly echo the themes discussed in the book. Additionally, the focus on transforming one's 

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre el tiempo sin referencias externas.
- EN: pagina — Voz directa y reflexiones sobre el tiempo sin referencias externas.

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
- Tokens totales: 9890
- Tiempo total: 65.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41933ms
- anchors: 2456 tokens, 4421ms
- palette: 0 tokens, 0ms
- content_es: 2613 tokens, 6219ms
- judge_es: 986 tokens, 4134ms
- content_en: 2055 tokens, 4884ms
- judge_en: 953 tokens, 3089ms
- voice: 827 tokens, 938ms
