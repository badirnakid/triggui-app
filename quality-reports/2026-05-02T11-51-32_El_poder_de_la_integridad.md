# Quality Report — El poder de la integridad

**Autor:** Kelley Kosow
**Ejecutado:** 2026-05-02T11-51-32
**Pipeline:** nucleus-canonical-v3.7.1

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

¿Recuerdas la última vez que te prometiste decir lo que pensabas en una reunión de trabajo pero permaneciste sentado en silencio? ¿Cuántas veces has afirmado que, esta vez, la dieta iba en serio, pero te fallaste a ti mismo? ¿Reconoces la sensación de desconfiar de alguien para finalmente, y tras una mala experiencia, darte cuenta de que estabas en lo cierto?... Como afirma Kelley Kosow: &#34;Cada vez que te muerdes la lengua, ahogas tu integridad&#34;. Integridad no significa perfección. No es una estrategia sino una manera de vivir en consonancia con quien realmente somos. Todos tenemos heridas que representan las múltiples formas en las que nos hemos traicionado, mentido o despreciado a nosotros mismos. Hacemos caso omiso a nuestra voz interior y buscamo...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- vivir en consonancia con quien realmente somos
- enfrentarse al miedo y la vergüenza
- transformar limitaciones en capacidades infinitas

**Key terms:** integridad, verdadera esencia, traición personal, voz interior, principios personales

**Voz autorial:** La voz de Kelley Kosow es reflexiva y motivadora, instando a los lectores a explorar su interior y a actuar con autenticidad.

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
- Razón: El contenido generado refleja de manera precisa conceptos clave del libro, como la importancia de la integridad y la conexión con la voz interior. Frases como 'ahogas tu integridad' y 'transformar limitaciones en capacidades infinitas' están directamente alineadas con la sinopsis del libro, lo que demuestra un anclaje sólido en el material original.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely mirrors the themes and concepts presented in the ground truth, such as integrity, authenticity, and the importance of confronting fears. Phrases like 'stifle your integrity' and 'transforming limitations into infinite capabilities' directly reflect the book's core messages.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre la integridad.
- EN: pagina — Voz directa y reflexiones personales sobre la integridad.

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
- Tokens totales: 9715
- Tiempo total: 23.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 1304ms
- anchors: 2505 tokens, 4589ms
- palette: 0 tokens, 0ms
- content_es: 2554 tokens, 8649ms
- judge_es: 942 tokens, 2272ms
- content_en: 1996 tokens, 3362ms
- judge_en: 927 tokens, 1897ms
- voice: 791 tokens, 616ms
- highlight_judge_es_parrafoTop: 655 tokens, 0ms
- highlight_judge_es_parrafoBot: 642 tokens, 0ms
- highlight_judge_en_parrafoTop: 649 tokens, 0ms
- highlight_judge_en_parrafoBot: 642 tokens, 0ms
