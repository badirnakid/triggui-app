# Quality Report — LIT Life ignition tools

**Autor:** Jeff Karp
**Ejecutado:** 2026-04-21T13-45-58
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

Un método sencillo y radical con el que activar un estado mental de alto rendimiento, concentración y creatividad, para dar forma a la vida que realmente quieres. Por el director del laboratorio de innovación en Ingeniería Biomédica de Harvard, Jeff Karp. ¿Cómo puedes lograr un mayor rendimiento mental y creatividad en un mundo lleno de distracciones, de fechas límite constantes, de tiempo perdido en las redes sociales y de un bombardeo de noticias que te provoca ansiedad? En LIT, el innovador investigador de Harvard y del MIT, Jeff Karp, ha encontrado una poderosa manera de alcanzar un estado mental más enfocado y eficaz con la ayuda de sus siete herramientas para el encendido vital (Life Ignition Tools). LIT te enseñará a: *Examinarte interiormente y cone...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- activar un estado mental de alto rendimiento
- romper patrones de pensamiento habituales
- integrar la vida espiritual en la vida personal
- estimular la creatividad y el entusiasmo en el trabajo
- lidiar con la sobrecarga de información

**Key terms:** alto rendimiento, concentración, creatividad, herramientas de encendido vital, autoexaminación

**Voz autorial:** La voz de Jeff Karp es innovadora y accesible, combinando conceptos científicos con aplicaciones prácticas para el desarrollo personal.

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
- Razón: The generated content directly reflects specific concepts from the ground truth of 'LIT' by Jeff Karp, such as 'autoexaminación profunda', 'romper patrones de pensamiento', y la importancia de la 'creatividad y el entusiasmo'. Estas ideas están claramente alineadas con las herramientas y enfoques presentados en el libro, lo que demuestra un anclaje sólido en el contenido del libro.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the core concepts of self-examination and breaking habitual thought patterns as outlined in the ground truth. Phrases like 'deep self-examination' and 'breaking habitual thought patterns' directly reflect the themes of LIT. However, while it is specific to the book's ideas, some phrases are somewhat generic and could apply to other self-help contexts, thus

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas retóricas sin referencias externas.
- EN: pagina — Uso de voz directa y tono coherente con el libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.88 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 11467
- Tiempo total: 22.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3578ms
- anchors: 2788 tokens, 5096ms
- palette: 0 tokens, 0ms
- content_es: 2940 tokens, 4685ms
- judge_es: 1308 tokens, 2279ms
- content_en: 2368 tokens, 3971ms
- judge_en: 1287 tokens, 2159ms
- voice: 776 tokens, 755ms
