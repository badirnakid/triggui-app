# Quality Report — Eutanasia para vivir

**Autor:** Martín Achirica
**Ejecutado:** 2026-04-22T14-41-30
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

Hay palabras que impactan y EUTANASIA por su inmediata relación con la muerte, es una de ellas. Amar la vida, no es odiar la muerte; por el contrario, gracias a la muerte que me ha dado tanto… y es que, si no la hiciésemos presente no valoraríamos la vida que tenemos frente. Pero para muchos esta reflexión suele llegar demasiado tarde, cuando ya no queda nada por hacer. ¿Debemos entonces resignarnos a vivir en modo avión, en modo autómata y activar nuestra conciencia solo días o minutos antes de nuestra muerte? En Eutanasia para vivir, volver a la vida en la vida misma, Martín Achirica, nos comparte una visión de la muerte distinta; nos muestra un reflejo al espejo en 360 grados que nos provoca y reta a hacer un alto en el camino para poder sobrevivir, pero...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la conciencia del morir como herramienta para valorar la vida
- vinculación entre la ciencia y la espiritualidad
- nuevo paradigma del bienestar y salud integrativa
- reflejo en 360 grados de la vida y la muerte
- abrazar la muerte para aprender a vivir plenamente

**Key terms:** eutanasia, conciencia, bienestar, salud integrativa, paradigma

**Voz autorial:** La voz de Martín Achirica es reflexiva y provocativa, invitando al lector a cuestionar su relación con la vida y la muerte, y a explorar la conexión entre lo tangible y lo espiritual.

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
- Razón: The generated content directly reflects the themes and concepts presented in the ground truth of 'Eutanasia para vivir' by Martín Achirica. Phrases like 'la conciencia del morir' and 'vinculación entre la ciencia y la espiritualidad' are explicitly mentioned in the synopsis, demonstrating a strong connection to the book's core ideas about life, death, and the integration of science and spiritualty

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes and concepts presented in the ground truth of 'Eutanasia para vivir' by Martín Achirica. It discusses the awareness of death as a means to enhance life, which is a central idea in the book. Phrases like 'the connection between science and spirituality' and 'embracing mortality' directly relate to the book's exploration of life and death, making it 

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre la vida y la muerte.
- EN: pagina — Tono reflexivo y directo, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.83 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.94**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9685
- Tiempo total: 51.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 25423ms
- anchors: 2461 tokens, 8923ms
- palette: 0 tokens, 1ms
- content_es: 2586 tokens, 6309ms
- judge_es: 934 tokens, 2034ms
- content_en: 2010 tokens, 5202ms
- judge_en: 903 tokens, 2471ms
- voice: 791 tokens, 1013ms
