# Quality Report — Piensa como un monje

**Autor:** Jay Shetty
**Ejecutado:** 2026-04-21T11-43-12
**Pipeline:** nucleus-canonical-v3

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

Jay Shetty, la super estrella mundial del crecimiento personal, nos presenta su primer y esperado libro que transmite la valiosa sabiduría que aprendió cuando era monje. Cuando PIENSES COMO UN MONJE, sabrás cómo superar la negatividad, cómo dejar de pensar demasiado, por qué la comparación mata al amor, cómo usar tu miedo en tu beneficio,cómo aprender de todo el mundo, por qué no eres tus pensamientos, cómo encontrar tu propósito en la vida y mucho más. Jay Shetty, la superestrella de las redes sociales y presentador del podcast nº 1 On Purpose, destila en este libro la sabiduría eterna que aprendió como monje y la expone con pasos prácticos que cualquiera puede aplicar para gozar de una vida más tranquila. Después de tres años en la India para convertirse ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- superar la negatividad
- dejar de pensar demasiado
- usar el miedo a tu favor
- encontrar tu propósito en la vida
- transformar lecciones abstractas en consejos prácticos

**Key terms:** autoimagen, autoestima, atención plena, sabiduría eterna, condicionamiento social

**Voz autorial:** La voz de Jay Shetty es accesible y empoderadora, combinando sabiduría ancestral con consejos prácticos que resuenan en la vida cotidiana.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_moderno
- Resultado: paper=#CFD2D3, accent=#1F99D6, ink=#171A1C, contraste=11.50:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content specifically references concepts from the book such as transforming fear into strength and overcoming negativity, which are central themes in Jay Shetty's 'Piensa como un monje'. The phrases used directly relate to the teachings and wisdom Shetty imparts from his experience as a monk, making the content highly relevant and anchored to the book's ground truth.

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content specifically addresses the concept of transforming fear into strength, which aligns with the themes of overcoming negativity and using fear to one's advantage as mentioned in the ground truth. However, it lacks direct references to Jay Shetty's teachings or specific terminology from the book, making it somewhat generic in its presentation.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y consejos prácticos sin referencias externas.
- EN: pagina — Voz directa y consejos prácticos sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 0.85 ← promedio de los 2 judges
- **Combined:** **0.91**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 12249
- Tiempo total: 22.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2679ms
- anchors: 2925 tokens, 5475ms
- palette: 0 tokens, 0ms
- content_es: 3096 tokens, 5025ms
- judge_es: 1457 tokens, 2971ms
- content_en: 2530 tokens, 4793ms
- judge_en: 1412 tokens, 1322ms
- voice: 829 tokens, 651ms
