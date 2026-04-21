# Quality Report — Come muévete y duerme

**Autor:** Tom Rath
**Ejecutado:** 2026-04-21T02-16-30
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `model_inference`
- **Tier reached:** 3
- **Book identity confidence:** 0.60
- **Resolution path:** evidence_fetched_0sources → tier3_conf_0.80


### Libros similares considerados (inferencia)
- **El poder del ahora** (Eckhart Tolle): Aborda la importancia de vivir en el presente y cómo esto afecta nuestra salud mental y bienestar.
- **Cómo ganar amigos e influir sobre las personas** (Dale Carnegie): Enfocado en mejorar las relaciones interpersonales y el bienestar a través de decisiones y hábitos positivos.
- **La magia del orden** (Marie Kondo): Explora cómo el orden y la organización pueden influir en nuestra vida diaria y bienestar.
- **Despierta tu héroe interior** (Victor Hugo Manzanilla): Inspira a adoptar hábitos que mejoren la vida personal y profesional.


### Ground truth utilizado
```
TEMA INFERIDO (el modelo no conoce este libro directamente, infiere desde similares):

Adopción de hábitos saludables y su impacto en la calidad de vida y bienestar personal.

VOZ INFERIDA:
Motivacional y práctico, con un enfoque en la autoayuda y el desarrollo personal.

LIBROS SIMILARES QUE COMPARTEN ADN CON ESTE:
- "El poder del ahora" (Eckhart Tolle): Aborda la importancia de vivir en el presente y cómo esto afecta nuestra salud mental y bienestar.
- "Cómo ganar amigos e influir sobre las personas" (Dale Carnegie): Enfocado en mejorar las relaciones interpersonales y el bienestar a través de decisiones y hábitos positivos.
- "La magia del orden" (Marie Kondo): Explora cómo el orden y la organización pueden influir en nuestra vida diaria y bienestar.
- "Despierta tu héroe interior" (Vic...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- adopción de hábitos saludables
- impacto de la dieta en la energía diaria
- importancia del ejercicio para el bienestar
- beneficios del sueño reparador
- mejora de relaciones a través de decisiones saludables

**Key terms:** hábitos saludables, bienestar personal, calidad de vida, dieta equilibrada, ejercicio regular

**Voz autorial:** Motivacional y práctico, enfocado en la autoayuda y el desarrollo personal, ofreciendo consejos accesibles para mejorar la vida diaria.

---

## 🎨 Visual synthesis

- hue_primary: 140
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#CFD3D0, accent=#1FD65C, ink=#171C19, contraste=11.41:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The content is highly specific to the themes of adopting healthy habits and their impact on personal well-being, directly reflecting the inferred ground truth of the book. Phrases like 'cada pequeña decisión que tomas' and 'la dieta equilibrada y el ejercicio regular son aliados poderosos' clearly align with the focus on healthy habits and their benefits. The motivational tone and practical advice

### EN
- Score: 0.90
- Usa conceptos específicos: true
- Razón: The content is highly specific to the themes of adopting healthy habits and their impact on personal well-being, which aligns closely with the inferred ground truth. Phrases like 'embracing healthy habits' and 'impact your personal well-being' directly reflect the book's focus. The motivational tone and practical advice also resonate with the inferred voice of the book, making it less generic and,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en hábitos personales.
- EN: pagina — Voz directa y consejos prácticos sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.6 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.95 ← promedio de los 2 judges
- **Combined:** **0.83**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 8
- Tokens totales: 9581
- Tiempo total: 46.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 610 tokens, 19733ms
- anchors: 2348 tokens, 7413ms
- palette: 0 tokens, 1ms
- content_es: 2434 tokens, 9130ms
- judge_es: 801 tokens, 1893ms
- content_en: 1845 tokens, 5134ms
- judge_en: 767 tokens, 1685ms
- voice: 776 tokens, 1023ms
