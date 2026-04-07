/* ═══════════════════════════════════════════════════════════
   INTEGRATION — Integração Pacientes ↔ Correção ↔ Aplicação

   Responsabilidades:
   1. Auto-preencher dados do paciente vindo do sessionStorage
   2. Auto-preencher dados do profissional do Firebase Config
   3. Salvar resultados no Firebase (subcoleção testes do paciente)
   4. Filtrar pacientes por profissional logado
   ═══════════════════════════════════════════════════════════ */

(function() {
  "use strict";

  /* ── Ler paciente selecionado do sessionStorage ── */
  function getPacienteAtual() {
    try {
      const raw = sessionStorage.getItem("pacienteAtual");
      if (!raw) return null;
      // Pode ser um ID string ou um objeto JSON
      try {
        const obj = JSON.parse(raw);
        return typeof obj === "object" ? obj : null;
      } catch(e) {
        return null; // É um ID string, não um objeto
      }
    } catch(e) { return null; }
  }

  function getTesteAtual() {
    return sessionStorage.getItem("testeAtual") || null;
  }

  function getTesteNome() {
    return sessionStorage.getItem("testeNome") || null;
  }

  /* ── Auto-preencher dados do paciente nos formulários ── */
  function autoPreencherPaciente() {
    const paciente = getPacienteAtual();
    if (!paciente) return;

    const mappings = {
      "nome": paciente.nome,
      "cpf": paciente.cpf,
      "dataNascimento": paciente.dataNascimento,
      "sexo": paciente.sexo,
      "escolaridade": paciente.escolaridade,
      "email": paciente.email,
      "telefone": paciente.telefone,
    };

    for (const [fieldId, value] of Object.entries(mappings)) {
      if (!value) continue;
      const el = document.getElementById(fieldId);
      if (!el) continue;

      if (el.tagName === "SELECT") {
        // Tentar encontrar option que match
        const opts = Array.from(el.options);
        const match = opts.find(o => o.value.toLowerCase() === value.toLowerCase() || o.text.toLowerCase() === value.toLowerCase());
        if (match) el.value = match.value;
      } else {
        el.value = value;
      }
    }

    // Indicador visual de que paciente foi carregado
    const nomeField = document.getElementById("nome");
    if (nomeField && paciente.nome) {
      const indicator = document.createElement("div");
      indicator.className = "integration-badge";
      indicator.innerHTML = `<span>👤 Paciente carregado: <strong>${paciente.nome}</strong></span>`;
      indicator.style.cssText = `
        background: #dbeafe; color: #1a56db; padding: 8px 14px; border-radius: 10px;
        font-size: 12px; font-weight: 600; margin-bottom: 12px; display: inline-flex;
        align-items: center; gap: 6px; animation: fadeIn 0.3s ease;
      `;
      nomeField.closest(".form-group, .field, div")?.insertAdjacentElement("beforebegin", indicator);
    }
  }

  /* ── Auto-preencher dados do profissional ── */
  async function autoPreencherProfissional() {
    // Tentar carregar do Firebase se disponível
    if (window.DB && typeof DB.loadConfig === "function") {
      try {
        const config = await DB.loadConfig();
        if (config) {
          const mappings = {
            "profNome": config.nome,
            "profCRP": config.crp,
            "profEspecialidade": config.especialidade,
            "profContato": config.contato,
          };
          for (const [fieldId, value] of Object.entries(mappings)) {
            if (!value) continue;
            const el = document.getElementById(fieldId);
            if (el && !el.value) el.value = value;
          }
        }
      } catch(e) {
        console.warn("Não foi possível carregar config do profissional:", e);
      }
    }
  }

  /* ── Salvar resultado no Firebase (subcoleção do paciente) ── */
  async function salvarTesteNoFirebase(tipoTeste, dadosResultado) {
    const paciente = getPacienteAtual();
    if (!paciente || !paciente.id) {
      console.info("Sem paciente selecionado — resultado salvo apenas localmente.");
      return { ok: false, reason: "no-patient" };
    }

    if (!window.DB || !DB.isReady()) {
      console.warn("Firebase não disponível — resultado salvo apenas localmente.");
      return { ok: false, reason: "no-firebase" };
    }

    try {
      const testeId = sessionStorage.getItem("testeId") || null;
      const data = {
        tipo: tipoTeste,
        status: "corrigido",
        dataCorrecao: new Date().toISOString(),
        dataAplicacao: dadosResultado.dataAplicacao || null,
        resultados: {
          resumo: dadosResultado.resumo || "",
          scores: dadosResultado.scores || {},
          classificacao: dadosResultado.classificacao || "",
        },
        observacoes: dadosResultado.observacoes || "",
      };

      const result = await DB.salvarTestePaciente(paciente.id, data, testeId);

      if (result.ok) {
        console.log("✅ Teste salvo no Firebase:", result.id);
        mostrarNotificacaoIntegracao("Resultado salvo na ficha do paciente!", "success");
      }

      return result;
    } catch(e) {
      console.error("Erro ao salvar teste no Firebase:", e);
      return { ok: false, reason: "error", message: e.message };
    }
  }

  /* ── Notificação ── */
  function mostrarNotificacaoIntegracao(texto, tipo) {
    const el = document.createElement("div");
    el.textContent = texto;
    el.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; padding: 12px 20px;
      background: ${tipo === "success" ? "#059669" : "#dc2626"}; color: white;
      border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.15);
      z-index: 10000; font-weight: 600; font-size: 13px; font-family: 'DM Sans', sans-serif;
      animation: slideUpIn 0.3s ease;
    `;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.animation = "slideUpOut 0.3s ease";
      setTimeout(() => el.remove(), 300);
    }, 4000);
  }

  /* ── Animações ── */
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideUpIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes slideUpOut { from { transform: translateY(0); opacity: 1; } to { transform: translateY(20px); opacity: 0; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `;
  document.head.appendChild(style);

  /* ── Inicialização automática ── */
  function init() {
    autoPreencherPaciente();
    autoPreencherProfissional();
  }

  // Executar quando DOM estiver pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* ── Expor globalmente ── */
  window.Integration = {
    getPacienteAtual,
    getTesteAtual,
    getTesteNome,
    autoPreencherPaciente,
    autoPreencherProfissional,
    salvarTesteNoFirebase,
  };

})();
