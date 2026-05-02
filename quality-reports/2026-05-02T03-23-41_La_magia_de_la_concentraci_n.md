# Quality Report — La magia de la concentración

**Autor:** DAIGO
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

Llega a México el experto en concentración que conquistódurante más de un año las listas de más vendidos en Japón. Entiende cómo funciona tu mente, aumenta la concentración, el rendimiento y la productividad en tu vida profesional y personal. La magia de la concentración presenta técnicas y estrategias para incrementar tu fuerza de voluntad, evitar el cansancio mental y fortalecer tus hábitos. Luego de varios años con problemas de hiperactividad, el pequeño Dai Go se cansó de todo el acoso escolar del que era víctima; tanto fue su hartazgo que decidió leer e investigar hasta convertirse en experto del tema. Actualmente DaiGo aparece con regularidad en la televisión japonesa, revistas y redes sociales de aquel país asiático. Además, es reconocido por haber d...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- técnicas para incrementar la fuerza de voluntad
- estrategias para evitar el cansancio mental
- método revolucionario para mejorar la concentración
- aumento del rendimiento y la productividad
- fortalecimiento de hábitos personales y profesionales

**Key terms:** concentración, fuerza de voluntad, cansancio mental, productividad, hábitos

**Voz autorial:** La voz de Daigo es accesible y motivadora, combinando experiencias personales con técnicas prácticas que permiten al lector aplicar fácilmente los conceptos en su vida diaria.

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
- Razón: The content directly references concepts from the book, such as 'concentration', 'strengthening willpower', and 'avoiding mental fatigue'. It aligns closely with the book's focus on techniques for improving concentration and productivity, making it specific to 'La magia de la concentración'.

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects concepts from the book, such as training concentration and enhancing willpower, which are central themes in DaiGo's work. However, it lacks specific references to the author's unique methods or personal story, making it somewhat generic.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y consejos prácticos sin referencias externas.
- EN: pagina — Voz directa y consejos prácticos sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.85 ← promedio de los 2 judges
- **Combined:** **0.91**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- author_truncated: "DAIGO"

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9241
- Tiempo total: 37.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 17143ms
- anchors: 2333 tokens, 5920ms
- palette: 0 tokens, 0ms
- content_es: 2489 tokens, 5178ms
- judge_es: 847 tokens, 1321ms
- content_en: 1931 tokens, 4001ms
- judge_en: 824 tokens, 2347ms
- voice: 817 tokens, 898ms
- highlight_judge_es_parrafoTop: 642 tokens, 0ms
- highlight_judge_es_parrafoBot: 645 tokens, 0ms
- highlight_judge_en_parrafoTop: 640 tokens, 0ms
- highlight_judge_en_parrafoBot: 644 tokens, 0ms
