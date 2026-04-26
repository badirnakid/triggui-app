# Quality Report — Espejos del tiempo

**Autor:** Brian Weiss
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

En Espejos del tiempo, Brian Weis nos muestra cómo a través de la terapia de la regresión es posible alcanzar la sanación física, emocional y espiritual. En Espejos del tiempo, del doctor Brian Weiss, anima al lector a retroceder al pasado y recordar sucesos que podrían ser el origen delas dificultades que experimenta en la actualidad. Gracias a los recuerdos, no solo de su vida actual sino de vidas pasadas, verá disminuir los síntomas que padece y experimentará una intensa sensación de relajación y bienestar. El practicar estos ejercicios con regularidad -asegura el doctor Weiss, que los emplea con sus pacientes- mejora la salud física y emocional, proporciona equilibrioy serenidad y amplía la perspectiva espiritual.

METADATA VERIFICADA:
- Título: Espejos...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- regresión a vidas pasadas como método de sanación
- identificación de orígenes de dificultades actuales
- mejora de la salud física y emocional a través de recuerdos
- práctica regular de ejercicios de regresión
- expansión de la perspectiva espiritual

**Key terms:** terapia de la regresión, sanación emocional, bienestar espiritual, recuerdos de vidas pasadas, equilibrio emocional

**Voz autorial:** La voz de Brian Weiss es accesible y empática, combinando la experiencia clínica con una perspectiva espiritual, invitando al lector a explorar su interior.

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
- Razón: El contenido generado utiliza conceptos específicos del libro, como la 'terapia de la regresión' y la idea de que 'los recuerdos de vidas pasadas' pueden ayudar en la sanación emocional y espiritual. Las frases reflejan directamente el enfoque del Dr. Weiss sobre cómo el pasado puede influir en el presente, lo que está claramente anclado en la sinopsis del libro.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly references regression therapy and emotional healing, which are central themes in 'Espejos del tiempo.' It uses specific phrases like 'uncover the roots of their current difficulties' and 'profound sense of spiritual well-being,' aligning closely with the book's focus on past life memories and their impact on present health.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en la experiencia del lector.
- EN: pagina — Uso de voz directa y enfoque en la experiencia del lector.

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
- Tokens totales: 9057
- Tiempo total: 25.1s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2219ms
- anchors: 2304 tokens, 5913ms
- palette: 0 tokens, 0ms
- content_es: 2460 tokens, 5950ms
- judge_es: 830 tokens, 2364ms
- content_en: 1881 tokens, 5521ms
- judge_en: 801 tokens, 1970ms
- voice: 781 tokens, 725ms
- highlight_judge_es_parrafoTop: 641 tokens, 0ms
- highlight_judge_es_parrafoBot: 640 tokens, 0ms
- highlight_judge_en_parrafoTop: 637 tokens, 0ms
- highlight_judge_en_parrafoBot: 633 tokens, 0ms
