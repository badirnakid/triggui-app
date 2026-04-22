# Quality Report — El poder frente a la fuerza

**Autor:** David R. Hawkins
**Ejecutado:** 2026-04-22T20-02-56
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** cache_apple_books
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
- prueba kinesiológica para distinguir lo verdadero de lo falso
- distinción entre poder y fuerza
- herramientas para el cambio personal y social
- concepto de atractor en el sistema de pensamiento

**Key terms:** conciencia, poder, fuerza, atractor, kinesiología

**Voz autorial:** La voz del autor es clara y accesible, combinando su experiencia terapéutica con conceptos de física cuántica, lo que permite una comprensión profunda de temas complejos.

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
- Razón: The generated content directly references key concepts from the book, such as 'niveles de la conciencia humana', 'prueba kinesiológica', and the distinction between 'poder' y 'fuerza'. These terms are specific to David R. Hawkins' work and are not generic, indicating a strong alignment with the ground truth.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly references key concepts from the ground truth, such as 'levels of human consciousness,' 'kinesiology test,' and the distinction between 'power and force.' These terms are specific to David R. Hawkins' work and reflect the themes of personal and social transformation outlined in the synopsis.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre el contenido del libro.
- EN: pagina — Uso de voz directa y conceptos del libro sin referencias externas.

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
- Tokens totales: 9994
- Tiempo total: 18.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 1ms
- anchors: 2634 tokens, 4943ms
- palette: 0 tokens, 0ms
- content_es: 2626 tokens, 5532ms
- judge_es: 984 tokens, 2282ms
- content_en: 2038 tokens, 3705ms
- judge_en: 926 tokens, 1461ms
- voice: 786 tokens, 731ms
