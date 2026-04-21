# Quality Report — La ciencia del éxito

**Autor:** Napoleon Hill
**Ejecutado:** 2026-04-21T02-16-30
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

Enestecurso magistral,dictadooriginalmenteen Chicago amediados de losañoscincuenta,Napoleon Hilldesarrolla aprofundidad sus ideassobreeléxito ycómollegar aél . Durante décadas, Piense y hágase rico ha cambiado la mentalidad de millones de personas, que han encontrado en sus principios y filosofía una guía para alcanzar el triunfo y el equilibrio en su vida, pero nunca hasta ahora había sido posible acceder a las lecciones íntegras que el mismo Napoleon Hill impartió a sus alumnos iniciales. La ciencia del éxito es un valioso regalo, es el camino más directo hacia el perfeccionamiento de tu verdadero potencial, y uno de los libros de desarrollo personal más completos que se han escrito jamás. Ya sea que quieras descubrir tu propósito en la vida, desarrollar ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- descubrir tu propósito en la vida
- desarrollar una personalidad atrayente
- adquirir una actitud mental positiva
- atraer oportunidades
- nutrir tu creatividad y tu imaginación

**Key terms:** éxito, mentalidad positiva, liderazgo, creatividad, potencial

**Voz autorial:** La voz autorial de Napoleon Hill es motivacional y didáctica, enfocándose en la autoayuda y el empoderamiento personal a través de principios claros y prácticos.

---

## 🎨 Visual synthesis

- hue_primary: 45
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: triadic
- typography: sans_humanista
- Resultado: paper=#D3D3CF, accent=#E2D112, ink=#1C1B17, contraste=11.48:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 0.80
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content closely aligns with the themes and concepts presented in 'La ciencia del éxito' by Napoleon Hill, particularly the emphasis on discovering one's purpose, cultivating a positive mindset, and the importance of creativity and leadership. Phrases like 'descubrir tu propósito en la vida' and 'mentalidad positiva' directly reflect the book's core teachings. However, some phrases, e

### EN
- Score: 0.50
- Usa conceptos específicos: true
- Razón: The content reflects some concepts from the ground truth, such as discovering one's purpose and maintaining a positive mindset, which are central themes in Napoleon Hill's work. However, the language is generic enough that it could apply to any self-help book, lacking specific references to Hill's unique principles or terminology.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y motivacional, sin referencias externas.
- EN: pagina — Voz directa y motivacional, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.85 ← anti-genericidad de anchors
- **grounding_judge:** 0.65 ← promedio de los 2 judges
- **Combined:** **0.84**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9169
- Tiempo total: 61.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41140ms
- anchors: 2334 tokens, 5888ms
- palette: 0 tokens, 0ms
- content_es: 2488 tokens, 5071ms
- judge_es: 865 tokens, 1836ms
- content_en: 1903 tokens, 5205ms
- judge_en: 821 tokens, 1497ms
- voice: 758 tokens, 1029ms
