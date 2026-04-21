# Quality Report — Eutanasia para vivir

**Autor:** Martín Achirica
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

Hay palabras que impactan y EUTANASIA por su inmediata relación con la muerte, es una de ellas. Amar la vida, no es odiar la muerte; por el contrario, gracias a la muerte que me ha dado tanto… y es que, si no la hiciésemos presente no valoraríamos la vida que tenemos frente. Pero para muchos esta reflexión suele llegar demasiado tarde, cuando ya no queda nada por hacer. ¿Debemos entonces resignarnos a vivir en modo avión, en modo autómata y activar nuestra conciencia solo días o minutos antes de nuestra muerte? En Eutanasia para vivir, volver a la vida en la vida misma, Martín Achirica, nos comparte una visión de la muerte distinta; nos muestra un reflejo al espejo en 360 grados que nos provoca y reta a hacer un alto en el camino para poder sobrevivir, pero...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la muerte como parte de la vida
- conciencia del morir
- vinculación entre ciencia y espiritualidad
- nuevo paradigma del bienestar
- reflejo al espejo en 360 grados

**Key terms:** eutanasia, conciencia, bienestar integrativo, nuevo arquetipo, vida y muerte

**Voz autorial:** La voz de Achirica es reflexiva y provocativa, buscando desafiar las percepciones convencionales sobre la muerte y la vida, invitando a los lectores a una introspección profunda.

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
- Razón: The generated content closely reflects the themes and concepts presented in the ground truth of 'Eutanasia para vivir' by Martín Achirica. It discusses the relationship between life and death, the importance of living consciously, and the integration of science and spirituality, all of which are central to the book's message. Phrases like 'la muerte como parte de la vida' and 'la vinculación entre

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes and concepts presented in the ground truth of 'Eutanasia para vivir.' It explicitly discusses the relationship between death and life, the importance of embracing mortality to enhance our existence, and the connection between science and spirituality, all of which are central to Achirica's work. Phrases like 'the intertwining of science and spirit'

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre la muerte.
- EN: pagina — Voz directa y reflexiones sobre la vida y la muerte.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.85 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.94**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9801
- Tiempo total: 28.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 6301ms
- anchors: 2442 tokens, 5128ms
- palette: 0 tokens, 0ms
- content_es: 2590 tokens, 6548ms
- judge_es: 949 tokens, 2453ms
- content_en: 2049 tokens, 5122ms
- judge_en: 927 tokens, 2361ms
- voice: 844 tokens, 743ms
