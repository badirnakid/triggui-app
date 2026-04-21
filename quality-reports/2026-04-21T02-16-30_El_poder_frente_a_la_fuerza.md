# Quality Report — El poder frente a la fuerza

**Autor:** David R. Hawkins
**Ejecutado:** 2026-04-21T02-16-30
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
- concepto de atractor
- herramientas para el cambio personal y social

**Key terms:** conciencia, poder, fuerza, atractor, kinesiología

**Voz autorial:** La voz del autor es clara y comprensible, combinando experiencia terapéutica con conceptos de física cuántica, ofreciendo un enfoque accesible y profundo sobre el crecimiento personal.

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
- Razón: The generated content specifically references key concepts from the ground truth, such as the distinction between 'poder' (power) and 'fuerza' (force), and discusses the levels of consciousness and their emotional implications, which are central themes in Hawkins' work. The phrases used are directly aligned with the book's focus on personal and social transformation through understanding these two

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly references key concepts from the ground truth, such as the distinction between 'power' and 'force', the spectrum of consciousness, and the alignment with one's true essence. These are specific ideas presented by Dr. Hawkins in 'El poder frente a la fuerza', making the content highly relevant and anchored to the book.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en conceptos del libro.
- EN: pagina — Voz directa y conceptos alineados con la obra.

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
- Tokens totales: 10167
- Tiempo total: 67.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41557ms
- anchors: 2566 tokens, 7250ms
- palette: 0 tokens, 0ms
- content_es: 2659 tokens, 6486ms
- judge_es: 1028 tokens, 2202ms
- content_en: 2097 tokens, 6131ms
- judge_en: 973 tokens, 3480ms
- voice: 844 tokens, 753ms
