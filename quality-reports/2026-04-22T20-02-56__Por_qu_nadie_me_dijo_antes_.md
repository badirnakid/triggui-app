# Quality Report — ¿Por qué nadie me dijo antes?

**Autor:** Julie Smith
**Ejecutado:** 2026-04-22T20-02-56
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.84
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 0.72



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

«Sentirás como si tuvieras a un terapeuta sentado a tu lado todo el tiempo, empoderándote en cada situación para que actúes desde la mejor versión de ti mismo», Nicole LePera, autora bestseller del New York Times «Inteligente, esclarecedora y cálida, la Dra. Julie es a la vez la experta y la amiga sabia que todos necesitamos», Lori Gottlieb, autora bestseller del New York Times Basándose en sus años de experiencia como psicóloga clínica, la Dra Julie, que ha revolucionado las redes sociales compartiendo contenido de gran utilidad sobre la salud mental, te enseña en este libro todo lo que necesitas saber para sortear con éxito los altibajos más comunes de la vida. Repleto de los recursos secretos de una avispada terapeuta, este libro resulta imprescindible p...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- gestión de la ansiedad
- manejo de conflictos en las relaciones
- construcción de autoconfianza
- encontrar motivación
- técnicas para fomentar la resiliencia

**Key terms:** salud mental, resiliencia, autoconfianza, técnicas terapéuticas, autoayuda

**Voz autorial:** La voz de la Dra. Julie es accesible y amigable, combinando la experticia clínica con un enfoque práctico y cercano, como si estuviera guiando al lector en cada paso.

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
- Razón: The generated content specifically addresses concepts such as 'autoconfianza' (self-confidence) and 'resiliencia' (resilience), which are directly mentioned in the ground truth. Additionally, the phrases and themes align closely with the book's focus on practical mental health strategies and personal growth, making it highly relevant and anchored to the book's content.

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The generated content discusses self-confidence, which is a topic mentioned in the ground truth. It also emphasizes personal growth and resilience, aligning with the book's focus on practical mental health strategies. However, the language is somewhat generic and could apply to various self-help contexts, which prevents it from being fully anchored to the specific concepts of the book.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en el crecimiento personal.
- EN: pagina — Tono directo y reflexivo, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.84 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.85 ← promedio de los 2 judges
- **Combined:** **0.88**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10044
- Tiempo total: 64.2s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 39614ms
- anchors: 2506 tokens, 5098ms
- palette: 0 tokens, 0ms
- content_es: 2650 tokens, 6450ms
- judge_es: 1012 tokens, 2356ms
- content_en: 2090 tokens, 7281ms
- judge_en: 979 tokens, 2098ms
- voice: 807 tokens, 1307ms
