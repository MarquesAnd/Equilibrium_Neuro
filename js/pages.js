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
  // Renderiza o container, depois carrega os dados async
  setTimeout(_carregarRelatorios, 100);
  return `
    <div id="relatoriosFilter" style="display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap;">
      <select id="relFiltroP" class="field-input" style="padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;font-family:inherit;min-width:240px;">
        <option value="">Todos os pacientes</option>
      </select>
      <input type="text" id="relBusca" placeholder="Buscar por teste ou paciente..." style="padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;font-family:inherit;flex:1;min-width:200px;" />
    </div>
    <div id="relatoriosContent">
      <div class="card" style="text-align:center;padding:40px;">
        <div style="font-size:32px;margin-bottom:12px;">⏳</div>
        <div style="font-weight:600;color:var(--text-secondary);">Carregando relatórios...</div>
      </div>
    </div>`;
}

const _NOMES_TESTES = {
  'wais-iii':'WAIS-III','wisc-iv':'WISC-IV','srs2-pre':'SRS-2 Pré-Escolar',
  'srs2-esc-masc':'SRS-2 Escolar Masc','srs2-esc-fem':'SRS-2 Escolar Fem',
  'srs2-adulto':'SRS-2 Adulto','raads-r':'RAADS-R','cat-q':'CAT-Q','bfp':'BFP',
  'vineland-pre':'Vineland-3','vineland-adulto':'Vineland-3',
  'qcp-fc':'QCP-FC',
  'ravlt':'RAVLT',
  'qa':'QA — Quociente do Autismo',
  'eq15':'EQ-15 — Quociente de Empatia',
};

let _todosRelatorios = [];

async function _carregarRelatorios() {
  const container = document.getElementById('relatoriosContent');
  const selectPac = document.getElementById('relFiltroP');
  const inputBusca = document.getElementById('relBusca');
  if (!container) return;

  try {
    // Carregar todos os pacientes
    let pacientes = [];
    if (window.DB && typeof DB.getPacientes === 'function') {
      pacientes = await DB.getPacientes();
      // Pacientes são universais — todos os profissionais veem todos
    }

    // Preencher select de pacientes
    if (selectPac) {
      pacientes.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.nome;
        selectPac.appendChild(opt);
      });
    }

    // Carregar testes corrigidos de todos os pacientes
    _todosRelatorios = [];
    await Promise.all(pacientes.map(async (pac) => {
      if (!window.DB) return;
      const testes = await DB.getTestesPaciente(pac.id);
      testes.filter(t => t.status === 'corrigido').forEach(t => {
        _todosRelatorios.push({
          ...t,
          pacienteId: pac.id,
          pacienteNome: pac.nome,
          pacienteCpf: pac.cpf || '',
        });
      });
    }));

    // Ordenar por data mais recente
    _todosRelatorios.sort((a, b) => {
      const da = a.dataCorrecao ? new Date(a.dataCorrecao.toDate ? a.dataCorrecao.toDate() : a.dataCorrecao) : new Date(0);
      const db = b.dataCorrecao ? new Date(b.dataCorrecao.toDate ? b.dataCorrecao.toDate() : b.dataCorrecao) : new Date(0);
      return db - da;
    });

    _renderizarListaRelatorios(_todosRelatorios);

    // Filtros
    if (selectPac) selectPac.addEventListener('change', _aplicarFiltrosRel);
    if (inputBusca) inputBusca.addEventListener('input', _aplicarFiltrosRel);

  } catch(e) {
    console.error('Erro ao carregar relatórios:', e);
    container.innerHTML = `<div class="card" style="text-align:center;padding:40px;">
      <div style="font-size:32px;margin-bottom:12px;">⚠️</div>
      <div style="font-weight:600;color:var(--red);">Erro ao carregar relatórios</div>
    </div>`;
  }
}

function _aplicarFiltrosRel() {
  const pacId = document.getElementById('relFiltroP')?.value || '';
  const busca = (document.getElementById('relBusca')?.value || '').toLowerCase();
  let filtrados = _todosRelatorios;
  if (pacId) filtrados = filtrados.filter(r => r.pacienteId === pacId);
  if (busca) filtrados = filtrados.filter(r =>
    r.pacienteNome.toLowerCase().includes(busca) ||
    (_NOMES_TESTES[r.tipo] || r.tipo).toLowerCase().includes(busca) ||
    (r.resultados?.resumo || '').toLowerCase().includes(busca)
  );
  _renderizarListaRelatorios(filtrados);
}

