// =====================================================
// EQUILIBRIUM NEURO - PATIENTS MANAGER
// Gerenciamento de Pacientes no Firebase Firestore
// =====================================================

class PatientsManager {
    constructor() {
        this.db = firebase.firestore();
        this.currentUser = null;
        this.patientsCache = [];
    }

    // ==================== INICIALIZAÇÃO ====================
    
    async init() {
        try {
            // Verificar autenticação
            firebase.auth().onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    console.log('✅ Usuário autenticado:', user.email);
                } else {
                    console.log('❌ Usuário não autenticado');
                    window.location.href = 'login.html';
                }
            });
        } catch (error) {
            console.error('Erro ao inicializar PatientsManager:', error);
        }
    }

    // ==================== CRUD DE PACIENTES ====================
    
    /**
     * Criar novo paciente
     * @param {Object} patientData - Dados do paciente
     * @returns {Promise<string>} - ID do paciente criado
     */
    async createPatient(patientData) {
        try {
            if (!this.currentUser) {
                throw new Error('Usuário não autenticado');
            }

            const patient = {
                userId: this.currentUser.uid,
                
                // Dados Pessoais
                fullName: patientData.fullName || '',
                cpf: patientData.cpf || '',
                rg: patientData.rg || '',
                birthDate: patientData.birthDate ? firebase.firestore.Timestamp.fromDate(new Date(patientData.birthDate)) : null,
                gender: patientData.gender || '',
                
                // Contato
                email: patientData.email || '',
                phone: patientData.phone || '',
                mobile: patientData.mobile || '',
                
                // Endereço
                address: {
                    street: patientData.addressStreet || '',
                    number: patientData.addressNumber || '',
                    complement: patientData.addressComplement || '',
                    neighborhood: patientData.addressNeighborhood || '',
                    city: patientData.addressCity || '',
                    state: patientData.addressState || '',
                    zipcode: patientData.addressZipcode || ''
                },
                
                // Informações Clínicas
                clinicalInfo: {
                    profession: patientData.profession || '',
                    emergencyContact: {
                        name: patientData.emergencyContactName || '',
                        phone: patientData.emergencyContactPhone || ''
                    },
                    healthInsurance: patientData.healthInsurance || '',
                    healthInsuranceNumber: patientData.healthInsuranceNumber || '',
                    chiefComplaint: patientData.chiefComplaint || '',
                    medicalHistory: patientData.medicalHistory || '',
                    medications: patientData.medications || '',
                    allergies: patientData.allergies || ''
                },
                
                // Status
                status: 'active',
                notes: patientData.notes || '',
                
                // Metadados
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await this.db.collection('patients').add(patient);
            console.log('✅ Paciente criado com ID:', docRef.id);
            
            return docRef.id;
        } catch (error) {
            console.error('❌ Erro ao criar paciente:', error);
            throw error;
        }
    }

    /**
     * Buscar paciente por ID
     * @param {string} patientId - ID do paciente
     * @returns {Promise<Object>} - Dados do paciente
     */
    async getPatient(patientId) {
        try {
            const doc = await this.db.collection('patients').doc(patientId).get();
            
            if (!doc.exists) {
                throw new Error('Paciente não encontrado');
            }
            
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('❌ Erro ao buscar paciente:', error);
            throw error;
        }
    }

    /**
     * Listar todos os pacientes do usuário atual
     * @param {Object} filters - Filtros (status, busca, etc)
     * @returns {Promise<Array>} - Lista de pacientes
     */
    async listPatients(filters = {}) {
        try {
            if (!this.currentUser) {
                throw new Error('Usuário não autenticado');
            }

            let query = this.db.collection('patients')
                .where('userId', '==', this.currentUser.uid);

            // Filtro de status
            if (filters.status && filters.status !== 'all') {
                query = query.where('status', '==', filters.status);
            }

            // Ordenação
            query = query.orderBy('createdAt', 'desc');

            const snapshot = await query.get();
            
            let patients = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filtro de busca (texto)
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                patients = patients.filter(patient => 
                    patient.fullName.toLowerCase().includes(searchTerm) ||
                    (patient.cpf && patient.cpf.includes(searchTerm)) ||
                    (patient.phone && patient.phone.includes(searchTerm)) ||
                    (patient.mobile && patient.mobile.includes(searchTerm))
                );
            }

            this.patientsCache = patients;
            return patients;
        } catch (error) {
            console.error('❌ Erro ao listar pacientes:', error);
            throw error;
        }
    }

    /**
     * Atualizar paciente
     * @param {string} patientId - ID do paciente
     * @param {Object} patientData - Dados a atualizar
     * @returns {Promise<void>}
     */
    async updatePatient(patientId, patientData) {
        try {
            const updateData = {
                ...patientData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Se tiver birthDate, converter para Timestamp
            if (patientData.birthDate) {
                updateData.birthDate = firebase.firestore.Timestamp.fromDate(new Date(patientData.birthDate));
            }

            await this.db.collection('patients').doc(patientId).update(updateData);
            console.log('✅ Paciente atualizado:', patientId);
        } catch (error) {
            console.error('❌ Erro ao atualizar paciente:', error);
            throw error;
        }
    }

    /**
     * Deletar paciente (soft delete - muda status para inactive)
     * @param {string} patientId - ID do paciente
     * @returns {Promise<void>}
     */
    async deletePatient(patientId) {
        try {
            await this.db.collection('patients').doc(patientId).update({
                status: 'inactive',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Paciente inativado:', patientId);
        } catch (error) {
            console.error('❌ Erro ao deletar paciente:', error);
            throw error;
        }
    }

    /**
     * Deletar paciente permanentemente
     * @param {string} patientId - ID do paciente
     * @returns {Promise<void>}
     */
    async permanentlyDeletePatient(patientId) {
        try {
            // Deletar todos os relatórios do paciente primeiro
            const reportsSnapshot = await this.db
                .collection('patients')
                .doc(patientId)
                .collection('reports')
                .get();

            const batch = this.db.batch();
            reportsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            // Deletar o paciente
            batch.delete(this.db.collection('patients').doc(patientId));
            
            await batch.commit();
            console.log('✅ Paciente deletado permanentemente:', patientId);
        } catch (error) {
            console.error('❌ Erro ao deletar paciente permanentemente:', error);
            throw error;
        }
    }

    // ==================== ESTATÍSTICAS ====================
    
    /**
     * Obter estatísticas dos pacientes
     * @returns {Promise<Object>} - Estatísticas
     */
    async getStatistics() {
        try {
            const patients = await this.listPatients();
            
            const stats = {
                total: patients.length,
                active: patients.filter(p => p.status === 'active').length,
                inactive: patients.filter(p => p.status === 'inactive').length,
                discharged: patients.filter(p => p.status === 'discharged').length
            };

            return stats;
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            throw error;
        }
    }

    // ==================== BUSCA E VALIDAÇÃO ====================
    
    /**
     * Buscar paciente por CPF
     * @param {string} cpf - CPF do paciente
     * @returns {Promise<Object|null>} - Paciente encontrado ou null
     */
    async findByCPF(cpf) {
        try {
            if (!this.currentUser) {
                throw new Error('Usuário não autenticado');
            }

            const snapshot = await this.db.collection('patients')
                .where('userId', '==', this.currentUser.uid)
                .where('cpf', '==', cpf)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('❌ Erro ao buscar por CPF:', error);
            throw error;
        }
    }

    /**
     * Validar CPF
     * @param {string} cpf - CPF a validar
     * @returns {boolean} - True se válido
     */
    validateCPF(cpf) {
        cpf = cpf.replace(/[^\d]/g, '');
        
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
            return false;
        }

        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let digit = 11 - (sum % 11);
        if (digit >= 10) digit = 0;
        if (parseInt(cpf.charAt(9)) !== digit) return false;

        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        digit = 11 - (sum % 11);
        if (digit >= 10) digit = 0;
        if (parseInt(cpf.charAt(10)) !== digit) return false;

        return true;
    }
}

// Instância global
window.patientsManager = new PatientsManager();
