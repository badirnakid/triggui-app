# Quality Report — Trabaja duro trabaja con astucia

**Autor:** Curtis Jackson 50 Cent
**Ejecutado:** 2026-04-26T19-46-39
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `google_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_4sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Google Books):

Es una serie de recuentos muy honestos sobre su historia personal, el polémico rapero Curtis Jackson (50 Cent) presenta una guía para alcanzar nuestras metas aun después de sufrir caídas importantes. Con una combinación única de experiencia de la calle y un talento inusitado para los negocios, el libro resulta una guía amena y reveladora sobre el cambio, la adaptación y los deseos irrefrenables de triunfar en la vida y en los negocios. "Debes entender que no existe eso de "lograrlo", que no importa cuánto dinero, fama o éxito tengas, el futuro traerá más dificultades, más drama, más obstáculos. La meta no es solo ser exitoso sino conservar ese éxito, yo lo aprendí por las malas y es una habilidad que te voy a enseñar en este libro". In a series of very hon...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- la importancia de adaptarse a las dificultades
- estrategias para conservar el éxito
- lecciones aprendidas a través de fracasos
- la combinación de experiencia de la calle y negocios
- la perseverancia en la búsqueda de metas

**Key terms:** adaptación, éxito sostenible, resiliencia, estrategia empresarial, superación personal

**Voz autorial:** La voz de Curtis Jackson es honesta, directa y motivadora, combinando su experiencia personal con consejos prácticos para el éxito.

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
- Razón: The generated content directly reflects key themes from the book, such as adaptation, resilience, and the importance of learning from failures. Phrases like 'conservar el éxito' and 'la habilidad de mantenerse en pie' echo the book's focus on sustaining success despite challenges, aligning closely with 50 Cent's personal experiences and lessons shared in the text.

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects themes of adaptation and resilience, which align with the book's focus on overcoming setbacks and maintaining success. However, it lacks direct references to 50 Cent's personal experiences or specific lessons he learned, making it somewhat generic.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre la adaptación y el éxito.
- EN: pagina — Tono directo y reflexivo, sin referencias externas al libro.

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
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10006
- Tiempo total: 36.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 10850ms
- anchors: 2566 tokens, 5213ms
- palette: 0 tokens, 0ms
- content_es: 2623 tokens, 6595ms
- judge_es: 991 tokens, 2481ms
- content_en: 2061 tokens, 8629ms
- judge_en: 957 tokens, 1635ms
- voice: 808 tokens, 967ms
- highlight_judge_es_parrafoTop: 646 tokens, 0ms
- highlight_judge_es_parrafoTop_retry: 655 tokens, 0ms
- highlight_judge_es_parrafoBot: 641 tokens, 0ms
- highlight_judge_en_parrafoTop: 647 tokens, 0ms
- highlight_judge_en_parrafoBot: 635 tokens, 0ms
