# Quality Report — Trabaja duro trabaja con astucia

**Autor:** Curtis (50 Cent) Jackson
**Ejecutado:** 2026-05-01T18-35-40
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.88
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 0.84



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

DEBES ENTENDER QUE NO EXISTE ESO DE "LOGRARLO"; QUE NO IMPORTA CUÁNTO DINERO, FAMA O ÉXITO OBTENGAS, EL FUTURO TRAERÁ MÁS DIFICULTADES. MÁS DRAMA. MÁS OBSTÁCULOS. LA META NO ES SÓLO SER EXITOSO, SINO CONSERVAR ESE ÉXITO. YO LO APRENDÍ POR LAS MALAS. Y ES UNA HABILIDAD QUE TE VOY A ENSEÑAR EN ESTE LIBRO. CURTIS JACKSON Curtis "50 Cent" Jackson llegó a la cima, se desplomó y volvió a subir. A sus treinta años había vendido decenas de millones de discos, producido una película sobre su vida y creado una de las marcas más reconocibles en el hip hop. Se sentía invencible. Hasta que sufrió la trágica muerte de su manager y mentor, empezó a padecer numerosas demandas legales y vio cómo sus ingresos se evaporaban con el advenimiento de la música digital. Ahora, en ...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- la importancia de conservar el éxito
- adaptación a las crisis
- estrategias de resiliencia
- lecciones del fracaso
- principios del éxito sostenible

**Key terms:** resiliencia, adaptación, estrategias, éxito, fracasos

**Voz autorial:** La voz de Curtis Jackson es directa y personal, compartiendo anécdotas de su vida que reflejan tanto sus triunfos como sus fracasos, lo que le da un tono auténtico y motivador.

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
- Razón: El contenido generado refleja conceptos específicos del libro, como la importancia de conservar el éxito y la adaptación a las crisis, que son temas centrales en la sinopsis. Utiliza frases que resuenan con la experiencia de 50 Cent y su enfoque en la resiliencia y la estrategia, lo que lo ancla firmemente al ground_truth.

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects key themes from the book, such as the ongoing nature of success and the importance of resilience and adaptation to challenges. Phrases like 'sustaining success' and 'learning from failures' align with the book's focus on overcoming obstacles. However, it lacks specific references to Curtis Jackson's personal experiences or unique insights, making it less anchored than it could



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre el éxito.
- EN: pagina — Voz directa y reflexiones sobre el éxito sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.88 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.89 ← anti-genericidad de anchors
- **grounding_judge:** 0.85 ← promedio de los 2 judges
- **Combined:** **0.88**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlight_es_parrafoBot_residual_warning
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10447
- Tiempo total: 48.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 18001ms
- anchors: 2609 tokens, 7028ms
- palette: 0 tokens, 1ms
- content_es: 2690 tokens, 10523ms
- judge_es: 1064 tokens, 2087ms
- content_en: 2155 tokens, 6518ms
- judge_en: 1057 tokens, 2777ms
- voice: 872 tokens, 948ms
- highlight_judge_es_parrafoTop: 646 tokens, 0ms
- highlight_judge_es_parrafoBot: 646 tokens, 0ms
- highlight_judge_es_parrafoBot_retry: 648 tokens, 0ms
- highlight_judge_en_parrafoTop: 638 tokens, 0ms
- highlight_judge_en_parrafoBot: 631 tokens, 0ms
