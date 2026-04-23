# Quality Report — Extreme ownership

**Autor:** Jocko Willink & Leif Babin
**Ejecutado:** 2026-04-23T02-53-06
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

An updated edition of the blockbuster bestselling leadership book that took America and the world by storm, two U.S. Navy SEAL officers who led the most highly decorated special operations unit of the Iraq War demonstrate how to apply powerful leadership principles from the battlefield to business and life. Sent to the most violent battlefield in Iraq, Jocko Willink and Leif Babin’s SEAL task unit faced a seemingly impossible mission: help U.S. forces secure Ramadi, a city deemed “all but lost.” In gripping firsthand accounts of heroism, tragic loss, and hard-won victories in SEAL Team Three’s Task Unit Bruiser, they learned that leadership—at every level—is the most important factor in whether a team succeeds or fails. Willink and Babin returned home from ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- liderazgo en situaciones críticas
- principios de liderazgo del campo de batalla
- responsabilidad total en la gestión
- estrategias para construir equipos de alto rendimiento
- aplicación de tácticas militares en el negocio

**Key terms:** extreme ownership, decentralized command, cover and move, leading up the chain, high-performance teams

**Voz autorial:** La voz autorial es directa, clara y motivadora, combinando narrativas de experiencias personales con enseñanzas prácticas sobre liderazgo.

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
- Razón: The generated content directly references key concepts from 'Extreme Ownership' such as 'extreme ownership' and 'decentralized command,' which are central to the book's teachings. The phrases and principles outlined in the content align closely with the book's focus on leadership in high-pressure situations, making it specifically relevant to the text.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content specifically references the concept of 'extreme ownership' and 'decentralized command,' both of which are key principles outlined in the book. The phrases and themes are closely aligned with the book's focus on leadership in high-pressure situations and the importance of responsibility in management. However, some phrases are somewhat generic and could apply to other leadership or self

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en conceptos del libro sin referencias externas.
- EN: pagina — El texto presenta conceptos en voz directa y sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.93**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10197
- Tiempo total: 65.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41553ms
- anchors: 2483 tokens, 9639ms
- palette: 0 tokens, 0ms
- content_es: 2695 tokens, 6602ms
- judge_es: 1051 tokens, 1977ms
- content_en: 2125 tokens, 2749ms
- judge_en: 1006 tokens, 2497ms
- voice: 837 tokens, 737ms
