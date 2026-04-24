# Quality Report — Shakespeare para enamorados

**Autor:** Allan Percy
**Ejecutado:** 2026-04-24T03-08-01
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.83
- **Resolution path:** evidence_fetched_3sources
- **Match score:** 0.71



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

Shakespeare para enamorados es un libro fresco e increíblemente inspirador para los que se toman el amor muy en serio. Un volumen de la serie «Genios para la vida cotidiana» en el que Allan Percy ofrece remedios eficaces para gozar de amor cada día de tu vida. De entre todos los grandes autores de la literatura universal, ninguno profundizó en los misterios del amor y ha tratado los asuntos del corazón desde una perspectiva tan lúcida como William Shakespeare. Todavía hoy sus obras y poemas son una poderosa herramienta para comprender los insondables secretos de nuestro corazón. Del flechazo al desengaño, del primer beso al amor imposible, del compromiso a los celos, Shakespeare para enamorados saca de los escenarios y de las antologías poéticas la ciencia ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- remedios eficaces para gozar de amor cada día
- misterios del amor según Shakespeare
- la ciencia shakespeariana del amor
- secretos de nuestro corazón
- perspectiva lúcida sobre el amor

**Key terms:** amor, celos, seducción, desengaño, romance

**Voz autorial:** La voz de Allan Percy es accesible y reflexiva, buscando conectar los textos de Shakespeare con la vida cotidiana de los lectores, ofreciendo consejos prácticos y profundos.

---

## 🎨 Visual synthesis

- hue_primary: 340
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: analogous
- typography: serif_moderno
- Resultado: paper=#D3CFD0, accent=#D61F3D, ink=#1C1718, contraste=11.48:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly references Shakespeare's insights on love, celos (jealousy), and seducción (seduction), which are specific concepts from the ground truth. It also emphasizes the idea of love as a journey and the lessons learned from both romance and heartbreak, aligning closely with the themes presented in 'Shakespeare para enamorados'.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes and concepts presented in the ground truth, particularly regarding Shakespeare's insights on love, jealousy, and seduction. Phrases like 'Shakespearean science of love' and references to lessons from heartbreak are specific to the book's focus on Shakespeare's perspective on love. However, some phrases are somewhat generic and could apply to a 1

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre el amor sin referencias externas.
- EN: pagina — Voz directa y reflexiones sobre el amor sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.83 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.9**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9683
- Tiempo total: 68.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 42586ms
- anchors: 2450 tokens, 5392ms
- palette: 0 tokens, 0ms
- content_es: 2581 tokens, 6938ms
- judge_es: 936 tokens, 2613ms
- content_en: 2003 tokens, 6386ms
- judge_en: 889 tokens, 2219ms
- voice: 824 tokens, 2432ms
