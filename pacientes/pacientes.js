// =====================================================
// PACIENTES.JS - EQUILIBRIUM NEURO
// Sistema completo de gerenciamento de pacientes
// =====================================================

// Variáveis Globais
let pacientes = [];
let pacienteAtual = null;
let filtros = {
    busca: '',
    status: 'todos'
};

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema de Pacientes Iniciado');
    
    // Carregar nome do usuário
    const user = localStorage.getItem('currentUser');
    if (user) {
        const userData = JSON.parse(user);
        document.getElementById('userName').textContent = userData.nome || 'Usuário';
    }
    
    // Aguardar Firebase autenticar
    setTimeout(() => {
        carregarPacientes();
    }, 1000);
});

// ==================== FIREBASE - CRUD ====================

async function carregarPacientes() {
    try {
        const db = firebase.firestore();
        const user = firebase.auth().currentUser;
        
        if (!user) {
            console.warn('⚠️ Usuário não autenticado ainda...');
            setTimeout(carregarPacientes, 500);
            return;
        }
        
        console.log('📥 Carregando pacientes do Firebase...');
        
        const snapshot = await db.collection('pacientes')
            .where('userId', '==', user.uid)
            .orderBy('criadoEm', 'desc')
            .get();
        
        pacientes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log(`✅ ${pacientes.length} pacientes carregados`);
        
        atualizarEstatisticas();
        renderizarTabela();
        
    } catch (error) {
        console.error('❌ Erro ao carregar pacientes:', error);
        
        // Se erro de permissão, mostrar alerta
        if (error.code === 'permission-denied') {
            alert('⚠️ Erro de permissão no Firebase.\n\nVerifique as regras de segurança no Firestore.');
        }
    }
}

async function salvarPaciente(event) {
    event.preventDefault();
    
    const pacienteId = document.getElementById('pacienteId').value;
    const db = firebase.firestore();
    const user = firebase.auth().currentUser;
    
    const pacienteData = {
        nome: document.getElementById('nome').value,
        cpf: document.getElementById('cpf').value || null,
        dataNascimento: document.getElementById('dataNascimento').value || null,
        telefone: document.getElementById('telefone').value || null,
        email: document.getElementById('email').value || null,
        responsavel: document.getElementById('responsavel').value || null,
        observacoes: document.getElementById('observacoes').value || null,
        status: 'ativo',
        userId: user.uid,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (pacienteId) {
            // Atualizar paciente existente
            await db.collection('pacientes').doc(pacienteId).update(pacienteData);
            mostrarNotificacao('✅ Paciente atualizado com sucesso!', 'success');
        } else {
            // Criar novo paciente
            pacienteData.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('pacientes').add(pacienteData);
            mostrarNotificacao('✅ Paciente cadastrado com sucesso!', 'success');
        }
        
        fecharModal();
        carregarPacientes();
        
    } catch (error) {
        console.error('❌ Erro ao salvar paciente:', error);
        mostrarNotificacao('❌ Erro ao salvar paciente', 'error');
    }
}

