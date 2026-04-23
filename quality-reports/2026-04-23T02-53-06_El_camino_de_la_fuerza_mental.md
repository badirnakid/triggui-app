# Quality Report — El camino de la fuerza mental

**Autor:** Jodie Lowinger
**Ejecutado:** 2026-04-23T02-53-06
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

¿Qué pasaría si pudieras convertir la ansiedad en un superpoder? ¿Y si la clave para caminar hacia tus objetivos fuera aprender a hacer las paces con ella? Es común que pensemos la ansiedad como si fuera el villano de la película. Un provocador mental que nos llena de preocupaciones, estrés y miedos, que se apodera de nosotros en un abrir y cerrar de ojos. Pero a pesar de lo paralizante que puede ser, es posible cambiar nuestra relación con ella. El camino de la fuerza mental presenta un método basado en años de investigación y práctica clínica, con herramientas para dominar y entender a ese provocador que vive en tu cabeza. Te ayudará a comprender que tras la ansiedad existe un corazón emotivo. Una mente fuerte y analítica que solo necesita despejar la mal...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- convertir la ansiedad en un superpoder
- cambiar nuestra relación con la ansiedad
- herramientas para dominar el provocador mental
- comprender el corazón emotivo tras la ansiedad
- despejar la maleza del camino hacia la paz

**Key terms:** fuerza mental, ansiedad, provocador mental, herramientas de empoderamiento, paz emocional

**Voz autorial:** La voz de Jodie Lowinger es empática y motivadora, guiando al lector a través de un viaje de autocomprensión y empoderamiento personal.

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
- Razón: The generated content directly reflects the core themes and concepts of the book, such as transforming anxiety into a superpower, understanding the emotional heart behind anxiety, and the idea of clearing the path to find peace. Phrases like 'convertir la ansiedad en un superpoder' and 'despejar la maleza del camino hacia la paz' are explicitly tied to the book's premise, demonstrating a strong, 1

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes and concepts presented in the ground truth, specifically addressing the transformation of anxiety into strength and the importance of understanding and mastering it. Phrases like 'mental provocateur' and 'clearing the weeds from the path to peace' directly align with the book's focus on changing the relationship with anxiety and using it as a tool.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la transformación personal.
- EN: pagina — Uso de voz directa y enfoque en el proceso personal.

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
- Tokens totales: 9392
- Tiempo total: 67.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 42446ms
- anchors: 2343 tokens, 6175ms
- palette: 0 tokens, 0ms
- content_es: 2507 tokens, 6680ms
- judge_es: 871 tokens, 2960ms
- content_en: 1978 tokens, 5688ms
- judge_en: 842 tokens, 2604ms
- voice: 851 tokens, 854ms
