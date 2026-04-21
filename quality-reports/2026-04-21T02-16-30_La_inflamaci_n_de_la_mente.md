# Quality Report — La inflamación de la mente

**Autor:** Edward Bullmore
**Ejecutado:** 2026-04-21T02-16-30
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

Edward Bullmore, uno de los científicos más citados del mundo en neurociencia y psiquiatría, nos presenta una nueva y revolucionaria manera de entender la depresión y su relación con la inflamación del cerebro. La depresión parece encaminada a convertirse en la principal causa de discapacidad a nivel global, pero la realidad es que en las últimas tres décadas no ha habido ningún cambio notable en su tratamiento. En el mundo de la psiquiatría, el tiempo parece haberse detenido... hasta ahora. Edward Bullmore, profesor de Psiquiatría de la Universidad de Cambridge, afirma que los trastornos mentales pueden tener su raíz en el sistema inmunitario. En La inflamación de la mente, Bullmore ofrece una innovadora perspectiva sobre cómo la mente, el cerebro y el cue...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la relación entre la inflamación del cerebro y la depresión
- enfoque en el sistema inmunitario como raíz de los trastornos mentales
- nuevas perspectivas sobre el tratamiento de la depresión
- circuitos viciosos del estrés y la inflamación
- innovaciones científicas en salud mental

**Key terms:** inflamación, depresión, sistema inmunitario, trastornos mentales, neurociencia, psiquiatría

**Voz autorial:** La voz de Bullmore es científica y accesible, combinando rigor académico con un enfoque innovador y esperanzador sobre la salud mental.

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
- Razón: The generated content directly references key concepts from the book, such as the connection between brain inflammation and depression, the role of the immune system in mental health, and the potential for innovative treatments. Phrases like 'la inflamación puede ser la clave para entender la depresión' and 'explorar el sistema inmunitario como raíz de la depresión' are specifically anchored to Dr

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes presented in the book, particularly the connection between brain inflammation and depression, as well as the innovative treatment approaches suggested by Bullmore. Phrases like 'the inflammation of the brain' and 'the immune system as the root of depression' directly reference concepts from the ground truth. However, some phrases are slightly re

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.80)
- ES: pagina — Voz directa y enfoque en la conexión entre inflamación y mente.
- EN: pagina — Voz directa y enfoque en la conexión mente-cuerpo.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.9 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.93**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9879
- Tiempo total: 64.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41258ms
- anchors: 2468 tokens, 6368ms
- palette: 0 tokens, 0ms
- content_es: 2639 tokens, 6707ms
- judge_es: 977 tokens, 1778ms
- content_en: 2057 tokens, 5582ms
- judge_en: 917 tokens, 1979ms
- voice: 821 tokens, 1012ms