function _renderizarListaRelatorios(lista) {
  const container = document.getElementById('relatoriosContent');
  if (!container) return;

  if (lista.length === 0) {
    container.innerHTML = `<div class="card" style="text-align:center;padding:40px;">
      <div style="font-size:32px;margin-bottom:12px;">📄</div>
      <div style="font-weight:700;font-size:16px;margin-bottom:6px;">Nenhum relatório encontrado</div>
      <div style="color:var(--text-secondary);font-size:13px;">Corrija testes a partir da aba de Correção para gerar relatórios</div>
    </div>`;
    return;
  }

  container.innerHTML = `
    <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;font-weight:600;">
      ${lista.length} relatório${lista.length !== 1 ? 's' : ''} encontrado${lista.length !== 1 ? 's' : ''}
    </div>
    <div class="tbl-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Teste</th>
            <th>Resultado</th>
            <th>Data</th>
            <th class="center">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${lista.map(r => {
            const nomeTeste = _NOMES_TESTES[r.tipo] || r.tipo;
            const data = _fmtData(r.dataCorrecao);
            const resumo = r.resultados?.resumo || '—';
            const classif = r.resultados?.classificacao || '';
            return `<tr>
              <td>
                <div style="font-weight:700;font-size:13px;">${r.pacienteNome}</div>
                <div style="font-size:11px;color:var(--text-secondary);">${r.pacienteCpf}</div>
              </td>
              <td><span class="badge badge-blue">${nomeTeste}</span></td>
              <td>
                <div style="font-size:12px;font-weight:600;">${resumo}</div>
                ${classif ? classifBadge(classif) : ''}
              </td>
              <td style="font-size:12px;">${data}</td>
              <td class="center" style="white-space:nowrap;display:flex;gap:6px;justify-content:center;">
                ${r.htmlRelatorio ? `
                <button onclick="_verRelPDF('${r.pacienteId}','${r.id}')" title="Ver relatório" style="background:var(--blue);color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;">
                  👁️ Ver
                </button>
                <button onclick="_baixarRelPDF('${r.pacienteId}','${r.id}','${r.pacienteNome.replace(/'/g,"")}')" title="Baixar PDF" style="background:#059669;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;">
                  📥 PDF
                </button>` : `
                <button onclick="_abrirRelPaciente('${r.pacienteId}','${r.id}')" title="Ver no paciente" style="background:var(--blue);color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;">
                  👤 Paciente
                </button>`}
                <button onclick="_irCorrigirTeste('${r.pacienteId}','${r.tipo}','${r.id}')" title="Editar" style="background:#f1f5f9;border:1px solid var(--border);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;">
                  ✏️
                </button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

function _abrirRelPaciente(pacienteId, testeId) {
  sessionStorage.setItem('abrirPacienteId', pacienteId);
  window.location.href = '/Pacientes/';
}

function _irCorrigirTeste(pacienteId, tipo, testeId) {
  // Buscar paciente para colocar no session
  const pacientes = _todosRelatorios.filter(r => r.pacienteId === pacienteId);
  if (pacientes.length > 0) {
    sessionStorage.setItem('pacienteAtual', JSON.stringify({
      id: pacienteId,
      nome: pacientes[0].pacienteNome,
    }));
    sessionStorage.setItem('testeAtual', tipo);
    sessionStorage.setItem('testeId', testeId);
  }

  const ROTAS = {
    'wais-iii':'/Correcao_testes/WAIS/novo-laudo.html',
    'wisc-iv':'/Correcao_testes/WISC_IV/novo-laudo.html',
    'srs2-pre':'/Correcao_testes/SRS2/Pre-escolar/',
    'srs2-esc-masc':'/Correcao_testes/SRS2/idade-escolar-masculino/',
    'srs2-esc-fem':'/Correcao_testes/SRS2/idade-escolar-feminino/',
    'srs2-adulto':'/Correcao_testes/SRS2/adulto-autorelato/',
    'raads-r':'/Correcao_testes/RAADS-R/',
    'vineland-pre':'/Correcao_testes/Vineland3/',
    'vineland-adulto':'/Correcao_testes/Vineland3/',
    'qcp-fc':'/Correcao_testes/QCP_FC/',
    'ravlt':'/Correcao_testes/RAVLT/',
    'bfp':'/Correcao_testes/BFP/',
  };
  window.location.href = ROTAS[tipo] || '/Correcao_testes/';
}

/* ── Mapa de CSS por tipo de teste ── */
function _getCSSForTipo(tipo) {
  const css = ['/Correcao_testes/style.css'];
  if (tipo && tipo.startsWith('srs2')) css.push('/Correcao_testes/SRS2/srs2-shared.css');
  if (tipo === 'raads-r') css.push('/Correcao_testes/RAADS-R/styles.css');
  return css;
}

/* ── Visualizar relatório em modal ── */
async function _verRelPDF(pacienteId, testeId) {
  const rel = _todosRelatorios.find(r => r.pacienteId === pacienteId && r.id === testeId);
  if (!rel || !rel.htmlRelatorio) {
    alert('Relatório não disponível. Corrija o teste novamente para gerar.');
    return;
  }

  const prev = document.getElementById('relViewModal');
  if (prev) prev.remove();

  const cssLinks = _getCSSForTipo(rel.tipo).map(href => `<link rel="stylesheet" href="${href}" />`).join('\n');

  const modal = document.createElement('div');
  modal.id = 'relViewModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(15,23,42,.55);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;padding:24px;overflow-y:auto;animation:fadeIn .25s ease;';
  modal.innerHTML = `
    <div style="background:#f1f5f9;border-radius:16px;width:100%;max-width:960px;box-shadow:0 24px 80px rgba(0,0,0,.25);overflow:hidden;animation:slideUp .3s ease;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:#fff;border-bottom:1px solid #e2e8f0;position:sticky;top:0;z-index:10;">
        <div style="font-size:14px;font-weight:700;color:#0f172a;">📄 ${_NOMES_TESTES[rel.tipo] || rel.tipo} — ${rel.pacienteNome}</div>
        <div style="display:flex;gap:8px;">
          <button onclick="_baixarRelPDF('${pacienteId}','${testeId}','${rel.pacienteNome.replace(/'/g,"")}')" style="padding:8px 16px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;border:none;background:#059669;color:#fff;transition:all .15s;">📥 Baixar PDF</button>
          <button onclick="_imprimirRel('${rel.tipo}')" style="padding:8px 16px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;border:none;background:#1a56db;color:#fff;transition:all .15s;">🖨️ Imprimir</button>
          <button onclick="document.getElementById('relViewModal').remove()" style="padding:8px 16px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;border:1px solid #e2e8f0;background:#f1f5f9;color:#334155;transition:all .15s;">✕ Fechar</button>
        </div>
      </div>
      <div id="relViewBody" style="padding:12px;overflow:hidden;">
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        ${cssLinks}
        <div id="relViewContent">${rel.htmlRelatorio}</div>
      </div>
    </div>`;
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  const escHandler = (e) => { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);
}

function _imprimirRel(tipo) {
  const content = document.getElementById('relViewContent');
  if (!content) return;
  const cssLinks = _getCSSForTipo(tipo).map(href => `<link rel="stylesheet" href="${href}" />`).join('\n');
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Relatório</title>
    <link rel="stylesheet" href="/style.css" />
    ${cssLinks}
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>body{margin:0;padding:20px;font-family:'DM Sans',sans-serif;} *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}</style>
  </head><body>${content.innerHTML}</body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); }, 500);
}

