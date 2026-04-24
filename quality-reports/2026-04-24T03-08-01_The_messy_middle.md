# Quality Report — The messy middle

**Autor:** Scott Belsky
**Ejecutado:** 2026-04-24T03-08-01
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

NATIONAL BESTSELLER NAMED ONE OF THE MOST INSPIRING BOOKS OF 2018 BY&#xa0;INC. NAMED ONE OF THE BEST STARTUP BOOKS OF ALL TIME BY BOOKAUTHORITY&#xa0; The Messy Middle is the indispensable guide to navigating the volatility of new ventures and leading bold creative projects by Scott Belsky, bestselling author, entrepreneur, Chief Product Officer at Adobe, and&#xa0;product advisor to many of today's top start-ups. Creating something from nothing is an unpredictable journey. The first mile births a new idea into existence, and the final mile is all about letting go. We love talking about starts and finishes, even though the middle stretch is the most important and often the most ignored and misunderstood.&#xa0; &#xa0; Broken into three sections with 100+ lesso...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- navegar la volatilidad de nuevos emprendimientos
- fortalecer la resolución ante el fracaso
- optimizar la gestión del equipo
- evitar los errores comunes de los emprendedores
- enfrentar la resistencia y salir con gracia

**Key terms:** volatilidad, emprendimiento, resolución, optimización, resistencia

**Voz autorial:** La voz de Scott Belsky es práctica y orientada a la acción, ofreciendo consejos directos y experiencias personales que inspiran a los lectores a perseverar en sus proyectos creativos.

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
- Razón: The generated content reflects specific concepts from 'The Messy Middle,' such as the idea of navigating volatility in entrepreneurship and strengthening resolve through challenges. Phrases like 'la volatilidad se convierte en un compañero constante' and 'fortalecer la resolución' align closely with the book's themes. However, while it is anchored in the book's concepts, some phrases are somewhat 

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes and concepts presented in 'The Messy Middle,' particularly the emphasis on navigating the volatility of entrepreneurship and the importance of resilience in the face of setbacks. Phrases like 'strengthening resolve' and 'valuable lessons' resonate with Belsky's focus on enduring the challenges of the middle phase of a venture. However, while it is 

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre el proceso emprendedor.
- EN: pagina — Voz directa y consejos prácticos sobre el emprendimiento.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.8 ← promedio de los 2 judges
- **Combined:** **0.9**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10001
- Tiempo total: 63.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 43711ms
- anchors: 2493 tokens, 5193ms
- palette: 0 tokens, 0ms
- content_es: 2662 tokens, 5533ms
- judge_es: 1018 tokens, 1770ms
- content_en: 2074 tokens, 4207ms
- judge_en: 983 tokens, 2136ms
- voice: 771 tokens, 904ms
