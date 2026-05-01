# Quality Report — Las casualidades no existen

**Autor:** Borja Vilaseca
**Ejecutado:** 2026-05-01T18-35-40
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

El libro que hará que los creyentes cuestionen la religión y los ateos se abran a la espiritualidad. Estamos viviendo un hecho histórico imparable: cada vez la gente cree menos en las instituciones religiosas y -sin embargo- está cada vez más en contacto con su dimensión espiritual. Y esto se debe a que se está democratizando la sabiduría, provocando que los buscadores occidentales se adentren en la filosofía oriental. Como consecuencia de este viaje de autoconocimiento se está produciendo un despertar masivo de consciencia. Es decir, un profundo cambio en nuestra manera de concebirnos a nosotros mismos y de relacionarnos con la vida. Todas las personas que han despertado -creyentes, ateas o agnósticas- comparten una misma vivencia: que no sucede lo que que...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- el despertar de la consciencia
- la liberación de la 'pecera mental'
- la conexión con la vida
- la espiritualidad como evolución personal
- la democratización de la sabiduría

**Key terms:** espiritualidad, consciencia, autoconocimiento, filosofía oriental, pecera mental

**Voz autorial:** La voz de Borja Vilaseca es provocativa y reflexiva, invitando al lector a cuestionar sus creencias y a experimentar un cambio profundo en su percepción de la vida.

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
- Razón: The generated content directly references key concepts from the book, such as 'despertar de la consciencia', 'pecera mental', and the idea that life is a process of learning rather than random events. These phrases are specific to the themes outlined in the ground truth, making the content highly relevant and anchored to the book.

### EN
- Score: 0.90
- Usa conceptos específicos: true
- Razón: The content closely aligns with the book's themes of spiritual evolution and consciousness awakening. Phrases like 'liberation from the mental fishbowl' and 'each experience is crafted for our growth' directly reflect the book's core ideas about personal growth and the interconnectedness of experiences. It is not generic, as it specifically addresses concepts from the book.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre el despertar de la consciencia.
- EN: pagina — Voz directa y reflexiones personales sobre el crecimiento espiritual.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.95 ← promedio de los 2 judges
- **Combined:** **0.94**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9972
- Tiempo total: 43.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 17351ms
- anchors: 2420 tokens, 5974ms
- palette: 0 tokens, 0ms
- content_es: 2636 tokens, 7687ms
- judge_es: 997 tokens, 2118ms
- content_en: 2084 tokens, 5142ms
- judge_en: 972 tokens, 1804ms
- voice: 863 tokens, 2416ms
- highlight_judge_es_parrafoTop: 645 tokens, 0ms
- highlight_judge_es_parrafoBot: 641 tokens, 0ms
- highlight_judge_en_parrafoTop: 639 tokens, 0ms
- highlight_judge_en_parrafoBot: 643 tokens, 0ms
