# Quality Report — Cómo ser un estoico

**Autor:** Massimo Pigliucci
**Ejecutado:** 2026-05-02T11-51-32
**Pipeline:** nucleus-canonical-v3.7.1

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

No sabemos qué te ha llevado a sentir curiosidad por este libro. Tal vez estés pasando por una etapa con un alto nivel de estrés. Quizás sufres una gran saturación de trabajo. O estás empezando a comprender las responsabilidades que conlleva tener un hijo. O puede que estés viviendo una tormenta emocional como consecuencia de una nueva relación fallida. Sea lo que sea, seguro que puedes encontrar las palabras justas dentro de la sabiduría estoica. El estoicismo es una filosofía práctica cuyo mensaje esencial es: no podemos controlar lo que nos pasa, pero sí cómo respondemos a ello. Cuando nos hacemos preguntas tan corrientes como «¿Qué puedo hacer para controlar mi rabia?», «¿Qué debo hacer si alguien me insulta?», «¿Qué puedo hacer para no sentir temor ant...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- no podemos controlar lo que nos pasa, pero sí cómo respondemos a ello
- preguntas estoicas sobre el control de emociones como la rabia y el temor
- vivir de acuerdo a la filosofía estoica para alcanzar la felicidad
- conversaciones entre Massimo Pigliucci y Epicteto
- ejercicios prácticos y meditación en la vida cotidiana

**Key terms:** estoicismo, filosofía práctica, Marco Aurelio, Epicteto, sabiduría estoica

**Voz autorial:** La voz de Massimo Pigliucci es reflexiva, accesible y práctica, buscando conectar la filosofía antigua con los desafíos modernos.

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
- Razón: The generated content directly reflects key concepts from the ground truth, such as the importance of how we respond to adversity and managing emotions like anger and fear, which are central themes in 'Cómo ser un estoico'. It uses specific phrases that align with the book's teachings on stoicism, making it highly relevant and not generic.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content reflects key Stoic concepts such as the importance of our responses to adversity and managing emotions, which are central to the book's themes. It specifically references Stoic wisdom and the idea of engaging with emotions, aligning closely with the book's focus on practical Stoicism. However, some phrases are somewhat generic and could apply to broader self-help contexts.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre la adversidad.
- EN: pagina — Voz directa y reflexiones personales sobre la filosofía estoica.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10219
- Tiempo total: 23.3s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 1563ms
- anchors: 2694 tokens, 5728ms
- palette: 0 tokens, 0ms
- content_es: 2657 tokens, 5685ms
- judge_es: 994 tokens, 1389ms
- content_en: 2086 tokens, 4361ms
- judge_en: 985 tokens, 2759ms
- voice: 803 tokens, 1311ms
- highlight_judge_es_parrafoTop: 641 tokens, 0ms
- highlight_judge_es_parrafoBot: 649 tokens, 0ms
- highlight_judge_en_parrafoTop: 640 tokens, 0ms
- highlight_judge_en_parrafoBot: 640 tokens, 0ms
