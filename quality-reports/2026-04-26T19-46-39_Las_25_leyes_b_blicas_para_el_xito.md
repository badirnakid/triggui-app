# Quality Report — Las 25 leyes bíblicas para el éxito

**Autor:** William Douglas
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

La Biblia es el mejor manual sobre el éxito que se haya escrito hasta hoy. Contrario a lo que se piensa, no habla solamente sobre religión, sino también sobre los valores fundamentales para construir una base sólida para la vida profesional. Los autores de este libro acuden a esa fuente milenaria de sabiduría para consolidar las 25 leyes que presentan en estas páginas. Son lecciones que hablan sobre la importancia del esfuerzo y la dedicación en el trabajo, la búsqueda indispensable del conocimiento y la evolución personal, el respeto a los otros y, por encima de todo, la honestidad. Sin importar su orientación espiritual o si usted es empleado, trabajador independiente, emprendedor o dueño de una empresa, este libro puede transformar su vida. En estas pági...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- la importancia del esfuerzo y la dedicación en el trabajo
- los antídotos contra los siete pecados capitales en la búsqueda del éxito
- las virtudes recomendadas por la Biblia para alcanzar el éxito
- una relación armoniosa con el dinero
- 200 citas bíblicas para alcanzar la excelencia

**Key terms:** teología de la prosperidad, teología de la miseria, sabiduría bíblica, éxito profesional, valores fundamentales

**Voz autorial:** La voz del autor es didáctica y motivacional, centrada en la aplicación práctica de enseñanzas bíblicas para la vida profesional y el éxito personal.

---

## 🎨 Visual synthesis

- hue_primary: 60
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: analogous
- typography: serif_moderno
- Resultado: paper=#D3D3CF, accent=#B8D61F, ink=#1B1C17, contraste=11.42:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The content explicitly references key concepts from the book, such as 'esfuerzo y dedicación', 'virtudes recomendadas en la Biblia', and 'honestidad', which are central to the themes outlined in the ground truth. It also aligns with the book's focus on personal growth and success through biblical principles.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content closely aligns with the book's themes of effort, dedication, and biblical virtues for success. It references concepts like honesty and respect, which are explicitly mentioned in the ground truth. However, some phrases are somewhat generic and could apply to other self-help contexts.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas retóricas sin referencias externas.
- EN: pagina — Voz directa y reflexiones sobre el trabajo y la dedicación.

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
- Tokens totales: 9840
- Tiempo total: 38.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 16589ms
- anchors: 2639 tokens, 6065ms
- palette: 0 tokens, 0ms
- content_es: 2580 tokens, 5950ms
- judge_es: 913 tokens, 1958ms
- content_en: 2015 tokens, 5366ms
- judge_en: 899 tokens, 1905ms
- voice: 794 tokens, 930ms
- highlight_judge_es_parrafoTop: 650 tokens, 0ms
- highlight_judge_es_parrafoBot: 644 tokens, 0ms
- highlight_judge_en_parrafoTop: 640 tokens, 0ms
- highlight_judge_en_parrafoBot: 639 tokens, 0ms
