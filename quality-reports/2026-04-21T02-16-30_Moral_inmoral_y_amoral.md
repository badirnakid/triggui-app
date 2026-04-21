# Quality Report — Moral inmoral y amoral

**Autor:** Osho
**Ejecutado:** 2026-04-21T02-16-30
**Pipeline:** nucleus-canonical-v3

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

Un libro en el que podrás descubrir que ser una persona consiente es posible, y los grandes beneficios que esto trae a tu vida. En Moral, inmoral y amoral, Osho explica la diferencia entre un ser humano consciente y uno que no ha despertado. Habla sobre lo correcto y lo incorrecto en el contexto de una realidad llena de trampas mentales. Dios, el bien y el mal, la religión y lo espiritual son algunos de los temas que han intrigado al hombre a lo largo de su historia, y aquí, de la mano del gran místico contemporáneo, las palabras iluminan la oscuridad de cada incógnita. Si tu conciencia te permite hacer algo, está bien: hazlo. Que no te preocupe ninguna escritura sagrada.Y si tu consciencia no te permite hacer algo, no lo hagas. Ni siquiera si Dios te dice ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- diferencia entre ser humano consciente y no consciente
- trampas mentales en la realidad
- la conciencia como guía moral
- la relación entre Dios y la moralidad
- la libertad de actuar según la conciencia personal

**Key terms:** conciencia, moralidad, bien, mal, religión, espiritualidad

**Voz autorial:** Osho utiliza un lenguaje accesible y provocador, invitando a la reflexión y el cuestionamiento de normas establecidas, con un enfoque en la libertad individual y la autoconciencia.

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
- Razón: The generated content directly reflects the themes and concepts presented in the ground truth of Osho's book. It discusses the essence of morality as derived from personal consciousness, which aligns with Osho's emphasis on individual awareness over imposed rules. Phrases like 'la moralidad auténtica nace de la conciencia despierta' and 'actuar desde la conciencia personal es un acto de libertad' 

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content reflects key themes from Osho's work, particularly the idea that morality stems from individual consciousness rather than external rules. Phrases like 'awakened consciousness' and 'good and evil are mental constructs' directly relate to the book's exploration of morality. However, some phrases are somewhat generic and could apply to broader philosophical discussions, which slightly dil

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones en primera persona sobre moralidad.
- EN: pagina — Voz directa y reflexiones sobre la conciencia sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.93**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- author_truncated: "Osho"

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9375
- Tiempo total: 65.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41415ms
- anchors: 2414 tokens, 6067ms
- palette: 0 tokens, 0ms
- content_es: 2518 tokens, 5523ms
- judge_es: 875 tokens, 2319ms
- content_en: 1935 tokens, 6349ms
- judge_en: 829 tokens, 3138ms
- voice: 804 tokens, 1091ms
