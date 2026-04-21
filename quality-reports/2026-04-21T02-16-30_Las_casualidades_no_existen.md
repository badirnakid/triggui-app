# Quality Report — Las casualidades no existen

**Autor:** Borja Vilaseca
**Ejecutado:** 2026-04-21T02-16-30
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

El libro que hará que los creyentes cuestionen la religión y los ateos se abran a la espiritualidad. Estamos viviendo un hecho histórico imparable: cada vez la gente cree menos en las instituciones religiosas y -sin embargo- está cada vez más en contacto con su dimensión espiritual. Y esto se debe a que se está democratizando la sabiduría, provocando que los buscadores occidentales se adentren en la filosofía oriental. Como consecuencia de este viaje de autoconocimiento se está produciendo un despertar masivo de consciencia. Es decir, un profundo cambio en nuestra manera de concebirnos a nosotros mismos y de relacionarnos con la vida. Todas las personas que han despertado -creyentes, ateas o agnósticas- comparten una misma vivencia: que no sucede lo que que...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- cuestionamiento de la religión
- despertar de la consciencia
- liberación de la pecera mental
- conexión con la vida
- evolución espiritual

**Key terms:** espiritualidad, sabiduría, autoconocimiento, consciencia, dimensión espiritual

**Voz autorial:** La voz de Borja Vilaseca es provocadora y reflexiva, invitando al lector a cuestionar creencias y a explorar su propia espiritualidad desde una perspectiva abierta y crítica.

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
- Razón: The generated content closely reflects the themes and concepts outlined in the ground truth, such as questioning beliefs, the journey of self-discovery, and the idea of liberating oneself from the 'pecera mental.' Phrases like 'despertar de la consciencia' and 'liberarnos de la pecera mental' are directly tied to the book's core messages, making it specific to 'Las casualidades no existen'.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes of self-discovery, questioning beliefs, and spiritual evolution presented in the ground truth. Phrases like 'freeing ourselves from the mental fishbowl' and 'renewed connection with life' echo the book's focus on liberation from limiting beliefs and the joy of existence. However, some phrases are somewhat generic and could apply to a broader set

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre la consciencia.
- EN: pagina — Voz directa y reflexiva, sin referencias meta al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9815
- Tiempo total: 65.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41565ms
- anchors: 2443 tokens, 7186ms
- palette: 0 tokens, 0ms
- content_es: 2613 tokens, 5850ms
- judge_es: 984 tokens, 2034ms
- content_en: 2034 tokens, 5517ms
- judge_en: 938 tokens, 2098ms
- voice: 803 tokens, 769ms
