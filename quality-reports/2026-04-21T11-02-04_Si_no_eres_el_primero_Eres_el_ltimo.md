# Quality Report — Si no eres el primero; Eres el último

**Autor:** Grant Cardone
**Ejecutado:** 2026-04-21T11-02-04
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_4sources
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
- poder secreto del 'hambre'
- diseñar un plan para la libertad financiera
- estrategias comprobadas para aumentar ventas
- ignorar convenciones sociales para el éxito

**Key terms:** libertad financiera, hambre, ventas, estrategias, competencia

**Voz autorial:** La voz de Grant Cardone es directa, motivadora y persuasiva, enfocándose en la acción y la superación personal.

---

## 🎨 Visual synthesis

- hue_primary: 20
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: complementary
- typography: sans_humanista
- Resultado: paper=#D3D1CF, accent=#E27A12, ink=#1C1A17, contraste=11.40:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects the themes and concepts presented in the ground truth of Grant Cardone's book. Phrases like 'actitud de conquista', 'poder secreto del hambre', and the emphasis on 'libertad financiera' are explicitly tied to the book's core messages. The content is not generic; it specifically addresses the strategies and mindset that Cardone advocates for achieving success

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects the themes and concepts from the ground truth of Grant Cardone's book, such as the 'attitude of advance and conquer', the importance of a conquering mindset, and the 'secret power of hunger'. Phrases like 'designing a plan for your financial freedom' and 'being first' are explicitly aligned with the book's focus on sales strategies and achieving success in a

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y motivacional, sin referencias externas al libro.
- EN: pagina — Voz directa y motivacional, sin referencias meta al autor.

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
- Tokens totales: 9593
- Tiempo total: 23.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2565ms
- anchors: 2409 tokens, 5074ms
- palette: 0 tokens, 0ms
- content_es: 2544 tokens, 6266ms
- judge_es: 914 tokens, 1771ms
- content_en: 1984 tokens, 4513ms
- judge_en: 868 tokens, 1912ms
- voice: 874 tokens, 942ms
