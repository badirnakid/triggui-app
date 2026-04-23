# Quality Report — Sesgos Inconscientes

**Autor:** Pamela Fuller, Anne Chow & Mark Murphy
**Ejecutado:** 2026-04-23T02-53-06
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

UNA GUÍA OBLIGADA PARA ENTENDER Y TRASCENDER LOS SESGOS EN EL TRABAJO, POR LOS EXPERTOS DE FRANKLINCOVEY. Los sesgos inconscientes nos afectan a todos. Un reclutador se podría decepcionar si un candidato le pregunta sobre la incapacidad por maternidad. A un profesional de Recursos Humanos le puede parecer más atractivo promover a un graduado de una universidad prestigiosa que a uno de una escuela pública. Un líder puede que crea que una mujer está menos preparada para presentar un reporte en la próxima reunión que su colega varón. Sesgos inconscientes explica que estos son el resultado de atajos mentales, de lo que nos gusta y de lo que no nos gusta, pero, indiscutiblemente, son parte de nuestra condición humana. Sin embargo, lo que asumimos y cómo interact...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- reconocer los sesgos inconscientes en el trabajo
- cultivar empatía y curiosidad en las interacciones
- ver a las personas como individuos completos
- priorizar el entendimiento verdadero para liberar el potencial
- impacto de los sesgos en el desarrollo profesional

**Key terms:** sesgos inconscientes, empatía, curiosidad, interacciones humanas, potencial individual

**Voz autorial:** La voz autorial es clara y accesible, con un enfoque práctico que invita a la reflexión y la acción en el ámbito laboral.

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
- Razón: The generated content directly reflects the concepts outlined in the ground truth, such as recognizing unconscious biases, the importance of empathy and curiosity, and viewing individuals as complete persons. Phrases like 'reconocimiento de los sesgos inconscientes' and 'cultivar la empatía y la curiosidad' are specifically tied to the themes of the book, making it highly relevant and not generic.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects the core themes of the book, such as recognizing unconscious biases, cultivating empathy, and understanding individuals as complete persons. Phrases like 'unconscious biases shape our perceptions' and 'cultivating empathy and curiosity' are specific to the book's focus on overcoming biases in the workplace, making it highly relevant and anchored to the book.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en el lector sin referencias externas.
- EN: pagina — Voz directa y enfoque en el desarrollo personal.

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
- Tokens totales: 9572
- Tiempo total: 64.1s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41882ms
- anchors: 2375 tokens, 5695ms
- palette: 0 tokens, 1ms
- content_es: 2583 tokens, 8065ms
- judge_es: 939 tokens, 2352ms
- content_en: 1994 tokens, 3570ms
- judge_en: 873 tokens, 1615ms
- voice: 808 tokens, 968ms
