# Quality Report — El poder de la integridad

**Autor:** Kelley Kosow
**Ejecutado:** 2026-04-21T13-31-01
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_4sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

¿Recuerdas la última vez que te prometiste decir lo que pensabas en una reunión de trabajo pero permaneciste sentado en silencio? ¿Cuántas veces has afirmado que, esta vez, la dieta iba en serio, pero te fallaste a ti mismo? ¿Reconoces la sensación de desconfiar de alguien para finalmente, y tras una mala experiencia, darte cuenta de que estabas en lo cierto?... Como afirma Kelley Kosow: &#34;Cada vez que te muerdes la lengua, ahogas tu integridad&#34;. Integridad no significa perfección. No es una estrategia sino una manera de vivir en consonancia con quien realmente somos. Todos tenemos heridas que representan las múltiples formas en las que nos hemos traicionado, mentido o despreciado a nosotros mismos. Hacemos caso omiso a nuestra voz interior y buscamo...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- vivir en consonancia con quien realmente somos
- enfrentarse al miedo y a la vergüenza
- transformar limitaciones en capacidades infinitas

**Key terms:** integridad, verdadera esencia, autenticidad, confianza, principios personales

**Voz autorial:** La voz de Kelley Kosow es reflexiva y empoderadora, fomentando la autoexploración y el crecimiento personal a través de la integridad.

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
- Razón: The generated content closely reflects the themes and concepts presented in the ground truth of 'El poder de la integridad'. Phrases like 'la integridad es la brújula que guía nuestras decisiones' and 'vivir en consonancia con quien realmente somos' directly echo the book's emphasis on integrity and authenticity. The content also addresses overcoming fear and shame, which are central to Kelley Kos

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes and concepts presented in the ground truth, particularly the emphasis on integrity, authenticity, and the journey towards living in alignment with one's true self. Phrases like 'Integrity serves as the compass' and 'face the fears and shame' directly relate to the core messages of Kelley Kosow's book, making it specific to this work rather than a c

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas retóricas sin referencias externas.
- EN: pagina — Voz directa y reflexiones personales sobre la autenticidad.

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
- Tokens totales: 9683
- Tiempo total: 24.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 4441ms
- anchors: 2529 tokens, 4906ms
- palette: 0 tokens, 1ms
- content_es: 2556 tokens, 5439ms
- judge_es: 940 tokens, 1534ms
- content_en: 1977 tokens, 4158ms
- judge_en: 914 tokens, 3441ms
- voice: 767 tokens, 718ms
