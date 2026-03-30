// =====================================================
// FIREBASE CONFIGURATION - EQUILIBRIUM NEURO
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyDX4daG7maFvJ5A3xqTz-BFD8cSBZhFc84",
  authDomain: "pacientes-sistema.firebaseapp.com",
  projectId: "pacientes-sistema",
  storageBucket: "pacientes-sistema.firebasestorage.app",
  messagingSenderId: "893642723504",
  appId: "1:893642723504:web:0a07e7a1457b7040f72b75"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Autenticação Anônima Automática
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        firebase.auth().signInAnonymously()
            .then(() => {
                console.log('✅ Autenticado no Firebase');
            })
            .catch((error) => {
                console.error('❌ Erro na autenticação:', error);
            });
    }
});

console.log('🔥 Firebase inicializado:', firebaseConfig.projectId);
