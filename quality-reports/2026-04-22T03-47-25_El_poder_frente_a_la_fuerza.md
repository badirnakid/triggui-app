# Quality Report — El poder frente a la fuerza

**Autor:** David R. Hawkins
**Ejecutado:** 2026-04-22T03-47-25
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

Probablemente el mejor libro del Dr. David R. Hawkins. El Poder frente a la fuerza en Estados Unidos fue un autentico superventas. Las personas involucradas en su traducción aseguran estar entusiasmados con su contenido y llevan años trabajando con libros de está índole, afirman que es “el mejor libro que han leído”. Esperamos no crear falsas expectativas, vosotros los lectores tendréis la última palabra, más cuando el rió suena agua lleva. Seguiremos informando. El doctor Hawkins nos aporta una explicación muy clara y comprensible de los niveles de la conciencia humana, asociados con las emociones, así como de algunos de los pasos clave que hay que dar para transitar de uno a otro, ofreciendo así valiosas herramientas para el cambio personal y social. Auna...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- niveles de la conciencia humana
- distinción entre poder y fuerza
- prueba kinesiológica
- atractor en la conciencia
- herramientas para el cambio personal y social

**Key terms:** poder, fuerza, conciencia, emoción, kinesiología

**Voz autorial:** La voz del autor es clara y comprensible, combinando experiencia terapéutica con conceptos de física cuántica, lo que otorga un enfoque innovador y accesible a temas complejos.

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
- Razón: The generated content directly references key concepts from the ground truth, such as the distinction between power and force, the influence of emotions on consciousness, and the idea of aligning with true power. These concepts are specific to David R. Hawkins' work and reflect the themes outlined in the official synopsis.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content explicitly references key concepts from the ground truth, such as the distinction between 'power and force' and the alignment with 'true essence of consciousness.' It also discusses the implications of these concepts for personal and social change, which are central themes in Hawkins' work. The phrases used are specific to the book's teachings and cannot easily apply to any其他

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas personales.
- EN: pagina — Uso de voz directa y preguntas personales.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10107
- Tiempo total: 61.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40083ms
- anchors: 2617 tokens, 4366ms
- palette: 0 tokens, 0ms
- content_es: 2648 tokens, 7805ms
- judge_es: 988 tokens, 1558ms
- content_en: 2077 tokens, 5354ms
- judge_en: 974 tokens, 1447ms
- voice: 803 tokens, 849ms
