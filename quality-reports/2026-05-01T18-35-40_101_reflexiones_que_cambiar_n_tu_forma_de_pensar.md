# Quality Report — 101 reflexiones que cambiarán tu forma de pensar

**Autor:** Brianna Wiest
**Ejecutado:** 2026-05-01T18-35-40
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.79
- **Resolution path:** evidence_fetched_1sources
- **Match score:** 0.60



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

Microsanación que cambiará tu historia de vida El proceso de sanación no ocurre una sola vez en la vida; todos estamos en constante transformación y eso puede abrumarnos. Brianna Wiest, autora del bestseller La montaña eres tú, regresa con más de 40 reflexiones que te acompañarán en la experiencia de crecer, dejar ir a quien no te ama y acercarte —poco a poco— a tu verdadero propósito. Aquí encontrarás hábitos de microsanación para tu vida cotidiana, como restarles poder a tus pensamientos negativos o llevar un «diario de tu basura» para eludir la positividad tóxica. Además, entenderás la importancia de escuchar con atención a tu incomodidad, pues darte la oportunidad de sentirla es la única manera de saber que es tiempo de sanar.

METADATA VERIFICADA:
- Tí...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- habitos de microsanación en la vida cotidiana
- restar poder a los pensamientos negativos
- diario de tu basura para evitar la positividad tóxica
- escuchar la incomodidad como señal de sanación
- transformación constante a lo largo de la vida

**Key terms:** microsanación, pensamientos negativos, positividad tóxica, diario de basura, incomodidad

**Voz autorial:** La voz de Brianna Wiest es reflexiva y empática, guiando al lector a través de un proceso de autoconocimiento y sanación personal.

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
- Razón: El contenido generado refleja conceptos específicos del libro, como la importancia de la incomodidad y los hábitos de microsanación, que son centrales en la obra de Brianna Wiest. Las frases y reflexiones están directamente alineadas con la temática de sanación y transformación personal presentada en la sinopsis.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects key concepts from the book, such as 'microsanación', 'negative thoughts', and 'toxic positivity'. It emphasizes the importance of discomfort in the healing process, which aligns with the book's themes. The phrases used are specific to the book's message and cannot easily apply to other works.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas retóricas sin referencias externas.
- EN: pagina — Voz directa y reflexiones en primera persona sobre el proceso de transformación.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.79 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.89 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.9**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 2 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9332
- Tiempo total: 46.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 16918ms
- anchors: 2324 tokens, 8973ms
- palette: 0 tokens, 0ms
- content_es: 2501 tokens, 7343ms
- judge_es: 850 tokens, 2508ms
- content_en: 1960 tokens, 6910ms
- judge_en: 836 tokens, 2762ms
- voice: 861 tokens, 1297ms
- highlight_judge_es_parrafoTop: 644 tokens, 0ms
- highlight_judge_es_parrafoTop_retry: 663 tokens, 0ms
- highlight_judge_es_parrafoBot: 644 tokens, 0ms
- highlight_judge_en_parrafoTop: 639 tokens, 0ms
- highlight_judge_en_parrafoTop_retry: 653 tokens, 0ms
- highlight_judge_en_parrafoBot: 643 tokens, 0ms
