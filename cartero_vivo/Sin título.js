function diagnosticarCorreoD4() {
  const MI = "badir@triggui.com";
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sh.getDataRange().getValues();
  let fila = -1, nombre = "Badir";
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][2] || "").toLowerCase().indexOf(MI.toLowerCase()) >= 0) { fila = i + 1; nombre = String(data[i][0] || nombre); break; }
  }
  Logger.log("hoja: " + SHEET_NAME + " · mi fila: " + fila);
  Logger.log("columna IDIOMA: " + colIdioma(sh) + " · valor en mi fila: '" + leerIdiomaFila(sh, fila) + "'");
  EMAIL_ENVIO_ACTUAL = MI;
  IDIOMA_ENVIO_ACTUAL = leerIdiomaFila(sh, fila);
  const prep = prepararEmailParaEnvio(nombre, MI, fila);
  if (!prep || !prep.ok) { Logger.log("NO ARMO: " + (prep && prep.reason)); return; }
  const h = prep.finalHTML || "";
  Logger.log("HTML: " + h.length + " chars · subject: " + prep.subject);
  Logger.log("BARRA IDIOMA: " + (h.indexOf("Prefer English") >= 0 || h.indexOf("Prefieres espa") >= 0));
  Logger.log("BOTONES: buscalibre=" + (h.toLowerCase().indexOf("buscalibre") >= 0) + " amazon=" + (h.toLowerCase().indexOf("amazon") >= 0) + " penguin=" + (h.toLowerCase().indexOf("penguin") >= 0));
  Logger.log("BANNER KIDS: " + (h.indexOf("Kids") >= 0) + " · PLACEHOLDERS SIN REEMPLAZAR: " + (h.indexOf("{{") >= 0));
  DriveApp.createFile("triggui_diag_" + Date.now() + ".html", h, MimeType.HTML);
  Logger.log("HTML completo guardado en tu Drive — ábrelo y lo ves tal cual");
}