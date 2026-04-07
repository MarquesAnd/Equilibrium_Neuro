/* ═══════════════════════════════════
   PAGES — Conteúdo de cada página
   ═══════════════════════════════════ */

/* ── Helpers ── */
function classifBadge(cl) {
  const map = {
    "Muito Superior":"badge-green","Superior":"badge-green",
    "Médio Superior":"badge-blue","Médio":"badge-blue",
    "Médio Inferior":"badge-amber","Limítrofe":"badge-red",
    "Extremamente Baixo":"badge-red","Leve":"badge-amber",
    "Moderado":"badge-red","Severo":"badge-red","Normal":"badge-green",
  };
  return `<span class="badge ${map[cl]||'badge-gray'}">${cl}</span>`;
}

function _calcIdade(dataNascimento) {
  if (!dataNascimento) return "—";
  const nasc = new Date(dataNascimento + "T00:00:00");
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
  return anos + "a";
}

function _fmtData(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("pt-BR");
}

function _tipoLabel(tipo) {
  const map = {
    "wisc-iv":"WISC-IV", "wais-iii":"WAIS-III", "wais":"WAIS-III",
    "srs2":"SRS-2", "srs2-pre":"SRS-2", "srs2-esc-masc":"SRS-2", "srs2-esc-fem":"SRS-2",
    "srs2-ad-auto":"SRS-2", "srs2-ad-hetero":"SRS-2",
    "raads-r":"RAADS-R", "vineland3":"Vineland-3", "vineland":"Vineland-3",
    "cat-q":"CAT-Q", "bfp":"BFP",
  };
  return map[(tipo||"").toLowerCase()] || tipo || "—";
}

function _statusBadge(status) {
  const map = {
    "corrigido":     '<span class="badge badge-green">Corrigido</span>',
    "aplicado":      '<span class="badge badge-blue">Aplicado</span>',
    "em-aplicacao":  '<span class="badge badge-amber">Em andamento</span>',
  };
  return map[status] || '<span class="badge badge-gray">' + (status||"—") + '</span>';
}

/* ══════════════════════════
   DASHBOARD — Dados reais
   ══════════════════════════ */
