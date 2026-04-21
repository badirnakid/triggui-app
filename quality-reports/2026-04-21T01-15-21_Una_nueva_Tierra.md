# Quality Report — Una nueva Tierra

**Autor:** Eckhart Tolle
**Ejecutado:** 2026-04-21T01-15-21
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

Si usted ya se ha iniciado en el proceso del despertar, éste se acelerará y se intensificará con la lectura de este maravilloso libro. "El despertar espiritual no es ya una opción sino una necesidad, si queremos que la humanidad y el planeta sobrevivan." ECKHART TOLLE El poder del ahora consagró a Eckhart Tolle como uno de los más grandes maestros de la literatura espiritual de nuestros días. Después de casi ocho años de espera, esta continuación, nos brinda de nuevo un mensaje profundo e inspirador a todos sus lectores. Eckhart Tolle nos enseña en Una nueva Tierra que tenemos la oportunidad de construir un mundo nuevo y mejor. Esto supone una revisión radical del papel de la conciencia, identificada con el propio ego, que debería convertirse en el instrume...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- el despertar espiritual como necesidad para la humanidad
- transformación de la conciencia identificada con el ego
- la construcción de un mundo nuevo y mejor
- la guía práctica hacia una nueva conciencia
- la revelación de la naturaleza del ego

**Key terms:** despertar, conciencia, ego, transformación, ser profundo

**Voz autorial:** La voz de Eckhart Tolle es reflexiva, inspiradora y profundamente espiritual, con un enfoque en la transformación interior y el despertar de la conciencia.

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
- Razón: The generated content directly reflects key concepts from the ground truth of 'Una nueva Tierra' by Eckhart Tolle, such as the necessity of spiritual awakening, the role of the ego, and the transformation of consciousness. Phrases like 'despertar espiritual' and 'transformar nuestra percepción de la realidad' are specific to Tolle's teachings, making the content highly relevant and anchored to the

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes and concepts from the ground truth of 'Una nueva Tierra' by Eckhart Tolle. It specifically mentions the necessity of spiritual awakening, the transformation of consciousness, and the nature of the ego, all of which are central to Tolle's teachings. The phrases used are directly aligned with the book's message, making it highly specific and not just

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre el despertar espiritual.
- EN: pagina — Voz directa y reflexiones sobre la conciencia sin referencias externas.

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
- Tokens totales: 10073
- Tiempo total: 63.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40743ms
- anchors: 2585 tokens, 5238ms
- palette: 0 tokens, 0ms
- content_es: 2613 tokens, 5255ms
- judge_es: 981 tokens, 2975ms
- content_en: 2076 tokens, 5688ms
- judge_en: 955 tokens, 2386ms
- voice: 863 tokens, 755ms
