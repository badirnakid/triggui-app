# Quality Report — Tú no eres tu dolor

**Autor:** Vidyamala Burch & Danny Penman
**Ejecutado:** 2026-04-29T22-07-52
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
- la práctica del mindfulness como herramienta para aliviar el dolor crónico
- la meditación como método para mejorar la salud mental
- reducción de la ansiedad y depresión a través de la atención plena
- la conexión entre mente y cuerpo en el proceso de curación
- un programa de meditación de ocho semanas para el manejo del dolor

**Key terms:** mindfulness, meditación, dolor crónico, curación natural, salud mental

**Voz autorial:** La voz autorial es empática y accesible, enfocándose en la experiencia del lector y en brindar herramientas prácticas para el manejo del dolor y el sufrimiento.

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
- Razón: El contenido generado utiliza conceptos específicos del libro, como la relación entre mindfulness y el dolor crónico, y menciona la transformación del sufrimiento, que son temas centrales en 'Tú no eres tu dolor'. Además, las frases reflejan directamente las prácticas y beneficios del mindfulness descritos en el ground_truth.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content closely aligns with the themes of mindfulness and chronic pain management discussed in the book. It references the transformation of the relationship with pain and the role of meditation, which are central to the book's premise. However, some phrases are more general and could apply to various self-help contexts.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en la práctica del mindfulness.
- EN: pagina — Uso de voz directa y enfoque en la práctica de mindfulness.

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
- Tokens totales: 9095
- Tiempo total: 41.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 17112ms
- anchors: 2351 tokens, 4883ms
- palette: 0 tokens, 1ms
- content_es: 2471 tokens, 6166ms
- judge_es: 803 tokens, 1325ms
- content_en: 1894 tokens, 8717ms
- judge_en: 801 tokens, 1536ms
- voice: 775 tokens, 1161ms
- highlight_judge_es_parrafoTop: 648 tokens, 0ms
- highlight_judge_es_parrafoBot: 645 tokens, 0ms
- highlight_judge_en_parrafoTop: 640 tokens, 0ms
- highlight_judge_en_parrafoBot: 644 tokens, 0ms
