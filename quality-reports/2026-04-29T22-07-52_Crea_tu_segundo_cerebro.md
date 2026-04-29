# Quality Report — Crea tu segundo cerebro

**Autor:** Tiago Forte
**Ejecutado:** 2026-04-29T22-07-52
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_1sources
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
- transformar ideas en mejoras significativas
- acceso instantáneo al conocimiento
- gestionar el flujo continuo de información
- crear un segundo cerebro para empoderar la creatividad

**Key terms:** productividad, creatividad, conocimiento, segundo cerebro, estrés paralizante

**Voz autorial:** La voz autorial de Tiago Forte es clara y motivadora, enfocándose en la transformación personal a través de un sistema práctico que facilita el manejo del conocimiento y la creatividad.

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
- Razón: The content directly references key concepts from the book, such as 'crear un segundo cerebro', 'gestionar el flujo continuo de información', and emphasizes the transformation of ideas into action, which are central themes in the ground truth.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects key concepts from the book, such as the idea of creating a 'second brain' to manage information and enhance productivity. Phrases like 'transform your ideas into action' and 'knowledge is meant to empower' align closely with the book's themes of using knowledge effectively rather than being overwhelmed by it.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la acción personal.
- EN: pagina — Tono directo y enfoque en la acción personal.

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
- Tokens totales: 9190
- Tiempo total: 37.2s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 17260ms
- anchors: 2414 tokens, 4391ms
- palette: 0 tokens, 1ms
- content_es: 2458 tokens, 5832ms
- judge_es: 810 tokens, 1767ms
- content_en: 1893 tokens, 4805ms
- judge_en: 819 tokens, 1921ms
- voice: 796 tokens, 828ms
- highlight_judge_es_parrafoTop: 650 tokens, 0ms
- highlight_judge_es_parrafoBot: 650 tokens, 0ms
- highlight_judge_en_parrafoTop: 646 tokens, 0ms
- highlight_judge_en_parrafoBot: 641 tokens, 0ms
