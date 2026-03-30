/* ═══════════════════════════════════════════════════════
   CHECKLIST v3 — Lógica + Relatório estilo SRS-2
   Abas · Checkbox · Contador · Overlay de Relatório
   ═══════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", function () {

  /* ── 1. TABS ──────────────────────────────────────── */
  var tabs     = document.querySelectorAll(".cl-tab");
  var contents = document.querySelectorAll(".cl-content");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("active"); });
      contents.forEach(function (c) { c.classList.remove("active"); });
      tab.classList.add("active");
      document.getElementById(tab.getAttribute("data-target")).classList.add("active");
      updateCounts();
    });
  });

  /* ── 2. CHECKBOX HIGHLIGHT + CONTAGEM ─────────────── */
  document.querySelectorAll(".cl-check").forEach(function (cb) {
    cb.addEventListener("change", function () {
      var tr    = this.closest("tr");
      var tabId = (this.closest(".cl-content") || {}).id;
      var color = tabId === "pre-escolar"
        ? "rgba(124,58,237,.05)"
        : tabId === "escolar"
          ? "rgba(13,148,136,.05)"
          : "rgba(26,86,219,.05)";
      tr.style.backgroundColor = this.checked ? color : "";
      updateCounts();
    });
  });

  function updateCounts() {
    ["pre-escolar", "escolar", "adultos"].forEach(function (id) {
      var panel = document.getElementById(id);
      if (!panel) return;
      var total   = panel.querySelectorAll(".cl-check").length;
      var checked = panel.querySelectorAll(".cl-check:checked").length;
      var badge   = document.querySelector('.cl-tab[data-target="' + id + '"] .tab-count');
      if (badge) badge.textContent = checked > 0 ? checked + "/" + total : total;
    });

    var all  = document.querySelectorAll(".cl-check").length;
    var sel  = document.querySelectorAll(".cl-check:checked").length;
    var stat = document.getElementById("clStatTotal");
    if (stat) stat.textContent = sel + " de " + all + " selecionados";
  }

  updateCounts();

  /* ── 3. BOTÃO GERAR RELATÓRIO ─────────────────────── */
  var btnRel = document.getElementById("btnGerarRelatorio");
  if (btnRel) {
    btnRel.addEventListener("click", abrirRelatorio);
  }

  /* ── 4. FECHAR OVERLAY ────────────────────────────── */
  var btnFechar = document.getElementById("btnFecharRelatorio");
  if (btnFechar) {
    btnFechar.addEventListener("click", function () {
      var overlay = document.getElementById("clReportOverlay");
      if (overlay) overlay.classList.remove("ativo");
    });
  }

  /* ── 5. IMPRIMIR DENTRO DO OVERLAY ───────────────── */
  var btnImprimir = document.getElementById("btnImprimirRelatorio");
  if (btnImprimir) {
    btnImprimir.addEventListener("click", function () {
      window.print();
    });
  }

  /* ── 6. LÓGICA DE GERAÇÃO DO RELATÓRIO ────────────── */
  function abrirRelatorio() {
    var paciente   = document.querySelector('.cl-form input[placeholder="Nome completo"]')?.value.trim() || "—";
    var cpf        = document.querySelector('.cl-form input[placeholder="000.000.000-00"]')?.value.trim() || "—";
    var idadeA     = document.querySelector('.idade-group input:nth-child(1)')?.value.trim() || "";
    var idadeM     = document.querySelector('.idade-group input:nth-child(2)')?.value.trim() || "";
    var idadeD     = document.querySelector('.idade-group input:nth-child(3)')?.value.trim() || "";
    var hipoteses  = document.querySelector('.cl-form input[placeholder="Diagnósticos em investigação"]')?.value.trim() || "—";

    var idadeStr = "";
    if (idadeA) idadeStr += idadeA + "a ";
    if (idadeM) idadeStr += idadeM + "m ";
    if (idadeD) idadeStr += idadeD + "d";
    idadeStr = idadeStr.trim() || "—";

    var hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

    /* Coleta instrumentos selecionados por aba */
    var dados = { "pre-escolar": [], escolar: [], adultos: [] };

    ["pre-escolar", "escolar", "adultos"].forEach(function (id) {
      var panel = document.getElementById(id);
      if (!panel) return;
      var catAtual = "";
      panel.querySelectorAll("tr").forEach(function (tr) {
        if (tr.classList.contains("cat-hdr")) {
          catAtual = tr.querySelector("td")?.textContent.trim() || "";
          return;
        }
        var cb = tr.querySelector(".cl-check");
        if (cb && cb.checked) {
          var cells = tr.querySelectorAll("td");
          var instrumento = cells[1]?.textContent.trim() || "";
          var avalia      = cells[2]?.textContent.trim() || "";
          var idade       = cells[3]?.textContent.trim() || "";
          var dataCell    = tr.querySelector(".cl-data")?.textContent.trim() || "";
          dados[id].push({ cat: catAtual, instrumento: instrumento, avalia: avalia, idade: idade, data: dataCell });
        }
      });
    });

    var totalGeral = dados["pre-escolar"].length + dados.escolar.length + dados.adultos.length;

    /* ─── Monta HTML do relatório ─── */
    var html = "";

    /* Cabeçalho */
    html += '<div class="rep-cl-header">';
    html += '  <div class="rep-cl-brand">';
    html += '    <img src="/logo2.png" alt="Logo" class="rep-cl-logo" onerror="this.style.display=\'none\'">';
    html += '    <div>';
    html += '      <div class="rep-cl-brand-name">Equilibrium</div>';
    html += '      <div class="rep-cl-brand-sub">Neuropsicologia</div>';
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="rep-cl-header-info">';
    html += '    <div class="rep-cl-doc-name">Check List de Instrumentos</div>';
    html += '    <div class="rep-cl-doc-sub">Seleção de Testes Neuropsicológicos</div>';
    html += '    <div class="rep-cl-badge"><span class="dot"></span>' + totalGeral + ' instrumento' + (totalGeral !== 1 ? 's' : '') + ' selecionado' + (totalGeral !== 1 ? 's' : '') + '</div>';
    html += '  </div>';
    html += '</div>';

    /* Faixa do paciente */
    html += '<div class="rep-cl-patient-strip">';
    html += '  <div class="rep-cl-field"><label>Paciente</label><span>' + escHtml(paciente) + '</span></div>';
    html += '  <div class="rep-cl-field"><label>CPF</label><span>' + escHtml(cpf) + '</span></div>';
    html += '  <div class="rep-cl-field"><label>Idade</label><span>' + escHtml(idadeStr) + '</span></div>';
    html += '  <div class="rep-cl-field"><label>Data</label><span>' + hoje + '</span></div>';
    html += '</div>';

    /* Corpo */
    html += '<div class="rep-cl-body">';

    /* Hipóteses */
    html += '<div class="rep-cl-hipoteses">';
    html += '  <strong>Hipóteses Diagnósticas</strong>';
    html += escHtml(hipoteses);
    html += '</div>';

    /* Totais por faixa */
    html += '<div class="rep-cl-totais">';
    if (dados["pre-escolar"].length > 0)
      html += '<div class="rep-cl-total-pill pre"><span class="num">' + dados["pre-escolar"].length + '</span> Pré-Escolar</div>';
    if (dados.escolar.length > 0)
      html += '<div class="rep-cl-total-pill esc"><span class="num">' + dados.escolar.length + '</span> Escolar</div>';
    if (dados.adultos.length > 0)
      html += '<div class="rep-cl-total-pill adu"><span class="num">' + dados.adultos.length + '</span> Adultos</div>';
    html += '</div>';

    /* Seções por faixa etária */
    var faixas = [
      { id: "pre-escolar", label: "🟣 Pré-Escolar",  cls: "rep-section-pre", color: "#7c3aed" },
      { id: "escolar",     label: "🟢 Escolar",       cls: "rep-section-esc", color: "#0d9488" },
      { id: "adultos",     label: "🔵 Adultos",        cls: "rep-section-adu", color: "#1a56db" }
    ];

    faixas.forEach(function (f) {
      var lista = dados[f.id];
      if (!lista || lista.length === 0) return;

      html += '<div class="rep-cl-section ' + f.cls + '">';
      html += '  <div class="rep-cl-section-title">' + f.label + ' <span style="font-size:11px;font-weight:600;color:#64748b;text-transform:none;letter-spacing:0">— ' + lista.length + ' instrumento' + (lista.length !== 1 ? 's' : '') + '</span></div>';

      /* Agrupa por categoria */
      var porCat = {};
      var catOrder = [];
      lista.forEach(function (item) {
        if (!porCat[item.cat]) {
          porCat[item.cat] = [];
          catOrder.push(item.cat);
        }
        porCat[item.cat].push(item);
      });

      html += '<table class="rep-cl-table">';
      html += '<thead><tr>';
      html += '  <th style="width:36px;text-align:center">✓</th>';
      html += '  <th>Instrumento</th>';
      html += '  <th>O que Avalia</th>';
      html += '  <th style="white-space:nowrap">Faixa Etária</th>';
      html += '  <th style="width:80px">Data</th>';
      html += '</tr></thead><tbody>';

      catOrder.forEach(function (cat) {
        /* linha de categoria */
        html += '<tr class="rep-cat-hdr"><td colspan="5">' + escHtml(cat) + '</td></tr>';
        porCat[cat].forEach(function (item) {
          html += '<tr>';
          html += '  <td style="text-align:center"><div class="rep-cl-check-box checked">✓</div></td>';
          html += '  <td><strong>' + escHtml(item.instrumento) + '</strong></td>';
          html += '  <td style="color:#64748b">' + escHtml(item.avalia) + '</td>';
          html += '  <td style="white-space:nowrap;font-size:11px;color:#94a3b8">' + escHtml(item.idade) + '</td>';
          html += '  <td>' + escHtml(item.data) + '</td>';
          html += '</tr>';
        });
      });

      html += '</tbody></table>';
      html += '</div>'; /* /rep-cl-section */
    });

    /* Mensagem se nenhum instrumento */
    if (totalGeral === 0) {
      html += '<div style="text-align:center;padding:40px;color:#94a3b8;font-size:14px;">';
      html += '  Nenhum instrumento selecionado.';
      html += '</div>';
    }

    html += '</div>'; /* /rep-cl-body */

    /* Rodapé */
    html += '<div class="rep-cl-footer">';
    html += '  <span>Equilibrium Neuropsicologia</span>';
    html += '  <span>' + hoje + '  ·  ' + totalGeral + ' instrumento' + (totalGeral !== 1 ? 's' : '') + ' selecionado' + (totalGeral !== 1 ? 's' : '') + '</span>';
    html += '</div>';

    /* Injeta no wrapper e abre overlay */
    var wrapper = document.getElementById("repClWrapper");
    if (wrapper) wrapper.innerHTML = html;

    var overlay = document.getElementById("clReportOverlay");
    if (overlay) overlay.classList.add("ativo");
  }

  /* ── 7. UTILITÁRIO ────────────────────────────────── */
  function escHtml(str) {
    return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

});