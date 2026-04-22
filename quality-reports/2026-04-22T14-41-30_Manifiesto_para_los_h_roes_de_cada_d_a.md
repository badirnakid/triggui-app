# Quality Report — Manifiesto para los héroes de cada día

**Autor:** Robin Sharma
**Ejecutado:** 2026-04-22T14-41-30
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

Ahora es tu momento, esta es tu guía. Durante más de veinticinco años, Robin Sharma, el legendario experto en liderazgo y en excelencia, ha enseñado discretamente a titanes de los negocios, a grandes del deporte profesional y a superestrellas del mundo del espectáculo un revolucionario sistema que los ha ayudado a convertir sus máximas aspiraciones en resultados palpables a diario. <tab> </tab> Ahora, en Manifiesto para los héroes de cada día -su obra maestra-, el innovador Robin Sharma ha destilado los principios fundamentales, los protocolos y las tácticas de su método de mentoring y ha creado una obra valiosísima que es al mismo tiempo un compendio de estrategias para alcanzar una productividad inagotable, un manual para llevar una vida incomparable, y u...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- estrategias para alcanzar una productividad inagotable
- prácticas para mejorar la energía y vitalidad
- técnicas basadas en la neurociencia para convertir problemas en triunfos
- hábitos insuperables de personas creativas y prósperas
- sabiduría para dignificar la libertad espiritual

**Key terms:** liderazgo espiritual, productividad, neurociencia, vitalidad, éxito cotidiano

**Voz autorial:** La voz de Robin Sharma es inspiradora y motivacional, combinando un enfoque práctico con una profunda sabiduría espiritual, lo que permite conectar con el lector de manera emocional y constructiva.

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
- Razón: The generated content closely reflects the themes and concepts outlined in the ground truth, such as the importance of adopting 'hábitos insuperables' and the idea of transforming daily life into extraordinary experiences. Phrases like 'productividad inagotable' and 'convertir temores en acicates' directly echo the principles presented in Robin Sharma's book, making it highly specific to 'Manifiéz

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The generated content reflects several key concepts from the ground truth, such as the importance of adopting 'unbeatable habits' and 'productivity strategies' which are central themes in Sharma's work. Phrases like 'transform the ordinary into the extraordinary' and 'spiritual freedom' resonate with the book's focus on personal development and leadership. However, some phrases are somewhat vague,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas retóricas.
- EN: pagina — Voz directa y tono coherente con el libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.85 ← promedio de los 2 judges
- **Combined:** **0.91**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10633
- Tiempo total: 29.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 4497ms
- anchors: 2643 tokens, 6149ms
- palette: 0 tokens, 0ms
- content_es: 2788 tokens, 7215ms
- judge_es: 1136 tokens, 2452ms
- content_en: 2194 tokens, 5871ms
- judge_en: 1081 tokens, 2484ms
- voice: 791 tokens, 1213ms
