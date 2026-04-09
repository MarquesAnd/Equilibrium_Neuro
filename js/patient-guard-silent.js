/* patient-guard-silent.js
   Versão silenciosa para páginas de APLICAÇÃO de testes.
   Não exibe modal de seleção de paciente nem badge.
   O paciente é identificado automaticamente via link único.
*/
window.PatientGuard = {
  getPaciente: function() { return null; },
  selecionarPaciente: function() {},
  trocarPaciente: function() {},
  filtrarPacientes: function() {},
  voltar: function() { history.back(); },
  moverBadge: function() {},
};
