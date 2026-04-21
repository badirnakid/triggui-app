# Quality Report — Descubre tu destino con el monje que vendió su Ferrari

**Autor:** Robin Sharma
**Ejecutado:** 2026-04-21T01-15-21
**Pipeline:** nucleus-canonical-v3

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

¡Aprende cómo conseguir la vida que siempre has soñado tener y transforma definitivamente todas las dimensiones de tu mundo! Éste es el último libro de la serie que protagoniza el famoso monje que vendió su Ferrari, una obra que puede conseguir que mires el mundo con otros ojos. Te enseñará a despertar tu yo más íntimo y te ayudará a lograr una vida más plena y más feliz, así como prosperidad y paz interior. Lo único que tienes que hacer es mirar dentro de ti. Escrito como una fábula, Descubre tu destino con el monje que vendió su Ferrari ofrece nuevos aspectos de la sabiduría de Julian Mantle, el superabogado que cambió su vida de lujo por la paz interior y la felicidad. Una ficción inolvidable y paradójicamente realista, que desvela el verdadero propósito...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- despertar tu yo más íntimo
- liberar todo el potencial del ser
- secreto de la felicidad
- camino de la libertad personal
- transformar todas las dimensiones de tu mundo

**Key terms:** Julian Mantle, paz interior, prosperidad, fábula, libertad personal

**Voz autorial:** La voz de Robin Sharma en este libro es inspiradora y motivacional, combinando fábulas con lecciones prácticas que invitan a la reflexión y al autodescubrimiento.

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
- Razón: The generated content directly reflects key concepts from the ground truth, such as 'despertar tu yo más íntimo', 'paz interior', 'liberar todo el potencial del ser', and 'transformar tu mundo'. These phrases are specific to the themes and teachings of Robin Sharma's book, making the content highly relevant and anchored to the book's message.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes of self-discovery, inner peace, and personal transformation found in the book's synopsis. Phrases like 'awakening your inner self' and 'journey to personal freedom' reflect the core messages of 'Descubre tu destino con el monje que vendió su Ferrari.' However, while it is specific to the book's themes, some phrases are somewhat generic and could

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y tono coherente con el contenido del libro.
- EN: pagina — Voz directa y tono coherente con el contenido del libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.86 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.91**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9810
- Tiempo total: 64.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40487ms
- anchors: 2667 tokens, 6353ms
- palette: 0 tokens, 0ms
- content_es: 2559 tokens, 5924ms
- judge_es: 910 tokens, 2660ms
- content_en: 1984 tokens, 5952ms
- judge_en: 912 tokens, 2471ms
- voice: 778 tokens, 1008ms
