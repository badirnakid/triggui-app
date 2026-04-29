# Quality Report — ¿Envejeces o rejuveneces?

**Autor:** Sari Arponen
**Ejecutado:** 2026-04-29T22-07-52
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_1sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

Dale vida a los años y no sólo años a la vida Piensa en envejecer. ¿Qué imagen te viene a la mente? ¿Una etapa vital dorada y activa en movimiento, disfrutando con tus amigos y entrenando cuerpo y mente? ¿O más bien asocias la palabra envejecimiento a fragilidad, pérdidas o impotencia? Pues has de saber que el envejecimiento orgánico comienza mucho antes de que lo veamos por fuera o lo sintamos por dentro. No es algo que «te sucede» sin remedio de un día para otro. De hecho, puedes optar por rejuvenecer mientras cumples años. Depende de tus decisiones: la longevidad saludable no es un mito, sino una realidad al alcance de tu mano, si conoces las herramientas adecuadas. En este nuevo libro, la Dra. Sari Arponen explora los conceptos de edad, salud y envejeci...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- longevidad saludable como decisión personal
- herramientas para rejuvenecer en el proceso de envejecimiento
- reflexión sobre la muerte y la humanidad
- pautas concretas para una vida plena
- estrategias de alimentación y ejercicio para el bienestar

**Key terms:** longevidad, rejuvenecimiento, células madre, terapias génicas, salud

**Voz autorial:** La voz de Sari Arponen es reflexiva y directa, combinando información científica con un enfoque práctico y accesible para el lector.

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
- Razón: The generated content closely reflects the themes and concepts from the book's ground truth, such as the importance of conscious decisions for healthy aging and the idea that rejuvenation is a choice. Phrases like 'longevidad saludable' and 'decisiones conscientes' directly align with the book's focus on actionable strategies for well-being and aging.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes of aging, rejuvenation, and conscious decision-making presented in the ground truth. Phrases like 'healthy longevity' and 'rejuvenation is a viable option' reflect the book's focus on proactive aging and wellness strategies. However, it lacks specific references to the author's unique insights or tools discussed in the book.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas personales.
- EN: pagina — Voz directa y enfoque en decisiones personales sobre bienestar.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.88 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9907
- Tiempo total: 41.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 17348ms
- anchors: 2568 tokens, 6038ms
- palette: 0 tokens, 1ms
- content_es: 2613 tokens, 6470ms
- judge_es: 978 tokens, 2665ms
- content_en: 2016 tokens, 4885ms
- judge_en: 948 tokens, 2714ms
- voice: 784 tokens, 1140ms
- highlight_judge_es_parrafoTop: 649 tokens, 0ms
- highlight_judge_es_parrafoBot: 645 tokens, 0ms
- highlight_judge_en_parrafoTop: 647 tokens, 0ms
- highlight_judge_en_parrafoTop_retry: 642 tokens, 0ms
- highlight_judge_en_parrafoBot: 650 tokens, 0ms
