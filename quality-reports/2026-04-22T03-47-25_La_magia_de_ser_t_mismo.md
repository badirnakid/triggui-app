# Quality Report — La magia de ser tú mismo

**Autor:** Osho
**Ejecutado:** 2026-04-22T03-47-25
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.84
- **Resolution path:** evidence_fetched_3sources
- **Match score:** 0.73



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

Las enseñanzas de Osho para seguir en nuestro camino de despertar y encontrarnos a nosotros mismos. Nadie puede decirnos quiénes somos realmente, pero todos buscamos una definición de nosotros mismos que venga de fuera. La magia de ser tú mismo es la respuesta que hallamos cuando empezamos a buscarnos y no encontramos objetividad, sino subjetividad# y este descubrimiento es como una bendición, como un éxtasis, que permite que dejemos de buscar el camino hacia el paraíso «allí fuera». Parte de nuestra experiencia cotidiana está moldeada por la religión y los condicionantes sociales y ni siquiera somos conscientes de ello. Osho nos explica que constantemente estamos siendo pulidos de la única naturaleza con la que cada uno de nosotros ha nacido. Esta única y ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la búsqueda interna de la verdadera identidad
- la liberación del falso yo y el ego
- el impacto de la sociedad en nuestra auto percepción
- la importancia de la conciencia y la alerta en el autodescubrimiento
- el camino hacia la autenticidad como un viaje valiente

**Key terms:** despertar, subjetividad, falso yo, ego, conciencia

**Voz autorial:** La voz de Osho es reflexiva y provocadora, invitando al lector a cuestionar las normas sociales y a explorar su propia autenticidad a través de una prosa poética y filosófica.

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
- Razón: The generated content is deeply anchored in the themes and concepts presented in the ground truth. It explicitly references the journey of self-discovery, the conflict between true essence and ego, and the importance of awareness and questioning societal norms, all of which are central to Osho's teachings in 'La magia de ser tú mismo'. The phrases used are specific to the book's message and cannot

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes and concepts presented in the ground truth of Osho's book. It specifically addresses the journey of self-discovery, the distinction between the true self and the ego, and emphasizes the importance of consciousness and alertness, all of which are central to Osho's teachings as outlined in the synopsis. The phrases used in the content, such as 'false

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre la autenticidad.
- EN: pagina — Voz directa y reflexiones personales sobre el autodescubrimiento.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.84 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.89 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- author_truncated: "Osho"

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10006
- Tiempo total: 67.2s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40722ms
- anchors: 2568 tokens, 12290ms
- palette: 0 tokens, 0ms
- content_es: 2626 tokens, 5104ms
- judge_es: 959 tokens, 1508ms
- content_en: 2070 tokens, 5077ms
- judge_en: 932 tokens, 1676ms
- voice: 851 tokens, 820ms
