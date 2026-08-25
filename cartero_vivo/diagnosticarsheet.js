function diagnosticarSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Triggui Emails Prueba");
  if (!sheet) { Logger.log("❌ Sheet no encontrada"); return; }
  
  // Obtener cabeceras (fila 1)
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  // Obtener primera fila de datos para muestra
  const firstRow = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
  
  Logger.log("═══ Cabeceras de tu sheet ═══");
  Logger.log("Total columnas: " + lastCol);
  Logger.log("Total filas con datos: " + sheet.getLastRow());
  Logger.log("");
  
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < headers.length; i++) {
    const letra = i < 26 ? letras[i] : "?";
    const cabecera = String(headers[i] || "(vacía)").slice(0, 40);
    const muestra = String(firstRow[i] || "(vacío)").slice(0, 50);
    Logger.log(`Col ${letra} (idx ${i}): "${cabecera}" → muestra: "${muestra}"`);
  }
}