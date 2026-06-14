import { detectTruncation } from "./detect-truncation.js";

let pass = 0, fail = 0;
function check(name, got, wantTruncado, wantReasonIncludes = null) {
  const okT = got.truncado === wantTruncado;
  const okR = wantReasonIncludes === null ? true : got.reason.includes(wantReasonIncludes);
  if (okT && okR) {
    pass++;
    console.log(`  ✅ ${name} → truncado=${got.truncado} reason="${got.reason}"`);
  } else {
    fail++;
    console.log(`  ❌ ${name} → GOT truncado=${got.truncado} reason="${got.reason}" | WANT truncado=${wantTruncado}${wantReasonIncludes ? ` reason~"${wantReasonIncludes}"` : ""}`);
  }
}

console.log("=== A) Reglas idénticas a v4.3 — casos reales de los dos runs ===");
// Run 1: "your being." — falso positivo, AHORA se marca pero NO bloquea
check('Run1 "...aspect of your being."',
  detectTruncation("There is a quiet dignity in every aspect of your being.", "EN tarjeta.parrafoTop"),
  true, 'dangling-stopword "being"');
// Run 2 original: "to be." — falso positivo (be en stopwords)
check('Run2 orig "...what one desires to be."',
  detectTruncation("True freedom is knowing what one desires to be.", "EN tarjeta.parrafoTop"),
  true, 'dangling-stopword "be"');
// Run 2 lo que C4.5 metió: "...siglo XX." — el riel debe rechazar esto
check('Run2 bad-fix "...en el siglo XX."',
  detectTruncation("Habla del poder y la política en el siglo XX.", "EN tarjeta.parrafoTop"),
  true, 'suspect-short "xx"');

console.log("\n=== B) Truncamiento GENUINO sí se sigue detectando ===");
check('genuino "...la incertid."',
  detectTruncation("El miedo nace de abrazar la incertid.", "frases[0]"),
  true, 'known-trunc-prefix "incertid"');
check('genuino sin cierre (no-título)',
  detectTruncation("Esta es una frase que se quedó sin cierre", "frases[1]"),
  true, "no-closure");

console.log("\n=== C) Frases COMPLETAS no se marcan ===");
check('limpia "...la disciplina diaria."',
  detectTruncation("El secreto del éxito está en la disciplina diaria.", "ES tarjeta.parrafoBot"),
  false);
check('título sin punto (exento de no-closure)',
  detectTruncation("Conquista interna: el primer paso hacia el éxito", "ES tarjeta.titulo"),
  false);
check('título cierre corto válido "...You"',
  detectTruncation("The Power Is Within You", "EN tarjeta.titulo"),
  false);
check('frase corta (<=3 palabras) CON cierre no se toca',
  detectTruncation("Sé valiente hoy.", "frases[2]"),
  false);
check('frase corta SIN cierre SÍ es no-closure (contrato v4.3 correcto)',
  detectTruncation("Sé valiente hoy", "frases[2]"),
  true, "no-closure");
check('cierre corto whitelisted "...to be." es stopword PERO probamos uno limpio: "...amor."',
  detectTruncation("Al final, todo lo que queda es el amor.", "frases[3]"),
  false);

console.log("\n=== D) RIEL de C4.5 (reusa el MISMO detector) ===");
// El riel acepta el fix solo si detectTruncation(fix).truncado === false
const badFix = "Habla del poder y la política en el siglo XX.";
const goodFix = "El miedo nace de abrazar la incertidumbre.";
check('riel RECHAZA fix que re-dispara (siglo XX)',
  detectTruncation(badFix, "EN tarjeta.parrafoTop"),
  true, 'suspect-short "xx"');   // truncado=true → el riel lo rechaza, conserva original
check('riel ACEPTA fix bueno (incertidumbre)',
  detectTruncation(goodFix, "frases[0]"),
  false);                         // truncado=false → el riel lo aplica

console.log("\n=== E) Robustez de entrada ===");
check('no-string', detectTruncation(null, "x"), false);
check('vacío', detectTruncation("   ", "x"), false);

console.log(`\n──────────────────────────────────────`);
console.log(`RESULTADO: ${pass} pass, ${fail} fail`);
if (fail > 0) { process.exitCode = 1; }
