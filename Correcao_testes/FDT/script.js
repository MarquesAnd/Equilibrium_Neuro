console.log("SCRIPT FDT CARREGADO — PERCENTIS NORMATIVOS FIXOS (Sedó, 2007)");
const LAUDOS_KEY = "empresa_laudos_fdt";

/* ═══════════════════════════════════════════════════════════════
   BANCO NORMATIVO — PONTOS DE CORTE POR PERCENTIL
   Fonte: Sedó (2007) — FDT Five Digit Test, normas brasileiras
   Estrutura: { faixa: { subteste: { p95, p75, p50, p25, p5 } } }

   IMPORTANTE — lógica invertida para TEMPOS e ERROS:
     Valores MENORES = desempenho MELHOR (mais rápido / menos erros)
     Logo: se tempo do paciente ≤ p95 → percentil ≥ 95 (Superior)
           se tempo do paciente >  p5  → percentil ≤ 5  (Inferior)

   Para tempos: p95 < p75 < p50 < p25 < p5  (mais tempo = pior)
   Para erros:  p95 ≤ p75 ≤ p50 ≤ p25 < p5  (mais erros = pior)
   ═══════════════════════════════════════════════════════════════ */
const FDT_NORMAS = {
  "6-8": {
    Leitura:      { p95: 25, p75: 29, p50: 34, p25: 39, p5: 48 },
    Contagem:     { p95: 32, p75: 40, p50: 48, p25: 56, p5: 83 },
    Escolha:      { p95: 41, p75: 66, p50: 79, p25: 94, p5: 109 },
    Alternancia:  { p95: 58, p75: 75, p50: 91, p25: 113, p5: 133 },
    CI:           { p95: 17, p75: 31, p50: 43, p25: 55, p5: 76 },
    FC:           { p95: 26, p75: 41, p50: 55, p25: 75, p5: 92 },
    Erro_Contagem:   { p95: 0, p75: 0, p50: 0, p25: 0, p5: 4 },
    Erro_Escolha:    { p95: 0, p75: 0, p50: 2, p25: 4, p5: 9 },
    Erro_Alternancia:{ p95: 0, p75: 1, p50: 2, p25: 5, p5: 10 },
  },
  "9-10": {
    Leitura:      { p95: 22, p75: 26, p50: 29, p25: 32, p5: 38 },
    Contagem:     { p95: 28, p75: 34, p50: 39, p25: 43, p5: 52 },
    Escolha:      { p95: 46, p75: 56, p50: 63, p25: 73, p5: 88 },
    Alternancia:  { p95: 54, p75: 67, p50: 75, p25: 87, p5: 101 },
    CI:           { p95: 19, p75: 28, p50: 35, p25: 42, p5: 57 },
    FC:           { p95: 28, p75: 39, p50: 46, p25: 57, p5: 73 },
    Erro_Contagem:   { p95: 0, p75: 0, p50: 0, p25: 0, p5: 2 },
    Erro_Escolha:    { p95: 0, p75: 0, p50: 1, p25: 3, p5: 6 },
    Erro_Alternancia:{ p95: 0, p75: 1, p50: 2, p25: 4, p5: 8 },
  },
  "11-12": {
    Leitura:      { p95: 20, p75: 24, p50: 27, p25: 32, p5: 47 },
    Contagem:     { p95: 25, p75: 32, p50: 36, p25: 44, p5: 54 },
    Escolha:      { p95: 38, p75: 48, p50: 56, p25: 62, p5: 93 },
    Alternancia:  { p95: 46, p75: 55, p50: 66, p25: 73, p5: 96 },
    CI:           { p95: 12, p75: 20, p50: 28, p25: 35, p5: 51 },
    FC:           { p95: 16, p75: 30, p50: 39, p25: 44, p5: 68 },
    Erro_Contagem:   { p95: 0, p75: 0, p50: 0, p25: 0, p5: 3 },
    Erro_Escolha:    { p95: 0, p75: 0, p50: 1, p25: 2, p5: 10 },
    Erro_Alternancia:{ p95: 0, p75: 0, p50: 2, p25: 3, p5: 10 },
  },
  "13-15": {
    Leitura:      { p95: 17, p75: 20, p50: 23, p25: 26, p5: 34 },
    Contagem:     { p95: 21, p75: 24, p50: 28, p25: 35, p5: 44 },
    Escolha:      { p95: 33, p75: 40, p50: 45, p25: 53, p5: 68 },
    Alternancia:  { p95: 36, p75: 46, p50: 53, p25: 67, p5: 81 },
    CI:           { p95: 8,  p75: 19, p50: 23.5, p25: 29, p5: 42 },
    FC:           { p95: 14, p75: 25, p50: 32, p25: 43, p5: 53 },
    Erro_Contagem:   { p95: 0, p75: 0, p50: 0, p25: 0, p5: 2 },
    Erro_Escolha:    { p95: 0, p75: 0, p50: 1, p25: 2, p5: 7 },
    Erro_Alternancia:{ p95: 0, p75: 0, p50: 1, p25: 3, p5: 5 },
  },
  "16-18": {
    Leitura:      { p95: 16, p75: 17, p50: 20, p25: 23, p5: 29 },
    Contagem:     { p95: 19, p75: 21, p50: 24, p25: 26, p5: 30 },
    Escolha:      { p95: 25, p75: 29, p50: 33, p25: 39, p5: 44 },
    Alternancia:  { p95: 34, p75: 38, p50: 42, p25: 51, p5: 63 },
    CI:           { p95: 6,  p75: 10.5, p50: 13, p25: 16.5, p5: 22 },
    FC:           { p95: 16, p75: 19, p50: 22, p25: 27, p5: 44 },
    Erro_Contagem:   { p95: 0, p75: 0, p50: 0, p25: 0, p5: 0 },
    Erro_Escolha:    { p95: 0, p75: 0, p50: 0, p25: 0, p5: 3 },
    Erro_Alternancia:{ p95: 0, p75: 0, p50: 1, p25: 2, p5: 4 },
  },
  "19-34": {
    Leitura:      { p95: 16, p75: 19, p50: 21, p25: 25, p5: 31 },
    Contagem:     { p95: 19, p75: 22, p50: 24, p25: 27, p5: 34 },
    Escolha:      { p95: 27, p75: 31, p50: 35, p25: 40, p5: 52 },
    Alternancia:  { p95: 33, p75: 38, p50: 44, p25: 50, p5: 64 },
    CI:           { p95: 5,  p75: 11, p50: 14, p25: 18, p5: 28 },
    FC:           { p95: 10, p75: 17, p50: 22, p25: 29, p5: 42 },
    Erro_Contagem:   { p95: 0, p75: 0, p50: 0, p25: 0, p5: 1 },
    Erro_Escolha:    { p95: 0, p75: 0, p50: 0, p25: 1, p5: 2 },
    Erro_Alternancia:{ p95: 0, p75: 0, p50: 0, p25: 1, p5: 3 },
  },
  "35-59": {
    Leitura:      { p95: 17, p75: 20, p50: 23, p25: 26, p5: 37 },
    Contagem:     { p95: 19, p75: 22, p50: 26, p25: 30, p5: 40 },
    Escolha:      { p95: 28, p75: 32, p50: 39, p25: 46, p5: 65 },
    Alternancia:  { p95: 34, p75: 43, p50: 48, p25: 60, p5: 89 },
    CI:           { p95: 5,  p75: 11, p50: 15, p25: 21, p5: 38 },
    FC:           { p95: 14, p75: 20, p50: 26, p25: 34, p5: 55 },
    Erro_Contagem:   { p95: 0, p75: 0, p50: 0, p25: 0, p5: 0 },
    Erro_Escolha:    { p95: 0, p75: 0, p50: 0, p25: 1, p5: 3 },
    Erro_Alternancia:{ p95: 0, p75: 0, p50: 1, p25: 2, p5: 6 },
  },
  "60-75": {
    Leitura:      { p95: 18, p75: 22, p50: 25, p25: 30, p5: 37 },
    Contagem:     { p95: 21, p75: 25, p50: 28, p25: 33, p5: 41 },
    Escolha:      { p95: 30, p75: 39, p50: 46, p25: 53, p5: 68 },
    Alternancia:  { p95: 41, p75: 52, p50: 62, p25: 78, p5: 93 },
    CI:           { p95: 9,  p75: 15, p50: 19.5, p25: 26, p5: 39 },
    FC:           { p95: 18, p75: 28, p50: 35, p25: 49, p5: 63 },
    Erro_Contagem:   { p95: 0, p75: 0, p50: 0, p25: 0, p5: 1 },
    Erro_Escolha:    { p95: 0, p75: 0, p50: 0, p25: 1, p5: 3 },
    Erro_Alternancia:{ p95: 0, p75: 0, p50: 1, p25: 3, p5: 6 },
  },
};

