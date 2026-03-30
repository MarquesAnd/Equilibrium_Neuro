// =====================================================
// EQUILIBRIUM NEURO - FIREBASE CONFIGURATION
// Configuração do Firebase para Pacientes e Relatórios
// =====================================================

// TODO: Substitua com suas credenciais do Firebase Console
// https://console.firebase.google.com/
const firebaseConfig = {
    apiKey: "AIzaSyDX4daG7maFvJ5A3xqTz-BFD8cSBZhFc84",
    authDomain: "pacientes-sistema.firebaseapp.com",
    projectId: "pacientes-sistema",
    storageBucket: "pacientes-sistema.firebasestorage.app",
    messagingSenderId: "893642723504",
    appId: "1:893642723504:web:0a07e7a1457b7040f72b75",
    databaseURL: "https://seu-projeto.firebaseio.com"
};

// Inicializar Firebase
let app, auth, db, storage;

try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    
    console.log('✅ Firebase inicializado com sucesso');
} catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
}

// =====================================================
// ESTRUTURA DO BANCO DE DADOS FIRESTORE
// =====================================================

/*
COLEÇÕES PRINCIPAIS:

1. users/ (Autenticação - já existe)
   └─ {userId}
       ├─ email: string
       ├─ displayName: string
       ├─ createdAt: timestamp
       └─ role: string

2. patients/ (NOVO - Pacientes)
   └─ {patientId}
       ├─ userId: string (referência ao profissional)
       ├─ fullName: string
       ├─ cpf: string
       ├─ birthDate: timestamp
       ├─ gender: string
       ├─ email: string
       ├─ phone: string
       ├─ mobile: string
       ├─ address: {
       │    street: string
       │    number: string
       │    complement: string
       │    neighborhood: string
       │    city: string
       │    state: string
       │    zipcode: string
       │ }
       ├─ clinicalInfo: {
       │    profession: string
       │    emergencyContact: {
       │        name: string
       │        phone: string
       │    }
       │    healthInsurance: string
       │    healthInsuranceNumber: string
       │    chiefComplaint: string
       │    medicalHistory: string
       │    medications: string
       │    allergies: string
       │ }
       ├─ status: string (active, inactive, discharged)
       ├─ notes: string
       ├─ createdAt: timestamp
       ├─ updatedAt: timestamp
       │
       └─ reports/ (SUBCOLEÇÃO - Relatórios do Paciente)
            └─ {reportId}
                ├─ patientId: string
                ├─ userId: string
                ├─ reportType: string (session_note, evaluation, discharge, progress_report)
                ├─ title: string
                ├─ content: string
                ├─ sessionDate: timestamp
                ├─ sessionNumber: number
                ├─ sessionData: {
                │    duration: number
                │    goals: string
                │    interventions: string
                │    patientResponse: string
                │    homework: string
                │ }
                ├─ attachments: array
                ├─ isSigned: boolean
                ├─ signedAt: timestamp
                ├─ createdAt: timestamp
                └─ updatedAt: timestamp

3. appointments/ (Agendamentos)
   └─ {appointmentId}
       ├─ patientId: string (referência ao paciente)
       ├─ userId: string
       ├─ appointmentDate: timestamp
       ├─ startTime: string
       ├─ endTime: string
       ├─ title: string
       ├─ type: string
       ├─ status: string
       ├─ notes: string
       ├─ createdAt: timestamp
       └─ updatedAt: timestamp
*/

// =====================================================
// ÍNDICES RECOMENDADOS PARA OTIMIZAÇÃO
// =====================================================

/*
CRIAR NO FIREBASE CONSOLE:

Collection: patients
- userId (Ascending) + status (Ascending)
- userId (Ascending) + createdAt (Descending)
- cpf (Ascending)

Collection: reports (subcoleção em patients)
- patientId (Ascending) + sessionDate (Descending)
- userId (Ascending) + createdAt (Descending)
- reportType (Ascending) + sessionDate (Descending)

Collection: appointments
- userId (Ascending) + appointmentDate (Ascending)
- patientId (Ascending) + appointmentDate (Ascending)
- appointmentDate (Ascending) + status (Ascending)
*/

// Exportar para uso global
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;
