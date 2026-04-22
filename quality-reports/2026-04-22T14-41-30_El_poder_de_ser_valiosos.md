# Quality Report — El poder de ser valiosos

**Autor:** Arnold Schwarzenegger
**Ejecutado:** 2026-04-22T14-41-30
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

Descubre siete claves que te ayudarán a conseguir logros extraordinarios y que cambiarán tu vida para siempre. Arnold Schwarzenegger se ha consagrado como el mejor culturista del mundo, una de las estrellas de cine más reconocidas de los Estados Unidos y un exitoso político. ¿Cómo ha sido capaz Arnold Schwarzenegger de conseguir todos estos logros? Desde luego que no por accidente. Todo se debe a un proceso que comenzó con una lección que un día le dio su padre cuando le dijo: «Tienes que transformarte en una persona valiosa, útil para los demás» y que ahora desvela en estas páginas con la intención de ayudar a quien quiera llegar a cumplir sus metas. Escrito con una voz franca y poderosa, a través de los valiosos consejos y las experiencias personales que ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- siete claves para lograr objetivos extraordinarios
- transformarse en una persona valiosa
- la importancia del esfuerzo en el éxito
- aprender de experiencias personales
- la fórmula del éxito es trabajar duro

**Key terms:** valioso, esfuerzo, éxito, metas, transformación

**Voz autorial:** La voz autorial es franca, poderosa y motivadora, con un enfoque en la experiencia personal como base de los consejos ofrecidos.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: triadic
- typography: sans_humanista
- Resultado: paper=#CFD2D3, accent=#129DE2, ink=#171A1C, contraste=11.50:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content closely reflects the key concepts from the ground truth, specifically focusing on the importance of becoming a valuable person and the necessity of hard work to achieve extraordinary goals. Phrases like 'transformación en una persona valiosa' and 'el esfuerzo es la esencia de la fórmula del éxito' directly align with Schwarzenegger's teachings in the book, making it specific,

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the ground truth of Arnold Schwarzenegger's book by emphasizing the importance of becoming a valuable person and the necessity of hard work to achieve success. Phrases like 'effort is the essence of the success formula' and 'becoming a valuable person is the first step toward success' directly align with the book's themes of personal transformation and the ir

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y tono coherente con el libro.
- EN: pagina — Voz directa y motivacional, sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10829
- Tiempo total: 32.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3200ms
- anchors: 2597 tokens, 5221ms
- palette: 0 tokens, 0ms
- content_es: 2802 tokens, 9266ms
- judge_es: 1184 tokens, 2738ms
- content_en: 2257 tokens, 7011ms
- judge_en: 1139 tokens, 2525ms
- voice: 850 tokens, 2076ms
