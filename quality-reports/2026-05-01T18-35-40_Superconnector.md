# Quality Report — Superconnector

**Autor:** Scott Gerber & Ryan Paugh
**Ejecutado:** 2026-05-01T18-35-40
**Pipeline:** nucleus-canonical-v3.7.1

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

Abandon the networking-for-networking's-sake mentality in favor of a more powerful and effective approach to creating and enhancing connections. STOP NETWORKING. Seriously, stop doing it. Now. It is time to ditch the old networking-for networking's-sake mentality in favor of a more powerful and effective approach to creating and enhancing connections. In Superconnector, Scott Gerber and Ryan Paugh reveal a new category of professionals born out of the social media era: highly valuable community-builders who make things happen through their keen understanding and utilization of social capital. Superconnectors understand the power of relationship-building, problem-solve by connecting the dots at high levels, and purposefully cause different worlds and communi...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- abandonar la mentalidad de networking por el networking
- creación y mejora de conexiones efectivas
- practicar la Generosidad Habitual
- la Art de la Selectividad en relaciones
- maximizar el valor de una comunidad profesional

**Key terms:** social capital, community builders, relationship-building, Habitual Generosity, Art of Selectivity

**Voz autorial:** La voz de los autores es directa, práctica y motivadora, enfocándose en estrategias efectivas para construir relaciones significativas.

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
- Razón: The content directly references 'Generosidad Habitual' and emphasizes the importance of building genuine relationships, which are key concepts from 'Superconnector'. It specifically discusses transforming superficial connections into meaningful ones, aligning closely with the book's focus on community-building and social capital.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content directly references 'Habitual Generosity,' a key concept from the book, and elaborates on its importance in building meaningful connections, which aligns perfectly with the book's themes. It emphasizes the transformation of relationships through prioritizing others, mirroring the book's core message about community-building and social capital.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la mentalidad del lector.
- EN: pagina — Voz directa y enfoque en el concepto sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.96**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 2 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10093
- Tiempo total: 41.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 16438ms
- anchors: 2440 tokens, 5168ms
- palette: 0 tokens, 0ms
- content_es: 2655 tokens, 8448ms
- judge_es: 1012 tokens, 1963ms
- content_en: 2122 tokens, 5958ms
- judge_en: 998 tokens, 2061ms
- voice: 866 tokens, 858ms
- highlight_judge_es_parrafoTop: 648 tokens, 0ms
- highlight_judge_es_parrafoBot: 662 tokens, 0ms
- highlight_judge_es_parrafoBot_retry: 664 tokens, 0ms
- highlight_judge_en_parrafoTop: 650 tokens, 0ms
- highlight_judge_en_parrafoBot: 651 tokens, 0ms
- highlight_judge_en_parrafoBot_retry: 649 tokens, 0ms
