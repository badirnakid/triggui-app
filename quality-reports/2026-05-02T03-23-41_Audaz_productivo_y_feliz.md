# Quality Report — Audaz productivo y feliz

**Autor:** Robin Sharma
**Ejecutado:** 2026-05-02T03-23-41
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

Audaz, productivo y feliz constituye una valiosa guía para alcanzar la excelencia personal y profesional. Este libro ofrece propuestas prácticas que contribuirán a un cambio rápido en los hábitos diarios para alcanzar el máximo potencial de cada uno. Robin Sharma incluye aquí 36 módulos capaces de transformar radicalmente la dinámica vital para conducir al lector a horizontes profesionales y personales más elevados. El autor nos invita a reflexionar sobre la forma en que vivimos y trabajamos, y a comprometernos a introducir cambios de rumbo profundos para prosperar en todos los ámbitos de la vida. ** Robin Sharma es autor del best seller internacional El monje que vendió su Ferrari, con más de 5.000.000 de ejemplares vendidos Audaz, productivo y feliz te en...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- cambio rápido en los hábitos diarios
- máximo potencial personal
- enfoque equilibrado del éxito
- entorno propicio para la excelencia
- verdadero liderazgo

**Key terms:** excelencia personal, rendimiento extraordinario, aprendizaje continuo, transformación vital, compromiso con el cambio

**Voz autorial:** La voz de Robin Sharma es motivacional y directa, enfocándose en la acción y la transformación personal.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#CFD1D3, accent=#127AE2, ink=#171A1C, contraste=11.42:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects the key concepts from the book, such as 'cambio rápido en los hábitos diarios', 'máximo potencial', 'enfoque equilibrado del éxito', and 'verdadero liderazgo'. These phrases are specific to the themes presented in 'Audaz, productivo y feliz', demonstrating a clear connection to the ground truth.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes and concepts presented in Robin Sharma's book, such as transforming daily habits, achieving personal potential, and fostering a conducive environment for excellence. Phrases like 'unlocking your maximum personal potential' and 'continuous learning' directly reflect the book's focus on personal and professional excellence, making it specific to '



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y motivacional, sin referencias externas al libro.
- EN: pagina — Voz directa y enfoque en hábitos personales sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9679
- Tiempo total: 37.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 17075ms
- anchors: 2435 tokens, 4738ms
- palette: 0 tokens, 0ms
- content_es: 2551 tokens, 6286ms
- judge_es: 943 tokens, 2234ms
- content_en: 1992 tokens, 3564ms
- judge_en: 918 tokens, 2773ms
- voice: 840 tokens, 864ms
- highlight_judge_es_parrafoTop: 653 tokens, 0ms
- highlight_judge_es_parrafoTop_retry: 653 tokens, 0ms
- highlight_judge_es_parrafoBot: 647 tokens, 0ms
- highlight_judge_en_parrafoTop: 649 tokens, 0ms
- highlight_judge_en_parrafoBot: 645 tokens, 0ms
