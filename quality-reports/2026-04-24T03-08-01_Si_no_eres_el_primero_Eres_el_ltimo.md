# Quality Report — Si no eres el primero; Eres el último

**Autor:** Grant Cardone
**Ejecutado:** 2026-04-24T03-08-01
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

Olvídate de pretextos, este libro te dará estrategias comprobadas que te harán un mejor vendedor, empresario y persona, al tiempo que te lleva hacia una nueva libertad financiera. En Si no eres el primero, eres el último, Grant Cardone te muestra cómo adoptar una actitud de "avanza y conquista". Sintoniza con el poder secreto del "hambre", diseña un plan para ser completamente libre, e ignora las convenciones sociales para conseguir el éxito. En estos tiempos se ha vuelto más complicado vender cualquier producto, mantener contentos a los clientes y obtener hasta la más mínima ventaja. Los errores ahora son más costosos y el fracaso se convierte en una posibilidad real para quienes no logran adaptarse con la suficiente rapidez. Pero imagina que puedas vender...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- actitud de 'avanza y conquista'
- poder del 'hambre'
- diseño de un plan para la libertad financiera
- estrategias para aumentar ventas
- robar mercado a los competidores

**Key terms:** libertad financiera, actitud de conquista, estrategias de ventas, adaptación al cambio, errores costosos

**Voz autorial:** La voz de Grant Cardone es directa, motivadora y enérgica, enfocándose en la acción y la superación personal en el ámbito de las ventas y los negocios.

---

## 🎨 Visual synthesis

- hue_primary: 30
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: complementary
- typography: sans_humanista
- Resultado: paper=#D3D2CF, accent=#E29D12, ink=#1C1A17, contraste=11.48:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects key concepts from the ground truth, such as the 'actitud de avanza y conquista' and the importance of 'hambre' as a driving force for success. Phrases like 'robar el mercado a tus competidores' and 'libertad financiera' are specific to Grant Cardone's teachings in the book, making the content highly relevant and not generic.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content directly reflects the core concepts from the ground truth, such as the 'advance and conquer' mindset and the importance of 'hunger' for success. Phrases like 'design a bold and clear plan to achieve financial freedom' and 'seize your market share' are specific to Grant Cardone's teachings and align closely with the book's themes.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y tono motivacional propio del autor.
- EN: pagina — Uso de voz directa y enfoque en la mentalidad del éxito.

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
- Tokens totales: 9483
- Tiempo total: 60.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 42534ms
- anchors: 2436 tokens, 4850ms
- palette: 0 tokens, 0ms
- content_es: 2523 tokens, 4992ms
- judge_es: 881 tokens, 1625ms
- content_en: 1961 tokens, 4382ms
- judge_en: 836 tokens, 1461ms
- voice: 846 tokens, 739ms
