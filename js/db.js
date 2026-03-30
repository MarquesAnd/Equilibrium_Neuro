/* ═══════════════════════════════════════════════════════════
   DB — Camada de acesso ao Firestore
   VERSÃO: DOIS BANCOS FIREBASE SEPARADOS
   
   Este arquivo gerencia:
   - Firebase 1 (Usuários): Autenticação e dados dos profissionais
   - Firebase 2 (Pacientes): Pacientes, testes e relatórios
   
   As configurações estão em: /js/firebase-config.js
   ═══════════════════════════════════════════════════════════ */

/* ── Referências das coleções ── */
const COL = {
  // Banco de Usuários
  USUARIOS:  "usuarios",
  CONFIG:    "config",
  
  // Banco de Pacientes
  PACIENTES: "pacientes",
  RELATORIOS:"relatorios",
};

/* ══════════════════════════════════════
   INICIALIZAÇÃO DOS DOIS FIREBASE
   ══════════════════════════════════════ */
let _dbUsuarios  = null;  // Firestore do banco de usuários
let _dbPacientes = null;  // Firestore do banco de pacientes
let _auth = null;         // Auth (no banco de usuários)
let _fbReady = false;

async function initFirebase() {
  if (!window.FIREBASE_CONFIGURED) {
    console.warn("Firebase não configurado — usando localStorage como fallback.");
    return false;
  }
  
  try {
    // Buscar configurações do firebase-config.js
    const configUsuarios = window.FIREBASE_CONFIG_USUARIOS;
    const configPacientes = window.FIREBASE_CONFIG_PACIENTES;
    
    if (!configUsuarios || !configPacientes) {
      console.error("Configurações do Firebase não encontradas. Verifique firebase-config.js");
      return false;
    }
    
    // Inicializar Firebase de USUÁRIOS (principal)
    const appUsuarios = firebase.initializeApp(configUsuarios, "usuarios");
    _dbUsuarios = appUsuarios.firestore();
    _auth = appUsuarios.auth();
    
    // Inicializar Firebase de PACIENTES (secundário)
    const appPacientes = firebase.initializeApp(configPacientes, "pacientes");
    _dbPacientes = appPacientes.firestore();
    
    _fbReady = true;

    // Habilitar persistência offline em ambos
    try {
      await _dbUsuarios.enableMultiTabIndexedDbPersistence();
      await _dbPacientes.enableMultiTabIndexedDbPersistence();
    } catch(e) {
      if (e.code === 'failed-precondition') {
        await _dbUsuarios.enablePersistence().catch(() => {});
        await _dbPacientes.enablePersistence().catch(() => {});
      } else if (e.code === 'unimplemented') {
        console.info('Persistência offline não suportada neste navegador.');
      }
    }

    console.log("✅ Firebase Usuários conectado");
    console.log("✅ Firebase Pacientes conectado");
    return true;
  } catch(e) {
    console.error("Erro ao inicializar Firebase:", e);
    return false;
  }
}

function isFirebaseReady() { return _fbReady; }

/* ══════════════════════════════════════
   AUTENTICAÇÃO (Firebase Auth - Usuários)
   ══════════════════════════════════════ */

async function dbLogin(email, password) {
  if (!_fbReady) return { ok: false, message: "Banco não inicializado." };
  try {
    const cred = await _auth.signInWithEmailAndPassword(email.trim().toLowerCase(), password);
    const uid  = cred.user.uid;

    // Buscar perfil do usuário no Firestore de USUÁRIOS
    const doc = await _dbUsuarios.collection(COL.USUARIOS).doc(uid).get();
    if (!doc.exists) return { ok: false, message: "Perfil de usuário não encontrado." };

    const userData = doc.data();
    if (!userData.active) {
      await _auth.signOut();
      return { ok: false, message: "Usuário inativo. Contate o administrador." };
    }

    // Salvar sessão local
    sessionStorage.setItem("eq_uid", uid);
    sessionStorage.setItem("eq_user", JSON.stringify({ id: uid, ...userData }));

    return { ok: true, user: { id: uid, ...userData } };
  } catch(e) {
    if (e.code === "auth/user-not-found" || e.code === "auth/invalid-email")
      return { ok: false, message: "E-mail não encontrado." };
    if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential")
      return { ok: false, message: "Senha incorreta." };
    if (e.code === "auth/too-many-requests")
      return { ok: false, message: "Muitas tentativas. Aguarde alguns minutos." };
    return { ok: false, message: "Erro ao fazer login: " + e.message };
  }
}

