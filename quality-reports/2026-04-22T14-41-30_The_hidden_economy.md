# Quality Report — The hidden economy

**Autor:** Alejandra González
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

Estás a punto de descubrir todo sobre la economía de los creadores Con la llegada de las plataformas digitales surgió una nueva fase económica que, además de permitir un modelo laboral más flexible, cambió el panorama del marketing digital: la economíade los creadores. Hoy existen influencers,youtubers,streamers y creadores de contenido que cuentan con miles de seguidores y manejan contratos millonarios con empresas de diferentes industrias, logrando vivir la vida de sus sueños y explorar todas y cada una de sus pasiones, pero ¿cómo llegaron hasta ahí? ¿Cómo unirse a sus filas? ¿Qué es lo que hay que saber? Y… ¿qué les depara el futuro? El mundo digital avanza a pasos agigantados y parece que cada día se implementa una nueva plataforma, por lo que la adapta...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la economía de los creadores
- modelos laborales flexibles
- estrategias de contenido en redes
- adaptabilidad y autenticidad
- futuro del trabajo y tecnología

**Key terms:** influencers, plataformas digitales, Web3, inteligencia artificial, creadores de contenido

**Voz autorial:** La voz autorial es informativa y reflexiva, orientada a guiar al lector a través de los cambios en el panorama laboral y las estrategias necesarias para triunfar en la economía digital.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#CFD2D3, accent=#1F99D6, ink=#171A1C, contraste=11.50:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly references key concepts from the ground truth, such as the 'economía de los creadores', 'estrategias de contenido', 'adaptabilidad', 'autenticidad', and the roles of 'Web3' and 'inteligencia artificial'. These terms are specific to the themes and discussions outlined in the book's synopsis, demonstrating a clear connection to the book's content.

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects specific concepts from the ground truth, such as 'creator economy', 'adaptability', and 'authenticity', which are central themes in the book. However, while it is tailored to the topic, some phrases are somewhat generic and could apply to various contexts within the digital marketing or self-help genres, which prevents a perfect score.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.80)
- ES: pagina — Voz directa y enfoque en el impacto de la economía de creadores.
- EN: pagina — Tono directo y consejos prácticos, sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.9 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.85 ← promedio de los 2 judges
- **Combined:** **0.91**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9697
- Tiempo total: 29.3s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3920ms
- anchors: 2424 tokens, 5980ms
- palette: 0 tokens, 0ms
- content_es: 2579 tokens, 6434ms
- judge_es: 957 tokens, 2587ms
- content_en: 2015 tokens, 5984ms
- judge_en: 909 tokens, 2785ms
- voice: 813 tokens, 1615ms
