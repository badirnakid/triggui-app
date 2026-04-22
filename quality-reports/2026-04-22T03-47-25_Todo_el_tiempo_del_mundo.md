# Quality Report — Todo el tiempo del mundo

**Autor:** Lisa Broderick
**Ejecutado:** 2026-04-22T03-47-25
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
- dejar de ser esclavos del tiempo

**Key terms:** energía maleable, metafísica del tiempo, creadores de experiencias, técnicas de gestión del tiempo, física cuántica

**Voz autorial:** La voz de Lisa Broderick es accesible y fascinante, combinando ciencia y espiritualidad para empoderar al lector en su comprensión del tiempo.

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
- Razón: The generated content directly reflects the core concepts of the book, such as the idea of time being a malleable energy and the notion of individuals as creators of their own experiences. Phrases like 'el tiempo se convierte en un recurso abundante' and 'dejar de ser esclavos del tiempo' are explicitly aligned with the book's themes, demonstrating a strong connection to the ground truth.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects the core concepts of the book, such as the idea of time as a malleable energy and the notion of transforming one's relationship with time. Phrases like 'Time is a malleable energy that we can shape as we wish' and 'By understanding its nature, a new horizon of possibilities unfolds' are explicitly aligned with the book's themes. This specificity indicates a 

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la experiencia del lector.
- EN: pagina — Voz directa y enfoque en la experiencia personal con el tiempo.

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
- Tokens totales: 9875
- Tiempo total: 61.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40750ms
- anchors: 2456 tokens, 4494ms
- palette: 0 tokens, 0ms
- content_es: 2612 tokens, 5256ms
- judge_es: 970 tokens, 1734ms
- content_en: 2060 tokens, 5389ms
- judge_en: 954 tokens, 2517ms
- voice: 823 tokens, 830ms
