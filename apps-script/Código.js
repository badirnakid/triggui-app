function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = (e.parameter.action) ? e.parameter.action : "lead"; 
  var fecha = new Date();

  // === RUTA 1: LIKE (App) ===
  if (action == "like") {
    var sheetLikes = ss.getSheetByName("Likes");
    if (!sheetLikes) sheetLikes = ss.insertSheet("Likes");
    
    // Recoge parámetros antiguos o defaults
    var libro = e.parameter.book || "Desconocido";
    var autor = e.parameter.author || "Desconocido";
    var frases = e.parameter.phrases || ""; 
    var racha = e.parameter.streak || "0";
    var totalLibros = e.parameter.total_books || "0";
    var dispositivo = e.parameter.platform || "Web";
    var conceptos = e.parameter.concepts || "0"; 
    var origen = e.parameter.source || "Desconocido"; 
    var tipoUsuario = (parseInt(totalLibros) > 1) ? "Recurrente" : "Nuevo";

    sheetLikes.appendRow([fecha, libro, autor, frases, racha, totalLibros, dispositivo, conceptos, tipoUsuario, origen]);
    
  } else {
    // === RUTA 2: LEAD (Landing Page) ===
    var sheetLeads = ss.getSheetByName("Triggui Emails Prueba");
    
    // Si no existe, la crea con los encabezados correctos separados
    if (!sheetLeads) {
      sheetLeads = ss.insertSheet("Triggui Emails Prueba");
      sheetLeads.appendRow(["Nombre", "Apellido", "Email", "Phone", "Source", "Fecha", "Campaña UTM Source", "Medio UTM", "UTM Campaign"]);
    }
    
    // Captura de datos SEPARADOS
    var nombre = e.parameter.first_name || "";  // <--- Recibe Nombre
    var apellido = e.parameter.last_name || ""; // <--- Recibe Apellido
    var email = e.parameter.email || "";
    var phone = e.parameter.phone || "";
    var source = e.parameter.source || "desconocido";
    
    // UTMs
    var utmSource = e.parameter.utm_source || "";
    var utmMedium = e.parameter.utm_medium || "";
    var utmCampaign = e.parameter.utm_campaign || "";
    
    // AÑADIR FILA (Orden: Nombre, Apellido, Email, Tel...)
    sheetLeads.appendRow([
      nombre,            // Columna A
      apellido,          // Columna B
      email,             // Columna C
      "'" + phone,       // Columna D
      source,            // Columna E
      fecha,             // Columna F
      utmSource,         // Columna G
      utmMedium,         // Columna H
      utmCampaign        // Columna I
    ]);
  }

  return ContentService.createTextOutput(JSON.stringify({result: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}