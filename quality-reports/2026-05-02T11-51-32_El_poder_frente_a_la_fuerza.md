# Quality Report — El poder frente a la fuerza

**Autor:** David R. Hawkins
**Ejecutado:** 2026-05-02T11-51-32
**Pipeline:** nucleus-canonical-v3.7.1

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

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- niveles de la conciencia humana
- distinción entre poder y fuerza
- prueba kinesiológica para distinguir lo verdadero de lo falso
- concepto de atractor
- herramientas para el cambio personal y social

**Key terms:** conciencia, poder, fuerza, kinesiología, atractor

**Voz autorial:** La voz del autor es clara y comprensible, fusionando experiencia terapéutica con conceptos de física cuántica, lo que proporciona un enfoque innovador y accesible a temas complejos.

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
- Razón: El contenido generado utiliza conceptos específicos del libro, como la distinción entre poder y fuerza, y menciona la jerarquía de la conciencia, que son temas centrales en la obra de Hawkins. Las frases reflejan directamente las ideas del libro, lo que demuestra un anclaje sólido al ground_truth.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly references key concepts from the book, such as the levels of consciousness, the distinction between power and force, and the idea of aligning with true power. These elements are specific to Hawkins' work and reflect its core themes, making the content well-grounded.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas reflexivas.
- EN: pagina — Uso de voz directa y preguntas reflexivas.

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
- Tokens totales: 10073
- Tiempo total: 21.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 1ms
- anchors: 2615 tokens, 4956ms
- palette: 0 tokens, 0ms
- content_es: 2632 tokens, 8418ms
- judge_es: 990 tokens, 1660ms
- content_en: 2067 tokens, 3819ms
- judge_en: 972 tokens, 1454ms
- voice: 797 tokens, 686ms
- highlight_judge_es_parrafoTop: 644 tokens, 0ms
- highlight_judge_es_parrafoBot: 646 tokens, 0ms
- highlight_judge_en_parrafoTop: 644 tokens, 0ms
- highlight_judge_en_parrafoBot: 641 tokens, 0ms
