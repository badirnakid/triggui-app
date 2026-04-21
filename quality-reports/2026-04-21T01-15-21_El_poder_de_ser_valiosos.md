# Quality Report — El poder de ser valiosos

**Autor:** Arnold Schwarzenegger
**Ejecutado:** 2026-04-21T01-15-21
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_2sources
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
- transformación personal hacia la utilidad
- la importancia del esfuerzo en el éxito
- aprender de experiencias personales
- definir el futuro a través del trabajo duro

**Key terms:** valioso, utilidad, esfuerzo, éxito, metas

**Voz autorial:** La voz de Schwarzenegger es franca y poderosa, transmitiendo una mezcla de motivación y sabiduría práctica, basada en su experiencia personal y profesional.

---

## 🎨 Visual synthesis

- hue_primary: 45
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#D3D2CF, accent=#D6A81F, ink=#1C1B17, contraste=11.40:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content closely reflects the core themes and concepts presented in the ground truth of Arnold Schwarzenegger's book. It emphasizes the importance of becoming a valuable person to others, which is a central idea in the book, as well as the necessity of hard work and effort to achieve extraordinary goals. Phrases like 'transformarse en útil' and 'el esfuerzo es la clave' directly align

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects key concepts from the ground truth, such as the importance of becoming a person of value for others and the emphasis on hard work as the only path to success. Phrases like 'True transformation requires becoming valuable to others' and 'Effort is the key that unlocks every door to your goals' are closely aligned with Schwarzenegger's teachings in the book, as

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y motivacional, sin referencias meta.
- EN: pagina — Voz directa y motivacional, sin referencias meta.

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
- Tokens totales: 10799
- Tiempo total: 62.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40355ms
- anchors: 2606 tokens, 5439ms
- palette: 0 tokens, 0ms
- content_es: 2798 tokens, 6519ms
- judge_es: 1173 tokens, 1863ms
- content_en: 2244 tokens, 4701ms
- judge_en: 1148 tokens, 2350ms
- voice: 830 tokens, 1143ms
