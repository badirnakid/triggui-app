# Quality Report — Gestión Del Tiempo

**Autor:** Anselmo Echevarria
**Ejecutado:** 2026-04-26T18-04-38
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `identity_sealed_with_evidence`
- **Tier reached:** 1.5
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_preloaded
- **Match score:** 1.00



### Ground truth utilizado
```
LIBRO SELECCIONADO POR EL CURADOR AUTOMÁTICO:
Título: Gestión Del Tiempo
Autor: Anselmo Echevarria

SINOPSIS OFICIAL (Google Books):

Tanto si es estudiante, profesional o alguien que busca un estilo de vida más equilibrado, "Gestión del tiempo" es la guía definitiva para desbloquear todo su potencial y lograr el éxito en todas las áreas de su vida. Cualquiera que quiera dominar la gestión del tiempo y aumentar la productividad debe leer El plan de productividad: Dominar la gestión del tiempo para profesionales ocupados. Este libro es para todos, incluidos ejecutivos, profesionales y estudiantes. Este libro ofrece a los directores ejecutivos y profesionales con limitaciones de tiempo una guía útil sobre la gestión del tiempo y la mejora de la productividad. Con frecuencia, los ejecutivos t...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- estrategias para establecer prioridades
- tácticas de productividad para profesionales ocupados
- mejora del equilibrio entre vida personal y profesional
- consejos para manejar la carga de trabajo
- desbloqueo del potencial personal

**Key terms:** gestión del tiempo, productividad, prioridades, equilibrio, tácticas

**Voz autorial:** La voz del autor es práctica y directa, enfocándose en la aplicabilidad de las estrategias propuestas para mejorar la gestión del tiempo en la vida cotidiana de los lectores.

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
- Score: 0.80
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The content closely aligns with the themes of time management and productivity discussed in 'Gestión Del Tiempo.' Phrases like 'desbloquear tu potencial personal' and 'establecer prioridades' reflect specific concepts from the book. However, some phrases are somewhat generic and could apply to other self-help books, which slightly lowers the score.

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects key themes from 'Gestión Del Tiempo', such as mastering time management and establishing priorities, which are central to the book's focus. However, some phrases are somewhat generic and could apply to various self-help contexts, slightly reducing the score.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en el lector.
- EN: pagina — Voz directa y consejos prácticos sobre gestión del tiempo.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.82 ← anti-genericidad de anchors
- **grounding_judge:** 0.75 ← promedio de los 2 judges
- **Combined:** **0.86**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9184
- Tiempo total: 32.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3ms
- anchors: 2353 tokens, 11929ms
- palette: 0 tokens, 1ms
- content_es: 2477 tokens, 6933ms
- judge_es: 852 tokens, 1894ms
- content_en: 1900 tokens, 7963ms
- judge_en: 828 tokens, 1847ms
- voice: 774 tokens, 1826ms
- highlight_judge_es_parrafoTop: 636 tokens, 0ms
- highlight_judge_es_parrafoBot: 649 tokens, 0ms
- highlight_judge_es_parrafoBot_retry: 653 tokens, 0ms
- highlight_judge_en_parrafoTop: 631 tokens, 0ms
- highlight_judge_en_parrafoBot: 646 tokens, 0ms
