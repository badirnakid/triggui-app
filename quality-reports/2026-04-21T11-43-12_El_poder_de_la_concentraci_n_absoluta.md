# Quality Report — El poder de la concentración absoluta

**Autor:** Dandapani
**Ejecutado:** 2026-04-21T11-43-12
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.88
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 0.83



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

En la época de la distracción, Dandapani enseña a los lectores a liberarse del ruido que constantemente reclama nuestra atención y así podamos enfocarse en lo que realmente importa. La vida que deseas está a tu alcance, pero para ello debes dominar el poder de la concentración absoluta. Ansiedad, estrés, preocupación, miedo… Todos estos males se han convertido en una plaga que contribuye a nuestra infelicidad, e incluso provoca o agrava ciertas enfermedades. El reconocido monje y conferencista internacional Dandapani nos muestra cómo el dominio de una sola capacidad, la de la concentración, puede permitirnos traspasar de forma permanente esas pesadas barreras mentales que nos alejan de la vida que anhelamos. Dandapani destila toda la sabiduría que acumuló c...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- liberarse del ruido que reclama nuestra atención
- dominio de la concentración para superar barreras mentales
- prácticas diarias para incrementar el foco

**Key terms:** concentración, distracción, conciencia, fuerza de voluntad, práctica diaria

**Voz autorial:** La voz de Dandapani es clara y práctica, combinando su experiencia como monje con un enfoque accesible para el lector moderno.

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
- Razón: The generated content closely reflects the themes and concepts presented in the ground truth, specifically focusing on the importance of concentration, overcoming mental barriers, and the practical steps to achieve a focused life. Phrases like 'liberarse del ruido' and 'dominio de la concentración' directly relate to the core messages of Dandapani's teachings, making it specific to this book.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes and concepts outlined in the ground truth. It emphasizes the importance of concentration, the need to free oneself from distractions, and the idea of mastering attention to achieve a fulfilling life, all of which are central to Dandapani's teachings. Specific phrases like 'mastering concentration' and 'aligning your awareness and willpower' are in,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre la concentración.
- EN: pagina — Voz directa y enfoque en la práctica personal.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.88 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.94**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- author_truncated: "Dandapani"

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10114
- Tiempo total: 22.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3706ms
- anchors: 2448 tokens, 4777ms
- palette: 0 tokens, 0ms
- content_es: 2648 tokens, 5196ms
- judge_es: 1021 tokens, 1929ms
- content_en: 2118 tokens, 4619ms
- judge_en: 1009 tokens, 1662ms
- voice: 870 tokens, 904ms
