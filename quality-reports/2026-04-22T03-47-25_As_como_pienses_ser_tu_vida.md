# Quality Report — Así como pienses será tu vida

**Autor:** James Allen
**Ejecutado:** 2026-04-22T03-47-25
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

Todo es energía. Los pensamientos también&#xa0; Hoy en día, gracias a los avances en física cuántica y en las neurociencias, sabemos que nuestros pensamientos afectan a nuestra vida; que nuestra visión del mundo, tarde o temprano, acaba convirtiéndose en nuestra realidad. Esto mismo ya lo anticipó James Allen hace más de cien años. Por aquel entonces no se conocían los detalles científicos que en este siglo ya están a la orden del día. Sin embargo, Allen demostró ser un avanzado en este asunto y se dedicó, en cuerpo y alma, a trasmitir a todo aquel que quisiese escuchar estas enseñanzas. En la obra que tienes en tus manos, James Allen nos presenta, con absoluta maestría los principios universales que rigen nuestras vidas. Él descubrió a base de prueba-error...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- los pensamientos moldean nuestra realidad
- la mente subconsciente determina nuestra vida
- los principios universales que rigen nuestras vidas
- cambiar creencias para transformar la vida
- técnicas para modificar patrones de conducta

**Key terms:** energía, pensamientos, realidad, creencias, mente subconsciente, patrones de conducta

**Voz autorial:** La voz de James Allen es reflexiva y profunda, combinando elementos filosóficos con un enfoque práctico sobre cómo los pensamientos influyen en la vida de las personas.

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
- Razón: The generated content directly reflects key concepts from the ground truth, such as the transformative power of thoughts, the role of the subconscious mind, and the importance of changing beliefs to alter one's reality. Phrases like 'la mente subconsciente es el motor de tu vida' and 'cambiar tus creencias es el primer paso hacia la transformación' are explicitly aligned with James Allen's ideas, 

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects the core concepts of James Allen's teachings as outlined in the ground truth. Phrases like 'the subconscious mind drives your existence' and 'changing your beliefs is the first step toward transformation' are specific to Allen's philosophy on how thoughts and beliefs shape reality. The content is not generic and is tailored to the themes of the book, making 

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre el contenido del libro.
- EN: pagina — Voz directa y reflexiones sobre el pensamiento personal.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.87 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.94**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 12648
- Tiempo total: 61.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 39738ms
- anchors: 3190 tokens, 3790ms
- palette: 0 tokens, 0ms
- content_es: 3133 tokens, 8345ms
- judge_es: 1489 tokens, 1900ms
- content_en: 2568 tokens, 4387ms
- judge_en: 1465 tokens, 2194ms
- voice: 803 tokens, 678ms
