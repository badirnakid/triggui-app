# Quality Report — Sintonizarse con la existencia

**Autor:** Osho
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

Un libro imprescindible sobre la visión de Osho para promover el cambio que la humanidad necesita Las grandes ideas a las que se aferró la humanidad en el pasado -el matrimonio, el poder, la moral- han sido cuestionadas. Ante esta época de profundos cambios, Osho nos presenta sin embargo una visión positiva del ser humano y el futuro. Es momento de construir una sociedad nueva, que solo se logrará con un salto cuántico en la conciencia de los individuos. Este libro, en el que Osho se detiene en el despertar de la conciencia y las cualidades del hombre nuevo, además de dedicar una mirada renovada a cuestiones de siempre, como el amor, la familia o el dinero, es un compendio de las claves fundamentales de la propuesta del gran maestro del siglo XXI para una n...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- despertar de la conciencia
- cualidades del hombre nuevo
- sociedad de seres humanos amorosos
- cambio personal como motor del cambio mundial
- nueva visión del amor, la familia y el dinero

**Key terms:** conciencia, meditación, amor, libertad, cambio cuántico

**Voz autorial:** Osho utiliza un lenguaje accesible y provocador, invitando a la reflexión y al cuestionamiento de creencias establecidas, con un enfoque en la espiritualidad y el crecimiento personal.

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
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content closely reflects the themes and concepts presented in the ground truth of Osho's book. Phrases like 'despertar de la conciencia', 'cambio personal', and 'sociedad más amorosa y libre' directly align with Osho's vision of individual transformation leading to societal change. Additionally, the emphasis on love, family, and meditation as pathways to freedom mirrors the key ideas

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content closely aligns with the themes of Osho's book, particularly the emphasis on personal change as a precursor to societal transformation and the redefinition of relationships with love, family, and money. Phrases like 'awakening consciousness' and 'true freedom' reflect Osho's core ideas. However, some phrases are slightly generic and could apply to other self-help contexts, which is why 

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre el cambio interno.
- EN: pagina — Voz directa y reflexiones sobre el cambio personal.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.86 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.91**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- author_truncated: "Osho"

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9399
- Tiempo total: 26.2s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 5183ms
- anchors: 2380 tokens, 4440ms
- palette: 0 tokens, 0ms
- content_es: 2524 tokens, 5128ms
- judge_es: 893 tokens, 1791ms
- content_en: 1948 tokens, 6891ms
- judge_en: 863 tokens, 1733ms
- voice: 791 tokens, 1049ms
