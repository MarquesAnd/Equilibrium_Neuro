console.log("SCRIPT FDT CARREGADO v1 — RELATÓRIO COMPLETO");
const LAUDOS_KEY = "empresa_laudos_fdt";

/* ═══════════════════════════════════
   BANCO NORMATIVO (extraído da planilha)
   Fonte: Sedó, 2007 — normas brasileiras
   Estrutura: { faixa: { tempo: { media, dp }, erros: { media, dp } } }
   ═══════════════════════════════════ */
const FDT_NORMAS = {
  "6-8": {
    tempo:  { L: { m: 35.4, dp: 9.3 }, C: { m: 51.0, dp: 18.7 }, E: { m: 79.4, dp: 24.1 }, A: { m: 93.7, dp: 26.3 }, CI: { m: 44.0, dp: 19.5 }, FC: { m: 58.3, dp: 20.8 } },
    erros:  { L: { m: 0.0, dp: 0.2 }, C: { m: 0.5, dp: 1.2 }, E: { m: 2.6, dp: 2.6 }, A: { m: 3.9, dp: 4.7 } },
  },
  "9-10": {
    tempo:  { L: { m: 29.4, dp: 5.2 }, C: { m: 39.4, dp: 7.1 }, E: { m: 65.1, dp: 13.5 }, A: { m: 78.5, dp: 23.2 }, CI: { m: 35.7, dp: 11.7 }, FC: { m: 49.1, dp: 21.8 } },
    erros:  { L: { m: 0.0, dp: 0.2 }, C: { m: 0.4, dp: 0.8 }, E: { m: 1.9, dp: 1.9 }, A: { m: 3.1, dp: 2.9 } },
  },
  "11-12": {
    tempo:  { L: { m: 29.4, dp: 13.5 }, C: { m: 38.2, dp: 11.4 }, E: { m: 59.4, dp: 28.9 }, A: { m: 68.6, dp: 27.5 }, CI: { m: 30.0, dp: 18.0 }, FC: { m: 39.2, dp: 17.7 } },
    erros:  { L: { m: 0.1, dp: 0.3 }, C: { m: 0.4, dp: 1.1 }, E: { m: 1.7, dp: 2.7 }, A: { m: 2.6, dp: 3.2 } },
  },
  "13-15": {
    tempo:  { L: { m: 23.3, dp: 5.2 }, C: { m: 30.0, dp: 7.3 }, E: { m: 47.1, dp: 11.8 }, A: { m: 56.9, dp: 15.2 }, CI: { m: 23.8, dp: 9.0 }, FC: { m: 33.6, dp: 12.5 } },
    erros:  { L: { m: 0.0, dp: 0.0 }, C: { m: 0.2, dp: 0.5 }, E: { m: 1.6, dp: 2.4 }, A: { m: 1.9, dp: 2.1 } },
  },
  "16-18": {
    tempo:  { L: { m: 20.4, dp: 4.1 }, C: { m: 23.8, dp: 3.5 }, E: { m: 34.0, dp: 5.9 }, A: { m: 44.8, dp: 9.1 }, CI: { m: 13.6, dp: 4.9 }, FC: { m: 24.4, dp: 7.8 } },
    erros:  { L: { m: 0.0, dp: 0.0 }, C: { m: 0.0, dp: 0.2 }, E: { m: 0.6, dp: 1.8 }, A: { m: 1.5, dp: 1.7 } },
  },
  "19-34": {
    tempo:  { L: { m: 22.0, dp: 5.6 }, C: { m: 24.8, dp: 5.2 }, E: { m: 36.9, dp: 10.0 }, A: { m: 46.0, dp: 13.0 }, CI: { m: 14.8, dp: 8.3 }, FC: { m: 23.9, dp: 10.8 } },
    erros:  { L: { m: 0.0, dp: 0.2 }, C: { m: 0.1, dp: 0.4 }, E: { m: 0.4, dp: 0.9 }, A: { m: 0.9, dp: 1.5 } },
  },
  "35-59": {
    tempo:  { L: { m: 23.9, dp: 6.5 }, C: { m: 27.1, dp: 7.2 }, E: { m: 41.7, dp: 14.5 }, A: { m: 53.6, dp: 18.4 }, CI: { m: 17.8, dp: 12.0 }, FC: { m: 29.7, dp: 15.7 } },
    erros:  { L: { m: 0.0, dp: 0.2 }, C: { m: 0.0, dp: 0.2 }, E: { m: 0.7, dp: 1.9 }, A: { m: 1.5, dp: 2.6 } },
  },
  "60-75": {
    tempo:  { L: { m: 26.6, dp: 6.2 }, C: { m: 29.7, dp: 6.3 }, E: { m: 47.4, dp: 11.3 }, A: { m: 65.3, dp: 18.0 }, CI: { m: 20.8, dp: 9.0 }, FC: { m: 38.7, dp: 15.7 } },
    erros:  { L: { m: 0.0, dp: 0.1 }, C: { m: 0.1, dp: 0.3 }, E: { m: 0.8, dp: 1.1 }, A: { m: 1.7, dp: 2.0 } },
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

/* ═══════════════════════════════════
   CÁLCULO NORMATIVO (z-score → percentil)
   Para TEMPO: escore > média = pior, então invertemos o z
   Para ERROS: idem — mais erros = pior
   ═══════════════════════════════════ */
function normcdf(z) {
  // Aproximação racional (Abramowitz & Stegun 26.2.17)
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z);
  const a1 = 0.319381530, a2 = -0.356563782, a3 = 1.781477937, a4 = -1.821255978, a5 = 1.330274429;
  const p = 0.2316419;
  const t = 1 / (1 + p * x);
  const poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  const phi = 1 - (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x) * poly;
  return sign === 1 ? phi : 1 - phi;
}

function calcularPercentil(valor, media, dp, inverter = true) {
  if (valor == null || valor === "" || media == null || dp == null) return null;
  if (dp === 0) return valor <= media ? 99 : 1;
  const z = (media - valor) / dp; // invertido: maior tempo = z negativo = menor percentil
  const pct = inverter ? Math.round(normcdf(z) * 100) : Math.round(normcdf(-z) * 100);
  return Math.max(1, Math.min(99, pct));
}

function classificarPercentil(p) {
  if (p == null) return "—";
  if (p <= 5)  return "Inferior";
  if (p <= 25) return "Médio Inferior";
  if (p <= 75) return "Média";
  return "Superior";
}

/* ═══════════════════════════════════
   CALCULAR TODOS OS RESULTADOS
   ═══════════════════════════════════ */
function calcularResultados(tempos, erros, faixa) {
  const norma = FDT_NORMAS[faixa];
  if (!norma) return null;

  const partes = ["L", "C", "E", "A"];
  const nomes  = { L: "Leitura", C: "Contagem", E: "Escolha", A: "Alternância" };
  const derivados = [
    { cod: "CI", nome: "Controle Inibitório", formula: "E − L" },
    { cod: "FC", nome: "Flexibilidade Cognitiva", formula: "A − L" },
  ];

  const resultados = {};

  // Calcular CI e FC
  const t_CI = (tempos.E != null && tempos.L != null) ? tempos.E - tempos.L : null;
  const t_FC = (tempos.A != null && tempos.L != null) ? tempos.A - tempos.L : null;
  const temposCompletos = { ...tempos, CI: t_CI, FC: t_FC };

  // Partes diretas
  partes.forEach(cod => {
    const t = tempos[cod];
    const e = erros[cod];
    const nT = norma.tempo[cod];
    const nE = norma.erros[cod];
    const pctTempo  = calcularPercentil(t, nT?.m, nT?.dp, true);
    const pctErros  = calcularPercentil(e, nE?.m, nE?.dp, true);
    resultados[cod] = {
      cod, nome: nomes[cod],
      tempo: t, pctTempo, classTempo: classificarPercentil(pctTempo),
      erros: e, pctErros, classErros: classificarPercentil(pctErros),
    };
  });

  // Índices derivados (somente tempo, sem erros)
  derivados.forEach(({ cod, nome, formula }) => {
    const t = temposCompletos[cod];
    const nT = norma.tempo[cod];
    const pctTempo = calcularPercentil(t, nT?.m, nT?.dp, true);
    resultados[cod] = {
      cod, nome, formula,
      tempo: t, pctTempo, classTempo: classificarPercentil(pctTempo),
      erros: null, pctErros: null, classErros: null,
      derivado: true,
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
  const m = { "Superior": "cl-s", "Média": "cl-m", "Médio Inferior": "cl-mi", "Inferior": "cl-eb" };
  return m[cl] || "cl-m";
}
function clBadge(cl) { return cl ? `<span class="cl-badge ${clBadgeClass(cl)}">${cl}</span>` : "—"; }

function barColorFDT(pct) {
  if (pct == null) return "#94a3b8";
  if (pct >= 76) return "#059669";
  if (pct >= 26) return "#1a56db";
  if (pct >= 6)  return "#f59e0b";
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
      <td class="ctr">${r.pctTempo != null ? r.pctTempo + "%" : "—"}</td>
      <td>${clBadge(r.classTempo)}</td>
      <td class="ctr">${!r.derivado && r.erros != null ? r.erros : derivado ? "<span style='color:#94a3b8;font-size:11px'>—</span>" : "—"}</td>
      <td class="ctr">${!r.derivado && r.pctErros != null ? r.pctErros + "%" : derivado ? "<span style='color:#94a3b8;font-size:11px'>—</span>" : "—"}</td>
      <td>${!r.derivado ? clBadge(r.classErros) : "<span style='color:#94a3b8;font-size:11px'>n/a</span>"}</td>
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
        <th class="ctr" style="font-size:10px;width:55px">Percentil</th>
        <th style="font-size:10px">Classificação</th>
        <th class="ctr" style="font-size:10px;width:50px">Erros</th>
        <th class="ctr" style="font-size:10px;width:55px">Percentil</th>
        <th style="font-size:10px">Classificação</th>
      </tr>
    </thead><tbody>${rows}</tbody></table>
  </div>`;
}

/* ═══════════════════════════════════
   RENDER: PERFIL GRÁFICO (barras horizontais)
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
    const p = r.pctTempo;
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
      <div class="bar-val" style="width:40px">${p != null ? p + "%" : "—"}</div>
      <div class="bar-badge">${clBadge(cl)}</div>
    </div>`;
  }).join("");

  return `<div class="rpt-box no-break">
    <div style="font-size:11px;color:#64748b;margin-bottom:8px">Eixo = percentil (1–99) · Faixa azul = faixa média (P26–P75) · Baseado nos tempos</div>
    ${barras}
  </div>`;
}

/* ═══════════════════════════════════
   RENDER: GRÁFICO IC STYLE (comparação com norma)
   ═══════════════════════════════════ */
function renderComparativoNorma(resultados, faixa) {
  const norma = FDT_NORMAS[faixa];
  if (!norma) return "";
  const partes = ["L", "C", "E", "A", "CI", "FC"];
  const nomes  = { L: "Leitura", C: "Contagem", E: "Escolha", A: "Alternância", CI: "Controle Inibitório", FC: "Flexibilidade" };
  const maxTempo = 120; // eixo máximo em segundos

  const rows = partes.map(cod => {
    const r = resultados[cod];
    if (!r || r.tempo == null) return "";
    const n = norma.tempo[cod];
    if (!n) return "";
    const scale = v => Math.min(100, (v / maxTempo) * 100);
    const colPac = barColorFDT(r.pctTempo);
    // Intervalo ±1 DP da norma
    const lo = Math.max(0, n.m - n.dp);
    const hi = n.m + n.dp;
    const derivado = cod === "CI" || cod === "FC";
    return `<div class="ic-row">
      <div class="ic-label" style="color:${colPac};width:165px;font-size:12px">${derivado ? `<b style="color:#1a56db">${nomes[cod]}</b>` : `<b>${nomes[cod]}</b>`}</div>
      <div class="ic-track" style="flex:1;position:relative;height:28px;margin:0 10px">
        <!-- banda normativa ±1DP -->
        <div style="position:absolute;top:8px;height:12px;left:${scale(lo).toFixed(1)}%;width:${(scale(hi)-scale(lo)).toFixed(1)}%;background:rgba(148,163,184,.25);border:1px solid rgba(148,163,184,.4);border-radius:3px"></div>
        <!-- linha da média normativa -->
        <div style="position:absolute;top:4px;width:2px;height:20px;left:${scale(n.m).toFixed(1)}%;background:rgba(100,116,139,.5);border-radius:1px"></div>
        <!-- ponto do paciente -->
        <div style="position:absolute;top:6px;width:16px;height:16px;left:calc(${scale(r.tempo).toFixed(1)}% - 8px);background:${colPac};border-radius:50%;box-shadow:0 2px 6px ${colPac}50;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#fff">${r.tempo}</div>
      </div>
      <div style="width:80px;font-size:11px;text-align:right">${clBadge(r.classTempo)}</div>
    </div>`;
  }).join("");

  const ticks = [0, 20, 40, 60, 80, 100, 120].map(v =>
    `<span style="position:absolute;left:${(v/maxTempo*100).toFixed(1)}%;transform:translateX(-50%)">${v}</span>`
  ).join("");

  return `<div class="rpt-box no-break">
    <div style="position:relative;height:18px;margin-bottom:4px;font-size:10px;color:#64748b">${ticks}</div>
    ${rows}
    <div style="font-size:10px;color:#64748b;margin-top:8px">Círculo = tempo do paciente (seg) · Faixa cinza = média normativa ±1DP (${faixa} anos) · Linha = média</div>
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
  const partes = ["L", "C", "E", "A"];
  const abertura = ["Em relação à", "Quanto à", "No que se refere à", "Em relação à"];

  const parts = partes.map((cod, i) => {
    const r = resultados[cod];
    if (!r || r.pctTempo == null) return null;
    const cls = r.classTempo;
    const verbMap = {
      "Superior": "situa-se acima da média normativa",
      "Média": "situa-se dentro da faixa média normativa",
      "Médio Inferior": "situa-se abaixo da média normativa",
      "Inferior": "situa-se significativamente abaixo da média normativa",
    };
    const verb = verbMap[cls] || "situa-se";
    return `${abertura[i]} <b>${r.nome}</b>, a habilidade de ${descricoes[cod]} ${verb} (tempo = ${r.tempo} seg; percentil = ${r.pctTempo}%; classificação: ${cls}).`;
  }).filter(Boolean);

  const ci = resultados["CI"];
  const fc = resultados["FC"];
  if (ci?.pctTempo != null || fc?.pctTempo != null) {
    let exec = "Em relação aos índices executivos: ";
    if (ci?.pctTempo != null) {
      exec += `o <b>Controle Inibitório</b> (${ci.tempo} seg; P${ci.pctTempo}%) apresenta-se na faixa <b>${ci.classTempo}</b>`;
    }
    if (ci?.pctTempo != null && fc?.pctTempo != null) exec += "; ";
    if (fc?.pctTempo != null) {
      exec += `a <b>Flexibilidade Cognitiva</b> (${fc.tempo} seg; P${fc.pctTempo}%) apresenta-se na faixa <b>${fc.classTempo}</b>`;
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
      <div class="rpt-sh"><span class="num">3</span><span class="sh-title">Resultados por Parte</span><div class="sh-sub">Tempos em segundos e erros, com percentis e classificações por faixa etária (${faixa} anos).</div></div>
      <div class="no-break">${tabelaHTML}</div>
      <div style="font-size:10px;color:#64748b;margin-top:6px;">
        ⓘ Percentis calculados via z-score: tempo maior = desempenho inferior.
        CI = Escolha − Leitura · FC = Alternância − Leitura.
        Erros não normatizados para CI e FC.
      </div>

      <!-- 4. PERFIL PERCENTÍLICO -->
      <div class="rpt-sh"><span class="num">4</span><span class="sh-title">Perfil Percentílico dos Tempos</span><div class="sh-sub">Barras indicam o percentil obtido. Faixa azul = desempenho médio (P26–P75).</div></div>
      ${perfilHTML}

      <!-- 5. COMPARAÇÃO COM NORMA -->
      <div class="rpt-sh"><span class="num">5</span><span class="sh-title">Comparação com a Norma (${faixa} anos)</span><div class="sh-sub">Círculo = tempo do paciente. Faixa cinza = intervalo ±1DP da norma.</div></div>
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
        const ciPct = resultados?.CI?.pctTempo;
        const fcPct = resultados?.FC?.pctTempo;
        const resumo = [
          ciPct != null ? `CI: P${ciPct} (${resultados.CI.classTempo})` : "",
          fcPct != null ? `FC: P${fcPct} (${resultados.FC.classTempo})` : "",
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
  // Preview de idade e derivados ao mudar datas/tempos
  document.getElementById("dataNascimento")?.addEventListener("change", atualizarPreviewIdade);
  document.getElementById("dataAplicacao")?.addEventListener("change", atualizarPreviewIdade);
  ["t_leitura", "t_escolha", "t_alternancia"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", atualizarDerivedos);
  });

  // Lista de laudos
  if (document.getElementById("listaLaudos")) renderListaLaudos();
})();

window.calcular = calcular;
window.baixarPDF = baixarPDF;
window.baixarPDFSalvo = baixarPDFSalvo;
window.closeReportModal = closeReportModal;
window.openReportModal = openReportModal;
window.voltarParaPaciente = voltarParaPaciente;
