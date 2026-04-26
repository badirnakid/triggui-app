# Quality Report — El monje que vendió su Ferrari

**Autor:** Robin Sharma
**Ejecutado:** 2026-04-26T19-46-39
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_3sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

El monje que vendió su Ferrari es una fábula espiritual que, desde hace más de quince años, ha marcado la vida de millones de personas en todo el mundo. A través de sus páginas, conocemos la extraordinaria historia de Julian Mantle, un abogado de éxito que, tras sufrir un ataque al corazón, debe afrontar el gran vacío de su existencia. Inmerso en esta crisis existencial, Julian toma la radical decisión de vender todas sus pertenencias y viajar a la India. Es en un monasterio del Himalaya donde aprende las sabias y profundas lecciones de los monjes sobre la felicidad, el coraje, el equilibrio y la paz interior. Con esta historia tan especial e inolvidable, Robin Sharma nos enseña, paso a paso, una nueva manera de enfocar la vida personal, profesional y famil...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- la búsqueda de la paz interior
- la importancia del equilibrio en la vida
- lecciones de sabiduría de los monjes
- la transformación personal a través de la crisis
- la dirección clara en el recorrido vital

**Key terms:** fábula espiritual, crisis existencial, armonía interior, felicidad, coraje

**Voz autorial:** La voz de Robin Sharma es inspiradora y reflexiva, guiando al lector a través de una narrativa que combina elementos de fábula con enseñanzas prácticas para la vida.

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
- Score: 0.70
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The content reflects themes from the book, such as the journey towards inner peace and the importance of balance in life, which are central to Julian Mantle's story. However, it lacks specific references to Julian's transformation or the monastic teachings he encounters, making it less anchored to the book's unique narrative.

### EN
- Score: 0.30
- Usa conceptos específicos: false
- Razón: The content discusses themes like inner peace and balance, which are relevant to the book, but it lacks specific references to Julian Mantle's journey or the teachings from the monks in the Himalayas. It could apply to any self-help book.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre el tema.
- EN: pagina — Tono reflexivo y directo, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.85 ← anti-genericidad de anchors
- **grounding_judge:** 0.5 ← promedio de los 2 judges
- **Combined:** **0.79**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9552
- Tiempo total: 35.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 10860ms
- anchors: 2411 tokens, 5456ms
- palette: 0 tokens, 0ms
- content_es: 2559 tokens, 6484ms
- judge_es: 915 tokens, 3532ms
- content_en: 1983 tokens, 5993ms
- judge_en: 875 tokens, 1811ms
- voice: 809 tokens, 985ms
- highlight_judge_es_parrafoTop: 646 tokens, 0ms
- highlight_judge_es_parrafoBot: 641 tokens, 0ms
- highlight_judge_en_parrafoTop: 650 tokens, 0ms
- highlight_judge_en_parrafoTop_retry: 652 tokens, 0ms
- highlight_judge_en_parrafoBot: 634 tokens, 0ms
