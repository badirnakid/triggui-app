# Quality Report — Tú no eres tu dolor

**Autor:** Vidyamala Burch & Danny Penman
**Ejecutado:** 2026-04-21T11-02-04
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
- prácticas de mindfulness para aliviar el dolor
- mindfulness como alternativa a los calmantes
- reducción de ansiedad y depresión a través de la meditación
- programa de meditación de ocho semanas
- mejora de los sistemas de curación natural del cuerpo

**Key terms:** mindfulness, meditación, dolor crónico, estrés, curación natural

**Voz autorial:** La voz autorial es compasiva y empoderadora, enfocándose en la resiliencia del individuo frente al dolor y la enfermedad, ofreciendo herramientas prácticas y accesibles.

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
- Razón: The generated content directly references key concepts from the ground truth, such as mindfulness, the eight-week meditation program, and the effects on chronic pain, anxiety, and depression. Phrases like 'transformar nuestra relación con el dolor' and 'activar los sistemas de curación natural del cuerpo' are specific to the themes and teachings of 'Tú no eres tu dolor', making it highly relevant.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes of mindfulness and pain management presented in the book's ground truth. It references the eight-week meditation program and the benefits of mindfulness in reducing anxiety and improving the body's natural healing systems, which are specific concepts from the book. However, some phrases are more general and could apply to various self-help or a 

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la práctica de mindfulness.
- EN: pagina — Voz directa y enfoque en la experiencia del lector.

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
- Tokens totales: 9329
- Tiempo total: 25.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3098ms
- anchors: 2330 tokens, 6938ms
- palette: 0 tokens, 0ms
- content_es: 2515 tokens, 5598ms
- judge_es: 859 tokens, 2658ms
- content_en: 1963 tokens, 4843ms
- judge_en: 807 tokens, 1745ms
- voice: 855 tokens, 852ms
