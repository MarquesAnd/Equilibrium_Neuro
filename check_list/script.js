/* ═══════════════════════════════════════════════════════
   CHECKLIST v3 — Lógica + Relatório estilo SRS-2
   Abas · Checkbox · Contador · Overlay de Relatório
   Relatório exibe TODOS os instrumentos de todas as abas,
   com selecionados destacados e não-selecionados visíveis.
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
  if (btnRel) btnRel.addEventListener("click", abrirRelatorio);

  /* ── 4. FECHAR OVERLAY ────────────────────────────── */
  var btnFechar = document.getElementById("btnFecharRelatorio");
  if (btnFechar) {
    btnFechar.addEventListener("click", function () {
      document.getElementById("clReportOverlay")?.classList.remove("ativo");
    });
  }

  /* ── 5. IMPRIMIR DENTRO DO OVERLAY ───────────────── */
  var btnImprimir = document.getElementById("btnImprimirRelatorio");
  if (btnImprimir) {
    btnImprimir.addEventListener("click", function () { window.print(); });
  }

  /* ── 6. LÓGICA DE GERAÇÃO DO RELATÓRIO ────────────── */
  function abrirRelatorio() {
    var paciente  = document.querySelector('.cl-form input[placeholder="Nome completo"]')?.value.trim() || "—";
    var cpf       = document.querySelector('.cl-form input[placeholder="000.000.000-00"]')?.value.trim() || "—";
    var idadeA    = document.querySelector('.idade-group input:nth-child(1)')?.value.trim() || "";
    var idadeM    = document.querySelector('.idade-group input:nth-child(2)')?.value.trim() || "";
    var idadeD    = document.querySelector('.idade-group input:nth-child(3)')?.value.trim() || "";
    var hipoteses = document.querySelector('.cl-form input[placeholder="Diagnósticos em investigação"]')?.value.trim() || "—";

    var idadeStr = [idadeA && idadeA+"a", idadeM && idadeM+"m", idadeD && idadeD+"d"]
      .filter(Boolean).join(" ") || "—";

    var hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

    /* Coleta TODOS os instrumentos (sel ou não) de cada aba */
    var dados    = { "pre-escolar": [], escolar: [], adultos: [] };
    var totalSel = { "pre-escolar": 0, escolar: 0, adultos: 0 };

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
        if (!cb) return;
        var cells = tr.querySelectorAll("td");
        var sel   = cb.checked;
        if (sel) totalSel[id]++;
        dados[id].push({
          cat:         catAtual,
          instrumento: cells[1]?.textContent.trim() || "",
          avalia:      cells[2]?.textContent.trim() || "",
          idade:       cells[3]?.textContent.trim() || "",
          data:        tr.querySelector(".cl-data")?.textContent.trim() || "",
          sel:         sel
        });
      });
    });

    var totalSelGeral = totalSel["pre-escolar"] + totalSel.escolar + totalSel.adultos;

    /* ─── Monta HTML ─── */
    var html = "";

    /* Cabeçalho */
    html += '<div class="rep-cl-header">'
          + '  <div class="rep-cl-brand">'
          + '    <img src="/logo2.png" alt="Logo" class="rep-cl-logo" onerror="this.style.display=\'none\'">'
          + '    <div><div class="rep-cl-brand-name">Equilibrium</div><div class="rep-cl-brand-sub">Neuropsicologia</div></div>'
          + '  </div>'
          + '  <div class="rep-cl-header-info">'
          + '    <div class="rep-cl-doc-name">Check List de Instrumentos</div>'
          + '    <div class="rep-cl-doc-sub">Seleção de Testes Neuropsicológicos</div>'
          + '    <div class="rep-cl-badge"><span class="dot"></span>' + totalSelGeral + ' instrumento' + (totalSelGeral !== 1 ? 's' : '') + ' a realizar</div>'
          + '  </div>'
          + '</div>';

    /* Faixa paciente */
    html += '<div class="rep-cl-patient-strip">'
          + '  <div class="rep-cl-field"><label>Paciente</label><span>' + escHtml(paciente) + '</span></div>'
          + '  <div class="rep-cl-field"><label>CPF</label><span>'      + escHtml(cpf)      + '</span></div>'
          + '  <div class="rep-cl-field"><label>Idade</label><span>'    + escHtml(idadeStr)  + '</span></div>'
          + '  <div class="rep-cl-field"><label>Data</label><span>'     + hoje               + '</span></div>'
          + '</div>';

    /* Corpo */
    html += '<div class="rep-cl-body">';

    /* Hipóteses */
    html += '<div class="rep-cl-hipoteses"><strong>Hipóteses Diagnósticas</strong>' + escHtml(hipoteses) + '</div>';

    /* Pills de totais */
    html += '<div class="rep-cl-totais">';
    [
      { id: "pre-escolar", label: "Pré-Escolar", cls: "pre" },
      { id: "escolar",     label: "Escolar",      cls: "esc" },
      { id: "adultos",     label: "Adultos",       cls: "adu" }
    ].forEach(function (f) {
      var s = totalSel[f.id], t = dados[f.id].length;
      if (t === 0) return;
      html += '<div class="rep-cl-total-pill ' + f.cls + '"><span class="num">' + s + '</span>'
            + '<span>/ ' + t + ' &nbsp;<small style="font-weight:600;opacity:.75">' + f.label + '</small></span></div>';
    });
    html += '</div>';

    /* Legenda */
    html += '<div style="display:flex;gap:20px;align-items:center;margin-bottom:20px;font-size:12px;color:#64748b;">'
          + '  <span style="display:flex;align-items:center;gap:6px;">'
          + '    <span style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:4px;background:#1a56db;color:#fff;font-size:10px;font-weight:800;">✓</span>'
          + '    Instrumento a realizar'
          + '  </span>'
          + '  <span style="display:flex;align-items:center;gap:6px;opacity:.55;">'
          + '    <span style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:4px;border:2px solid #cbd5e1;background:#f8fafc;"></span>'
          + '    Não selecionado'
          + '  </span>'
          + '</div>';

    /* Seções por faixa */
    var faixas = [
      { id: "pre-escolar", label: "🟣 Pré-Escolar",  cls: "rep-section-pre" },
      { id: "escolar",     label: "🟢 Escolar",       cls: "rep-section-esc" },
      { id: "adultos",     label: "🔵 Adultos",        cls: "rep-section-adu" }
    ];

    faixas.forEach(function (f) {
      var lista = dados[f.id];
      if (!lista || lista.length === 0) return;
      var s = totalSel[f.id];

      html += '<div class="rep-cl-section ' + f.cls + '">'
            + '  <div class="rep-cl-section-title">' + f.label
            + '    <span style="font-size:11px;font-weight:600;color:#64748b;text-transform:none;letter-spacing:0">'
            + '      — ' + s + ' de ' + lista.length + ' selecionado' + (s !== 1 ? 's' : '')
            + '    </span>'
            + '  </div>';

      /* Agrupa por categoria */
      var porCat = {}, catOrder = [];
      lista.forEach(function (item) {
        if (!porCat[item.cat]) { porCat[item.cat] = []; catOrder.push(item.cat); }
        porCat[item.cat].push(item);
      });

      html += '<table class="rep-cl-table"><thead><tr>'
            + '  <th style="width:36px;text-align:center">✓</th>'
            + '  <th>Instrumento</th>'
            + '  <th>O que Avalia</th>'
            + '  <th style="white-space:nowrap">Faixa Etária</th>'
            + '  <th style="width:80px">Data</th>'
            + '</tr></thead><tbody>';

      catOrder.forEach(function (cat) {
        html += '<tr class="rep-cat-hdr"><td colspan="5">' + escHtml(cat) + '</td></tr>';
        porCat[cat].forEach(function (item) {
          var dim = item.sel ? '' : 'opacity:.4;';
          html += '<tr style="' + dim + '">';
          html += '  <td style="text-align:center"><div class="rep-cl-check-box' + (item.sel ? ' checked' : '') + '">' + (item.sel ? '✓' : '') + '</div></td>';
          html += '  <td>' + (item.sel ? '<strong>' : '') + escHtml(item.instrumento) + (item.sel ? '</strong>' : '') + '</td>';
          html += '  <td style="color:#64748b">' + escHtml(item.avalia) + '</td>';
          html += '  <td style="white-space:nowrap;font-size:11px;color:#94a3b8">' + escHtml(item.idade) + '</td>';
          html += '  <td>' + escHtml(item.data) + '</td>';
          html += '</tr>';
        });
      });

      html += '</tbody></table></div>';
    });

    html += '</div>'; /* /rep-cl-body */

    /* Rodapé */
    html += '<div class="rep-cl-footer">'
          + '  <span>Equilibrium Neuropsicologia</span>'
          + '  <span>' + hoje + '  ·  ' + totalSelGeral + ' instrumento' + (totalSelGeral !== 1 ? 's' : '') + ' a realizar</span>'
          + '</div>';

    document.getElementById("repClWrapper").innerHTML = html;
    document.getElementById("clReportOverlay")?.classList.add("ativo");
  }

  /* ── 7. UTILITÁRIO ────────────────────────────────── */
  function escHtml(str) {
    return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

});