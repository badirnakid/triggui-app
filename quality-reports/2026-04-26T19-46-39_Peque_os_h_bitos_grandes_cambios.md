# Quality Report — Pequeños hábitos grandes cambios

**Autor:** Steven Handel
**Ejecutado:** 2026-04-26T19-46-39
**Pipeline:** nucleus-canonical-v3.7.1

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

Transforma tu vida un paso a la vez. Decides probar algo nuevo. Lo haces una segunda vez. Entonces otra vez. Y otra vez. Eventualmente lo estás haciendo sin pensar. Así se forman los hábitos. Los hábitos comienzan cuando las acciones conscientes se transforman en comportamientos constantes. Sin embargo, tocan todos los aspectos de tu vida -alimentación, relaciones, trabajo, ejercicio, salud, felicidad, entre muchos más, ¡es precisamente por eso que son tan poderosos! Repleto de consejos útiles y técnicas efectivas, este libro hace que cambiar tus hábitos sea simple y divertido. Se enfoca en hacer pequeños cambios que crearán mejoras duraderas en tu vida. Entre otros temas te brindará información sobre: -La importancia de tener un ritual matutino. -La difere...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- la importancia de tener un ritual matutino
- la diferencia entre una mentalidad de crecimiento y una mentalidad fija
- ciclos de hábitos y fuerza de voluntad
- herramientas clave para mantener la motivación
- estrategias para establecer una rutina diaria saludable

**Key terms:** ritual matutino, mentalidad de crecimiento, ciclos de hábitos, toma de decisiones, motivación, rutina diaria

**Voz autorial:** La voz del autor es accesible y motivadora, enfocándose en la simplicidad de los cambios y su impacto positivo en la vida diaria.

---

## 🎨 Visual synthesis

- hue_primary: 65
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#D3D3CF, accent=#C7D61F, ink=#1B1C17, contraste=11.42:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: El contenido generado se centra en la importancia de los rituales matutinos, un tema específico mencionado en la sinopsis del libro. Utiliza frases que reflejan conceptos clave como la transformación de hábitos y la creación de un espacio intencional para el día, lo que lo ancla firmemente al contenido del libro.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content specifically discusses 'morning rituals' and their impact on habit formation, directly reflecting key concepts from the ground truth about the importance of morning routines and how small actions contribute to lasting habits.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en rituales matutinos.
- EN: pagina — Voz directa y enfoque en la experiencia personal del ritual.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.92 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9600
- Tiempo total: 32.2s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 4515ms
- anchors: 2428 tokens, 7402ms
- palette: 0 tokens, 1ms
- content_es: 2572 tokens, 7363ms
- judge_es: 930 tokens, 2702ms
- content_en: 1998 tokens, 6493ms
- judge_en: 884 tokens, 2302ms
- voice: 788 tokens, 937ms
- highlight_judge_es_parrafoTop: 657 tokens, 0ms
- highlight_judge_es_parrafoTop_retry: 659 tokens, 0ms
- highlight_judge_es_parrafoBot: 652 tokens, 0ms
- highlight_judge_en_parrafoTop: 641 tokens, 0ms
- highlight_judge_en_parrafoBot: 640 tokens, 0ms
