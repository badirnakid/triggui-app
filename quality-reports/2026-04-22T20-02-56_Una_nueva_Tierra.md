# Quality Report — Una nueva Tierra

**Autor:** Eckhart Tolle
**Ejecutado:** 2026-04-22T20-02-56
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
- transformación de la conciencia a través del ego
- construcción de un mundo nuevo y mejor
- comprensión profunda de nuestro ser
- la práctica hacia una nueva conciencia

**Key terms:** despertar, conciencia, ego, transformación, ser profundo

**Voz autorial:** Eckhart Tolle utiliza un tono reflexivo y accesible, combinando la espiritualidad con la psicología para guiar al lector hacia un entendimiento más profundo de sí mismo y del mundo.

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
- Razón: The generated content closely reflects the core themes and concepts presented in the ground truth of 'Una nueva Tierra' by Eckhart Tolle. It specifically mentions the urgency of spiritual awakening, the transformation of consciousness, and the role of the ego, all of which are central to Tolle's teachings. Phrases like 'El despertar espiritual no es solo una opción, es una necesidad imperante' and

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects the core themes and concepts from Eckhart Tolle's 'Una nueva Tierra', such as the urgent need for spiritual awakening, the transformation of consciousness, and the role of the ego. Phrases like 'Spiritual awakening is essential for humanity's survival' and 'the ego, being the root of our limitations, must be transformed' are explicitly aligned with Tolle's 1

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre el despertar espiritual.
- EN: pagina — Uso de segunda persona y tono directo, coherente con el libro.

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
- Tokens totales: 9989
- Tiempo total: 63.2s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40482ms
- anchors: 2597 tokens, 5310ms
- palette: 0 tokens, 0ms
- content_es: 2589 tokens, 7102ms
- judge_es: 964 tokens, 2344ms
- content_en: 2056 tokens, 4783ms
- judge_en: 945 tokens, 2280ms
- voice: 838 tokens, 947ms
