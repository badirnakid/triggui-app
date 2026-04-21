# Quality Report — El sendero del yoga

**Autor:** Osho
**Ejecutado:** 2026-04-21T11-02-04
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

En la actualidad sobreviven del yoga, sobre todo, los ejercicios físicos que ayudan a lograr un estado vital más relajado y equilibrado. No obstante, como explica Osho, las posturas no vinieron primero, sino que los practicantes se dieron cuenta de que al alcanzar un estado meditativo, el cuerpo adoptaba ciertas posturas de modo natural. Al estar cuerpo y mente tan íntimamente conectados, es posible lograr cierta paz de espítritu mediante una postura corporal que corresponda a esta paz. Pero sería un error creer que el carro tira del caballo. Al retroceder a las enseñanzas originales como punto de partida. Osho aclara la relación cuerpo-mente y revela que el yoga no es una serie de ejercicios físicos, sino lo que él llama "una ciencia del alma". En El sende...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la conexión entre cuerpo y mente
- yoga como ciencia del alma
- posturas corporales como reflejo de paz interior
- los sutras de Patañjali
- autoconocimiento a través del yoga

**Key terms:** cuerpo-mente, meditación, posturas, sutras, raja yoga

**Voz autorial:** Osho emplea un estilo reflexivo y profundo, fusionando filosofía oriental con una comprensión contemporánea de la psicología, lo que hace que sus enseñanzas sean accesibles y relevantes.

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
- Razón: The generated content specifically references key concepts from the ground truth, such as the relationship between body and mind, the transformative nature of yoga beyond physical postures, and the significance of Patañjali's sutras. Phrases like 'cada sutra de Patañjali' and 'el yoga como ciencia del alma' directly connect to the themes presented in Osho's work, making it highly relevant and not,

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes and concepts presented in the ground truth, particularly the emphasis on the connection between body and mind, and the transformative nature of yoga as described by Osho. Phrases like 'each sutra of Patanjali' and 'self-discovery' directly reference key elements from the book. However, while it is specific, some phrases could be interpreted as a

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas personales.
- EN: pagina — Voz directa y reflexiones personales sobre el yoga.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.93**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- author_truncated: "Osho"

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10202
- Tiempo total: 26.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2505ms
- anchors: 2507 tokens, 6568ms
- palette: 0 tokens, 1ms
- content_es: 2689 tokens, 5882ms
- judge_es: 1048 tokens, 2490ms
- content_en: 2126 tokens, 4962ms
- judge_en: 1008 tokens, 3624ms
- voice: 824 tokens, 607ms
