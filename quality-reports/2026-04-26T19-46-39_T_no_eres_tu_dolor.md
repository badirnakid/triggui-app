# Quality Report — Tú no eres tu dolor

**Autor:** Vidyamala Burch & Danny Penman
**Ejecutado:** 2026-04-26T19-46-39
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.94
- **Resolution path:** evidence_fetched_1sources
- **Match score:** 0.97



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

El dolor, el sufrimiento y el estrés pueden resultar intolerables; pero no necesariamente tiene que ser así. El mindfulness nos proporciona prácticas que podemos incorporar a nuestra vida cotidiana para aliviar los padecimientos de la enfermedad crónica. Los resultados de las investigaciones clínicas realizadas al respecto ponen de relieve que el mindfulness puede ser tan eficaz como los calmantes para mejorar los sistemas de curación natural del cuerpo. También puede reducir la ansiedad, la depresión, la irritabilidad, el agotamiento y el insomnio derivados del dolor y la enfermedad crónicos. Tú no eres tu dolor se basa en un programa de meditación de ocho semanas desarrollado por Vidyamala Burch y enseñado en Respira Vida Breathworks en todo el mundo.

ME...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- mindfulness como herramienta para aliviar el dolor
- prácticas cotidianas para manejar el sufrimiento
- eficacia del mindfulness comparable a calmantes
- reducción de ansiedad y depresión a través de la meditación
- programa de meditación de ocho semanas

**Key terms:** mindfulness, dolor crónico, meditación, curación natural, estrés

**Voz autorial:** La voz autorial es empática y accesible, combinando la experiencia personal con evidencia científica para guiar al lector hacia la sanación.

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
- Razón: The content directly references mindfulness, meditation, and the alleviation of chronic pain, which are central themes in the book. It also aligns with the book's premise of transforming suffering through mindfulness practices, making it highly specific to 'Tú no eres tu dolor'.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content directly references mindfulness, meditation, and the alleviation of chronic pain, which are central themes in the book. It also aligns with the book's premise of using mindfulness as a tool for healing, making it specifically anchored to the ground truth.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la práctica del mindfulness.
- EN: pagina — El texto presenta conceptos del libro sin referirse a él externamente.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.94 ← del tier de grounding alcanzado
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
- Tokens totales: 9244
- Tiempo total: 41.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 17259ms
- anchors: 2323 tokens, 5699ms
- palette: 0 tokens, 0ms
- content_es: 2496 tokens, 7406ms
- judge_es: 840 tokens, 2154ms
- content_en: 1933 tokens, 5752ms
- judge_en: 804 tokens, 1788ms
- voice: 848 tokens, 868ms
- highlight_judge_es_parrafoTop: 646 tokens, 0ms
- highlight_judge_es_parrafoTop_retry: 642 tokens, 0ms
- highlight_judge_es_parrafoBot: 656 tokens, 0ms
- highlight_judge_en_parrafoTop: 639 tokens, 0ms
- highlight_judge_en_parrafoBot: 646 tokens, 0ms
