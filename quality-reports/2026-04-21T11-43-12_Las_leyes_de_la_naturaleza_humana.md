# Quality Report — Las leyes de la naturaleza humana

**Autor:** Robert Greene
**Ejecutado:** 2026-04-21T11-43-12
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

La naturaleza humana es más fuerte que cualquier individuo, institución o tecnología. Dirige nuestras obras y nos mueve como peones de ajedrez.Ignorarás sus leyes bajo tu propio riesgo. Como animales sociales, nuestras vidas dependen de las relaciones que forjamos. Por eso no bastan nuestro talento, cono-cimiento y formación: saber por qué la gente hace lo que hace es la herramienta más importante que podemos dominar. A partir de las ideas de personajes históricos tan diversos como Pericles, Isabel I y Martin Luther King Jr., el celebrado escritor Robert Greene nos enseña cómo controlar nuestras emociones, cómo leer mejor las intenciones de los demás, cómo desarrollar la empatía para servir a nuestros propósitos, cómo ver detrás de las máscaras y cómo modif...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la naturaleza humana como fuerza dominante en nuestras vidas
- control emocional como herramienta clave
- lectura de intenciones ajenas para el éxito personal
- desarrollo de la empatía para fines estratégicos
- modificación de comportamientos negativos

**Key terms:** relaciones sociales, tácticas de autoconocimiento, empatía estratégica, máscaras sociales, comportamientos negativos

**Voz autorial:** La voz de Robert Greene es analítica y persuasiva, combinando historia, filosofía y psicología para ofrecer una comprensión profunda de la naturaleza humana.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_moderno
- Resultado: paper=#CFD2D3, accent=#1F99D6, ink=#171A1C, contraste=11.50:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content closely reflects the key themes and concepts outlined in the ground truth, such as the importance of understanding human nature, emotional control, and social interactions. Phrases like 'la naturaleza humana es la fuerza que guía nuestras acciones' and 'dominar el control emocional es una habilidad esencial' directly relate to the ideas presented by Robert Greene in 'Las ley 

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes and concepts outlined in the ground truth. It discusses the influence of human nature on actions and decisions, emotional control, and the importance of understanding social interactions, all of which are central to Robert Greene's 'Las leyes de la naturaleza humana'. Specific phrases like 'mastering emotional control' and 'understand emotions' are

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas reflexivas sin referencias externas.
- EN: pagina — Tono directo y reflexivo, sin referencias externas al libro.

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
- Tokens totales: 9453
- Tiempo total: 27.3s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 8248ms
- anchors: 2425 tokens, 5707ms
- palette: 0 tokens, 0ms
- content_es: 2531 tokens, 4766ms
- judge_es: 883 tokens, 1545ms
- content_en: 1958 tokens, 3959ms
- judge_en: 845 tokens, 2037ms
- voice: 811 tokens, 1062ms
