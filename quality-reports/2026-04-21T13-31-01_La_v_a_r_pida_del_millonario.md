# Quality Report — La vía rápida del millonario

**Autor:** MJ DeMarco
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

Hay una carretera oculta que conduce a la riqueza y la libertad financiera, un atajo que puede recorrerse a una velocidad deslumbrante. Jubilarte cuatro décadas antes de lo habitual y llevar una vida que la mayoría no puede permitirse, es posible. Sin embargo, nos han inculcado el dogma de "hazte rico poco a poco", un plan asfixiante con una ligera posibilidad de obtener riquezas en nuestra vejez: "Ve a la universidad, saca buenas notas, gradúate, consigue un buen trabajo, ahorra, invierte, contrata un plan de pensiones... Entonces, algún día, cuando tengas sesenta y cinco años, serás rico". ¡No permitas que tu plan financiero consista en tener esperanzas y rezar! Cambia de carril; ve por la vía rápida y haz realidad tus sueños.&#xa0; M. J. de Marco amasó s...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- jubilarte cuatro décadas antes de lo habitual
- combatir la pobreza como una enfermedad
- los 5 mandamientos de la riqueza
- cambiar de carril hacia la riqueza
- 250 indicaciones para salir de la pobreza

**Key terms:** vía rápida, vía lenta, ingresos millonarios, plan asfixiante, dogma de hacerse rico poco a poco

**Voz autorial:** La voz de MJ DeMarco es directa, desafiante y motivadora, instando a los lectores a cuestionar las creencias convencionales sobre la riqueza y a tomar acción inmediata.

---

## 🎨 Visual synthesis

- hue_primary: 45
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: complementary
- typography: sans_humanista
- Resultado: paper=#D3D3CF, accent=#E2D112, ink=#1C1B17, contraste=11.48:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly references key concepts from the ground truth, such as 'cambiar de carril hacia la riqueza', 'vía rápida', 'jubilarte cuatro décadas antes de lo habitual', y 'combatir la pobreza como una enfermedad'. These phrases are specific to the book's themes and strategies, making the content highly relevant and anchored to the book's core messages.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the ground truth of 'La vía rápida del millonario' by using specific concepts such as 'fast lane', '5 commandments of wealth', and the idea of combating poverty as a disease. The phrases and themes align directly with the book's message about achieving financial freedom quickly and rejecting traditional slow wealth-building methods.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y tono motivacional propio del libro.
- EN: pagina — Voz directa y tono coherente con el libro.

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
- Tokens totales: 10276
- Tiempo total: 27.1s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3965ms
- anchors: 2629 tokens, 5322ms
- palette: 0 tokens, 0ms
- content_es: 2689 tokens, 6839ms
- judge_es: 1029 tokens, 1925ms
- content_en: 2120 tokens, 6033ms
- judge_en: 991 tokens, 2210ms
- voice: 818 tokens, 844ms
