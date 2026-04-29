# Quality Report — Extreme ownership

**Autor:** Jocko Willink & Leif Babin
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

An updated edition of the blockbuster bestselling leadership book that took America and the world by storm, two U.S. Navy SEAL officers who led the most highly decorated special operations unit of the Iraq War demonstrate how to apply powerful leadership principles from the battlefield to business and life. Sent to the most violent battlefield in Iraq, Jocko Willink and Leif Babin’s SEAL task unit faced a seemingly impossible mission: help U.S. forces secure Ramadi, a city deemed “all but lost.” In gripping firsthand accounts of heroism, tragic loss, and hard-won victories in SEAL Team Three’s Task Unit Bruiser, they learned that leadership—at every level—is the most important factor in whether a team succeeds or fails. Willink and Babin returned home from ...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- liderazgo en situaciones críticas
- aplicación de principios militares en negocios
- responsabilidad total en el liderazgo
- estrategias de equipo en entornos de alta presión
- mentalidad de misión en la gestión

**Key terms:** Extreme Ownership, Cover and Move, Decentralized Command, Leading Up the Chain, alta performance

**Voz autorial:** La voz autorial es directa, contundente y basada en experiencias reales, combinando narrativas de combate con lecciones prácticas de liderazgo.

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
- Razón: The content directly reflects key concepts from 'Extreme Ownership', such as total responsibility and leadership principles. Phrases like 'asumir la responsabilidad total' and 'unidad y confianza' align closely with the book's themes of leadership in high-pressure environments, making it specific and relevant.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content directly reflects key concepts from 'Extreme Ownership' such as taking responsibility, accountability, and fostering unity within teams. Phrases like 'complete responsibility for every action' and 'transforming failures into opportunities for growth' align closely with the book's principles, demonstrating a clear connection to the authors' teachings.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en conceptos del liderazgo sin referencias externas.
- EN: pagina — Voz directa y enfoque en el concepto de liderazgo.

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
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10074
- Tiempo total: 39.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 20269ms
- anchors: 2475 tokens, 4175ms
- palette: 0 tokens, 0ms
- content_es: 2660 tokens, 5722ms
- judge_es: 1023 tokens, 1522ms
- content_en: 2094 tokens, 4031ms
- judge_en: 1009 tokens, 2315ms
- voice: 813 tokens, 885ms
- highlight_judge_es_parrafoTop: 638 tokens, 0ms
- highlight_judge_es_parrafoBot: 646 tokens, 0ms
- highlight_judge_es_parrafoBot_retry: 653 tokens, 0ms
- highlight_judge_en_parrafoTop: 635 tokens, 0ms
- highlight_judge_en_parrafoBot: 639 tokens, 0ms
