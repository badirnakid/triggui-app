# Quality Report — Beneath the surface my story

**Autor:** Michael Phelps, Brian Cazeneuve & Bob Costas
**Ejecutado:** 2026-04-23T02-53-06
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
- impacto del divorcio de los padres
- entrenamiento y preparación mental de un campeón
- perspectivas tras bambalinas de competencias internacionales
- evolución de un adolescente torpe a un atleta récord

**Key terms:** atención, competitividad, medallas, entrenamiento, presión mediática

**Voz autorial:** La voz de Phelps es honesta y reflexiva, ofreciendo una mirada íntima a sus luchas personales y triunfos deportivos.

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
- Score: 0.70
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content reflects specific themes from Michael Phelps's autobiography, such as his battle with attention deficit disorder and the impact of his parents' divorce, which are mentioned in the ground truth. However, some phrases are more generic and could apply to various self-help contexts, reducing the overall score.

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects specific themes from the book, such as the struggle with attention deficit disorder and the impact of personal challenges like parental divorce. Phrases like 'each medal reflects not just victories, but profound personal battles' directly relate to Phelps's journey as described in the ground truth. However, some phrases are more generic and could apply to various contexts, dil

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales del autor.
- EN: pagina — Voz directa y reflexiones personales del autor.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.88 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.7 ← promedio de los 2 judges
- **Combined:** **0.85**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9306
- Tiempo total: 60.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40813ms
- anchors: 2372 tokens, 4564ms
- palette: 0 tokens, 0ms
- content_es: 2518 tokens, 5680ms
- judge_es: 858 tokens, 1706ms
- content_en: 1942 tokens, 4616ms
- judge_en: 851 tokens, 2272ms
- voice: 765 tokens, 827ms