async function excluirPaciente(id, nome) {
    if (!confirm(`Tem certeza que deseja excluir o paciente "${nome}"?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        const db = firebase.firestore();
        await db.collection('pacientes').doc(id).delete();
        
        mostrarNotificacao('✅ Paciente excluído com sucesso!', 'success');
        carregarPacientes();
        
    } catch (error) {
        console.error('❌ Erro ao excluir paciente:', error);
        mostrarNotificacao('❌ Erro ao excluir paciente', 'error');
    }
}

// ==================== RENDERIZAÇÃO ====================

function renderizarTabela() {
    const tbody = document.getElementById('listaPacientes');
    const emptyState = document.getElementById('emptyState');
    
    // Aplicar filtros
    let pacientesFiltrados = pacientes;
    
    if (filtros.busca) {
        const busca = filtros.busca.toLowerCase();
        pacientesFiltrados = pacientesFiltrados.filter(p =>
            (p.nome && p.nome.toLowerCase().includes(busca)) ||
            (p.cpf && p.cpf.includes(busca)) ||
            (p.telefone && p.telefone.includes(busca))
        );
    }
    
    if (filtros.status !== 'todos') {
        pacientesFiltrados = pacientesFiltrados.filter(p => p.status === filtros.status);
    }
    
    // Verificar se há pacientes
    if (pacientesFiltrados.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Renderizar linhas
    tbody.innerHTML = pacientesFiltrados.map(paciente => {
        const dataNasc = paciente.dataNascimento 
            ? new Date(paciente.dataNascimento).toLocaleDateString('pt-BR')
            : '-';
        
        const statusClass = paciente.status === 'ativo' ? 'ativo' : 'inativo';
        const statusText = paciente.status === 'ativo' ? 'Ativo' : 'Inativo';
        
        return `
            <tr>
                <td><strong>${paciente.nome}</strong></td>
                <td>${paciente.cpf || '-'}</td>
                <td>${paciente.telefone || '-'}</td>
                <td>${dataNasc}</td>
                <td><span class="badge">0</span></td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="action-btn view" onclick="visualizarPaciente('${paciente.id}')" title="Visualizar">
                        👁️
                    </button>
                    <button class="action-btn edit" onclick="editarPaciente('${paciente.id}')" title="Editar">
                        ✏️
                    </button>
                    <button class="action-btn tests" onclick="abrirTestes('${paciente.id}')" title="Testes">
                        📋
                    </button>
                    <button class="action-btn delete" onclick="excluirPaciente('${paciente.id}', '${paciente.nome}')" title="Excluir">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function atualizarEstatisticas() {
    const total = pacientes.length;
    const ativos = pacientes.filter(p => p.status === 'ativo').length;
    const testes = 0; // Será implementado quando integrarmos com testes
    
    document.getElementById('totalPacientes').textContent = total;
    document.getElementById('pacientesAtivos').textContent = ativos;
    document.getElementById('testesRealizados').textContent = testes;
}

// ==================== MODAL - PACIENTE ====================

function abrirModalNovo() {
    document.getElementById('modalTitle').textContent = 'Novo Paciente';
    document.getElementById('formPaciente').reset();
    document.getElementById('pacienteId').value = '';
    document.getElementById('modalPaciente').classList.add('active');
}

function editarPaciente(id) {
    const paciente = pacientes.find(p => p.id === id);
    if (!paciente) return;
    
    document.getElementById('modalTitle').textContent = 'Editar Paciente';
    document.getElementById('pacienteId').value = paciente.id;
    document.getElementById('nome').value = paciente.nome || '';
    document.getElementById('cpf').value = paciente.cpf || '';
    document.getElementById('dataNascimento').value = paciente.dataNascimento || '';
    document.getElementById('telefone').value = paciente.telefone || '';
    document.getElementById('email').value = paciente.email || '';
    document.getElementById('responsavel').value = paciente.responsavel || '';
    document.getElementById('observacoes').value = paciente.observacoes || '';
    
    document.getElementById('modalPaciente').classList.add('active');
}

function visualizarPaciente(id) {
    editarPaciente(id);
}

function fecharModal() {
    document.getElementById('modalPaciente').classList.remove('active');
    document.getElementById('formPaciente').reset();
}

// ==================== MODAL - TESTES ====================

async function abrirTestes(pacienteId) {
    pacienteAtual = pacientes.find(p => p.id === pacienteId);
    if (!pacienteAtual) return;
    
    document.getElementById('nomePacienteTestes').textContent = pacienteAtual.nome;
    document.getElementById('modalTestes').classList.add('active');
    
    // Carregar testes do paciente
    await carregarTestesRealizados(pacienteId);
}

async function carregarTestesRealizados(pacienteId) {
    try {
        const db = firebase.firestore();
        const snapshot = await db.collection('pacientes')
            .doc(pacienteId)
            .collection('testes')
            .orderBy('criadoEm', 'desc')
            .get();
        
        const testes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        const lista = document.getElementById('listaTestesRealizados');
        
        if (testes.length === 0) {
            lista.innerHTML = '<p class="empty-message">Nenhum teste realizado ainda</p>';
            return;
        }
        
        lista.innerHTML = testes.map(teste => {
            const data = teste.criadoEm 
                ? new Date(teste.criadoEm.seconds * 1000).toLocaleDateString('pt-BR')
                : '-';
            
            const tipoTexto = {
                'srs2': 'SRS-2',
                'wiscv': 'WISC-V',
                'outro': 'Outro'
            }[teste.tipo] || teste.tipo;
            
            const modoTexto = teste.modo === 'aplicacao' ? '📝 Aplicação' : '✅ Correção';
            
            return `
                <div class="teste-item">
                    <div class="teste-info">
                        <h4>${tipoTexto} - ${modoTexto}</h4>
                        <p>Realizado em: ${data}</p>
                    </div>
                    <div>
                        <button class="action-btn view" onclick="visualizarTeste('${teste.id}')">
                            👁️ Ver
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('❌ Erro ao carregar testes:', error);
    }
}

function fecharModalTestes() {
    document.getElementById('modalTestes').classList.remove('active');
    pacienteAtual = null;
}

// ==================== MODAL - SELECIONAR TESTE ====================

function abrirSelecionarTeste(modo) {
    document.getElementById('modoTeste').value = modo;
    document.getElementById('pacienteTesteId').value = pacienteAtual.id;
    
    const titulo = modo === 'aplicacao' 
        ? '📝 Aplicar Teste' 
        : '✅ Corrigir Teste';
    
    document.getElementById('tituloSelecaoTeste').textContent = titulo;
    document.getElementById('modalSelecionarTeste').classList.add('active');
}

function fecharModalSelecionar() {
    document.getElementById('modalSelecionarTeste').classList.remove('active');
    document.getElementById('testeEscolhido').value = '';
}

async function iniciarTeste() {
    const teste = document.getElementById('testeEscolhido').value;
    const modo = document.getElementById('modoTeste').value;
    const pacienteId = document.getElementById('pacienteTesteId').value;
    
    if (!teste) {
        alert('⚠️ Selecione um teste primeiro');
        return;
    }
    
    try {
        // Criar registro do teste no Firebase
        const db = firebase.firestore();
        const testeData = {
            tipo: teste,
            modo: modo,
            pacienteId: pacienteId,
            pacienteNome: pacienteAtual.nome,
            status: 'em_andamento',
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const testeRef = await db.collection('pacientes')
            .doc(pacienteId)
            .collection('testes')
            .add(testeData);
        
        console.log('✅ Teste criado:', testeRef.id);
        
        // Redirecionar para página do teste
        if (teste === 'srs2') {
            // Salvar ID do teste e paciente para usar na página do SRS2
            localStorage.setItem('testeAtual', JSON.stringify({
                testeId: testeRef.id,
                pacienteId: pacienteId,
                pacienteNome: pacienteAtual.nome,
                modo: modo
            }));
            
            window.location.href = '../srs2.html';
        } else if (teste === 'wiscv') {
            alert('WISC-V em desenvolvimento');
        } else {
            alert('Teste em desenvolvimento');
        }
        
    } catch (error) {
        console.error('❌ Erro ao iniciar teste:', error);
        alert('❌ Erro ao iniciar teste');
    }
}

function visualizarTeste(testeId) {
    alert('Visualização de teste em desenvolvimento\nID: ' + testeId);
}

// ==================== FILTROS E BUSCA ====================

function buscarPacientes() {
    filtros.busca = document.getElementById('searchInput').value;
    renderizarTabela();
}

function filtrarPacientes() {
    filtros.status = document.getElementById('statusFilter').value;
    renderizarTabela();
}

function limparFiltros() {
    filtros = { busca: '', status: 'todos' };
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = 'todos';
    renderizarTabela();
}

// ==================== UTILIDADES ====================

function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('currentUser');
        window.location.href = '../login.html';
    }
}

function exportarPacientes() {
    alert('Exportação em desenvolvimento');
}

function mostrarNotificacao(mensagem, tipo) {
    const cores = {
        success: '#27ae60',
        error: '#e74c3c',
        info: '#3498db'
    };
    
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${cores[tipo] || cores.info};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 500;
        animation: slideIn 0.3s;
    `;
    notif.textContent = mensagem;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// Adicionar animações
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
`;
document.head.appendChild(style);

console.log('✅ Pacientes.js carregado');
