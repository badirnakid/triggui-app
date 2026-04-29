# Quality Report — Supercomunicadores

**Autor:** Charles Duhigg
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

¿Qué hace que una conversación funcione? Todos podemos aprender a ser supercomunicadores en la vida y en el trabajo. Por el autor del best seller El poder de los hábitos. La comunicación es un superpoder que puede ser entrenado y los mejores comunicadores saben distinguir y emplear los tres tipos de conversaciones que existen -la práctica, la emocional y la social- para conectar con las personas. En este libro aprenderás por qué hay gente capaz de hacerse oír y de escuchar a los demás con tanta claridad. Y podrás ser uno de ellos. Charles Duhigg combina una exhaustiva investigación con su pericia narrativa y nos muestra las habilidades que necesitamos para navegar las conversaciones con más éxito. El autor nos lleva a los reclutamientos de la CIA, a los deb...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- los tres tipos de conversaciones: práctica, emocional y social
- conectar con las personas a través de la comunicación
- habilidades necesarias para navegar conversaciones con éxito
- ejemplos de comunicación en contextos como la CIA y Netflix
- herramientas para mejorar la escucha y la claridad en la comunicación

**Key terms:** supercomunicadores, conversaciones, conexión, habilidades comunicativas, narrativa

**Voz autorial:** La voz de Duhigg es analítica y accesible, combinando investigación exhaustiva con anécdotas y ejemplos prácticos que hacen que las teorías sobre comunicación sean aplicables y fáciles de entender.

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
- Razón: The content specifically references the three types of conversations (práctica, emocional, social) mentioned in the ground truth, demonstrating a clear understanding of the book's core concepts. Additionally, it emphasizes skills like active listening and clarity, which are central to Duhigg's teachings. This makes the content highly relevant and anchored to the book.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content specifically references the three types of conversations (practical, emotional, social) mentioned in the ground truth, demonstrating a clear connection to the book's themes. It also emphasizes the importance of mastering communication skills, aligning well with the book's focus on becoming a supercommunicator.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en habilidades comunicativas sin referencias externas.
- EN: pagina — Voz directa y enfoque en habilidades de comunicación.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.92 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9752
- Tiempo total: 41.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 16820ms
- anchors: 2431 tokens, 6964ms
- palette: 0 tokens, 0ms
- content_es: 2599 tokens, 6969ms
- judge_es: 947 tokens, 2813ms
- content_en: 2038 tokens, 4751ms
- judge_en: 921 tokens, 1882ms
- voice: 816 tokens, 1127ms
- highlight_judge_es_parrafoTop: 649 tokens, 0ms
- highlight_judge_es_parrafoBot: 649 tokens, 0ms
- highlight_judge_en_parrafoTop: 637 tokens, 0ms
- highlight_judge_en_parrafoBot: 639 tokens, 0ms
