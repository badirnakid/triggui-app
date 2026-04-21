# Quality Report — La inteligencia que asusta

**Autor:** Mo Gawdat
**Ejecutado:** 2026-04-21T02-16-30
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.86
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 0.78



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

Mo Gawdat, autor bestseller y exdirector ejecutivo de Google, denuncia en La inteligencia que asusta los peligros de la evolución descontrolada de la inteligencia artificial y propone un modelo para protegernos a nosotros mismos, a quienes amamos y al planeta. «La tecnología está llevando a la humanidad a una situación de riesgo sin precedentes. Este libro no es para los ingenieros que escriben el código ni para los políticos que prometen regularla. Este libro es para ti: lo creas o no, eres el único que puede solucionar esta situación.» —Mo Gawdat La inteligencia artificial tiene ventaja sobre los humanos: puede procesar información a la velocidad de la luz y llevar a cabo tareas específicas sin distraerse, además de predecir resultados futuros o de ver án...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- peligros de la evolución descontrolada de la inteligencia artificial
- modelo para protegernos de la IA
- la responsabilidad de los usuarios en el diseño de algoritmos
- cómo asegurar que la IA trabaje a nuestro favor
- la tecnología y su impacto en la humanidad

**Key terms:** inteligencia artificial, algoritmos, tecnología, usuarios, futuro

**Voz autorial:** La voz de Mo Gawdat es directa y accesible, con un enfoque en la urgencia de la situación actual sobre la inteligencia artificial, combinando su experiencia personal con un llamado a la acción para el lector.

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
- Razón: The generated content directly reflects key concepts from the ground truth, such as the responsibility of users in the development of AI, the dangers of uncontrolled AI evolution, and the notion that technology should work for humanity. Phrases like 'los algoritmos que guían su desarrollo son reflejo de nuestras decisiones' and 'Protegernos de la IA no es tarea de ingenieros ni políticos; es nossa

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects the themes and concepts outlined in the ground truth, specifically addressing the dangers of unchecked AI evolution and the responsibility of users in shaping technology. Phrases like 'algorithms guiding its development are a reflection of our choices' and 'protecting ourselves from AI isn’t the job of engineers or politicians' are closely aligned with Mo Gā

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre el papel del lector.
- EN: pagina — Tono directo y reflexivo, sin referencias meta al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.86 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.93**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9872
- Tiempo total: 64.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41500ms
- anchors: 2449 tokens, 6502ms
- palette: 0 tokens, 1ms
- content_es: 2634 tokens, 5675ms
- judge_es: 984 tokens, 2218ms
- content_en: 2060 tokens, 5343ms
- judge_en: 944 tokens, 2282ms
- voice: 801 tokens, 1013ms
