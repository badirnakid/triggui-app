# Quality Report — Cambie Sus Pensamientos Cambie Su Vida

**Autor:** Dr. Wayne W. Dyer
**Ejecutado:** 2026-05-02T11-51-32
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `google_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Google Books):

En la antigua China, quinientos años antes del nacimiento de Jesucristo, un hombre realizado en Dios llamado Lao-Tsé dictó 81 versos, considerado por muchos como la máxima exégesis sobre la naturaleza de nuestra existencia. El texto clásico de estos versos, llamado el Tao Te Ching o el Gran Camino, ofrece consejo y guía balanceados, morales, espirituales y siempre con el propósito de realizar el bien. El doctor Wayne W. Dyer ha revisado cientos de traducciones del Tao Te Ching. En este libro, escribe 81 ensayos distintos sobre cómo aplicar esta sabiduría antigua de Lao-Tsé en el mundo moderno. Este trabajo contiene los 81 versos del Tao, compilados por Wayne según sus investigaciones de diez de las traducciones más respetadas del texto, el cual ha sobreviv...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- aplicación de la sabiduría del Tao Te Ching en la vida moderna
- transformación personal a través de la meditación y la práctica diaria
- vivir en armonía con la naturaleza y el mundo espiritual

**Key terms:** Tao Te Ching, Lao-Tsé, sabiduría antigua, gran camino, práctica espiritual

**Voz autorial:** La voz del autor es reflexiva, personal y espiritual, invitando al lector a una profunda meditación sobre la vida y la existencia, enfatizando la transformación personal y la conexión con lo divino.

---

## 🎨 Visual synthesis

- hue_primary: 140
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_moderno
- Resultado: paper=#CFD3D0, accent=#1FD65C, ink=#171C19, contraste=11.41:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: El contenido generado refleja de manera específica los conceptos del Tao Te Ching y la interpretación de Wayne Dyer, mencionando la meditación diaria y la transformación personal, que son centrales en el libro. Además, se hace referencia a vivir en armonía con la naturaleza, un tema clave en la obra. Por lo tanto, está claramente anclado al ground_truth del libro.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content reflects key concepts from the Tao Te Ching and emphasizes daily meditation and harmony with nature, which are central themes in Dyer's interpretation. However, some phrases are somewhat generic and could apply to various self-help contexts.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre la transformación.
- EN: pagina — Voz directa y reflexiones personales sobre la sabiduría del Tao.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.92 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10664
- Tiempo total: 24.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 1628ms
- anchors: 2768 tokens, 6447ms
- palette: 0 tokens, 0ms
- content_es: 2740 tokens, 6612ms
- judge_es: 1093 tokens, 1821ms
- content_en: 2173 tokens, 4865ms
- judge_en: 1038 tokens, 1610ms
- voice: 852 tokens, 1032ms
- highlight_judge_es_parrafoTop: 641 tokens, 0ms
- highlight_judge_es_parrafoBot: 639 tokens, 0ms
- highlight_judge_en_parrafoTop: 633 tokens, 0ms
- highlight_judge_en_parrafoBot: 637 tokens, 0ms
