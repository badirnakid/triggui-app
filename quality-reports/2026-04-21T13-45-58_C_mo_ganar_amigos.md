# Quality Report — Cómo ganar amigos

**Autor:** Dale Carnegie
**Ejecutado:** 2026-04-21T13-45-58
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.81
- **Resolution path:** evidence_fetched_3sources
- **Match score:** 0.65



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

El libro que posicionó al método Carnegie como líder del mercado del marketing y las relaciones públicas. Uno de los primeros best sellers de autoayuda, fue publicado por primera vez en 1936 y lleva vendidas 15 millones de copias a nivel mundial. Dale Carnegie escribió este libro con el propósito de ser un suplemento a su curso sobre oratoria y relaciones humanas y nunca se imaginó que se convertiría en un éxito de ventas y que la gente lo leería, lo criticaría y viviría según sus reglas. Carnegie entrevistó a muchas personas de renombre para tomar ejemplos de sus vidas. Entre ellas están Edison, Franklin D. Rooselvelt y James Farley. Algunos puntos importantes del contenido son: Primera parte: Técnicas fundamentales para tratar con el prójimo. Si quieres r...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- técnicas fundamentales para tratar con el prójimo
- seis maneras de agradar a los demás
- lograr que los demás piensen como usted
- cómo criticar y no ser odiado
- la importancia de la empatía en las relaciones

**Key terms:** relaciones humanas, empatía, persuasión, liderazgo, comunicación efectiva

**Voz autorial:** La voz de Carnegie es accesible, práctica y motivadora, enfocándose en la aplicación de principios psicológicos en la vida diaria para mejorar las relaciones interpersonales.

---

## 🎨 Visual synthesis

- hue_primary: 40
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#D3D3CF, accent=#D6B81F, ink=#1C1B17, contraste=11.48:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 0.30
- Usa conceptos específicos: false
- Podría aplicar a cualquier libro: true
- Razón: The content discusses empathy and communication, which are general themes in self-help literature. However, it does not reference specific concepts or techniques from Dale Carnegie's book, such as the fundamental techniques for dealing with others or the specific ways to win friends and influence people. Therefore, it lacks direct grounding in the book's content.

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects specific concepts from the ground truth, such as 'techniques for dealing with others' and 'six effective ways of interaction,' which are directly related to Carnegie's teachings. However, the language is somewhat generic and could apply to various self-help contexts, which prevents it from being fully anchored to the book.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y consejos prácticos sin referencias externas.
- EN: pagina — El texto presenta consejos directos y prácticos sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.81 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.5 ← promedio de los 2 judges
- **Combined:** **0.77**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 10
- Tokens totales: 16639
- Tiempo total: 35.2s
- Modelos usados: gpt-4o-mini-2024-07-18, gpt-4o

### Por fase
- grounding: 0 tokens, 3211ms
- anchors: 2640 tokens, 5168ms
- palette: 0 tokens, 0ms
- content_es: 2656 tokens, 5154ms
- judge_es: 1002 tokens, 1445ms
- content_es_retry: 2684 tokens, 5031ms
- judge_es_retry: 1022 tokens, 0ms
- content_es_escalate: 2685 tokens, 0ms
- content_en: 2129 tokens, 3700ms
- judge_en: 984 tokens, 2324ms
- voice: 837 tokens, 805ms
