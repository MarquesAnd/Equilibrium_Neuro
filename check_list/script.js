/* ═══════════════════════════════════
   CHECKLIST v2 — Lógica
   Abas + Checkbox + Contador
   ═══════════════════════════════════ */
document.addEventListener("DOMContentLoaded", function() {

  // Tabs
  var tabs = document.querySelectorAll(".cl-tab");
  var contents = document.querySelectorAll(".cl-content");

  tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
      tabs.forEach(function(t) { t.classList.remove("active"); });
      contents.forEach(function(c) { c.classList.remove("active"); });
      tab.classList.add("active");
      document.getElementById(tab.getAttribute("data-target")).classList.add("active");
      updateCounts();
    });
  });

  // Checkbox highlight + count
  document.querySelectorAll(".cl-check").forEach(function(cb) {
    cb.addEventListener("change", function() {
      var tr = this.closest("tr");
      var tabId = this.closest(".cl-content")?.id;
      var color = tabId === "pre-escolar" ? "rgba(124,58,237,.04)" : tabId === "escolar" ? "rgba(13,148,136,.04)" : "rgba(26,86,219,.04)";
      tr.style.backgroundColor = this.checked ? color : "";
      updateCounts();
    });
  });

  function updateCounts() {
    ["pre-escolar","escolar","adultos"].forEach(function(id) {
      var panel = document.getElementById(id);
      if (!panel) return;
      var total = panel.querySelectorAll(".cl-check").length;
      var checked = panel.querySelectorAll(".cl-check:checked").length;
      var badge = document.querySelector('.cl-tab[data-target="' + id + '"] .tab-count');
      if (badge) badge.textContent = checked > 0 ? checked + "/" + total : total;
    });
    // Stats
    var all = document.querySelectorAll(".cl-check").length;
    var sel = document.querySelectorAll(".cl-check:checked").length;
    var stat = document.getElementById("clStatTotal");
    if (stat) stat.textContent = sel + " de " + all + " selecionados";
  }

  updateCounts();
});
