# Quality Report — Cómo sanar tu ansiedad cuando nadie más puede hacerlo

**Autor:** Amy B. Scher
**Ejecutado:** 2026-04-21T13-31-01
**Pipeline:** nucleus-canonical-v3

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

¡Vivir una vida relajada, alegre y saludable es posible! La ansiedad no es sólo miedo y no viene de la nada. De hecho, todo lo que crees saber sobre la ansiedad está a punto de cambiar. Este excepcional libro es un enfoque único, lleno de técnicas prácticas y orientación que ilustra una verdad profunda: la curación de la ansiedad es posible. Amy B. Scher, autora del bestseller Cómo sanarte cuando nadie más puede hacerlo, comparte sus métodos comprobados para abordar y curar la raíz de la ansiedad: cambiar creencias dañinas, calmar tu cuerpo y liberar la vieja energía emocional que te detiene. Este libro será tu guía a través de una serie de herramientas transformadoras y ejercicios fáciles de seguir que pueden cambiar tu vida rápidamente. Utilizando las pod...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- curación de la ansiedad es posible
- cambiar creencias dañinas
- calmar el cuerpo
- liberar energía emocional
- técnicas prácticas y ejercicios transformadores

**Key terms:** Técnica de Liberación Emocional (TLE), creencias dañinas, energía emocional, herramientas transformadoras, equipaje emocional

**Voz autorial:** La voz de Amy B. Scher es accesible y empática, combinando conocimientos prácticos con un enfoque motivador hacia la curación personal.

---

## 🎨 Visual synthesis

- hue_primary: 140
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#CFD3D0, accent=#1FD65C, ink=#171C19, contraste=11.41:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly references key concepts from the book, such as 'liberar la energía emocional', 'creencias dañinas', and 'Técnica de Liberación Emocional', which are central to the author's approach to healing anxiety. The phrases and exercises mentioned are closely aligned with the techniques described in the ground truth, making it specific to this book.

### EN
- Score: 0.90
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the specific concepts outlined in the ground truth, particularly the focus on releasing emotional energy and addressing harmful beliefs as a means to heal anxiety. Phrases like 'anxiety is not merely a fleeting fear' and 'let go of what weighs you down' directly relate to the book's themes. The content is not generic and is tailored to the book's unique focus

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en la experiencia del lector.
- EN: pagina — Voz directa y técnica coherente con el contenido del libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.95 ← promedio de los 2 judges
- **Combined:** **0.94**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9539
- Tiempo total: 24.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2640ms
- anchors: 2375 tokens, 5235ms
- palette: 0 tokens, 0ms
- content_es: 2568 tokens, 5457ms
- judge_es: 918 tokens, 1789ms
- content_en: 1980 tokens, 7124ms
- judge_en: 858 tokens, 1839ms
- voice: 840 tokens, 798ms
