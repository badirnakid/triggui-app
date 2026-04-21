# Quality Report — Empieza con el porqué

**Autor:** Simon Sinek
**Ejecutado:** 2026-04-21T11-43-12
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_4sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

Nueva presentación del primer libro de Simon Sinek que ya se ha convertido en un verdadero clásico y en la base de toda su obra.&#xa0; Para Sinek, lo importante no es tanto qué es lo que haces como el porqué lo haces. Lo esencial es saber por qué haces lo que haces, por qué existes. Aprender a formular las preguntas adecuadas te permitirá tener una empresa inspiradora, proyectos innovadores y gente comprometida para desarrollarlos. Sinek explica cómo crear el marco adecuado en una organización para conseguir esos propósitos.&#xa0;

METADATA VERIFICADA:
- Título: Empieza con el porqué
- Autor: Simon Sinek
- Año: 2018
- Categorías: Administración y liderazgo, Libros, Negocios y finanzas personales
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la importancia de entender el 'porqué' detrás de nuestras acciones
- formular preguntas adecuadas para inspirar a otros
- crear un marco organizacional que fomente el compromiso y la innovación

**Key terms:** propósito, inspiración, compromiso, marco organizacional, liderazgo

**Voz autorial:** La voz de Sinek es motivadora y reflexiva, enfocándose en la conexión emocional y el significado detrás de las acciones.

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
- Razón: The generated content directly reflects the core concepts of Simon Sinek's book, particularly the emphasis on understanding the 'porqué' (why) behind actions and its impact on leadership and innovation. Phrases like 'Entender el 'porqué' detrás de cada acción' and 'Formular preguntas adecuadas es clave para inspirar a otros' are explicitly tied to the themes presented in the ground truth, making a

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects key concepts from the ground truth, such as the importance of understanding the 'why' behind actions and formulating the right questions to inspire others. Phrases like 'creating an organizational framework that prioritizes the 'why'' and 'clarity of purpose' are specific to Simon Sinek's ideas in 'Empieza con el porqué', making the content highly relevant.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en el propósito personal.
- EN: pagina — Tono directo y reflexivo, sin referencias externas al autor.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 8917
- Tiempo total: 22.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2588ms
- anchors: 2293 tokens, 6172ms
- palette: 0 tokens, 0ms
- content_es: 2410 tokens, 4324ms
- judge_es: 796 tokens, 1780ms
- content_en: 1848 tokens, 3979ms
- judge_en: 766 tokens, 3240ms
- voice: 804 tokens, 676ms
