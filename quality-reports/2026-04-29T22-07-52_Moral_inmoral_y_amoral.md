# Quality Report — Moral inmoral y amoral

**Autor:** Osho
**Ejecutado:** 2026-04-29T22-07-52
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

Un libro en el que podrás descubrir que ser una persona consiente es posible, y los grandes beneficios que esto trae a tu vida. En Moral, inmoral y amoral, Osho explica la diferencia entre un ser humano consciente y uno que no ha despertado. Habla sobre lo correcto y lo incorrecto en el contexto de una realidad llena de trampas mentales. Dios, el bien y el mal, la religión y lo espiritual son algunos de los temas que han intrigado al hombre a lo largo de su historia, y aquí, de la mano del gran místico contemporáneo, las palabras iluminan la oscuridad de cada incógnita. Si tu conciencia te permite hacer algo, está bien: hazlo. Que no te preocupe ninguna escritura sagrada.Y si tu consciencia no te permite hacer algo, no lo hagas. Ni siquiera si Dios te dice ...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- diferencia entre un ser humano consciente y uno que no ha despertado
- trampas mentales en la percepción del bien y el mal
- la importancia de la conciencia personal sobre las normas religiosas
- la libertad de actuar según la propia conciencia
- la iluminación de las incógnitas de la espiritualidad

**Key terms:** conciencia, bien, mal, religión, espiritualidad, despertar

**Voz autorial:** La voz de Osho es provocativa y reflexiva, invitando al lector a cuestionar las normas sociales y religiosas a través de un enfoque personal y consciente.

---

## 🎨 Visual synthesis

- hue_primary: 250
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_moderno
- Resultado: paper=#D0CFD3, accent=#3D1FD6, ink=#18171C, contraste=11.50:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects key concepts from Osho's book, such as the importance of personal consciousness, the distinction between right and wrong beyond societal norms, and the idea of mental traps. Phrases like 'la conciencia es el faro que guía al ser despierto' and 'cuestiona lo que te han enseñado' are closely aligned with the themes presented in the ground truth, making it very

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects key concepts from the book, such as personal consciousness, the distinction between right and wrong, and the critique of societal norms. Phrases like 'conscious being' and 'mental traps in the perception of good and evil' are specifically aligned with Osho's teachings in 'Moral, inmoral y amoral', demonstrating a clear connection to the ground truth.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones en primera persona sobre la conciencia.
- EN: pagina — Voz directa y reflexiones en primera persona sobre la conciencia.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.96**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- author_truncated: "Osho"

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9544
- Tiempo total: 38.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 16991ms
- anchors: 2420 tokens, 4362ms
- palette: 0 tokens, 1ms
- content_es: 2537 tokens, 5616ms
- judge_es: 905 tokens, 2874ms
- content_en: 1975 tokens, 4997ms
- judge_en: 861 tokens, 2460ms
- voice: 846 tokens, 1022ms
- highlight_judge_es_parrafoTop: 648 tokens, 0ms
- highlight_judge_es_parrafoBot: 654 tokens, 0ms
- highlight_judge_en_parrafoTop: 633 tokens, 0ms
- highlight_judge_en_parrafoBot: 640 tokens, 0ms
