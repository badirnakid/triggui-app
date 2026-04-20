# Quality Report — El libro de los 5 anillos

**Autor:** Miyamoto Musashi
**Ejecutado:** 2026-04-20T22-04-21
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.91
- **Resolution path:** evidence_fetched_3sources
- **Match score:** 0.91



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

El Libro de los Cinco Anillos (en japonés Go-rin no sho) es un tratado sobre el Kenjutsu escrito por Miyamoto Musashi en su vejez, durante su retiro de ermitaño en la Cueva de Reigendo en 1643, y finalizado el 19 de mayo de 1645, pocas semanas antes de su muerte. El libro está dedicado a su pupilo Terao Magonojo.

METADATA VERIFICADA:
- Título: El Libro de los Cinco Anillos
- Autor: Miyamoto Musashi
- Año: 1980
- Categorías: Ficción y literatura, Libros
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- estrategia del combate
- la dualidad de la mente y el cuerpo
- la importancia de la observación en la batalla
- el camino del guerrero samurái
- la filosofía del vacío

**Key terms:** Kenjutsu, estrategia, samurái, vacío, observación

**Voz autorial:** La voz de Musashi es reflexiva, directa y profunda, con un enfoque en la práctica y la filosofía del combate.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: muted
- lightness_paper: medium_dark
- temperature_shift: 0
- palette_strategy: monochromatic
- typography: serif_literario
- Resultado: paper=#44494B, accent=#6EAECF, ink=#EEF0F1, contraste=7.99:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 0.70
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The content reflects specific concepts from 'El Libro de los Cinco Anillos,' such as the integration of mind and body in Kenjutsu and the importance of observation in combat. However, while it is anchored in the themes of the book, the language is somewhat generic and could apply to broader martial arts or self-improvement contexts, which prevents it from receiving a perfect score.

### EN
- Score: 0.30
- Usa conceptos específicos: false
- Razón: The generated content discusses concepts like the unity of mind and body and the importance of observation in combat, which are related to the themes of martial arts and strategy in 'El Libro de los Cinco Anillos.' However, it does not directly reference specific terms or concepts from Musashi's work, such as 'Kenjutsu' or 'the void' in a way that ties back to the book's teachings. The language is

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre el camino del guerrero.
- EN: pagina — Voz directa y reflexiones sobre la experiencia del guerrero.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.91 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.5 ← promedio de los 2 judges
- **Combined:** **0.79**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 9
- Tokens totales: 12103
- Tiempo total: 75.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 42849ms
- anchors: 2193 tokens, 4463ms
- palette: 0 tokens, 0ms
- content_es: 2430 tokens, 8611ms
- judge_es: 792 tokens, 2681ms
- content_es_retry: 2412 tokens, 6183ms
- judge_es_retry: 783 tokens, 0ms
- content_en: 1871 tokens, 5688ms
- judge_en: 762 tokens, 2945ms
- voice: 860 tokens, 794ms
