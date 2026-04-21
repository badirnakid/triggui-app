# Quality Report — El poder frente a la fuerza

**Autor:** David R. Hawkins
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

Probablemente el mejor libro del Dr. David R. Hawkins. El Poder frente a la fuerza en Estados Unidos fue un autentico superventas. Las personas involucradas en su traducción aseguran estar entusiasmados con su contenido y llevan años trabajando con libros de está índole, afirman que es “el mejor libro que han leído”. Esperamos no crear falsas expectativas, vosotros los lectores tendréis la última palabra, más cuando el rió suena agua lleva. Seguiremos informando. El doctor Hawkins nos aporta una explicación muy clara y comprensible de los niveles de la conciencia humana, asociados con las emociones, así como de algunos de los pasos clave que hay que dar para transitar de uno a otro, ofreciendo así valiosas herramientas para el cambio personal y social. Auna...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- niveles de la conciencia humana
- diferencia entre poder y fuerza
- prueba kinesiológica para discernir verdad y falsedad
- concepto de atractor
- herramientas para el cambio personal y social

**Key terms:** conciencia, poder, fuerza, yo personal, atractor

**Voz autorial:** La voz del autor es clara y accesible, combinando la experiencia terapéutica con conceptos de física cuántica para ofrecer una perspectiva innovadora sobre la conciencia.

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
- Razón: The generated content explicitly references key concepts from the book such as 'niveles de la conciencia', 'poder', and 'fuerza', which are central themes in David R. Hawkins' work. The phrases and ideas presented align closely with the book's exploration of the distinction between personal effort and authentic power, demonstrating a clear connection to the ground truth.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the concepts presented in the ground truth, particularly the distinction between 'power' and 'force' and the idea of aligning with universal principles. Phrases like 'power emerges from alignment with universal principles' and 'recognize the difference: power is flow, force is struggle' directly echo Hawkins' teachings. However, while it is specific to the 'P

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y conceptos del libro sin referencias externas.
- EN: pagina — Voz directa y conceptos del libro sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10066
- Tiempo total: 25.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2001ms
- anchors: 2561 tokens, 5769ms
- palette: 0 tokens, 0ms
- content_es: 2642 tokens, 7452ms
- judge_es: 1006 tokens, 2001ms
- content_en: 2068 tokens, 5732ms
- judge_en: 975 tokens, 2024ms
- voice: 814 tokens, 672ms
