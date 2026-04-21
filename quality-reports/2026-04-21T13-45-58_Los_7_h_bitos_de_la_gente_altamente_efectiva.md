# Quality Report — Los 7 hábitos de la gente altamente efectiva

**Autor:** Stephen R. Covey
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

Los 7 Hábitos de la Gente Altamente Efectiva es el método más claro, certero y eficaz para mejorar tu vida y liderazgo en los negocios. El método de Stephen R. Covey está dividido en siete etapas que el lector deberá asimilar y poner en práctica por su propia cuenta, adaptándolas a su personalidad y aplicándolas libremente en todos los ámbitos de la vida empresarial. Los 7 Hábitos de la Gente Altamente Efectiva – Edición de Imágenes toma esta filosofía y la resume, en una serie de claras y concisas infografías. Estas imágenes resumen y analizan cada uno de los siete hábitos por separado, explicando con todo detalle, la funcionalidad y práctica de cada uno de ellos.

METADATA VERIFICADA:
- Título: Los 7 Hábitos de la Gente Altamente Efectiva
- Autor: Stephen...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- desarrollo de la autoconfianza
- transformación personal como clave del liderazgo
- adaptación de hábitos a la personalidad
- integridad y honestidad en el ámbito laboral
- práctica de hábitos efectivos en la vida empresarial

**Key terms:** hábitos, liderazgo, efectividad, autoconfianza, transformación personal

**Voz autorial:** La voz de Covey es clara, directa y orientada a la acción, proporcionando un enfoque práctico y estructurado para el desarrollo personal y profesional.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_moderno
- Resultado: paper=#CFD2D3, accent=#1F99D6, ink=#171A1C, contraste=11.50:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 0.70
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The content reflects specific concepts from the book, such as the importance of personal transformation and adapting habits to one's personality, which are central to Covey's philosophy. However, while it is anchored in the themes of the book, the language used is somewhat generic and could apply to other self-help or leadership literature, which slightly lowers the grounded score.

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects key concepts from 'Los 7 Hábitos de la Gente Altamente Efectiva', particularly the emphasis on personal transformation and adapting habits to one's personality. Phrases like 'adapt your habits to reflect your true self' align with Covey's principles. However, the content is somewhat generic in its language and could apply to various self-help contexts, which prevents a higher,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre transformación personal y hábitos.
- EN: pagina — Tono directo y reflexivo, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.7 ← promedio de los 2 judges
- **Combined:** **0.86**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9189
- Tiempo total: 28.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3026ms
- anchors: 2350 tokens, 6662ms
- palette: 0 tokens, 0ms
- content_es: 2494 tokens, 5397ms
- judge_es: 840 tokens, 2292ms
- content_en: 1898 tokens, 4647ms
- judge_en: 784 tokens, 1959ms
- voice: 823 tokens, 4028ms
