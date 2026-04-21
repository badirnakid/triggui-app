# Quality Report — Cómo conocer a una persona

**Autor:** David Brooks
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

Hay una capacidad que yace en el corazón de cualquier persona o comunidad: la de ver a los demás —en su sentido más profundo— y hacerlos sentir valorados, respetados y comprendidos. Sin embargo, a nuestro alrededor hay personas que se sienten invisibles en una sociedad fragmentada, hostil e insensible al sufrimiento. David Brooks se nutre de la psicología y la neurociencia, así como del teatro, la filosofía y la historia para ofrecer un enfoque esperanzador sobre la conexión humana que nos enseña a realizar acciones concretas, pequeñas pero significativas: ser un buen oyente, pedir y ofrecer perdón, sentarse con quien sufre, mirar las cosas desde la perspectiva del otro… En pocas palabras: ser más comprensivos —y compasivos— con nuestros semejantes. Cómo co...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la capacidad de ver a los demás en su sentido más profundo
- acciones concretas para conectar con los demás
- ser un buen oyente y ofrecer perdón
- mirar las cosas desde la perspectiva del otro
- cultivar la compasión y la comprensión

**Key terms:** conexión humana, psicología, neurociencia, empatía, comprensión

**Voz autorial:** David Brooks utiliza un enfoque accesible y esperanzador, combinando disciplinas diversas para abordar la complejidad de las relaciones humanas.

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
- Razón: The generated content closely reflects the themes and concepts presented in the ground truth of David Brooks' book. It emphasizes the importance of deep human connection, empathy, and understanding others' perspectives, which are central to the book's message. Phrases like 'ser un buen oyente' and 'mirar las cosas desde la perspectiva del otro' directly align with the book's focus on compassion, a

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes and concepts presented in the ground truth of David Brooks' book. It emphasizes the importance of truly seeing others, being a good listener, and cultivating empathy and compassion, which are central ideas in the book's synopsis. Phrases like 'true connection fosters deep understanding' and 'compassion grows where understanding is nurtured' align, 

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre la conexión humana sin referencias meta.
- EN: pagina — Tono reflexivo y directo, sin referencias externas al autor.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.96**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9624
- Tiempo total: 20.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2067ms
- anchors: 2416 tokens, 4811ms
- palette: 0 tokens, 0ms
- content_es: 2564 tokens, 5038ms
- judge_es: 933 tokens, 1576ms
- content_en: 1997 tokens, 4620ms
- judge_en: 891 tokens, 1706ms
- voice: 823 tokens, 758ms
