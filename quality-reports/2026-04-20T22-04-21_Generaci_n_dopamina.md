# Quality Report — Generación dopamina

**Autor:** Anna Lembke
**Ejecutado:** 2026-04-20T22-04-21
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

¿Somos esclavos de la dopamina, la hormona de la felicidad? Combinando la neurociencia con impactantes casos reales, la psiquiatra Anna Lembke nos explica el precio personal y social de la búsqueda desenfrenada del placer en un libro que no deja a nadie indiferente.&#xa0; Tenemos un problema: nuestro cerebro ha evolucionado para evitar el dolor pero, a cambio, nos hemos vuelto adictos a los estímulos opuestos: drogas, comida, juego, compras, redes sociales, pornografía… La responsable es la dopamina, la sustancia química que gobierna los centros del placer y el dolor en el cerebro.&#xa0; Anna Lembke, psiquiatra y especialista en adicciones de la universidad de Stanford, explica por qué el consumo desenfrenado conduce a la adicción, la depresión y la ansieda...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la búsqueda desenfrenada del placer y su costo personal y social
- la adicción a estímulos como drogas, comida y redes sociales
- la relación entre dopamina, adicción, depresión y ansiedad
- historias reales de pacientes y su recuperación
- estrategias para mantener niveles saludables de dopamina

**Key terms:** dopamina, adicción, neurociencia, placer, dolor

**Voz autorial:** La voz de Anna Lembke es accesible y empática, combinando rigor científico con relatos humanos que ilustran sus puntos.

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
- Razón: The generated content directly references key concepts from the book, such as the role of dopamine in addiction and the balance between pleasure and pain. Phrases like 'la dopamina, hormona clave en este proceso' and 'los relatos de aquellos que han enfrentado la adicción' clearly anchor the content to Anna Lembke's work, making it specific and relevant to the book's themes.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes and concepts from the book, particularly the focus on dopamine's role in addiction and the balance between pleasure and pain. Phrases like 'Dopamine, the key hormone in this process' and 'the balance between pleasure and pain is essential for maintaining mental health' directly relate to the book's exploration of these ideas. However, some phrases,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.80)
- ES: pagina — Tono reflexivo y directo, sin referencias externas al libro.
- EN: pagina — Tono reflexivo y directo, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.9 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.93**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10363
- Tiempo total: 66.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41479ms
- anchors: 2695 tokens, 4298ms
- palette: 0 tokens, 0ms
- content_es: 2685 tokens, 5941ms
- judge_es: 1041 tokens, 1887ms
- content_en: 2121 tokens, 4883ms
- judge_en: 1008 tokens, 3822ms
- voice: 813 tokens, 4502ms
