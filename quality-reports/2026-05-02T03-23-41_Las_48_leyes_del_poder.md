# Quality Report — Las 48 leyes del poder

**Autor:** Robert Greene
**Ejecutado:** 2026-05-02T03-23-41
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

El best seller mundial para los que quieren obtener, estudiar o combatir el poder absoluto. Amoral, inmisericorde, despiadada y, sobre todo, muy instructiva, esta incisiva obra concentra tres mil años de historia del poder en cuarenta y ocho leyes claras y concisas. Robert Greene detalla las leyes del poder en su esencia más cruda, sintetizando el pensamiento de Maquiavelo, Sun Tzu, Carl von Clausewitz y otros grandes teóricos y estrategas. Algunas leyes sugieren la prudencia ("Ley n° 1: nunca le haga sombra a su amo"); otras, el sigilo ("Ley n° 3: disimule sus intenciones"); otras más, una total falta de piedad ("Ley n° 15: aplaste por completo a su enemigo"). Pero, nos guste o no, todas tienen aplicaciones en la vida cotidiana. Ilustradas mediante anécdot...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- la prudencia en el ejercicio del poder
- el sigilo como estrategia efectiva
- la falta de piedad en la competencia
- la manipulación de las intenciones ajenas
- la aplicación de leyes históricas en la vida cotidiana

**Key terms:** poder absoluto, leyes del poder, estrategas, control total, manipulación

**Voz autorial:** La voz de Robert Greene es incisiva, directa y a menudo despiadada, presentando el poder como un juego de estrategias donde la moralidad es secundaria.

---

## 🎨 Visual synthesis

- hue_primary: 0
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: complementary
- typography: sans_tecnologico
- Resultado: paper=#D3D0CF, accent=#E23512, ink=#1C1817, contraste=11.48:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: El contenido generado utiliza conceptos específicos de 'Las 48 leyes del poder', como la prudencia y el sigilo, y menciona la importancia de disimular intenciones, que son temas centrales del libro. Las frases y el enfoque están claramente anclados a las leyes del poder de Robert Greene, lo que demuestra una comprensión profunda de su contenido.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content directly references the concept of prudence, which is aligned with 'Ley n° 1: nunca le haga sombra a su amo' and 'Ley n° 3: disimule sus intenciones' from the book. It uses specific terms and ideas from 'Las 48 leyes del poder', making it highly relevant and anchored to the ground truth.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Tono directo y reflexiones sobre el poder sin referencias externas.
- EN: pagina — Tono directo y reflexivo, sin referencias externas al autor.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9799
- Tiempo total: 37.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 17229ms
- anchors: 2567 tokens, 6620ms
- palette: 0 tokens, 0ms
- content_es: 2560 tokens, 4838ms
- judge_es: 927 tokens, 1569ms
- content_en: 2002 tokens, 3467ms
- judge_en: 915 tokens, 2273ms
- voice: 828 tokens, 1053ms
- highlight_judge_es_parrafoTop: 640 tokens, 0ms
- highlight_judge_es_parrafoBot: 648 tokens, 0ms
- highlight_judge_en_parrafoTop: 639 tokens, 0ms
- highlight_judge_en_parrafoBot: 642 tokens, 0ms
