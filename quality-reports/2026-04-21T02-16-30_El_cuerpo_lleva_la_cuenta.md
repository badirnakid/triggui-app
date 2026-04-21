# Quality Report — El cuerpo lleva la cuenta

**Autor:** Bessel van der Kolk
**Ejecutado:** 2026-04-21T02-16-30
**Pipeline:** nucleus-canonical-v3

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

El cuerpo lleva la cuenta ha sido traducido a más de 30 idiomas y ha vendido millones de ejemplares en todo el mundo. Ha estado de forma intermitente en la lista de bestseller del NYT de la sección de ciencia desde su publicación. Este libro profundamente humano ofrece una nueva comprensión radical de las causas y consecuencias del trauma, que ofrece esperanza y claridad a todas las personas afectadas por su devastación. El trauma ha surgido como uno de los grandes retos de la salud pública de nuestro tiempo, no sólo por sus efectos bien documentados sobre los veteranos de guerra y víctimas de accidentes y delitos, sino debido a la cifra oculta de la violencia sexual y familiar y en las comunidades y escuelas devastadas por el abuso, el abandono y la adicci...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la neuroplasticidad como camino hacia la recuperación
- el impacto del trauma en el cuerpo y el cerebro
- la importancia de las relaciones en la sanación
- tratamientos innovadores como el yoga y el teatro
- la lucha contra la tiranía del pasado

**Key terms:** neuroretroalimentación, conciencia corporal, trauma, resiliencia, apego

**Voz autorial:** La voz del autor es empática y autoritaria, basada en una extensa experiencia clínica y científica, ofreciendo una perspectiva accesible y esperanzadora sobre el trauma y la recuperación.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_literario
- Resultado: paper=#CFD2D3, accent=#1F99D6, ink=#171A1C, contraste=11.50:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly references key concepts from the ground truth, such as trauma's impact on the brain and body, the role of neuroplasticity in recovery, and the importance of human relationships in healing. Phrases like 'El trauma remodela tanto el cerebro como el cuerpo' and 'La neuroplasticidad abre nuevas puertas a la recuperación' are specific to the themes discussed in 'El cuerpo

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes and concepts from 'El cuerpo lleva la cuenta,' particularly the ideas of trauma, neuroplasticity, and the importance of human connections in healing. Phrases like 'neuroplasticity offers a pathway to recovery' and 'human connections serve as the thread that weaves healing together' directly reflect the book's focus on trauma's impact on the body

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la experiencia del cuerpo y la mente.
- EN: pagina — Uso de voz directa y enfoque en el proceso de sanación.

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
- Tokens totales: 11098
- Tiempo total: 68.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41639ms
- anchors: 2856 tokens, 10067ms
- palette: 0 tokens, 1ms
- content_es: 2834 tokens, 6546ms
- judge_es: 1185 tokens, 2750ms
- content_en: 2260 tokens, 5067ms
- judge_en: 1142 tokens, 1943ms
- voice: 821 tokens, 730ms