/* ═══════════════════════════════════
   FUNÇÕES UTILITÁRIAS
   ═══════════════════════════════════ */
function calcularIdade(nascISO, aplISO) {
  if (!nascISO || !aplISO) return null;
  const n = new Date(nascISO); const a = new Date(aplISO);
  if (isNaN(n.getTime()) || isNaN(a.getTime()) || a < n) return null;
  let anos = a.getFullYear() - n.getFullYear();
  let meses = a.getMonth() - n.getMonth();
  if (a.getDate() < n.getDate()) meses -= 1;
  if (meses < 0) { anos -= 1; meses += 12; }
  return { anos, meses, totalMeses: anos * 12 + meses };
}

function faixaEtariaFDT(idade) {
  if (!idade) return null;
  const a = idade.anos;
  if (a >= 6 && a <= 8)   return "6-8";
  if (a >= 9 && a <= 10)  return "9-10";
  if (a >= 11 && a <= 12) return "11-12";
  if (a >= 13 && a <= 15) return "13-15";
  if (a >= 16 && a <= 18) return "16-18";
  if (a >= 19 && a <= 34) return "19-34";
  if (a >= 35 && a <= 59) return "35-59";
  if (a >= 60 && a <= 75) return "60-75";
  return null;
}

function getLaudos() { return JSON.parse(localStorage.getItem(LAUDOS_KEY) || "[]"); }
function setLaudos(arr) { localStorage.setItem(LAUDOS_KEY, JSON.stringify(arr)); }

function limparCPF(cpf) { return (cpf || "").replace(/\D/g, ""); }

