# Quality Report — El cuerpo lleva la cuenta

**Autor:** Bessel van der Kolk
**Ejecutado:** 2026-04-29T22-07-52
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_1sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

El cuerpo lleva la cuenta ha sido traducido a más de 30 idiomas y ha vendido millones de ejemplares en todo el mundo. Ha estado de forma intermitente en la lista de bestseller del NYT de la sección de ciencia desde su publicación. Este libro profundamente humano ofrece una nueva comprensión radical de las causas y consecuencias del trauma, que ofrece esperanza y claridad a todas las personas afectadas por su devastación. El trauma ha surgido como uno de los grandes retos de la salud pública de nuestro tiempo, no sólo por sus efectos bien documentados sobre los veteranos de guerra y víctimas de accidentes y delitos, sino debido a la cifra oculta de la violencia sexual y familiar y en las comunidades y escuelas devastadas por el abuso, el abandono y la adicci...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- el trauma remodela el cerebro y el cuerpo
- nuevos tratamientos que activan la neuroplasticidad
- la importancia de las relaciones en la sanación
- los efectos del trauma en la concentración y la memoria
- la resiliencia humana frente al trauma

**Key terms:** trauma, neuroplasticidad, relaciones de confianza, conciencia corporal, ansiedad paralizante

**Voz autorial:** La voz de Bessel van der Kolk es empática, informativa y profundamente humana, combinando investigación científica con experiencias personales y clínicas para ofrecer una nueva perspectiva sobre el trauma.

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
- Razón: El contenido generado utiliza conceptos específicos del libro, como la remodelación del cerebro y el cuerpo por el trauma, la importancia de las relaciones de confianza en la recuperación, y menciona la neuroplasticidad, todos elementos centrales en 'El cuerpo lleva la cuenta'. Esto demuestra una conexión clara y directa con el ground truth del libro.

### EN
- Score: 0.90
- Usa conceptos específicos: true
- Razón: The content closely reflects key concepts from the book, such as the impact of trauma on the brain and body, the importance of trusting relationships in recovery, and the activation of neuroplasticity. Phrases like 'trauma reshapes both mind and body' and 'trusting relationships play a fundamental role in recovery' directly connect to the book's themes. However, the language is slightly more stylz



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la experiencia del trauma.
- EN: pagina — Voz directa y enfoque en el proceso de sanación.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.95 ← promedio de los 2 judges
- **Combined:** **0.94**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 2 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 11078
- Tiempo total: 38.1s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 17173ms
- anchors: 2856 tokens, 5308ms
- palette: 0 tokens, 0ms
- content_es: 2815 tokens, 5590ms
- judge_es: 1168 tokens, 2129ms
- content_en: 2257 tokens, 4622ms
- judge_en: 1177 tokens, 1946ms
- voice: 805 tokens, 979ms
- highlight_judge_es_parrafoTop: 650 tokens, 0ms
- highlight_judge_es_parrafoTop_retry: 643 tokens, 0ms
- highlight_judge_es_parrafoBot: 653 tokens, 0ms
- highlight_judge_en_parrafoTop: 646 tokens, 0ms
- highlight_judge_en_parrafoTop_retry: 651 tokens, 0ms
- highlight_judge_en_parrafoBot: 635 tokens, 0ms
