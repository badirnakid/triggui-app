# Quality Report — 101 reflexiones que cambiarán tu forma de pensar

**Autor:** Brianna Wiest Brianna Wiest
**Ejecutado:** 2026-04-23T18-38-46
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
- reflexiones que pueden cambiar la vida

**Key terms:** propósito, pasión, pensamiento negativo, sabiduría, sesgos cognitivos

**Voz autorial:** La voz de Brianna Wiest es introspectiva y provocativa, invitando al lector a cuestionar sus propias creencias y a reflexionar sobre su vida de manera profunda.

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
- Razón: The generated content directly reflects the themes and concepts presented in the ground truth, such as the importance of pursuing purpose over passion, embracing negative thinking, and recognizing cognitive biases. Phrases like 'Persigue tu propósito, no tu pasión' and 'La rutina diaria esconde lecciones de sabiduría invaluables' are explicitly aligned with the book's focus on transformative ideas

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects the themes and concepts presented in the ground truth, specifically the emphasis on pursuing purpose over passion, which is a key idea in Brianna Wiest's work. Phrases like 'pursue your purpose' and 'purpose offers clarity' are explicitly aligned with the book's focus on transformative thinking and self-awareness. This content is not generic and is tailored,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre el propósito.
- EN: pagina — Voz directa y reflexiones en primera persona sobre el propósito.

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
- Tokens totales: 9079
- Tiempo total: 30.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 9827ms
- anchors: 2300 tokens, 5553ms
- palette: 0 tokens, 1ms
- content_es: 2478 tokens, 5588ms
- judge_es: 828 tokens, 3448ms
- content_en: 1887 tokens, 3319ms
- judge_en: 775 tokens, 1841ms
- voice: 811 tokens, 1023ms
