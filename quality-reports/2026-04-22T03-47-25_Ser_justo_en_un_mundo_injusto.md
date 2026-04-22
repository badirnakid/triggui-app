# Quality Report — Ser justo en un mundo injusto

**Autor:** Ryan Holiday
**Ejecutado:** 2026-04-22T03-47-25
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
- la importancia de la integridad personal

**Key terms:** estoicismo, virtudes, injusticia, honor, carácter

**Voz autorial:** La voz de Ryan Holiday es directa y persuasiva, combinando ejemplos históricos con un llamado a la acción moral, lo que invita al lector a reflexionar sobre su propio compromiso con la justicia.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: complementary
- typography: serif_moderno
- Resultado: paper=#CFD2D3, accent=#129DE2, ink=#171A1C, contraste=11.50:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects the core themes and concepts from the ground truth of Ryan Holiday's book, particularly the emphasis on justice as a fundamental virtue and its role in guiding actions. Phrases like 'La justicia es la virtud que rige todas las demás' and 'compromiso personal con lo correcto' are explicitly aligned with the book's message about the importance of justice in a 

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects the core themes of Ryan Holiday's book, particularly the emphasis on justice as a fundamental virtue and its role in guiding actions. Phrases like 'Justice represents the cornerstone of all virtues' and 'personal commitment to doing what is right' align closely with the book's focus on justice as essential for personal integrity and societal change, as noted

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre la justicia sin referencias externas.
- EN: pagina — Voz directa y reflexiones sobre la justicia sin referencias externas.

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
- Tokens totales: 10674
- Tiempo total: 61.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40147ms
- anchors: 2674 tokens, 5310ms
- palette: 0 tokens, 0ms
- content_es: 2763 tokens, 6190ms
- judge_es: 1123 tokens, 1850ms
- content_en: 2198 tokens, 5055ms
- judge_en: 1070 tokens, 2266ms
- voice: 846 tokens, 803ms
