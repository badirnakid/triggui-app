# Quality Report — Beneath the surface my story

**Autor:** Michael Phelps, Brian Cazeneuve & Bob Costas
**Ejecutado:** 2026-04-22T20-02-56
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.88
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 0.82



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

Prepare to peek into the mind of a champion, known as the most decorated Olympian of all time with 28 medals, including 23 gold, with this newly updated edition of Michael Phelps’s autobiography, Beneath the Surface. In this candid memoir, Phelps talks openly about his battle with attention deficit disorder, the trauma of his parents’ divorce, and the challenges that come with being thrust into the limelight. Readers worldwide will relive all the heart-stopping glory as Phelps completes his journey from the youngest man to ever set a world swimming record in 2001, to an Olympic powerhouse in 2008, to surpassing the greatest athlete of ancient Greece, Leonidas of Rhodes, with 13 triumphs in 2016. Athletes and fans alike will be fascinated by insights into Ph...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- lucha contra el trastorno por déficit de atención
- superación personal tras el divorcio de los padres
- preparación mental para la competencia
- evolución de un adolescente torpe a un atleta récord
- entrenamiento y preparación detrás de escena

**Key terms:** atención, superación, competencia, entrenamiento, medallas

**Voz autorial:** La voz de Michael Phelps es honesta y reflexiva, ofreciendo una mirada íntima a sus luchas personales y triunfos deportivos.

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
- Razón: The generated content directly references Michael Phelps's personal struggles with attention deficit disorder and his experiences related to his parents' divorce, both of which are explicitly mentioned in the ground truth. Additionally, it discusses his journey from an awkward teenager to a record-breaking athlete, aligning closely with the themes of resilience and mental preparation highlighted. 

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content reflects specific themes from Michael Phelps's autobiography, such as his struggle with attention deficit disorder and the impact of his parents' divorce on his life and career. Phrases like 'Each medal reflects an internal battle' and 'Overcoming the personal turmoil following my parents' divorce' directly connect to the ground truth. However, some phrases, while resonant, (

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y personal, sin referencias externas al libro.
- EN: pagina — Voz directa y personal, sin referencias meta.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.88 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.91**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9572
- Tiempo total: 66.1s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 39733ms
- anchors: 2359 tokens, 5482ms
- palette: 0 tokens, 1ms
- content_es: 2558 tokens, 8893ms
- judge_es: 914 tokens, 1921ms
- content_en: 2011 tokens, 7005ms
- judge_en: 889 tokens, 2108ms
- voice: 841 tokens, 961ms
