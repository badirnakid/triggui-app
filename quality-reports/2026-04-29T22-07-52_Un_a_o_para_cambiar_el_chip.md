# Quality Report — Un año para cambiar el chip

**Autor:** Napoleon Hill
**Ejecutado:** 2026-04-29T22-07-52
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_1sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

¿Quién te dijo que no eras apto para lograr tus metas? ¿Y qué grandes triunfos ha obtenido el que se atreve a cuestionar tus habilidades? Recuerda que recibir sabios consejos es definitivo cada vez que decides encaminarte hacia nuevos horizontes. Asegúrate de rodearte de la gente adecuada y de las herramientas apropiadas que te animen a avanzar hacia la búsqueda y cumplimiento de tus propósitos e ideales. Desecha los destructores de sueños y enfócate en todo lo que te ayude a construir un futuro sólido. Si bien es cierto que el camino hacia el cumplimiento de tus metas comienza ahora, tienes a tu disposición Un año para cambiar el chip: 52 claves para retomar tus sueños y consolidarlos. En esta ocasión el pionero del pensamiento positivo pone a tu disposici...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- identificar y aprovechar las oportunidades de éxito
- beneficiarse de todo fracaso y derrota
- desarrollar autodisciplina
- buscar siempre el lado positivo de cada circunstancia
- capitalizar las experiencias para aprender a pensar con sabiduría

**Key terms:** pensamiento positivo, autodisciplina, oportunidades de éxito, iniciativa, capitalizar experiencias

**Voz autorial:** Estilo claro y dinámico, motivador y práctico, enfocado en la superación personal y en la acción semanal.

---

## 🎨 Visual synthesis

- hue_primary: 45
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#D3D3CF, accent=#E2D112, ink=#1C1B17, contraste=11.48:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly references key concepts from the book's ground truth, such as identifying opportunities, learning from failure, and the importance of self-discipline. Phrases like 'cada fracaso es una lección' and 'la autodisciplina es tu aliada' are explicitly aligned with the book's themes, making it highly specific and relevant.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content reflects key concepts from the ground truth, such as identifying opportunities and learning from failure, which are central themes in 'Un año para cambiar el chip.' It emphasizes self-discipline and the positive mindset necessary for success, aligning closely with the book's messages. However, while it is specific, some phrases are somewhat generic and could apply to other, a



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y motivacional, sin referencias externas.
- EN: pagina — Voz directa y motivacional, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.93**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10327
- Tiempo total: 40.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 17147ms
- anchors: 2524 tokens, 6084ms
- palette: 0 tokens, 0ms
- content_es: 2690 tokens, 6067ms
- judge_es: 1062 tokens, 2314ms
- content_en: 2149 tokens, 5872ms
- judge_en: 1054 tokens, 1936ms
- voice: 848 tokens, 861ms
- highlight_judge_es_parrafoTop: 643 tokens, 0ms
- highlight_judge_es_parrafoBot: 655 tokens, 0ms
- highlight_judge_en_parrafoTop: 632 tokens, 0ms
- highlight_judge_en_parrafoBot: 631 tokens, 0ms
