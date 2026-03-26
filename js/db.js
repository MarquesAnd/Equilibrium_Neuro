/* ═══════════════════════════════════════════════════════════
   DB — Camada de acesso ao Firestore
   Todas as operações de banco passam por aqui.
   auth.js e pages.js chamam estas funções.
   ═══════════════════════════════════════════════════════════ */

/* ── Referências das coleções ── */
const COL = {
  USUARIOS:  "usuarios",
  PACIENTES: "pacientes",
  RELATORIOS:"relatorios",
  CONFIG:    "config",
};

/* ══════════════════════════════════════
   INICIALIZAÇÃO
   ══════════════════════════════════════ */
let _db  = null;
let _auth = null;
let _fbReady = false;

//async function initFirebase() {
//  if (!window.FIREBASE_CONFIGURED) {
//    console.warn("Firebase não configurado — usando localStorage como fallback.");
//    return false;
//  }
//  try {
//    firebase.initializeApp(FIREBASE_CONFIG);
//    _db   = firebase.firestore();
//    _auth = firebase.auth();
//    _fbReady = true;
//
//    // Habilitar persistência offline (cache local mesmo sem internet)
//    // Usando configuração de cache compatível com SDK v9 compat
//    try {
//      await _db.enableMultiTabIndexedDbPersistence();
//    } catch(e) {
//      if (e.code === 'failed-precondition') {
//        // Múltiplas abas abertas — usar persistência simples
//        await _db.enablePersistence().catch(() => {});
//      } else if (e.code === 'unimplemented') {
//        // Browser não suporta — continuar sem persistência offline
//        console.info('Persistência offline não suportada neste navegador.');
//      }
//    }
//
//    console.log("✅ Firebase conectado");
//    return true;
//  } catch(e) {
    console.error("Erro ao inicializar Firebase:", e);
    return false;
  }
}

function isFirebaseReady() { return _fbReady; }

/* ══════════════════════════════════════
   AUTENTICAÇÃO (Firebase Auth)
   ══════════════════════════════════════ */

