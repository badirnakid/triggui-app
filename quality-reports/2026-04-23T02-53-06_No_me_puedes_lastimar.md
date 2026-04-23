# Quality Report — No me puedes lastimar

**Autor:** David Goggins
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

PARA DAVID GOGGINS, LA INFANCIA FUE UNA PESADILLA. La pobreza, los prejuicios y los malos tratos físicos colorearon sus días y atormentaron sus noches. Pero gracias a su autodisciplina, su fortaleza mental y trabajo duro, Goggins pasó de ser un joven con sobrepeso, deprimido y sin futuro, a convertirse en un icono de las Fuerzas Armadas estadounidenses y en uno de los mejores atletas de resistencia del mundo. Es el único hombre de la historia que ha completado un entrenamiento de élite como SEAL de la Marina, Ranger del Ejército y Controlador Aéreo Táctico de las Fuerzas Aéreas, y llegó a batir récords en numerosas pruebas de resistencia, lo que inspiró a la revista Outside a nombrarlo "El Hombre (Real) en Mejor Forma de Estados Unidos". En No me puedes las...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la Regla del 40%
- superación del dolor
- fortaleza mental
- autodisciplina extrema
- transformación personal

**Key terms:** resiliencia, mentalidad de acero, atleta de resistencia, auto-mejoramiento, superación personal

**Voz autorial:** La voz de Goggins es intensa y motivacional, impulsando al lector a confrontar sus miedos y limitaciones con una mezcla de vulnerabilidad y determinación.

---

## 🎨 Visual synthesis

- hue_primary: 20
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: triadic
- typography: sans_humanista
- Resultado: paper=#D3D1CF, accent=#E27A12, ink=#1C1A17, contraste=11.40:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly references 'La Regla del 40%', a key concept from David Goggins' book, and emphasizes themes of mental strength, discipline, and overcoming pain, which are central to Goggins' narrative. The phrases used are specific to his experiences and philosophy, making it clearly anchored to the ground truth of the book.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly references the '40% Rule,' a key concept from David Goggins' book, and emphasizes themes of overcoming pain and self-discipline, which are central to Goggins' narrative. The phrases used are specific to his experiences and philosophy, making it highly relevant to the book.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre el potencial.
- EN: pagina — Voz directa y motivacional, sin referencias meta.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.96**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9830
- Tiempo total: 70.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41577ms
- anchors: 2434 tokens, 6918ms
- palette: 0 tokens, 0ms
- content_es: 2592 tokens, 9313ms
- judge_es: 957 tokens, 1668ms
- content_en: 2057 tokens, 8413ms
- judge_en: 912 tokens, 2039ms
- voice: 878 tokens, 1001ms
