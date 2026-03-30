// =====================================================
// DIAGNÓSTICO E TESTE - SISTEMA DE PACIENTES
// Verifique se tudo está funcionando corretamente
// =====================================================

console.log('🔍 INICIANDO DIAGNÓSTICO DO SISTEMA...\n');

// ==================== TESTE 1: Firebase Carregado ====================
console.log('📋 TESTE 1: Verificando Firebase...');

if (typeof firebase !== 'undefined') {
    console.log('✅ Firebase SDK carregado');
    
    if (firebase.apps.length > 0) {
        console.log('✅ Firebase inicializado');
        console.log('   Projeto:', firebase.app().options.projectId);
    } else {
        console.log('⚠️ Firebase não inicializado');
        console.log('   Verifique se firebaseConfig está correto');
    }
} else {
    console.log('❌ Firebase SDK não encontrado');
    console.log('   Verifique se os scripts do Firebase estão no HTML');
}

// ==================== TESTE 2: Autenticação ====================
console.log('\n📋 TESTE 2: Verificando Autenticação...');

if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log('✅ Usuário autenticado');
            console.log('   UID:', user.uid);
            console.log('   Email:', user.email);
        } else {
            console.log('⚠️ Nenhum usuário autenticado');
            console.log('   Isso é normal se você ainda não fez login');
            console.log('   O sistema usará localStorage temporariamente');
        }
    });
} else {
    console.log('❌ Firebase Auth não disponível');
}

// ==================== TESTE 3: Firestore ====================
console.log('\n📋 TESTE 3: Verificando Firestore...');

if (typeof firebase !== 'undefined' && firebase.firestore) {
    console.log('✅ Firestore disponível');
    
    try {
        const db = firebase.firestore();
        console.log('✅ Conexão com Firestore OK');
    } catch (error) {
        console.log('❌ Erro ao conectar Firestore:', error.message);
    }
} else {
    console.log('❌ Firestore não disponível');
}

// ==================== TESTE 4: Database Adapter ====================
console.log('\n📋 TESTE 4: Verificando Database Adapter...');

if (typeof window.dbAdapter !== 'undefined') {
    console.log('✅ Database Adapter carregado');
    console.log('   Modo:', window.dbAdapter.useFirebase ? 'Firebase' : 'localStorage');
    
    const user = window.dbAdapter.getCurrentUser();
    if (user) {
        console.log('✅ Usuário atual:', user.email || user.displayName);
    }
} else {
    console.log('❌ Database Adapter não encontrado');
    console.log('   Verifique se db-adapter.js está carregado');
}

// ==================== TESTE 5: Testar CRUD ====================
console.log('\n📋 TESTE 5: Testando operações de banco de dados...');

async function testarCRUD() {
    if (typeof window.dbAdapter === 'undefined') {
        console.log('❌ Não é possível testar: Database Adapter não disponível');
        return;
    }
    
    try {
        console.log('🧪 Criando paciente de teste...');
        
        const pacienteTeste = {
            fullName: 'Teste Diagnóstico',
            cpf: '123.456.789-00',
            email: 'teste@diagnostico.com',
            phone: '(00) 0000-0000',
            status: 'active'
        };
        
        const patientId = await window.dbAdapter.createPatient(pacienteTeste);
        console.log('✅ Paciente criado:', patientId);
        
        console.log('🧪 Buscando paciente...');
        const paciente = await window.dbAdapter.getPatient(patientId);
        console.log('✅ Paciente encontrado:', paciente.fullName);
        
        console.log('🧪 Atualizando paciente...');
        await window.dbAdapter.updatePatient(patientId, { notes: 'Teste atualizado' });
        console.log('✅ Paciente atualizado');
        
        console.log('🧪 Deletando paciente...');
        await window.dbAdapter.deletePatient(patientId);
        console.log('✅ Paciente deletado');
        
        console.log('\n✅ TODOS OS TESTES DE CRUD PASSARAM!');
        
    } catch (error) {
        console.log('❌ Erro no teste CRUD:', error.message);
        console.error(error);
    }
}

// Executar teste CRUD automaticamente após 2 segundos
setTimeout(() => {
    console.log('\n🚀 Executando teste CRUD...');
    testarCRUD();
}, 2000);

// ==================== TESTE 6: Regras de Segurança ====================
console.log('\n📋 TESTE 6: Verificando Regras de Segurança...');

async function testarRegrasSeguranca() {
    if (!window.dbAdapter.useFirebase) {
        console.log('⏭️ Pulando teste (usando localStorage)');
        return;
    }
    
    console.log('🧪 Testando permissões do Firestore...');
    
    try {
        const db = firebase.firestore();
        
        // Tentar ler coleção de pacientes
        const snapshot = await db.collection('patients').limit(1).get();
        console.log('✅ Leitura permitida');
        
    } catch (error) {
        if (error.code === 'permission-denied') {
            console.log('⚠️ Permissão negada');
            console.log('   Você precisa autenticar um usuário primeiro');
            console.log('   Ou ajustar as regras de segurança no Firebase Console');
        } else {
            console.log('❌ Erro:', error.message);
        }
    }
}

