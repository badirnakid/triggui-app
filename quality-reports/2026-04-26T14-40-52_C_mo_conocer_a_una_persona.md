# Quality Report — Cómo conocer a una persona

**Autor:** David Brooks
**Ejecutado:** 2026-04-26T14-40-52
**Pipeline:** nucleus-canonical-v3.6

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_preloaded
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

Hay una capacidad que yace en el corazón de cualquier persona o comunidad: la de ver a los demás —en su sentido más profundo— y hacerlos sentir valorados, respetados y comprendidos. Sin embargo, a nuestro alrededor hay personas que se sienten invisibles en una sociedad fragmentada, hostil e insensible al sufrimiento. David Brooks se nutre de la psicología y la neurociencia, así como del teatro, la filosofía y la historia para ofrecer un enfoque esperanzador sobre la conexión humana que nos enseña a realizar acciones concretas, pequeñas pero significativas: ser un buen oyente, pedir y ofrecer perdón, sentarse con quien sufre, mirar las cosas desde la perspectiva del otro… En pocas palabras: ser más comprensivos —y compasivos— con nuestros semejantes. Cómo co...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- la importancia de ver a los demás en su sentido más profundo
- acciones concretas para la conexión humana
- ser un buen oyente y ofrecer perdón
- mirar las cosas desde la perspectiva del otro
- cultivar la compasión en las relaciones

**Key terms:** conexión humana, compasión, empatía, perspectiva, escucha activa

**Voz autorial:** La voz de David Brooks es reflexiva y accesible, combinando insights de diversas disciplinas para enfatizar la importancia de las relaciones humanas.

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
- Razón: El contenido generado refleja de manera precisa los conceptos centrales del libro, como la importancia de ver a los demás en su profundidad y la escucha activa, que son temas clave en la sinopsis. Las frases y bloques de edición se alinean con la idea de conexión humana y compasión, lo que demuestra un anclaje fuerte al ground_truth del libro.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content directly reflects the core themes of David Brooks' book, emphasizing the importance of seeing others deeply, active listening, and compassion. Phrases like 'seeing others in their deepest sense' and 'active listening' are specific concepts from the ground truth, making it highly relevant and not generic.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre la conexión humana sin referencias externas.
- EN: pagina — Voz directa y consejos prácticos sobre la conexión humana.

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
- Tokens totales: 9697
- Tiempo total: 32.1s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2ms
- anchors: 2360 tokens, 6573ms
- palette: 0 tokens, 1ms
- content_es: 2581 tokens, 13807ms
- judge_es: 954 tokens, 2192ms
- content_en: 2034 tokens, 6777ms
- judge_en: 919 tokens, 1674ms
- voice: 849 tokens, 965ms
