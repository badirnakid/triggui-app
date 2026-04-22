# Quality Report — La riqueza que el dinero no puede comprar

**Autor:** Robin Sharma
**Ejecutado:** 2026-04-22T14-41-30
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

UN MÉTODO REVOLUCIONARIO PARA ALCANZAR LA AUTÉNTICA RIQUEZA Este libro te ofrece una nueva filosofía y una fórmula de cambio profundo para disfrutar de una vida realmente plena, con una gran fortaleza personal, autenticidad, un trabajo de lo más gratificante y un estilo de vida armonioso. Por fin sentirás que la verdadera fortuna te sonríe. Basado en el modelo de aprendizaje «las 8 formas de riqueza», que el renombrado experto en desarrollo personal Robin Sharma -conocido mentor de millonarios, estrellas del deporte y jefes de Estado- ha impartido entre sus clientes con resultados excepcionales, La riqueza que el dinero no puede comprar se convertirá en tu guía para alcanzar la vida que siempre habías soñado. Descubre los hábitos ocultos para alcanzar la pl...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- una nueva filosofía para una vida plena
- las 8 formas de riqueza
- hábitos ocultos para alcanzar la plenitud
- fortaleza personal y autenticidad
- evitar las consecuencias de no desarrollar todo tu potencial

**Key terms:** riqueza auténtica, cambio profundo, estilo de vida armonioso, trabajo gratificante, plena realización

**Voz autorial:** La voz de Robin Sharma es motivacional y reflexiva, enfocándose en el desarrollo personal y la búsqueda de una vida significativa.

---

## 🎨 Visual synthesis

- hue_primary: 65
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_moderno
- Resultado: paper=#D3D3CF, accent=#C7D61F, ink=#1B1C17, contraste=11.42:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content explicitly references the '8 formas de riqueza' and discusses concepts such as 'fortaleza personal', 'autenticidad', and 'hábitos ocultos', which are directly derived from the ground truth of Robin Sharma's book. It aligns closely with the themes and philosophy presented in the official synopsis, making it specific to this book.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly references the '8 forms of wealth' and emphasizes the concepts of 'authentic wealth' and 'hidden habits' which are specific to Robin Sharma's book. The phrases and themes align closely with the book's focus on personal strength, authenticity, and living a fulfilling life, making it well-grounded in the book's ground truth.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la experiencia personal.
- EN: pagina — Voz directa y enfoque en el contenido del libro.

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
- Tokens totales: 10099
- Tiempo total: 71.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40427ms
- anchors: 2515 tokens, 7264ms
- palette: 0 tokens, 0ms
- content_es: 2645 tokens, 9572ms
- judge_es: 1008 tokens, 1912ms
- content_en: 2103 tokens, 9074ms
- judge_en: 976 tokens, 2203ms
- voice: 852 tokens, 1002ms