async function dbLogout() {
  if (_fbReady) await _auth.signOut();
  sessionStorage.removeItem("eq_uid");
  sessionStorage.removeItem("eq_user");
  location.href = "/login.html";
}

function dbIsAuthed() {
  return !!sessionStorage.getItem("eq_uid");
}

function dbGetAuthUser() {
  try {
    const raw = sessionStorage.getItem("eq_user");
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

/* ══════════════════════════════════════
   USUÁRIOS (Banco de Usuários)
   ══════════════════════════════════════ */

async function dbGetUsers() {
  if (!_fbReady) return [];
  const snap = await _dbUsuarios.collection(COL.USUARIOS).orderBy("label").get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function dbGetUserById(uid) {
  if (!_fbReady) return null;
  const doc = await _dbUsuarios.collection(COL.USUARIOS).doc(uid).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function dbCreateUser(data) {
  if (!_fbReady) return { ok: false, message: "Banco não inicializado." };
  try {
    const configUsuarios = window.FIREBASE_CONFIG_USUARIOS;
    
    // Criar usuário no Auth usando app fantasma
    const ghostApp = firebase.initializeApp(configUsuarios, "SecondaryApp");
    const cred = await ghostApp.auth().createUserWithEmailAndPassword(
      data.email.trim().toLowerCase(), data.password
    );
    const uid = cred.user.uid;

    await ghostApp.auth().signOut();
    await ghostApp.delete();

    // Salvar perfil no Firestore de USUÁRIOS
    const profile = {
      label:   data.label || "Novo Usuário",
      email:   data.email.trim().toLowerCase(),
      role:    data.role  || "user",
      pages:   data.pages || ["dashboard"],
      active:  true,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await _dbUsuarios.collection(COL.USUARIOS).doc(uid).set(profile);
    return { ok: true, user: { id: uid, ...profile } };
  } catch(e) {
    if (e.code === "auth/email-already-in-use")
      return { ok: false, message: "E-mail já cadastrado." };
    return { ok: false, message: "Erro ao criar usuário: " + e.message };
  }
}

async function dbUpdateUser(uid, data) {
  if (!_fbReady) return { ok: false, message: "Banco não inicializado." };
  const update = {};
  if (data.label  !== undefined) update.label  = data.label;
  if (data.role   !== undefined) update.role   = data.role;
  if (data.pages  !== undefined) update.pages  = data.pages;
  if (data.active !== undefined) update.active = data.active;
  update.atualizadoEm = firebase.firestore.FieldValue.serverTimestamp();
  await _dbUsuarios.collection(COL.USUARIOS).doc(uid).update(update);

  // Atualizar sessão se for o usuário logado
  const current = dbGetAuthUser();
  if (current && current.id === uid) {
    sessionStorage.setItem("eq_user", JSON.stringify({ ...current, ...update }));
  }
  return { ok: true };
}

async function dbDeleteUser(uid) {
  if (!_fbReady) return { ok: false, message: "Banco não inicializado." };

  const users  = await dbGetUsers();
  const target = users.find(u => u.id === uid);
  const admins = users.filter(u => u.role === "admin" && u.active);
  if (target && target.role === "admin" && admins.length <= 1)
    return { ok: false, message: "Não é possível remover o único administrador." };

  await _dbUsuarios.collection(COL.USUARIOS).doc(uid).update({ active: false });
  return { ok: true };
}

/* ══════════════════════════════════════
   PACIENTES (Banco de Pacientes) ⭐
   ══════════════════════════════════════ */

async function dbGetPacientes() {
  if (!_fbReady) return [];
  const snap = await _dbPacientes.collection(COL.PACIENTES)
    .orderBy("nome").get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function dbGetPacienteById(id) {
  if (!_fbReady) return null;
  const doc = await _dbPacientes.collection(COL.PACIENTES).doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function dbSavePaciente(data, id = null) {
  if (!_fbReady) return { ok: false };
  const user = dbGetAuthUser();
  const record = {
    ...data,
    atualizadoPor: user ? user.id : null,
    atualizadoEm:  firebase.firestore.FieldValue.serverTimestamp(),
  };
  if (id) {
    await _dbPacientes.collection(COL.PACIENTES).doc(id).set(record, { merge: true });
    return { ok: true, id };
  } else {
    record.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
    record.criadoPor = user ? user.id : null;
    const ref = await _dbPacientes.collection(COL.PACIENTES).add(record);
    return { ok: true, id: ref.id };
  }
}

async function dbDeletePaciente(id) {
  if (!_fbReady) return { ok: false };
  await _dbPacientes.collection(COL.PACIENTES).doc(id).delete();
  return { ok: true };
}

/* ══════════════════════════════════════
   TESTES DO PACIENTE (Subcoleção no Banco de Pacientes) ⭐
   ══════════════════════════════════════ */

async function dbGetTestesPaciente(pacienteId) {
  if (!_fbReady) return [];
  const snap = await _dbPacientes
    .collection(COL.PACIENTES)
    .doc(pacienteId)
    .collection('testes')
    .orderBy('criadoEm', 'desc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function dbGetTestePacienteById(pacienteId, testeId) {
  if (!_fbReady) return null;
  const doc = await _dbPacientes
    .collection(COL.PACIENTES)
    .doc(pacienteId)
    .collection('testes')
    .doc(testeId)
    .get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function dbSalvarTestePaciente(pacienteId, data, testeId = null) {
  if (!_fbReady) return { ok: false, message: "Banco não inicializado." };
  
  const user = dbGetAuthUser();
  const record = {
    ...data,
    atualizadoPor: user ? user.id : null,
    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    if (testeId) {
      await _dbPacientes
        .collection(COL.PACIENTES)
        .doc(pacienteId)
        .collection('testes')
        .doc(testeId)
        .set(record, { merge: true });
      return { ok: true, id: testeId };
    } else {
      record.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
      record.criadoPor = user ? user.id : null;
      
      const ref = await _dbPacientes
        .collection(COL.PACIENTES)
        .doc(pacienteId)
        .collection('testes')
        .add(record);
      
      return { ok: true, id: ref.id };
    }
  } catch (error) {
    console.error('Erro ao salvar teste do paciente:', error);
    return { ok: false, message: error.message };
  }
}

async function dbDeletarTestePaciente(pacienteId, testeId) {
  if (!_fbReady) return { ok: false };
  await _dbPacientes
    .collection(COL.PACIENTES)
    .doc(pacienteId)
    .collection('testes')
    .doc(testeId)
    .delete();
  return { ok: true };
}

async function dbGetTestesPorTipo(pacienteId, tipoTeste) {
  if (!_fbReady) return [];
  const snap = await _dbPacientes
    .collection(COL.PACIENTES)
    .doc(pacienteId)
    .collection('testes')
    .where('tipo', '==', tipoTeste)
    .orderBy('criadoEm', 'desc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function dbGetTestesPorStatus(pacienteId, status) {
  if (!_fbReady) return [];
  const snap = await _dbPacientes
    .collection(COL.PACIENTES)
    .doc(pacienteId)
    .collection('testes')
    .where('status', '==', status)
    .orderBy('criadoEm', 'desc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function dbContarTestesPaciente(pacienteId) {
  if (!_fbReady) return { total: 0, aplicados: 0, corrigidos: 0 };
  
  const snap = await _dbPacientes
    .collection(COL.PACIENTES)
    .doc(pacienteId)
    .collection('testes')
    .get();
  
  const testes = snap.docs.map(d => d.data());
  
  return {
    total: testes.length,
    aplicados: testes.filter(t => t.status === 'aplicado' || t.status === 'corrigido').length,
    corrigidos: testes.filter(t => t.status === 'corrigido').length,
    emAndamento: testes.filter(t => t.status === 'em-aplicacao').length
  };
}

/* ══════════════════════════════════════
   RELATÓRIOS (Banco de Pacientes)
   ══════════════════════════════════════ */

async function dbGetRelatorios(pacienteId = null) {
  if (!_fbReady) return [];
  let query = _dbPacientes.collection(COL.RELATORIOS).orderBy("criadoEm", "desc");
  if (pacienteId) query = query.where("pacienteId", "==", pacienteId);
  const snap = await query.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function dbSaveRelatorio(data, id = null) {
  if (!_fbReady) return { ok: false };
  const user = dbGetAuthUser();
  const record = {
    ...data,
    atualizadoPor: user ? user.id : null,
    atualizadoEm:  firebase.firestore.FieldValue.serverTimestamp(),
  };
  if (id) {
    await _dbPacientes.collection(COL.RELATORIOS).doc(id).set(record, { merge: true });
    return { ok: true, id };
  } else {
    record.criadoEm  = firebase.firestore.FieldValue.serverTimestamp();
    record.criadoPor = user ? user.id : null;
    const ref = await _dbPacientes.collection(COL.RELATORIOS).add(record);
    return { ok: true, id: ref.id };
  }
}

async function dbDeleteRelatorio(id) {
  if (!_fbReady) return { ok: false };
  await _dbPacientes.collection(COL.RELATORIOS).doc(id).delete();
  return { ok: true };
}

/* ══════════════════════════════════════
   CONFIGURAÇÕES DO PROFISSIONAL (Banco de Usuários)
   ══════════════════════════════════════ */

const CONFIG_DOC_ID = "profissional";

async function dbLoadConfig() {
  if (!_fbReady) return { nome:"", crp:"", especialidade:"", contato:"", clinica:"", cidade:"" };
  const doc = await _dbUsuarios.collection(COL.CONFIG).doc(CONFIG_DOC_ID).get();
  return doc.exists ? doc.data() : { nome:"", crp:"", especialidade:"", contato:"", clinica:"", cidade:"" };
}

async function dbSaveConfig(cfg) {
  if (!_fbReady) return { ok: false };
  await _dbUsuarios.collection(COL.CONFIG).doc(CONFIG_DOC_ID).set({
    ...cfg,
    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return { ok: true };
}

/* ══════════════════════════════════════
   EXPOR GLOBALMENTE
   ══════════════════════════════════════ */
window.DB = {
  init:           initFirebase,
  isReady:        isFirebaseReady,
  
  // Auth
  login:          dbLogin,
  logout:         dbLogout,
  isAuthed:       dbIsAuthed,
  getAuthUser:    dbGetAuthUser,
  
  // Usuários (Banco de Usuários)
  getUsers:       dbGetUsers,
  getUserById:    dbGetUserById,
  createUser:     dbCreateUser,
  updateUser:     dbUpdateUser,
  deleteUser:     dbDeleteUser,
  
  // Pacientes (Banco de Pacientes) ⭐
  getPacientes:   dbGetPacientes,
  getPaciente:    dbGetPacienteById,
  savePaciente:   dbSavePaciente,
  deletePaciente: dbDeletePaciente,
  
  // Testes do Paciente (Subcoleção no Banco de Pacientes) ⭐
  getTestesPaciente:      dbGetTestesPaciente,
  getTestePaciente:       dbGetTestePacienteById,
  salvarTestePaciente:    dbSalvarTestePaciente,
  deletarTestePaciente:   dbDeletarTestePaciente,
  getTestesPorTipo:       dbGetTestesPorTipo,
  getTestesPorStatus:     dbGetTestesPorStatus,
  contarTestesPaciente:   dbContarTestesPaciente,
  
  // Relatórios (Banco de Pacientes)
  getRelatorios:  dbGetRelatorios,
  saveRelatorio:  dbSaveRelatorio,
  deleteRelatorio:dbDeleteRelatorio,
  
  // Config (Banco de Usuários)
  loadConfig:     dbLoadConfig,
  saveConfig:     dbSaveConfig,
};
