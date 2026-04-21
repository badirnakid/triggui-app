# Quality Report — Tú no eres tu dolor

**Autor:** Vidyamala Burch & Danny Penman
**Ejecutado:** 2026-04-21T11-43-12
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.94
- **Resolution path:** evidence_fetched_3sources
- **Match score:** 0.97



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

El dolor, el sufrimiento y el estrés pueden resultar intolerables; pero no necesariamente tiene que ser así. El mindfulness nos proporciona prácticas que podemos incorporar a nuestra vida cotidiana para aliviar los padecimientos de la enfermedad crónica. Los resultados de las investigaciones clínicas realizadas al respecto ponen de relieve que el mindfulness puede ser tan eficaz como los calmantes para mejorar los sistemas de curación natural del cuerpo. También puede reducir la ansiedad, la depresión, la irritabilidad, el agotamiento y el insomnio derivados del dolor y la enfermedad crónicos. Tú no eres tu dolor se basa en un programa de meditación de ocho semanas desarrollado por Vidyamala Burch y enseñado en Respira Vida Breathworks en todo el mundo.

ME...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- prácticas de mindfulness para aliviar el dolor crónico
- eficacia del mindfulness comparable a calmantes
- reducción de la ansiedad y depresión asociadas al dolor
- programa de meditación de ocho semanas
- mejoramiento de los sistemas de curación natural del cuerpo

**Key terms:** mindfulness, dolor crónico, meditación, estrés, curación natural

**Voz autorial:** La voz autorial combina un enfoque práctico y accesible con una profunda comprensión del sufrimiento humano, promoviendo la autocompasión y la resiliencia.

---

## 🎨 Visual synthesis

- hue_primary: 140
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#CFD3D0, accent=#1FD65C, ink=#171C19, contraste=11.41:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content closely aligns with the ground truth of the book 'Tú no eres tu dolor' by incorporating specific concepts such as mindfulness, the eight-week meditation program, and the relationship between pain and suffering. Phrases like 'transforma tu relación con el dolor' and 'cultivar la autocompasión' directly reflect the themes and practices outlined in the book, demonstrating a deep

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the core themes and concepts from the ground truth, specifically mentioning mindfulness, the transient nature of pain, and the eight-week meditation program. It incorporates specific ideas about self-compassion and the body's natural healing systems, which are central to the book's message.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la práctica del mindfulness.
- EN: pagina — Voz directa y enfoque en la práctica de mindfulness.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.94 ← del tier de grounding alcanzado
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
- Tokens totales: 9260
- Tiempo total: 25.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3373ms
- anchors: 2321 tokens, 5459ms
- palette: 0 tokens, 0ms
- content_es: 2514 tokens, 6324ms
- judge_es: 859 tokens, 2095ms
- content_en: 1943 tokens, 4415ms
- judge_en: 787 tokens, 2954ms
- voice: 836 tokens, 915ms
