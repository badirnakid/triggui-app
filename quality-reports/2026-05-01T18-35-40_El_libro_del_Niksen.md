# Quality Report — El libro del Niksen

**Autor:** Olga Mecking
**Ejecutado:** 2026-05-01T18-35-40
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

El estrés y el agotamiento son los males de nuestro siglo. ¿El antídoto? El niksen, un concepto holandés que significa, literalmente, «no hacer nada». Pero, ¿cómo podemos estar ociosos sin sentirnos culpables? Nuestra necesidad constante de trabajar y de ser productivos nos genera aún más estrés, lo que conlleva una disminución de la productividad. Por lo tanto, practicar la holgazanería tiene muchos beneficios, tanto emocionales como físicos. En este ingenioso libro, Olga Mecking ofrece consejos para que adoptes el niksen en el trabajo, en casa y en tu tiempo libre, y da las claves para que disfrutes de las pequeñas pausas de la vida y logres ser más feliz, más productivo y más creativo.

METADATA VERIFICADA:
- Título: El libro del Niksen
- Autor: Olga Mec...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- el arte de no hacer nada
- beneficios de la ociosidad
- practicar la holgazanería
- pausas para la felicidad
- aumento de la creatividad mediante el descanso

**Key terms:** niksen, holgazanería, productividad, estrés, bienestar emocional

**Voz autorial:** La voz de Olga Mecking es accesible y práctica, combinando consejos aplicables con un enfoque relajado sobre la importancia de la ociosidad en la vida moderna.

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
- Razón: El contenido generado utiliza conceptos específicos del libro, como 'niksen', 'holgazanería', y menciona la relación entre la ociosidad y la creatividad, que son centrales en la sinopsis. Además, se enfoca en el antídoto contra el estrés y la importancia de las pausas, alineándose perfectamente con el mensaje del libro.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly references the concept of 'niksen' and emphasizes the benefits of idleness, aligning perfectly with the book's themes of stress relief and productivity. Phrases like 'the power of setting aside the pressure of productivity' and 'embracing idleness' are specific to the book's message, making it highly relevant.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre el concepto de niksen.
- EN: pagina — Voz directa y reflexiones sobre el concepto de Niksen.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9105
- Tiempo total: 45.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 17910ms
- anchors: 2287 tokens, 7427ms
- palette: 0 tokens, 0ms
- content_es: 2463 tokens, 6578ms
- judge_es: 841 tokens, 2310ms
- content_en: 1893 tokens, 7249ms
- judge_en: 821 tokens, 2338ms
- voice: 800 tokens, 1419ms
- highlight_judge_es_parrafoTop: 656 tokens, 0ms
- highlight_judge_es_parrafoTop_retry: 652 tokens, 0ms
- highlight_judge_es_parrafoBot: 640 tokens, 0ms
- highlight_judge_en_parrafoTop: 641 tokens, 0ms
- highlight_judge_en_parrafoBot: 643 tokens, 0ms
