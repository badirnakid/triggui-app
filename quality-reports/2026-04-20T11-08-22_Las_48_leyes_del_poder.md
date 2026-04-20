# Quality Report — Las 48 leyes del poder

**Autor:** Robert Greene
**Ejecutado:** 2026-04-20T11-08-22
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

El best seller mundial para los que quieren obtener, estudiar o combatir el poder absoluto. Amoral, inmisericorde, despiadada y, sobre todo, muy instructiva, esta incisiva obra concentra tres mil años de historia del poder en cuarenta y ocho leyes claras y concisas. Robert Greene detalla las leyes del poder en su esencia más cruda, sintetizando el pensamiento de Maquiavelo, Sun Tzu, Carl von Clausewitz y otros grandes teóricos y estrategas. Algunas leyes sugieren la prudencia ("Ley n° 1: nunca le haga sombra a su amo"); otras, el sigilo ("Ley n° 3: disimule sus intenciones"); otras más, una total falta de piedad ("Ley n° 15: aplaste por completo a su enemigo"). Pero, nos guste o no, todas tienen aplicaciones en la vida cotidiana. Ilustradas mediante anécdot...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la ley de nunca hacer sombra a su amo
- disimular intenciones como estrategia
- aplastar por completo a su enemigo
- la naturaleza amoral del poder
- la aplicación de leyes del poder en la vida cotidiana

**Key terms:** leyes del poder, estrategia, manipulación, control, análisis de poder

**Voz autorial:** La voz de Robert Greene es incisiva y directa, combinando una narrativa histórica con ejemplos contemporáneos y un enfoque pragmático sobre la naturaleza del poder.

---

## 🎨 Visual synthesis

- hue_primary: 0
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: complementary
- typography: serif_moderno
- Resultado: paper=#D3D0CF, accent=#E23512, ink=#1C1817, contraste=11.48:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly references specific laws from 'Las 48 leyes del poder', such as 'nunca le haga sombra a su amo' and 'disimule sus intenciones', which are central concepts in the book. Additionally, the phrases and themes discussed, such as the amoral nature of power and the importance of strategy, are explicitly tied to Greene's work, making it highly specific and relevant.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly references specific laws from the book, such as 'never outshine the master' and 'disguising intentions as strategy,' which are key concepts in 'Las 48 leyes del poder.' The phrases and ideas presented are clearly anchored in the book's themes and terminology, making it highly specific to Greene's work.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y consejos prácticos del libro.
- EN: pagina — Usa voz directa y se enfoca en conceptos del libro.

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
- Tokens totales: 9692
- Tiempo total: 31.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 896ms
- anchors: 2337 tokens, 6801ms
- palette: 0 tokens, 1ms
- content_es: 2618 tokens, 9824ms
- judge_es: 932 tokens, 2636ms
- content_en: 2115 tokens, 7212ms
- judge_en: 873 tokens, 3401ms
- voice: 817 tokens, 1037ms
