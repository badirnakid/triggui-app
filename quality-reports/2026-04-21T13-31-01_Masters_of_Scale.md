# Quality Report — Masters of Scale

**Autor:** Reid Hoffman, June Cohen & Deron Triff
**Ejecutado:** 2026-04-21T13-31-01
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

What can you learn from a Silicon Valley legend and a pantheon of iconic leaders? The key to scaling a successful business isn’t talent, network, or strategy. It’s an entrepreneurial mindset—and that mindset can be cultivated. “If you’re scaling a company—or if you just love a well-told story—this is a book to savor.”—Robert Iger, #1 New York Times bestselling author&#xa0;of The Ride&#xa0;of&#xa0;a Lifetime Behind the scenes in Silicon Valley, Reid Hoffman (founder of LinkedIn, investor at Greylock) is a sought-after adviser to heads of companies and heads of state. On each&#xa0;episode of his podcast, Masters of Scale, he sits down with a guest from an all-star list of visionary founders and leaders, digging into the surprising strategies that power their&...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la mentalidad emprendedora como clave para escalar un negocio
- estrategias sorprendentes de líderes icónicos
- principios contraintuitivos para el éxito empresarial
- la importancia de alinear ganancias y valores
- historias reveladoras de fundadores de empresas exitosas

**Key terms:** mentalidad emprendedora, estrategia de escalamiento, contratación de talento, análisis de mercado, valores empresariales

**Voz autorial:** La voz autorial es clara, persuasiva y está respaldada por experiencias y relatos concretos de líderes en el ámbito empresarial, lo que le da un enfoque práctico y accesible.

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
- Razón: The generated content directly reflects key concepts from the book's ground truth, such as the importance of an entrepreneurial mindset, learning from failures, and aligning profits with values. Phrases like 'mentalidad emprendedora' and 'estrategias sorprendentes' are specific to the themes discussed in 'Masters of Scale', making it clear that the content is anchored to the book.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content reflects key concepts from the ground truth, such as the importance of an entrepreneurial mindset and learning from failures, which are central themes in 'Masters of Scale.' Phrases like 'transform challenges into stepping stones' and 'align profits with values' resonate with the book's focus on cultivating a mindset for business success. However, while the content is specific to the '

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en la mentalidad emprendedora.
- EN: pagina — Voz directa y enfoque en el contenido del libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
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
- Tokens totales: 10660
- Tiempo total: 23.1s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 1647ms
- anchors: 2650 tokens, 7358ms
- palette: 0 tokens, 1ms
- content_es: 2800 tokens, 5618ms
- judge_es: 1132 tokens, 2522ms
- content_en: 2211 tokens, 3682ms
- judge_en: 1093 tokens, 1580ms
- voice: 774 tokens, 706ms