async function renderDashboard() {
  try {
    const pacientes = await DB.getPacientes();
    const totalPacientes = pacientes.length;

    let totalTestes = 0, totalCorrigidos = 0, totalEmAndamento = 0, totalAplicados = 0;
    let recentTestes = [];

    const contagemPromises = pacientes.map(async (p) => {
      const contagem = await DB.contarTestesPaciente(p.id);
      p._contagem = contagem;
      totalTestes += contagem.total;
      totalCorrigidos += contagem.corrigidos;
      totalEmAndamento += contagem.emAndamento;
      totalAplicados += contagem.aplicados;

      const testes = await DB.getTestesPaciente(p.id);
      for (const t of testes) {
        recentTestes.push({ ...t, pacienteNome: p.nome, pacienteId: p.id });
      }
    });
    await Promise.all(contagemPromises);

    recentTestes.sort((a, b) => {
      const da = a.criadoEm?.toDate ? a.criadoEm.toDate() : new Date(0);
      const db = b.criadoEm?.toDate ? b.criadoEm.toDate() : new Date(0);
      return db - da;
    });
    const ultimos = recentTestes.slice(0, 8);

    const topPacientes = [...pacientes].sort((a, b) => {
      const da = a.atualizadoEm?.toDate ? a.atualizadoEm.toDate() : (a.criadoEm?.toDate ? a.criadoEm.toDate() : new Date(0));
      const db = b.atualizadoEm?.toDate ? b.atualizadoEm.toDate() : (b.criadoEm?.toDate ? b.criadoEm.toDate() : new Date(0));
      return db - da;
    }).slice(0, 5);

    /* ── Stats ── */
    const statsHtml = `
      <div class="stats-grid">
        <div class="stat-card stat-card-interactive" onclick="navigateTo('pacientes')">
          <div class="stat-icon">👤</div>
          <div class="stat-value" style="color:var(--blue)">${totalPacientes}</div>
          <div class="stat-label">Pacientes</div>
        </div>
        <div class="stat-card stat-card-interactive" onclick="navigateTo('correcao')">
          <div class="stat-icon">✏️</div>
          <div class="stat-value" style="color:var(--green)">${totalCorrigidos}</div>
          <div class="stat-label">Testes Corrigidos</div>
        </div>
        <div class="stat-card stat-card-interactive" onclick="navigateTo('aplicacao')">
          <div class="stat-icon">🧠</div>
          <div class="stat-value" style="color:var(--teal)">${totalAplicados}</div>
          <div class="stat-label">Testes Aplicados</div>
        </div>
        <div class="stat-card stat-card-interactive">
          <div class="stat-icon">⚡</div>
          <div class="stat-value" style="color:var(--amber)">${totalEmAndamento}</div>
          <div class="stat-label">Em Andamento</div>
        </div>
      </div>`;

    /* ── Ações rápidas ── */
    const actionsHtml = `
      <div class="action-row">
        <button class="btn-primary" onclick="navigateTo('pacientes')">+ Novo Paciente</button>
        <button class="btn-primary" onclick="navigateTo('correcao')" style="background:var(--green)">+ Nova Correção</button>
        <button class="btn-primary" onclick="navigateTo('aplicacao')" style="background:var(--teal)">+ Nova Aplicação</button>
        <button class="btn-secondary" onclick="navigateTo('anamnese')">📋 Anamnese</button>
      </div>`;

    /* ── Atividade recente ── */
    let recentHtml = "";
    if (ultimos.length > 0) {
      const rows = ultimos.map(t => `
        <tr class="dash-row-click" onclick="window._dashGoToPaciente('${t.pacienteId}')">
          <td class="bold">${t.pacienteNome || "—"}</td>
          <td><span class="badge badge-blue">${_tipoLabel(t.tipo)}</span></td>
          <td>${_fmtData(t.criadoEm)}</td>
          <td class="center">${_statusBadge(t.status)}</td>
        </tr>`).join("");

      recentHtml = `
        <div class="card dash-card-animate">
          <div class="dash-card-header">
            <h3>Atividade Recente</h3>
            <span class="badge badge-blue">${recentTestes.length} testes</span>
          </div>
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Paciente</th><th>Teste</th><th>Data</th><th class="center">Status</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>`;
    } else {
      recentHtml = `
        <div class="card dash-card-animate">
          <div class="empty-state">
            <div class="empty-icon">📊</div>
            <div class="empty-title">Nenhum teste realizado ainda</div>
            <div class="empty-desc">Comece cadastrando pacientes e aplicando testes</div>
            <br>
            <button class="btn-primary" onclick="navigateTo('pacientes')">Cadastrar Paciente</button>
          </div>
        </div>`;
    }

    /* ── Pacientes recentes ── */
    let pacientesHtml = "";
    if (topPacientes.length > 0) {
      const items = topPacientes.map(p => {
        const idade = _calcIdade(p.dataNascimento);
        const cont = p._contagem || { total: 0, corrigidos: 0 };
        return `
          <div class="paciente-item dash-row-click" onclick="window._dashGoToPaciente('${p.id}')">
            <div class="paciente-avatar">${(p.nome||"?")[0].toUpperCase()}</div>
            <div class="paciente-info">
              <div class="paciente-nome">${p.nome || "Sem nome"}</div>
              <div class="paciente-meta">${idade} · ${cont.total} teste(s) · ${cont.corrigidos} corrigido(s)</div>
            </div>
            <div class="paciente-arrow">›</div>
          </div>`;
      }).join("");

      pacientesHtml = `
        <div class="card dash-card-animate">
          <div class="dash-card-header">
            <h3>Pacientes Recentes</h3>
            <button class="btn-secondary btn-sm" onclick="navigateTo('pacientes')">Ver todos</button>
          </div>
          ${items}
        </div>`;
    }

    /* ── Acesso rápido ── */
    const quickHtml = `
      <div class="dash-quick-grid dash-card-animate">
        <div class="dash-quick-card" onclick="navigateTo('correcao')">
          <div class="dash-quick-icon" style="background:var(--blue-light);color:var(--blue)">✏️</div>
          <div class="dash-quick-label">Correção de Testes</div>
          <div class="dash-quick-desc">WAIS, WISC, SRS-2, Vineland</div>
        </div>
        <div class="dash-quick-card" onclick="navigateTo('aplicacao')">
          <div class="dash-quick-icon" style="background:var(--teal-light);color:var(--teal)">🧠</div>
          <div class="dash-quick-label">Aplicação de Testes</div>
          <div class="dash-quick-desc">Aplicar testes digitalmente</div>
        </div>
        <div class="dash-quick-card" onclick="navigateTo('anamnese')">
          <div class="dash-quick-icon" style="background:var(--purple-light);color:var(--purple)">📋</div>
          <div class="dash-quick-label">Anamnese</div>
          <div class="dash-quick-desc">Entrevista clínica</div>
        </div>
        <div class="dash-quick-card" onclick="navigateTo('checklist')">
          <div class="dash-quick-icon" style="background:var(--amber-light);color:var(--amber)">✅</div>
          <div class="dash-quick-label">Checklist</div>
          <div class="dash-quick-desc">Instrumentos selecionados</div>
        </div>
      </div>`;

    return statsHtml + actionsHtml + `<div class="dash-grid">${recentHtml}${pacientesHtml}</div>` + quickHtml;

  } catch(e) {
    console.error("Erro ao carregar dashboard:", e);
    return `
      <div class="card">
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <div class="empty-title">Erro ao carregar dados</div>
          <div class="empty-desc">${e.message}</div>
          <br>
          <button class="btn-primary" onclick="navigateTo('dashboard')">Tentar novamente</button>
        </div>
      </div>`;
  }
}

