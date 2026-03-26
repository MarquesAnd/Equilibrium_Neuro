/* ═══════════════════════════════════════════════════════════
   AUTH — Equilibrium Neuro
   Usa Firebase quando configurado, localStorage como fallback.
   ═══════════════════════════════════════════════════════════ */

const ALL_PAGES = [
  { id: "dashboard",  label: "Dashboard",          icon: "📊" },
  { id: "pacientes",  label: "Pacientes",           icon: "👤" },
  { id: "correcao",   label: "Correção de Testes",  icon: "✏️" },
  { id: "aplicacao",  label: "Aplicação de Testes", icon: "🧠" },
  { id: "relatorios", label: "Relatórios",          icon: "📄" },
  { id: "checklist",  label: "Checklist",           icon: "✅" },
  { id: "config",     label: "Configurações",       icon: "⚙️" },
];

/* ══════════════════════════════════════
   MODO: Firebase (se configurado) ou localStorage
   ══════════════════════════════════════ */
function _useFirebase() {
  return window.FIREBASE_CONFIGURED && window.DB && DB.isReady();
}

/* ══════════════════════════════════════
   FALLBACK — localStorage (modo offline / sem Firebase)
   ══════════════════════════════════════ */
const _LS_USERS  = "equilibrium_users_v3";
const _LS_CONFIG = "equilibrium_config_v3";
const _LS_AUTH   = "equilibrium_auth_v3";
const _LS_UID    = "equilibrium_auth_user_v3";

function _hashPassword(pwd) {
  let hash = 5381;
  for (let i = 0; i < pwd.length; i++) {
    hash = ((hash << 5) + hash) + pwd.charCodeAt(i);
    hash = hash & hash;
  }
  return "eq_" + (hash >>> 0).toString(16) + "_" + pwd.length;
}
function _verifyPassword(plain, hash) { return _hashPassword(plain) === hash; }

const _DEFAULT_USERS = [
  {
    id: "1",
    label: "Administrador",
    email: "admin@equilibrium.com",
    passwordHash: _hashPassword("admin123"),
    role: "admin",
    pages: ALL_PAGES.map(p => p.id),
    active: true,
  }
];

function _lsLoadUsers() {
  try {
    const raw = localStorage.getItem(_LS_USERS);
    if (raw) {
      let users = JSON.parse(raw);
      let changed = false;
      users = users.map(u => {
        if (!u.email && u.username) {
          u.email = u.username.includes("@") ? u.username : u.username + "@equilibrium.com";
          delete u.username;
          changed = true;
        }
        return u;
      });
      if (!users.some(u => u.role === "admin" && u.active)) {
        users = JSON.parse(JSON.stringify(_DEFAULT_USERS));
        changed = true;
      }
      if (changed) localStorage.setItem(_LS_USERS, JSON.stringify(users));
      return users;
    }
  } catch(e) {}
  localStorage.setItem(_LS_USERS, JSON.stringify(_DEFAULT_USERS));
  return JSON.parse(JSON.stringify(_DEFAULT_USERS));
}

function _lsSaveUsers(users) { localStorage.setItem(_LS_USERS, JSON.stringify(users)); }

/* ══════════════════════════════════════
   API PÚBLICA — LOGIN / LOGOUT
   ══════════════════════════════════════ */
async function doLogin(email, password) {
  if (!email    || !email.trim())    return { ok: false, message: "Informe o e-mail." };
  if (!password || !password.trim()) return { ok: false, message: "Informe a senha." };

  if (_useFirebase()) {
    return await DB.login(email, password);
  }

  // Fallback localStorage
  const users = _lsLoadUsers();
  const user  = users.find(u => u.email === email.trim().toLowerCase());
  if (!user)         return { ok: false, message: "E-mail não encontrado." };
  if (!user.active)  return { ok: false, message: "Usuário inativo. Contate o administrador." };
  if (!_verifyPassword(password, user.passwordHash))
    return { ok: false, message: "Senha incorreta." };
  sessionStorage.setItem(_LS_AUTH, "true");
  sessionStorage.setItem(_LS_UID, user.id);
  return { ok: true, user };
}

function doLogout() {
  if (_useFirebase()) { DB.logout(); return; }
  sessionStorage.removeItem(_LS_AUTH);
  sessionStorage.removeItem(_LS_UID);
  location.href = "/login.html";
}

function isAuthed() {
  if (_useFirebase()) return DB.isAuthed();
  return sessionStorage.getItem(_LS_AUTH) === "true";
}

