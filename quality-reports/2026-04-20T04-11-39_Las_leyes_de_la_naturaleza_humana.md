# Quality Report — Las leyes de la naturaleza humana

**Autor:** Robert Greene
**Ejecutado:** 2026-04-20T04-11-39
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `model_inference`
- **Tier reached:** 3
- **Book identity confidence:** 0.60
- **Resolution path:** evidence_fetched_0sources → tier3_conf_0.80


### Libros similares considerados (inferencia)
- **El arte de la guerra** (Sun Tzu): Ambos libros abordan estrategias y tácticas en relaciones humanas y conflictos.
- **Los 48 leyes del poder** (Robert Greene): Otro libro del mismo autor que explora la manipulación y el poder en las interacciones humanas.
- **La psicología del dinero** (Morgan Housel): Explora la naturaleza humana en relación con el dinero y las decisiones financieras.
- **Influence: The Psychology of Persuasion** (Robert B. Cialdini): Aborda cómo las personas pueden ser influenciadas y manipuladas en sus decisiones.


### Ground truth utilizado
```
TEMA INFERIDO (el modelo no conoce este libro directamente, infiere desde similares):

El libro probablemente explora la naturaleza humana en términos de comportamiento, motivaciones y estrategias en las relaciones interpersonales y el poder.

VOZ INFERIDA:
Es probable que la voz del autor sea analítica, persuasiva y con un enfoque pragmático, similar a su estilo en otros trabajos.

LIBROS SIMILARES QUE COMPARTEN ADN CON ESTE:
- "El arte de la guerra" (Sun Tzu): Ambos libros abordan estrategias y tácticas en relaciones humanas y conflictos.
- "Los 48 leyes del poder" (Robert Greene): Otro libro del mismo autor que explora la manipulación y el poder en las interacciones humanas.
- "La psicología del dinero" (Morgan Housel): Explora la naturaleza humana en relación con el dinero y las decisi...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- exploración de las motivaciones humanas
- estrategias de poder en relaciones interpersonales
- manipulación y persuasión en el comportamiento humano
- análisis de la naturaleza humana en conflictos
- tácticas para entender y manejar las emociones ajenas

**Key terms:** naturaleza humana, poder, manipulación, estrategias, comportamiento

**Voz autorial:** La voz de Robert Greene es analítica y persuasiva, con un enfoque pragmático que invita a la reflexión y a la aplicación de sus conceptos.

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
- Score: 0.90
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: El contenido generado se ancla fuertemente en la exploración de la naturaleza humana y las dinámicas de poder, conceptos centrales en el ground truth. Frases como 'Las emociones son la base de nuestras decisiones' y 'La manipulación no siempre es negativa' reflejan directamente los temas de comportamiento y estrategias en relaciones interpersonales. Aunque el contenido es específico y relevante, y

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content specifically addresses themes of human nature, emotions, motivations, and power dynamics, which align closely with the inferred themes of the book. Phrases like 'Understanding emotions reveals the heart of human motivations' and 'Power strategies are essential for navigating conflicts' reflect the book's focus on interpersonal relationships and strategies. However, some phrases are a a

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de preguntas directas y tono reflexivo propio del texto.
- EN: pagina — Tono directo y preguntas personales sugieren voz del autor.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.6 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.85 ← promedio de los 2 judges
- **Combined:** **0.81**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 8
- Tokens totales: 9610
- Tiempo total: 56.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 525 tokens, 29358ms
- anchors: 2265 tokens, 7129ms
- palette: 0 tokens, 1ms
- content_es: 2496 tokens, 6526ms
- judge_es: 810 tokens, 2759ms
- content_en: 1978 tokens, 6716ms
- judge_en: 771 tokens, 2029ms
- voice: 765 tokens, 1507ms
