// =====================================================
// EQUILIBRIUM NEURO - REPORTS MANAGER
// Gerenciamento de Relatórios no Firebase Firestore
// =====================================================

class ReportsManager {
    constructor() {
        this.db = firebase.firestore();
        this.currentUser = null;
    }

    // ==================== INICIALIZAÇÃO ====================
    
    async init() {
        try {
            firebase.auth().onAuthStateChanged((user) => {
                this.currentUser = user;
            });
        } catch (error) {
            console.error('Erro ao inicializar ReportsManager:', error);
        }
    }

    // ==================== CRUD DE RELATÓRIOS ====================
    
    /**
     * Criar novo relatório para um paciente
     * @param {string} patientId - ID do paciente
     * @param {Object} reportData - Dados do relatório
     * @returns {Promise<string>} - ID do relatório criado
     */
    async createReport(patientId, reportData) {
        try {
            if (!this.currentUser) {
                throw new Error('Usuário não autenticado');
            }

            const report = {
                patientId: patientId,
                userId: this.currentUser.uid,
                
                // Tipo e Conteúdo
                reportType: reportData.reportType || 'session_note',
                title: reportData.title || '',
                content: reportData.content || '',
                
                // Data da Sessão
                sessionDate: reportData.sessionDate ? 
                    firebase.firestore.Timestamp.fromDate(new Date(reportData.sessionDate)) : 
                    firebase.firestore.FieldValue.serverTimestamp(),
                sessionNumber: reportData.sessionNumber || null,
                
                // Dados da Sessão
                sessionData: {
                    duration: reportData.sessionDuration || null,
                    goals: reportData.sessionGoals || '',
                    interventions: reportData.sessionInterventions || '',
                    patientResponse: reportData.sessionPatientResponse || '',
                    homework: reportData.sessionHomework || ''
                },
                
                // Anexos
                attachments: reportData.attachments || [],
                
                // Assinatura
                isSigned: false,
                signedAt: null,
                
                // Metadados
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await this.db
                .collection('patients')
                .doc(patientId)
                .collection('reports')
                .add(report);
            
            console.log('✅ Relatório criado com ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Erro ao criar relatório:', error);
            throw error;
        }
    }

    /**
     * Buscar relatório por ID
     * @param {string} patientId - ID do paciente
     * @param {string} reportId - ID do relatório
     * @returns {Promise<Object>} - Dados do relatório
     */
    async getReport(patientId, reportId) {
        try {
            const doc = await this.db
                .collection('patients')
                .doc(patientId)
                .collection('reports')
                .doc(reportId)
                .get();
            
            if (!doc.exists) {
                throw new Error('Relatório não encontrado');
            }
            
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('❌ Erro ao buscar relatório:', error);
            throw error;
        }
    }

    /**
     * Listar todos os relatórios de um paciente
     * @param {string} patientId - ID do paciente
     * @param {Object} filters - Filtros (tipo, data, etc)
     * @returns {Promise<Array>} - Lista de relatórios
     */
    async listReports(patientId, filters = {}) {
        try {
            let query = this.db
                .collection('patients')
                .doc(patientId)
                .collection('reports');

            // Filtro por tipo
            if (filters.reportType) {
                query = query.where('reportType', '==', filters.reportType);
            }

            // Ordenação por data da sessão (mais recente primeiro)
            query = query.orderBy('sessionDate', 'desc');

            // Limite de resultados
            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const snapshot = await query.get();
            
            const reports = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return reports;
        } catch (error) {
            console.error('❌ Erro ao listar relatórios:', error);
            throw error;
        }
    }

    /**
     * Atualizar relatório
     * @param {string} patientId - ID do paciente
     * @param {string} reportId - ID do relatório
     * @param {Object} reportData - Dados a atualizar
     * @returns {Promise<void>}
     */
    async updateReport(patientId, reportId, reportData) {
        try {
            const updateData = {
                ...reportData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Se tiver sessionDate, converter para Timestamp
            if (reportData.sessionDate) {
                updateData.sessionDate = firebase.firestore.Timestamp.fromDate(new Date(reportData.sessionDate));
            }

            await this.db
                .collection('patients')
                .doc(patientId)
                .collection('reports')
                .doc(reportId)
                .update(updateData);
            
            console.log('✅ Relatório atualizado:', reportId);
        } catch (error) {
            console.error('❌ Erro ao atualizar relatório:', error);
            throw error;
        }
    }

    /**
     * Deletar relatório
     * @param {string} patientId - ID do paciente
     * @param {string} reportId - ID do relatório
     * @returns {Promise<void>}
     */
    async deleteReport(patientId, reportId) {
        try {
            await this.db
                .collection('patients')
                .doc(patientId)
                .collection('reports')
                .doc(reportId)
                .delete();
            
            console.log('✅ Relatório deletado:', reportId);
        } catch (error) {
            console.error('❌ Erro ao deletar relatório:', error);
            throw error;
        }
    }

    // ==================== ASSINATURA DE RELATÓRIOS ====================
    
    /**
     * Assinar relatório
     * @param {string} patientId - ID do paciente
     * @param {string} reportId - ID do relatório
     * @returns {Promise<void>}
     */
    async signReport(patientId, reportId) {
        try {
            await this.db
                .collection('patients')
                .doc(patientId)
                .collection('reports')
                .doc(reportId)
                .update({
                    isSigned: true,
                    signedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            
            console.log('✅ Relatório assinado:', reportId);
        } catch (error) {
            console.error('❌ Erro ao assinar relatório:', error);
            throw error;
        }
    }

    // ==================== ESTATÍSTICAS ====================
    
    /**
     * Obter estatísticas dos relatórios de um paciente
     * @param {string} patientId - ID do paciente
     * @returns {Promise<Object>} - Estatísticas
     */
    async getReportStatistics(patientId) {
        try {
            const reports = await this.listReports(patientId);
            
            const stats = {
                total: reports.length,
                byType: {
                    session_note: reports.filter(r => r.reportType === 'session_note').length,
                    evaluation: reports.filter(r => r.reportType === 'evaluation').length,
                    progress_report: reports.filter(r => r.reportType === 'progress_report').length,
                    discharge: reports.filter(r => r.reportType === 'discharge').length
                },
                signed: reports.filter(r => r.isSigned).length,
                unsigned: reports.filter(r => !r.isSigned).length
            };

            return stats;
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas de relatórios:', error);
            throw error;
        }
    }

    // ==================== EXPORTAÇÃO ====================
    
    /**
     * Exportar relatório como PDF (preparar dados)
     * @param {string} patientId - ID do paciente
     * @param {string} reportId - ID do relatório
     * @returns {Promise<Object>} - Dados formatados para PDF
     */
    async exportReportData(patientId, reportId) {
        try {
            const report = await this.getReport(patientId, reportId);
            const patient = await window.patientsManager.getPatient(patientId);
            
            return {
                patient: {
                    name: patient.fullName,
                    cpf: patient.cpf,
                    birthDate: patient.birthDate
                },
                report: report,
                professional: {
                    name: this.currentUser.displayName || this.currentUser.email,
                    uid: this.currentUser.uid
                },
                exportDate: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Erro ao exportar relatório:', error);
            throw error;
        }
    }

    // ==================== TEMPLATES ====================
    
    /**
     * Obter template de relatório por tipo
     * @param {string} reportType - Tipo do relatório
     * @returns {Object} - Template do relatório
     */
    getReportTemplate(reportType) {
        const templates = {
            session_note: {
                title: 'Nota de Sessão',
                sections: [
                    'Objetivos da Sessão',
                    'Intervenções Realizadas',
                    'Resposta do Paciente',
                    'Tarefa de Casa',
                    'Observações'
                ]
            },
            evaluation: {
                title: 'Avaliação Inicial',
                sections: [
                    'Queixa Principal',
                    'História Clínica',
                    'Avaliação Neuropsicológica',
                    'Hipótese Diagnóstica',
                    'Plano de Tratamento'
                ]
            },
            progress_report: {
                title: 'Relatório de Progresso',
                sections: [
                    'Período Avaliado',
                    'Objetivos Trabalhados',
                    'Progressos Observados',
                    'Dificuldades Encontradas',
                    'Próximas Etapas'
                ]
            },
            discharge: {
                title: 'Relatório de Alta',
                sections: [
                    'Resumo do Tratamento',
                    'Objetivos Alcançados',
                    'Evolução do Paciente',
                    'Recomendações',
                    'Encaminhamentos'
                ]
            }
        };

        return templates[reportType] || templates.session_note;
    }
}

// Instância global
window.reportsManager = new ReportsManager();
