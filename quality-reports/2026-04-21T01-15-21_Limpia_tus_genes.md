# Quality Report — Limpia tus genes

**Autor:** Ben Lynch
**Ejecutado:** 2026-04-21T01-15-21
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

¡Tus genes no son tu destino! Tal vez siempre has pensado en tus genes como un "plan maestro" con instrucciones inalterables que afectan cuán sano o qué tan propenso eres a la cardiopatía, la ansiedad, los desórdenes digestivos o autoinmunes e incluso al cáncer o la diabetes. Sin embargo, ocurre justo lo contrario: son nuestros hábitos, alimentación y estilo de vida los que modifican constantemente nuestra expresión genética e influyen de manera determinante en nuestra salud. El secreto está en nuestros "genes sucios" o las variaciones hereditarias que nos predisponen para la enfermedad. Y tras años de investigación en la nueva ciencia de las anormalidades genéticas y de brindar tratamiento a miles de pacientes, el doctor Ben Lynch traduce los últimos descu...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- modificación de la expresión genética a través de hábitos
- genes sucios y su impacto en la salud
- protocolo de tres fases para limpiar genes
- recetas para cada tipo de gen sucio
- recuperar el control sobre la salud personal

**Key terms:** genes sucios, expresión genética, anormalidades genéticas, protocolo de salud, hábitos saludables

**Voz autorial:** La voz autorial de Ben Lynch es clara y accesible, combinando la ciencia con un enfoque práctico para empoderar al lector en la mejora de su salud.

---

## 🎨 Visual synthesis

- hue_primary: 65
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#D3D3CF, accent=#C7D61F, ink=#1B1C17, contraste=11.42:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly references specific concepts from the book, such as 'modificación de la expresión genética', 'genes sucios', and the 'protocolo de tres fases', which are central to the book's premise. Additionally, the phrases emphasize the importance of habits and lifestyle choices in relation to genetic expression, aligning closely with the book's message.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the core concepts of the book, specifically the idea that habits and lifestyle choices can modify genetic expression, which is a central theme in 'Limpia tus genes.' Phrases like 'Dirty genes hold the key to unlocking vibrant health' and 'three-phase protocol' directly reference the book's content. However, some phrases are slightly generic and could apply

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y preguntas retóricas propias del texto del autor.
- EN: pagina — Voz directa y tono coherente con el contenido del libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.93**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9943
- Tiempo total: 65.3s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40132ms
- anchors: 2601 tokens, 5680ms
- palette: 0 tokens, 0ms
- content_es: 2618 tokens, 6722ms
- judge_es: 967 tokens, 3191ms
- content_en: 2031 tokens, 5510ms
- judge_en: 925 tokens, 2511ms
- voice: 801 tokens, 1577ms
