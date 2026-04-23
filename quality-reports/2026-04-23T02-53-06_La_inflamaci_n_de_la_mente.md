# Quality Report — La inflamación de la mente

**Autor:** Edward Bullmore
**Ejecutado:** 2026-04-23T02-53-06
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
- trastornos mentales ligados al sistema inmunitario
- nuevos tratamientos para la depresión
- interacción entre mente, cerebro y cuerpo
- circuitos viciosos del estrés y la inflamación

**Key terms:** inflamación, depresión, trastornos mentales, sistema inmunitario, neurociencia

**Voz autorial:** La voz de Bullmore es clara y accesible, combinando rigor científico con una narrativa convincente que invita a repensar la conexión entre la salud mental y el sistema inmunológico.

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
- Razón: The generated content directly references key concepts from the ground truth, such as the connection between inflammation and depression, and the role of the immune system in mental health. Phrases like 'la inflamación del cerebro' and 'trastornos mentales ligados al sistema inmunitario' are specific to the themes presented in Bullmore's work, making it highly relevant and anchored to the book's内容

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly references the connection between inflammation and depression, which is a central theme in Bullmore's book. It uses specific concepts such as the role of the immune system in mental health and the idea that mental disorders may not solely be brain issues, aligning closely with the book's premise. The phrases also reflect the innovative perspective on treatment that '

---

## 🎭 Voice verdict

- Consolidated: **resena** (conf 0.90)
- ES: pagina — Tono directo y preguntas retóricas propias del texto.
- EN: resena — Habla del libro y su contenido desde una perspectiva externa.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.32 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.84**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9574
- Tiempo total: 66.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 42028ms
- anchors: 2455 tokens, 6427ms
- palette: 0 tokens, 0ms
- content_es: 2576 tokens, 6441ms
- judge_es: 921 tokens, 2450ms
- content_en: 1982 tokens, 6633ms
- judge_en: 887 tokens, 2108ms
- voice: 753 tokens, 845ms
