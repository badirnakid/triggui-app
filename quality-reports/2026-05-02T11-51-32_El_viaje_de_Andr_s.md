# Quality Report — El viaje de Andrés

**Autor:** Svend Brinkmann
**Ejecutado:** 2026-05-02T11-51-32
**Pipeline:** nucleus-canonical-v3.7.1

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

¿Qué es el ser humano? Alrededor de Andrés todo eran preguntas profundas: ¿quién eres?, ¿qué quieres?, ¿qué te hace feliz? Sin embargo, jamás se había cuestionado el sentido de la existencia misma. Jamás… hasta la lectura de un misterioso manuscrito durante un viaje de aprendizaje que cambiará su vida. Andrés es un adolescente introvertido que atraviesa una depresión. Cuando más necesita cambiar de aires, Ana, su abuela paterna, le propone recorrer Europa en tren juntos. Por desgracia, Ana cae gravemente enferma. Consciente de que ya no podrá acompañarlo, le anima a embarcarse en ese viaje planeado. Incluso le regala una maleta de libros para que lo acompañen. De todos ellos, le insiste en leer ¿Qué es el ser humano?, un manuscrito filosófico que le guiará ...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- la búsqueda del sentido de la existencia
- la introspección en la adolescencia
- el viaje como metáfora de autodescubrimiento
- la influencia de la literatura en la vida personal
- la conexión intergeneracional a través del conocimiento

**Key terms:** manuscrito filosófico, autodescubrimiento, depresión adolescente, viaje en tren, conexión familiar

**Voz autorial:** La voz de Svend Brinkmann es reflexiva y filosófica, invitando al lector a explorar cuestiones profundas sobre la existencia y la identidad a través de la narrativa de un joven en búsqueda de respuestas.

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
- Score: 0.90
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The content closely reflects the themes of self-discovery and philosophical inquiry present in the book. Phrases like 'la búsqueda del sentido' and 'manuscrito filosófico' directly relate to Andrés's journey and the manuscript he reads. However, some OG phrases are slightly generic, which prevents a perfect score.

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects themes of introspection and the search for meaning, which are central to the book's premise. It mentions a philosophical manuscript and the journey of self-discovery, aligning with Andrés' experiences. However, some phrases are somewhat generic and could apply to various philosophical contexts, slightly reducing the score.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre el viaje de Andrés.
- EN: pagina — Voz directa y reflexiones sobre el viaje de Andrés.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.88 ← anti-genericidad de anchors
- **grounding_judge:** 0.8 ← promedio de los 2 judges
- **Combined:** **0.89**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 2 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9880
- Tiempo total: 27.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2829ms
- anchors: 2628 tokens, 8228ms
- palette: 0 tokens, 1ms
- content_es: 2591 tokens, 7965ms
- judge_es: 928 tokens, 1574ms
- content_en: 2020 tokens, 3920ms
- judge_en: 911 tokens, 2097ms
- voice: 802 tokens, 1150ms
- highlight_judge_es_parrafoTop: 645 tokens, 0ms
- highlight_judge_es_parrafoTop_retry: 659 tokens, 0ms
- highlight_judge_es_parrafoBot: 657 tokens, 0ms
- highlight_judge_en_parrafoTop: 644 tokens, 0ms
- highlight_judge_en_parrafoTop_retry: 645 tokens, 0ms
- highlight_judge_en_parrafoBot: 635 tokens, 0ms
