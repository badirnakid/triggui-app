/**
 * 🎬 TRIGGER DEL LUNES — el cartero automatico del sagrado
 * instalarTriggerLunes(): crea el disparador semanal (lunes ~7:30am
 * hora del proyecto = CDMX) que ejecuta enviarTrigguiLunes.
 * Idempotente: si ya existe, no duplica. desinstalarTriggerLunes()
 * lo quita. listarTriggers() para auditar.
 */
var FUNCION_LUNES = 'enviarTrigguiLunes';

function instalarTriggerLunes() {
  if (typeof this[FUNCION_LUNES] !== 'function') {
    var candidatas = Object.keys(this).filter(function(k){
      return typeof this[k] === 'function' && /^enviar/i.test(k);
    }, this);
    throw new Error('No existe ' + FUNCION_LUNES + '. Funciones enviar* disponibles: ' + candidatas.join(', '));
  }
  var ya = ScriptApp.getProjectTriggers().filter(function(t){
    return t.getHandlerFunction() === FUNCION_LUNES;
  });
  if (ya.length > 0) {
    Logger.log('🟡 Ya existe trigger para ' + FUNCION_LUNES + ' (' + ya.length + ') — sin duplicar');
    return;
  }
  ScriptApp.newTrigger(FUNCION_LUNES)
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(7)
    .nearMinute(30)
    .everyWeeks(1)
    .create();
  Logger.log('✅ Trigger instalado: ' + FUNCION_LUNES + ' — lunes ~7:30am (hora del proyecto)');
  Logger.log('   Zona del proyecto: ' + Session.getScriptTimeZone());
}

function desinstalarTriggerLunes() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function(t){
    if (t.getHandlerFunction() === FUNCION_LUNES) { ScriptApp.deleteTrigger(t); n++; }
  });
  Logger.log('🗑️ Triggers eliminados: ' + n);
}

function listarTriggers() {
  var ts = ScriptApp.getProjectTriggers();
  Logger.log('Triggers del proyecto: ' + ts.length);
  ts.forEach(function(t){
    Logger.log(' · ' + t.getHandlerFunction() + ' [' + t.getEventType() + ']');
  });
}
