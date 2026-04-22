# Quality Report — Descubre tu destino con el monje que vendió su Ferrari

**Autor:** Robin Sharma
**Ejecutado:** 2026-04-22T03-47-25
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

**Voz autorial:** La voz autorial de Robin Sharma es inspiradora y motivadora, combinando elementos de fábula con enseñanzas prácticas, lo que permite una conexión emocional profunda con el lector.

---

## 🎨 Visual synthesis

- hue_primary: 65
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_moderno
- Resultado: paper=#D3D3CF, accent=#C7D61F, ink=#1B1C17, contraste=11.42:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects key concepts from the ground truth, such as 'despertar tu yo más íntimo', 'liberar todo el potencial del ser', and 'camino de la libertad personal'. These phrases are specific to the themes of self-discovery and personal transformation found in 'Descubre tu destino con el monje que vendió su Ferrari', making the content well anchored to the book.

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The generated content reflects themes from the book, such as self-discovery, awakening one's true potential, and the pursuit of a fulfilling life. Phrases like 'awakening your innermost self' and 'releasing the full potential of your being' align with the book's focus on personal transformation and inner peace. However, the content remains somewhat generic and could apply to various self-help or a

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y motivacional, sin referencias externas al libro.
- EN: pagina — Voz directa y motivacional, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.86 ← anti-genericidad de anchors
- **grounding_judge:** 0.85 ← promedio de los 2 judges
- **Combined:** **0.9**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9995
- Tiempo total: 59.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40162ms
- anchors: 2646 tokens, 4897ms
- palette: 0 tokens, 0ms
- content_es: 2595 tokens, 5185ms
- judge_es: 952 tokens, 2882ms
- content_en: 2032 tokens, 4032ms
- judge_en: 925 tokens, 1669ms
- voice: 845 tokens, 989ms
