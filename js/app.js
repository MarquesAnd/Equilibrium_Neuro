/* ═══════════════════════════════════
   APP — Controller principal
   ═══════════════════════════════════ */

let currentPage = "dashboard";

document.addEventListener("DOMContentLoaded", () => {
  if (!isAuthed()) {
    location.href = "/login.html";
    return;
  }
  showApp();
});

function showApp() {
  document.getElementById("loginScreen").style.display   = "none";
  document.getElementById("appShell").style.display      = "flex";

  const user = getAuthUser();
  if (user) {
    document.getElementById("userName").textContent   = user.label;
    document.getElementById("userAvatar").textContent = user.label[0].toUpperCase();
    document.getElementById("userRole").textContent   = user.role === "admin" ? "Administrador" : "Usuário";
  }

  buildNavigation();

  const pages = getUserPages();
  const first = pages.find(p => p.id === "dashboard") || pages[0];
  if (first) navigateTo(first.id);
}

/* ══════════════════════════
   NAVEGAÇÃO COM PERMISSÕES
   ══════════════════════════ */
function buildNavigation() {
  const nav      = document.querySelector(".sidebar-nav");
  const allowed  = getUserPages();

  nav.innerHTML = allowed.map(p => `
    <button class="nav-item" data-page="${p.id}">
      <span class="nav-icon">${p.icon}</span>
      <span>${p.label}</span>
    </button>`).join("");

  nav.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      const page = item.dataset.page;
      if (page) navigateTo(page);
    });
  });
}

async function navigateTo(pageId) {
  if (!canAccessPage(pageId)) return;

  const page = PAGE_REGISTRY[pageId];
  if (!page) return;

  currentPage = pageId;

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.page === pageId);
  });

  document.getElementById("pageTitle").textContent    = page.title;
  document.getElementById("pageSubtitle").textContent = page.subtitle;

  const body = document.getElementById("pageBody");
  const result = page.render();

  if (result && typeof result.then === "function") {
    body.innerHTML = `
      <div class="dash-loading">
        <div class="dash-spinner"></div>
        <span>Carregando dados...</span>
      </div>`;
    try {
      body.innerHTML = await result;
    } catch(e) {
      console.error("Erro ao renderizar página:", e);
      body.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Erro ao carregar</div><div class="empty-desc">${e.message}</div></div></div>`;
    }
  } else {
    body.innerHTML = result;
  }

  window.scrollTo(0, 0);
}

window.navigateTo = navigateTo;
