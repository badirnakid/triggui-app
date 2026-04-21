# Quality Report — Piensa como un monje

**Autor:** Jay Shetty
**Ejecutado:** 2026-04-21T13-31-01
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

Jay Shetty, la super estrella mundial del crecimiento personal, nos presenta su primer y esperado libro que transmite la valiosa sabiduría que aprendió cuando era monje. Cuando PIENSES COMO UN MONJE, sabrás cómo superar la negatividad, cómo dejar de pensar demasiado, por qué la comparación mata al amor, cómo usar tu miedo en tu beneficio,cómo aprender de todo el mundo, por qué no eres tus pensamientos, cómo encontrar tu propósito en la vida y mucho más. Jay Shetty, la superestrella de las redes sociales y presentador del podcast nº 1 On Purpose, destila en este libro la sabiduría eterna que aprendió como monje y la expone con pasos prácticos que cualquiera puede aplicar para gozar de una vida más tranquila. Después de tres años en la India para convertirse ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- superar la negatividad
- dejar de pensar demasiado
- usar el miedo a tu favor
- encontrar tu propósito en la vida
- reducir el estrés y mejorar las relaciones

**Key terms:** autoimagen, autoestima, atención plena, sabiduría eterna, condicionamiento social

**Voz autorial:** La voz de Jay Shetty es accesible y práctica, combinando sabiduría antigua con consejos contemporáneos que invitan a la reflexión y a la acción.

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
- Razón: The generated content specifically reflects concepts from the book 'Piensa como un monje' by Jay Shetty, particularly the idea of transforming fear into a tool for growth and the importance of mindfulness in overcoming negativity. Phrases like 'utiliza tu temor como impulso hacia el crecimiento' and 'el miedo se convierte en aliado cuando lo entiendes' directly echo the themes presented in the syn

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content specifically addresses the concept of transforming fear into a tool for personal growth, which aligns with Jay Shetty's teachings in 'Piensa como un monje'. It reflects the book's themes of overcoming negativity and using emotions to find purpose. However, while it is closely related to the book's principles, it does not directly quote or reference specific terms from the ground truth,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en el proceso personal sin referencias externas.
- EN: pagina — Voz directa y reflexiones sobre el miedo sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 12234
- Tiempo total: 23.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 1928ms
- anchors: 2929 tokens, 5160ms
- palette: 0 tokens, 1ms
- content_es: 3081 tokens, 6366ms
- judge_es: 1450 tokens, 1710ms
- content_en: 2524 tokens, 4067ms
- judge_en: 1432 tokens, 3671ms
- voice: 818 tokens, 853ms
