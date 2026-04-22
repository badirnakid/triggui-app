# Quality Report — Empieza con el porqué

**Autor:** Simon Sinek
**Ejecutado:** 2026-04-22T20-02-56
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_3sources
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
- la importancia del 'porqué' en los negocios
- preguntas adecuadas para el liderazgo
- creación de un marco organizacional inspirador
- compromiso en proyectos innovadores
- definición del propósito de una empresa

**Key terms:** propósito, liderazgo, inspiración, compromiso, marco organizacional

**Voz autorial:** La voz de Sinek es motivacional y reflexiva, centrada en la conexión emocional y la claridad de propósito.

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
- Razón: The generated content directly reflects the core concepts of Simon Sinek's book, particularly the emphasis on understanding the 'why' behind actions and its impact on organizational purpose and commitment. Phrases like 'El 'porqué' es la esencia de cada acción' and 'Definir el propósito de una empresa es el primer paso hacia un compromiso genuino' are explicitly tied to the themes presented in the

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content closely reflects the core concepts of Simon Sinek's 'Start with Why', particularly the emphasis on understanding one's 'why' and its importance in leadership and organizational commitment. Phrases like 'the essence of every action we take' and 'defining a company's purpose' directly relate to Sinek's ideas. However, while it is specific to the book's themes, some phrases could be seen,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre el propósito.
- EN: pagina — Uso de voz directa y enfoque en el propósito personal.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 8830
- Tiempo total: 63.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40608ms
- anchors: 2286 tokens, 4830ms
- palette: 0 tokens, 1ms
- content_es: 2395 tokens, 5532ms
- judge_es: 783 tokens, 4811ms
- content_en: 1824 tokens, 4420ms
- judge_en: 749 tokens, 2278ms
- voice: 793 tokens, 896ms
