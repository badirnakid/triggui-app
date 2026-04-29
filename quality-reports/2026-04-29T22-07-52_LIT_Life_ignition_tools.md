# Quality Report — LIT Life ignition tools

**Autor:** Jeff Karp
**Ejecutado:** 2026-04-29T22-07-52
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_1sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

Un método sencillo y radical con el que activar un estado mental de alto rendimiento, concentración y creatividad, para dar forma a la vida que realmente quieres. Por el director del laboratorio de innovación en Ingeniería Biomédica de Harvard, Jeff Karp. ¿Cómo puedes lograr un mayor rendimiento mental y creatividad en un mundo lleno de distracciones, de fechas límite constantes, de tiempo perdido en las redes sociales y de un bombardeo de noticias que te provoca ansiedad? En LIT, el innovador investigador de Harvard y del MIT, Jeff Karp, ha encontrado una poderosa manera de alcanzar un estado mental más enfocado y eficaz con la ayuda de sus siete herramientas para el encendido vital (Life Ignition Tools). LIT te enseñará a: *Examinarte interiormente y cone...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- activar un estado mental de alto rendimiento
- romper con patrones de pensamiento habituales
- integrar la vida espiritual en la vida personal
- lidiar con la sobrecarga de información
- estimular la creatividad y el entusiasmo en el trabajo

**Key terms:** alto rendimiento, concentración, creatividad, herramientas de encendido vital, autodescubrimiento

**Voz autorial:** La voz de Jeff Karp es innovadora y motivadora, combinando su experiencia académica con un enfoque práctico para el desarrollo personal y la superación.

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
- Razón: The generated content directly references key concepts from the book, such as 'activar herramientas de encendido vital' and 'romper con patrones de pensamiento habituales', which are specific to Jeff Karp's methodology in 'LIT'. The phrases also align closely with the themes of creativity, focus, and integrating spirituality into daily life as outlined in the ground truth.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content closely aligns with the book's themes of focus, creativity, and breaking habitual thought patterns. It references concepts like 'vital ignition tools' and the integration of spiritual life, which are specific to the book. However, some phrases are somewhat generic and could apply to other self-help contexts.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en el lector sin referencias externas.
- EN: pagina — Voz directa y consejos prácticos sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.88 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 11537
- Tiempo total: 42.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 17297ms
- anchors: 2814 tokens, 6147ms
- palette: 0 tokens, 1ms
- content_es: 2954 tokens, 5251ms
- judge_es: 1318 tokens, 1889ms
- content_en: 2374 tokens, 4544ms
- judge_en: 1295 tokens, 1800ms
- voice: 782 tokens, 5402ms
- highlight_judge_es_parrafoTop: 653 tokens, 0ms
- highlight_judge_es_parrafoTop_retry: 647 tokens, 0ms
- highlight_judge_es_parrafoBot: 637 tokens, 0ms
- highlight_judge_en_parrafoTop: 645 tokens, 0ms
- highlight_judge_en_parrafoBot: 634 tokens, 0ms