/* Função auxiliar para navegar ao paciente */
window._dashGoToPaciente = function(pacienteId) {
  sessionStorage.setItem("pacienteAtual", pacienteId);
  location.href = "/Pacientes/index.html";
};

/* ══════════════════════════
   CORREÇÃO / APLICAÇÃO
   ══════════════════════════ */
function renderCorrecao()  { location.href = '/Correcao_testes/index.html';  return ''; }
function renderAplicacao() { location.href = '/Aplicacao_testes/index.html'; return ''; }
function renderAnamnese()  { location.href = '/Anamnese/index.html';         return ''; }
function renderChecklist() { location.href = '/check_list/index.html';       return ''; }
function renderConfig()    { location.href = '/Config/index.html';           return ''; }
function renderPacientes() { location.href = '/Pacientes/index.html';        return ''; }

/* ══════════════════════════
   RELATÓRIOS
   ══════════════════════════ */
function renderRelatorios() {
  return `
    <div class="card">
      <div class="empty-state">
        <div class="empty-icon">📄</div>
        <div class="empty-title">Selecione um paciente para ver seus relatórios</div>
        <div class="empty-desc">Ou gere um novo a partir da aba Correção de Testes</div>
        <br>
        <button class="btn-primary" onclick="navigateTo('correcao')">Ir para Correção</button>
      </div>
    </div>`;
}

/* ══════════════════════════
   REGISTRY
   ══════════════════════════ */
const PAGE_REGISTRY = {
  dashboard:  { title: "Dashboard",           subtitle: "Visão geral do sistema",        render: renderDashboard  },
  pacientes:  { title: "Pacientes",           subtitle: "Gerencie seus pacientes",       render: renderPacientes  },
  correcao:   { title: "Correção de Testes",  subtitle: "Selecione o instrumento",       render: renderCorrecao   },
  aplicacao:  { title: "Aplicação de Testes", subtitle: "Instrumentos de avaliação",     render: renderAplicacao  },
  anamnese:   { title: "Anamnese",            subtitle: "Entrevista clínica por faixa etária", render: renderAnamnese },
  relatorios: { title: "Relatórios",          subtitle: "Gerencie relatórios gerados",   render: renderRelatorios },
  checklist:  { title: "Checklist",           subtitle: "Testes disponíveis no sistema", render: renderChecklist  },
  config:     { title: "Configurações",       subtitle: "Preferências do sistema",       render: renderConfig     },
};
