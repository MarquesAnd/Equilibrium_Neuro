// =====================================================
// EXEMPLOS DE USO - RELATÓRIOS
// Como usar a API de relatórios do sistema
// =====================================================

/* 
   Este arquivo contém exemplos práticos de como usar
   o ReportsManager para criar e gerenciar relatórios
   de pacientes no Firestore.
*/

// ==================== 1. CRIAR NOTA DE SESSÃO ====================

async function exemploNotaSessao() {
    const patientId = "ABC123"; // ID do paciente
    
    const reportData = {
        reportType: 'session_note',
        title: 'Sessão #15 - Terapia Cognitivo-Comportamental',
        content: `
            Paciente chegou pontualmente e apresentou bom humor.
            Relatou melhora significativa nos sintomas de ansiedade.
            
            Objetivos da sessão foram alcançados com sucesso.
        `,
        sessionDate: '2024-03-20',
        sessionNumber: 15,
        sessionDuration: 50, // minutos
        sessionGoals: 'Trabalhar técnicas de relaxamento e mindfulness',
        sessionInterventions: 'Respiração diafragmática, meditação guiada',
        sessionPatientResponse: 'Paciente respondeu positivamente às intervenções',
        sessionHomework: 'Praticar respiração 3x ao dia por 5 minutos'
    };
    
    try {
        const reportId = await window.reportsManager.createReport(patientId, reportData);
        console.log('✅ Nota de sessão criada:', reportId);
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

// ==================== 2. CRIAR AVALIAÇÃO INICIAL ====================

async function exemploAvaliacaoInicial() {
    const patientId = "ABC123";
    
    const reportData = {
        reportType: 'evaluation',
        title: 'Avaliação Neuropsicológica Inicial',
        content: `
            IDENTIFICAÇÃO:
            Paciente: João Silva
            Idade: 45 anos
            Escolaridade: Ensino Superior Completo
            
            QUEIXA PRINCIPAL:
            Dificuldades de memória e concentração após TCE leve
            
            INSTRUMENTOS APLICADOS:
            - WAIS-III
            - Teste de Atenção Concentrada (AC)
            - Rey Auditory Verbal Learning Test (RAVLT)
            - Trail Making Test A e B
            
            RESULTADOS:
            Desempenho dentro da média em testes de inteligência.
            Déficits leves em atenção sustentada e memória episódica.
            
            HIPÓTESE DIAGNÓSTICA:
            Transtorno Neurocognitivo Leve pós-TCE
            
            RECOMENDAÇÕES:
            Reabilitação cognitiva focada em atenção e memória
            Acompanhamento neurológico
        `,
        sessionDate: '2024-03-15'
    };
    
    try {
        const reportId = await window.reportsManager.createReport(patientId, reportData);
        console.log('✅ Avaliação criada:', reportId);
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

// ==================== 3. CRIAR RELATÓRIO DE PROGRESSO ====================

async function exemploRelatorioProgresso() {
    const patientId = "ABC123";
    
    const reportData = {
        reportType: 'progress_report',
        title: 'Relatório de Progresso - 3 meses',
        content: `
            PERÍODO AVALIADO: 01/01/2024 a 31/03/2024
            NÚMERO DE SESSÕES: 12 sessões realizadas
            
            OBJETIVOS TRABALHADOS:
            1. Melhora da atenção sustentada
            2. Fortalecimento de estratégias de memória
            3. Redução de sintomas ansiosos
            
            PROGRESSOS OBSERVADOS:
            - Aumento de 40% no tempo de concentração em tarefas
            - Melhora na recordação de informações do dia a dia
            - Redução significativa de queixas ansiosas
            - Maior autonomia nas atividades diárias
            
            DIFICULDADES:
            - Ainda apresenta falhas ocasionais em situações de estresse
            - Necessita de auxílio para organização complexa de tarefas
            
            PRÓXIMAS ETAPAS:
            - Continuar treino de funções executivas
            - Introduzir estratégias de gerenciamento de estresse
            - Avaliar possibilidade de retorno ao trabalho
        `,
        sessionDate: '2024-03-31'
    };
    
    try {
        const reportId = await window.reportsManager.createReport(patientId, reportData);
        console.log('✅ Relatório de progresso criado:', reportId);
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

// ==================== 4. CRIAR RELATÓRIO DE ALTA ====================

async function exemploRelatorioAlta() {
    const patientId = "ABC123";
    
    const reportData = {
        reportType: 'discharge',
        title: 'Relatório de Alta Terapêutica',
        content: `
            RESUMO DO TRATAMENTO:
            Paciente João Silva, 45 anos, iniciou acompanhamento em 
            01/01/2024 com queixa de dificuldades cognitivas pós-TCE.
            
            Foram realizadas 20 sessões de reabilitação neuropsicológica
            ao longo de 6 meses.
            
            OBJETIVOS ALCANÇADOS:
            ✓ Recuperação de 80% das funções atencionais
            ✓ Melhora significativa na memória episódica
            ✓ Redução completa de sintomas ansiosos
            ✓ Retorno bem-sucedido às atividades laborais
            
            EVOLUÇÃO DO PACIENTE:
            Paciente apresentou excelente adesão ao tratamento e
            evolução consistente em todas as áreas trabalhadas.
            Atualmente encontra-se adaptado e independente.
            
            RECOMENDAÇÕES:
            - Manter estratégias compensatórias aprendidas
            - Continuar exercícios cognitivos em casa
            - Reavaliação em 6 meses (preventiva)
            
            ENCAMINHAMENTOS:
            Nenhum encaminhamento necessário no momento.
            Paciente orientado a retornar se necessário.
            
            DATA DA ALTA: 30/06/2024
        `,
        sessionDate: '2024-06-30'
    };
    
    try {
        const reportId = await window.reportsManager.createReport(patientId, reportData);
        console.log('✅ Relatório de alta criado:', reportId);
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

// ==================== 5. LISTAR TODOS OS RELATÓRIOS DE UM PACIENTE ====================

async function exemploListarRelatorios() {
    const patientId = "ABC123";
    
    try {
        const reports = await window.reportsManager.listReports(patientId);
        console.log(`📋 Total de relatórios: ${reports.length}`);
        
        reports.forEach((report, index) => {
            console.log(`\n${index + 1}. ${report.title}`);
            console.log(`   Tipo: ${report.reportType}`);
            console.log(`   Data: ${new Date(report.sessionDate.seconds * 1000).toLocaleDateString()}`);
            console.log(`   Assinado: ${report.isSigned ? 'Sim' : 'Não'}`);
        });
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

// ==================== 6. FILTRAR RELATÓRIOS POR TIPO ====================

async function exemploFiltrarPorTipo() {
    const patientId = "ABC123";
    
    try {
        // Buscar apenas notas de sessão
        const sessionNotes = await window.reportsManager.listReports(patientId, {
            reportType: 'session_note',
            limit: 10 // Últimas 10 sessões
        });
        
        console.log(`📝 Notas de sessão encontradas: ${sessionNotes.length}`);
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

// ==================== 7. ATUALIZAR RELATÓRIO ====================

async function exemploAtualizarRelatorio() {
    const patientId = "ABC123";
    const reportId = "XYZ789";
    
    const updatedData = {
        content: 'Conteúdo atualizado do relatório...',
        title: 'Título atualizado'
    };
    
    try {
        await window.reportsManager.updateReport(patientId, reportId, updatedData);
        console.log('✅ Relatório atualizado com sucesso');
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

// ==================== 8. ASSINAR RELATÓRIO ====================

async function exemploAssinarRelatorio() {
    const patientId = "ABC123";
    const reportId = "XYZ789";
    
    try {
        await window.reportsManager.signReport(patientId, reportId);
        console.log('✅ Relatório assinado digitalmente');
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

// ==================== 9. OBTER ESTATÍSTICAS DE RELATÓRIOS ====================

async function exemploEstatisticas() {
    const patientId = "ABC123";
    
    try {
        const stats = await window.reportsManager.getReportStatistics(patientId);
        
        console.log('📊 ESTATÍSTICAS DE RELATÓRIOS');
        console.log(`Total: ${stats.total}`);
        console.log(`Notas de sessão: ${stats.byType.session_note}`);
        console.log(`Avaliações: ${stats.byType.evaluation}`);
        console.log(`Relatórios de progresso: ${stats.byType.progress_report}`);
        console.log(`Relatórios de alta: ${stats.byType.discharge}`);
        console.log(`Assinados: ${stats.signed}`);
        console.log(`Não assinados: ${stats.unsigned}`);
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

// ==================== 10. USAR TEMPLATES ====================

async function exemploUsarTemplate() {
    // Obter template de nota de sessão
    const template = window.reportsManager.getReportTemplate('session_note');
    
    console.log('📄 TEMPLATE DE NOTA DE SESSÃO:');
    console.log(`Título: ${template.title}`);
    console.log('Seções:');
    template.sections.forEach((section, index) => {
        console.log(`  ${index + 1}. ${section}`);
    });
}

// ==================== 11. EXPORTAR DADOS DO RELATÓRIO ====================

async function exemploExportarRelatorio() {
    const patientId = "ABC123";
    const reportId = "XYZ789";
    
    try {
        const data = await window.reportsManager.exportReportData(patientId, reportId);
        
        console.log('📥 DADOS PARA EXPORTAÇÃO:');
        console.log('Paciente:', data.patient.name);
        console.log('Profissional:', data.professional.name);
        console.log('Relatório:', data.report.title);
        console.log('Data de exportação:', data.exportDate);
        
        // Aqui você poderia gerar um PDF com esses dados
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

// ==================== 12. DELETAR RELATÓRIO ====================

async function exemploDeletarRelatorio() {
    const patientId = "ABC123";
    const reportId = "XYZ789";
    
    if (confirm('Tem certeza que deseja deletar este relatório?')) {
        try {
            await window.reportsManager.deleteReport(patientId, reportId);
            console.log('✅ Relatório deletado com sucesso');
        } catch (error) {
            console.error('❌ Erro:', error);
        }
    }
}

// ==================== EXEMPLO COMPLETO: FLUXO DE TRABALHO ====================

async function exemploFluxoCompleto() {
    console.log('🚀 INICIANDO FLUXO COMPLETO\n');
    
    // 1. Criar paciente (assumindo que já existe)
    const patientId = "ABC123";
    
    // 2. Criar avaliação inicial
    console.log('1️⃣ Criando avaliação inicial...');
    const avaliacaoId = await window.reportsManager.createReport(patientId, {
        reportType: 'evaluation',
        title: 'Avaliação Neuropsicológica Inicial',
        content: 'Conteúdo da avaliação...',
        sessionDate: '2024-01-15'
    });
    console.log('✅ Avaliação criada:', avaliacaoId);
    
    // 3. Criar várias notas de sessão
    console.log('\n2️⃣ Criando notas de sessão...');
    for (let i = 1; i <= 5; i++) {
        const sessaoId = await window.reportsManager.createReport(patientId, {
            reportType: 'session_note',
            title: `Sessão #${i}`,
            content: `Conteúdo da sessão ${i}...`,
            sessionDate: new Date(2024, 0, 15 + (i * 7)).toISOString().split('T')[0],
            sessionNumber: i
        });
        console.log(`  ✅ Sessão ${i} criada:`, sessaoId);
    }
    
    // 4. Criar relatório de progresso
    console.log('\n3️⃣ Criando relatório de progresso...');
    const progressoId = await window.reportsManager.createReport(patientId, {
        reportType: 'progress_report',
        title: 'Relatório de Progresso - 1 mês',
        content: 'Conteúdo do progresso...',
        sessionDate: '2024-02-15'
    });
    console.log('✅ Progresso criado:', progressoId);
    
    // 5. Listar todos os relatórios
    console.log('\n4️⃣ Listando todos os relatórios...');
    const allReports = await window.reportsManager.listReports(patientId);
    console.log(`  📋 Total: ${allReports.length} relatórios`);
    
    // 6. Obter estatísticas
    console.log('\n5️⃣ Obtendo estatísticas...');
    const stats = await window.reportsManager.getReportStatistics(patientId);
    console.log('  📊 Estatísticas:', stats);
    
    console.log('\n✅ FLUXO COMPLETO FINALIZADO!');
}

// ==================== EXPORTAR FUNÇÕES ====================

// Para usar no console do navegador:
window.exemploReports = {
    notaSessao: exemploNotaSessao,
    avaliacaoInicial: exemploAvaliacaoInicial,
    relatorioProgresso: exemploRelatorioProgresso,
    relatorioAlta: exemploRelatorioAlta,
    listarRelatorios: exemploListarRelatorios,
    filtrarPorTipo: exemploFiltrarPorTipo,
    atualizarRelatorio: exemploAtualizarRelatorio,
    assinarRelatorio: exemploAssinarRelatorio,
    estatisticas: exemploEstatisticas,
    usarTemplate: exemploUsarTemplate,
    exportarRelatorio: exemploExportarRelatorio,
    deletarRelatorio: exemploDeletarRelatorio,
    fluxoCompleto: exemploFluxoCompleto
};

console.log('📚 Exemplos de relatórios carregados!');
console.log('Para usar, abra o console e digite:');
console.log('  window.exemploReports.notaSessao()');
console.log('  window.exemploReports.fluxoCompleto()');
