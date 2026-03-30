/* ═══════════════════════════════════════════════════════════
   FIREBASE CONFIG — Equilibrium Neuro
   VERSÃO: DOIS BANCOS FIREBASE SEPARADOS
   
   ⚠️  INSTRUÇÕES DE CONFIGURAÇÃO:
   
   FIREBASE 1 - USUÁRIOS (Autenticação):
   1. Acesse https://console.firebase.google.com
   2. Crie um projeto: "equilibrium-usuarios"
   3. Clique em "Adicionar app" > Web (</>)
   4. Copie os valores e cole em FIREBASE_CONFIG_USUARIOS
   5. Ative: Authentication > Email/Senha
   6. Crie: Firestore Database
   
   FIREBASE 2 - PACIENTES (Dados clínicos):
   1. No Firebase Console, crie outro projeto: "equilibrium-pacientes"
   2. Clique em "Adicionar app" > Web (</>)
   3. Copie os valores e cole em FIREBASE_CONFIG_PACIENTES
   4. Crie: Firestore Database
   5. NÃO precisa ativar Authentication neste projeto
   ═══════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────────────
   FIREBASE 1 - USUÁRIOS
   Para: Autenticação e dados dos profissionais
   ────────────────────────────────────────────────────────── */
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCRjDEX-N4eYkVTlvjegvdyx50D-UA28kE",
  authDomain:        "equilibrium-neuro-2de9b.firebaseapp.com",
  projectId:         "equilibrium-neuro-2de9b",
  storageBucket:     "equilibrium-neuro-2de9b.firebasestorage.app",
  messagingSenderId: "71729931353",
  appId:             "1:71729931353:web:8809cf1dfb48cb2f627d48"
};

/* ──────────────────────────────────────────────────────────
   FIREBASE 2 - PACIENTES
   Para: Pacientes, testes e relatórios
   ────────────────────────────────────────────────────────── */
const FIREBASE_CONFIG_PACIENTES = {
  apiKey:                "AIzaSyDX4daG7maFvJ5A3xqTz-BFD8cSBZhFc84",
  authDomain:            "pacientes-sistema.firebaseapp.com",
  projectId:             "pacientes-sistema",
  storageBucket:         "pacientes-sistema.firebasestorage.app",
  messagingSenderId:     "893642723504",
  appId:                 "1:893642723504:web:0a07e7a1457b7040f72b75"
};

/* ──────────────────────────────────────────────────────────
   Detecta se as credenciais já foram preenchidas
   ────────────────────────────────────────────────────────── */
window.FIREBASE_CONFIGURED = 
  !FIREBASE_CONFIG.apiKey.startsWith("COLE_AQUI") &&
  !FIREBASE_CONFIG_PACIENTES.apiKey.startsWith("COLE_AQUI");

/* ──────────────────────────────────────────────────────────
   Expor configurações para uso no db.js
   ────────────────────────────────────────────────────────── */
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
window.FIREBASE_CONFIG_PACIENTES = FIREBASE_CONFIG_PACIENTES;
