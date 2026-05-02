# Quality Report — La inteligencia que asusta

**Autor:** Mo Gawdat
**Ejecutado:** 2026-05-02T11-51-32
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `google_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Google Books):

Mo Gawdat, autor bestseller y exdirector ejecutivo de Google, denuncia en La inteligencia que asusta los peligros de la evolución descontrolada de la inteligencia artificial y propone un modelo para protegernos a nosotros mismos, a quienes amamos y al planeta. «La tecnología está llevando a la humanidad a una situación de riesgo sin precedentes. Este libro no es para los ingenieros que escriben el código ni para los políticos que prometen regularla. Este libro es para ti: lo creas o no, eres el único que puede solucionar esta situación.» —Mo Gawdat La inteligencia artificial tiene ventaja sobre los humanos: puede procesar información a la velocidad de la luz y llevar a cabo tareas específicas sin distraerse, además de predecir resultados futuros o de ver á...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- peligros de la evolución descontrolada de la inteligencia artificial
- modelo para protegernos de la IA
- impacto de los algoritmos en la vida humana
- corregir la trayectoria de la inteligencia artificial
- futuro de la IA en favor de la humanidad

**Key terms:** inteligencia artificial, algoritmos, tecnología, humanidad, modelo de protección

**Voz autorial:** La voz de Gawdat es directa, urgente y accesible, buscando involucrar al lector común en un tema de alta complejidad técnica.

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
- Razón: The generated content directly reflects key themes from the book, such as the dangers of uncontrolled AI evolution and the responsibility of humans in designing algorithms. Phrases like 'desarrollar un modelo de protección' and 'la evolución descontrolada de la IA' are specific to Mo Gawdat's arguments, making it highly relevant and not generic.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes and concepts presented in the ground truth of Mo Gawdat's book. It discusses the dangers of unchecked AI development, the responsibility of users in shaping algorithms, and the need for a protective model, all of which are central to the book's message. Phrases like 'unchecked evolution breeds perilous consequences' and 'correct the trajectory of人工



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre la IA sin referencias externas.
- EN: pagina — Tono directo y reflexivo, sin referencias meta al autor.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.92 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9893
- Tiempo total: 22.3s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 1092ms
- anchors: 2414 tokens, 5326ms
- palette: 0 tokens, 0ms
- content_es: 2615 tokens, 6952ms
- judge_es: 984 tokens, 1400ms
- content_en: 2064 tokens, 3580ms
- judge_en: 981 tokens, 2726ms
- voice: 835 tokens, 1075ms
- highlight_judge_es_parrafoTop: 639 tokens, 0ms
- highlight_judge_es_parrafoBot: 636 tokens, 0ms
- highlight_judge_en_parrafoTop: 638 tokens, 0ms
- highlight_judge_en_parrafoBot: 632 tokens, 0ms
