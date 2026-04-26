# Quality Report — El arte de conquistar lectores

**Autor:** Pilar Gordoa
**Ejecutado:** 2026-04-26T19-46-39
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

«En un mundo cada vez más competitivo en el queexiste una saturación de productos y donde una nuevaera digital está desafiando a todas las industrias,resulta de vital importancia que replanteemosel rol que juega elmarketing editorial.» Esta obra única fusiona las experiencias profesionales de su autora con las memorias de una editorial que ha presenciado una transformación radical en la industria del libro durante las primeras décadas del siglo XXI. Desde los días en que el marketing era visto con escepticismo hasta la revolución digital y las innovaciones que han cambiado completamente las reglas del juego, estas páginas ofrecen un viaje esencial para triunfar en el siempre cambiante mundo de la creación y promoción de contenidos. Pionera en la implementac...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- transformación del marketing editorial
- estrategias efectivas para atraer lectores
- propuesta única y atractiva
- importancia de identificar la audiencia
- fusión de experiencias profesionales y casos de estudio

**Key terms:** marketing editorial, impulso creativo, propuestas atractivas, estrategias de promoción, audiencia objetivo

**Voz autorial:** La voz de Pilar Gordoa es clara y perspicaz, combinando experiencia profesional con un enfoque práctico y accesible para todos los interesados en el marketing editorial.

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
- Razón: El contenido generado refleja de manera precisa conceptos específicos del libro, como la importancia de identificar a la audiencia y la transformación del marketing editorial. Las frases utilizadas están directamente relacionadas con la propuesta única de Pilar Gordoa y su enfoque en conectar ideas con lectores, lo que demuestra un anclaje sólido al ground_truth.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content reflects specific concepts from the ground truth, such as the importance of identifying the target audience and the transformation of editorial marketing. Phrases like 'forging an authentic connection' and 'effective strategies' align closely with the book's focus on marketing in the digital age. However, some phrases are somewhat generic and could apply to broader contexts, slightly降低



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.80)
- ES: pagina — Tono directo y enfoque en el marketing, sin referencias externas.
- EN: pagina — Tono directo y enfoque en conectar con lectores.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.9 ← del voice judge
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
- Tokens totales: 9777
- Tiempo total: 37.3s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 12363ms
- anchors: 2499 tokens, 6828ms
- palette: 0 tokens, 0ms
- content_es: 2576 tokens, 6414ms
- judge_es: 944 tokens, 2045ms
- content_en: 2015 tokens, 5458ms
- judge_en: 942 tokens, 2440ms
- voice: 801 tokens, 737ms
- highlight_judge_es_parrafoTop: 640 tokens, 0ms
- highlight_judge_es_parrafoBot: 646 tokens, 0ms
- highlight_judge_en_parrafoTop: 642 tokens, 0ms
- highlight_judge_en_parrafoBot: 635 tokens, 0ms
