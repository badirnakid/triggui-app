# Quality Report — Lo que nunca cambia en un mundo cambiante

**Autor:** Morgan Housel
**Ejecutado:** 2026-05-02T03-23-41
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `model_inference`
- **Tier reached:** 3
- **Book identity confidence:** 0.60
- **Resolution path:** evidence_fetched_0sources → tier3_conf_0.80


### Libros similares considerados (inferencia)
- **El hombre más rico de Babilonia** (George S. Clason): Ofrece lecciones sobre finanzas personales a través de parábolas atemporales.
- **Padre rico, padre pobre** (Robert T. Kiyosaki): Explora conceptos de educación financiera y mentalidad sobre el dinero.
- **Los secretos de la mente millonaria** (T. Harv Eker): Aborda la psicología detrás de la riqueza y cómo cambiar la mentalidad financiera.
- **La magia del orden** (Marie Kondo): Aunque se centra en la organización, también trata sobre el cambio en la vida personal y la toma de decisiones.


### Ground truth utilizado
```
TEMA INFERIDO (el modelo no conoce este libro directamente, infiere desde similares):

El libro probablemente trata sobre lecciones de vida y finanzas que son relevantes a lo largo del tiempo, enfatizando la adaptabilidad y la sabiduría en la gestión personal y financiera.

VOZ INFERIDA:
Es probable que la voz del autor sea reflexiva y accesible, ofreciendo consejos prácticos y motivacionales para mejorar la vida personal y financiera.

LIBROS SIMILARES QUE COMPARTEN ADN CON ESTE:
- "El hombre más rico de Babilonia" (George S. Clason): Ofrece lecciones sobre finanzas personales a través de parábolas atemporales.
- "Padre rico, padre pobre" (Robert T. Kiyosaki): Explora conceptos de educación financiera y mentalidad sobre el dinero.
- "Los secretos de la mente millonaria" (T. Harv Eker): Ab...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- lecciones atemporales sobre finanzas personales
- adaptabilidad en tiempos de cambio
- sabiduría en la gestión del dinero

**Key terms:** finanzas personales, sabiduría financiera, adaptabilidad, lecciones de vida, gestión del dinero

**Voz autorial:** La voz del autor es reflexiva y accesible, ofreciendo consejos prácticos y motivacionales.

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
- Score: 0.80
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: El contenido generado refleja conceptos específicos como 'adaptabilidad' y 'sabiduría en la gestión del dinero', que son relevantes para el tema del libro. Sin embargo, algunas frases son algo genéricas y podrían aplicarse a otros libros de autoayuda, aunque en general se alinean bien con el enfoque reflexivo y práctico del texto.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content reflects the inferred themes of adaptability and wisdom in personal finance, aligning well with the ground truth. Phrases like 'timeless lessons on personal finance' and 'informed decisions that endure over time' directly relate to the book's focus on life lessons and financial management. However, it maintains a specific tone and context that distinguishes it from generic self-help, 3



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.80)
- ES: pagina — Tono directo y reflexivo, sin referencias externas al libro.
- EN: pagina — Tono directo y reflexivo, sin referencias meta.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.6 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.9 ← del voice judge
- **specificity:** 0.88 ← anti-genericidad de anchors
- **grounding_judge:** 0.8 ← promedio de los 2 judges
- **Combined:** **0.78**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlight_es_parrafoBot_residual_warning
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 8
- Tokens totales: 9561
- Tiempo total: 41.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 566 tokens, 19732ms
- anchors: 2281 tokens, 7107ms
- palette: 0 tokens, 0ms
- content_es: 2433 tokens, 5878ms
- judge_es: 822 tokens, 1486ms
- content_en: 1856 tokens, 3678ms
- judge_en: 830 tokens, 2625ms
- voice: 773 tokens, 640ms
- highlight_judge_es_parrafoTop: 640 tokens, 0ms
- highlight_judge_es_parrafoBot: 653 tokens, 0ms
- highlight_judge_es_parrafoBot_retry: 655 tokens, 0ms
- highlight_judge_en_parrafoTop: 639 tokens, 0ms
- highlight_judge_en_parrafoBot: 643 tokens, 0ms
