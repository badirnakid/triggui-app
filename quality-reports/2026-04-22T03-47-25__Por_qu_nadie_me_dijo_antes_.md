# Quality Report — ¿Por qué nadie me dijo antes?

**Autor:** Julie Smith
**Ejecutado:** 2026-04-22T03-47-25
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
- manejo de las críticas
- construir autoconfianza
- técnicas para fomentar la resiliencia
- soluciones prácticas para los altibajos de la vida

**Key terms:** salud mental, resiliencia, autoconfianza, técnicas terapéuticas, conflictos interpersonales

**Voz autorial:** La voz de la Dra. Julie es accesible, empática y práctica, ofreciendo consejos directos basados en su experiencia clínica.

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
- Razón: The generated content directly references key concepts from the ground truth, such as resilience, anxiety management, and self-confidence, which are explicitly mentioned in the book's synopsis. The phrases and themes align closely with the book's focus on practical mental health strategies, making it specific to this book rather than generic.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content reflects specific concepts from the ground truth, such as resilience, managing anxiety, and self-confidence, which are directly mentioned in the book's synopsis. However, some phrases are somewhat generic and could apply to various self-help contexts, which slightly lowers the grounded score.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — El texto ofrece consejos directos y no menciona al autor.
- EN: pagina — Tono directo y consejos prácticos, sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.84 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.89**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9961
- Tiempo total: 92.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40299ms
- anchors: 2517 tokens, 4738ms
- palette: 0 tokens, 0ms
- content_es: 2651 tokens, 5027ms
- judge_es: 1001 tokens, 1497ms
- content_en: 2058 tokens, 38384ms
- judge_en: 957 tokens, 1270ms
- voice: 777 tokens, 747ms
