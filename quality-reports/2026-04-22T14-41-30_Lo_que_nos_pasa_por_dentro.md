# Quality Report — Lo que nos pasa por dentro

**Autor:** Eduardo Punset
**Ejecutado:** 2026-04-22T14-41-30
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_4sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

Una completa incursión por las estancias más íntimas de la condición humana. Saber cómo somos es la llave maestra para entenderlo que nos pasa por dentro y aprender a manejarnos por fuera. El nuevo libro de Eduardo Punset descifra la rosa de los vientos emocional del ser humano, a la luz de lo que dice la ciencia y lo que confirman la experiencia y el testimonio de decenas de casos reales. La huella imborrable de la infancia, la turbulenta adolescencia, los problemas del aprendizaje, el amor y sus laberintos, el éxito social, la medicina personalizada, el miedo a la muerte… Nueve retos de la vida de cualquier persona, ilustrados con casos tratados por el equipo de profesionales de Apoyo Psicológico Online y acompañados de las siempre lúcidas reflexiones del...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la huella imborrable de la infancia
- los problemas del aprendizaje
- los laberintos del amor
- el miedo a la muerte
- la medicina personalizada

**Key terms:** condición humana, emociones, retos de la vida, casos reales, reflexiones

**Voz autorial:** La voz de Eduardo Punset es reflexiva, accesible y profundamente analítica, combinando la ciencia con la experiencia personal y testimonios.

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
- Razón: The generated content directly references key concepts from the ground truth, such as the emotional labyrinth of love, the impact of childhood experiences on adult relationships, and the importance of understanding one's emotions. These themes are explicitly mentioned in the book's synopsis, making the content highly relevant and specific to 'Lo que nos pasa por dentro'.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes presented in Eduardo Punset's book, particularly the exploration of love and its connection to childhood experiences. Phrases like 'indelible marks of childhood' and 'understanding our human condition' directly reflect the book's focus on emotional challenges and personal development. However, while it is specific to the book's themes, the phras

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre el amor sin referencias externas.
- EN: pagina — Voz directa y reflexiones sobre el amor y relaciones personales.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.93**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9176
- Tiempo total: 31.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3461ms
- anchors: 2345 tokens, 10315ms
- palette: 0 tokens, 0ms
- content_es: 2463 tokens, 6249ms
- judge_es: 827 tokens, 2467ms
- content_en: 1908 tokens, 6286ms
- judge_en: 804 tokens, 2097ms
- voice: 829 tokens, 971ms
