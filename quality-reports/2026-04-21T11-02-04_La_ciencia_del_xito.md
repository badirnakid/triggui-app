# Quality Report — La ciencia del éxito

**Autor:** Napoleon Hill
**Ejecutado:** 2026-04-21T11-02-04
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

Enestecurso magistral,dictadooriginalmenteen Chicago amediados de losañoscincuenta,Napoleon Hilldesarrolla aprofundidad sus ideassobreeléxito ycómollegar aél . Durante décadas, Piense y hágase rico ha cambiado la mentalidad de millones de personas, que han encontrado en sus principios y filosofía una guía para alcanzar el triunfo y el equilibrio en su vida, pero nunca hasta ahora había sido posible acceder a las lecciones íntegras que el mismo Napoleon Hill impartió a sus alumnos iniciales. La ciencia del éxito es un valioso regalo, es el camino más directo hacia el perfeccionamiento de tu verdadero potencial, y uno de los libros de desarrollo personal más completos que se han escrito jamás. Ya sea que quieras descubrir tu propósito en la vida, desarrollar ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- desarrollo de una personalidad atrayente
- actitud mental positiva
- descubrimiento del propósito en la vida
- nutrición de la creatividad e imaginación
- liderazgo efectivo

**Key terms:** éxito, mentalidad, potencial, oportunidades, creatividad

**Voz autorial:** La voz de Napoleon Hill en este libro es motivacional y persuasiva, centrada en la autoayuda y el desarrollo personal, con un enfoque práctico y directo para alcanzar el éxito.

---

## 🎨 Visual synthesis

- hue_primary: 60
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#D3D3CF, accent=#C0E212, ink=#1B1C17, contraste=11.42:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 0.80
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The content specifically addresses the development of an attractive personality and the importance of a positive mental attitude, both of which are key concepts from Napoleon Hill's teachings in 'La ciencia del éxito'. However, while the phrases are closely related to the book's themes, they are somewhat generalized and could be interpreted in a broader self-help context, which slightly lowers the

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects specific concepts from the ground truth, particularly the emphasis on developing an attractive personality and maintaining a positive mental attitude, which are key themes in Napoleon Hill's teachings. However, while it is anchored in the book's principles, the language used is somewhat generic and could apply to various self-help contexts, which prevents a perfect score.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas retóricas.
- EN: pagina — Voz directa y consejos prácticos, sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.85 ← anti-genericidad de anchors
- **grounding_judge:** 0.75 ← promedio de los 2 judges
- **Combined:** **0.87**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9241
- Tiempo total: 24.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2698ms
- anchors: 2337 tokens, 6387ms
- palette: 0 tokens, 0ms
- content_es: 2507 tokens, 5741ms
- judge_es: 875 tokens, 2131ms
- content_en: 1920 tokens, 5071ms
- judge_en: 838 tokens, 1961ms
- voice: 764 tokens, 760ms
