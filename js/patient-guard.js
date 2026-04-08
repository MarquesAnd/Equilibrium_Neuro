/* ═══════════════════════════════════════════════════════════
   PATIENT GUARD — Exige seleção de paciente antes de testes

   Inclua este script em qualquer página de correção/aplicação.
   Se não houver paciente no sessionStorage, exibe modal
   obrigatório para selecionar um paciente antes de prosseguir.
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── Verificar se há paciente selecionado ── */
  function getPacienteFromSession() {
    try {
      const raw = sessionStorage.getItem("pacienteAtual");
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return typeof obj === "object" && obj.id ? obj : null;
    } catch (e) {
      return null;
    }
  }

  /* ── Badge flutuante mostrando paciente selecionado ── */
  function criarBadgePaciente(paciente) {
    if (document.getElementById("patient-guard-badge")) return;

    const badge = document.createElement("div");
    badge.id = "patient-guard-badge";
    badge.innerHTML = `
      <div class="pg-badge-inner">
        <div class="pg-avatar">${paciente.nome.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}</div>
        <div class="pg-info">
          <div class="pg-name">${paciente.nome}</div>
          <div class="pg-meta">${paciente.cpf || "Paciente selecionado"}</div>
        </div>
        <button class="pg-change-btn" onclick="PatientGuard.trocarPaciente()" title="Trocar paciente">Trocar</button>
        <button class="pg-move-btn" onclick="PatientGuard.moverBadge()" title="Mover badge">&#8597;</button>
      </div>
    `;
    document.body.appendChild(badge);
    restaurarPosicaoBadge();
  }

  /* ── Modal de seleção obrigatória de paciente ── */
  function criarModalSelecao() {
    if (document.getElementById("patient-guard-modal")) return;

    const overlay = document.createElement("div");
    overlay.id = "patient-guard-modal";
    overlay.innerHTML = `
      <div class="pg-modal-box">
        <div class="pg-modal-header">
          <div class="pg-modal-icon">👤</div>
          <h2 class="pg-modal-title">Selecione um Paciente</h2>
          <p class="pg-modal-subtitle">Escolha o paciente antes de prosseguir com o teste</p>
        </div>
        <div class="pg-search-wrap">
          <input type="text" id="pgSearchInput" class="pg-search" placeholder="Buscar paciente por nome ou CPF..." oninput="PatientGuard.filtrarPacientes(this.value)" />
        </div>
        <div id="pgPacientesList" class="pg-list">
          <div class="pg-loading">Carregando pacientes...</div>
        </div>
        <div class="pg-modal-footer">
          <button class="pg-btn-voltar" onclick="PatientGuard.voltar()">← Voltar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  /* ── Carregar e renderizar lista de pacientes ── */
  let todosPacientes = [];

  async function carregarPacientesModal() {
    const container = document.getElementById("pgPacientesList");
    if (!container) return;

    try {
      if (!window.DB || !DB.isReady || !DB.isReady()) {
        // Tentar inicializar
        if (window.FIREBASE_CONFIGURED && window.DB && DB.init) {
          await DB.init();
        }
      }

      let pacientes = [];
      if (window.DB && typeof DB.getPacientes === "function") {
        pacientes = await DB.getPacientes();

        // Pacientes são universais — todos os profissionais veem todos
      }

      todosPacientes = pacientes;
      renderizarPacientesModal(pacientes);
    } catch (e) {
      console.error("Erro ao carregar pacientes:", e);
      container.innerHTML = `
        <div class="pg-empty">
          <div class="pg-empty-icon">⚠️</div>
          <div>Erro ao carregar pacientes</div>
        </div>
      `;
    }
  }

  function renderizarPacientesModal(pacientes) {
    const container = document.getElementById("pgPacientesList");
    if (!container) return;

    if (pacientes.length === 0) {
      container.innerHTML = `
        <div class="pg-empty">
          <div class="pg-empty-icon">👤</div>
          <div>Nenhum paciente encontrado</div>
          <a href="/Pacientes/" class="pg-link">Cadastrar paciente</a>
        </div>
      `;
      return;
    }

    container.innerHTML = pacientes.map(p => {
      const iniciais = p.nome.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
      const idade = calcularIdadePG(p.dataNascimento);
      return `
        <div class="pg-patient-item" onclick="PatientGuard.selecionarPaciente('${p.id}')">
          <div class="pg-patient-avatar">${iniciais}</div>
          <div class="pg-patient-info">
            <div class="pg-patient-name">${p.nome}</div>
            <div class="pg-patient-meta">${p.cpf || "CPF não informado"} ${idade ? "• " + idade : ""}</div>
          </div>
          <div class="pg-patient-arrow">→</div>
        </div>
      `;
    }).join("");
  }

  function filtrarPacientes(termo) {
    const termoLower = termo.toLowerCase();
    const filtrados = todosPacientes.filter(p =>
      p.nome.toLowerCase().includes(termoLower) ||
      (p.cpf && p.cpf.includes(termo))
    );
    renderizarPacientesModal(filtrados);
  }

  function selecionarPaciente(id) {
    const paciente = todosPacientes.find(p => p.id === id);
    if (!paciente) return;

    sessionStorage.setItem("pacienteAtual", JSON.stringify(paciente));

    // Fechar modal
    const modal = document.getElementById("patient-guard-modal");
    if (modal) modal.remove();

    // Criar badge
    criarBadgePaciente(paciente);

    // Disparar evento para integração
    window.dispatchEvent(new CustomEvent("pacienteSelecionado", { detail: paciente }));

    // Auto-preencher se integration.js estiver disponível
    if (window.Integration && typeof Integration.autoPreencherPaciente === "function") {
      Integration.autoPreencherPaciente();
    }
  }

  function trocarPaciente() {
    sessionStorage.removeItem("pacienteAtual");
    sessionStorage.removeItem("testeAtual");
    sessionStorage.removeItem("testeNome");
    sessionStorage.removeItem("testeId");

    const badge = document.getElementById("patient-guard-badge");
    if (badge) badge.remove();

    criarModalSelecao();
    carregarPacientesModal();
  }

  function voltar() {
    history.back();
  }

  function calcularIdadePG(dataNascimento) {
    if (!dataNascimento) return "";
    const nascimento = new Date(dataNascimento + "T00:00:00");
    const hoje = new Date();
    let anos = hoje.getFullYear() - nascimento.getFullYear();
    let meses = hoje.getMonth() - nascimento.getMonth();
    if (hoje.getDate() < nascimento.getDate()) meses--;
    if (meses < 0) { anos--; meses += 12; }
    if (anos > 0) return `${anos} ${anos === 1 ? "ano" : "anos"}`;
    if (meses > 0) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
    return "";
  }

  /* ── Injetar CSS ── */
  function injetarEstilos() {
    const style = document.createElement("style");
    style.textContent = `
      /* ── Badge do paciente ── */
      #patient-guard-badge {
        position: fixed; top: 16px; right: 24px; z-index: 9000;
        animation: pgSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .pg-badge-inner {
        display: flex; align-items: center; gap: 10px;
        background: #fff; border: 2px solid #1a56db;
        border-radius: 14px; padding: 8px 14px;
        box-shadow: 0 4px 20px rgba(26,86,219,0.15);
        font-family: 'DM Sans', sans-serif;
      }
      .pg-avatar {
        width: 36px; height: 36px; border-radius: 10px;
        background: linear-gradient(135deg, #1a56db, #7c3aed);
        color: #fff; font-size: 13px; font-weight: 800;
        display: flex; align-items: center; justify-content: center;
      }
      .pg-name { font-size: 13px; font-weight: 700; color: #0c1f3f; }
      .pg-meta { font-size: 11px; color: #64748b; font-weight: 500; }
      .pg-change-btn {
        background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px;
        padding: 5px 12px; font-size: 11px; font-weight: 700; color: #1a56db;
        cursor: pointer; transition: all 0.15s ease; font-family: 'DM Sans', sans-serif;
      }
      .pg-change-btn:hover { background: #dbeafe; border-color: #93c5fd; }
      .pg-move-btn {
        background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px;
        padding: 5px 8px; font-size: 14px; font-weight: 700; color: #94a3b8;
        cursor: pointer; transition: all 0.15s ease; font-family: 'DM Sans', sans-serif;
        line-height: 1;
      }
      .pg-move-btn:hover { background: #dbeafe; color: #1a56db; border-color: #93c5fd; }
      #patient-guard-badge.pg-bottom { top: auto !important; bottom: 16px; }
      @media (max-width: 640px) {
        #patient-guard-badge.pg-bottom { bottom: 12px; }
      }

      /* ── Modal obrigatório ── */
      #patient-guard-modal {
        position: fixed; inset: 0; z-index: 10001;
        background: rgba(12, 31, 63, 0.6); backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center;
        animation: pgFadeIn 0.25s ease;
        font-family: 'DM Sans', sans-serif;
      }
      .pg-modal-box {
        background: #fff; border-radius: 20px; width: 94%; max-width: 520px;
        max-height: 85vh; display: flex; flex-direction: column;
        box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        animation: pgScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        overflow: hidden;
      }
      .pg-modal-header {
        text-align: center; padding: 28px 24px 16px;
        background: linear-gradient(135deg, #f0f9ff 0%, #ede9fe 100%);
        border-bottom: 1px solid #e2e8f0;
      }
      .pg-modal-icon { font-size: 40px; margin-bottom: 8px; }
      .pg-modal-title {
        font-size: 20px; font-weight: 800; color: #0c1f3f; margin: 0 0 4px;
      }
      .pg-modal-subtitle {
        font-size: 13px; color: #64748b; font-weight: 500; margin: 0;
      }
      .pg-search-wrap { padding: 16px 20px 8px; }
      .pg-search {
        width: 100%; padding: 12px 16px; border: 2px solid #e2e8f0;
        border-radius: 12px; font-size: 14px; font-family: 'DM Sans', sans-serif;
        font-weight: 500; outline: none; transition: border-color 0.15s;
        box-sizing: border-box;
      }
      .pg-search:focus { border-color: #1a56db; }
      .pg-list {
        flex: 1; overflow-y: auto; padding: 8px 20px 16px;
        max-height: 380px;
      }
      .pg-patient-item {
        display: flex; align-items: center; gap: 12px;
        padding: 12px 14px; border-radius: 12px; cursor: pointer;
        transition: all 0.15s ease; border: 1.5px solid transparent;
      }
      .pg-patient-item:hover {
        background: #f0f9ff; border-color: #93c5fd;
        transform: translateX(3px);
      }
      .pg-patient-avatar {
        width: 40px; height: 40px; border-radius: 10px;
        background: linear-gradient(135deg, #1a56db, #7c3aed);
        color: #fff; font-size: 14px; font-weight: 800;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .pg-patient-name { font-size: 14px; font-weight: 700; color: #0c1f3f; }
      .pg-patient-meta { font-size: 12px; color: #64748b; font-weight: 500; margin-top: 2px; }
      .pg-patient-info { flex: 1; }
      .pg-patient-arrow {
        font-size: 16px; color: #94a3b8; font-weight: 700;
        transition: transform 0.15s;
      }
      .pg-patient-item:hover .pg-patient-arrow {
        transform: translateX(4px); color: #1a56db;
      }
      .pg-modal-footer {
        padding: 12px 20px 16px; text-align: center;
        border-top: 1px solid #e2e8f0;
      }
      .pg-btn-voltar {
        background: none; border: 2px solid #e2e8f0; border-radius: 10px;
        padding: 10px 24px; font-size: 13px; font-weight: 700;
        color: #64748b; cursor: pointer; transition: all 0.15s;
        font-family: 'DM Sans', sans-serif;
      }
      .pg-btn-voltar:hover { background: #f1f5f9; border-color: #cbd5e1; color: #0c1f3f; }
      .pg-empty {
        text-align: center; padding: 30px 16px; color: #64748b;
        font-size: 14px; font-weight: 500;
      }
      .pg-empty-icon { font-size: 36px; margin-bottom: 8px; }
      .pg-link {
        display: inline-block; margin-top: 12px; color: #1a56db;
        font-weight: 700; text-decoration: none; font-size: 13px;
      }
      .pg-link:hover { text-decoration: underline; }
      .pg-loading {
        text-align: center; padding: 30px; color: #64748b;
        font-size: 14px; font-weight: 500;
      }

      @keyframes pgSlideIn { from { transform: translateY(-20px); opacity:0; } to { transform: translateY(0); opacity:1; } }
      @keyframes pgFadeIn { from { opacity:0; } to { opacity:1; } }
      @keyframes pgScaleIn { from { transform: scale(0.92); opacity:0; } to { transform: scale(1); opacity:1; } }

      @media (max-width: 640px) {
        #patient-guard-badge { top: 12px; right: 12px; left: auto; }
        .pg-badge-inner { justify-content: center; }
        .pg-modal-box { width: 98%; max-height: 90vh; }
      }

      @media print {
        #patient-guard-badge { display: none !important; }
        #patient-guard-modal { display: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ── Inicialização ── */
  function init() {
    injetarEstilos();

    const paciente = getPacienteFromSession();

    if (paciente) {
      criarBadgePaciente(paciente);
    } else {
      criarModalSelecao();
      // Aguardar Firebase estar pronto antes de carregar pacientes
      const checkAndLoad = () => {
        if (window.DB && typeof DB.getPacientes === "function") {
          carregarPacientesModal();
        } else {
          setTimeout(checkAndLoad, 200);
        }
      };
      setTimeout(checkAndLoad, 300);
    }
  }

  // Executar quando DOM pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* ── Mover badge entre topo e rodapé ── */
  function moverBadge() {
    const badge = document.getElementById("patient-guard-badge");
    if (!badge) return;
    badge.classList.toggle("pg-bottom");
    try { sessionStorage.setItem("pg-badge-pos", badge.classList.contains("pg-bottom") ? "bottom" : "top"); } catch(e) {}
  }

  /* ── Restaurar posição salva ── */
  function restaurarPosicaoBadge() {
    try {
      if (sessionStorage.getItem("pg-badge-pos") === "bottom") {
        const badge = document.getElementById("patient-guard-badge");
        if (badge) badge.classList.add("pg-bottom");
      }
    } catch(e) {}
  }

  /* ── API global ── */
  window.PatientGuard = {
    getPaciente: getPacienteFromSession,
    selecionarPaciente,
    trocarPaciente,
    filtrarPacientes,
    voltar,
    moverBadge,
  };
})();
