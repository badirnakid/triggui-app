# Quality Report — El camino de la fuerza mental

**Autor:** Jodie Lowinger
**Ejecutado:** 2026-04-21T02-16-30
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

¿Qué pasaría si pudieras convertir la ansiedad en un superpoder? ¿Y si la clave para caminar hacia tus objetivos fuera aprender a hacer las paces con ella? Es común que pensemos la ansiedad como si fuera el villano de la película. Un provocador mental que nos llena de preocupaciones, estrés y miedos, que se apodera de nosotros en un abrir y cerrar de ojos. Pero a pesar de lo paralizante que puede ser, es posible cambiar nuestra relación con ella. El camino de la fuerza mental presenta un método basado en años de investigación y práctica clínica, con herramientas para dominar y entender a ese provocador que vive en tu cabeza. Te ayudará a comprender que tras la ansiedad existe un corazón emotivo. Una mente fuerte y analítica que solo necesita despejar la mal...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- convertir la ansiedad en un superpoder
- hacer las paces con la ansiedad
- dominar el provocador mental
- comprender el corazón emotivo detrás de la ansiedad
- despejar la maleza del camino hacia la paz

**Key terms:** fuerza mental, ansiedad, provocador mental, herramientas de empoderamiento, relación con la ansiedad

**Voz autorial:** La voz es empática y motivacional, enfocándose en la transformación personal y el empoderamiento a través de la comprensión de la ansiedad.

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
- Razón: The generated content directly reflects the key concepts from the ground truth, such as transforming anxiety into a superpower, understanding its nature, and the importance of mental strength. Phrases like 'despejar la maleza' and 'corazón emotivo' are specific to the book's themes and are not generic, making the content highly relevant and anchored to the book.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes and concepts from the ground truth of 'El camino de la fuerza mental'. It specifically addresses anxiety as a mental provocateur, emphasizes the importance of making peace with it, and discusses the transformation of anxiety into strength, all of which are central ideas in the book. The phrases used are directly aligned with the book's message, and

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre la ansiedad sin referencias externas.
- EN: pagina — Voz directa y enfoque en el proceso personal.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9278
- Tiempo total: 65.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41515ms
- anchors: 2331 tokens, 5938ms
- palette: 0 tokens, 0ms
- content_es: 2505 tokens, 6699ms
- judge_es: 857 tokens, 1992ms
- content_en: 1941 tokens, 5256ms
- judge_en: 818 tokens, 2522ms
- voice: 826 tokens, 1090ms
