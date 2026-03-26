/* ═══════════════════════════════════
   PAGES — Conteúdo de cada página
   ═══════════════════════════════════ */

const MOCK_RECENTES = [
  { nome:"Ivete Arantes Rezende",    teste:"WAIS-III", data:"11/02/2026", qi:"105", classif:"Médio" },
  { nome:"Arthur Rodrigues Santos",  teste:"WISC-IV",  data:"13/02/2026", qi:"72",  classif:"Limítrofe" },
  { nome:"Carlos M. Silva",          teste:"SRS-2",    data:"08/02/2026", qi:"—",   classif:"Leve" },
  { nome:"Ana Paula Costa",          teste:"WAIS-III", data:"02/02/2026", qi:"118", classif:"Médio Superior" },
];

const MOCK_PACIENTES = [
  { nome:"Ivete Arantes Rezende",   idade:"67a", testes:3, ultimo:"WAIS-III" },
  { nome:"Arthur Rodrigues Santos", idade:"13a", testes:2, ultimo:"WISC-IV"  },
  { nome:"Carlos M. Silva",         idade:"8a",  testes:1, ultimo:"SRS-2"    },
  { nome:"Ana Paula Costa",         idade:"45a", testes:4, ultimo:"WAIS-III" },
  { nome:"Roberto Fonseca Jr.",     idade:"32a", testes:1, ultimo:"WAIS-III" },
];

const TESTES = [
  { nome:"WAIS-III",   desc:"Adultos (16-89 anos)",       status:"Ativo",   color:"blue",  href:"/Correcao_testes/WAIS/novo-laudo.html" },
  { nome:"WISC-IV",    desc:"Crianças (6-16 anos)",       status:"Ativo",   color:"green", href:"/Correcao_testes/WISC_IV/novo-laudo.html" },
  { nome:"SRS-2",      desc:"Resp. Social (2.5-65 anos)", status:"Ativo",   color:"teal",  href:"/Correcao_testes/SRS2/index.html" },
  { nome:"WPPSI-IV",   desc:"Pré-escola (2.6-7.7 anos)", status:"Em breve",color:"gray"  },
  { nome:"RAVLT",      desc:"Memória verbal",             status:"Em breve",color:"gray"  },
  { nome:"TDE-II",     desc:"Desempenho escolar",         status:"Em breve",color:"gray"  },
  { nome:"BPA-2",      desc:"Atenção",                    status:"Em breve",color:"gray"  },
  { nome:"Neupsilin",  desc:"Breve neuropsicológica",     status:"Em breve",color:"gray"  },
  { nome:"FDT",        desc:"Funções executivas",         status:"Em breve",color:"gray"  },
];

const CHECKLIST = [
  { nome:"WAIS-III",   done:true  },
  { nome:"WISC-IV",    done:true  },
  { nome:"SRS-2",      done:true  },
  { nome:"WPPSI-IV",   done:false },
  { nome:"RAVLT",      done:false },
  { nome:"TDE-II",     done:false },
  { nome:"BPA-2",      done:false },
  { nome:"Neupsilin",  done:false },
  { nome:"FDT",        done:false },
  { nome:"COLUMBIA-3", done:false },
  { nome:"SON-R",      done:false },
  { nome:"ETDAH",      done:false },
];

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

/* ══════════════════════════
   DASHBOARD
   ══════════════════════════ */
