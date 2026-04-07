/* ═══════════════════════════════════════════════════════
   CHECKLIST v3 — Relatório da aba ativa
   Sem hipóteses / pills / legenda — direto na tabela
   ═══════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", function () {

  /* ── TABS ─────────────────────────────────────────── */
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

  /* ── CHECKBOX ─────────────────────────────────────── */
  document.querySelectorAll(".cl-check").forEach(function (cb) {
    cb.addEventListener("change", function () {
      var tr    = this.closest("tr");
      var tabId = (this.closest(".cl-content") || {}).id;
      var color = tabId === "pre-escolar" ? "rgba(124,58,237,.05)"
                : tabId === "escolar"     ? "rgba(13,148,136,.05)"
                :                           "rgba(26,86,219,.05)";
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

  /* ── BOTÕES ───────────────────────────────────────── */
  document.getElementById("btnGerarRelatorio")
    ?.addEventListener("click", abrirRelatorio);

  document.getElementById("btnFecharRelatorio")
    ?.addEventListener("click", function () {
      document.getElementById("clReportOverlay").classList.remove("ativo");
    });

  document.getElementById("btnImprimirRelatorio")
    ?.addEventListener("click", function () { window.print(); });

  /* ── GERAÇÃO ──────────────────────────────────────── */
  function abrirRelatorio() {

    var tabAtiva = document.querySelector(".cl-tab.active");
    var abaId    = tabAtiva ? tabAtiva.getAttribute("data-target") : "pre-escolar";

    var abaInfo = {
      "pre-escolar": { label: "Pré-Escolar",  cls: "rep-section-pre" },
      "escolar":     { label: "Escolar",       cls: "rep-section-esc" },
      "adultos":     { label: "Adultos",        cls: "rep-section-adu" }
    };
    var abaEmoji = {
      "pre-escolar": "🟣", "escolar": "🟢", "adultos": "🔵"
    };

    /* Dados do paciente */
    var paciente  = document.querySelector('.cl-form input[placeholder="Nome completo"]')?.value.trim() || "—";
    var cpf       = document.querySelector('.cl-form input[placeholder="000.000.000-00"]')?.value.trim() || "—";
    var idadeA    = document.querySelector('.idade-group input:nth-child(1)')?.value.trim() || "";
    var idadeM    = document.querySelector('.idade-group input:nth-child(2)')?.value.trim() || "";
    var idadeD    = document.querySelector('.idade-group input:nth-child(3)')?.value.trim() || "";
    var hipoteses = document.querySelector('.cl-form input[placeholder="Diagnósticos em investigação"]')?.value.trim() || "";

    var idadeStr = [idadeA && idadeA+"a", idadeM && idadeM+"m", idadeD && idadeD+"d"]
      .filter(Boolean).join(" ") || "—";
    var hoje = new Date().toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" });

    /* Coleta todos os instrumentos da aba ativa */
    var panel = document.getElementById(abaId);
    var lista = [], totalSel = 0, catAtual = "";

    panel.querySelectorAll("tr").forEach(function (tr) {
      if (tr.classList.contains("cat-hdr")) {
        catAtual = tr.querySelector("td")?.textContent.trim() || "";
        return;
      }
      var cb = tr.querySelector(".cl-check");
      if (!cb) return;
      var sel = cb.checked;
      if (sel) totalSel++;
      var cells = tr.querySelectorAll("td");
      lista.push({
        cat:         catAtual,
        instrumento: cells[1]?.textContent.trim() || "",
        avalia:      cells[2]?.textContent.trim() || "",
        idade:       cells[3]?.textContent.trim() || "",
        data:        tr.querySelector(".cl-data")?.textContent.trim() || "",
        sel:         sel
      });
    });

    var info  = abaInfo[abaId];
    var emoji = abaEmoji[abaId];
    var html  = "";

    /* ── Cabeçalho — padrão WAIS/WISC com gradiente escuro ── */
    html += '<div class="rep-cl-header">'
          + '  <div class="rep-cl-brand">'
          + '    <img src="/logo2.png" alt="Logo" class="rep-cl-logo" onerror="this.style.display=\'none\'">'
          + '    <div>'
          + '      <div class="rep-cl-brand-name">Equilibrium</div>'
          + '      <div class="rep-cl-brand-sub">Neuropsicologia Cl\u00ednica</div>'
          + '    </div>'
          + '  </div>'
          + '  <div class="rep-cl-header-info">'
          + '    <div class="rep-cl-doc-name">Check List de Instrumentos</div>'
          + '    <div class="rep-cl-doc-sub">' + emoji + ' Faixa: ' + info.label + '</div>'
          + '    <div class="rep-cl-badge"><span class="dot"></span>' + totalSel + ' instrumento' + (totalSel !== 1 ? 's' : '') + ' selecionado' + (totalSel !== 1 ? 's' : '') + '</div>'
          + '  </div>'
          + '</div>';

    /* ── Faixa do paciente ── */
    html += '<div class="rep-cl-patient-strip">'
          + '  <div class="rep-cl-field"><label>Paciente</label><span>' + escHtml(paciente) + '</span></div>'
          + '  <div class="rep-cl-field"><label>CPF</label><span>'      + escHtml(cpf)      + '</span></div>'
          + '  <div class="rep-cl-field"><label>Idade</label><span>'    + escHtml(idadeStr)  + '</span></div>'
          + (hipoteses ? '  <div class="rep-cl-field"><label>Hip\u00f3teses</label><span>' + escHtml(hipoteses) + '</span></div>' : '')
          + '  <div class="rep-cl-field"><label>Data</label><span>'     + hoje               + '</span></div>'
          + '</div>';

    /* ── Corpo: direto na tabela, sem bloco extra ── */
    html += '<div class="rep-cl-body">';
    html += '<div class="rep-cl-section ' + info.cls + '">';

    /* Agrupa por categoria */
    var porCat = {}, catOrder = [];
    lista.forEach(function (item) {
      if (!porCat[item.cat]) { porCat[item.cat] = []; catOrder.push(item.cat); }
      porCat[item.cat].push(item);
    });

    html += '<table class="rep-cl-table"><thead><tr>'
          + '<th class="col-chk">✓</th>'
          + '<th>Instrumento</th>'
          + '<th>O que Avalia</th>'
          + '<th class="col-idade">Faixa Etária</th>'
          + '<th class="col-data">Data</th>'
          + '</tr></thead><tbody>';

    catOrder.forEach(function (cat) {
      html += '<tr class="rep-cat-hdr"><td colspan="5">' + escHtml(cat) + '</td></tr>';
      porCat[cat].forEach(function (item) {
        var dim = item.sel ? '' : 'opacity:.65;';
        /* Campo de data: se preenchido mostra valor, senão máscara __/__/____ */
        var dataCell = item.data
          ? '<span class="data-val">' + escHtml(item.data) + '</span>'
          : '<span class="data-mask">__/__/____</span>';

        html += '<tr style="' + dim + '">'
              + '<td class="col-chk"><div class="rep-cl-check-box' + (item.sel ? ' checked' : '') + '">' + (item.sel ? '✓' : '') + '</div></td>'
              + '<td class="col-nome">' + (item.sel ? '<strong>' : '') + escHtml(item.instrumento) + (item.sel ? '</strong>' : '') + '</td>'
              + '<td class="col-avalia">' + escHtml(item.avalia) + '</td>'
              + '<td class="col-idade">' + escHtml(item.idade) + '</td>'
              + '<td class="col-data">' + dataCell + '</td>'
              + '</tr>';
      });
    });

    html += '</tbody></table></div>';
    html += '</div>'; /* /rep-cl-body */

    /* ── Rodapé — padrão WAIS/WISC com gradiente escuro ── */
    html += '<div class="rep-cl-footer">'
          + '  <div class="rep-cl-footer-brand">'
          + '    <img src="/logo2.png" alt="" class="rep-cl-footer-logo" onerror="this.style.display=\'none\'">'
          + '    <span>Equilibrium Neuropsicologia</span>'
          + '  </div>'
          + '  <div class="rep-cl-footer-brand">'
          + '    <span>' + hoje + '</span>'
          + '    <div class="rep-cl-footer-divider"></div>'
          + '    <span>' + totalSel + ' instrumento' + (totalSel !== 1 ? 's' : '') + ' selecionado' + (totalSel !== 1 ? 's' : '') + '</span>'
          + '  </div>'
          + '</div>';

    document.getElementById("repClWrapper").innerHTML = html;
    document.getElementById("clReportOverlay").classList.add("ativo");
  }

  function escHtml(str) {
    return (str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

});