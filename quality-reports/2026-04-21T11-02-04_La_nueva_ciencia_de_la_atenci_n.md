# Quality Report — La nueva ciencia de la atención

**Autor:** Amishi Jha
**Ejecutado:** 2026-04-21T11-02-04
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
- práctica diaria específica para el control de la atención
- técnica de atención plena
- entrenamiento cognitivo para mejorar el rendimiento
- herramientas para reducir distracciones

**Key terms:** atención plena, distracciones digitales, entrenamiento cognitivo, degradación de la atención, práctica diaria

**Voz autorial:** La voz de la Dra. Jha es accesible y científica, combinando evidencia empírica con relatos de experiencias personales, lo que hace que el contenido sea tanto informativo como motivador.

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
- Razón: The generated content directly references key concepts from the book, such as 'atención plena' (mindfulness), 'degradación de la atención' (degradation of attention), and the specific practice of dedicating 'doce minutos al día' (twelve minutes a day) to improve focus. These elements are explicitly tied to the book's themes and teachings, making the content highly relevant and specific to 'La nova

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly references concepts from the ground truth, such as 'mindfulness', 'degradation of attention', and the specific practice of training attention for 'twelve minutes a day'. It also aligns with the book's themes of managing distractions and enhancing focus, making it highly specific to 'La nueva ciencia de la atención'.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la práctica de atención plena.
- EN: pagina — Uso de voz directa y enfoque en la práctica de mindfulness.

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
- Tokens totales: 9962
- Tiempo total: 26.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3115ms
- anchors: 2511 tokens, 4200ms
- palette: 0 tokens, 0ms
- content_es: 2614 tokens, 5493ms
- judge_es: 978 tokens, 2144ms
- content_en: 2072 tokens, 8809ms
- judge_en: 930 tokens, 1527ms
- voice: 857 tokens, 733ms
