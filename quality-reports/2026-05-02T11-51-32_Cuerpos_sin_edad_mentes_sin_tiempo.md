# Quality Report — Cuerpos sin edad mentes sin tiempo

**Autor:** Deepak Chopra
**Ejecutado:** 2026-05-02T11-51-32
**Pipeline:** nucleus-canonical-v3.7.1

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

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- no tenemos que envejecer
- dirigir la manera que nuestros cuerpos y mentes metabolizan tiempo
- conservar la vitalidad, la creatividad, la memoria y la autoestima
- programa de reducción del estrés, cambios dietéticos y ejercicio
- enfoque excepcional para lograr potencial física y espiritual

**Key terms:** anti-envejecimiento, metabolismo del tiempo, longevidad, equilibrio de la vida, salud integral

**Voz autorial:** La voz de Deepak Chopra en este libro es inspiradora y empoderadora, combinando ciencia y espiritualidad para ofrecer un enfoque holístico hacia la salud y el bienestar.

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
- Razón: El contenido generado refleja de manera precisa los conceptos del libro de Chopra, como la idea de que la mente puede influir en el envejecimiento y la importancia de un enfoque integral que incluye reducción del estrés, cambios dietéticos y ejercicio. Las frases utilizadas son específicas y están directamente relacionadas con los temas tratados en el libro, lo que demuestra un anclaje sólido al '

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the core themes of Deepak Chopra's book, specifically addressing the concepts of aging, the mind-body connection, and the proposed program for maintaining vitality. Phrases like 'metabolize time' and 'stress reduction, dietary changes, and exercise' are directly aligned with the book's focus, making it highly specific and not generic.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en el contenido del libro.
- EN: pagina — Voz directa y enfoque en el contenido del libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.94 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.96**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9450
- Tiempo total: 38.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 1156ms
- anchors: 2390 tokens, 7574ms
- palette: 0 tokens, 0ms
- content_es: 2524 tokens, 19340ms
- judge_es: 872 tokens, 1640ms
- content_en: 1970 tokens, 4361ms
- judge_en: 857 tokens, 3266ms
- voice: 837 tokens, 839ms
- highlight_judge_es_parrafoTop: 650 tokens, 0ms
- highlight_judge_es_parrafoBot: 644 tokens, 0ms
- highlight_judge_en_parrafoTop: 644 tokens, 0ms
- highlight_judge_en_parrafoTop_retry: 651 tokens, 0ms
- highlight_judge_en_parrafoBot: 636 tokens, 0ms
