// =====================================================
// EQUILIBRIUM NEURO - PACIENTES UI
// Interface funcional de gerenciamento de pacientes
// =====================================================

// Variáveis Globais
let currentFilters = {
    search: '',
    status: 'all'
};

let editingPatientId = null;

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema de Pacientes Iniciado');
    
    // Verificar usuário
    const user = window.dbAdapter.getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.displayName || user.email || 'Usuário';
        loadPatients();
    } else {
        console.warn('Usuário não encontrado');
        window.dbAdapter.getCurrentUser();
        loadPatients();
    }
    
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
    document.getElementById('patientForm').addEventListener('submit', savePatient);
    
    // Busca e filtros
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 500));
    document.getElementById('statusFilter').addEventListener('change', handleFilter);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // CEP
    document.getElementById('searchZipBtn').addEventListener('click', searchZipCode);
    
    // Validações e formatações
    document.getElementById('cpf').addEventListener('blur', validateCPFInput);
    document.getElementById('cpf').addEventListener('input', formatCPF);
    document.getElementById('phone').addEventListener('input', formatPhone);
    document.getElementById('mobile').addEventListener('input', formatMobile);
    document.getElementById('emergencyContactPhone').addEventListener('input', formatMobile);
    document.getElementById('addressZipcode').addEventListener('input', formatZipcode);
}

// ==================== CARREGAR PACIENTES ====================

