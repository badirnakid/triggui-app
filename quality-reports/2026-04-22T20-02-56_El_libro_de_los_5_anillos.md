# Quality Report — El libro de los 5 anillos

**Autor:** Miyamoto Musashi
**Ejecutado:** 2026-04-22T20-02-56
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
- estrategia en el combate
- filosofía samurái
- la importancia de la mente en la guerra
- el camino del guerrero
- la conexión entre técnica y espiritualidad

**Key terms:** Kenjutsu, Terao Magonojo, ermitaño, Cueva de Reigendo, maestría

**Voz autorial:** La voz de Musashi es reflexiva y profunda, fusionando la práctica del combate con la filosofía de vida, ofreciendo enseñanzas que trascienden el ámbito militar.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: muted
- lightness_paper: medium_dark
- temperature_shift: 0
- palette_strategy: monochromatic
- typography: serif_clasico
- Resultado: paper=#44494B, accent=#6EAECF, ink=#EEF0F1, contraste=7.99:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 0.70
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The content reflects themes from 'El Libro de los Cinco Anillos' such as the connection between technique and spirituality in combat, which aligns with Musashi's philosophy. However, while it captures the essence of Musashi's teachings, it lacks direct references to specific concepts or terminology from the book, making it somewhat generic in its presentation.

### EN
- Score: 0.30
- Usa conceptos específicos: false
- Razón: The generated content discusses themes of combat strategy, mind, and spirit, which are relevant to the philosophy of Kenjutsu. However, it lacks specific references to Musashi's teachings or terminology from 'El Libro de los Cinco Anillos.' The concepts presented are generic and could apply to any book on self-improvement or martial arts philosophy.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre el camino del guerrero.
- EN: pagina — Voz directa y reflexiones sobre la filosofía del guerrero.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.91 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 0.5 ← promedio de los 2 judges
- **Combined:** **0.79**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 9
- Tokens totales: 11917
- Tiempo total: 70.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40673ms
- anchors: 2217 tokens, 5437ms
- palette: 0 tokens, 0ms
- content_es: 2405 tokens, 6117ms
- judge_es: 769 tokens, 2483ms
- content_es_retry: 2413 tokens, 5765ms
- judge_es_retry: 764 tokens, 0ms
- content_en: 1828 tokens, 4742ms
- judge_en: 705 tokens, 1985ms
- voice: 816 tokens, 1377ms
