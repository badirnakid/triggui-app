# Quality Report — La invisible 'mano invisible' de Adam Smith (The Invisible 'Invisible Hand' by Adam Smith).

**Autor:** Del Hierro Patricia
**Ejecutado:** 2026-04-27T13-52-53
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
Título: La invisible 'mano invisible' de Adam Smith (The Invisible 'Invisible Hand' by Adam Smith).
Autor: Del Hierro Patricia

SINOPSIS OFICIAL (Google Books):

Spanish Abstract: Este artículo analiza el significado de la expresión “mano invisible” de Smith. ¿La usó para describir el comportamiento de los mercados como algo inexorable y predeterminado, como se supone usualmente, o como una metáfora de la “mano de Dios”? Para responder esta pregunta explora el contenido filosófico de La teoría de los sentimientos morales como contexto de su obra económica más conocida. El artículo busca contribuir a un debate que ya es común en círculos filosóficos y que aún es incipiente en el ámbito de la economía, pese a que Adam Smith es un autor muy citado...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- análisis del significado de la 'mano invisible' en el contexto de Adam Smith
- exploración del contenido filosófico de La teoría de los sentimientos morales
- debate sobre la interpretación de la 'mano invisible' como metáfora de la 'mano de Dios'

**Key terms:** mano invisible, mercados, filosofía económica, teoría de los sentimientos morales, metáfora

**Voz autorial:** El texto presenta una voz analítica y reflexiva, abordando temas complejos de manera accesible y crítica.

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
- Razón: The generated content directly references the concept of 'mano invisible' and its philosophical implications, aligning closely with the themes of the book. It discusses the duality of the term and its ethical considerations, which are central to Del Hierro's analysis. The phrases used are specific to the book's exploration of Adam Smith's ideas, making it highly relevant.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content specifically references the 'invisible hand' and discusses its philosophical implications, which are central to the book's analysis of Adam Smith's work. It engages with the concepts of market behavior and divine metaphor, aligning closely with the book's themes. However, some phrases are somewhat generic and could apply to broader discussions in economics or philosophy.



---

## 🎭 Voice verdict

- Consolidated: **resena** (conf 0.90)
- ES: resena — Analiza el concepto y plantea preguntas sobre su significado.
- EN: resena — Habla del concepto y su interpretación, típico de una reseña.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.32 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.81**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 2 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9412
- Tiempo total: 33.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2ms
- anchors: 2314 tokens, 9328ms
- palette: 0 tokens, 0ms
- content_es: 2509 tokens, 9852ms
- judge_es: 868 tokens, 2920ms
- content_en: 1970 tokens, 7948ms
- judge_en: 858 tokens, 2174ms
- voice: 893 tokens, 1321ms
- highlight_judge_es_parrafoTop: 660 tokens, 0ms
- highlight_judge_es_parrafoTop_retry: 663 tokens, 0ms
- highlight_judge_es_parrafoBot: 641 tokens, 0ms
- highlight_judge_en_parrafoTop: 646 tokens, 0ms
- highlight_judge_en_parrafoTop_retry: 657 tokens, 0ms
- highlight_judge_en_parrafoBot: 636 tokens, 0ms
