# Quality Report — La filosofía del éxito

**Autor:** Napoleon Hill
**Ejecutado:** 2026-04-22T14-41-30
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

&#xa0;Tienes en tus manos los diecisiete principios del éxito que Napoleon Hill descubrió tras más de veinte años de investigación. La esencia de la sabiduría de quien, a pesar de llevar décadas muerto, sigue siendo considerando "el filósofo de la superación de todos los tiempos". Autor de múltiples libros superventas, Hill te da las claves para alcanzar el éxito, la felicidad y la tranquilidad de espíritu. Líbrate de las limitaciones que te autoimpones y disfruta de la riqueza de la vida.&#xa0; &#xa0;Trabajar para conseguir tu objetivo será más fácil y productivo si conviertes estas enseñanzas en tus nuevos hábitos. Aprende a definir tu meta en la vida, a ser una persona proactiva y con iniciativa, a mantener a raya las emociones negativas y a ganarte la c...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- los diecisiete principios del éxito
- definir tu meta en la vida
- ser proactivo y mantener la iniciativa
- controlar las emociones negativas
- ganar la confianza de los demás

**Key terms:** principios del éxito, autoimposición, nueva actitud, hábitos productivos, tranquilidad de espíritu

**Voz autorial:** La voz de Napoleon Hill es motivacional y directa, enfocándose en la transformación personal a través de principios claros y aplicables.

---

## 🎨 Visual synthesis

- hue_primary: 45
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#D3D3CF, accent=#E2D112, ink=#1C1B17, contraste=11.48:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly references the 'diecisiete principios del éxito' and emphasizes the importance of defining one's goals, both of which are central themes in Napoleon Hill's work. The phrases used are specific to the book's teachings and reflect its core messages about success, initiative, and overcoming self-imposed limitations.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content explicitly references the 'seventeen principles of success' and emphasizes the importance of defining life goals, both of which are central themes in Napoleon Hill's work. The phrases used are closely aligned with the concepts presented in the ground truth, making it specific to Hill's philosophy rather than generic self-help advice.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en principios del éxito.
- EN: pagina — Voz directa y consejos prácticos sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10065
- Tiempo total: 29.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 1672ms
- anchors: 2587 tokens, 7872ms
- palette: 0 tokens, 1ms
- content_es: 2613 tokens, 8034ms
- judge_es: 978 tokens, 2100ms
- content_en: 2079 tokens, 6483ms
- judge_en: 944 tokens, 1856ms
- voice: 864 tokens, 1481ms
