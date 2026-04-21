# Quality Report — Descubre tu destino con el monje que vendió su Ferrari

**Autor:** Robin Sharma
**Ejecutado:** 2026-04-21T11-02-04
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

**Voz autorial:** La voz de Robin Sharma es inspiradora y motivacional, combinando elementos de narrativa y fábula para transmitir lecciones de vida profundas y prácticas.

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
- Razón: The generated content closely reflects the themes and concepts presented in the ground truth, such as the pursuit of inner peace, personal freedom, and the importance of introspection. Phrases like 'transforma todas las dimensiones de tu mundo' and 'liberar todo el potencial del ser' directly align with the book's focus on self-discovery and achieving a fulfilling life, making it specific to 'Desc

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes of self-discovery, inner peace, and personal transformation found in the book's synopsis. Phrases like 'unleashing the full potential of your being' and 'embrace your journey to freedom' reflect the core messages of Julian Mantle's journey in the book. However, while it is specific to the book's themes, some phrases are somewhat generic and can,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas retóricas.
- EN: pagina — Voz directa y tono coherente con el libro.

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
- Tokens totales: 9910
- Tiempo total: 25.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 1793ms
- anchors: 2676 tokens, 4955ms
- palette: 0 tokens, 0ms
- content_es: 2577 tokens, 9666ms
- judge_es: 942 tokens, 1546ms
- content_en: 1997 tokens, 4453ms
- judge_en: 917 tokens, 2410ms
- voice: 801 tokens, 946ms
