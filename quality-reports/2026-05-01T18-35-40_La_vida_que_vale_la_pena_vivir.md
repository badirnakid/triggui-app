# Quality Report — La vida que vale la pena vivir

**Autor:** Miroslav Volf, Matthew Croasmun & Ryan McAnnally-Linz
**Ejecutado:** 2026-05-01T18-35-40
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_1sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

A través del concepto La Pregunta —la cual engloba las ideas de mérito, bondad, valor, sentido, propósito, entre muchas más—, los autores y catedráticos del Programa de Humanidades de Yale invitarán al lector a reflexionar y a encontrar el verdadero sentido de su vida, basándose en importantes figuras de tradiciones religiosas y filosóficas, que lo impulsarán a ser más responsable de su vida, enfrentar sus miedos y a volver reales sus más impulsos más profundos.

METADATA VERIFICADA:
- Título: La vida que vale la pena vivir
- Autor: Miroslav Volf, Matthew Croasmun & Ryan McAnnally-Linz
- Año: 2024
- Categorías: Filosofía, Libros, No ficción
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- la búsqueda del sentido de la vida
- la responsabilidad personal en la vida
- enfrentar los miedos internos
- la reflexión sobre el valor y la bondad
- la importancia del propósito en la existencia

**Key terms:** La Pregunta, mérito, bondad, valor, sentido, propósito

**Voz autorial:** La voz de los autores es reflexiva y académica, invitando al lector a un diálogo interno profundo sobre cuestiones filosóficas y existenciales.

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
- Razón: El contenido generado utiliza conceptos específicos del libro, como 'La Pregunta', 'responsabilidad personal', 'mérito' y 'bondad', que son centrales en la sinopsis. Además, aborda la búsqueda del sentido de la vida y la reflexión sobre las decisiones, alineándose perfectamente con el enfoque del libro.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content closely aligns with the themes of purpose, responsibility, and confronting fears as outlined in the ground truth. It references the importance of merit and goodness, which are central to the book's message. However, some phrases are somewhat generic and could apply to other philosophical discussions.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre el sentido de la vida.
- EN: pagina — Tono reflexivo y directo, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.84 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.91**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlight_en_parrafoTop_residual_warning
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 8960
- Tiempo total: 42.2s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 16381ms
- anchors: 2282 tokens, 6709ms
- palette: 0 tokens, 0ms
- content_es: 2430 tokens, 6741ms
- judge_es: 786 tokens, 2158ms
- content_en: 1875 tokens, 6532ms
- judge_en: 773 tokens, 2402ms
- voice: 814 tokens, 1205ms
- highlight_judge_es_parrafoTop: 646 tokens, 0ms
- highlight_judge_es_parrafoBot: 642 tokens, 0ms
- highlight_judge_en_parrafoTop: 648 tokens, 0ms
- highlight_judge_en_parrafoTop_retry: 649 tokens, 0ms
- highlight_judge_en_parrafoBot: 639 tokens, 0ms
