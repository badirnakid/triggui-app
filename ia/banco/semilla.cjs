'use strict';
/*
 * Banco de C278: el mismo azar y el mismo reloj para los dos proveedores (2 de noviembre de 2026).
 *
 * Se carga con NODE_OPTIONS="--require ia/banco/semilla.cjs" solo en el banco, nunca en producción.
 * Con BANCO_SEMILLA, Math.random y crypto.randomInt salen de una semilla fija; con BANCO_RELOJ (ISO), el reloj
 * arranca a esa hora y avanza normal. Así, para un mismo libro, OpenAI y Claude reciben los mismos lentes, la misma
 * franja de cronobiología y las mismas elecciones al azar: lo que cambie en el resultado es del modelo.
 */
const semilla = Number(process.env.BANCO_SEMILLA);
if (Number.isFinite(semilla)) {
  let s = semilla >>> 0;
  Math.random = function () { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; };
  const crypto = require('crypto');
  crypto.randomInt = function (a, b, cb) {
    if (typeof b !== 'number') { cb = b; b = a; a = 0; }
    const n = a + Math.floor(Math.random() * (b - a));
    if (typeof cb === 'function') { process.nextTick(cb, null, n); return undefined; }
    return n;
  };
  require('module').syncBuiltinESMExports();
}
const reloj = Date.parse(process.env.BANCO_RELOJ || '');
if (Number.isFinite(reloj)) {
  const DateReal = Date;
  const inicio = DateReal.now();
  const ahora = () => reloj + (DateReal.now() - inicio);
  globalThis.Date = new Proxy(DateReal, {
    construct(t, a) { return a.length ? new t(...a) : new t(ahora()); },
    apply() { return new DateReal(ahora()).toString(); },
    get(t, p) { return p === 'now' ? ahora : Reflect.get(t, p); }
  });
}
