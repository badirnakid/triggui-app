# Quality Report — Las 25 leyes bíblicas para el éxito

**Autor:** William Douglas
**Ejecutado:** 2026-04-23T02-53-06
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
- antídotos contra los siete pecados capitales
- virtudes recomendadas por la Biblia para alcanzar el éxito
- relación armoniosa con el dinero
- citas bíblicas para la excelencia y credibilidad

**Key terms:** teología de la prosperidad, teología de la miseria, sabiduría bíblica, éxito profesional, valores fundamentales

**Voz autorial:** La voz del autor es motivacional y persuasiva, utilizando la Biblia como un referente práctico para el éxito en la vida personal y profesional.

---

## 🎨 Visual synthesis

- hue_primary: 65
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_moderno
- Resultado: paper=#D3D3CF, accent=#C7D61F, ink=#1B1C17, contraste=11.42:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content specifically references the seven capital sins and their antitheses in the context of success, which directly aligns with the book's focus on biblical principles for achieving success. It also emphasizes values such as honesty and respect, which are explicitly mentioned in the ground truth. The phrases used are closely tied to the themes and teachings outlined in the book, so

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content specifically references the 'seven deadly sins' and the importance of virtues such as respect and honesty, which are directly aligned with the themes presented in the ground truth. It also emphasizes the transformation of negative traits into positive virtues through dedication and effort, echoing the book's focus on biblical principles for success. However, some phrases are somewhat c

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y tono coherente con el libro.
- EN: pagina — Voz directa y reflexiones sobre la transformación personal.

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
- Tokens totales: 10047
- Tiempo total: 64.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41232ms
- anchors: 2632 tokens, 7024ms
- palette: 0 tokens, 1ms
- content_es: 2627 tokens, 6124ms
- judge_es: 965 tokens, 2415ms
- content_en: 2062 tokens, 4566ms
- judge_en: 904 tokens, 2152ms
- voice: 857 tokens, 1079ms
