# Quality Report — El poder de la integridad

**Autor:** Kelley Kosow
**Ejecutado:** 2026-04-26T19-46-39
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
- enfrentarse al miedo y a la vergüenza
- transformar limitaciones en capacidades infinitas
- conectar con la verdadera esencia
- la integridad como poder personal

**Key terms:** integridad, verdad interior, auto-traición, principios personales, miedo a la vergüenza

**Voz autorial:** La voz de Kelley Kosow es reflexiva y empoderadora, invitando al lector a la autoexploración y a la autenticidad.

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
- Razón: El contenido generado refleja de manera precisa conceptos clave del libro, como la importancia de vivir en consonancia con nuestra verdad interior y cómo la integridad se relaciona con el poder personal. Utiliza frases específicas que resuenan con la sinopsis, como 'transformar limitaciones en capacidades infinitas' y 'enfrentar nuestros miedos', lo que demuestra un anclaje sólido al mensaje del '

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes and concepts from the ground truth, particularly the emphasis on integrity, authenticity, and living in alignment with one's true self. Phrases like 'transforming limitations into infinite capabilities' and 'integrity is not perfection' directly echo the book's core messages, making it specific to Kelley Kosow's work.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre la integridad.
- EN: pagina — Voz directa y reflexiones sobre la integridad sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9920
- Tiempo total: 32.2s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 4657ms
- anchors: 2535 tokens, 8734ms
- palette: 0 tokens, 0ms
- content_es: 2580 tokens, 6210ms
- judge_es: 968 tokens, 3247ms
- content_en: 2050 tokens, 6402ms
- judge_en: 958 tokens, 2022ms
- voice: 829 tokens, 821ms
- highlight_judge_es_parrafoTop: 643 tokens, 0ms
- highlight_judge_es_parrafoBot: 640 tokens, 0ms
- highlight_judge_en_parrafoTop: 639 tokens, 0ms
- highlight_judge_en_parrafoBot: 640 tokens, 0ms
