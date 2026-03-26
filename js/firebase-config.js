/* ═══════════════════════════════════════════════════════════
   FIREBASE CONFIG — Equilibrium Neuro
   
   ⚠️  INSTRUÇÕES DE CONFIGURAÇÃO:
   1. Acesse https://console.firebase.google.com
   2. Crie um projeto chamado "equilibrium-neuro"
   3. Clique em "Adicionar app" > Web (</>)
   4. Copie os valores do firebaseConfig e cole aqui abaixo
   5. No painel Firebase: ative Authentication > Email/Senha
   6. No painel Firebase: crie o Firestore Database
   ═══════════════════════════════════════════════════════════ */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCRjDEX-N4eYkVTlvjegvdyx50D-UA28kE",
  authDomain:        "equilibrium-neuro-2de9b.firebaseapp.com",
  projectId:         "equilibrium-neuro-2de9b",
  storageBucket:     "equilibrium-neuro-2de9b.firebasestorage.app",
  messagingSenderId: "71729931353",
  appId:             "1:71729931353:web:8809cf1dfb48cb2f627d48"
};

/* Detecta se as credenciais já foram preenchidas */
window.FIREBASE_CONFIGURED = !FIREBASE_CONFIG.apiKey.startsWith("COLE AQUI");
