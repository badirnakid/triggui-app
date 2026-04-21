# Quality Report — 101 reflexiones que cambiarán tu forma de pensar

**Autor:** Brianna Wiest Brianna Wiest
**Ejecutado:** 2026-04-21T11-02-04
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `google_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_4sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Google Books):

Antología de ensayos y meditaciones Brianna Wiest, escritora bestseller y fenómeno global en redes sociales, presenta en esta obra una recopilación de sus escritos más famosos. La presente selección incluye reflexiones sobre por qué debemos perseguir el propósito por encima de la pasión, abrazar el pensamiento negativo, ver la sabiduría en la rutina diaria o ser conscientes de los sesgos cognitivos que crean nuestra manera de ver la vida, entre muchas otras. Algunas de estas piezas son inéditas; otras ya han sido leídas por millones de personas en todo el mundo. En cualquier caso, muchas de ellas te dejarán pensando: "Esta idea me va a cambiar la vida".

METADATA VERIFICADA:
- Título: 101 Reflexiones que cambiarán tu forma de pensar
- Autor: Brianna Wiest ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- perseguir el propósito por encima de la pasión
- abrazar el pensamiento negativo
- ver la sabiduría en la rutina diaria
- ser conscientes de los sesgos cognitivos
- reflexiones que transforman la vida

**Key terms:** propósito, pasión, pensamiento negativo, sabiduría, sesgos cognitivos

**Voz autorial:** La voz de Brianna Wiest es reflexiva, accesible y motivadora, combinando la profundidad del pensamiento con un estilo conversacional que invita a la introspección.

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
- Razón: The generated content directly reflects specific concepts from the ground truth, such as the importance of pursuing purpose over passion and embracing negative thinking. Phrases like 'Persigue el propósito, no la pasión' and 'Abraza el pensamiento negativo' are explicitly aligned with the themes presented in the book's synopsis, demonstrating a strong connection to the author's ideas.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects the themes and concepts presented in the ground truth, particularly the emphasis on pursuing purpose over passion, which is a key idea in Brianna Wiest's work. Phrases like 'Pursue Purpose, Not Passion' and 'Purpose is a force that shapes our reality' are explicitly aligned with the book's focus on purpose and its significance in life, making it highly tied,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas reflexivas.
- EN: pagina — Voz directa y reflexiones personales sobre el propósito.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.87 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.94**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 8927
- Tiempo total: 22.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2623ms
- anchors: 2299 tokens, 5143ms
- palette: 0 tokens, 0ms
- content_es: 2447 tokens, 5763ms
- judge_es: 790 tokens, 1639ms
- content_en: 1853 tokens, 4818ms
- judge_en: 772 tokens, 2178ms
- voice: 766 tokens, 694ms
