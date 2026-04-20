# Quality Report — Las 25 leyes bíblicas para el éxito

**Autor:** William Douglas
**Ejecutado:** 2026-04-20T22-04-21
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
- los errores de la teología de la prosperidad

**Key terms:** teología de la prosperidad, teología de la miseria, virtudes bíblicas, citas bíblicas, sabiduría de Salomón

**Voz autorial:** La voz del autor es motivacional y directa, basada en la reinterpretación de enseñanzas bíblicas aplicadas al ámbito del éxito personal y profesional.

---

## 🎨 Visual synthesis

- hue_primary: 50
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_moderno
- Resultado: paper=#D3D3CF, accent=#D6B81F, ink=#1C1B17, contraste=11.48:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly references concepts from the ground truth, such as the importance of dedication, effort, and virtues recommended by the Bible. It specifically mentions the teachings of the Bible and the role of virtues like honesty and respect, which are central themes in the book. The phrases and reflections are tailored to the book's message about success through biblical wisdom,,

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content specifically references concepts from the ground truth, such as the importance of dedication, hard work, honesty, and respect, which are explicitly mentioned in the book's synopsis. The phrases and ideas presented align closely with the teachings of the Bible as outlined in the book, making it clear that the content is not generic but rather deeply rooted in the specific ten,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre el éxito.
- EN: pagina — Voz directa y consejos prácticos sin referencias meta.

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
- Tokens totales: 10112
- Tiempo total: 66.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41604ms
- anchors: 2645 tokens, 5565ms
- palette: 0 tokens, 0ms
- content_es: 2657 tokens, 7124ms
- judge_es: 976 tokens, 2772ms
- content_en: 2074 tokens, 6467ms
- judge_en: 905 tokens, 2464ms
- voice: 855 tokens, 661ms
