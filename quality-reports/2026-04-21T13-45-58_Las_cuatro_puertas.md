# Quality Report — Las cuatro puertas

**Autor:** Jorge Benito
**Ejecutado:** 2026-04-21T13-45-58
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

La plenitud psicológica depende enteramente de nuestros estados de conciencia. El antídoto contra la ansiedad, la desesperación, la mediocridad, el aburrimiento existencial y el nihilismo que nos limitan como individuos -y como sociedad- es recuperar el orden interno. Existen cuatro puertas interiores que nos conducen a esa conquista: el dominio de nuestra energía mental, el establecimiento de una dirección de vida significativa, la adquisición de habilidades relevantes y el coraje para explorar e integrar las partes no develadas del ser que aún están envueltas en sombra. Estas son las cuatro puertas que deberás abrir. Dentro de las páginas de este libro encontrarás cada una de las llaves que te permitirá crear orden en la conciencia y aventurarte al mundo ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- dominio de nuestra energía mental
- dirección de vida significativa
- adquisición de habilidades relevantes
- coraje para explorar partes no develadas del ser

**Key terms:** plenitud psicológica, orden interno, ansiedad, nihilismo, consciencia

**Voz autorial:** La voz autorial es reflexiva y orientada a la autoayuda, enfocándose en el crecimiento personal y la búsqueda del sentido en un mundo caótico.

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
- Razón: The generated content directly references key concepts from the ground truth, such as 'dominio de nuestra energía mental', 'coraje para explorar', and 'dirección de vida significativa'. These terms are specific to the book's themes and framework, making the content highly relevant and anchored to the book's message.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects the key concepts from the ground truth of the book, such as 'mastering mental energy', 'exploring the unexplored parts of oneself', and 'meaningful life direction'. It uses specific terms and ideas presented in the synopsis, making it highly relevant and anchored to the book's themes.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y tono coherente con la obra.
- EN: pagina — Tono directo y reflexivo, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9031
- Tiempo total: 20.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2330ms
- anchors: 2243 tokens, 4780ms
- palette: 0 tokens, 0ms
- content_es: 2453 tokens, 4982ms
- judge_es: 815 tokens, 1657ms
- content_en: 1903 tokens, 4180ms
- judge_en: 791 tokens, 2110ms
- voice: 826 tokens, 656ms
