# Quality Report — La magia de ser tú mismo

**Autor:** Osho
**Ejecutado:** 2026-04-21T13-45-58
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
- la búsqueda de la subjetividad personal
- la liberación del falso yo
- la creatividad como esencia del ser
- la influencia de la sociedad en la identidad
- la importancia de la conciencia en el autodescubrimiento

**Key terms:** falso yo, ego, despertar, conciencia, originalidad

**Voz autorial:** Osho utiliza un tono reflexivo y provocador, invitando al lector a cuestionar sus creencias y a explorar su verdadera esencia, a menudo con un enfoque poético y filosófico.

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
- Razón: The generated content closely reflects the core themes and concepts presented in the ground truth of Osho's book. It discusses the importance of subjective experience, the concept of the 'false self' or 'ego', and the journey towards authenticity, all of which are central to Osho's teachings. Phrases like 'la liberación del falso yo' and 'la búsqueda de la subjetividad personal' directly echo the 

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes of Osho's teachings, particularly the concepts of 'false self' and 'original nature.' Phrases like 'letting go of external expectations' and 'dismantling the layers that obscure our true essence' reflect the book's focus on self-discovery and the critique of societal conditioning. However, while it is specific to the book, some phrases could be,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sin referencias externas.
- EN: pagina — Voz directa y reflexiones en primera persona sobre el ser auténtico.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.84 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.89**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- author_truncated: "Osho"

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9919
- Tiempo total: 23.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3464ms
- anchors: 2560 tokens, 5312ms
- palette: 0 tokens, 0ms
- content_es: 2597 tokens, 5481ms
- judge_es: 958 tokens, 2802ms
- content_en: 2041 tokens, 3649ms
- judge_en: 930 tokens, 2323ms
- voice: 833 tokens, 861ms
