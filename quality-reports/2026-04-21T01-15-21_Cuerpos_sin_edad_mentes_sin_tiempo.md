# Quality Report — Cuerpos sin edad mentes sin tiempo

**Autor:** Deepak Chopra
**Ejecutado:** 2026-04-21T01-15-21
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
- no tenemos que envejecer
- dirigir la manera en que nuestros cuerpos y mentes metabolizan tiempo
- conservando la vitalidad, la creatividad, la memoria y la autoestima
- programa de reducción del estrés, cambios dietéticos y ejercicio
- enfoque excepcional para lograr potencial físico y espiritual

**Key terms:** anti-envejecimiento, metabolismo del tiempo, vitalidad, creatividad, autoestima, régimen adaptado

**Voz autorial:** La voz de Chopra es inspiradora y práctica, combinando sabiduría antigua con enfoques contemporáneos para la salud y el bienestar.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#CFD2D3, accent=#1F99D6, ink=#171A1C, contraste=11.50:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects the themes and concepts presented in the ground truth of the book, such as the idea of challenging the myth of aging, the importance of vitality, creativity, and self-esteem, and the mention of a program that includes dietary changes and exercise. Phrases like 'dirigir la manera en que nuestros cuerpos y mentes metabolizan cada instante' and 'conservar la  '

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects the core themes of Deepak Chopra's book, such as challenging the myth of aging, the importance of vitality, and the tailored program involving dietary changes and exercise. Phrases like 'Preserving vitality, creativity, and self-esteem' and 'direct how our bodies and minds metabolize each moment' are specific to the concepts presented in the ground truth, as

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en conceptos del libro.
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

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9371
- Tiempo total: 63.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40088ms
- anchors: 2386 tokens, 4947ms
- palette: 0 tokens, 0ms
- content_es: 2524 tokens, 7035ms
- judge_es: 865 tokens, 2163ms
- content_en: 1951 tokens, 5175ms
- judge_en: 821 tokens, 3382ms
- voice: 824 tokens, 1012ms
