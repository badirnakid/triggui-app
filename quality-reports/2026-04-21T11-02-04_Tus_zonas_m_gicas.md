# Quality Report — Tus zonas mágicas

**Autor:** Wayne W. Dyer
**Ejecutado:** 2026-04-21T11-02-04
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

Con Tus zonas mágicas el lector accederá al milagro cotidiano de aproximarse a la perfección. Otro libro imprescindible del autor de Tus zonas erróneas. ¿Solo existe la realidad tangible, la que reconocemos por nuestros sentidos? ¿No existirá también una realidad «subyacente», sin desarrollar en la mayoría de los seres, pero que daría a estos un ilimitado poder para realizar sus vidas con plenitud? Wayne W. Dyer afirma que sí. Afirma la existencia de una realidad mágica en cada uno, una poderosa parcela espiritual que está esperando ser descubierta para ser utilizada como un único fin posible: lograr lo mejor para uno mismo y para los otros.

METADATA VERIFICADA:
- Título: Tus zonas mágicas
- Autor: Wayne W. Dyer
- Año: 2017
- Categorías: Psicología, Libros...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la existencia de una realidad mágica en cada individuo
- el poder ilimitado de la mente para transformar la vida
- la búsqueda de la plenitud personal y colectiva

**Key terms:** realidad subyacente, milagro cotidiano, poder espiritual

**Voz autorial:** La voz de Wayne W. Dyer es inspiradora y motivacional, invitando al lector a explorar su potencial interno y a cuestionar las limitaciones autoimpuestas.

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
- Razón: The generated content directly reflects the core concepts of Wayne W. Dyer's 'Tus zonas mágicas', specifically the ideas of a 'reality subyacente' (underlying reality) and the 'poder ilimitado de la mente' (unlimited power of the mind). Phrases like 'realidad mágica' and 'transforma lo cotidiano en un milagro' are closely aligned with the book's themes of personal empowerment and spiritual growth,

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes of inner potential and the exploration of a deeper reality as presented in the ground truth of 'Tus zonas mágicas'. Phrases like 'unlimited power of the mind' and 'inner magic' resonate with Dyer's concepts of a 'subyacente' reality and personal empowerment. However, some phrases are slightly generic and could apply to other self-help contexts, but

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre la magia interna.
- EN: pagina — Voz directa y reflexiones personales sobre el contenido.

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
- Tokens totales: 9132
- Tiempo total: 25.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3354ms
- anchors: 2321 tokens, 4484ms
- palette: 0 tokens, 0ms
- content_es: 2443 tokens, 6001ms
- judge_es: 833 tokens, 2040ms
- content_en: 1899 tokens, 6930ms
- judge_en: 804 tokens, 1780ms
- voice: 832 tokens, 863ms
