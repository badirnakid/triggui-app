# Quality Report — Sesgos Inconscientes

**Autor:** Pamela Fuller, Anne Chow & Mark Murphy
**Ejecutado:** 2026-04-22T14-41-30
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

UNA GUÍA OBLIGADA PARA ENTENDER Y TRASCENDER LOS SESGOS EN EL TRABAJO, POR LOS EXPERTOS DE FRANKLINCOVEY. Los sesgos inconscientes nos afectan a todos. Un reclutador se podría decepcionar si un candidato le pregunta sobre la incapacidad por maternidad. A un profesional de Recursos Humanos le puede parecer más atractivo promover a un graduado de una universidad prestigiosa que a uno de una escuela pública. Un líder puede que crea que una mujer está menos preparada para presentar un reporte en la próxima reunión que su colega varón. Sesgos inconscientes explica que estos son el resultado de atajos mentales, de lo que nos gusta y de lo que no nos gusta, pero, indiscutiblemente, son parte de nuestra condición humana. Sin embargo, lo que asumimos y cómo interact...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- reconocer los sesgos inconscientes en el trabajo
- fomentar la empatía y la curiosidad
- ver a las personas como individuos completos
- priorizar el entendimiento verdadero
- crear equipos de alto rendimiento

**Key terms:** sesgos inconscientes, empatía, curiosidad, desarrollo profesional, equipos de alto rendimiento

**Voz autorial:** La voz autorial es clara y accesible, enfocándose en la importancia de la autoconciencia y la transformación personal en el contexto laboral.

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
- Razón: The generated content directly reflects key concepts from the ground truth, such as recognizing unconscious biases, fostering empathy, and viewing individuals as complete persons. Phrases like 'sesgos inconscientes' and 'empatía' are explicitly tied to the book's themes, making it specific to this work rather than generic.

### EN
- Score: 0.90
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes and concepts outlined in the ground truth, particularly the emphasis on recognizing unconscious biases, fostering empathy, and seeing individuals as complete persons. Phrases like 'unconscious biases shape our perceptions daily' and 'empathy fosters connection' directly relate to the book's focus on the impact of biases in professional settings. It

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en la transformación personal.
- EN: pagina — Voz directa y enfoque en la transformación personal.

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
- Tokens totales: 9485
- Tiempo total: 43.2s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 14936ms
- anchors: 2374 tokens, 6761ms
- palette: 0 tokens, 0ms
- content_es: 2569 tokens, 8129ms
- judge_es: 916 tokens, 4204ms
- content_en: 1969 tokens, 5499ms
- judge_en: 861 tokens, 2684ms
- voice: 796 tokens, 996ms
