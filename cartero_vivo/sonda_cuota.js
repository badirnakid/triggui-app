function sondaCuota() {
  Logger.log("Cuenta que ejecuta: " + Session.getEffectiveUser().getEmail());
  Logger.log("Correos restantes hoy: " + MailApp.getRemainingDailyQuota());
}