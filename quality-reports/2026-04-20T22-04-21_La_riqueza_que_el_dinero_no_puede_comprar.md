# Quality Report — La riqueza que el dinero no puede comprar

**Autor:** Robin Sharma
**Ejecutado:** 2026-04-20T22-04-21
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
- estilo de vida armonioso

**Key terms:** riqueza auténtica, cambio profundo, desarrollo del potencial, plena satisfacción, trabajo gratificante

**Voz autorial:** La voz de Robin Sharma es inspiradora y motivacional, centrada en el desarrollo personal y la búsqueda de una vida significativa.

---

## 🎨 Visual synthesis

- hue_primary: 65
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#D3D3CF, accent=#C7D61F, ink=#1B1C17, contraste=11.42:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly references key concepts from the book, such as 'fortaleza personal', 'autenticidad', 'plena existencia', and 'desarrollo del potencial', which are central to Robin Sharma's philosophy in 'La riqueza que el dinero no puede comprar'. The phrases and ideas presented are specific to the book's themes and do not apply generically to other self-help literature.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content closely aligns with the themes presented in the book, particularly the emphasis on 'authentic wealth' and 'personal strength,' which are central to Robin Sharma's philosophy. The mention of 'hidden habits' and the pursuit of a fulfilling life reflects the book's focus on the '8 forms of wealth' and personal development. However, some phrases are slightly generic and could apply to a 10

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en el contenido del libro.
- EN: pagina — Voz directa y enfoque en el desarrollo personal sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.86 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.91**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9931
- Tiempo total: 63.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41727ms
- anchors: 2518 tokens, 4485ms
- palette: 0 tokens, 0ms
- content_es: 2622 tokens, 6561ms
- judge_es: 999 tokens, 2091ms
- content_en: 2039 tokens, 5366ms
- judge_en: 956 tokens, 1865ms
- voice: 797 tokens, 1268ms
