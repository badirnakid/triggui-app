# Quality Report — La disciplina marcará tu destino

**Autor:** Ryan Holiday
**Ejecutado:** 2026-04-22T03-47-25
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.85
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 0.75



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

«Ryan Holiday ha traído las antiguas enseñanzas del estoicismo a millones de lectores, desde atletas y políticos hasta directores ejecutivos». Good Morning America Un inspirador tributo al poder y la promesa de la autodisciplina; este es el segundo libro de la serie «Las 4 virtudes estoicas» de Ryan Holiday, autor superventas y referente internacional del estoicismo moderno. Para conquistar el mundo, uno debe conquistarse primero a sí mismo: las emociones, las acciones y los pensamientos. Eisenhower dijo que la libertad es la práctica de la autodisciplina. Cicerón definió la virtud de la templanza como el esplendor de la vida. Sin límites ni autocontrol, no solo nos arriesgamos a no alcanzar nuestro potencial y a perder lo que hemos logrado, sino que, ademá...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la autodisciplina como virtud esencial
- gobernar en lugar de ser gobernado
- la templanza como camino hacia la realización
- autocontrol en tiempos de exceso
- la historia de figuras ejemplares que practicaron la autodisciplina

**Key terms:** templanza, autodominio, autocontrol, virtudes estoicas, límites personales

**Voz autorial:** La voz de Ryan Holiday es clara y persuasiva, combinando la sabiduría antigua del estoicismo con ejemplos contemporáneos, lo que lo hace accesible y relevante para el lector moderno.

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
- Razón: The generated content directly reflects the core themes and concepts from the ground truth of Ryan Holiday's book, particularly focusing on the importance of self-discipline and temperance as essential virtues. Phrases like 'autodisciplina' and 'templanza' are explicitly mentioned, aligning with the book's emphasis on self-control and personal limits. The content is specific to the book's message,

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The generated content reflects key concepts from the ground truth, such as self-discipline, temperance, and self-mastery, which are central themes in Ryan Holiday's book. Phrases like 'setting personal boundaries' and 'self-governance' align with the book's focus on self-control and discipline. However, the language is somewhat generic and could be applied to other self-help contexts, which is why

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en la autodisciplina.
- EN: pagina — Voz directa y reflexiones sobre la autodisciplina sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.85 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.85 ← promedio de los 2 judges
- **Combined:** **0.88**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10759
- Tiempo total: 58.2s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40656ms
- anchors: 2701 tokens, 3629ms
- palette: 0 tokens, 0ms
- content_es: 2799 tokens, 4911ms
- judge_es: 1141 tokens, 2021ms
- content_en: 2210 tokens, 4477ms
- judge_en: 1099 tokens, 1788ms
- voice: 809 tokens, 734ms
