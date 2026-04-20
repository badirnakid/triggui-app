# Quality Report — Cómo conocer a una persona

**Autor:** David Brooks
**Ejecutado:** 2026-04-20T02-38-08
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `model_inference`
- **Tier reached:** 3
- **Book identity confidence:** 0.52
- **Resolution path:** evidence_fetched_0sources → tier3_conf_0.70


### Libros similares considerados (inferencia)
- **El arte de amar** (Erich Fromm): Explora las relaciones humanas y la comprensión del amor y la conexión entre las personas.
- **Los hombres son de Marte, las mujeres son de Venus** (John Gray): Aborda las diferencias en la comunicación y las relaciones entre hombres y mujeres.
- **Cómo ganar amigos e influir sobre las personas** (Dale Carnegie): Se centra en las habilidades interpersonales y la construcción de relaciones efectivas.
- **Inteligencia emocional** (Daniel Goleman): Analiza cómo las emociones afectan nuestras interacciones y relaciones.


### Ground truth utilizado
```
TEMA INFERIDO (el modelo no conoce este libro directamente, infiere desde similares):

El libro probablemente trata sobre la comprensión de las relaciones interpersonales y cómo conectar con los demás de manera efectiva.

VOZ INFERIDA:
Es probable que la voz del autor sea reflexiva y orientada a la autoayuda, con un enfoque en la psicología y la sociología de las relaciones.

LIBROS SIMILARES QUE COMPARTEN ADN CON ESTE:
- "El arte de amar" (Erich Fromm): Explora las relaciones humanas y la comprensión del amor y la conexión entre las personas.
- "Los hombres son de Marte, las mujeres son de Venus" (John Gray): Aborda las diferencias en la comunicación y las relaciones entre hombres y mujeres.
- "Cómo ganar amigos e influir sobre las personas" (Dale Carnegie): Se centra en las habilidades i...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- comprensión de las relaciones interpersonales
- conectar efectivamente con los demás
- la importancia de la empatía
- desarrollo de habilidades sociales
- la psicología detrás de las interacciones humanas

**Key terms:** relaciones interpersonales, empatía, conexión, habilidades sociales, psicología social

**Voz autorial:** La voz de David Brooks es reflexiva y orientada a la autoayuda, con un enfoque en la psicología y la sociología de las relaciones.

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
- Razón: The content is highly relevant to the inferred themes of the book, focusing on empathy and interpersonal relationships, which are central to understanding human connections. It uses specific concepts such as 'empatía', 'conexión auténtica', and 'habilidades sociales', aligning closely with the book's focus on psychology and sociology of relationships. The phrases and ideas presented are not so far

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content reflects the inferred themes of the book well, particularly through the focus on empathy and understanding emotions in relationships, which aligns with the psychological and sociological aspects of interpersonal connections. Phrases like 'Empathy bridges the gap in relationships' and 'Understanding emotions enhances connection' directly relate to the inferred ground truth. However, the

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Tono directo y reflexivo, sin referencias externas al libro.
- EN: pagina — El texto presenta ideas en primera persona sobre empatía y conexiones.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.52 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.85 ← promedio de los 2 judges
- **Combined:** **0.79**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 8
- Tokens totales: 8836
- Tiempo total: 51.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 518 tokens, 29678ms
- anchors: 2240 tokens, 5079ms
- palette: 0 tokens, 1ms
- content_es: 2068 tokens, 6642ms
- judge_es: 836 tokens, 1848ms
- content_en: 1585 tokens, 5126ms
- judge_en: 775 tokens, 2356ms
- voice: 814 tokens, 881ms
