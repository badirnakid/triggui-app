# Quality Report — Viaje al optimismo

**Autor:** Eduardo Punset
**Ejecutado:** 2026-05-02T03-23-41
**Pipeline:** nucleus-canonical-v3.7.1

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

Nos sobran razones para pensar en un futuro mejor. «El pasado fue siempre peor, y no hay duda de que el futuro será mejor.» Ese mensaje orienta el Viaje al optimismo al que nos invita Eduardo Punset. Los constantes avances científicos, que recorreremos con el autor, justifican abordar con entusiasmo el futuro. En este viaje, Punset desmiente que la crisis sea planetaria, proclama la obligada redistribución del trabajo mientras la esperanza de vida aumenta dos años y medio cada década, y recuerda que ya no es posible vivir sin las redes sociales. Hoy, afirma, «la manada reclama el liderazgo de los jóvenes», es más necesario que nunca «aprender a desaprender» y debemos asumir que la gestión de las emociones es una prioridad inexcusable.

METADATA VERIFICADA:
...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- el pasado fue siempre peor
- el futuro será mejor
- redistribución del trabajo
- esperanza de vida aumenta dos años y medio cada década
- gestión de las emociones como prioridad

**Key terms:** optimismo, crisis planetaria, redes sociales, liderazgo de los jóvenes, aprender a desaprender

**Voz autorial:** La voz de Punset es reflexiva y esperanzadora, combinando ciencia con una perspectiva optimista sobre el futuro.

---

## 🎨 Visual synthesis

- hue_primary: 60
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#D3D3CF, accent=#B8D61F, ink=#1B1C17, contraste=11.42:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly references key concepts from the book, such as the increase in life expectancy, the importance of emotional management, and the need for work redistribution. Phrases like 'el futuro es un lienzo en blanco' and 'la gestión de las emociones es una prioridad inexcusable' are closely tied to the themes presented in 'Viaje al optimismo', making it highly specific and not,

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects key concepts from the ground truth, such as the idea that 'the past has always been worse' and the importance of managing emotions and embracing youth leadership. It also mentions the increase in life expectancy, which is a specific detail from the book. This makes it highly anchored to the book's themes.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.80)
- ES: pagina — Voz directa y reflexiones sobre el contenido del libro.
- EN: pagina — Voz directa y tono coherente con el contenido del libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.9 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlight_en_parrafoTop_residual_warning
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9329
- Tiempo total: 38.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 16883ms
- anchors: 2322 tokens, 5281ms
- palette: 0 tokens, 0ms
- content_es: 2485 tokens, 7050ms
- judge_es: 876 tokens, 1402ms
- content_en: 1943 tokens, 4138ms
- judge_en: 834 tokens, 2637ms
- voice: 869 tokens, 636ms
- highlight_judge_es_parrafoTop: 640 tokens, 0ms
- highlight_judge_es_parrafoBot: 641 tokens, 0ms
- highlight_judge_en_parrafoTop: 642 tokens, 0ms
- highlight_judge_en_parrafoTop_retry: 649 tokens, 0ms
- highlight_judge_en_parrafoBot: 647 tokens, 0ms