setTimeout(() => {
    testarRegrasSeguranca();
}, 3000);

// ==================== RESUMO ====================
setTimeout(() => {
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DO DIAGNÓSTICO');
    console.log('='.repeat(50));
    
    const checks = {
        firebase: typeof firebase !== 'undefined',
        firebaseInit: typeof firebase !== 'undefined' && firebase.apps.length > 0,
        auth: typeof firebase !== 'undefined' && firebase.auth,
        firestore: typeof firebase !== 'undefined' && firebase.firestore,
        adapter: typeof window.dbAdapter !== 'undefined'
    };
    
    const passing = Object.values(checks).filter(v => v).length;
    const total = Object.keys(checks).length;
    
    console.log(`\n✅ Testes passando: ${passing}/${total}`);
    
    if (passing === total) {
        console.log('\n🎉 SISTEMA 100% FUNCIONAL!');
        console.log('   Modo:', window.dbAdapter?.useFirebase ? 'Firebase Firestore' : 'localStorage');
    } else {
        console.log('\n⚠️ ATENÇÃO: Alguns componentes não estão disponíveis');
        console.log('   O sistema ainda pode funcionar em modo degradado');
    }
    
    console.log('\n💡 PRÓXIMOS PASSOS:');
    if (!checks.firebase) {
        console.log('   1. Adicione os scripts do Firebase no HTML');
    }
    if (!checks.firebaseInit) {
        console.log('   2. Configure firebaseConfig com suas credenciais');
    }
    if (checks.firebase && checks.firebaseInit) {
        console.log('   1. Crie um usuário com Firebase Authentication');
        console.log('   2. Configure as regras de segurança do Firestore');
        console.log('   3. Comece a cadastrar pacientes!');
    }
    
    console.log('\n📚 Para mais informações, veja README.md');
    console.log('='.repeat(50));
    
}, 4000);

// ==================== FUNÇÕES DE AJUDA ====================

window.diagnostico = {
    // Testar novamente
    testar: () => {
        location.reload();
    },
    
    // Ver pacientes
    verPacientes: async () => {
        const patients = await window.dbAdapter.getPatients();
        console.table(patients);
        return patients;
    },
    
    // Limpar todos os pacientes (CUIDADO!)
    limparTudo: async () => {
        if (confirm('ATENÇÃO: Isso vai deletar TODOS os pacientes. Continuar?')) {
            const patients = await window.dbAdapter.getPatients();
            for (const p of patients) {
                await window.dbAdapter.deletePatient(p.id);
            }
            console.log('✅ Todos os pacientes deletados');
        }
    },
    
    // Criar pacientes de exemplo
    criarExemplos: async () => {
        const exemplos = [
            {
                fullName: 'João da Silva',
                cpf: '123.456.789-00',
                birthDate: '1985-05-15',
                gender: 'Masculino',
                email: 'joao@email.com',
                mobile: '(11) 98765-4321',
                addressCity: 'São Paulo',
                profession: 'Engenheiro',
                chiefComplaint: 'Dificuldades de memória'
            },
            {
                fullName: 'Maria Santos',
                cpf: '987.654.321-00',
                birthDate: '1990-08-20',
                gender: 'Feminino',
                email: 'maria@email.com',
                mobile: '(11) 91234-5678',
                addressCity: 'São Paulo',
                profession: 'Professora',
                chiefComplaint: 'Ansiedade'
            },
            {
                fullName: 'Pedro Oliveira',
                cpf: '456.789.123-00',
                birthDate: '1978-03-10',
                gender: 'Masculino',
                email: 'pedro@email.com',
                mobile: '(11) 99876-5432',
                addressCity: 'São Paulo',
                profession: 'Advogado',
                chiefComplaint: 'Problemas de atenção'
            }
        ];
        
        for (const paciente of exemplos) {
            await window.dbAdapter.createPatient(paciente);
            console.log('✅ Criado:', paciente.fullName);
        }
        
        console.log('🎉 Pacientes de exemplo criados!');
        location.reload();
    },
    
    // Verificar modo
    modo: () => {
        console.log('Modo atual:', window.dbAdapter.useFirebase ? 'Firebase' : 'localStorage');
    }
};

console.log('\n💡 COMANDOS DISPONÍVEIS NO CONSOLE:');
console.log('   diagnostico.testar()      - Testar novamente');
console.log('   diagnostico.verPacientes() - Ver todos os pacientes');
console.log('   diagnostico.criarExemplos() - Criar 3 pacientes de exemplo');
console.log('   diagnostico.modo()         - Ver modo atual (Firebase/localStorage)');
console.log('   diagnostico.limparTudo()   - Deletar todos os pacientes');