function renderDashboard() {
  const done = CHECKLIST.filter(c => c.done).length;
  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👤</div>
        <div class="stat-value" style="color:var(--blue)">${MOCK_PACIENTES.length}</div>
        <div class="stat-label">Pacientes</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✏️</div>
        <div class="stat-value" style="color:var(--green)">${MOCK_RECENTES.length}</div>
        <div class="stat-label">Testes Realizados</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-value" style="color:var(--teal)">${done}/${CHECKLIST.length}</div>
        <div class="stat-label">Testes Implementados</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-value" style="color:var(--purple)">3</div>
        <div class="stat-label">Ativos</div>
      </div>
    </div>
    <div class="action-row">
      <button class="btn-primary" onclick="navigateTo('correcao')">+ Nova Correção</button>
      <button class="btn-secondary" onclick="navigateTo('pacientes')">Ver Pacientes</button>
    </div>
    <div class="card">
      <h3 style="font-size:15px;font-weight:700;margin-bottom:14px;">Últimas correções</h3>
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Paciente</th><th>Teste</th><th>Data</th><th class="center">QIT</th><th>Classificação</th></tr></thead>
          <tbody>
            ${MOCK_RECENTES.map(r => `
              <tr>
                <td class="bold">${r.nome}</td>
                <td><span class="badge badge-blue">${r.teste}</span></td>
                <td>${r.data}</td>
                <td class="center bold">${r.qi}</td>
                <td>${classifBadge(r.classif)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ══════════════════════════
   PACIENTES
   ══════════════════════════ */
function renderPacientes() {
  return `
    <div class="action-row">
      <button class="btn-primary">+ Novo Paciente</button>
    </div>
    ${MOCK_PACIENTES.map(p => `
      <div class="paciente-item">
        <div class="paciente-avatar">${p.nome[0]}</div>
        <div class="paciente-info">
          <div class="paciente-nome">${p.nome}</div>
          <div class="paciente-meta">${p.idade} · ${p.testes} teste(s) · Último: ${p.ultimo}</div>
        </div>
        <span class="paciente-arrow">→</span>
      </div>`).join("")}`;
}

/* ══════════════════════════
   CORREÇÃO / APLICAÇÃO
   ══════════════════════════ */
//function renderCorrecao()  { location.href = '/Correcao_testes/index.html';  return ''; }
// Em vez de mudar o endereço, retorne o conteúdo (exemplo usando iframe para manter limpo)
function renderCorrecao() {
    return `<iframe src="/Correcao_testes/index.html" style="width:100%; height:80vh; border:none;"></iframe>`;
}

function renderAplicacao() { location.href = '/Aplicacao_testes/index.html'; return ''; }
function renderChecklist() { location.href = '/check_list/index.html';       return ''; }

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

/* ══════════════════════════════════════════════════
   CONFIGURAÇÕES
   ══════════════════════════════════════════════════ */
function renderConfig() {
  // Renderiza placeholder enquanto carrega do banco
  const adminSection = isAdmin() ? renderUserManagement() : '';
  const cfg = { nome:"", crp:"", especialidade:"", contato:"", clinica:"", cidade:"" };

  // Carregar config do banco assincronamente e preencher campos
  loadConfig().then(cfgLoaded => {
    Object.keys(cfgLoaded).forEach(k => {
      const el = document.getElementById('cfg' + k.charAt(0).toUpperCase() + k.slice(1));
      if (el) el.value = cfgLoaded[k] || '';
    });
  });

  return `
    <!-- ── Perfil do Profissional ── -->
    <div class="config-section" id="sectionPerfil">
      <div class="config-title">Perfil do Profissional</div>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">
        Estes dados são usados automaticamente nos relatórios gerados.
      </p>
      <div class="config-grid">
        <div class="config-field">
          <label for="cfgNome">Nome completo</label>
          <input type="text" id="cfgNome" class="config-input" value="${_esc(cfg.nome)}" placeholder="Ex: Dr. João Silva" />
        </div>
        <div class="config-field">
          <label for="cfgCrp">CRP</label>
          <input type="text" id="cfgCrp" class="config-input" value="${_esc(cfg.crp)}" placeholder="Ex: CRP 04/12345" />
        </div>
        <div class="config-field">
          <label for="cfgEsp">Especialidade</label>
          <input type="text" id="cfgEsp" class="config-input" value="${_esc(cfg.especialidade)}" placeholder="Ex: Neuropsicólogo" />
        </div>
        <div class="config-field">
          <label for="cfgContato">E-mail / Contato</label>
          <input type="text" id="cfgContato" class="config-input" value="${_esc(cfg.contato)}" placeholder="Ex: email@clinica.com" />
        </div>
        <div class="config-field">
          <label for="cfgClinica">Clínica / Consultório</label>
          <input type="text" id="cfgClinica" class="config-input" value="${_esc(cfg.clinica)}" placeholder="Nome da clínica" />
        </div>
        <div class="config-field">
          <label for="cfgCidade">Cidade / Estado</label>
          <input type="text" id="cfgCidade" class="config-input" value="${_esc(cfg.cidade)}" placeholder="Ex: Uberlândia - MG" />
        </div>
      </div>
      <div style="margin-top:16px;">
        <button class="btn-primary" onclick="saveProfileConfig()">💾 Salvar Perfil</button>
        <span id="cfgSaveMsg" style="margin-left:12px;font-size:13px;color:var(--green);display:none;">✓ Salvo com sucesso!</span>
      </div>
    </div>

    <!-- ── Segurança / Usuários (apenas admin) ── -->
    ${adminSection}
  `;
}

function _esc(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* Salva perfil do profissional */
window.saveProfileConfig = async function() {
  await saveConfig({
    nome:         document.getElementById('cfgNome').value.trim(),
    crp:          document.getElementById('cfgCrp').value.trim(),
    especialidade:document.getElementById('cfgEsp').value.trim(),
    contato:      document.getElementById('cfgContato').value.trim(),
    clinica:      document.getElementById('cfgClinica').value.trim(),
    cidade:       document.getElementById('cfgCidade').value.trim(),
  });
  const msg = document.getElementById('cfgSaveMsg');
  msg.style.display = 'inline';
  setTimeout(() => { msg.style.display = 'none'; }, 3000);
};

/* ── Gerenciamento de Usuários (admin) ── */
function renderUserManagement() {
  // Render with empty list first, then populate async
  setTimeout(async () => {
    const users = await getUsers();
    const listEl = document.getElementById('userList');
    if (listEl) listEl.innerHTML = users.map(u => renderUserRow(u)).join('');
  }, 50);
  return `
    <div class="config-section" id="sectionUsuarios">
      <div class="config-title">Gerenciamento de Usuários</div>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">
        Crie usuários, defina senhas e controle quais páginas cada um pode acessar.
      </p>

      <div id="userList"><div style="padding:16px;color:var(--text-muted);font-size:13px;">Carregando usuários...</div></div>

      <button class="btn-secondary" style="margin-top:16px;" onclick="showAddUserForm()">+ Novo Usuário</button>

      <!-- Formulário adicionar usuário (oculto inicialmente) -->
      <div id="addUserForm" style="display:none;" class="user-edit-form">
        <div class="config-title" style="font-size:14px;margin-bottom:12px;">Novo Usuário</div>
        <div class="config-grid">
          <div class="config-field">
            <label>Nome de exibição</label>
            <input type="text" id="newLabel" class="config-input" placeholder="Ex: Maria Auxiliar" />
          </div>
          <div class="config-field">
            <label>E-mail</label>
            <input type="email" id="newEmail" class="config-input" placeholder="Ex: maria@clinica.com" autocomplete="off" />
          </div>
          <div class="config-field">
            <label>Senha</label>
            <input type="password" id="newPassword" class="config-input" placeholder="Mínimo 4 caracteres" autocomplete="new-password" />
          </div>
          <div class="config-field">
            <label>Perfil</label>
            <select id="newRole" class="config-input">
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <div class="config-field" style="margin-top:12px;">
          <label>Páginas permitidas</label>
          <div class="pages-checkboxes" id="newPageChecks">
            ${ALL_PAGES.map(p => `
              <label class="page-check-item">
                <input type="checkbox" value="${p.id}" ${p.id === 'dashboard' ? 'checked' : ''} />
                ${p.icon} ${p.label}
              </label>`).join('')}
          </div>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;">
          <button class="btn-primary" onclick="submitAddUser()">Criar Usuário</button>
          <button class="btn-secondary" onclick="cancelAddUser()">Cancelar</button>
        </div>
        <div id="addUserError" class="login-error" style="margin-top:8px;"></div>
      </div>
    </div>
  `;
}

function renderUserRow(u) {
  const pageLabels = ALL_PAGES.filter(p => (u.pages||[]).includes(p.id)).map(p => p.label).join(', ') || '—';
  const roleBadge  = u.role === 'admin'
    ? '<span class="badge badge-blue">Admin</span>'
    : '<span class="badge badge-gray">Usuário</span>';
  const activeBadge = u.active
    ? '<span class="badge badge-green">Ativo</span>'
    : '<span class="badge badge-red">Inativo</span>';
  const isMe = getAuthUser() && getAuthUser().id === u.id;

  return `
    <div class="user-row" id="userrow-${u.id}">
      <div class="user-row-avatar">${(u.label||'?')[0].toUpperCase()}</div>
      <div class="user-row-info">
        <div class="user-row-name">${_esc(u.label)} ${isMe ? '<span style="font-size:11px;color:var(--text-muted)">(você)</span>' : ''}</div>
        <div class="user-row-meta">${_esc(u.email||'')} · ${pageLabels}</div>
      </div>
      <div class="user-row-badges">${roleBadge} ${activeBadge}</div>
      <div class="user-row-actions">
        <button class="btn-icon" onclick="editUser('${u.id}')" title="Editar">✏️</button>
        ${!isMe ? `<button class="btn-icon btn-icon-danger" onclick="confirmDeleteUser('${u.id}')" title="Remover">🗑️</button>` : ''}
      </div>
    </div>
  `;
}

/* ── Funções globais de gerenciamento ── */
window.showAddUserForm = function() {
  document.getElementById('addUserForm').style.display = 'block';
};
window.cancelAddUser = function() {
  document.getElementById('addUserForm').style.display = 'none';
  document.getElementById('addUserError').textContent = '';
};

window.submitAddUser = async function() {
  const label    = document.getElementById('newLabel').value.trim();
  const email    = document.getElementById('newEmail').value.trim().toLowerCase();
  const password = document.getElementById('newPassword').value;
  const role     = document.getElementById('newRole').value;
  const checks   = document.querySelectorAll('#newPageChecks input[type=checkbox]:checked');
  const pages    = Array.from(checks).map(c => c.value);
  const errEl    = document.getElementById('addUserError');
  errEl.textContent = '';

  if (!label)    { errEl.textContent = 'Informe o nome de exibição.';   return; }
  if (!email || !email.includes('@')) { errEl.textContent = 'Informe um e-mail válido.'; return; }
  if (!password || password.length < 4) { errEl.textContent = 'Senha muito curta (mín. 4 caracteres).'; return; }
  if (pages.length === 0) { errEl.textContent = 'Selecione ao menos uma página.'; return; }

  const existing = getUsers().find(u => u.email === email);
  if (existing) { errEl.textContent = 'Este e-mail já está cadastrado.'; return; }

  const res = await createUser({ label, email, password, role, pages });
  if (!res.ok) { errEl.textContent = res.message || "Erro ao criar usuário."; return; }
  const users = await getUsers();
  document.getElementById('userList').innerHTML = users.map(u => renderUserRow(u)).join('');
  document.getElementById('addUserForm').style.display = 'none';
  // Limpar campos
  ['newLabel','newEmail','newPassword'].forEach(id => document.getElementById(id).value = '');
  document.querySelectorAll('#newPageChecks input').forEach(c => { c.checked = c.value === 'dashboard'; });
};

window.editUser = function(id) {
  const u = getUserById(id);
  if (!u) return;
  const rowEl = document.getElementById('userrow-' + id);

  // Substituir a linha por formulário inline de edição
  rowEl.outerHTML = `
    <div class="user-edit-form" id="editform-${id}">
      <div class="config-title" style="font-size:14px;margin-bottom:12px;">Editar Usuário</div>
      <div class="config-grid">
        <div class="config-field">
          <label>Nome de exibição</label>
          <input type="text" id="edit_label_${id}" class="config-input" value="${_esc(u.label)}" />
        </div>
        <div class="config-field">
          <label>E-mail</label>
          <input type="email" id="edit_email_${id}" class="config-input" value="${_esc(u.email||'')}" autocomplete="off" />
        </div>
        <div class="config-field">
          <label>Nova senha <span style="font-weight:400;color:var(--text-muted)">(deixe em branco para manter)</span></label>
          <input type="password" id="edit_password_${id}" class="config-input" placeholder="Nova senha" autocomplete="new-password" />
        </div>
        <div class="config-field">
          <label>Perfil</label>
          <select id="edit_role_${id}" class="config-input">
            <option value="user"  ${u.role==='user'  ? 'selected':''}>Usuário</option>
            <option value="admin" ${u.role==='admin' ? 'selected':''}>Administrador</option>
          </select>
        </div>
        <div class="config-field">
          <label>Status</label>
          <select id="edit_active_${id}" class="config-input">
            <option value="true"  ${u.active ? 'selected':''}>Ativo</option>
            <option value="false" ${!u.active? 'selected':''}>Inativo</option>
          </select>
        </div>
      </div>
      <div class="config-field" style="margin-top:12px;">
        <label>Páginas permitidas</label>
        <div class="pages-checkboxes" id="edit_pages_${id}">
          ${ALL_PAGES.map(p => `
            <label class="page-check-item">
              <input type="checkbox" value="${p.id}" ${(u.pages||[]).includes(p.id) ? 'checked':''} />
              ${p.icon} ${p.label}
            </label>`).join('')}
        </div>
      </div>
      <div style="margin-top:12px;display:flex;gap:8px;">
        <button class="btn-primary" onclick="submitEditUser('${id}')">Salvar</button>
        <button class="btn-secondary" onclick="cancelEdit('${id}')">Cancelar</button>
      </div>
      <div id="editError_${id}" class="login-error" style="margin-top:8px;"></div>
    </div>`;
};

window.submitEditUser = async function(id) {
  const label    = document.getElementById('edit_label_' + id).value.trim();
  const email    = document.getElementById('edit_email_' + id).value.trim().toLowerCase();
  const password = document.getElementById('edit_password_' + id).value;
  const role     = document.getElementById('edit_role_' + id).value;
  const active   = document.getElementById('edit_active_' + id).value === 'true';
  const checks   = document.querySelectorAll(`#edit_pages_${id} input[type=checkbox]:checked`);
  const pages    = Array.from(checks).map(c => c.value);
  const errEl    = document.getElementById('editError_' + id);
  errEl.textContent = '';

  if (!label)    { errEl.textContent = 'Informe o nome.';   return; }
  if (!email || !email.includes('@')) { errEl.textContent = 'Informe um e-mail válido.'; return; }
  if (pages.length === 0) { errEl.textContent = 'Selecione ao menos uma página.'; return; }

  const duplicate = getUsers().find(u => u.email === email && u.id !== id);
  if (duplicate) { errEl.textContent = 'E-mail já cadastrado em outro usuário.'; return; }

  const res = await updateUser(id, { label, email, password, role, active, pages });
  if (res && !res.ok) { document.getElementById('editError_' + id).textContent = res.message || "Erro ao salvar."; return; }

  // Re-render lista
  const usersUpd = await getUsers();
  document.getElementById('userList').innerHTML = usersUpd.map(u => renderUserRow(u)).join('');
};

window.cancelEdit = async function(id) {
  const usersC = await getUsers();
  document.getElementById('userList').innerHTML = usersC.map(u => renderUserRow(u)).join('');
};

window.confirmDeleteUser = async function(id) {
  const u = await getUserById(id);
  if (!u) return;
  if (!confirm(`Remover o usuário "${u.label}"? Esta ação não pode ser desfeita.`)) return;
  const res = await deleteUser(id);
  if (!res.ok) { alert(res.message); return; }
  const usersDel = await getUsers();
  document.getElementById('userList').innerHTML = usersDel.map(u => renderUserRow(u)).join('');
};

/* ══════════════════════════
   REGISTRY
   ══════════════════════════ */
const PAGE_REGISTRY = {
  dashboard:  { title: "Dashboard",           subtitle: "Visão geral do sistema",       render: renderDashboard  },
  pacientes:  { title: "Pacientes",           subtitle: "Gerencie seus pacientes",      render: renderPacientes  },
  correcao:   { title: "Correção de Testes",  subtitle: "Selecione o instrumento",      render: renderCorrecao   },
  aplicacao:  { title: "Aplicação de Testes", subtitle: "Instrumentos de avaliação",    render: renderAplicacao  },
  relatorios: { title: "Relatórios",          subtitle: "Gerencie relatórios gerados",  render: renderRelatorios },
  checklist:  { title: "Checklist",           subtitle: "Testes disponíveis no sistema",render: renderChecklist  },
  config:     { title: "Configurações",       subtitle: "Preferências do sistema",      render: renderConfig     },
};
