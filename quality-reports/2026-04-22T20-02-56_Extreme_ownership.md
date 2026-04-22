# Quality Report — Extreme ownership

**Autor:** Jocko Willink & Leif Babin
**Ejecutado:** 2026-04-22T20-02-56
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_4sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

An updated edition of the blockbuster bestselling leadership book that took America and the world by storm, two U.S. Navy SEAL officers who led the most highly decorated special operations unit of the Iraq War demonstrate how to apply powerful leadership principles from the battlefield to business and life. Sent to the most violent battlefield in Iraq, Jocko Willink and Leif Babin’s SEAL task unit faced a seemingly impossible mission: help U.S. forces secure Ramadi, a city deemed “all but lost.” In gripping firsthand accounts of heroism, tragic loss, and hard-won victories in SEAL Team Three’s Task Unit Bruiser, they learned that leadership—at every level—is the most important factor in whether a team succeeds or fails. Willink and Babin returned home from ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- principios de liderazgo del campo de batalla aplicados a la vida y los negocios
- la importancia del liderazgo en el éxito del equipo
- la mentalidad de propiedad extrema en la gestión
- estrategias como 'Cover and Move' y 'Decentralized Command'
- la responsabilidad de liderar y ganar en cualquier entorno

**Key terms:** propiedad extrema, liderazgo, SEAL, alta performance, estrategia

**Voz autorial:** La voz autorial es directa, práctica y basada en experiencias reales, combinando narrativas de combate con lecciones de liderazgo aplicables.

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
- Razón: The generated content specifically references the concept of 'extreme ownership,' which is a central theme in the book. It discusses how this principle transforms leadership and emphasizes accountability, aligning closely with the book's focus on leadership principles derived from military experience. The phrases used are directly related to the book's teachings, making it highly specific and not,

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content directly references the principle of 'extreme ownership,' which is a core concept from the book. It discusses the mindset of leadership and responsibility, aligning closely with the themes presented in the ground truth. However, while it is specific to the book's teachings, some phrases are somewhat generic and could apply to other leadership contexts, which prevents a perfect score.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas personales.
- EN: pagina — Usa voz directa y se enfoca en la aplicación del concepto.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.92 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10124
- Tiempo total: 51.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 27852ms
- anchors: 2488 tokens, 5490ms
- palette: 0 tokens, 0ms
- content_es: 2677 tokens, 5751ms
- judge_es: 1022 tokens, 2260ms
- content_en: 2130 tokens, 4781ms
- judge_en: 1001 tokens, 1554ms
- voice: 806 tokens, 3304ms
