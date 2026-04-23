# Quality Report — Limpia tus genes

**Autor:** Ben Lynch
**Ejecutado:** 2026-04-23T02-53-06
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

¡Tus genes no son tu destino! Tal vez siempre has pensado en tus genes como un "plan maestro" con instrucciones inalterables que afectan cuán sano o qué tan propenso eres a la cardiopatía, la ansiedad, los desórdenes digestivos o autoinmunes e incluso al cáncer o la diabetes. Sin embargo, ocurre justo lo contrario: son nuestros hábitos, alimentación y estilo de vida los que modifican constantemente nuestra expresión genética e influyen de manera determinante en nuestra salud. El secreto está en nuestros "genes sucios" o las variaciones hereditarias que nos predisponen para la enfermedad. Y tras años de investigación en la nueva ciencia de las anormalidades genéticas y de brindar tratamiento a miles de pacientes, el doctor Ben Lynch traduce los últimos descu...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- los hábitos y estilo de vida modifican la expresión genética
- genes sucios y su impacto en la salud
- protocolo de tres fases para limpiar los genes
- recetas para cada tipo de gen sucio
- recuperar el control de tu destino de salud

**Key terms:** genes sucios, expresión genética, protocolos de salud, variaciones hereditarias, anormalidades genéticas

**Voz autorial:** La voz del autor es empoderadora y científica, combinando investigación con un enfoque práctico para transformar la salud del lector.

---

## 🎨 Visual synthesis

- hue_primary: 140
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#CFD3D1, accent=#1FD67A, ink=#171C1A, contraste=11.41:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects the core concepts of the book, such as the idea that habits and lifestyle influence genetic expression, and the mention of 'genes sucios' aligns with the book's focus on cleaning these genes through a specific protocol. The phrases used are specific to the themes of the book, making it highly relevant and not generic.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the book's themes of genetic expression and lifestyle impact on health. Phrases like 'three-phase protocol' and 'dirty genes' directly reference concepts from the book. However, some phrases are slightly more generic and could apply to broader health and wellness discussions, which prevents a perfect score.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y tono coherente con el contenido del libro.
- EN: pagina — Voz directa y tono coherente con el contenido del libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.92 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9914
- Tiempo total: 65.1s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41437ms
- anchors: 2607 tokens, 5782ms
- palette: 0 tokens, 1ms
- content_es: 2612 tokens, 5802ms
- judge_es: 963 tokens, 2592ms
- content_en: 2028 tokens, 5541ms
- judge_en: 909 tokens, 1830ms
- voice: 795 tokens, 2095ms
