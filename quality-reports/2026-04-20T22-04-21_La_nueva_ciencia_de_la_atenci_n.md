# Quality Report — La nueva ciencia de la atención

**Autor:** Amishi Jha
**Ejecutado:** 2026-04-20T22-04-21
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

Desde la constante reclamación de atención de la tecnología, hasta las 24 horas de titulares constantes y las abrumadoras exigencias del trabajo, a nuestra capacidad de concentración se le exige más que nunca. Estamos sufriendo un trastorno colectivo de déficit de atención que nos hace sentir dispersos, abrumados y ansiosos, pero incapaces de resistirse a distracciones como los correos electrónicos, las videollamadas, los mensajes o las notificaciones. En realidad, utilizamos toda nuestra atención en cada momento del día, pero la Dra. Jha ha descubierto que, a menos que creemos espacio en nuestra mente mediante una práctica diaria específica y dirigida, no podremos controlar lo que capta nuestra atención. Esto nos hace vulnerables a cualquier distracción, u...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- degradación de la atención
- entrenamiento cognitivo mediante atención plena
- práctica diaria de atención
- control de distracciones tecnológicas
- mejora del rendimiento personal

**Key terms:** atención plena, degradación de la atención, práctica diaria, entrenamiento cognitivo, distracciones tecnológicas

**Voz autorial:** La voz de la Dra. Jha es accesible y persuasiva, combinando ciencia con relatos prácticos que ilustran la aplicabilidad de sus técnicas.

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
- Razón: The generated content directly references key concepts from the ground truth, such as 'degradación de la atención' and 'atención plena', and discusses the specific practice of dedicating twelve minutes a day to improve focus, which aligns closely with the book's themes and techniques.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly references key concepts from the ground truth, such as 'attention degradation', 'mindfulness', and the specific practice of 'twelve minutes a day' for cognitive training. These phrases are explicitly tied to the themes and techniques discussed in 'La nueva ciencia de la atención' by Amishi Jha, making the content highly relevant and specific to the book.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la práctica personal.
- EN: pagina — Voz directa y consejos prácticos sin referencias meta.

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
- Tokens totales: 9795
- Tiempo total: 64.3s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41738ms
- anchors: 2495 tokens, 4783ms
- palette: 0 tokens, 0ms
- content_es: 2603 tokens, 6005ms
- judge_es: 957 tokens, 2793ms
- content_en: 2017 tokens, 4990ms
- judge_en: 912 tokens, 2841ms
- voice: 811 tokens, 1135ms
