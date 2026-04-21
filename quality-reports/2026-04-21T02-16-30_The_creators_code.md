# Quality Report — The creators code

**Autor:** Amy Wilkinson
**Ejecutado:** 2026-04-21T02-16-30
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.94
- **Resolution path:** evidence_fetched_3sources
- **Match score:** 0.97



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

Based on in-depth interviews with more than 200 leading entrepreneurs, a lecturer at the Stanford Graduate School of Business identifies the six essential disciplines needed to transform your ideas into real-world successes. Each of us has the capacity to spot opportunities, invent products, and build businesses—even $100 million businesses. How do some people turn ideas into enterprises that endure? Why do some people succeed when so many others fail? The Creator’s Code unlocks the six essential skills that turn small notions into big companies. This landmark book is based on 200 interviews with today’s leading entrepreneurs including the founders of LinkedIn, Chipotle, eBay, Under Armour, Tesla Motors, SpaceX, Spanx, Airbnb, PayPal, Jetblue, Gilt Groupe, ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- las seis habilidades esenciales para transformar ideas en negocios
- la capacidad de aprender y practicar habilidades empresariales
- la importancia de la perseverancia en el emprendimiento
- cómo los emprendedores exitosos identifican oportunidades
- la accesibilidad del emprendimiento para todos

**Key terms:** creadores, habilidades esenciales, emprendimiento, oportunidades, éxito empresarial

**Voz autorial:** La voz de Amy Wilkinson es analítica y motivadora, combinando investigación rigurosa con ejemplos inspiradores de emprendedores exitosos.

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
- Score: 0.80
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The content reflects specific concepts from the ground truth, such as the idea that entrepreneurship is accessible to everyone and the importance of identifying opportunities. Phrases like 'transformar ideas en negocios' and 'aprender y practicar estas habilidades esenciales' align closely with the book's themes. However, while the content is well anchored to the book's message, it lacks direct at

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects specific concepts from the ground truth, such as the idea that entrepreneurship is accessible to everyone and the emphasis on essential skills for success. However, some phrases are somewhat generic and could apply to various self-help or business books, which slightly lowers the grounded score.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en habilidades sin referencias externas.
- EN: pagina — Voz directa y enfoque en habilidades sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.94 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.75 ← promedio de los 2 judges
- **Combined:** **0.88**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9500
- Tiempo total: 62.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41080ms
- anchors: 2415 tokens, 4912ms
- palette: 0 tokens, 0ms
- content_es: 2558 tokens, 6847ms
- judge_es: 915 tokens, 1929ms
- content_en: 1981 tokens, 5025ms
- judge_en: 890 tokens, 1757ms
- voice: 741 tokens, 938ms
