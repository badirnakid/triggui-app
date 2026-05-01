# Quality Report — El libro de los 5 anillos

**Autor:** Miyamoto Musashi
**Ejecutado:** 2026-05-01T18-35-40
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.91
- **Resolution path:** evidence_fetched_2sources
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

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- estrategia del combate
- filosofía samurái
- disciplina del kenjutsu
- maestría en la guerra
- reflexiones sobre la vida y la muerte

**Key terms:** kenjutsu, samurái, estrategia, disciplina, maestría

**Voz autorial:** La voz de Musashi es profunda y reflexiva, combinando la sabiduría de un guerrero con la introspección de un filósofo.

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
- Score: 0.80
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: El contenido refleja conceptos del kenjutsu y la filosofía samurái, que son centrales en 'El Libro de los Cinco Anillos'. Sin embargo, algunas frases son más generales y podrían aplicarse a otros contextos de estrategia y filosofía, lo que impide un anclaje total al texto específico.

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects themes of Kenjutsu and samurai philosophy, which are central to Musashi's work. However, it lacks direct references to specific concepts or terminology from 'El Libro de los Cinco Anillos', making it somewhat generic.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre el kenjutsu sin referencias externas.
- EN: pagina — Voz directa y reflexiones sobre la práctica del kenjutsu.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.91 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.89 ← anti-genericidad de anchors
- **grounding_judge:** 0.75 ← promedio de los 2 judges
- **Combined:** **0.86**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 8625
- Tiempo total: 37.2s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 17596ms
- anchors: 2207 tokens, 4606ms
- palette: 0 tokens, 1ms
- content_es: 2373 tokens, 5662ms
- judge_es: 743 tokens, 1641ms
- content_en: 1791 tokens, 4526ms
- judge_en: 708 tokens, 1592ms
- voice: 803 tokens, 1302ms
- highlight_judge_es_parrafoTop: 639 tokens, 0ms
- highlight_judge_es_parrafoBot: 656 tokens, 0ms
- highlight_judge_en_parrafoTop: 645 tokens, 0ms
- highlight_judge_en_parrafoBot: 639 tokens, 0ms
