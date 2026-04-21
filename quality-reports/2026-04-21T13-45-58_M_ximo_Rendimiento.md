# Quality Report — Máximo Rendimiento

**Autor:** Brad Stulberg & Steve Magness
**Ejecutado:** 2026-04-21T13-45-58
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_4sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

Vivimos en la era de la competitividad extrema, por lo que somos muchos los que deseamos saber cómo podemos mejorar nuestro rendimiento de manera eficaz y sin que nuestra salud resulte perjudicada. Las fórmulas que han reportado mayores éxitos a los expertos Steve Magness, entrenador deportivo de élite, y Brad Stulberg, experto en salud y consultor financiero, son tan sorprendentes como fáciles de llevar a la práctica: pasar un rato en compañía de los amigos, alternar periodos de trabajo intenso con etapas de descanso, crear ambientes distendidos, priorizar tareas, minimizar las distracciones o preparar adecuadamente el cuerpo y la mente para hacer frente a los desafíos que nos preocupan. Con inspiradores ejemplos de personalidades destacadas del mundo del ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la importancia de equilibrar trabajo y descanso
- creación de ambientes distendidos para mejorar la productividad
- priorizar tareas y minimizar distracciones
- la influencia de la salud mental en el rendimiento
- métodos éticos para alcanzar el máximo potencial

**Key terms:** rendimiento, agotamiento, productividad, salud mental, descanso, entrenamiento

**Voz autorial:** La voz autorial es motivadora y pragmática, combinando investigación científica con ejemplos prácticos y accesibles.

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
- Razón: The generated content directly reflects key concepts from the ground truth, such as the importance of balancing work and rest, prioritizing tasks, and creating a conducive environment for productivity. Phrases like 'equilibrio entre trabajo y descanso' and 'minimizar las distracciones' are explicitly aligned with the book's themes, demonstrating a strong connection to the authors' insights on peak

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content reflects specific concepts from the ground truth, such as the importance of balancing work and rest, minimizing distractions, and creating relaxed environments. These ideas are directly aligned with the themes presented in 'Máximo rendimiento'. However, while it is well anchored to the book's principles, some phrases are somewhat generic and could apply to other self-help contexts, but

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y consejos prácticos sin referencias meta.
- EN: pagina — El texto presenta consejos directos sin referencias al autor o libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.93**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9296
- Tiempo total: 22.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3307ms
- anchors: 2339 tokens, 5019ms
- palette: 0 tokens, 1ms
- content_es: 2514 tokens, 5056ms
- judge_es: 879 tokens, 2391ms
- content_en: 1935 tokens, 3939ms
- judge_en: 840 tokens, 1924ms
- voice: 789 tokens, 891ms
