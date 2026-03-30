// =====================================================
// EQUILIBRIUM NEURO - PACIENTES UI
// Interface de gerenciamento de pacientes
// =====================================================

// Variáveis Globais
let currentFilters = {
    search: '',
    status: 'all'
};

let editingPatientId = null;

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar managers
    await window.patientsManager.init();
    await window.reportsManager.init();
    
    // Verificar autenticação
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            document.getElementById('userName').textContent = user.displayName || user.email;
            loadPatients();
        } else {
            window.location.href = 'login.html';
        }
    });
    
    // Event Listeners
    setupEventListeners();
});

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    // Botões principais
    document.getElementById('addPatientBtn').addEventListener('click', openAddPatientModal);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('exportBtn').addEventListener('click', exportPatients);
    
    // Modal
    document.getElementById('closeModal').addEventListener('click', closePatientModal);
    document.getElementById('cancelBtn').addEventListener('click', closePatientModal);
    document.getElementById('patientForm').addEventListener('submit', savePatient);
    
    // Busca e filtros
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('statusFilter').addEventListener('change', handleFilter);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // CEP
    document.getElementById('searchZipBtn').addEventListener('click', searchZipCode);
    
    // CPF validation
    document.getElementById('cpf').addEventListener('blur', validateCPFInput);
    document.getElementById('cpf').addEventListener('input', formatCPF);
    
    // Phone formatting
    document.getElementById('phone').addEventListener('input', formatPhone);
    document.getElementById('mobile').addEventListener('input', formatMobile);
    document.getElementById('emergencyContactPhone').addEventListener('input', formatMobile);
    document.getElementById('addressZipcode').addEventListener('input', formatZipcode);
    
    // Fechar modal clicando fora
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('patientModal');
        if (e.target === modal) {
            closePatientModal();
        }
    });
}

// ==================== CARREGAR PACIENTES ====================

