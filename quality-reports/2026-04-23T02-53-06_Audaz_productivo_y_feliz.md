# Quality Report — Audaz productivo y feliz

**Autor:** Robin Sharma
**Ejecutado:** 2026-04-23T02-53-06
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

Audaz, productivo y feliz constituye una valiosa guía para alcanzar la excelencia personal y profesional. Este libro ofrece propuestas prácticas que contribuirán a un cambio rápido en los hábitos diarios para alcanzar el máximo potencial de cada uno. Robin Sharma incluye aquí 36 módulos capaces de transformar radicalmente la dinámica vital para conducir al lector a horizontes profesionales y personales más elevados. El autor nos invita a reflexionar sobre la forma en que vivimos y trabajamos, y a comprometernos a introducir cambios de rumbo profundos para prosperar en todos los ámbitos de la vida. ** Robin Sharma es autor del best seller internacional El monje que vendió su Ferrari, con más de 5.000.000 de ejemplares vendidos Audaz, productivo y feliz te en...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- cambio rápido en los hábitos diarios
- máximo potencial personal
- enfoque equilibrado del éxito
- entorno propicio para la excelencia
- verdadero liderazgo

**Key terms:** excelencia personal, productividad, transformación, liderazgo, hábitos diarios

**Voz autorial:** La voz de Robin Sharma es motivadora y directa, enfocada en la acción y el desarrollo personal, utilizando un lenguaje accesible y práctico.

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
- Razón: The generated content directly reflects the core themes and concepts from the ground truth of 'Audaz, productivo y feliz' by Robin Sharma. It emphasizes the importance of transforming daily habits, achieving personal excellence, and creating an environment conducive to success, all of which are explicitly mentioned in the book's synopsis. The phrases used are specific to the book's teachings and,,

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The generated content reflects several key concepts from the ground truth, such as the importance of transforming daily habits and creating an environment conducive to excellence. Phrases like 'unlock your maximum potential' and 'ongoing journey' resonate with the book's themes. However, the content is somewhat generic and could apply to various self-help contexts, which prevents a perfect score.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y tono coherente con el contenido del libro.
- EN: pagina — Voz directa y tono coherente con el libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 0.85 ← promedio de los 2 judges
- **Combined:** **0.9**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9438
- Tiempo total: 64.3s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 42658ms
- anchors: 2428 tokens, 4538ms
- palette: 0 tokens, 0ms
- content_es: 2515 tokens, 5310ms
- judge_es: 898 tokens, 4048ms
- content_en: 1941 tokens, 5137ms
- judge_en: 874 tokens, 1607ms
- voice: 782 tokens, 1005ms
