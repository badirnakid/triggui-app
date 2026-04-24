# Quality Report — Las 25 leyes bíblicas para el éxito

**Autor:** William Douglas
**Ejecutado:** 2026-04-24T03-08-01
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

La Biblia es el mejor manual sobre el éxito que se haya escrito hasta hoy. Contrario a lo que se piensa, no habla solamente sobre religión, sino también sobre los valores fundamentales para construir una base sólida para la vida profesional. Los autores de este libro acuden a esa fuente milenaria de sabiduría para consolidar las 25 leyes que presentan en estas páginas. Son lecciones que hablan sobre la importancia del esfuerzo y la dedicación en el trabajo, la búsqueda indispensable del conocimiento y la evolución personal, el respeto a los otros y, por encima de todo, la honestidad. Sin importar su orientación espiritual o si usted es empleado, trabajador independiente, emprendedor o dueño de una empresa, este libro puede transformar su vida. En estas pági...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la importancia del esfuerzo y la dedicación en el trabajo
- los antídotos contra los siete pecados capitales en la búsqueda del éxito
- las virtudes recomendadas por la Biblia para alcanzar el éxito
- la relación armoniosa con el dinero
- 200 citas bíblicas para alcanzar la excelencia

**Key terms:** teología de la prosperidad, teología de la miseria, sabiduría bíblica, éxito profesional, valores fundamentales

**Voz autorial:** El autor utiliza un tono motivacional y reflexivo, integrando enseñanzas bíblicas con principios de éxito en la vida profesional.

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
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content specifically references concepts from the ground truth, such as the importance of effort and dedication, the biblical teachings on success, and the relationship with money. Phrases like 'la dedicación como clave del éxito' and 'la Biblia nos enseña que el éxito no es fruto de la casualidad' directly align with the themes presented in the book's synopsis, making it highly ancl

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects the themes of effort and dedication as essential for success, which aligns with the book's emphasis on these values. It also hints at biblical teachings about success, which is a specific concept from the ground truth. However, the language used is somewhat generic and could apply to many self-help contexts, which prevents a perfect score.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas reflexivas sin referencias externas.
- EN: pagina — Voz directa y reflexiones sobre el éxito sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.85 ← promedio de los 2 judges
- **Combined:** **0.91**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9913
- Tiempo total: 64.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 43065ms
- anchors: 2654 tokens, 5532ms
- palette: 0 tokens, 0ms
- content_es: 2604 tokens, 6298ms
- judge_es: 938 tokens, 2138ms
- content_en: 2019 tokens, 5069ms
- judge_en: 888 tokens, 1301ms
- voice: 810 tokens, 1373ms