async function _baixarRelPDF(pacienteId, testeId, nomeP) {
  const rel = _todosRelatorios.find(r => r.pacienteId === pacienteId && r.id === testeId);
  if (!rel || !rel.htmlRelatorio) {
    alert('Relatório não disponível.');
    return;
  }

  if (!window.html2pdf) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    document.head.appendChild(script);
    await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; });
  }

  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;top:0;width:210mm;';

  // Carregar fontes e CSS necessários para o tipo de teste
  ['https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap',
   'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap'
  ].concat(_getCSSForTipo(rel.tipo)).forEach(href => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    container.appendChild(link);
  });

  const content = document.createElement('div');
  content.innerHTML = rel.htmlRelatorio;
  container.appendChild(content);
  document.body.appendChild(container);

  // Aguardar CSS carregar
  await new Promise(r => setTimeout(r, 400));

  // Converter SVGs inline para imagens (html2canvas não renderiza SVG corretamente)
  const svgs = content.querySelectorAll('svg');
  for (const svg of svgs) {
    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = await new Promise(r => { const i = new Image(); i.onload = () => { URL.revokeObjectURL(url); r(i); }; i.onerror = () => { URL.revokeObjectURL(url); r(null); }; i.src = url; });
      if (img) { img.style.cssText = svg.getAttribute('style') || 'width:100%;height:auto;'; svg.parentNode.replaceChild(img, svg); }
    } catch(e) {}
  }
  await new Promise(r => setTimeout(r, 200));

  // Esconder elementos decorativos que causam problemas no html2canvas
  const decos = content.querySelectorAll('.deco1, .deco2');
  const badge = content.querySelector('.rpt-hdr-badge');
  decos.forEach(d => d.style.display = 'none');
  if (badge) badge.style.backdropFilter = 'none';

  const nomeTeste = _NOMES_TESTES[rel.tipo] || rel.tipo;
  const fileName = `${nomeTeste} - ${nomeP}.pdf`;

  try {
    await html2pdf().set({
      margin: [5, 5, 5, 5],
      filename: fileName,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 4, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: 'mm', format: [210, 900], orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all'] },
    }).from(content).save();
  } catch(e) {
    console.error('Erro ao gerar PDF:', e);
    alert('Erro ao gerar PDF. Tente usar a opção Imprimir.');
  } finally {
    container.remove();
  }
}

// Expor funções globalmente para onclick handlers
window._abrirRelPaciente = _abrirRelPaciente;
window._irCorrigirTeste = _irCorrigirTeste;
window._verRelPDF = _verRelPDF;
window._baixarRelPDF = _baixarRelPDF;
window._imprimirRel = _imprimirRel;

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
