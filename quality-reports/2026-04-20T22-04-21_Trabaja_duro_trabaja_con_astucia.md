# Quality Report — Trabaja duro trabaja con astucia

**Autor:** Curtis (50 Cent) Jackson
**Ejecutado:** 2026-04-20T22-04-21
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.88
- **Resolution path:** evidence_fetched_3sources
- **Match score:** 0.84



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

DEBES ENTENDER QUE NO EXISTE ESO DE "LOGRARLO"; QUE NO IMPORTA CUÁNTO DINERO, FAMA O ÉXITO OBTENGAS, EL FUTURO TRAERÁ MÁS DIFICULTADES. MÁS DRAMA. MÁS OBSTÁCULOS. LA META NO ES SÓLO SER EXITOSO, SINO CONSERVAR ESE ÉXITO. YO LO APRENDÍ POR LAS MALAS. Y ES UNA HABILIDAD QUE TE VOY A ENSEÑAR EN ESTE LIBRO. CURTIS JACKSON Curtis "50 Cent" Jackson llegó a la cima, se desplomó y volvió a subir. A sus treinta años había vendido decenas de millones de discos, producido una película sobre su vida y creado una de las marcas más reconocibles en el hip hop. Se sentía invencible. Hasta que sufrió la trágica muerte de su manager y mentor, empezó a padecer numerosas demandas legales y vio cómo sus ingresos se evaporaban con el advenimiento de la música digital. Ahora, en ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la importancia de conservar el éxito
- adaptarse a las crisis
- estrategias para superar obstáculos
- lecciones aprendidas de fracasos personales
- reglas del éxito en la industria del entretenimiento

**Key terms:** resiliencia, adaptación, estrategia, éxito sostenible, mentalidad emprendedora

**Voz autorial:** La voz de Curtis Jackson es directa, honesta y persuasiva, con un enfoque en la autenticidad y la experiencia personal, lo que aporta un carácter motivacional y realista al texto.

---

## 🎨 Visual synthesis

- hue_primary: 40
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 5
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#D3D2CF, accent=#D6A81F, ink=#1C1B17, contraste=11.40:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects the core themes of the book, particularly the importance of maintaining success and adapting to challenges, which are central to Curtis Jackson's narrative. Phrases like 'conservar el éxito' and 'adaptarse a las crisis' are explicitly aligned with the book's message about resilience and the ongoing nature of success, making it highly specific to the book.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes of sustaining success and resilience found in the ground truth. Phrases like 'success can slip away if not managed with shrewdness and dedication' and 'the road to sustainable success is paved with the ability to learn, adjust, and move forward' align well with Curtis Jackson's experiences and lessons shared in the book. However, some phrases are a

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre el éxito.
- EN: pagina — Voz directa y reflexiones personales sobre el éxito.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.88 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.91**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10350
- Tiempo total: 60.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41791ms
- anchors: 2609 tokens, 3967ms
- palette: 0 tokens, 0ms
- content_es: 2701 tokens, 5464ms
- judge_es: 1054 tokens, 1848ms
- content_en: 2141 tokens, 4490ms
- judge_en: 1011 tokens, 2386ms
- voice: 834 tokens, 675ms
