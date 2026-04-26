# Quality Report — Las 25 leyes bíblicas para el éxito

**Autor:** William Douglas
**Ejecutado:** 2026-04-26T14-49-54
**Pipeline:** nucleus-canonical-v3.6

---

## 🌐 Grounding

- **Source:** `identity_sealed_with_evidence`
- **Tier reached:** 1.5
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_preloaded
- **Match score:** 1.00



### Ground truth utilizado
```
LIBRO SELECCIONADO POR EL CURADOR AUTOMÁTICO:
Título: Las 25 leyes bíblicas para el éxito
Autor: William Douglas

SINOPSIS OFICIAL (Apple Books):

La Biblia es el mejor manual sobre el éxito que se haya escrito hasta hoy. Contrario a lo que se piensa, no habla solamente sobre religión, sino también sobre los valores fundamentales para construir una base sólida para la vida profesional. Los autores de este libro acuden a esa fuente milenaria de sabiduría para consolidar las 25 leyes que presentan en estas páginas. Son lecciones que hablan sobre la importancia del esfuerzo y la dedicación en el trabajo, la búsqueda indispensable del conocimiento y la evolución personal, el respeto a los otros y, por encima de todo, la honestidad. Sin importar su orientación espiritual o si usted es empleado,...
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
- los errores de la teología de la prosperidad y la teología de la miseria
- cómo tener una relación armoniosa con el dinero

**Key terms:** leyes bíblicas, éxito profesional, sabiduría milenaria, honestidad, evolución personal

**Voz autorial:** La voz de William Douglas es didáctica y motivacional, combinando enseñanzas bíblicas con principios prácticos para el éxito personal y profesional.

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
- Razón: El contenido generado se centra en la honestidad como un pilar del éxito, un concepto específico mencionado en la sinopsis del libro. Además, utiliza frases que reflejan directamente las enseñanzas bíblicas sobre la honestidad y su relación con el éxito profesional, alineándose con las 25 leyes del libro. Por lo tanto, es claramente anclado al ground_truth del libro.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content specifically emphasizes honesty as a virtue for success, which aligns with the book's focus on biblical principles for professional success. It references the importance of integrity and transparency, concepts that are central to the book's teachings. However, it lacks direct citations or specific biblical references mentioned in the ground truth, which prevents a perfect score.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la honestidad sin referencias externas.
- EN: pagina — Voz directa y reflexiones sobre el éxito sin referencias externas.

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
- Tokens totales: 10221
- Tiempo total: 28.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2ms
- anchors: 2696 tokens, 9286ms
- palette: 0 tokens, 1ms
- content_es: 2653 tokens, 6866ms
- judge_es: 995 tokens, 2153ms
- content_en: 2085 tokens, 6974ms
- judge_en: 962 tokens, 2178ms
- voice: 830 tokens, 997ms
