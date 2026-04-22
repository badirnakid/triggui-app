# Quality Report — El almanaque de Naval Ravikant

**Autor:** Eric Jorgenson
**Ejecutado:** 2026-04-22T14-41-30
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.94
- **Resolution path:** evidence_fetched_4sources
- **Match score:** 0.96



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

A sabedoria e a experiência do investidor que cativou o mundo com seus ensinamentos sobre o sucesso nos negócios e na vida Ficar rico não é questão de sorte; felicidade não vem de berço. Essas aspirações podem parecer fora de alcance, mas, conforme nos ensina o empresário, filósofo e investidor Naval Ravikant, a prosperidade duradoura é uma habilidade que se aprende. Naval Ravikant gosta de pensar que, se perdesse todo o seu dinheiro e fosse deixado em uma rua aleatória de um país cuja língua falasse, em cinco ou dez anos estaria rico novamente, porque ganhar dinheiro é apenas um conjunto de habilidades que ele desenvolveu — e que qualquer um pode ter. O caminho para a riqueza não passa por diplomas ou bons empregos: ninguém tem verdadeira liberdade finance...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la riqueza como habilidad aprendida
- la búsqueda de la verdadera obsesión personal
- la libertad financiera más allá de empleos convencionales
- la autenticidad como camino hacia la felicidad
- la importancia del autoconocimiento en el éxito

**Key terms:** prosperidad duradera, libertad financiera, negocios lucrativos, autenticidad, verdadera obsesión

**Voz autorial:** La voz de Eric Jorgenson es clara y persuasiva, combinando la sabiduría práctica de Naval Ravikant con un enfoque accesible y motivador para el lector.

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
- Razón: The generated content closely reflects the core concepts presented in the ground truth, such as the idea that wealth is a learned skill, the importance of self-knowledge, and the pursuit of one's true passion as a pathway to financial freedom. Phrases like 'la riqueza no es un golpe de suerte' and 'la búsqueda de tu verdadera obsesión personal' directly align with Naval Ravikant's teachings as per

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects the core concepts of the book, such as the idea that wealth is a learned skill, the importance of pursuing one's true obsession, and the notion that authenticity leads to both wealth and happiness. Phrases like 'Wealth is a skill that anyone can learn through practice' and 'Identify your obsession and let it fuel your journey' are explicitly aligned with the

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en habilidades personales sin referencias externas.
- EN: pagina — Voz directa y tono coherente con el contenido del libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.94 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.88 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.94**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9738
- Tiempo total: 52.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 27592ms
- anchors: 2435 tokens, 6456ms
- palette: 0 tokens, 0ms
- content_es: 2588 tokens, 6000ms
- judge_es: 940 tokens, 3565ms
- content_en: 2035 tokens, 5427ms
- judge_en: 911 tokens, 2104ms
- voice: 829 tokens, 1557ms
