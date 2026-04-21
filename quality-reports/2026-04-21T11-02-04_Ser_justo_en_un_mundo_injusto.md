# Quality Report — Ser justo en un mundo injusto

**Autor:** Ryan Holiday
**Ejecutado:** 2026-04-21T11-02-04
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
- compromiso personal de hacer lo correcto
- ejemplos históricos de justicia en acción
- la transición de la bondad a la grandeza
- la justicia en tiempos de corrupción

**Key terms:** estoicismo, virtudes estoicas, integridad personal, honor, carácter

**Voz autorial:** La voz de Ryan Holiday en este libro es directa y persuasiva, combinando reflexiones filosóficas con ejemplos históricos para motivar al lector a actuar con justicia.

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
- Razón: The generated content explicitly references key concepts from the ground truth, such as 'la justicia como virtud fundamental', 'hacer lo correcto', and 'la transición de la bondad a la grandeza'. It aligns closely with the themes presented in Ryan Holiday's book, emphasizing justice as a guiding principle and providing historical examples of individuals who embodied this virtue. The phrases used, 

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes and concepts presented in the ground truth, particularly the emphasis on justice as a guiding virtue and its role in personal character and greatness. Phrases like 'Justice is the guiding virtue of all our actions' and 'Integrity defines character' directly relate to the book's focus on justice and its importance in the context of stoicism. However

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre la justicia.
- EN: pagina — Voz directa y reflexiones sobre la justicia sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.85 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.9**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10796
- Tiempo total: 25.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 4897ms
- anchors: 2660 tokens, 5340ms
- palette: 0 tokens, 0ms
- content_es: 2780 tokens, 5297ms
- judge_es: 1142 tokens, 2237ms
- content_en: 2242 tokens, 5148ms
- judge_en: 1097 tokens, 2247ms
- voice: 875 tokens, 705ms