function getAuthUser() {
  if (_useFirebase()) return DB.getAuthUser();
  const id = sessionStorage.getItem(_LS_UID);
  if (!id) return null;
  return _lsLoadUsers().find(u => u.id === String(id)) || null;
}

function isAdmin() {
  const u = getAuthUser();
  return u && u.role === "admin";
}

function getUserPages() {
  const u = getAuthUser();
  if (!u) return [];
  return ALL_PAGES.filter(p => (u.pages || []).includes(p.id));
}

function canAccessPage(pageId) {
  const u = getAuthUser();
  if (!u) return false;
  return (u.pages || []).includes(pageId);
}

function authGuard() {
  if (!isAuthed()) { location.href = "/login.html"; return false; }
  return true;
}

/* ══════════════════════════════════════
   API PÚBLICA — USUÁRIOS
   (síncrono no fallback, async no Firebase)
   ══════════════════════════════════════ */
async function getUsers() {
  if (_useFirebase()) return await DB.getUsers();
  return _lsLoadUsers();
}

async function getUserById(id) {
  if (_useFirebase()) return await DB.getUserById(id);
  return _lsLoadUsers().find(u => u.id === String(id)) || null;
}

async function createUser(data) {
  if (_useFirebase()) return await DB.createUser(data);
  const users = _lsLoadUsers();
  if (users.find(u => u.email === (data.email||"").toLowerCase()))
    return { ok: false, message: "E-mail já cadastrado." };
  const newUser = {
    id: String(Date.now()),
    label:        data.label || "Novo Usuário",
    email:        (data.email || "").trim().toLowerCase(),
    passwordHash: _hashPassword(data.password || ""),
    role:         data.role  || "user",
    pages:        data.pages || ["dashboard"],
    active:       true,
  };
  users.push(newUser);
  _lsSaveUsers(users);
  return { ok: true, user: newUser };
}

async function updateUser(id, data) {
  if (_useFirebase()) return await DB.updateUser(id, data);
  const users = _lsLoadUsers();
  const idx = users.findIndex(u => u.id === String(id));
  if (idx < 0) return { ok: false, message: "Usuário não encontrado." };
  const u = users[idx];
  if (data.label  !== undefined) u.label  = data.label;
  if (data.email  !== undefined) u.email  = data.email.trim().toLowerCase();
  if (data.role   !== undefined) u.role   = data.role;
  if (data.pages  !== undefined) u.pages  = data.pages;
  if (data.active !== undefined) u.active = data.active;
  if (data.password && data.password.trim())
    u.passwordHash = _hashPassword(data.password.trim());
  _lsSaveUsers(users);
  return { ok: true };
}

async function deleteUser(id) {
  if (_useFirebase()) return await DB.deleteUser(id);
  const users  = _lsLoadUsers();
  const admins = users.filter(u => u.role === "admin" && u.active);
  const target = users.find(u => u.id === String(id));
  if (target && target.role === "admin" && admins.length <= 1)
    return { ok: false, message: "Não é possível remover o único administrador." };
  _lsSaveUsers(users.filter(u => u.id !== String(id)));
  return { ok: true };
}

/* ══════════════════════════════════════
   API PÚBLICA — CONFIG
   ══════════════════════════════════════ */
async function loadConfig() {
  if (_useFirebase()) return await DB.loadConfig();
  try {
    const raw = localStorage.getItem(_LS_CONFIG);
    if (raw) return { nome:"",crp:"",especialidade:"",contato:"",clinica:"",cidade:"", ...JSON.parse(raw) };
  } catch(e) {}
  return { nome:"", crp:"", especialidade:"", contato:"", clinica:"", cidade:"" };
}

async function saveConfig(cfg) {
  if (_useFirebase()) return await DB.saveConfig(cfg);
  localStorage.setItem(_LS_CONFIG, JSON.stringify(cfg));
  return { ok: true };
}

/* ══════════════════════════════════════
   EXPOR GLOBALMENTE
   ══════════════════════════════════════ */
window.ALL_PAGES     = ALL_PAGES;
window.doLogin       = doLogin;
window.doLogout      = doLogout;
window.isAuthed      = isAuthed;
window.getAuthUser   = getAuthUser;
window.isAdmin       = isAdmin;
window.getUserPages  = getUserPages;
window.canAccessPage = canAccessPage;
window.authGuard     = authGuard;
window.getUsers      = getUsers;
window.getUserById   = getUserById;
window.createUser    = createUser;
window.updateUser    = updateUser;
window.deleteUser    = deleteUser;
window.loadConfig    = loadConfig;
window.saveConfig    = saveConfig;
