# Quality Report — Principios para enfrentarse al nuevo orden mundial

**Autor:** Ray Dalio
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

Los tiempos que vienen serán radicalmente diferentes a los que hemos vivido hasta ahora, pero se parecerán mucho a otras etapas de la historia. Esta es la principal conclusión a la que ha llegado el experto inversor Ray Dalio, después de un titánico estudio de episodios análogos al presente en los últimos quinientos años: los ciclos históricos siempre han sido muy similares entre ellos. Después de su bestseller mundial Principios, Dalio vuelve con un nuevo libro, en el que descubre los ciclos que explican del auge y la caída de los grandes imperios, como el holandés, el inglés y el estadounidense. En nuestros días, aparentemente, asistimos al declive de Estados Unidos, y al progresivo ascenso de China como potencia dominante. Si hacemos caso a estas «señale...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- ciclos históricos de auge y caída de imperios
- declive de Estados Unidos y ascenso de China
- señales del cambio económico y social
- gran ciclo arquetípico
- estrategias para anticipar el futuro

**Key terms:** nueva potencia mundial, competitividad, sobreexpansión, crisis interna, poder financiero

**Voz autorial:** La voz de Ray Dalio es analítica y reflexiva, combinando un enfoque histórico con una perspectiva práctica para anticipar cambios en el orden mundial.

---

## 🎨 Visual synthesis

- hue_primary: 210
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_moderno
- Resultado: paper=#CFD1D3, accent=#1F7AD6, ink=#171A1C, contraste=11.42:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly references key concepts from the ground truth, such as 'ciclos históricos', 'declive de Estados Unidos', 'ascenso de China', and 'gran ciclo arquetípico'. These terms are specific to Ray Dalio's analysis in the book and reflect the themes of historical patterns and the rise and fall of empires, making the content highly relevant and specific to the book.

### EN
- Score: 0.90
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes and concepts presented in Ray Dalio's book, particularly the cyclical nature of empires and the specific mention of the decline of the United States and the rise of China. Phrases like 'archetypal great cycle' and 'cycles of rise and fall among empires' directly reference the book's analysis of historical patterns. The content is not generic and

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.80)
- ES: pagina — Tono directo y reflexivo, sin referencias meta al autor.
- EN: pagina — Tono directo y reflexivo, sin referencias externas al autor.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.9 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.95 ← promedio de los 2 judges
- **Combined:** **0.93**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10489
- Tiempo total: 23.1s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3638ms
- anchors: 2594 tokens, 4438ms
- palette: 0 tokens, 0ms
- content_es: 2745 tokens, 6209ms
- judge_es: 1107 tokens, 1607ms
- content_en: 2167 tokens, 4592ms
- judge_en: 1061 tokens, 1891ms
- voice: 815 tokens, 753ms
