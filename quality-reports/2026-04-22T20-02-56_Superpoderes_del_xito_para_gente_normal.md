# Quality Report — Superpoderes del éxito para gente normal

**Autor:** Mago More
**Ejecutado:** 2026-04-22T20-02-56
**Pipeline:** nucleus-canonical-v3

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

¿Cómo consigue Mago More ser socio de cinco empresas, guionista del programa de José Mota, cómico, impartir conferencias, dar cursos de formación, tener un espacio habitual en radio, colaborar asiduamente en prensa, asistir a actos sociales y benéficos, y ahora escribir un libro? Parece cosa de magia, pero tiene truco: con unos objetivos claros y un sencillo método puedes conseguir muchas más cosas de las que piensas. Y para muestra, él mismo. Pero las páginas de este libro esconden otro tipo de magia: si te descargas la aplicación que el Mago More ha creado podrás acceder a contenido extra en realidad aumentada. Sí, amigo, ¡un libro que habla! Y todo ello con el objetivo de ayudar al lector a dominar los mismos superpoderes que utiliza Mago More para mejor...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- objetivos claros como clave del éxito
- método sencillo para alcanzar metas
- transformación personal desde el fracaso
- superpoderes para mejorar la vida
- contenido extra en realidad aumentada

**Key terms:** superpoderes, objetivos, método, transformación, realidad aumentada

**Voz autorial:** La voz de Mago More es cercana y motivadora, con un toque de humor que hace accesible la superación personal.

---

## 🎨 Visual synthesis

- hue_primary: 45
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#D3D2CF, accent=#D6A81F, ink=#1C1B17, contraste=11.40:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 0.70
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The content generated reflects the themes of personal transformation and learning from failures, which align with the book's focus on achieving success through clear objectives and a simple method. However, while it uses concepts like 'superpoderes' and 'objetivos claros', it lacks direct references to Mago More's unique approach or the augmented reality aspect of the book, making it somewhat less

### EN
- Score: 0.30
- Usa conceptos específicos: false
- Razón: The generated content discusses personal transformation and learning from failures, which are common themes in self-help literature. However, it does not specifically reference the unique concepts or methods presented in 'Superpoderes del éxito para gente normal' by Mago More, such as the idea of using clear objectives or the augmented reality features of the book. Therefore, it feels generic and,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la transformación personal.
- EN: pagina — Voz directa y enfoque en la transformación personal.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 0.5 ← promedio de los 2 judges
- **Combined:** **0.8**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9203
- Tiempo total: 62.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41012ms
- anchors: 2323 tokens, 4789ms
- palette: 0 tokens, 0ms
- content_es: 2484 tokens, 5352ms
- judge_es: 863 tokens, 2259ms
- content_en: 1911 tokens, 4926ms
- judge_en: 814 tokens, 3041ms
- voice: 808 tokens, 1156ms
