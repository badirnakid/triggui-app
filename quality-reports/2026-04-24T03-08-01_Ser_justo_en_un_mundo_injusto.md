# Quality Report — Ser justo en un mundo injusto

**Autor:** Ryan Holiday
**Ejecutado:** 2026-04-24T03-08-01
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.85
- **Resolution path:** evidence_fetched_3sources
- **Match score:** 0.74



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

«Ryan Holiday ha llevado las antiguas enseñanzas del estoicismo a millones de lectores, desde atletas y políticos hasta directores ejecutivos». Good Morning America Una poderosa llamada a la acción para hacer lo correcto. Este es el tercer libro de la serie «Las 4 virtudes estoicas» de Ryan Holiday, autor superventas de The New York Times. Para los antiguos, la justicia iba mucho más allá que lo que sucedía en un tribunal. Era mucho más urgente que las ideas que se debatían en las aulas de Filosofía. Implicaba una forma de vida, el compromiso personal de hacer lo correcto por difícil que fuera. Para Marco Aurelio, cualquier acto de injusticia era «una blasfemia». Cicerón afirmó que el sentido del honor y el carácter de una persona definen sus actos. En Ser ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la justicia como virtud fundamental
- compromiso personal con lo correcto
- ejemplos históricos de justicia en acción
- la transición de la bondad a la grandeza
- la justicia en la era de corrupción

**Key terms:** estoicismo, virtudes estoicas, integridad personal, honor, carácter

**Voz autorial:** Ryan Holiday utiliza un tono persuasivo y reflexivo, combinando ejemplos históricos con una llamada a la acción moral.

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
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects the core themes and concepts from the ground truth of Ryan Holiday's book, such as the importance of justice as a guiding virtue, the transition from goodness to greatness, and the emphasis on integrity and honor. Phrases like 'La justicia es la virtud que rige todas las demás' and references to historical figures acting out of a strong sense of justice are 

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects the themes and concepts presented in the ground truth, particularly the emphasis on justice as a guiding virtue and the call to action in the face of injustice. Phrases like 'the virtue that guides all significant decisions' and 'the journey from goodness to greatness' are closely aligned with Ryan Holiday's arguments in 'Ser justo en un mundo injusto', thus

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre la justicia sin referencias externas.
- EN: pagina — Tono directo y reflexivo, sin referencias meta.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.85 ← del tier de grounding alcanzado
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
- Tokens totales: 10596
- Tiempo total: 65.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 43517ms
- anchors: 2671 tokens, 5425ms
- palette: 0 tokens, 0ms
- content_es: 2733 tokens, 7424ms
- judge_es: 1105 tokens, 1865ms
- content_en: 2189 tokens, 4671ms
- judge_en: 1074 tokens, 1634ms
- voice: 824 tokens, 908ms