function validarCPF(cpfInput) {
  const cpf = limparCPF(cpfInput);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
  let d1 = (soma * 10) % 11; if (d1 === 10) d1 = 0;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
  let d2 = (soma * 10) % 11; if (d2 === 10) d2 = 0;
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

function formatarCPF(cpf) {
  if (!cpf) return "";
  const nums = cpf.replace(/\D/g, "");
  if (nums.length !== 11) return cpf;
  return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarData(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/* ═══════════════════════════════════════════════════════════════
   CÁLCULO NORMATIVO — PONTOS DE CORTE FIXOS
   Retorna { label, numerico } onde:
     label   = string exibida  (ex.: "≥ 95", "> 25", "= 5", "< 5")
     numerico = valor numérico aproximado para posicionar no gráfico
   ═══════════════════════════════════════════════════════════════ */
function calcularPercentilFix(valor, norm) {
  if (!norm || valor == null || valor === "") return { label: "—", numerico: null };
  const v = parseFloat(valor);
  if (isNaN(v)) return { label: "—", numerico: null };

  // Tempos e erros: menor valor = melhor desempenho
  if (v <= norm.p95) return { label: "≥ 95", numerico: 97 };
  if (v <= norm.p75) return { label: "> 75", numerico: 87 };
  if (v <= norm.p50) return { label: "> 50", numerico: 62 };
  if (v <= norm.p25) return { label: "> 25", numerico: 37 };
  if (v <= norm.p5)  return { label: "> 5",  numerico: 15 };
  return               { label: "< 5",  numerico: 3  };
}

/* ─── Classificação conforme manual FDT ─── */
function classificarPercentil(label) {
  if (!label || label === "—") return "—";
  if (["≥ 95", "> 75"].includes(label))       return "Superior";
  if (["> 50", "> 25"].includes(label))        return "Média";
  if (label === "> 5")                          return "Dificuldade Discreta";
  if (label === "< 5")                          return "Dificuldade Acentuada";
  return "—";
}

/* ═══════════════════════════════════
   CALCULAR TODOS OS RESULTADOS
   ═══════════════════════════════════ */
function calcularResultados(tempos, erros, faixa) {
  const norma = FDT_NORMAS[faixa];
  if (!norma) return null;

  const partes  = ["L", "C", "E", "A"];
  const nomes   = { L: "Leitura", C: "Contagem", E: "Escolha", A: "Alternância" };
  const chaves  = { L: "Leitura", C: "Contagem", E: "Escolha", A: "Alternancia" };
  const chavesErro = { C: "Erro_Contagem", E: "Erro_Escolha", A: "Erro_Alternancia" };
  const derivados = [
    { cod: "CI", nome: "Controle Inibitório", formula: "Escolha − Leitura",    chave: "CI" },
    { cod: "FC", nome: "Flexibilidade Cognitiva", formula: "Alternância − Leitura", chave: "FC" },
  ];

  const resultados = {};

  // Calcular índices derivados
  const t_CI = (tempos.E != null && tempos.L != null) ? tempos.E - tempos.L : null;
  const t_FC = (tempos.A != null && tempos.L != null) ? tempos.A - tempos.L : null;
  const temposCompletos = { ...tempos, CI: t_CI, FC: t_FC };

  // Partes diretas
  partes.forEach(cod => {
    const t = tempos[cod];
    const e = erros[cod];
    const nT = norma[chaves[cod]];
    const nE = chavesErro[cod] ? norma[chavesErro[cod]] : null;

    const pT = calcularPercentilFix(t, nT);
    const pE = calcularPercentilFix(e, nE);

    resultados[cod] = {
      cod, nome: nomes[cod],
      tempo: t,
      pctLabel: pT.label,
      pctNum:   pT.numerico,
      classTempo: classificarPercentil(pT.label),
      erros: e,
      pctErrosLabel: pE.label,
      pctErrosNum:   pE.numerico,
      classErros: classificarPercentil(pE.label),
    };
  });

  // Índices derivados (somente tempo, sem erros)
  derivados.forEach(({ cod, nome, formula, chave }) => {
    const t  = temposCompletos[cod];
    const nT = norma[chave];
    const pT = calcularPercentilFix(t, nT);
    resultados[cod] = {
      cod, nome, formula, derivado: true,
      tempo: t,
      pctLabel: pT.label,
      pctNum:   pT.numerico,
      classTempo: classificarPercentil(pT.label),
      erros: null, pctErrosLabel: null, pctErrosNum: null, classErros: null,
    };
  });

  return resultados;
}

/* ═══════════════════════════════════
   LOADING + MODAL (idêntico ao WAIS)
   ═══════════════════════════════════ */
function showLoading(msg) {
  const overlay = document.createElement("div");
  overlay.id = "loadingOverlay";
  overlay.className = "loading-overlay";
  overlay.innerHTML = `<div class="loading-card">
    <div class="loading-spinner"></div>
    <div class="loading-title">${msg || "Gerando relatório..."}</div>
    <div class="loading-sub">Calculando e processando dados</div>
  </div>`;
  document.body.appendChild(overlay);
}

function hideLoading() {
  const el = document.getElementById("loadingOverlay");
  if (el) el.remove();
}

function openReportModal() {
  const rel = document.getElementById("relatorio");
  if (!rel) return;
  closeReportModal();

  const backdrop = document.createElement("div");
  backdrop.id = "reportModal";
  backdrop.className = "report-modal-backdrop";
  const paciente = window.Integration ? Integration.getPacienteAtual() : null;
  const btnVoltar = paciente ? `<button class="toolbar-btn toolbar-btn-voltar" onclick="voltarParaPaciente()">👤 Voltar ao Paciente</button>` : "";
  backdrop.innerHTML = `
    <div class="report-modal">
      <div class="report-modal-toolbar no-print">
        <div class="toolbar-title">📄 Relatório Gerado</div>
        <div class="toolbar-actions">
          ${btnVoltar}
          <button class="toolbar-btn toolbar-btn-primary" onclick="baixarPDF()">📥 Baixar PDF</button>
          <button class="toolbar-btn toolbar-btn-secondary" onclick="window.print()">🖨️ Imprimir</button>
          <button class="toolbar-btn toolbar-btn-secondary" onclick="closeReportModal()">✕ Fechar</button>
        </div>
      </div>
      <div class="report-modal-body" id="reportModalBody"></div>
    </div>`;

  document.body.appendChild(backdrop);

  const body = document.getElementById("reportModalBody");
  body.appendChild(rel);
  rel.style.display = "block";

  backdrop.addEventListener("click", function(e) {
    if (e.target === backdrop) closeReportModal();
  });
  document.addEventListener("keydown", _escHandler);
}

function _escHandler(e) { if (e.key === "Escape") closeReportModal(); }

function closeReportModal() {
  const modal = document.getElementById("reportModal");
  if (!modal) return;
  const rel = document.getElementById("relatorio");
  if (rel) {
    const main = document.querySelector(".main-content");
    if (main) { main.appendChild(rel); }
    rel.style.display = "none";
  }
  modal.remove();
  document.removeEventListener("keydown", _escHandler);

  let paciente = null;
  try { const raw = sessionStorage.getItem("pacienteAtual"); if (raw) paciente = JSON.parse(raw); } catch(e) {}
  if (paciente && paciente.id) {
    if (confirm(`Deseja voltar à ficha do paciente "${paciente.nome}"?`)) {
      voltarParaPaciente();
    }
  }
}

/* ═══════════════════════════════════
   PREVIEW — Idade e Faixa
   ═══════════════════════════════════ */
function atualizarPreviewIdade() {
  const nasc = document.getElementById("dataNascimento")?.value;
  const apl  = document.getElementById("dataAplicacao")?.value;
  const idadeEl = document.getElementById("idadeCalculada");
  const faixaEl = document.getElementById("faixaCalculada");
  if (!idadeEl || !faixaEl) return;
  if (!nasc || !apl) { idadeEl.textContent = ""; faixaEl.textContent = ""; return; }
  const idade = calcularIdade(nasc, apl);
  if (!idade) { idadeEl.textContent = "Datas inválidas."; faixaEl.textContent = ""; return; }
  idadeEl.textContent = `Idade na aplicação: ${idade.anos} anos e ${idade.meses} meses.`;
  const faixa = faixaEtariaFDT(idade);
  faixaEl.textContent = faixa ? `Faixa normativa: ${faixa} anos` : "Faixa normativa: fora do alcance normativo (6–75 anos).";
}

function atualizarDerivedos() {
  const tL = parseFloat(document.getElementById("t_leitura")?.value);
  const tE = parseFloat(document.getElementById("t_escolha")?.value);
  const tA = parseFloat(document.getElementById("t_alternancia")?.value);
  const ciEl = document.getElementById("ci_tempo");
  const fcEl = document.getElementById("fc_tempo");
  if (ciEl) ciEl.textContent = (!isNaN(tE) && !isNaN(tL)) ? `${(tE - tL).toFixed(0)} seg` : "—";
  if (fcEl) fcEl.textContent = (!isNaN(tA) && !isNaN(tL)) ? `${(tA - tL).toFixed(0)} seg` : "—";
}

/* ═══════════════════════════════════
   BADGE / COR de classificação
   ═══════════════════════════════════ */
function clBadgeClass(cl) {
  const m = {
    "Superior":             "cl-s",
    "Média":                "cl-m",
    "Dificuldade Discreta": "cl-mi",
    "Dificuldade Acentuada":"cl-eb",
  };
  return m[cl] || "cl-m";
}
function clBadge(cl) { return cl && cl !== "—" ? `<span class="cl-badge ${clBadgeClass(cl)}">${cl}</span>` : "—"; }

function barColorFDT(pctNum) {
  if (pctNum == null) return "#94a3b8";
  if (pctNum >= 75)  return "#059669";
  if (pctNum >= 25)  return "#1a56db";
  if (pctNum >= 6)   return "#f59e0b";
  return "#dc2626";
}

function pctScale(p) { return Math.max(1, Math.min(99, p || 1)); }

/* ═══════════════════════════════════
   RENDER: TABELA PRINCIPAL DE RESULTADOS
   ═══════════════════════════════════ */
function renderTabelaResultados(resultados) {
  const ordem = ["L", "C", "E", "A", "CI", "FC"];
  const rows = ordem.map((cod, i) => {
    const r = resultados[cod];
    if (!r) return "";
    const derivado = r.derivado;
    const bg = derivado ? "background:#f0f4ff;" : (i % 2 ? "background:#f8fafc;" : "");
    const tempoBold = derivado ? "font-weight:800;color:#1a56db;" : "font-weight:700;";
    return `<tr style="${bg}">
      <td style="${derivado ? 'font-weight:800;color:#1a56db;' : 'font-weight:600;'}">
        ${r.nome}${derivado ? ` <span style="font-size:10px;opacity:.7">(${r.formula})</span>` : ` <span style="color:#94a3b8;">(${cod})</span>`}
      </td>
      <td class="ctr" style="${tempoBold}">${r.tempo != null ? r.tempo : "—"}</td>
      <td class="ctr">${r.pctLabel && r.pctLabel !== "—" ? r.pctLabel : "—"}</td>
      <td>${clBadge(r.classTempo)}</td>
      <td class="ctr">${!derivado && r.erros != null ? r.erros : derivado ? "<span style='color:#94a3b8;font-size:11px'>—</span>" : "—"}</td>
      <td class="ctr">${!derivado && r.pctErrosLabel && r.pctErrosLabel !== "—" ? r.pctErrosLabel : derivado ? "<span style='color:#94a3b8;font-size:11px'>—</span>" : "—"}</td>
      <td>${!derivado ? clBadge(r.classErros) : "<span style='color:#94a3b8;font-size:11px'>n/a</span>"}</td>
    </tr>`;
  }).join("");

  return `<div style="border-radius:10px;border:1px solid #e2e8f0;overflow:hidden">
    <table class="rpt-tbl"><thead>
      <tr>
        <th rowspan="2">Parte</th>
        <th class="ctr" colspan="3" style="border-bottom:1px solid rgba(26,86,219,.2)">Tempo (segundos)</th>
        <th class="ctr" colspan="3" style="border-bottom:1px solid rgba(124,58,237,.2)">Erros</th>
      </tr>
      <tr>
        <th class="ctr" style="font-size:10px;width:60px">Tempo</th>
        <th class="ctr" style="font-size:10px;width:70px">Percentil</th>
        <th style="font-size:10px">Classificação</th>
        <th class="ctr" style="font-size:10px;width:50px">Erros</th>
        <th class="ctr" style="font-size:10px;width:70px">Percentil</th>
        <th style="font-size:10px">Classificação</th>
      </tr>
    </thead><tbody>${rows}</tbody></table>
  </div>`;
}

/* ═══════════════════════════════════
   RENDER: PERFIL GRÁFICO (barras horizontais)
   Usa pctNum (valor numérico aproximado) para posicionamento
   ═══════════════════════════════════ */
function renderPerfil(resultados) {
  const partes = [
    { cod: "L", nome: "Leitura" },
    { cod: "C", nome: "Contagem" },
    { cod: "E", nome: "Escolha" },
    { cod: "A", nome: "Alternância" },
    { cod: "CI", nome: "Controle Inibitório", derivado: true },
    { cod: "FC", nome: "Flexibilidade Cognitiva", derivado: true },
  ];

  const barras = partes.map(({ cod, nome, derivado }) => {
    const r = resultados[cod];
    if (!r || r.tempo == null) return "";
    const p = r.pctNum;
    const col = barColorFDT(p);
    const pct = p != null ? pctScale(p) : 0;
    const cl = r.classTempo;
    const label = derivado ? `<b style="color:#1a56db">${nome}</b>` : `<b>${nome}</b>`;
    return `<div class="bar-row">
      <div class="bar-code" style="width:170px;font-size:12px">${label}</div>
      <div class="bar-track" style="flex:1;margin:0 10px">
        <div class="bar-avg-zone" style="left:${(25/99*100).toFixed(1)}%;width:${((75-25)/99*100).toFixed(1)}%"></div>
        <div class="bar-fill" style="width:${pct}%;background:${col}"></div>
      </div>
      <div class="bar-val" style="width:65px;font-size:11px">${r.pctLabel || "—"}</div>
      <div class="bar-badge">${clBadge(cl)}</div>
    </div>`;
  }).join("");

  return `<div class="rpt-box no-break">
    <div style="font-size:11px;color:#64748b;margin-bottom:8px">Eixo = percentil estimado (1–99) · Faixa azul = faixa média (P25–P75) · Baseado nos tempos</div>
    ${barras}
  </div>`;
}

/* ═══════════════════════════════════
   RENDER: GRÁFICO DE PONTOS DE CORTE
   Substitui ±1DP pelos 5 marcos normativos (p5/p25/p50/p75/p95)
   ═══════════════════════════════════ */
function renderComparativoNorma(resultados, faixa) {
  const norma = FDT_NORMAS[faixa];
  if (!norma) return "";

  const config = [
    { cod: "L", chave: "Leitura",     nome: "Leitura" },
    { cod: "C", chave: "Contagem",    nome: "Contagem" },
    { cod: "E", chave: "Escolha",     nome: "Escolha" },
    { cod: "A", chave: "Alternancia", nome: "Alternância" },
    { cod: "CI", chave: "CI",         nome: "Controle Inibitório" },
    { cod: "FC", chave: "FC",         nome: "Flexibilidade" },
  ];

  // Eixo máximo dinâmico: maior p5 entre todos os subtestes da faixa × 1.15
  const allP5 = config.map(c => norma[c.chave]?.p5 || 0);
  const maxTempo = Math.ceil(Math.max(...allP5) * 1.15 / 10) * 10;

  const rows = config.map(({ cod, chave, nome }) => {
    const r = resultados[cod];
    if (!r || r.tempo == null) return "";
    const n = norma[chave];
    if (!n) return "";
    const derivado = cod === "CI" || cod === "FC";
    const scale = v => Math.min(100, (Math.max(0, v) / maxTempo) * 100);
    const colPac = barColorFDT(r.pctNum);

    // Faixa normativa média (p25 a p75)
    const bandLeft  = scale(n.p75).toFixed(1); // p75 maior → direita no eixo
    const bandWidth = (scale(n.p25) - scale(n.p75)).toFixed(1);

    return `<div class="ic-row">
      <div class="ic-label" style="color:${colPac};width:165px;font-size:12px">${derivado ? `<b style="color:#1a56db">${nome}</b>` : `<b>${nome}</b>`}</div>
      <div class="ic-track" style="flex:1;position:relative;height:28px;margin:0 10px">
        <!-- marcas p5 e p95 -->
        <div title="P5"  style="position:absolute;top:10px;width:2px;height:8px;left:${scale(n.p5).toFixed(1)}%;background:#f87171;border-radius:1px;opacity:.7"></div>
        <div title="P95" style="position:absolute;top:10px;width:2px;height:8px;left:${scale(n.p95).toFixed(1)}%;background:#34d399;border-radius:1px;opacity:.7"></div>
        <!-- banda normativa P25–P75 -->
        <div style="position:absolute;top:8px;height:12px;left:${bandLeft}%;width:${bandWidth}%;background:rgba(148,163,184,.25);border:1px solid rgba(148,163,184,.4);border-radius:3px"></div>
        <!-- linha p50 -->
        <div title="P50" style="position:absolute;top:4px;width:2px;height:20px;left:${scale(n.p50).toFixed(1)}%;background:rgba(100,116,139,.55);border-radius:1px"></div>
        <!-- ponto do paciente -->
        <div style="position:absolute;top:6px;width:16px;height:16px;left:calc(${scale(r.tempo).toFixed(1)}% - 8px);background:${colPac};border-radius:50%;box-shadow:0 2px 6px ${colPac}50;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#fff">${r.tempo}</div>
      </div>
      <div style="width:85px;font-size:11px;text-align:right">${clBadge(r.classTempo)}</div>
    </div>`;
  }).join("");

  const step = Math.ceil(maxTempo / 6 / 5) * 5;
  const tickVals = [];
  for (let v = 0; v <= maxTempo; v += step) tickVals.push(v);
  const ticks = tickVals.map(v =>
    `<span style="position:absolute;left:${(v/maxTempo*100).toFixed(1)}%;transform:translateX(-50%)">${v}</span>`
  ).join("");

  return `<div class="rpt-box no-break">
    <div style="position:relative;height:18px;margin-bottom:4px;font-size:10px;color:#64748b">${ticks}</div>
    ${rows}
    <div style="font-size:10px;color:#64748b;margin-top:8px">
      Círculo = tempo do paciente (seg) · Faixa cinza = P25–P75 normativo · Linha = P50 · 
      <span style="color:#34d399">▎P95</span> · <span style="color:#f87171">▎P5</span>
    </div>
  </div>`;
}

/* ═══════════════════════════════════
   TEXTO INTERPRETATIVO
   ═══════════════════════════════════ */
function gerarTextoInterpretativo(nome, resultados, faixa) {
  const descricoes = {
    L:  "velocidade de leitura de dígitos (processamento automático de informação numérica)",
    C:  "velocidade de contagem de estrelas em grupos (atenção visual e contagem automática)",
    E:  "capacidade de inibir a resposta automática de leitura em favor da contagem (controle inibitório básico)",
    A:  "habilidade de alternar entre leitura e contagem em estímulos conflitantes (flexibilidade cognitiva)",
    CI: "eficiência do controle inibitório puro, medido pela diferença Escolha − Leitura",
    FC: "custo cognitivo da flexibilidade executiva, medido pela diferença Alternância − Leitura",
  };
  const partes  = ["L", "C", "E", "A"];
  const abertura = ["Em relação à", "Quanto à", "No que se refere à", "Em relação à"];

  const verbMap = {
    "Superior":             "situa-se acima da média normativa",
    "Média":                "situa-se dentro da faixa média normativa",
    "Dificuldade Discreta": "situa-se levemente abaixo da média normativa",
    "Dificuldade Acentuada":"situa-se significativamente abaixo da média normativa",
  };

  const parts = partes.map((cod, i) => {
    const r = resultados[cod];
    if (!r || r.pctLabel == null || r.pctLabel === "—") return null;
    const verb = verbMap[r.classTempo] || "situa-se";
    return `${abertura[i]} <b>${r.nome}</b>, a habilidade de ${descricoes[cod]} ${verb} (tempo = ${r.tempo} seg; percentil ${r.pctLabel}; classificação: ${r.classTempo}).`;
  }).filter(Boolean);

  const ci = resultados["CI"];
  const fc = resultados["FC"];
  if (ci?.pctLabel || fc?.pctLabel) {
    let exec = "Em relação aos índices executivos: ";
    if (ci?.pctLabel && ci.pctLabel !== "—") {
      exec += `o <b>Controle Inibitório</b> (${ci.tempo} seg; percentil ${ci.pctLabel}) apresenta-se na faixa <b>${ci.classTempo}</b>`;
    }
    if (ci?.pctLabel && ci.pctLabel !== "—" && fc?.pctLabel && fc.pctLabel !== "—") exec += "; ";
    if (fc?.pctLabel && fc.pctLabel !== "—") {
      exec += `a <b>Flexibilidade Cognitiva</b> (${fc.tempo} seg; percentil ${fc.pctLabel}) apresenta-se na faixa <b>${fc.classTempo}</b>`;
    }
    exec += ".";
    parts.push(exec);
  }

  return parts.join("\n\n");
}

/* ═══════════════════════════════════
   MONTAR RELATÓRIO
   ═══════════════════════════════════ */
function montarRelatorio(data) {
  const rel = document.getElementById("relatorio");
  if (!rel) return;

  const { nome, cpf, sexo, escolaridade, nasc, apl, idade, faixa, resultados,
    profNome, profCRP, profEspecialidade, motivo, obsComportamentais, recomendacoes } = data;

  const cpfTxt = formatarCPF(cpf);
  const dataHoje = new Date().toLocaleDateString("pt-BR");
  const textoInterp = gerarTextoInterpretativo(nome, resultados, faixa);
  const tabelaHTML = renderTabelaResultados(resultados);
  const perfilHTML = renderPerfil(resultados);
  const comparHTML = renderComparativoNorma(resultados, faixa);

  rel.style.display = "block";
  rel.innerHTML = `<div class="report">
    <!-- HEADER -->
    <div class="rpt-hdr">
      <div class="deco1"></div><div class="deco2"></div>
      <div class="rpt-hdr-inner">
        <div style="display:flex;align-items:center;gap:16px">
          <img class="hdr-logo" src="/logo2.png" alt="Logo" onerror="this.style.display='none'">
          <div>
            <div class="kicker">Relatório Neuropsicológico</div>
            <div class="title">FDT</div>
            <div class="subtitle">Teste dos Cinco Dígitos — Five Digit Test</div>
            <div class="sub2">Atenção, Controle Inibitório e Flexibilidade Cognitiva</div>
          </div>
        </div>
        <div class="rpt-hdr-badge">
          <div class="lbl">Faixa Normativa</div>
          <div class="val">${faixa} anos</div>
          <div class="sub">Idade: ${idade.anos}a ${idade.meses}m</div>
        </div>
      </div>
    </div>

    <div class="rpt-body">
      <!-- 1. IDENTIFICAÇÃO -->
      <div class="rpt-sh"><span class="num">1</span><span class="sh-title">Identificação</span></div>
      <div class="rpt-box no-break">
        <div class="rpt-info">
          <div><span class="lbl">Nome:</span> <span class="val bold">${nome}</span></div>
          <div><span class="lbl">CPF:</span> <span class="val">${cpfTxt || "—"}</span></div>
          <div><span class="lbl">Sexo:</span> <span class="val">${sexo || "—"}</span></div>
          <div><span class="lbl">Escolaridade:</span> <span class="val">${escolaridade || "—"}</span></div>
          <div><span class="lbl">Nascimento:</span> <span class="val">${formatarData(nasc)} (${idade.anos}a ${idade.meses}m)</span></div>
          <div><span class="lbl">Aplicação:</span> <span class="val">${formatarData(apl)}</span></div>
        </div>
        ${profNome ? `<div class="rpt-info sep"></div><div class="rpt-info"><div><span class="lbl" style="color:#1a56db">Profissional:</span> <span class="val bold">${profNome}${profCRP ? ` — ${profCRP}` : ""}</span></div><div><span class="lbl" style="color:#1a56db">Especialidade:</span> <span class="val">${profEspecialidade || "—"}</span></div></div>` : ""}
        ${motivo ? `<div class="rpt-info sep"></div><div><span class="lbl" style="color:#1a56db">Motivo do encaminhamento:</span> <span class="val">${motivo}</span></div>` : ""}
      </div>

      <!-- 2. OBSERVAÇÕES -->
      ${obsComportamentais ? `<div class="rpt-sh"><span class="num" style="background:#7c3aed">2</span><span class="sh-title">Observações Comportamentais</span><span class="sh-new">Clínico</span></div><div class="rpt-box-obs no-break">${obsComportamentais}</div>` : ""}

      <!-- 3. RESULTADOS -->
      <div class="rpt-sh"><span class="num">3</span><span class="sh-title">Resultados por Parte</span><div class="sh-sub">Tempos em segundos e erros, com percentis normativos e classificações por faixa etária (${faixa} anos).</div></div>
      <div class="no-break">${tabelaHTML}</div>
      <div style="font-size:10px;color:#64748b;margin-top:6px;">
        ⓘ Percentis por pontos de corte normativos (Sedó, 2007). CI = Escolha − Leitura · FC = Alternância − Leitura.
        Classificação: <b>≥ 95 / &gt; 75</b> = Superior · <b>&gt; 50 / &gt; 25</b> = Média ·
        <b>&gt; 5</b> = Dificuldade Discreta · <b>&lt; 5</b> = Dificuldade Acentuada.
      </div>

      <!-- 4. PERFIL PERCENTÍLICO -->
      <div class="rpt-sh"><span class="num">4</span><span class="sh-title">Perfil Percentílico dos Tempos</span><div class="sh-sub">Barras indicam o percentil normativo obtido. Faixa azul = desempenho médio (P25–P75).</div></div>
      ${perfilHTML}

      <!-- 5. COMPARAÇÃO COM NORMA -->
      <div class="rpt-sh"><span class="num">5</span><span class="sh-title">Comparação com a Norma (${faixa} anos)</span><div class="sh-sub">Círculo = tempo do paciente · Faixa cinza = P25–P75 normativo · Linha = P50.</div></div>
      ${comparHTML}

      <!-- 6. INTERPRETAÇÃO -->
      <div class="rpt-sh"><span class="num">6</span><span class="sh-title">Interpretação Clínica</span></div>
      <div class="rpt-interp">${textoInterp.split("\n\n").map(p => `<p>${p}</p>`).join("")}</div>

      <!-- 7. RECOMENDAÇÕES -->
      ${recomendacoes ? `<div class="rpt-sh"><span class="num" style="background:#7c3aed">7</span><span class="sh-title">Conclusão e Recomendações</span><span class="sh-new">Clínico</span></div><div class="rpt-rec">${recomendacoes}</div>` : ""}

      <!-- RODAPÉ -->
      <div class="rpt-foot no-break">
        <div>
          ${profNome ? `<div style="font-weight:700;font-size:14px;color:#0f172a">${profNome}</div><div style="font-size:12px;color:#64748b">${profCRP || ""}${profEspecialidade ? ' · ' + profEspecialidade : ""}</div><div class="sign-line">Assinatura do profissional</div>` : '<div style="color:#64748b;font-size:12px">Documento gerado automaticamente</div>'}
        </div>
        <div class="rpt-foot-right">
          <div>Documento gerado em ${dataHoje}</div>
          <div class="rpt-foot-disclaimer">Este documento é confidencial e destinado exclusivamente ao profissional solicitante. Válido apenas com assinatura.</div>
        </div>
      </div>
    </div>
  </div>`;
}

/* ═══════════════════════════════════
   CALCULAR — entrada principal
   ═══════════════════════════════════ */
async function calcular(salvar) {
  try {
    const nome         = (document.getElementById("nome")?.value || "").trim();
    const nasc         = document.getElementById("dataNascimento")?.value;
    const apl          = document.getElementById("dataAplicacao")?.value;
    const cpf          = (document.getElementById("cpf")?.value || "").trim();
    const sexo         = document.getElementById("sexo")?.value || "";
    const escolaridade = document.getElementById("escolaridade")?.value || "";

    const profNome          = (document.getElementById("profNome")?.value || "").trim();
    const profCRP           = (document.getElementById("profCRP")?.value || "").trim();
    const profEspecialidade = (document.getElementById("profEspecialidade")?.value || "").trim();
    const motivo            = (document.getElementById("motivo")?.value || "").trim();
    const obsComportamentais = (document.getElementById("obsComportamentais")?.value || "").trim();
    const recomendacoes     = (document.getElementById("recomendacoes")?.value || "").trim();

    if (!nome || !nasc || !apl) { alert("Preencha Nome, Nascimento e Data de Aplicação."); return; }
    if (!cpf || !sexo || !escolaridade) { alert("Preencha CPF, sexo e escolaridade."); return; }
    if (!validarCPF(cpf)) { alert("CPF inválido. Verifique e tente novamente."); return; }

    const idade = calcularIdade(nasc, apl);
    if (!idade) { alert("Datas inválidas."); return; }
    const faixa = faixaEtariaFDT(idade);
    if (!faixa) { alert(`Idade fora do alcance normativo do FDT (6–75 anos). Idade calculada: ${idade.anos} anos.`); return; }

    // Coletar tempos e erros
    const camposT = { L: "t_leitura", C: "t_contagem", E: "t_escolha", A: "t_alternancia" };
    const camposE = { L: "e_leitura", C: "e_contagem", E: "e_escolha", A: "e_alternancia" };
    const tempos = {}; const erros = {};

    let algumPreenchido = false;
    for (const [cod, id] of Object.entries(camposT)) {
      const v = document.getElementById(id)?.value;
      if (v !== "" && v != null) {
        const n = parseFloat(v);
        if (isNaN(n) || n < 0) { alert(`Tempo inválido em ${cod}.`); return; }
        tempos[cod] = n;
        algumPreenchido = true;
      }
    }
    for (const [cod, id] of Object.entries(camposE)) {
      const v = document.getElementById(id)?.value;
      if (v !== "" && v != null) {
        const n = parseFloat(v);
        if (isNaN(n) || n < 0) { alert(`Erros inválidos em ${cod}.`); return; }
        erros[cod] = n;
      }
    }
    if (!algumPreenchido) { alert("Preencha ao menos um tempo."); return; }
    if (tempos.L == null) { alert("O tempo de Leitura é obrigatório para calcular os índices executivos."); return; }

    showLoading(salvar ? "Salvando e gerando relatório..." : "Calculando resultados...");

    // Cálculo 100% local
    const resultados = calcularResultados(tempos, erros, faixa);
    if (!resultados) { hideLoading(); alert("Erro ao calcular resultados. Verifique as entradas."); return; }

    montarRelatorio({ nome, cpf, sexo, escolaridade, nasc, apl, idade, faixa, resultados,
      profNome, profCRP, profEspecialidade, motivo, obsComportamentais, recomendacoes });

    if (salvar) {
      const rel = document.getElementById("relatorio");
      await esperarImagensCarregarem(rel);
      await new Promise(r => setTimeout(r, 150));

      const laudos = getLaudos();
      laudos.unshift({ nome, dataAplicacao: apl, faixa, createdAt: new Date().toISOString(),
        htmlRelatorio: rel.outerHTML, resultados });
      setLaudos(laudos);

      if (window.Integration) {
        const ciLabel = resultados?.CI?.pctLabel;
        const fcLabel = resultados?.FC?.pctLabel;
        const resumo = [
          ciLabel ? `CI: ${ciLabel} (${resultados.CI.classTempo})` : "",
          fcLabel ? `FC: ${fcLabel} (${resultados.FC.classTempo})` : "",
        ].filter(Boolean).join(" · ");
        await Integration.salvarTesteNoFirebase("fdt", {
          dataAplicacao: apl,
          resumo,
          scores: { tempos, erros, resultados },
          classificacao: resultados?.CI?.classTempo || "",
          observacoes: obsComportamentais,
          htmlRelatorio: rel.outerHTML,
        });
      }
    }

    hideLoading();
    openReportModal();

    if (salvar) {
      setTimeout(() => {
        const toolbar = document.querySelector(".toolbar-title");
        if (toolbar) toolbar.textContent = "📄 Relatório Gerado — Laudo salvo com sucesso!";
      }, 100);
    }

  } catch (e) {
    hideLoading();
    console.error(e);
    alert(`Erro ao calcular: ${e.message}`);
  }
}

/* ═══════════════════════════════════
   LISTA DE LAUDOS SALVOS
   ═══════════════════════════════════ */
function renderListaLaudos() {
  const box = document.getElementById("listaLaudos");
  if (!box) return;
  const laudos = getLaudos();
  if (!laudos.length) { box.innerHTML = '<p class="muted">Nenhum laudo salvo ainda.</p>'; return; }
  box.innerHTML = '<table class="rpt-tbl"><thead><tr><th>Paciente</th><th>Aplicação</th><th>Faixa</th><th>Ações</th></tr></thead><tbody>' +
    laudos.map((x, idx) =>
      `<tr><td>${x.nome}</td><td>${x.dataAplicacao}</td><td>${x.faixa} anos</td><td><button onclick="baixarPDFSalvo(${idx})">PDF</button></td></tr>`
    ).join("") + '</tbody></table>';
}

async function esperarImagensCarregarem(container) {
  const imgs = Array.from(container.querySelectorAll("img"));
  await Promise.all(imgs.map(img => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise(r => { img.onload = () => r(); img.onerror = () => r(); });
  }));
}

async function baixarPDFSalvo(index) {
  const item = getLaudos()[index];
  if (!item) return alert("Laudo não encontrado.");
  const temp = document.createElement("div"); temp.innerHTML = item.htmlRelatorio;
  document.body.appendChild(temp);
  await esperarImagensCarregarem(temp); await new Promise(r => setTimeout(r, 150));
  temp.remove();
}

async function baixarPDF() {
  const rel = document.getElementById("relatorio");
  if (!rel) return;
  await esperarImagensCarregarem(rel);

  const nome = rel.querySelector('.rpt-info .val.bold')?.textContent || 'Relatorio';
  const nomeArquivo = 'FDT_' + nome.replace(/\s+/g, '_').substring(0, 30) + '.pdf';

  showLoading("Gerando PDF...");

  const decos = rel.querySelectorAll('.deco1, .deco2');
  const badge = rel.querySelector('.rpt-hdr-badge');
  const reportEl = rel.querySelector('.report');
  decos.forEach(d => d.style.display = 'none');
  if (badge) badge.style.backdropFilter = 'none';
  if (reportEl) reportEl.style.overflow = 'visible';

  try {
    await html2pdf().set({
      margin: [5, 5, 5, 5],
      filename: nomeArquivo,
      image: { type: 'jpeg', quality: 1.00 },
      html2canvas: { scale: 4, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: 'mm', format: [210, 900], orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all'] }
    }).from(rel).save();
  } catch(e) {
    console.error("Erro ao gerar PDF:", e);
    alert("Erro ao gerar PDF. Tente novamente.");
  } finally {
    decos.forEach(d => d.style.display = '');
    if (badge) badge.style.backdropFilter = '';
    if (reportEl) reportEl.style.overflow = '';
    hideLoading();
  }
}

function voltarParaPaciente() {
  let paciente = null;
  try { const raw = sessionStorage.getItem("pacienteAtual"); if (raw) paciente = JSON.parse(raw); } catch(e) {}
  if (!paciente && window.Integration) paciente = Integration.getPacienteAtual();
  if (paciente && paciente.id) { sessionStorage.setItem("abrirPacienteId", paciente.id); }
  window.location.href = "/Pacientes/";
}

/* ═══════════════════════════════════
   INIT
   ═══════════════════════════════════ */
(function init() {
  document.getElementById("dataNascimento")?.addEventListener("change", atualizarPreviewIdade);
  document.getElementById("dataAplicacao")?.addEventListener("change", atualizarPreviewIdade);
  ["t_leitura", "t_escolha", "t_alternancia"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", atualizarDerivedos);
  });

  if (document.getElementById("listaLaudos")) renderListaLaudos();
})();

window.calcular = calcular;
window.baixarPDF = baixarPDF;
window.baixarPDFSalvo = baixarPDFSalvo;
window.closeReportModal = closeReportModal;
window.openReportModal = openReportModal;
window.voltarParaPaciente = voltarParaPaciente;
