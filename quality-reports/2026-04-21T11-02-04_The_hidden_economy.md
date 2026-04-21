# Quality Report — The hidden economy

**Autor:** Alejandra González
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

Estás a punto de descubrir todo sobre la economía de los creadores Con la llegada de las plataformas digitales surgió una nueva fase económica que, además de permitir un modelo laboral más flexible, cambió el panorama del marketing digital: la economíade los creadores. Hoy existen influencers,youtubers,streamers y creadores de contenido que cuentan con miles de seguidores y manejan contratos millonarios con empresas de diferentes industrias, logrando vivir la vida de sus sueños y explorar todas y cada una de sus pasiones, pero ¿cómo llegaron hasta ahí? ¿Cómo unirse a sus filas? ¿Qué es lo que hay que saber? Y… ¿qué les depara el futuro? El mundo digital avanza a pasos agigantados y parece que cada día se implementa una nueva plataforma, por lo que la adapta...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la economía de los creadores
- adaptabilidad en plataformas digitales
- estrategia y voz única en redes
- futuro del trabajo en la economía digital
- impacto de la Web3 y la inteligencia artificial

**Key terms:** creadores de contenido, influencers, marketing digital, plataformas digitales, estrategia de contenido

**Voz autorial:** La voz autorial es directa y accesible, orientada a un público joven, con un enfoque en la exploración de oportunidades en el mundo digital.

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
- Razón: The generated content directly reflects the themes and concepts presented in the ground truth of 'The Hidden Economy.' It discusses the transformation of work through the economy of creators, the importance of authenticity, strategy, and adaptability in digital platforms, and mentions the future implications of Web3 and AI, all of which are explicitly outlined in the book's synopsis.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes presented in the ground truth, specifically discussing the creator economy, the importance of adaptability, and the need for a unique voice. Phrases like 'the creator economy has revolutionized the way we work' and 'adaptability on digital platforms is crucial for success' reflect the book's focus on the dynamics of content creation and digital,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y consejos prácticos sin referencias meta.
- EN: pagina — Voz directa y consejos prácticos sobre el tema.

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
- Tokens totales: 9688
- Tiempo total: 23.1s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2047ms
- anchors: 2410 tokens, 4610ms
- palette: 0 tokens, 0ms
- content_es: 2598 tokens, 6058ms
- judge_es: 954 tokens, 2810ms
- content_en: 2012 tokens, 4040ms
- judge_en: 914 tokens, 2464ms
- voice: 800 tokens, 1038ms
