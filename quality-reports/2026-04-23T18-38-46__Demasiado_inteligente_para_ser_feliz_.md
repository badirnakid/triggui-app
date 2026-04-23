# Quality Report — ¿Demasiado inteligente para ser feliz?

**Autor:** Jeanne Siaud-Facchin
**Ejecutado:** 2026-04-23T18-38-46
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

¿Cómo puedo saber si soy superdotado? En caso de serlo, ¿es posible que una gran inteligencia implique una sensibilidad exacerbada? ¿Puede aumentar también la fragilidad emocional e incluso causar sufrimiento? Ser superdotado es un don, pero a su vez es un talento que puede suscitar un sentimiento de inadaptación, una impresión de estar permanentemente fuera de lugar. ¿Cómo puedo vivir de la mejor manera posible? ¿Cómo puedo aprovechar todos mis recursos? En ¿Demasiado inteligente para ser feliz? Jeanne Siaud-Facchin nos ofrece recursos y consejos para comprender y convivir mejor con este tipo de personalidad y conseguir que las personas con altas capacidades se sientan mejor consigo mismas y con la gente que les rodea.

METADATA VERIFICADA:
- Título: ¿Dema...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la relación entre superdotación y sensibilidad emocional
- sentimiento de inadaptación en personas superdotadas
- estrategias para convivir con altas capacidades
- la dualidad de ser superdotado como un don y una carga
- recursos para mejorar la autoestima de personas con alta inteligencia

**Key terms:** superdotación, sensibilidad exacerbada, fragilidad emocional, inadaptación, altas capacidades

**Voz autorial:** La voz de Jeanne Siaud-Facchin es empática y comprensiva, ofreciendo un enfoque accesible y práctico para ayudar a las personas superdotadas a entender y aceptar su condición.

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
- Razón: The generated content directly reflects the themes and concepts presented in the ground truth, such as the duality of giftedness as both a gift and a burden, the heightened sensitivity, and the feelings of inadaptation. Phrases like 'sensibilidad exacerbada' and 'sentimiento de inadaptación' are specifically tied to the book's focus on understanding and coping with high intelligence, making it not

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects the themes and concepts presented in the ground truth, such as the duality of giftedness as both a gift and a burden, heightened sensitivity, and the sense of disconnection. Phrases like 'heightened sensitivity' and 'sense of disconnection' are specifically tied to the book's exploration of the emotional struggles faced by gifted individuals, making it clear

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y consejos prácticos sin referencias externas.
- EN: pagina — Voz directa y consejos prácticos sobre la experiencia de ser dotado.

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
- Tokens totales: 9473
- Tiempo total: 24.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2434ms
- anchors: 2455 tokens, 4996ms
- palette: 0 tokens, 0ms
- content_es: 2509 tokens, 7182ms
- judge_es: 846 tokens, 1790ms
- content_en: 1972 tokens, 5478ms
- judge_en: 820 tokens, 2165ms
- voice: 871 tokens, 866ms
