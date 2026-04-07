/* ═══════════════════════════════════════════════════════════
   PACIENTES - VERSÃO ATUALIZADA
   Com suporte a testes como subcoleções no Firebase
   ═══════════════════════════════════════════════════════════ */

// Estado global
let pacientes = [];
let pacienteAtual = null;
let testesAtuais = [];

// Estrutura de testes organizados por faixa etária
const TESTES_POR_FAIXA = {
  'pre-escolar': {
    titulo: 'Pré-Escolar (0-6 anos)',
    categorias: [
      {
        nome: '🧠 Inteligência / Raciocínio',
        testes: [
          { id: 'son-r', nome: 'SON-R 2½-7', desc: 'Inteligência Não-Verbal', idade: '2a 6m – 7 anos' },
          { id: 'cpm-raven', nome: 'CPM-RAVEN', desc: 'Inteligência Não-Verbal (Fator G)', idade: '5 – 11 anos' },
          { id: 'columbia', nome: 'ESCALA COLUMBIA', desc: 'Maturidade Mental / Raciocínio', idade: '3a – 9a 11m' },
          { id: 'binaut', nome: 'ESCALA BINAUT', desc: 'Maturidade Mental', idade: '3 – 7 anos' },
        ]
      },
      {
        nome: '👶 Desenvolvimento Infantil',
        testes: [
          { id: 'idadi', nome: 'IDADI', desc: 'Desenvolvimento Infantil', idade: '4 – 72 meses' },
          { id: 'bayley', nome: 'BAYLEY-III', desc: 'Desenvolvimento Global', idade: '1 – 42 meses' },
          { id: 'vineland-pre', nome: 'VINELAND-3', desc: 'Comportamento Adaptativo', idade: '0 – 90 anos' },
        ]
      },
      {
        nome: '🧩 TEA / Autismo',
        testes: [
          { id: 'protea', nome: 'PROTEA-R-NV', desc: 'Sistema de Avaliação do TEA', idade: '2 – 5 anos' },
          { id: 'srs2-pre', nome: 'SRS-2 (Pré-Escolar)', desc: 'Responsividade e Habilidade Social', idade: '2a 5m – 4a 5m' },
          { id: 'mchat', nome: 'ESCALA M-CHAT', desc: 'Rastreio Precoce de Autismo', idade: '18 – 24 meses' },
          { id: 'ata', nome: 'ESCALA ATA', desc: 'Traços Autísticos (Rastreio)', idade: '2 – 18 anos' },
        ]
      },
      {
        nome: '⚡ TDAH / Comportamento',
        testes: [
          { id: 'snap-iv', nome: 'SNAP-IV', desc: 'Sintomas de TDAH e Opositor (TOD)', idade: '1 – 17 anos' },
          { id: 'etdah-pais', nome: 'ETDAH-PAIS', desc: 'Sintomas de TDAH (Visão dos Pais)', idade: '2 – 17 anos' },
          { id: 'abc-ica', nome: 'ESCALA ABC-ICA', desc: 'Comportamento Infantil', idade: '3 – 14 anos' },
        ]
      },
      {
        nome: '💬 Linguagem / Memória / Sensorial',
        testes: [
          { id: 'anele-pcfo', nome: 'ANELE Vol. 1 (PCFO)', desc: 'Consciência Fonológica', idade: '3 – 9 anos' },
          { id: 'time-r', nome: 'TIME-R (Kit Completo)', desc: 'Memória de Curto Prazo', idade: '3a – 6a 11m' },
          { id: 'perfil-sensorial-pre', nome: 'PERFIL SENSORIAL 2', desc: 'Processamento Sensorial', idade: '0 – 3a 11m' },
        ]
      },
    ]
  },
  'escolar': {
    titulo: 'Escolar (6-17 anos)',
    categorias: [
      {
        nome: '🧠 Inteligência / Raciocínio',
        testes: [
          { id: 'wisc-iv', nome: 'WISC-IV', desc: 'Escala de Inteligência (COMPLETA)', idade: '6 – 16 anos' },
          { id: 'wisc-abrev', nome: 'WISC-IV (Versão Abreviada)', desc: 'QI Estimado (2 subtestes)', idade: '6 – 16 anos' },
          { id: 'raven-escolar', nome: 'RAVEN (Escala Geral)', desc: 'Raciocínio Não-Verbal', idade: '5 – 11 anos' },
          { id: 'r2-forma-a', nome: 'R-2 FORMA A', desc: 'Raciocínio Não-Verbal (Figuras)', idade: '7 – 12 anos' },
          { id: 'r2-forma-b', nome: 'R-2 FORMA B', desc: 'Raciocínio Verbal (Cubos)', idade: '6 – 11 anos' },
        ]
      },
      {
        nome: '📚 Desempenho Acadêmico',
        testes: [
          { id: 'tde-ii', nome: 'TDE-II', desc: 'Teste de Desempenho Escolar', idade: '1º – 9º ano' },
          { id: 'prolec', nome: 'PROLEC', desc: 'Avaliação de Leitura', idade: '7 – 12 anos' },
        ]
      },
      {
        nome: '🧩 TEA / Autismo',
        testes: [
          { id: 'srs2-esc-masc', nome: 'SRS-2 (Escola - Masc)', desc: 'Responsividade Social', idade: '4a 6m – 18 anos' },
          { id: 'srs2-esc-fem', nome: 'SRS-2 (Escola - Fem)', desc: 'Responsividade Social', idade: '4a 6m – 18 anos' },
          { id: 'ados2-mod2', nome: 'ADOS-2 MÓDULO 2', desc: 'Avaliação Diagnóstica de TEA', idade: '3 – 10 anos' },
          { id: 'ados2-mod3', nome: 'ADOS-2 MÓDULO 3', desc: 'Avaliação Diagnóstica de TEA', idade: '11 – 16 anos' },
        ]
      },
      {
        nome: '⚡ TDAH / Comportamento',
        testes: [
          { id: 'etdah-crianca', nome: 'ETDAH-CRIANÇA', desc: 'TDAH (Autoavaliação)', idade: '6 – 11 anos' },
          { id: 'etdah-adolesc', nome: 'ETDAH-ADOLESCENTE', desc: 'TDAH (Autoavaliação)', idade: '12 – 17 anos' },
          { id: 'etcd-escolar', nome: 'ETCD', desc: 'Sintomas de TDAH, TOD e TC', idade: '6 – 17 anos' },
          { id: 'mta-snap-iv', nome: 'MTA-SNAP-IV', desc: 'TDAH e Comportamento Opositor', idade: 'Escolar' },
        ]
      },
      {
        nome: '🧠 Atenção / Funções Executivas',
        testes: [
          { id: 'fdt-escolar', nome: 'FDT (Cinco Dígitos)', desc: 'Flexibilidade Cognitiva', idade: '6 – 90 anos' },
          { id: 'torre-londres-esc', nome: 'TORRE DE LONDRES', desc: 'Planejamento', idade: '10 – 59 anos' },
          { id: 'stroop', nome: 'STROOP', desc: 'Controle Inibitório', idade: '6 – 89 anos' },
        ]
      },
      {
        nome: '💾 Memória',
        testes: [
          { id: 'ravlt-escolar', nome: 'RAVLT', desc: 'Memória Verbal (Lista de Palavras)', idade: '7 – 90 anos' },
          { id: 'figuras-complexas', nome: 'FIGURAS COMPLEXAS REY', desc: 'Memória Visual', idade: '5 – 88 anos' },
        ]
      },
    ]
  },
  'adultos': {
    titulo: 'Adultos (18+ anos)',
    categorias: [
      {
        nome: '🧠 Inteligência / Raciocínio',
        testes: [
          { id: 'wais-iii', nome: 'WAIS-III', desc: 'Escala de Inteligência (COMPLETA)', idade: '16 – 89 anos' },
          { id: 'wais-abrev', nome: 'WAIS-III (Versão Abreviada)', desc: 'QI Estimado', idade: '16 – 89 anos' },
          { id: 'wmt-2', nome: 'WMT-2 (Matrizes de Viena)', desc: 'Inteligência Geral', idade: '7 – 80+ anos' },
        ]
      },
      {
        nome: '💾 Memória',
        testes: [
          { id: 'ravlt', nome: 'RAVLT', desc: 'Memória Verbal (Lista de Palavras)', idade: '7 – 90 anos' },
          { id: 'figuras-rey', nome: 'FIGURAS COMPLEXAS REY', desc: 'Memória Visual', idade: '5 – 88 anos' },
        ]
      },
      {
        nome: '🧠 Funções Executivas / Atenção',
        testes: [
          { id: 'fdt', nome: 'FDT (Cinco Dígitos)', desc: 'Flexibilidade Cognitiva', idade: '6 – 90 anos' },
          { id: 'torre-londres', nome: 'TORRE DE LONDRES', desc: 'Planejamento e Resolução de Problemas', idade: '10 – 59 anos' },
        ]
      },
      {
        nome: '📖 Linguagem',
        testes: [
          { id: 'tlpp', nome: 'ANELE Vol. 4 (TLPP)', desc: 'Leitura de Palavras/Pseudopalavras', idade: '6 – 85 anos' },
        ]
      },
      {
        nome: '🧩 TEA / Autismo',
        testes: [
          { id: 'srs2-adulto', nome: 'SRS-2 (Adulto)', desc: 'Responsividade Social', idade: '19+ anos' },
          { id: 'cat-q', nome: 'CAT-Q', desc: 'Camuflagem de Traços Autísticos', idade: '16+ anos' },
          { id: 'raads-r', nome: 'RAADS-R-BR SCREEN', desc: 'Rastreio de Autismo', idade: '16+ anos' },
          { id: 'qa16', nome: 'QA16+', desc: 'Rastreio de Autismo', idade: '16+ anos' },
          { id: 'cambridge', nome: 'ESC. DE CAMBRIDGE', desc: 'Empatia vs. Sistematização', idade: 'Adultos' },
        ]
      },
      {
        nome: '⚡ TDAH',
        testes: [
          { id: 'asrs-18', nome: 'ASRS-18', desc: 'TDAH (Rastreio OMS)', idade: '18+ anos' },
          { id: 'baars-iv', nome: 'BAARS-IV', desc: 'TDAH (Protocolo Barkley)', idade: '18+ anos' },
          { id: 'etdah-ad', nome: 'ETDAH-AD', desc: 'TDAH (Autoavaliação)', idade: '12 – 87 anos' },
        ]
      },
      {
        nome: '💭 Humor / Ansiedade / Depressão',
        testes: [
          { id: 'bai', nome: 'BAI', desc: 'Sintomas de Ansiedade', idade: '17 – 80 anos' },
          { id: 'bdi-ii', nome: 'BDI-II', desc: 'Sintomas de Depressão', idade: '13 – 80 anos' },
          { id: 'ebadep-a', nome: 'EBADEP-A', desc: 'Sintomas de Depressão', idade: 'Adultos' },
        ]
      },
      {
        nome: '🎭 Personalidade / Habilidades Sociais',
        testes: [
          { id: 'bfp', nome: 'BFP', desc: 'Personalidade', idade: '16+ anos' },
          { id: 'ihs-2', nome: 'IHS-2', desc: 'Habilidades Sociais', idade: '16+ anos' },
          { id: 'vineland-adulto', nome: 'VINELAND-3', desc: 'Comportamento Adaptativo', idade: '0 – 90 anos' },
        ]
      },
    ]
  }
};

