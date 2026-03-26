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

  // Exibir usuário logado na sidebar
  const user = getAuthUser();
  if (user) {
    document.getElementById("userName").textContent   = user.label;
    document.getElementById("userAvatar").textContent = user.label[0].toUpperCase();
    document.getElementById("userRole").textContent   = user.role === "admin" ? "Administrador" : "Usuário";
  }

  // Construir navegação baseada nas permissões do usuário
  buildNavigation();

  // Ir para a primeira página permitida (dashboard se disponível)
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

function navigateTo(pageId) {
  if (!canAccessPage(pageId)) return;

  const page = PAGE_REGISTRY[pageId];
  if (!page) return;

  currentPage = pageId;

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.page === pageId);
  });

  document.getElementById("pageTitle").textContent    = page.title;
  document.getElementById("pageSubtitle").textContent = page.subtitle;
  document.getElementById("pageBody").innerHTML       = page.render();

  window.scrollTo(0, 0);
}

window.navigateTo = navigateTo;
