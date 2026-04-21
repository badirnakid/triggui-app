# Quality Report — No me puedes lastimar

**Autor:** David Goggins
**Ejecutado:** 2026-04-21T02-16-30
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
- la regla del 40% como clave para desbloquear el potencial personal
- transformación a través de la autodisciplina y la fortaleza mental
- superación del dolor y el miedo como camino hacia el éxito

**Key terms:** autodisciplina, fortaleza mental, atleta de resistencia, superación personal, potencial máximo

**Voz autorial:** La voz de David Goggins es directa, inspiradora y desafiante, reflejando su experiencia de vida y su enfoque en la autodisciplina como herramienta para la transformación personal.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: triadic
- typography: sans_humanista
- Resultado: paper=#CFD1D3, accent=#127AE2, ink=#171A1C, contraste=11.42:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly references the 'regla del 40%' which is a specific concept from David Goggins' book. It also emphasizes themes of self-discipline and mental strength, which are central to Goggins' narrative. The phrases used are closely aligned with the book's message about overcoming limitations and achieving one's potential, making it highly specific to 'No me puedes lastimar'.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content strongly reflects the core concepts from David Goggins' book, particularly the '40% rule' and themes of self-discipline and mental toughness. It directly references the idea of unlocking potential and overcoming limitations, which are central to Goggins' narrative. However, while it is specific to the book's themes, some phrases could be considered somewhat generic in the self-help lex

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y tono motivacional propio del autor.
- EN: pagina — Voz directa y motivacional, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9888
- Tiempo total: 66.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41328ms
- anchors: 2444 tokens, 5782ms
- palette: 0 tokens, 1ms
- content_es: 2602 tokens, 7481ms
- judge_es: 959 tokens, 2271ms
- content_en: 2077 tokens, 6367ms
- judge_en: 935 tokens, 2002ms
- voice: 871 tokens, 742ms