async function loadPatients() {
    try {
        const tableBody = document.getElementById('patientsTableBody');
        const emptyState = document.getElementById('emptyState');
        
        // Mostrar loading
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-row">
                    <div class="loading-spinner"></div>
                    <p>Carregando pacientes...</p>
                </td>
            </tr>
        `;
        
        // Buscar pacientes
        const patients = await window.patientsManager.listPatients(currentFilters);
        
        // Atualizar estatísticas
        await updateStatistics(patients);
        
        // Renderizar tabela
        if (patients.length === 0) {
            tableBody.innerHTML = '';
            emptyState.style.display = 'block';
            document.querySelector('.table-wrapper').style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            document.querySelector('.table-wrapper').style.display = 'block';
            renderPatientsTable(patients);
        }
    } catch (error) {
        console.error('Erro ao carregar pacientes:', error);
        showNotification('Erro ao carregar pacientes', 'error');
    }
}

// ==================== RENDERIZAR TABELA ====================

function renderPatientsTable(patients) {
    const tableBody = document.getElementById('patientsTableBody');
    
    tableBody.innerHTML = patients.map(patient => {
        const birthDate = patient.birthDate ? 
            new Date(patient.birthDate.seconds * 1000).toLocaleDateString('pt-BR') : '-';
        
        const statusClass = patient.status || 'active';
        const statusText = {
            'active': 'Ativo',
            'inactive': 'Inativo',
            'discharged': 'Alta'
        }[statusClass] || 'Ativo';
        
        return `
            <tr>
                <td>${patient.fullName}</td>
                <td>${patient.cpf || '-'}</td>
                <td>${patient.mobile || patient.phone || '-'}</td>
                <td>${birthDate}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="actions-col">
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewPatient('${patient.id}')" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="editPatient('${patient.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deletePatient('${patient.id}', '${patient.fullName}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ==================== ESTATÍSTICAS ====================

async function updateStatistics(patients) {
    try {
        const stats = {
            total: patients.length,
            active: patients.filter(p => p.status === 'active').length,
            inactive: patients.filter(p => p.status !== 'active').length
        };
        
        document.getElementById('totalPatients').textContent = stats.total;
        document.getElementById('activePatients').textContent = stats.active;
        
        // Contar relatórios (simulado por enquanto)
        document.getElementById('totalReports').textContent = '0';
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
    }
}

// ==================== MODAL ====================

function openAddPatientModal() {
    editingPatientId = null;
    document.getElementById('modalTitle').textContent = 'Novo Paciente';
    document.getElementById('patientForm').reset();
    document.getElementById('patientId').value = '';
    document.getElementById('patientModal').classList.add('active');
    switchTab('personal');
}

async function editPatient(patientId) {
    try {
        editingPatientId = patientId;
        const patient = await window.patientsManager.getPatient(patientId);
        
        document.getElementById('modalTitle').textContent = 'Editar Paciente';
        document.getElementById('patientId').value = patientId;
        
        // Preencher formulário
        document.getElementById('fullName').value = patient.fullName || '';
        document.getElementById('cpf').value = patient.cpf || '';
        document.getElementById('rg').value = patient.rg || '';
        document.getElementById('birthDate').value = patient.birthDate ? 
            new Date(patient.birthDate.seconds * 1000).toISOString().split('T')[0] : '';
        document.getElementById('gender').value = patient.gender || '';
        
        // Contato
        document.getElementById('email').value = patient.email || '';
        document.getElementById('phone').value = patient.phone || '';
        document.getElementById('mobile').value = patient.mobile || '';
        document.getElementById('emergencyContactName').value = patient.clinicalInfo?.emergencyContact?.name || '';
        document.getElementById('emergencyContactPhone').value = patient.clinicalInfo?.emergencyContact?.phone || '';
        
        // Endereço
        if (patient.address) {
            document.getElementById('addressZipcode').value = patient.address.zipcode || '';
            document.getElementById('addressStreet').value = patient.address.street || '';
            document.getElementById('addressNumber').value = patient.address.number || '';
            document.getElementById('addressComplement').value = patient.address.complement || '';
            document.getElementById('addressNeighborhood').value = patient.address.neighborhood || '';
            document.getElementById('addressCity').value = patient.address.city || '';
            document.getElementById('addressState').value = patient.address.state || '';
        }
        
        // Clínico
        if (patient.clinicalInfo) {
            document.getElementById('profession').value = patient.clinicalInfo.profession || '';
            document.getElementById('healthInsurance').value = patient.clinicalInfo.healthInsurance || '';
            document.getElementById('healthInsuranceNumber').value = patient.clinicalInfo.healthInsuranceNumber || '';
            document.getElementById('chiefComplaint').value = patient.clinicalInfo.chiefComplaint || '';
            document.getElementById('medicalHistory').value = patient.clinicalInfo.medicalHistory || '';
            document.getElementById('medications').value = patient.clinicalInfo.medications || '';
            document.getElementById('allergies').value = patient.clinicalInfo.allergies || '';
        }
        document.getElementById('notes').value = patient.notes || '';
        
        document.getElementById('patientModal').classList.add('active');
    } catch (error) {
        console.error('Erro ao carregar paciente:', error);
        showNotification('Erro ao carregar dados do paciente', 'error');
    }
}

function closePatientModal() {
    document.getElementById('patientModal').classList.remove('active');
    document.getElementById('patientForm').reset();
    editingPatientId = null;
}

// ==================== SALVAR PACIENTE ====================

async function savePatient(e) {
    e.preventDefault();
    
    try {
        const saveBtn = document.getElementById('savePatientBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        
        const patientData = {
            fullName: document.getElementById('fullName').value,
            cpf: document.getElementById('cpf').value,
            rg: document.getElementById('rg').value,
            birthDate: document.getElementById('birthDate').value,
            gender: document.getElementById('gender').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            mobile: document.getElementById('mobile').value,
            addressStreet: document.getElementById('addressStreet').value,
            addressNumber: document.getElementById('addressNumber').value,
            addressComplement: document.getElementById('addressComplement').value,
            addressNeighborhood: document.getElementById('addressNeighborhood').value,
            addressCity: document.getElementById('addressCity').value,
            addressState: document.getElementById('addressState').value,
            addressZipcode: document.getElementById('addressZipcode').value,
            profession: document.getElementById('profession').value,
            emergencyContactName: document.getElementById('emergencyContactName').value,
            emergencyContactPhone: document.getElementById('emergencyContactPhone').value,
            healthInsurance: document.getElementById('healthInsurance').value,
            healthInsuranceNumber: document.getElementById('healthInsuranceNumber').value,
            chiefComplaint: document.getElementById('chiefComplaint').value,
            medicalHistory: document.getElementById('medicalHistory').value,
            medications: document.getElementById('medications').value,
            allergies: document.getElementById('allergies').value,
            notes: document.getElementById('notes').value
        };
        
        if (editingPatientId) {
            // Atualizar paciente existente
            await window.patientsManager.updatePatient(editingPatientId, patientData);
            showNotification('Paciente atualizado com sucesso!', 'success');
        } else {
            // Criar novo paciente
            await window.patientsManager.createPatient(patientData);
            showNotification('Paciente cadastrado com sucesso!', 'success');
        }
        
        closePatientModal();
        loadPatients();
    } catch (error) {
        console.error('Erro ao salvar paciente:', error);
        showNotification('Erro ao salvar paciente: ' + error.message, 'error');
    } finally {
        const saveBtn = document.getElementById('savePatientBtn');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Paciente';
    }
}

// ==================== DELETAR PACIENTE ====================

async function deletePatient(patientId, patientName) {
    if (!confirm(`Tem certeza que deseja excluir o paciente "${patientName}"?`)) {
        return;
    }
    
    try {
        await window.patientsManager.deletePatient(patientId);
        showNotification('Paciente excluído com sucesso!', 'success');
        loadPatients();
    } catch (error) {
        console.error('Erro ao deletar paciente:', error);
        showNotification('Erro ao excluir paciente', 'error');
    }
}

// ==================== VISUALIZAR PACIENTE ====================

async function viewPatient(patientId) {
    // TODO: Implementar visualização completa do paciente
    alert('Funcionalidade de visualização em desenvolvimento');
}

// ==================== BUSCA E FILTROS ====================

function handleSearch(e) {
    currentFilters.search = e.target.value;
    loadPatients();
}

function handleFilter(e) {
    currentFilters.status = e.target.value;
    loadPatients();
}

function clearFilters() {
    currentFilters = {
        search: '',
        status: 'all'
    };
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = 'all';
    loadPatients();
}

// ==================== TABS ====================

function switchTab(tabName) {
    // Remover active de todos
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Ativar selecionado
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// ==================== FORMATAÇÃO ====================

function formatCPF(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = value;
}

function validateCPFInput(e) {
    const cpf = e.target.value;
    if (cpf && !window.patientsManager.validateCPF(cpf)) {
        document.getElementById('cpfError').textContent = 'CPF inválido';
        e.target.style.borderColor = '#F44336';
    } else {
        document.getElementById('cpfError').textContent = '';
        e.target.style.borderColor = '#e0e0e0';
    }
}

function formatPhone(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{2})(\d)/, '($1) $2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');
    e.target.value = value.substring(0, 14);
}

function formatMobile(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{2})(\d)/, '($1) $2');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    e.target.value = value.substring(0, 15);
}

function formatZipcode(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    e.target.value = value.substring(0, 9);
}

// ==================== BUSCAR CEP ====================

async function searchZipCode() {
    const zipcode = document.getElementById('addressZipcode').value.replace(/\D/g, '');
    
    if (zipcode.length !== 8) {
        showNotification('CEP inválido', 'error');
        return;
    }
    
    try {
        const response = await fetch(`https://viacep.com.br/ws/${zipcode}/json/`);
        const data = await response.json();
        
        if (data.erro) {
            showNotification('CEP não encontrado', 'error');
            return;
        }
        
        document.getElementById('addressStreet').value = data.logradouro || '';
        document.getElementById('addressNeighborhood').value = data.bairro || '';
        document.getElementById('addressCity').value = data.localidade || '';
        document.getElementById('addressState').value = data.uf || '';
        document.getElementById('addressNumber').focus();
        
        showNotification('CEP encontrado!', 'success');
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        showNotification('Erro ao buscar CEP', 'error');
    }
}

// ==================== EXPORTAR ====================

function exportPatients() {
    // TODO: Implementar exportação para CSV/Excel
    alert('Funcionalidade de exportação em desenvolvimento');
}

// ==================== LOGOUT ====================

function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = 'login.html';
    });
}

// ==================== NOTIFICAÇÕES ====================

function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Adicionar estilos de animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Expor funções globalmente
window.viewPatient = viewPatient;
window.editPatient = editPatient;
window.deletePatient = deletePatient;
