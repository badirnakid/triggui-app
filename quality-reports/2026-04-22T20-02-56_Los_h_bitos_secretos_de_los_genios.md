# Quality Report — Los hábitos secretos de los genios

**Autor:** Craig Wright
**Ejecutado:** 2026-04-22T20-02-56
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `google_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_4sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Google Books):

Einstein. Beethoven. Picasso. Jobs. La palabra genio evoca a estas figuras icónicas, cuyas contribuciones han transformado de forma irreversible a la sociedad. Sin embargo, Beethoven no sabía multiplicar, Picasso reprobó Matemáticas en la primaria y Jobs dejó la universidad después del primer semestre. ¿Qué dice esto sobre cómo medimos el éxito en la actualidad? ¿Por qué nos enseñan a comportarnos según las reglas, cuando los genios han hecho todo lo contrario? Y a todo esto, ¿qué es en realidad ser un genio? El profesor Craig Wright, creador del popular curso Explorando la Naturaleza del Genio, de la Universidad de Yale, revela lo que podemos aprender de las mentes brillantes que han cambiado al mundo. Al examinar la vida de individuos que van desde Charl...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- los 14 rasgos de las grandes mentes
- la creatividad como hábito cultivable
- la importancia de pensar fuera de las reglas establecidas
- la dedicación constante hacia el aprendizaje
- el valor de la estrategia en el éxito

**Key terms:** genio, hábitos, creatividad, estrategia, éxito

**Voz autorial:** La voz de Craig Wright es académica y reflexiva, combinando análisis profundo con ejemplos históricos y contemporáneos, ofreciendo un enfoque accesible y práctico para el lector.

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
- Razón: The generated content directly reflects the key concepts from the ground truth, such as the 14 traits of great minds, the importance of cultivating habits for creativity, and the idea that genius is not solely based on innate talent. Phrases like 'cultivar hábitos que fomenten la creatividad' and 'dedicación constante' are specifically aligned with the themes discussed in the book, making it clear

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content reflects specific concepts from the ground truth, such as the idea of cultivating habits that foster creativity and the notion of challenging the status quo, which are central themes in Craig Wright's book. The mention of '14 traits of great minds' directly ties back to the book's focus on identifying characteristics of historical geniuses. However, some phrases are somewhat generic, e

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en hábitos sin referencias externas.
- EN: pagina — Tono directo y enfoque en hábitos, sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9739
- Tiempo total: 33.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 10809ms
- anchors: 2403 tokens, 5637ms
- palette: 0 tokens, 0ms
- content_es: 2599 tokens, 6385ms
- judge_es: 965 tokens, 2131ms
- content_en: 2034 tokens, 5629ms
- judge_en: 914 tokens, 2176ms
- voice: 824 tokens, 946ms