/* Login com email + senha via Firebase Auth */
async function dbLogin(email, password) {
  if (!_fbReady) return { ok: false, message: "Banco não inicializado." };
  try {
    const cred = await _auth.signInWithEmailAndPassword(email.trim().toLowerCase(), password);
    const uid  = cred.user.uid;

    // Buscar perfil do usuário no Firestore
    const doc = await _db.collection(COL.USUARIOS).doc(uid).get();
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
   USUÁRIOS
   ══════════════════════════════════════ */

/* Listar todos os usuários (apenas admin) */
async function dbGetUsers() {
  if (!_fbReady) return [];
  const snap = await _db.collection(COL.USUARIOS).orderBy("label").get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function dbGetUserById(uid) {
  if (!_fbReady) return null;
  const doc = await _db.collection(COL.USUARIOS).doc(uid).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

/* Criar usuário: cria no Firebase Auth + salva perfil no Firestore */
async function dbCreateUser(data) {
  if (!_fbReady) return { ok: false, message: "Banco não inicializado." };
  try {
    // 1. Criar no Firebase Authentication
    const cred = await _auth.createUserWithEmailAndPassword(
      data.email.trim().toLowerCase(), data.password
    );
    const uid = cred.user.uid;

    // 2. Salvar perfil no Firestore
    const profile = {
      label:   data.label || "Novo Usuário",
      email:   data.email.trim().toLowerCase(),
      role:    data.role  || "user",
      pages:   data.pages || ["dashboard"],
      active:  true,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
    };
    await _db.collection(COL.USUARIOS).doc(uid).set(profile);

    // 3. Fazer signOut do usuário recém-criado para não substituir sessão atual
    // (admin continua logado)
    await _auth.signOut();

    // 4. Re-logar o admin (workaround para Firebase Web SDK)
    // Nota: em produção, usar Admin SDK via Cloud Functions para criar usuários
    // sem afetar a sessão atual. Por ora, salvar token do admin antes.

    return { ok: true, user: { id: uid, ...profile } };
  } catch(e) {
    if (e.code === "auth/email-already-in-use")
      return { ok: false, message: "E-mail já cadastrado." };
    return { ok: false, message: "Erro ao criar usuário: " + e.message };
  }
}

/* Atualizar perfil (sem alterar senha) */
async function dbUpdateUser(uid, data) {
  if (!_fbReady) return { ok: false, message: "Banco não inicializado." };
  const update = {};
  if (data.label  !== undefined) update.label  = data.label;
  if (data.role   !== undefined) update.role   = data.role;
  if (data.pages  !== undefined) update.pages  = data.pages;
  if (data.active !== undefined) update.active = data.active;
  update.atualizadoEm = firebase.firestore.FieldValue.serverTimestamp();
  await _db.collection(COL.USUARIOS).doc(uid).update(update);

  // Atualizar sessão se for o usuário logado
  const current = dbGetAuthUser();
  if (current && current.id === uid) {
    sessionStorage.setItem("eq_user", JSON.stringify({ ...current, ...update }));
  }
  return { ok: true };
}

/* Desativar usuário (não deleta do Auth para preservar histórico) */
async function dbDeleteUser(uid) {
  if (!_fbReady) return { ok: false, message: "Banco não inicializado." };

  // Verificar se é o único admin
  const users  = await dbGetUsers();
  const target = users.find(u => u.id === uid);
  const admins = users.filter(u => u.role === "admin" && u.active);
  if (target && target.role === "admin" && admins.length <= 1)
    return { ok: false, message: "Não é possível remover o único administrador." };

  // Desativar em vez de deletar (preserva histórico de relatórios)
  await _db.collection(COL.USUARIOS).doc(uid).update({ active: false });
  return { ok: true };
}

/* ══════════════════════════════════════
   PACIENTES
   ══════════════════════════════════════ */

async function dbGetPacientes() {
  if (!_fbReady) return [];
  const snap = await _db.collection(COL.PACIENTES)
    .orderBy("nome").get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function dbGetPacienteById(id) {
  if (!_fbReady) return null;
  const doc = await _db.collection(COL.PACIENTES).doc(id).get();
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
    await _db.collection(COL.PACIENTES).doc(id).set(record, { merge: true });
    return { ok: true, id };
  } else {
    record.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
    record.criadoPor = user ? user.id : null;
    const ref = await _db.collection(COL.PACIENTES).add(record);
    return { ok: true, id: ref.id };
  }
}

async function dbDeletePaciente(id) {
  if (!_fbReady) return { ok: false };
  await _db.collection(COL.PACIENTES).doc(id).delete();
  return { ok: true };
}

/* ══════════════════════════════════════
   RELATÓRIOS / LAUDOS
   ══════════════════════════════════════ */

async function dbGetRelatorios(pacienteId = null) {
  if (!_fbReady) return [];
  let query = _db.collection(COL.RELATORIOS).orderBy("criadoEm", "desc");
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
    await _db.collection(COL.RELATORIOS).doc(id).set(record, { merge: true });
    return { ok: true, id };
  } else {
    record.criadoEm  = firebase.firestore.FieldValue.serverTimestamp();
    record.criadoPor = user ? user.id : null;
    const ref = await _db.collection(COL.RELATORIOS).add(record);
    return { ok: true, id: ref.id };
  }
}

async function dbDeleteRelatorio(id) {
  if (!_fbReady) return { ok: false };
  await _db.collection(COL.RELATORIOS).doc(id).delete();
  return { ok: true };
}

/* ══════════════════════════════════════
   CONFIGURAÇÕES DO PROFISSIONAL
   ══════════════════════════════════════ */

const CONFIG_DOC_ID = "profissional";

async function dbLoadConfig() {
  if (!_fbReady) return { nome:"", crp:"", especialidade:"", contato:"", clinica:"", cidade:"" };
  const doc = await _db.collection(COL.CONFIG).doc(CONFIG_DOC_ID).get();
  return doc.exists ? doc.data() : { nome:"", crp:"", especialidade:"", contato:"", clinica:"", cidade:"" };
}

async function dbSaveConfig(cfg) {
  if (!_fbReady) return { ok: false };
  await _db.collection(COL.CONFIG).doc(CONFIG_DOC_ID).set({
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
  // Usuários
  getUsers:       dbGetUsers,
  getUserById:    dbGetUserById,
  createUser:     dbCreateUser,
  updateUser:     dbUpdateUser,
  deleteUser:     dbDeleteUser,
  // Pacientes
  getPacientes:   dbGetPacientes,
  getPaciente:    dbGetPacienteById,
  savePaciente:   dbSavePaciente,
  deletePaciente: dbDeletePaciente,
  // Relatórios
  getRelatorios:  dbGetRelatorios,
  saveRelatorio:  dbSaveRelatorio,
  deleteRelatorio:dbDeleteRelatorio,
  // Config
  loadConfig:     dbLoadConfig,
  saveConfig:     dbSaveConfig,
};
