/* 🛒 Triggui · tiendas.js · v1 (14 de noviembre de 2026, B417)
 *
 * A qué tienda manda cada botón. Es la única regla, y la usan la app, las ediciones y la liga del correo (/ir/).
 *
 *   En México (la zona horaria del teléfono es de México):
 *     · «Comprar» → Casa del Libro si tiene el libro físico con existencias; si no, Gandhi; si ninguna, la búsqueda
 *       de Gandhi por título. Lo dice el campo «tienda_compra» de cada libro, que el horno revisa.
 *     · 🔮 → busca la palabra del momento en Casa del Libro.
 *     · «Explorar» → busca la palabra en Gandhi.
 *   Fuera de México:
 *     · «Comprar» → Amazon del país del lector (amazon.com donde no hay uno propio), en la sección de libros.
 *       La edición sale del idioma de la página: en inglés, el título en inglés; en español, el título en español.
 *     · 🔮 → busca la palabra en ese mismo Amazon.
 *     · «Explorar en Gandhi» no se muestra.
 *
 * Solo arma ligas a casadelibro.com.mx, www.gandhi.com.mx y Amazon: una liga de los datos que apunte a otro
 * lado no se usa (así /ir/ nunca redirige a un sitio ajeno).
 */
(function (w) {
  'use strict';

  var ZONAS_MEXICO = {
    'America/Mexico_City': 1, 'America/Cancun': 1, 'America/Merida': 1, 'America/Monterrey': 1, 'America/Matamoros': 1,
    'America/Chihuahua': 1, 'America/Ciudad_Juarez': 1, 'America/Ojinaga': 1, 'America/Mazatlan': 1,
    'America/Bahia_Banderas': 1, 'America/Hermosillo': 1, 'America/Tijuana': 1, 'America/Ensenada': 1,
    'America/Santa_Isabel': 1, 'Mexico/General': 1, 'Mexico/BajaNorte': 1, 'Mexico/BajaSur': 1
  };

  // Identificadores de Afiliados de Amazon por dominio (van visibles en la liga; no son secretos).
  // Vacío mientras Badir no los dé: las ligas salen sin comisión.
  var ETIQUETAS_AMAZON = {};

  function zonaHoraria() {
    try { return (Intl.DateTimeFormat().resolvedOptions().timeZone || '') + ''; } catch (e) { return ''; }
  }

  function enMexico() {
    var z = zonaHoraria();
    if (z) return ZONAS_MEXICO.hasOwnProperty(z);
    // Sin zona horaria (navegadores muy viejos): el idioma del teléfono.
    var l = '';
    try { l = (navigator.languages && navigator.languages.join(',')) || navigator.language || ''; } catch (e) {}
    return /(^|,)\s*[a-z]{2}-MX\b/i.test(l);
  }

  function amazonDominio(z) {
    z = z == null ? zonaHoraria() : z;
    if (/^(Europe\/Madrid|Atlantic\/Canary|Africa\/Ceuta)$/.test(z)) return 'amazon.es';
    if (/^Europe\/(London|Dublin|Belfast|Guernsey|Isle_of_Man|Jersey)$/.test(z)) return 'amazon.co.uk';
    if (/^Europe\/(Berlin|Vienna|Zurich|Busingen|Vaduz)$/.test(z)) return 'amazon.de';
    if (/^Europe\/(Paris|Monaco|Luxembourg)$/.test(z)) return 'amazon.fr';
    if (/^Europe\/Brussels$/.test(z)) return 'amazon.com.be';
    if (/^Europe\/(Rome|Vatican|San_Marino)$/.test(z)) return 'amazon.it';
    if (/^Europe\/Amsterdam$/.test(z)) return 'amazon.nl';
    if (/^Europe\/Stockholm$/.test(z)) return 'amazon.se';
    if (/^Europe\/Warsaw$/.test(z)) return 'amazon.pl';
    if (/^(Europe|Asia)\/Istanbul$/.test(z)) return 'amazon.com.tr';
    if (/^Brazil\//.test(z) || /^America\/(Sao_Paulo|Bahia|Fortaleza|Recife|Belem|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Araguaina|Maceio|Santarem|Noronha|Eirunepe)$/.test(z)) return 'amazon.com.br';
    if (/^Canada\//.test(z) || /^America\/(Toronto|Montreal|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Moncton|Glace_Bay|Goose_Bay|Whitehorse|Dawson|Dawson_Creek|Fort_Nelson|Cambridge_Bay|Iqaluit|Rankin_Inlet|Resolute|Swift_Current|Atikokan|Creston|Inuvik|Yellowknife|Nipigon|Thunder_Bay|Rainy_River|Pangnirtung|Blanc-Sablon)$/.test(z)) return 'amazon.ca';
    if (/^Australia\//.test(z)) return 'amazon.com.au';
    if (/^(Asia\/Tokyo|Japan)$/.test(z)) return 'amazon.co.jp';
    if (/^Asia\/(Kolkata|Calcutta)$/.test(z)) return 'amazon.in';
    if (/^(Asia\/Singapore|Singapore)$/.test(z)) return 'amazon.sg';
    if (/^Asia\/Dubai$/.test(z)) return 'amazon.ae';
    if (/^Asia\/Riyadh$/.test(z)) return 'amazon.sa';
    return 'amazon.com';
  }

  // Un carácter partido (medio par sustituto) haría fallar encodeURIComponent: se cambia por «�», como hace Python.
  function bienFormado(s) {
    if (!/[\uD800-\uDFFF]/.test(s)) return s;
    var r = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c >= 0xD800 && c <= 0xDBFF) {
        var d = s.charCodeAt(i + 1);
        if (d >= 0xDC00 && d <= 0xDFFF) { r += s.charAt(i) + s.charAt(i + 1); i++; } else { r += '\uFFFD'; }
      } else if (c >= 0xDC00 && c <= 0xDFFF) {
        r += '\uFFFD';
      } else {
        r += s.charAt(i);
      }
    }
    return r;
  }
  function enc(s) { return encodeURIComponent(bienFormado(String(s == null ? '' : s)).replace(/\s+/g, ' ').trim()); }

  // El título sin subtítulo. Es la misma regla, carácter por carácter, que tituloCorto() del horno
  // (experiments/nucleus/tiendas.mjs) y que tienda_titulo_corto() de las ediciones (scripts/build-editions.py).
  function esLetra(c) {
    return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || (c >= '\u00C0' && c <= '\u00FF');
  }

  function tituloCorto(t) {
    var s = String(t == null ? '' : t);
    // El separador sin «\s*» delante y luego hacia atrás sobre los espacios: el mismo corte, en tiempo lineal.
    var corte = s.search(/:|\s[-–—]\s|\(|\[|\|/);
    while (corte > 0 && /\s/.test(s.charAt(corte - 1))) corte--;
    // Una palabra de 4 letras o más seguida de «. », si está antes del separador.
    for (var i = s.indexOf('.'); i !== -1; i = s.indexOf('.', i + 1)) {
      if (!/\s/.test(s.charAt(i + 1))) continue;
      var j = i;
      while (j > 0 && esLetra(s.charAt(j - 1))) j--;
      if (i - j >= 4 && (corte < 0 || i < corte)) { corte = i; break; }
    }
    return (corte > 0 ? s.slice(0, corte) : s).trim();
  }

  function amazon(q) {
    var dom = amazonDominio();
    var tag = ETIQUETAS_AMAZON[dom];
    return 'https://www.' + dom + '/s?k=' + enc(q) + '&i=stripbooks' + (tag ? '&tag=' + encodeURIComponent(tag) : '');
  }

  function casaDelLibro(q) { return 'https://casadelibro.com.mx/search/?q=' + enc(q); }
  function gandhi(q) { return 'https://www.gandhi.com.mx/?query=' + enc(q); }

  var DOMINIO_DE = { casadelibro: /^https:\/\/casadelibro\.com\.mx\//, gandhi: /^https:\/\/www\.gandhi\.com\.mx\// };

  // { url, tienda } del botón «Comprar». idioma: 'es' o 'en' (el de la página).
  function comprar(libro, idioma, mexico) {
    libro = libro || {};
    if (mexico == null) mexico = enMexico();
    if (mexico) {
      var tc = libro.tienda_compra;
      if (tc && Object.prototype.hasOwnProperty.call(DOMINIO_DE, tc.tienda) && DOMINIO_DE[tc.tienda].test(String(tc.url || ''))) {
        return { url: String(tc.url), tienda: tc.tienda };
      }
      return { url: gandhi(tituloCorto(libro.titulo)), tienda: 'gandhi' };
    }
    var titulo = (idioma === 'en' && libro.titulo_en) ? libro.titulo_en : libro.titulo;
    return { url: amazon(tituloCorto(titulo) + ' ' + (libro.autor || '')), tienda: 'amazon' };
  }

  // { url, tienda } del 🔮: la palabra del momento.
  function explorar(palabra, mexico) {
    if (mexico == null) mexico = enMexico();
    return mexico ? { url: casaDelLibro(palabra), tienda: 'casadelibro' } : { url: amazon(palabra), tienda: 'amazon' };
  }

  // { url, tienda } de «Explorar en Gandhi», o null fuera de México (el botón no se muestra).
  function explorarGandhi(palabra, mexico) {
    if (mexico == null) mexico = enMexico();
    return mexico ? { url: gandhi(palabra), tienda: 'gandhi' } : null;
  }

  w.TrigguiTiendas = {
    version: 1,
    enMexico: enMexico,
    zonaHoraria: zonaHoraria,
    amazonDominio: amazonDominio,
    tituloCorto: tituloCorto,
    comprar: comprar,
    explorar: explorar,
    explorarGandhi: explorarGandhi,
    logo: { casadelibro: '/tiendas/casadellibro-blanco.png', gandhi: '/tiendas/gandhi-blanco.png' }
  };

  // La app y las ediciones cargan este archivo sin detener la página («async»). Al llegar, avisa: las ediciones
  // rehacen entonces sus ligas con la regla completa (la app lo lee al abrir cada tarjeta).
  try { w.dispatchEvent(new Event('trigguitiendas')); } catch (e) {}
})(window);
