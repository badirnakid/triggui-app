# Quality Report — El Poder de la Soledad

**Autor:** MAHOGANY. CLARK
**Ejecutado:** 2026-04-27T15-06-44
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `identity_sealed_with_evidence`
- **Tier reached:** 1.5
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_preloaded
- **Match score:** 1.00



### Ground truth utilizado
```
LIBRO SELECCIONADO POR EL CURADOR AUTOMÁTICO:
Título: El Poder de la Soledad
Autor: MAHOGANY. CLARK

SINOPSIS OFICIAL (Google Books):

El Poder de la Soledad: Solo, No Solitario enseña a los lectores a abrazar la autorreflexión y a comprender su yo más profundo. Cuestiona la percepción negativa de estar solo, destacando los profundos beneficios de la soledad en todas las áreas de la vida. Este libro te guiará desde no saber cómo estar solo hasta darte cuenta de que la soledad no significa estar en soledad, lo que te permitirá encontrar la paz dentro de ti mismo.

METADATA VERIFICADA:
- Título: El Poder de la Soledad
- Autor: MAHOGANY. CLARK
- Año: 2025
- Editorial: Independently Published
- Categorías: Young Adult Nonfiction
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- abrazar la autorreflexión
- comprender el yo más profundo
- beneficios de la soledad
- encontrar la paz interior
- diferencia entre estar solo y estar en soledad

**Key terms:** autorreflexión, soledad, paz interior, auto-conocimiento, percepción negativa

**Voz autorial:** La voz de Mahogany Clark es introspectiva y alentadora, invitando a los lectores a explorar su interior y a cambiar su perspectiva sobre la soledad.

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
- Razón: El contenido generado refleja conceptos específicos del libro, como la autorreflexión y la diferencia entre estar solo y estar en soledad, que son centrales en la sinopsis. Las frases utilizadas están directamente relacionadas con los temas tratados en 'El Poder de la Soledad', lo que demuestra un anclaje sólido al ground truth del libro.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content directly reflects the themes of self-reflection and the benefits of solitude as outlined in the book's synopsis. Phrases like 'solitude is not a punishment' and 'inner peace blossoms when you learn to be alone' are closely aligned with the book's core message, making it specific to 'El Poder de la Soledad'.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiva, sin referencias externas al libro.
- EN: pagina — Voz directa y reflexiva, sin referencias externas al libro.

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
- Tokens totales: 8925
- Tiempo total: 25.3s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3ms
- anchors: 2275 tokens, 5651ms
- palette: 0 tokens, 1ms
- content_es: 2437 tokens, 7891ms
- judge_es: 798 tokens, 2449ms
- content_en: 1847 tokens, 6463ms
- judge_en: 784 tokens, 1530ms
- voice: 784 tokens, 1275ms
- highlight_judge_es_parrafoTop: 653 tokens, 0ms
- highlight_judge_es_parrafoBot: 645 tokens, 0ms
- highlight_judge_en_parrafoTop: 648 tokens, 0ms
- highlight_judge_en_parrafoBot: 642 tokens, 0ms
