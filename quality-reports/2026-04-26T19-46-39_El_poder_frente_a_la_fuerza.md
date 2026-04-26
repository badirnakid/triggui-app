# Quality Report — El poder frente a la fuerza

**Autor:** David R. Hawkins
**Ejecutado:** 2026-04-26T19-46-39
**Pipeline:** nucleus-canonical-v3.7.1

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

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- niveles de la conciencia humana
- distinción entre poder y fuerza
- prueba kinesiológica
- concepto de atractor
- herramientas para el cambio personal y social

**Key terms:** conciencia, poder, fuerza, yo personal, atractor

**Voz autorial:** La voz del autor es clara y comprensible, combinando experiencia terapéutica con conceptos de física cuántica, lo que ofrece un enfoque innovador y accesible sobre la conciencia y el crecimiento personal.

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
- Razón: El contenido generado utiliza conceptos específicos del libro, como la distinción entre poder y fuerza, y menciona la prueba kinesiológica, que son elementos clave en la obra de Hawkins. Además, se refleja la idea de fluir con la conciencia, lo que está directamente relacionado con los temas del libro.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content explicitly discusses the distinction between power and force, a central theme of Hawkins' book. It uses specific phrases like 'alignment with consciousness' and 'effortless flow,' directly reflecting the book's concepts. This makes it highly anchored to the ground truth.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas reflexivas.
- EN: pagina — Uso de voz directa y preguntas reflexivas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9910
- Tiempo total: 23.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2275ms
- anchors: 2543 tokens, 5892ms
- palette: 0 tokens, 0ms
- content_es: 2620 tokens, 5634ms
- judge_es: 986 tokens, 1737ms
- content_en: 2030 tokens, 4565ms
- judge_en: 951 tokens, 1276ms
- voice: 780 tokens, 1684ms
- highlight_judge_es_parrafoTop: 644 tokens, 0ms
- highlight_judge_es_parrafoTop_retry: 645 tokens, 0ms
- highlight_judge_es_parrafoBot: 637 tokens, 0ms
- highlight_judge_en_parrafoTop: 638 tokens, 0ms
- highlight_judge_en_parrafoBot: 642 tokens, 0ms
