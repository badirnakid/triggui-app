# Quality Report — Tú no eres tu dolor

**Autor:** Vidyamala Burch & Danny Penman
**Ejecutado:** 2026-04-22T14-41-30
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
- mindfulness como herramienta para aliviar el dolor crónico
- prácticas cotidianas para manejar el sufrimiento
- eficacia del mindfulness comparada con los calmantes
- reducción de la ansiedad y depresión a través de la meditación
- programa de meditación de ocho semanas

**Key terms:** mindfulness, dolor crónico, meditación, curación natural, estrés

**Voz autorial:** La voz de los autores es empática y accesible, enfocándose en la conexión entre la mente y el cuerpo para ofrecer herramientas prácticas que promueven la sanación.

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
- Razón: The generated content directly reflects the core concepts of the book, such as mindfulness, the management of chronic pain, and the use of meditation as a tool for healing. Phrases like 'mindfulness transforma la percepción del dolor crónico' and 'la meditación ofrece un camino accesible para gestionar la ansiedad y la depresión' specifically reference the book's themes and practices, making it a 

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes of mindfulness and chronic pain relief as outlined in the ground truth. Phrases like 'mindfulness is a tool for chronic pain relief' and 'meditation offers an accessible path to manage anxiety and depression' directly reference the book's focus on mindfulness practices for alleviating chronic pain and associated mental health issues. However, it

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la experiencia del lector.
- EN: pagina — Voz directa y enfoque en la práctica de la meditación.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.94 ← del tier de grounding alcanzado
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
- Tokens totales: 9009
- Tiempo total: 33.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 4482ms
- anchors: 2333 tokens, 11172ms
- palette: 0 tokens, 0ms
- content_es: 2464 tokens, 6279ms
- judge_es: 815 tokens, 2829ms
- content_en: 1859 tokens, 4964ms
- judge_en: 761 tokens, 2721ms
- voice: 777 tokens, 925ms
