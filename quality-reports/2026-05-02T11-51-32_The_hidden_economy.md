# Quality Report — The hidden economy

**Autor:** Alejandra González
**Ejecutado:** 2026-05-02T11-51-32
**Pipeline:** nucleus-canonical-v3.7.1

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

Estás a punto de descubrir todo sobre la economía de los creadores Con la llegada de las plataformas digitales surgió una nueva fase económica que, además de permitir un modelo laboral más flexible, cambió el panorama del marketing digital: la economíade los creadores. Hoy existen influencers,youtubers,streamers y creadores de contenido que cuentan con miles de seguidores y manejan contratos millonarios con empresas de diferentes industrias, logrando vivir la vida de sus sueños y explorar todas y cada una de sus pasiones, pero ¿cómo llegaron hasta ahí? ¿Cómo unirse a sus filas? ¿Qué es lo que hay que saber? Y… ¿qué les depara el futuro? El mundo digital avanza a pasos agigantados y parece que cada día se implementa una nueva plataforma, por lo que la adapta...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- la economía de los creadores
- modelo laboral flexible
- estrategia de contenido
- adaptabilidad en plataformas digitales
- futuro del trabajo y la Web3

**Key terms:** influencers, creadores de contenido, marketing digital, plataformas digitales, inteligencia artificial

**Voz autorial:** La voz de Alejandra González es informativa y accesible, dirigida a un público juvenil que busca comprender las nuevas dinámicas laborales y de marketing en el contexto digital.

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
- Razón: El contenido generado utiliza conceptos específicos del libro, como 'economía de los creadores', 'estrategia de contenido', y menciona la importancia de la autenticidad y la adaptación en el contexto de plataformas digitales, lo que refleja directamente la sinopsis del libro. Además, aborda temas como la Web3 y la inteligencia artificial, que son relevantes para el futuro del trabajo en esta nueva

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content directly references concepts from the ground truth, such as 'creator economy', 'digital platforms', 'authenticity', 'content strategy', and 'Web3', which are central to the book's themes. It discusses the evolving landscape of work and marketing in a way that aligns closely with the book's focus on the creator economy.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.80)
- ES: pagina — Tono directo y preguntas retóricas sugieren voz del autor.
- EN: pagina — Tono directo y enfoque en el lector, sin referencias meta.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.9 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.96**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9671
- Tiempo total: 24.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3155ms
- anchors: 2410 tokens, 4883ms
- palette: 0 tokens, 0ms
- content_es: 2575 tokens, 7083ms
- judge_es: 965 tokens, 2269ms
- content_en: 1996 tokens, 3370ms
- judge_en: 934 tokens, 2020ms
- voice: 791 tokens, 747ms
- highlight_judge_es_parrafoTop: 639 tokens, 0ms
- highlight_judge_es_parrafoBot: 636 tokens, 0ms
- highlight_judge_en_parrafoTop: 635 tokens, 0ms
- highlight_judge_en_parrafoBot: 643 tokens, 0ms
