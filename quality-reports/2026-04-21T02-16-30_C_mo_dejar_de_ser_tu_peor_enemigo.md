# Quality Report — Cómo dejar de ser tu peor enemigo

**Autor:** Alba Cardalda
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

QUERERSE ES FÁCIL, SI SABES CÓMO. Por la autora del best seller Cómo mandar a la m****a de forma educada. MÁS DE 300.000 PERSONAS YA LO RECOMIENDAN. Hay una persona con la que dialogas, debates, discutes, te enfadas y te reconcilias varias veces al día. Y no, no es tu pareja, ni tu jefe, ni tu padre ni tu madre. Eres tú. Tú eres la persona con quien más hablas e, irremediablemente, a quien más escuchas. Pero no siempre te hablas bien, ni siquiera con el respeto que pedirías a los demás. Y esto repercute en la relación que tienes contigo mismo y afecta directamente tu autoestima y tu salud mental. Tanto que a menudo te boicoteas y te acabas convirtiendo, sin saberlo, en tu peor enemigo. La neuropsicóloga Alba Cardalda nos muestra en este libro cómo operan nu...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la importancia del diálogo interno
- herramientas para mejorar la autoestima
- técnicas de asertividad
- mindfulness para el autoconocimiento
- cuidado del bienestar mental

**Key terms:** diálogo interno, autoestima, asertividad, mindfulness, cuidado personal

**Voz autorial:** La voz de la autora es accesible y empática, combinando un enfoque científico con consejos prácticos y motivacionales.

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
- Razón: The generated content specifically reflects the themes and concepts from the ground truth of the book 'Cómo dejar de ser tu peor enemigo' by Alba Cardalda. It discusses the importance of internal dialogue, self-talk, and the impact on self-esteem and mental health, which are central to the book's message. Phrases like 'transforma tu diálogo interno' and 'cuidar lo que te dices a ti mismo' directly

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes of internal dialogue and self-esteem improvement presented in the ground truth. It references concepts like 'nurturing the words you speak to yourself' and 'practicing assertiveness,' which are central to the book's message. However, while it is specific to the book's focus, some phrases are somewhat generic and could apply to other self-help or

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y consejos prácticos sin referencias externas.
- EN: pagina — Voz directa y enfoque en el diálogo interno sin referencias externas.

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
- Tokens totales: 10156
- Tiempo total: 63.3s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41160ms
- anchors: 2618 tokens, 5749ms
- palette: 0 tokens, 0ms
- content_es: 2627 tokens, 6516ms
- judge_es: 1012 tokens, 1911ms
- content_en: 2080 tokens, 5091ms
- judge_en: 998 tokens, 1985ms
- voice: 821 tokens, 937ms
