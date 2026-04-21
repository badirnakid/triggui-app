# Quality Report — Etiqueta y estilo en los negocios

**Autor:** Pachter Barbara
**Ejecutado:** 2026-04-21T02-16-30
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `model_inference`
- **Tier reached:** 3
- **Book identity confidence:** 0.60
- **Resolution path:** evidence_fetched_0sources → tier3_conf_0.80


### Libros similares considerados (inferencia)
- **La etiqueta en los negocios** (Rafael Martínez): Aborda la importancia de la etiqueta en el ámbito empresarial y ofrece consejos prácticos.
- **Cómo ganar amigos e influir sobre las personas** (Dale Carnegie): Aunque no se centra exclusivamente en la etiqueta, trata sobre las relaciones interpersonales en un contexto profesional.
- **El arte de la comunicación** (Thich Nhat Hanh): Explora la comunicación efectiva, un aspecto clave en el comportamiento profesional.
- **Business Etiquette: 101 Ways to Conduct Business with Charm and Savvy** (Lydia Ramsey): Ofrece consejos sobre etiqueta en los negocios, similar al enfoque práctico del libro buscado.


### Ground truth utilizado
```
TEMA INFERIDO (el modelo no conoce este libro directamente, infiere desde similares):

El libro probablemente trata sobre la importancia de la etiqueta y el comportamiento profesional en diversas situaciones empresariales, ofreciendo consejos prácticos para mejorar las interacciones en el entorno laboral.

VOZ INFERIDA:
La voz del autor probablemente es directa y accesible, enfocándose en proporcionar consejos claros y aplicables para el lector.

LIBROS SIMILARES QUE COMPARTEN ADN CON ESTE:
- "La etiqueta en los negocios" (Rafael Martínez): Aborda la importancia de la etiqueta en el ámbito empresarial y ofrece consejos prácticos.
- "Cómo ganar amigos e influir sobre las personas" (Dale Carnegie): Aunque no se centra exclusivamente en la etiqueta, trata sobre las relaciones interpersonales ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- importancia de la etiqueta en el entorno laboral
- comportamiento profesional en situaciones de negocios
- consejos prácticos para mejorar interacciones empresariales
- presentación personal en contextos laborales
- mejora del comportamiento en videollamadas y reuniones

**Key terms:** etiqueta empresarial, comportamiento profesional, interacciones laborales, consejos de etiqueta, presentación personal

**Voz autorial:** La voz del autor es directa y accesible, enfocándose en ofrecer consejos claros y aplicables.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#CFD2D3, accent=#1F99D6, ink=#171A1C, contraste=11.50:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly addresses the importance of business etiquette and professional behavior, which aligns perfectly with the inferred theme of the book. Phrases like 'la etiqueta empresarial' and 'comportamiento profesional' are specific concepts that reflect the book's focus on improving workplace interactions. The content is tailored to the context of business etiquette, making it in

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content is specifically anchored to the themes of business etiquette and professional behavior, which align directly with the inferred ground truth of the book. Phrases like 'forging effective relationships in the workplace' and 'fostering an atmosphere of trust and respect' reflect the book's focus on practical advice for professional interactions. Additionally, the emphasis on first impresss

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la etiqueta empresarial sin referencias externas.
- EN: pagina — Voz directa y enfoque en la presentación personal.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.6 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.86**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 8
- Tokens totales: 9833
- Tiempo total: 42.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 616 tokens, 20213ms
- anchors: 2359 tokens, 5401ms
- palette: 0 tokens, 0ms
- content_es: 2483 tokens, 6528ms
- judge_es: 844 tokens, 1722ms
- content_en: 1908 tokens, 5278ms
- judge_en: 810 tokens, 2053ms
- voice: 813 tokens, 846ms
