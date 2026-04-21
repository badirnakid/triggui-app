# Quality Report — Beneath the Surface

**Autor:** Michael Phelps, Brian Cazeneuve & Bob Costas
**Ejecutado:** 2026-04-21T13-45-58
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

Prepare to peek into the mind of a champion, known as the most decorated Olympian of all time with 28 medals, including 23 gold, with this newly updated edition of Michael Phelps’s autobiography, Beneath the Surface. In this candid memoir, Phelps talks openly about his battle with attention deficit disorder, the trauma of his parents’ divorce, and the challenges that come with being thrust into the limelight. Readers worldwide will relive all the heart-stopping glory as Phelps completes his journey from the youngest man to ever set a world swimming record in 2001, to an Olympic powerhouse in 2008, to surpassing the greatest athlete of ancient Greece, Leonidas of Rhodes, with 13 triumphs in 2016. Athletes and fans alike will be fascinated by insights into Ph...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- lucha contra el trastorno por déficit de atención
- trauma del divorcio de los padres
- desafíos de la fama
- preparación mental para competiciones
- evolución de un adolescente torpe a un atleta récord

**Key terms:** medallas olímpicas, entrenamiento, preparación mental, competencias internacionales, autobiografía

**Voz autorial:** La voz de Phelps es honesta y reflexiva, mostrando vulnerabilidad mientras comparte su viaje personal y profesional.

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
- Razón: The generated content directly references Michael Phelps's personal struggles with attention deficit disorder and the pressures of fame, both of which are explicitly mentioned in the ground truth. The phrases about mental preparation and personal battles align closely with the themes of the autobiography, making it specific to Phelps's experiences.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly references Michael Phelps's struggles with attention deficit disorder and the challenges of fame, both of which are explicitly mentioned in the ground truth. Additionally, the themes of mental preparation and personal battles resonate strongly with the memoir's focus on Phelps's journey as an athlete. The phrases used reflect specific insights and experiences from P助

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y personal del autor sobre su experiencia.
- EN: pagina — Voz directa y personal del autor sobre su experiencia.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.96**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9298
- Tiempo total: 21.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2802ms
- anchors: 2393 tokens, 5056ms
- palette: 0 tokens, 1ms
- content_es: 2531 tokens, 4603ms
- judge_es: 876 tokens, 1868ms
- content_en: 1914 tokens, 4574ms
- judge_en: 831 tokens, 2058ms
- voice: 753 tokens, 757ms
