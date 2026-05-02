# Quality Report — Crea tu segundo cerebro

**Autor:** Tiago Forte
**Ejecutado:** 2026-05-02T11-51-32
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

A WALL STREET JOURNAL BESTSELLER A FINANCIAL TIMESBUSINESS BOOK OF THE MONTH A FAST COMPANY TOP SUMMER PICK Un sistema revolucionario para mejorar tu productividad, pensar de forma más creativa y recordar y poner en práctica tus mejores ideas. Por primera vez en la historia, tenemos acceso instantáneo a todo el conocimiento que existe. Nunca ha habido un mejor momento para aprender, crear cosas nuevas y mejorar. Sin embargo, ese flujo continuo de información a menudo nos abruma en lugar de empoderarnos. El mismo conocimiento que se suponía que debía liberarnos nos ha llevado al estrés paralizante de creer que nunca sabremos o recordaremos lo suficiente. Descubre todo el potencial de tus ideas y transforma lo que sabes en mejoras más potentes y significativa...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- sistema revolucionario para mejorar la productividad
- transformar el conocimiento en mejoras significativas
- gestionar el flujo continuo de información

**Key terms:** segundo cerebro, productividad, creatividad, estrés paralizante, potencial de ideas

**Voz autorial:** La voz de Tiago Forte es clara y práctica, enfocándose en la aplicación de conceptos para mejorar la vida diaria y el trabajo del lector.

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
- Razón: The content directly references the concept of a 'segundo cerebro' and emphasizes managing information overload, which are central themes in the book's synopsis. It also discusses transforming knowledge into action and reducing stress, aligning closely with the book's focus on productivity and creativity.

### EN
- Score: 0.90
- Usa conceptos específicos: true
- Razón: The content closely aligns with the book's themes of productivity, knowledge management, and the concept of a 'second brain.' Phrases like 'transform your knowledge into action' and 'building a second brain' directly reference the book's core ideas, making it highly specific to 'Crea tu segundo cerebro.' While the language is motivational, it remains anchored to the book's unique concepts.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la acción personal.
- EN: pagina — Voz directa y enfoque en la acción personal.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.95 ← promedio de los 2 judges
- **Combined:** **0.94**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9212
- Tiempo total: 24.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3099ms
- anchors: 2384 tokens, 4528ms
- palette: 0 tokens, 0ms
- content_es: 2443 tokens, 9209ms
- judge_es: 818 tokens, 1337ms
- content_en: 1899 tokens, 3521ms
- judge_en: 848 tokens, 1843ms
- voice: 820 tokens, 827ms
- highlight_judge_es_parrafoTop: 644 tokens, 0ms
- highlight_judge_es_parrafoBot: 643 tokens, 0ms
- highlight_judge_en_parrafoTop: 643 tokens, 0ms
- highlight_judge_en_parrafoBot: 644 tokens, 0ms
- highlight_judge_en_parrafoBot_retry: 648 tokens, 0ms
