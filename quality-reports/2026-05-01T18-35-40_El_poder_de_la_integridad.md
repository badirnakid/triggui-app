# Quality Report — El poder de la integridad

**Autor:** Kelley Kosow
**Ejecutado:** 2026-05-01T18-35-40
**Pipeline:** nucleus-canonical-v3.7.1

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

**Key terms:** integridad, verdadera esencia, autoengaño, confianza interna, principios personales

**Voz autorial:** La voz de Kelley Kosow es reflexiva y empoderadora, invitando al lector a un viaje de autodescubrimiento y autenticidad.

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
- Razón: El contenido generado refleja de manera precisa conceptos clave del libro, como la importancia de la integridad, la autenticidad y el enfrentamiento de miedos, todos presentes en la sinopsis. Las frases y reflexiones están directamente alineadas con los temas centrales del libro de Kelley Kosow.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes of integrity, authenticity, and self-discovery presented in the ground truth. Phrases like 'living in alignment with who we truly are' and 'transforming our limitations into infinite capabilities' directly reflect the book's core messages about integrity and personal power. This specificity indicates a strong connection to the book's concepts.



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
- Tokens totales: 9800
- Tiempo total: 47.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 19802ms
- anchors: 2518 tokens, 7055ms
- palette: 0 tokens, 0ms
- content_es: 2575 tokens, 7365ms
- judge_es: 955 tokens, 2105ms
- content_en: 2002 tokens, 7308ms
- judge_en: 944 tokens, 2187ms
- voice: 806 tokens, 1383ms
- highlight_judge_es_parrafoTop: 644 tokens, 0ms
- highlight_judge_es_parrafoBot: 657 tokens, 0ms
- highlight_judge_en_parrafoTop: 635 tokens, 0ms
- highlight_judge_en_parrafoBot: 641 tokens, 0ms
