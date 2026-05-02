# Quality Report — Etiqueta y estilo en los negocios

**Autor:** Pachter Barbara
**Ejecutado:** 2026-05-02T03-23-41
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `model_inference`
- **Tier reached:** 3
- **Book identity confidence:** 0.60
- **Resolution path:** evidence_fetched_0sources → tier3_conf_0.80


### Libros similares considerados (inferencia)
- **El arte de la guerra** (Sun Tzu): Aunque es un texto antiguo sobre estrategia militar, se aplica a la estrategia en los negocios y la importancia de la presentación y el comportamiento en situaciones competitivas.
- **Cómo ganar amigos e influir sobre las personas** (Dale Carnegie): Este libro se centra en las relaciones interpersonales y la comunicación efectiva, temas que son fundamentales en el contexto empresarial.
- **La magia del orden** (Marie Kondo): Aunque se centra en la organización personal, también toca aspectos de la presentación y el comportamiento en el entorno profesional.
- **Los 7 hábitos de la gente altamente efectiva** (Stephen R. Covey): Este libro aborda principios de efectividad personal y profesional, incluyendo la importancia de la etiqueta y el comportamiento en los negocios.
- **Presentaciones que convencen** (Jill Schiefelbein): Se enfoca en la comunicación efectiva en el ámbito profesional, lo que es relevante para el tema de etiqueta y estilo en los negocios.


### Ground truth utilizado
```
TEMA INFERIDO (el modelo no conoce este libro directamente, infiere desde similares):

Etiqueta y comportamiento profesional en el entorno empresarial, con un enfoque en la comunicación y la presentación personal.

VOZ INFERIDA:
Práctica y directa, orientada a ofrecer consejos útiles y aplicables en situaciones cotidianas de negocios.

LIBROS SIMILARES QUE COMPARTEN ADN CON ESTE:
- "El arte de la guerra" (Sun Tzu): Aunque es un texto antiguo sobre estrategia militar, se aplica a la estrategia en los negocios y la importancia de la presentación y el comportamiento en situaciones competitivas.
- "Cómo ganar amigos e influir sobre las personas" (Dale Carnegie): Este libro se centra en las relaciones interpersonales y la comunicación efectiva, temas que son fundamentales en el contexto empresa...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- 101 consejos críticos para mejorar el comportamiento en situaciones empresariales
- importancia de la presentación personal en el entorno laboral
- comunicación efectiva en el ámbito profesional

**Key terms:** etiqueta empresarial, comportamiento profesional, presentación personal, comunicación efectiva, interacción con clientes

**Voz autorial:** Práctica y directa, orientada a ofrecer consejos útiles y aplicables en situaciones cotidianas de negocios.

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
- Razón: El contenido generado se ancla firmemente en el ground truth del libro al abordar específicamente la presentación personal y el comportamiento profesional en el entorno empresarial. Utiliza conceptos como 'marca personal', 'etiqueta empresarial' y 'comunicación efectiva', que son centrales en el tema inferido. Además, las frases y bloques de edición son relevantes y aplicables a situaciones cotidi

### EN
- Score: 0.90
- Usa conceptos específicos: true
- Razón: The content is highly relevant to the themes of professional behavior and personal presentation in a business context. It specifically addresses concepts like first impressions, body language, and business etiquette, which align closely with the inferred themes of the book. The phrases used are tailored to the business environment, making it less generic than typical self-help content.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la presentación personal sin referencias externas.
- EN: pagina — Voz directa y enfoque en la presentación personal.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.6 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.95 ← promedio de los 2 judges
- **Combined:** **0.84**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 8
- Tokens totales: 10057
- Tiempo total: 45.1s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 672 tokens, 21122ms
- anchors: 2395 tokens, 5530ms
- palette: 0 tokens, 0ms
- content_es: 2503 tokens, 6584ms
- judge_es: 902 tokens, 2791ms
- content_en: 1925 tokens, 5567ms
- judge_en: 868 tokens, 2322ms
- voice: 792 tokens, 793ms
- highlight_judge_es_parrafoTop: 639 tokens, 0ms
- highlight_judge_es_parrafoBot: 643 tokens, 0ms
- highlight_judge_en_parrafoTop: 639 tokens, 0ms
- highlight_judge_en_parrafoBot: 641 tokens, 0ms