async function loadPatients() {
    try {
        const tableBody = document.getElementById('patientsTableBody');
        const emptyState = document.getElementById('emptyState');
        const tableWrapper = document.querySelector('.table-wrapper');
        
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
        const patients = await window.dbAdapter.getPatients(currentFilters);
        
        console.log(`📋 ${patients.length} pacientes carregados`);
        
        // Atualizar estatísticas
        updateStatistics(patients);
        
        // Renderizar tabela
        if (patients.length === 0) {
            tableBody.innerHTML = '';
            emptyState.style.display = 'block';
            tableWrapper.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            tableWrapper.style.display = 'block';
            renderPatientsTable(patients);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar pacientes:', error);
        showNotification('Erro ao carregar pacientes', 'error');
    }
}

// ==================== RENDERIZAR TABELA ====================

function renderPatientsTable(patients) {
    const tableBody = document.getElementById('patientsTableBody');
    
    if (patients.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                    Nenhum paciente encontrado
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = patients.map(patient => {
        // Formatar data de nascimento
        let birthDate = '-';
        if (patient.birthDate) {
            if (typeof patient.birthDate === 'string') {
                birthDate = new Date(patient.birthDate).toLocaleDateString('pt-BR');
            } else if (patient.birthDate.seconds) {
                birthDate = new Date(patient.birthDate.seconds * 1000).toLocaleDateString('pt-BR');
            }
        }
        
        // Status
        const statusClass = patient.status || 'active';
        const statusText = {
            'active': 'Ativo',
            'inactive': 'Inativo',
            'discharged': 'Alta'
        }[statusClass] || 'Ativo';
        
        return `
            <tr>
                <td><strong>${patient.fullName}</strong></td>
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
                        <button class="action-btn delete" onclick="confirmDeletePatient('${patient.id}', '${patient.fullName}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ==================== ESTATÍSTICAS ====================

function updateStatistics(patients) {
    try {
        const stats = {
            total: patients.length,
            active: patients.filter(p => p.status === 'active').length,
            inactive: patients.filter(p => p.status !== 'active').length
        };
        
        document.getElementById('totalPatients').textContent = stats.total;
        document.getElementById('activePatients').textContent = stats.active;
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
    document.getElementById('cpfError').textContent = '';
    document.getElementById('patientModal').classList.add('active');
    switchTab('personal');
}

function closePatientModal() {
    document.getElementById('patientModal').classList.remove('active');
    document.getElementById('patientForm').reset();
    document.getElementById('cpfError').textContent = '';
    editingPatientId = null;
}

async function editPatient(patientId) {
    try {
        editingPatientId = patientId;
        const patient = await window.dbAdapter.getPatient(patientId);
        
        if (!patient) {
            showNotification('Paciente não encontrado', 'error');
            return;
        }
        
        document.getElementById('modalTitle').textContent = 'Editar Paciente';
        document.getElementById('patientId').value = patientId;
        
        // Dados Pessoais
        document.getElementById('fullName').value = patient.fullName || '';
        document.getElementById('cpf').value = patient.cpf || '';
        document.getElementById('rg').value = patient.rg || '';
        
        if (patient.birthDate) {
            if (typeof patient.birthDate === 'string') {
                document.getElementById('birthDate').value = patient.birthDate.split('T')[0];
            } else if (patient.birthDate.seconds) {
                const date = new Date(patient.birthDate.seconds * 1000);
                document.getElementById('birthDate').value = date.toISOString().split('T')[0];
            }
        }
        
        document.getElementById('gender').value = patient.gender || '';
        
        // Contato
        document.getElementById('email').value = patient.email || '';
        document.getElementById('phone').value = patient.phone || '';
        document.getElementById('mobile').value = patient.mobile || '';
        document.getElementById('emergencyContactName').value = patient.emergencyContactName || '';
        document.getElementById('emergencyContactPhone').value = patient.emergencyContactPhone || '';
        
        // Endereço
        document.getElementById('addressZipcode').value = patient.addressZipcode || '';
        document.getElementById('addressStreet').value = patient.addressStreet || '';
        document.getElementById('addressNumber').value = patient.addressNumber || '';
        document.getElementById('addressComplement').value = patient.addressComplement || '';
        document.getElementById('addressNeighborhood').value = patient.addressNeighborhood || '';
        document.getElementById('addressCity').value = patient.addressCity || '';
        document.getElementById('addressState').value = patient.addressState || '';
        
        // Clínico
        document.getElementById('profession').value = patient.profession || '';
        document.getElementById('healthInsurance').value = patient.healthInsurance || '';
        document.getElementById('healthInsuranceNumber').value = patient.healthInsuranceNumber || '';
        document.getElementById('chiefComplaint').value = patient.chiefComplaint || '';
        document.getElementById('medicalHistory').value = patient.medicalHistory || '';
        document.getElementById('medications').value = patient.medications || '';
        document.getElementById('allergies').value = patient.allergies || '';
        document.getElementById('notes').value = patient.notes || '';
        
        document.getElementById('patientModal').classList.add('active');
    } catch (error) {
        console.error('Erro ao carregar paciente:', error);
        showNotification('Erro ao carregar dados do paciente', 'error');
    }
}

// ==================== SALVAR PACIENTE ====================

async function savePatient(e) {
    e.preventDefault();
    
    const saveBtn = document.getElementById('savePatientBtn');
    const originalHTML = saveBtn.innerHTML;
    
    try {
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
            emergencyContactName: document.getElementById('emergencyContactName').value,
            emergencyContactPhone: document.getElementById('emergencyContactPhone').value,
            addressZipcode: document.getElementById('addressZipcode').value,
            addressStreet: document.getElementById('addressStreet').value,
            addressNumber: document.getElementById('addressNumber').value,
            addressComplement: document.getElementById('addressComplement').value,
            addressNeighborhood: document.getElementById('addressNeighborhood').value,
            addressCity: document.getElementById('addressCity').value,
            addressState: document.getElementById('addressState').value.toUpperCase(),
            profession: document.getElementById('profession').value,
            healthInsurance: document.getElementById('healthInsurance').value,
            healthInsuranceNumber: document.getElementById('healthInsuranceNumber').value,
            chiefComplaint: document.getElementById('chiefComplaint').value,
            medicalHistory: document.getElementById('medicalHistory').value,
            medications: document.getElementById('medications').value,
            allergies: document.getElementById('allergies').value,
            notes: document.getElementById('notes').value
        };
        
        if (editingPatientId) {
            await window.dbAdapter.updatePatient(editingPatientId, patientData);
            showNotification('Paciente atualizado com sucesso!', 'success');
        } else {
            await window.dbAdapter.createPatient(patientData);
            showNotification('Paciente cadastrado com sucesso!', 'success');
        }
        
        closePatientModal();
        loadPatients();
    } catch (error) {
        console.error('Erro ao salvar paciente:', error);
        showNotification('Erro ao salvar paciente: ' + error.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalHTML;
    }
}

// ==================== DELETAR PACIENTE ====================

function confirmDeletePatient(patientId, patientName) {
    if (confirm(`Tem certeza que deseja excluir o paciente "${patientName}"?\n\nEsta ação mudará o status para "Inativo".`)) {
        deletePatient(patientId);
    }
}

async function deletePatient(patientId) {
    try {
        await window.dbAdapter.deletePatient(patientId);
        showNotification('Paciente excluído com sucesso!', 'success');
        loadPatients();
    } catch (error) {
        console.error('Erro ao deletar paciente:', error);
        showNotification('Erro ao excluir paciente', 'error');
    }
}

// ==================== VISUALIZAR PACIENTE ====================

function viewPatient(patientId) {
    editPatient(patientId);
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
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const tabContent = document.getElementById(`tab-${tabName}`);
    
    if (tabBtn && tabContent) {
        tabBtn.classList.add('active');
        tabContent.classList.add('active');
    }
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
    const errorEl = document.getElementById('cpfError');
    
    if (cpf && cpf.length > 0) {
        if (window.dbAdapter.validateCPF(cpf)) {
            errorEl.textContent = '';
            e.target.style.borderColor = '#4CAF50';
        } else {
            errorEl.textContent = 'CPF inválido';
            e.target.style.borderColor = '#F44336';
        }
    } else {
        errorEl.textContent = '';
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
        showNotification('CEP deve ter 8 dígitos', 'error');
        return;
    }
    
    const btn = document.getElementById('searchZipBtn');
    const originalHTML = btn.innerHTML;
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
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
        showNotification('Erro ao buscar CEP. Tente novamente.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

// ==================== EXPORTAR ====================

function exportPatients() {
    showNotification('Exportação em desenvolvimento', 'info');
}

// ==================== LOGOUT ====================

function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    }
}

// ==================== UTILIDADES ====================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Adicionar animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
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
window.confirmDeletePatient = confirmDeletePatient;
window.closePatientModal = closePatientModal;

console.log('✅ Sistema de Pacientes Pronto!');
