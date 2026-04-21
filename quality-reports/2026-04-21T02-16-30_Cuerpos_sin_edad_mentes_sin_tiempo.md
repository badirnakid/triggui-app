# Quality Report — Cuerpos sin edad mentes sin tiempo

**Autor:** Deepak Chopra
**Ejecutado:** 2026-04-21T02-16-30
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.94
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 0.97



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

¡Cuerpos sin edad, mentes sin tiempo va más allá de las investigaciones corrientes de anti-envejecimiento y juicios antiguos de la mente y el cuerpo para demostrar dramáticamente que no tenemos que envejecer! Dr. Chopra nos muestra que, al contrario de creencias tradicionales, podemos aprender como dirigir la manera que nuestros cuerpos y mentes metabolizan tiempo y contrarrestar el proceso de envejecimiento—de ese modo conservando la vitalidad, la creatividad, la memoria y la autoestima. En un programa único que incluye reducción del estrés, cambios dietéticos y ejercicio, Dr. Chopra ofrece un régimen con instrucciones paso a paso, individualmente adaptado para vivir al máximo con buena salud. Por los jóvenes de espíritu, aquí está el enfoque más excepcion...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- el envejecimiento es una proyección mental
- la vitalidad puede ser preservada mediante la mente
- estrategias de reducción del estrés para la longevidad
- adaptación individual de un régimen de salud
- transformación del cuerpo a través de la conciencia

**Key terms:** anti-envejecimiento, metabolismo del tiempo, vitalidad, creatividad, autoestima, salud integral

**Voz autorial:** La voz de Chopra es inspiradora y accesible, combinando la sabiduría espiritual con enfoques prácticos para el bienestar físico y mental.

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
- Razón: The generated content directly reflects key concepts from the book, such as the idea that aging is a mental projection and the importance of the mind in preserving vitality and creativity. Phrases like 'estrategias de reducción del estrés' and 'transformación integral' align closely with Chopra's teachings on anti-aging and holistic health, making it specific to 'Cuerpos sin edad, mentes sin time'

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes presented in 'Cuerpos sin edad, mentes sin tiempo,' particularly the ideas of aging as a mental construct and the importance of mindset in maintaining vitality and creativity. Phrases like 'shift your mindset' and 'stress-reduction strategies' reflect specific concepts from the book. However, while it is well anchored to the book's themes, some 

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones en primera persona sobre el envejecimiento.
- EN: pagina — Voz directa y enfoque en la transformación personal.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.94 ← del tier de grounding alcanzado
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
- Tokens totales: 9220
- Tiempo total: 65.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40825ms
- anchors: 2373 tokens, 6612ms
- palette: 0 tokens, 1ms
- content_es: 2487 tokens, 7100ms
- judge_es: 836 tokens, 2069ms
- content_en: 1915 tokens, 5901ms
- judge_en: 811 tokens, 2050ms
- voice: 798 tokens, 1106ms
