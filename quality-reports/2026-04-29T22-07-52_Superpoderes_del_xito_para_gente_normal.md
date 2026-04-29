# Quality Report — Superpoderes del éxito para gente normal

**Autor:** Mago More
**Ejecutado:** 2026-04-29T22-07-52
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

¿Cómo consigue Mago More ser socio de cinco empresas, guionista del programa de José Mota, cómico, impartir conferencias, dar cursos de formación, tener un espacio habitual en radio, colaborar asiduamente en prensa, asistir a actos sociales y benéficos, y ahora escribir un libro? Parece cosa de magia, pero tiene truco: con unos objetivos claros y un sencillo método puedes conseguir muchas más cosas de las que piensas. Y para muestra, él mismo. Pero las páginas de este libro esconden otro tipo de magia: si te descargas la aplicación que el Mago More ha creado podrás acceder a contenido extra en realidad aumentada. Sí, amigo, ¡un libro que habla! Y todo ello con el objetivo de ayudar al lector a dominar los mismos superpoderes que utiliza Mago More para mejor...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- objetivos claros como clave del éxito
- método sencillo para lograr más
- transformación personal de desastre a éxito
- contenido extra en realidad aumentada
- superpoderes para mejorar la vida diaria

**Key terms:** superpoderes, realidad aumentada, método Mago More, transformación personal, objetivos claros

**Voz autorial:** La voz del autor es cercana, motivacional y con un toque de humor, utilizando su experiencia personal como ejemplo para inspirar a los lectores.

---

## 🎨 Visual synthesis

- hue_primary: 50
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#D3D3CF, accent=#E2E212, ink=#1C1C17, contraste=11.39:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 0.80
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The content reflects the book's themes of setting clear objectives and using a simple method to achieve success, which aligns with Mago More's approach. Phrases like 'objetivos claros' and 'método sencillo' are specific to the book's premise. However, the language is somewhat generic and could apply to other self-help literature, which prevents a perfect score.

### EN
- Score: 0.30
- Usa conceptos específicos: false
- Razón: The content discusses clear objectives and personal transformation, which are general self-help concepts. It lacks specific references to Mago More's unique methods or the augmented reality aspect of the book, making it applicable to any self-help book.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en el contenido del libro.
- EN: pagina — Voz directa y consejos prácticos sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.55 ← promedio de los 2 judges
- **Combined:** **0.82**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9207
- Tiempo total: 42.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 20198ms
- anchors: 2339 tokens, 5615ms
- palette: 0 tokens, 0ms
- content_es: 2480 tokens, 6099ms
- judge_es: 861 tokens, 2297ms
- content_en: 1907 tokens, 5551ms
- judge_en: 814 tokens, 1673ms
- voice: 806 tokens, 891ms
- highlight_judge_es_parrafoTop: 640 tokens, 0ms
- highlight_judge_es_parrafoBot: 645 tokens, 0ms
- highlight_judge_en_parrafoTop: 637 tokens, 0ms
- highlight_judge_en_parrafoBot: 650 tokens, 0ms