/* ═══════════════════════════════════
   CARREGAR PACIENTES
   ═══════════════════════════════════ */
async function carregarPacientes() {
  try {
    let todos = await DB.getPacientes();

    // Filtrar por profissional logado (admins veem todos)
    const user = typeof getAuthUser === "function" ? getAuthUser() : null;
    if (user && user.role !== "admin" && user.id) {
      todos = todos.filter(p => p.criadoPor === user.id || !p.criadoPor);
    }

    pacientes = todos;

    // Carregar contadores de testes para cada paciente (em paralelo)
    await Promise.all(pacientes.map(async (paciente) => {
      const contadores = await DB.contarTestesPaciente(paciente.id);
      paciente.contadorTestes = contadores;
    }));

    renderizarListaPacientes();
  } catch (error) {
    console.error('Erro ao carregar pacientes:', error);
    mostrarMensagem('Erro ao carregar pacientes', 'error');
  }
}

function renderizarListaPacientes() {
  const container = document.getElementById('pacientesList');
  
  if (pacientes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👤</div>
        <div class="empty-title">Nenhum paciente cadastrado</div>
        <div class="empty-desc">Clique em "Novo Paciente" para começar</div>
      </div>
    `;
    return;
  }

  const html = `
    <table class="pacientes-table">
      <thead>
        <tr>
          <th>Paciente</th>
          <th>Idade</th>
          <th>Testes Selecionados</th>
          <th>Testes Realizados</th>
          <th class="center">Ações</th>
        </tr>
      </thead>
      <tbody>
        ${pacientes.map(p => {
          const idade = calcularIdade(p.dataNascimento);
          const testesSeleccionados = p.testesSeleccionados || [];
          const contadores = p.contadorTestes || { total: 0, corrigidos: 0 };
          
          return `
            <tr onclick="abrirDetalhesPaciente('${p.id}')">
              <td>
                <div class="paciente-nome">${p.nome}</div>
                <div class="paciente-meta">${p.cpf || 'CPF não informado'}</div>
              </td>
              <td>${idade}</td>
              <td>
                <span class="testes-count ${testesSeleccionados.length === 0 ? 'zero' : ''}">
                  ${testesSeleccionados.length} ${testesSeleccionados.length === 1 ? 'teste' : 'testes'}
                </span>
              </td>
              <td>
                <span class="testes-count ${contadores.corrigidos === 0 ? 'zero' : ''}">
                  ${contadores.corrigidos} ${contadores.corrigidos === 1 ? 'corrigido' : 'corrigidos'}
                </span>
              </td>
              <td class="center">
                <button class="btn-table-action" onclick="event.stopPropagation(); editarPaciente('${p.id}')" title="Editar">
                  ✏️
                </button>
                <button class="btn-table-action btn-danger" onclick="event.stopPropagation(); excluirPaciente('${p.id}')" title="Excluir">
                  🗑️
                </button>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
}

/* ═══════════════════════════════════
   FILTRAR PACIENTES
   ═══════════════════════════════════ */
function filtrarPacientes() {
  const termo = document.getElementById('searchInput').value.toLowerCase();
  const linhas = document.querySelectorAll('.pacientes-table tbody tr');
  
  linhas.forEach(linha => {
    const texto = linha.textContent.toLowerCase();
    linha.style.display = texto.includes(termo) ? '' : 'none';
  });
}

/* ═══════════════════════════════════
   MODAL NOVO/EDITAR PACIENTE
   ═══════════════════════════════════ */
function abrirModalNovoPaciente() {
  document.getElementById('modalTitle').textContent = 'Novo Paciente';
  document.getElementById('formPaciente').reset();
  document.getElementById('inputPacienteId').value = '';
  document.getElementById('modalPaciente').classList.add('active');
}

function editarPaciente(id) {
  const paciente = pacientes.find(p => p.id === id);
  if (!paciente) return;

  document.getElementById('modalTitle').textContent = 'Editar Paciente';
  document.getElementById('inputPacienteId').value = paciente.id;
  document.getElementById('inputNome').value = paciente.nome || '';
  document.getElementById('inputCpf').value = paciente.cpf || '';
  document.getElementById('inputDataNasc').value = paciente.dataNascimento || '';
  document.getElementById('inputTelefone').value = paciente.telefone || '';
  document.getElementById('inputEmail').value = paciente.email || '';
  document.getElementById('inputHipoteses').value = paciente.hipoteses || '';
  document.getElementById('inputObservacoes').value = paciente.observacoes || '';
  
  document.getElementById('modalPaciente').classList.add('active');
}

function fecharModalPaciente() {
  document.getElementById('modalPaciente').classList.remove('active');
  document.getElementById('formPaciente').reset();
}

async function salvarPaciente(event) {
  event.preventDefault();
  
  const id = document.getElementById('inputPacienteId').value;
  const dados = {
    nome: document.getElementById('inputNome').value.trim(),
    cpf: document.getElementById('inputCpf').value.trim(),
    dataNascimento: document.getElementById('inputDataNasc').value,
    telefone: document.getElementById('inputTelefone').value.trim(),
    email: document.getElementById('inputEmail').value.trim(),
    hipoteses: document.getElementById('inputHipoteses').value.trim(),
    observacoes: document.getElementById('inputObservacoes').value.trim(),
  };

  // Preservar testes selecionados se estiver editando
  if (id) {
    const pacienteExistente = pacientes.find(p => p.id === id);
    if (pacienteExistente) {
      dados.testesSeleccionados = pacienteExistente.testesSeleccionados || [];
    }
  } else {
    dados.testesSeleccionados = [];
  }

  try {
    const resultado = await DB.savePaciente(dados, id || null);
    
    if (resultado.ok) {
      mostrarMensagem(id ? 'Paciente atualizado com sucesso!' : 'Paciente cadastrado com sucesso!', 'success');
      fecharModalPaciente();
      await carregarPacientes();
    } else {
      mostrarMensagem('Erro ao salvar paciente', 'error');
    }
  } catch (error) {
    console.error('Erro ao salvar paciente:', error);
    mostrarMensagem('Erro ao salvar paciente', 'error');
  }
}

async function excluirPaciente(id) {
  const paciente = pacientes.find(p => p.id === id);
  if (!paciente) return;
  
  // Verificar se há testes salvos
  const contadores = await DB.contarTestesPaciente(id);
  
  let mensagem = `Tem certeza que deseja excluir o paciente "${paciente.nome}"?`;
  if (contadores.total > 0) {
    mensagem += `\n\nATENÇÃO: Este paciente possui ${contadores.total} teste(s) salvo(s) que também serão excluídos.`;
  }
  
  if (!confirm(mensagem)) {
    return;
  }

  try {
    const resultado = await DB.deletePaciente(id);
    
    if (resultado.ok) {
      mostrarMensagem('Paciente excluído com sucesso!', 'success');
      await carregarPacientes();
    } else {
      mostrarMensagem('Erro ao excluir paciente', 'error');
    }
  } catch (error) {
    console.error('Erro ao excluir paciente:', error);
    mostrarMensagem('Erro ao excluir paciente', 'error');
  }
}

/* ═══════════════════════════════════
   MODAL DETALHES DO PACIENTE
   ═══════════════════════════════════ */
async function abrirDetalhesPaciente(id) {
  const paciente = pacientes.find(p => p.id === id);
  if (!paciente) return;

  pacienteAtual = paciente;
  
  // Carregar testes do paciente do Firebase
  testesAtuais = await DB.getTestesPaciente(paciente.id);
  
  // Preencher informações do cabeçalho
  const iniciais = paciente.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('detalhesAvatar').textContent = iniciais;
  document.getElementById('detalhesPacienteNome').textContent = paciente.nome;
  document.getElementById('detalhesNomeCompleto').textContent = paciente.nome;
  document.getElementById('detalhesIdade').textContent = calcularIdade(paciente.dataNascimento);
  document.getElementById('detalhesCpf').textContent = paciente.cpf || 'CPF não informado';
  document.getElementById('detalhesTelefone').textContent = paciente.telefone || '';
  document.getElementById('detalhesEmail').textContent = paciente.email || '';

  // Preencher tabs
  renderizarTestesSeleccionados();
  renderizarTestesRealizados();
  renderizarInformacoes();

  // Mostrar modal
  document.getElementById('modalDetalhesPaciente').classList.add('active');
}

function fecharModalDetalhes() {
  document.getElementById('modalDetalhesPaciente').classList.remove('active');
  pacienteAtual = null;
  testesAtuais = [];
}

function editarPacienteAtual() {
  if (!pacienteAtual) return;
  fecharModalDetalhes();
  editarPaciente(pacienteAtual.id);
}

async function excluirPacienteAtual() {
  if (!pacienteAtual) return;
  fecharModalDetalhes();
  await excluirPaciente(pacienteAtual.id);
}

/* ═══════════════════════════════════
   TABS DO MODAL DE DETALHES
   ═══════════════════════════════════ */
function trocarTab(tabName) {
  // Remover active de todas as tabs e conteúdos
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  // Ativar tab clicada
  event.target.classList.add('active');
  
  // Ativar conteúdo correspondente
  const tabMap = {
    'testes': 'tabTestes',
    'realizados': 'tabRealizados',
    'info': 'tabInfo'
  };
  
  document.getElementById(tabMap[tabName]).classList.add('active');
}

/* ═══════════════════════════════════
   TESTES SELECIONADOS
   ═══════════════════════════════════ */
function renderizarTestesSeleccionados() {
  const container = document.getElementById('listaTestesSeleccionados');
  const testes = pacienteAtual.testesSeleccionados || [];

  if (testes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">Nenhum teste selecionado</div>
        <div class="empty-desc">Clique em "Adicionar Testes" para selecionar os instrumentos</div>
      </div>
    `;
    return;
  }

  const html = testes.map(testeId => {
    const testeInfo = buscarInfoTeste(testeId);
    if (!testeInfo) return '';

    // Verificar se já existe teste salvo deste tipo
    const testeSalvo = testesAtuais.find(t => t.tipo === testeId);
    const statusClass = testeSalvo ? (testeSalvo.status === 'corrigido' ? 'corrigido' : 'em-andamento') : '';

    return `
      <div class="teste-card ${statusClass}">
        <div class="teste-card-header">
          <div class="teste-nome">${testeInfo.nome}</div>
          <span class="teste-faixa ${testeInfo.faixa}">${testeInfo.faixaTitulo}</span>
        </div>
        <div class="teste-desc">${testeInfo.desc} • ${testeInfo.idade}</div>
        ${testeSalvo ? `
          <div class="teste-status">
            ${testeSalvo.status === 'corrigido' ? '✅ Corrigido' : '⏳ Em andamento'}
            ${testeSalvo.dataCorrecao ? ` • ${formatarData(testeSalvo.dataCorrecao.toDate())}` : ''}
          </div>
        ` : ''}
        <div class="teste-actions">
          <button class="btn-sm btn-aplicar" onclick="aplicarTeste('${testeId}')">
            🧠 ${testeSalvo ? 'Ver/Editar' : 'Aplicar'}
          </button>
          <button class="btn-sm btn-corrigir" onclick="corrigirTeste('${testeId}')">
            ✏️ Corrigir
          </button>
          <button class="btn-sm btn-remover-teste" onclick="removerTesteSeleccionado('${testeId}')">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function buscarInfoTeste(testeId) {
  for (const faixa in TESTES_POR_FAIXA) {
    const dados = TESTES_POR_FAIXA[faixa];
    for (const categoria of dados.categorias) {
      const teste = categoria.testes.find(t => t.id === testeId);
      if (teste) {
        return {
          ...teste,
          faixa: faixa,
          faixaTitulo: faixa === 'pre-escolar' ? 'Pré-Escolar' : 
                       faixa === 'escolar' ? 'Escolar' : 'Adultos'
        };
      }
    }
  }
  return null;
}

async function removerTesteSeleccionado(testeId) {
  if (!pacienteAtual) return;

  // Verificar se há teste salvo deste tipo
  const testeSalvo = testesAtuais.find(t => t.tipo === testeId);
  
  let mensagem = 'Deseja remover este teste da lista?';
  if (testeSalvo) {
    mensagem = 'Este teste possui dados salvos. Deseja removê-lo da lista?\n\nOs dados salvos do teste serão mantidos na aba "Testes Realizados".';
  }
  
  if (!confirm(mensagem)) {
    return;
  }

  const testes = pacienteAtual.testesSeleccionados || [];
  const novosTestes = testes.filter(id => id !== testeId);

  try {
    await DB.savePaciente(
      { testesSeleccionados: novosTestes },
      pacienteAtual.id
    );
    
    pacienteAtual.testesSeleccionados = novosTestes;
    renderizarTestesSeleccionados();
    await carregarPacientes();
    mostrarMensagem('Teste removido da seleção!', 'success');
  } catch (error) {
    console.error('Erro ao remover teste:', error);
    mostrarMensagem('Erro ao remover teste', 'error');
  }
}

/* ── Mapeamento de teste ID → rota direta ── */
const ROTAS_APLICACAO = {
  'srs2-pre':        '/Aplicacao_testes/SRS2/Pre-escolar/',
  'srs2-esc-masc':   '/Aplicacao_testes/SRS2/idade-escolar-masculino/',
  'srs2-esc-fem':    '/Aplicacao_testes/SRS2/idade-escolar-feminino/',
  'srs2-adulto':     '/Aplicacao_testes/SRS2/adulto-autorelato/',
  'raads-r':         '/Aplicacao_testes/RAADS-R/',
  'cat-q':           '/Aplicacao_testes/CAT_Q/',
  'bfp':             '/Aplicacao_testes/BFP/',
  'vineland-pre':    '/Aplicacao_testes/Vineland3/pais-cuidadores/',
  'vineland-adulto': '/Aplicacao_testes/Vineland3/pais-cuidadores/',
};

const ROTAS_CORRECAO = {
  'wais-iii':        '/Correcao_testes/WAIS/novo-laudo.html',
  'wisc-iv':         '/Correcao_testes/WISC_IV/novo-laudo.html',
  'srs2-pre':        '/Correcao_testes/SRS2/Pre-escolar/',
  'srs2-esc-masc':   '/Correcao_testes/SRS2/idade-escolar-masculino/',
  'srs2-esc-fem':    '/Correcao_testes/SRS2/idade-escolar-feminino/',
  'srs2-adulto':     '/Correcao_testes/SRS2/adulto-autorelato/',
  'raads-r':         '/Correcao_testes/RAADS-R/',
  'vineland-pre':    '/Correcao_testes/Vineland3/',
  'vineland-adulto': '/Correcao_testes/Vineland3/',
};

function aplicarTeste(testeId) {
  const testeInfo = buscarInfoTeste(testeId);
  if (!testeInfo) return;

  // Armazenar informações para uso na página de aplicação
  sessionStorage.setItem('pacienteAtual', JSON.stringify(pacienteAtual));
  sessionStorage.setItem('testeAtual', testeId);
  sessionStorage.setItem('testeNome', testeInfo.nome);

  // Redirecionar diretamente ao teste se rota conhecida
  const rota = ROTAS_APLICACAO[testeId];
  window.location.href = rota || '/Aplicacao_testes/index.html';
}

function corrigirTeste(testeId) {
  const testeInfo = buscarInfoTeste(testeId);
  if (!testeInfo) return;

  // Armazenar informações para uso na página de correção
  sessionStorage.setItem('pacienteAtual', JSON.stringify(pacienteAtual));
  sessionStorage.setItem('testeAtual', testeId);
  sessionStorage.setItem('testeNome', testeInfo.nome);

  // Redirecionar diretamente ao teste se rota conhecida
  const rota = ROTAS_CORRECAO[testeId];
  window.location.href = rota || '/Correcao_testes/index.html';
}

/* ═══════════════════════════════════
   TESTES REALIZADOS (da subcoleção)
   ═══════════════════════════════════ */
function renderizarTestesRealizados() {
  const container = document.getElementById('listaTestesRealizados');
  
  // Filtrar apenas testes corrigidos
  const testesCorrigidos = testesAtuais.filter(t => t.status === 'corrigido');

  if (testesCorrigidos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✅</div>
        <div class="empty-title">Nenhum teste corrigido ainda</div>
        <div class="empty-desc">Os testes aplicados e corrigidos aparecerão aqui</div>
      </div>
    `;
    return;
  }

  const html = testesCorrigidos.map(teste => {
    const testeInfo = buscarInfoTeste(teste.tipo);
    const nomeExibicao = testeInfo ? testeInfo.nome : teste.tipo;
    const dataAplicacao = teste.dataAplicacao ? formatarData(teste.dataAplicacao.toDate()) : 'Data não registrada';
    const dataCorrecao = teste.dataCorrecao ? formatarData(teste.dataCorrecao.toDate()) : dataAplicacao;
    
    return `
      <div class="teste-realizado">
        <div class="teste-realizado-info">
          <h5>${nomeExibicao}</h5>
          <div class="teste-realizado-meta">
            Aplicado em ${dataAplicacao} • Corrigido em ${dataCorrecao}
            ${teste.resultados?.resumo ? ` • ${teste.resultados.resumo}` : ''}
          </div>
          ${teste.observacoes ? `
            <div class="teste-observacoes">${teste.observacoes}</div>
          ` : ''}
        </div>
        <div class="teste-realizado-acoes">
          <button class="btn-sm btn-secondary" onclick="visualizarTeste('${teste.id}')">
            👁️ Visualizar
          </button>
          <button class="btn-sm btn-primary" onclick="editarTesteSalvo('${teste.id}')">
            ✏️ Editar
          </button>
          <button class="btn-sm btn-danger" onclick="excluirTesteSalvo('${teste.id}')">
            🗑️ Excluir
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function visualizarTeste(testeId) {
  const teste = testesAtuais.find(t => t.id === testeId);
  if (!teste) return;
  
  // Implementar visualização detalhada do teste
  alert('Visualização detalhada em desenvolvimento\n\nTeste: ' + teste.tipo + '\nStatus: ' + teste.status);
}

function editarTesteSalvo(testeId) {
  const teste = testesAtuais.find(t => t.id === testeId);
  if (!teste) return;
  
  // Redirecionar para página de correção com ID do teste
  sessionStorage.setItem('pacienteAtual', JSON.stringify(pacienteAtual));
  sessionStorage.setItem('testeAtual', teste.tipo);
  sessionStorage.setItem('testeId', testeId);
  
  window.location.href = '/Correcao_testes/index.html';
}

async function excluirTesteSalvo(testeId) {
  if (!confirm('Tem certeza que deseja excluir este teste? Esta ação não pode ser desfeita.')) {
    return;
  }

  try {
    await DB.deletarTestePaciente(pacienteAtual.id, testeId);
    
    // Atualizar lista local
    testesAtuais = testesAtuais.filter(t => t.id !== testeId);
    
    renderizarTestesRealizados();
    renderizarTestesSeleccionados(); // Atualizar também a aba de selecionados
    await carregarPacientes(); // Atualizar contadores
    
    mostrarMensagem('Teste excluído com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao excluir teste:', error);
    mostrarMensagem('Erro ao excluir teste', 'error');
  }
}

/* ═══════════════════════════════════
   INFORMAÇÕES DO PACIENTE
   ═══════════════════════════════════ */
function renderizarInformacoes() {
  document.getElementById('infoHipoteses').textContent = pacienteAtual.hipoteses || 'Não informado';
  document.getElementById('infoObservacoes').textContent = pacienteAtual.observacoes || 'Não informado';
  
  const criadoEm = pacienteAtual.criadoEm ? formatarData(pacienteAtual.criadoEm.toDate()) : 'Não disponível';
  const atualizadoEm = pacienteAtual.atualizadoEm ? formatarData(pacienteAtual.atualizadoEm.toDate()) : 'Não disponível';
  
  document.getElementById('infoCriadoEm').textContent = criadoEm;
  document.getElementById('infoAtualizadoEm').textContent = atualizadoEm;
}

/* ═══════════════════════════════════
   SELETOR DE TESTES
   ═══════════════════════════════════ */
function abrirSeletorTestes() {
  renderizarTestesDisponiveis();
  document.getElementById('modalSeletorTestes').classList.add('active');
}

function fecharSeletorTestes() {
  document.getElementById('modalSeletorTestes').classList.remove('active');
}

function trocarFaixa(faixaNome) {
  document.querySelectorAll('.faixa-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.faixa-content').forEach(c => c.classList.remove('active'));

  event.target.classList.add('active');
  
  const faixaMap = {
    'pre-escolar': 'faixaPreEscolar',
    'escolar': 'faixaEscolar',
    'adultos': 'faixaAdultos'
  };
  
  document.getElementById(faixaMap[faixaNome]).classList.add('active');
}

function renderizarTestesDisponiveis() {
  const testesSelecionados = pacienteAtual.testesSeleccionados || [];

  for (const faixa in TESTES_POR_FAIXA) {
    const dados = TESTES_POR_FAIXA[faixa];
    const containerId = `testes${faixa.charAt(0).toUpperCase() + faixa.slice(1).replace('-', '')}`;
    const container = document.getElementById(containerId);

    if (!container) continue;

    let html = '';

    dados.categorias.forEach(categoria => {
      html += `<div class="categoria-header">${categoria.nome}</div>`;

      categoria.testes.forEach(teste => {
        const checked = testesSelecionados.includes(teste.id) ? 'checked' : '';
        
        html += `
          <div class="teste-checkbox-item">
            <input 
              type="checkbox" 
              id="teste-${teste.id}" 
              value="${teste.id}"
              ${checked}
            />
            <label for="teste-${teste.id}" class="teste-checkbox-info">
              <div class="teste-checkbox-nome">${teste.nome}</div>
              <div class="teste-checkbox-desc">${teste.desc}</div>
              <div class="teste-checkbox-idade">Faixa etária: ${teste.idade}</div>
            </label>
          </div>
        `;
      });
    });

    container.innerHTML = html;
  }
}

async function salvarTestesSeleccionados() {
  if (!pacienteAtual) return;

  const checkboxes = document.querySelectorAll('#modalSeletorTestes input[type="checkbox"]:checked');
  const testesIds = Array.from(checkboxes).map(cb => cb.value);

  try {
    await DB.savePaciente(
      { testesSeleccionados: testesIds },
      pacienteAtual.id
    );
    
    pacienteAtual.testesSeleccionados = testesIds;
    renderizarTestesSeleccionados();
    fecharSeletorTestes();
    await carregarPacientes();
    mostrarMensagem('Testes atualizados com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao salvar testes:', error);
    mostrarMensagem('Erro ao salvar testes', 'error');
  }
}

/* ═══════════════════════════════════
   UTILITÁRIOS
   ═══════════════════════════════════ */
function calcularIdade(dataNascimento) {
  if (!dataNascimento) return '-';
  
  const nascimento = new Date(dataNascimento + 'T00:00:00');
  const hoje = new Date();
  
  let anos = hoje.getFullYear() - nascimento.getFullYear();
  let meses = hoje.getMonth() - nascimento.getMonth();
  let dias = hoje.getDate() - nascimento.getDate();
  
  if (dias < 0) {
    meses--;
    dias += new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate();
  }
  
  if (meses < 0) {
    anos--;
    meses += 12;
  }
  
  if (anos > 0) {
    return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  } else if (meses > 0) {
    return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  } else {
    return `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  }
}

function formatarData(data) {
  if (!data) return '-';
  
  const d = typeof data === 'string' ? new Date(data) : data;
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  
  return `${dia}/${mes}/${ano}`;
}

function mostrarMensagem(texto, tipo = 'success') {
  const notificacao = document.createElement('div');
  notificacao.className = `notificacao notificacao-${tipo}`;
  notificacao.textContent = texto;
  notificacao.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    padding: 16px 24px;
    background: ${tipo === 'success' ? 'var(--green)' : 'var(--red)'};
    color: white;
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    z-index: 10000;
    font-weight: 600;
    font-size: 14px;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(notificacao);

  setTimeout(() => {
    notificacao.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notificacao.remove(), 300);
  }, 3000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
  .teste-card.corrigido {
    border-color: var(--green);
    background: var(--green-light);
  }
  .teste-card.em-andamento {
    border-color: var(--amber);
    background: var(--amber-light);
  }
  .teste-status {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--border);
  }
  .teste-observacoes {
    font-size: 13px;
    color: var(--text-muted);
    font-style: italic;
    margin-top: 8px;
    padding: 8px;
    background: rgba(0,0,0,0.02);
    border-radius: 6px;
  }
`;
document.head.appendChild(style);

/* ═══════════════════════════════════
   MÁSCARAS DE INPUT
   ═══════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const inputCpf = document.getElementById('inputCpf');
  if (inputCpf) {
    inputCpf.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = value;
    });
  }

  const inputTelefone = document.getElementById('inputTelefone');
  if (inputTelefone) {
    inputTelefone.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length <= 10) {
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{4})(\d)/, '$1-$2');
      } else {
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
      }
      e.target.value = value;
    });
  }
});
