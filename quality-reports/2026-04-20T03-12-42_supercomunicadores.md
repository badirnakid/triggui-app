# Quality Report — supercomunicadores

**Autor:** charles duhigg
**Ejecutado:** 2026-04-20T03-12-42
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `model_inference`
- **Tier reached:** 3
- **Book identity confidence:** 0.60
- **Resolution path:** evidence_fetched_0sources → tier3_conf_0.80


### Libros similares considerados (inferencia)
- **Hablar en público para Dummies** (Julio César Fernández): Aborda técnicas de comunicación efectiva y habilidades para hablar en público.
- **Comunicación no violenta** (Marshall B. Rosenberg): Explora la comunicación efectiva y empática, que puede relacionarse con el tema de la supercomunicación.
- **El arte de la comunicación** (Thich Nhat Hanh): Se centra en la comunicación consciente y efectiva, un aspecto importante para ser un 'supercomunicador'.
- **Cómo ganar amigos e influir sobre las personas** (Dale Carnegie): Un clásico sobre habilidades interpersonales y comunicación persuasiva.


### Ground truth utilizado
```
TEMA INFERIDO (el modelo no conoce este libro directamente, infiere desde similares):

El libro probablemente trata sobre técnicas y habilidades para mejorar la comunicación interpersonal y la capacidad de influir en los demás de manera efectiva.

VOZ INFERIDA:
La voz del autor podría ser práctica y motivacional, enfocándose en consejos aplicables y ejemplos de la vida real.

LIBROS SIMILARES QUE COMPARTEN ADN CON ESTE:
- "Hablar en público para Dummies" (Julio César Fernández): Aborda técnicas de comunicación efectiva y habilidades para hablar en público.
- "Comunicación no violenta" (Marshall B. Rosenberg): Explora la comunicación efectiva y empática, que puede relacionarse con el tema de la supercomunicación.
- "El arte de la comunicación" (Thich Nhat Hanh): Se centra en la comunicación...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- técnicas para mejorar la comunicación interpersonal
- habilidades para influir efectivamente en los demás
- consejos prácticos para la comunicación
- ejemplos de supercomunicadores en la vida real

**Key terms:** comunicación efectiva, influencia, habilidades interpersonales, persuasión, conexión emocional

**Voz autorial:** La voz del autor es práctica y motivacional, centrada en consejos aplicables y ejemplos reales.

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
- Score: 0.90
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The content is highly relevant to the inferred themes of the book, focusing on emotional connection, empathy, and influence in communication. Phrases like 'la conexión emocional' and 'técnicas que fomenten la empatía' directly relate to the book's focus on interpersonal communication skills. The motivational tone and practical advice align well with the inferred voice of the author. While it is a 

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content reflects the inferred theme of the book by focusing on emotional connection and empathy as key elements of effective communication. Phrases like 'emotional connection' and 'empathy is the cornerstone of effective communication' directly relate to the skills and techniques for improving interpersonal communication. However, while it is specific to the inferred themes, the language used,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas retóricas sin referencias externas.
- EN: pagina — Voz directa y enfoque en la conexión emocional sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.6 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.85 ← promedio de los 2 judges
- **Combined:** **0.8**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 8
- Tokens totales: 8702
- Tiempo total: 51.2s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 526 tokens, 28681ms
- anchors: 2248 tokens, 6202ms
- palette: 0 tokens, 1ms
- content_es: 2025 tokens, 5537ms
- judge_es: 810 tokens, 2513ms
- content_en: 1542 tokens, 4934ms
- judge_en: 776 tokens, 2479ms
- voice: 775 tokens, 886ms
