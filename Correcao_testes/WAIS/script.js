console.log("SCRIPT WAIS CARREGADO v4 — RELATÓRIO COMPLETO");
const LAUDOS_KEY = "empresa_laudos_wais";

const SUBTESTES = [
  { nome: "Completar Figuras", codigo: "CF", id: "pb_CF" },
  { nome: "Vocabulário", codigo: "VC", id: "pb_VC" },
  { nome: "Códigos", codigo: "CD", id: "pb_CD" },
  { nome: "Semelhanças", codigo: "SM", id: "pb_SM" },
  { nome: "Cubos", codigo: "CB", id: "pb_CB" },
  { nome: "Aritmética", codigo: "AR", id: "pb_AR" },
  { nome: "Raciocínio Matricial", codigo: "RM", id: "pb_RM" },
  { nome: "Dígitos", codigo: "DG", id: "pb_DG" },
  { nome: "Informação", codigo: "IN", id: "pb_IN" },
  { nome: "Arranjo de Figuras", codigo: "AF", id: "pb_AF" },
  { nome: "Compreensão", codigo: "CO", id: "pb_CO" },
  { nome: "Procurar Símbolos", codigo: "PS", id: "pb_PS" },
  { nome: "Sequência de Números e Letras", codigo: "SNL", id: "pb_SNL" },
  { nome: "Armar Objetos", codigo: "AO", id: "pb_AO" },
];

// Valores críticos para diferenças entre índices (p < .05) — Tabela B.2, Nascimento 2005
const VALORES_CRITICOS = {
  "ICV × IOP": 11.75, "ICV × IMO": 12.87, "ICV × IVP": 14.21,
  "IOP × IMO": 13.50, "IOP × IVP": 15.02, "IMO × IVP": 15.67,
  "QIV × QIE": 9.72,
};

/* ═══════════════════════════════════
   FUNÇÕES UTILITÁRIAS (mantidas)
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

function faixaEtariaWAISIII(idade) {
  if (!idade) return null;
  const anos = idade.anos;
  if (anos >= 16 && anos <= 17) return "16 - 17";
  if (anos >= 18 && anos <= 19) return "18 - 19";
  if (anos >= 20 && anos <= 29) return "20 - 29";
  if (anos >= 30 && anos <= 39) return "30 - 39";
  if (anos >= 40 && anos <= 49) return "40 - 49";
  if (anos >= 50 && anos <= 59) return "50 - 59";
  if (anos >= 60 && anos <= 64) return "60 - 64";
  if (anos >= 65 && anos <= 89) return "65 - 89";
  return null;
}

function obterNomeSubteste(codigo) {
  const map = { CB:"Cubos", SM:"Semelhanças", DG:"Dígitos", CN:"Conceitos Figurativos", CD:"Código",
    VC:"Vocabulário", SNL:"Seq. Núm. e Letras", RM:"Raciocínio Matricial", CO:"Compreensão",
    PS:"Procurar Símbolos", CF:"Completar Figuras", CA:"Cancelamento", IN:"Informação",
    AR:"Aritmética", RP:"Raciocínio com Palavras", AF:"Arranjo de Figuras", AO:"Armar Objetos" };
  return map[codigo] || codigo;
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

function pctText(p) { return (p == null || p === "" || Number.isNaN(+p)) ? "—" : `${+p}%`; }
function fmtIC(arr) { return !Array.isArray(arr) ? "—" : `${arr[0]}–${arr[1]}`; }

function classByComposite(score) {
  const s = +score; if (Number.isNaN(s)) return "—";
  if (s >= 130) return "Muito Superior";
  if (s >= 120) return "Superior";
  if (s >= 110) return "Médio Superior";
  if (s >= 90) return "Médio";
  if (s >= 80) return "Médio Inferior";
  if (s >= 70) return "Limítrofe";
  return "Extremamente Baixo";
}

function classByPonderado(p) {
  const s = +p; if (Number.isNaN(s)) return "—";
  if (s >= 16) return "Muito Superior";
  if (s >= 14) return "Superior";
  if (s >= 12) return "Médio Superior";
  if (s >= 9) return "Médio";
  if (s >= 7) return "Médio Inferior";
  if (s >= 4) return "Limítrofe";
  return "Extremamente Baixo";
}

/* ═══════════════════════════════════
   NOVAS FUNÇÕES: Discrepâncias e Fortes/Fracos
   ═══════════════════════════════════ */
function calcularDiscrepancias(compostos) {
  const pares = [
    { par: "ICV × IOP", a: "ICV", b: "IOP" },
    { par: "ICV × IMO", a: "ICV", b: "IMO" },
    { par: "ICV × IVP", a: "ICV", b: "IVP" },
    { par: "IOP × IMO", a: "IOP", b: "IMO" },
    { par: "IOP × IVP", a: "IOP", b: "IVP" },
    { par: "IMO × IVP", a: "IMO", b: "IVP" },
    { par: "QIV × QIE", a: "QI_VERBAL", b: "QI_EXECUCAO" },
  ];
  return pares.map(p => {
    const va = compostos?.[p.a]?.composto;
    const vb = compostos?.[p.b]?.composto;
    if (va == null || vb == null) return null;
    const diff = va - vb;
    const vc = VALORES_CRITICOS[p.par] || 99;
    const sig = Math.abs(diff) >= vc;
    return { par: p.par, va, vb, diff, vc, sig };
  }).filter(Boolean);
}

function calcularPontosFortesFracos(resultados) {
  const ponderados = [];
  Object.values(resultados).forEach(r => {
    if (r.ponderado != null && r.ponderado !== "") ponderados.push({ cod: r.codigo, nome: r.nome, p: +r.ponderado });
  });
  if (ponderados.length === 0) return { media: 0, fortes: [], fracos: [] };
  const media = ponderados.reduce((s, x) => s + x.p, 0) / ponderados.length;
  const fortes = ponderados.filter(x => x.p - media >= 3).sort((a, b) => b.p - a.p);
  const fracos = ponderados.filter(x => media - x.p >= 3).sort((a, b) => a.p - b.p);
  return { media, fortes, fracos };
}

/* ═══════════════════════════════════
   RECALCULO LOCAL DAS SOMAS
   Garante que todos os pontos ponderados
   sejam somados corretamente, incluindo
   subtestes suplementares quando presentes.
   ═══════════════════════════════════ */

// Composição dos índices: quais subtestes PRINCIPAIS e quais SUPLEMENTARES
const COMPOSICAO_INDICES = {
  ICV: {
    principais: ["SM", "VC", "IN"],   // 3 obrigatórios
    suplementares: ["CO"],            // entra se faltrar um principal
  },
  IOP: {
    principais: ["CB", "CF", "RM"],
    suplementares: ["AF"],
  },
  IMO: {
    principais: ["AR", "DG"],
    suplementares: ["SNL"],
  },
  IVP: {
    principais: ["CD", "PS"],
    suplementares: [],
  },
};

// QI Verbal = SM, VC, AR, DG, IN + CO (supl) + SNL (supl)
// Para QI Verbal e QI Execução, TODOS os subtestes do grupo entram na soma —
// inclusive CO, SNL, PS e AO, que são "suplementares" apenas para os ÍNDICES
// fatoriais (ICV, IOP, IMO, IVP), mas contam normalmente para QIV e QIE.
const COMPOSICAO_QI = {
  QI_VERBAL: {
    principais: ["SM", "VC", "AR", "DG", "IN", "CO", "SNL"],
    suplementares: [],
  },
  QI_EXECUCAO: {
    principais: ["CF", "CD", "CB", "RM", "AF", "PS", "AO"],
    suplementares: [],
  },
};

/**
 * Recalcula todas as somas localmente a partir dos resultados retornados pela API.
 * Retorna um objeto com as somas corrigidas para cada índice/QI,
 * incluindo a lista completa de subtestes usados.
 */
function recalcularSomasLocalmente(resultados, somasAPI, indicesInfoAPI) {
  // Helper: obtém ponderado de um subteste (ou null se não disponível)
  function getPond(codigo) {
    const v = resultados?.[codigo]?.ponderado;
    if (v == null || v === "") return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }

  // Helper: soma subtestes de um grupo, respeitando a regra:
  // usa todos os principais disponíveis; suplementar entra se algum principal falta.
  function somarGrupo(principais, suplementares) {
    const usados = [];
    let soma = 0;
    let faltando = 0;

    for (const cod of principais) {
      const p = getPond(cod);
      if (p != null) {
        usados.push(cod);
        soma += p;
      } else {
        faltando++;
      }
    }

    // Para cada principal faltando, tenta substituir por suplementar
    let supIdx = 0;
    for (let i = 0; i < faltando && supIdx < suplementares.length; i++, supIdx++) {
      const cod = suplementares[supIdx];
      const p = getPond(cod);
      if (p != null) {
        usados.push(cod);
        soma += p;
      }
    }

    // Subtestes suplementares disponíveis mas NÃO usados (exibe entre parênteses)
    const naoUsados = [];
    for (const cod of suplementares) {
      if (!usados.includes(cod) && getPond(cod) != null) {
        naoUsados.push(cod);
      }
    }

    return { soma, usados, naoUsados };
  }

  // Recalcula índices (ICV, IOP, IMO, IVP)
  const indicesRecalc = {};
  for (const [idx, comp] of Object.entries(COMPOSICAO_INDICES)) {
    const { soma, usados, naoUsados } = somarGrupo(comp.principais, comp.suplementares);
    // Preserva soma/compostos da API se existir; substitui apenas a soma e usados
    const apiInfo = indicesInfoAPI?.[idx] || {};
    indicesRecalc[idx] = {
      ...apiInfo,
      soma: usados.length > 0 ? soma : (apiInfo.soma ?? "—"),
      usados,
      naoUsados,
    };
  }

  // Recalcula QI Verbal e QI de Execução
  const somasRecalc = { ...somasAPI };
  for (const [qi, comp] of Object.entries(COMPOSICAO_QI)) {
    const { soma, usados, naoUsados } = somarGrupo(comp.principais, comp.suplementares);
    somasRecalc[qi] = {
      ...(somasAPI?.[qi] || {}),
      soma: usados.length > 0 ? soma : (somasAPI?.[qi]?.soma ?? "—"),
      usados,
      naoUsados,
    };
  }

  // QI Total = QI Verbal + QI de Execução (somas locais)
  const somaVerbal = somasRecalc.QI_VERBAL?.soma;
  const somaExec   = somasRecalc.QI_EXECUCAO?.soma;
  if (typeof somaVerbal === "number" && typeof somaExec === "number") {
    somasRecalc.QI_TOTAL = {
      ...(somasAPI?.QI_TOTAL || {}),
      soma: somaVerbal + somaExec,
      usados: [...(somasRecalc.QI_VERBAL?.usados || []), ...(somasRecalc.QI_EXECUCAO?.usados || [])],
    };
  }

  // Soma geral de TODOS os pontos ponderados disponíveis
  const todosCodigos = Object.keys(resultados);
  let somaTotal = 0;
  const todosUsados = [];
  for (const cod of todosCodigos) {
    const p = getPond(cod);
    if (p != null) { somaTotal += p; todosUsados.push(cod); }
  }
  somasRecalc._SOMA_TOTAL_GERAL = { soma: somaTotal, usados: todosUsados };

  return { somasRecalc, indicesRecalc };
}

/* ═══════════════════════════════════
   RENDER HELPERS (mantidos / melhorados)
   ═══════════════════════════════════ */
function cellIndice(codigo, usadosSet, possiveisSet, resultados) {
  if (!possiveisSet || !possiveisSet.has(codigo)) return `<td class="idx fill"></td>`;
  const v = resultados?.[codigo]?.ponderado;
  if (v == null || v === "") return `<td class="idx fill"></td>`;
  const sup = !(usadosSet && usadosSet.has(codigo));
  return `<td class="idx fill"><span class="${sup ? 'pill sup' : 'pill'}">${sup ? `(${v})` : v}</span></td>`;
}

function renderMatrizConversao({ resultados, indicesInfo, somas }) {
  const usadosICV = new Set(indicesInfo?.ICV?.usados || []);
  const usadosIOP = new Set(indicesInfo?.IOP?.usados || []);
  const usadosIMO = new Set(indicesInfo?.IMO?.usados || []);
  const usadosIVP = new Set(indicesInfo?.IVP?.usados || []);
  const usadosVERBAL = new Set(somas?.QI_VERBAL?.usados || []);
  const usadosEXEC = new Set(somas?.QI_EXECUCAO?.usados || []);
  const possiveis = {
    VERBAL: new Set(["VC","SM","AR","DG","IN","CO","SNL"]),
    EXEC: new Set(["CF","CD","CB","RM","AF","PS","AO"]),
    ICV: new Set(["SM","VC","IN","CO"]), IOP: new Set(["CB","CF","RM","AF"]),
    IMO: new Set(["AR","DG","SNL"]), IVP: new Set(["CD","PS"]),
  };
  const ordem = ["CF","VC","CD","SM","CB","AR","RM","DG","IN","AF","CO","PS","SNL","AO"];
  const linhas = ordem.map(codigo => {
    const r = resultados[codigo] || { bruto: "", ponderado: "" };
    return `<tr>
      <td class="col-sub"><b>${obterNomeSubteste(codigo)}</b> <span class="muted">(${codigo})</span></td>
      <td class="col-pb">${r.bruto ?? ""}</td><td class="col-pp">${r.ponderado ?? ""}</td>
      ${cellIndice(codigo, usadosVERBAL, possiveis.VERBAL, resultados)}
      ${cellIndice(codigo, usadosEXEC, possiveis.EXEC, resultados)}
      ${cellIndice(codigo, usadosICV, possiveis.ICV, resultados)}
      ${cellIndice(codigo, usadosIOP, possiveis.IOP, resultados)}
      ${cellIndice(codigo, usadosIMO, possiveis.IMO, resultados)}
      ${cellIndice(codigo, usadosIVP, possiveis.IVP, resultados)}
    </tr>`;
  }).join("");

  return `<table class="wisc-matrix"><thead>
    <tr><th class="col-sub">Subtestes</th><th class="col-pb">PB</th><th class="col-pp">Ponderado</th><th colspan="6">Contribuição (Pontos Ponderados)</th></tr>
    <tr><th></th><th></th><th></th><th class="idx">Verbal</th><th class="idx">Exec.</th><th class="idx">ICV</th><th class="idx">IOP</th><th class="idx">IMO</th><th class="idx">IVP</th></tr>
  </thead><tbody>${linhas}</tbody><tfoot><tr>
    <td class="sum-label" colspan="3">Soma dos Pontos Ponderados</td>
    <td>${somas?.QI_VERBAL?.soma ?? "—"}</td><td>${somas?.QI_EXECUCAO?.soma ?? "—"}</td>
    <td>${indicesInfo?.ICV?.soma ?? "—"}</td><td>${indicesInfo?.IOP?.soma ?? "—"}</td>
    <td>${indicesInfo?.IMO?.soma ?? "—"}</td><td>${indicesInfo?.IVP?.soma ?? "—"}</td>
  </tr></tfoot></table>`;
}

function renderPerfilSubtestes(resultados) {
  const grupos = [
    { titulo: "Compreensão Verbal", codes: ["SM","VC","IN","CO"] },
    { titulo: "Organização Perceptual", codes: ["CB","CF","RM","AF"] },
    { titulo: "Memória Operacional", codes: ["AR","DG","SNL"] },
    { titulo: "Velocidade de Proc.", codes: ["CD","PS"] },
  ];
  const supl = new Set(["SNL","AO"]);
  const head1 = grupos.map(g => `<th colspan="${g.codes.length}" class="perfil-group">${g.titulo}</th>`).join("");
  const codes = grupos.flatMap(g => g.codes).map(c => `<th class="perfil-code">${supl.has(c) ? `(${c})` : c}</th>`).join("");
  const vals = grupos.flatMap(g => g.codes).map(c => `<td class="perfil-val">${resultados?.[c]?.ponderado ?? "—"}</td>`).join("");
  return `<table class="perfil-table"><thead><tr>${head1}</tr><tr>${codes}</tr></thead><tbody><tr>${vals}</tr></tbody></table>`;
}

/* ═══════════════════════════════════
   TEXTO INTERPRETATIVO (sem Math.random)
   ═══════════════════════════════════ */
function scaleLabelLong(key) {
  const map = { QI_TOTAL:"QI Total (QIT)", QI_VERBAL:"QI Verbal (QIV)", QI_EXECUCAO:"QI de Execução (QIE)", ICV:"Índice de Compreensão Verbal (ICV)", IOP:"Índice de Organização Perceptual (IOP)", IMO:"Índice de Memória Operacional (IMO)", IVP:"Índice de Velocidade de Processamento (IVP)" };
  return map[key] || key;
}

function abilityDescription(key) {
  const map = { QI_TOTAL:"funcionamento intelectual global", QI_VERBAL:"conhecimento adquirido, raciocínio verbal e atenção a materiais verbais", QI_EXECUCAO:"raciocínio fluido, processamento espacial, atenção a detalhes e integração visomotora", ICV:"raciocínio verbal e formação de conceitos", IOP:"raciocínio não verbal, atenção a detalhes e integração visomotora", IMO:"atenção, concentração e controle mental para manipular informações", IVP:"rapidez e eficiência para processar informações visuais simples" };
  return map[key] || "habilidades cognitivas avaliadas";
}

function introVerbByClass(cls) {
  const map = { "Muito Superior":"situa-se muito acima da média", "Superior":"situa-se acima da média", "Médio Superior":"situa-se acima da média", "Médio":"situa-se na faixa média", "Médio Inferior":"situa-se ligeiramente abaixo da média", "Limítrofe":"situa-se na faixa limítrofe", "Extremamente Baixo":"situa-se muito abaixo da média" };
  return map[cls] || "situa-se";
}

function gerarTextoInterpretativo({ nome, compostos }) {
  const keys = ["QI_TOTAL","QI_VERBAL","QI_EXECUCAO","ICV","IOP","IMO","IVP"];
  const openings = ["Em relação ao","Quanto ao","Em relação ao","Quanto ao","Em relação ao","Quanto ao","Em relação ao"];
  const parts = [];
  keys.forEach((key, i) => {
    const c = compostos?.[key];
    if (!c?.composto) return;
    const cls = classByComposite(c.composto);
    const verb = introVerbByClass(cls);
    const label = scaleLabelLong(key);
    const abil = abilityDescription(key);
    parts.push(`${openings[i]} <b>${label}</b>, as habilidades relacionadas a ${abil} ${verb} em comparação a pessoas de mesma faixa etária (pontuação composta = ${c.composto}; percentil ≈ ${pctText(c.percentil)}; IC 95% = ${fmtIC(c.ic95)}; classificação: ${cls}).`);
  });
  return parts.join("\n\n");
}

/* ═══════════════════════════════════
   INPUTS / PREVIEW
   ═══════════════════════════════════ */
function montarInputsSubtestes() {
  const tbody = document.getElementById("tbodySubtestes");
  if (!tbody) return;
  tbody.innerHTML = "";
  SUBTESTES.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><b>${s.nome}</b> <span class="muted">(${s.codigo})</span></td><td><input type="number" min="0" id="${s.id}" placeholder="Bruto"></td>`;
    tbody.appendChild(tr);
  });
}

function atualizarPreviewIdade() {
  const nasc = document.getElementById("dataNascimento")?.value;
  const apl = document.getElementById("dataAplicacao")?.value;
  const idadeEl = document.getElementById("idadeCalculada");
  const faixaEl = document.getElementById("faixaCalculada");
  if (!idadeEl || !faixaEl) return;
  if (!nasc || !apl) { idadeEl.textContent = ""; faixaEl.textContent = ""; return; }
  const idade = calcularIdade(nasc, apl);
  if (!idade) { idadeEl.textContent = "Datas inválidas."; faixaEl.textContent = ""; return; }
  idadeEl.textContent = `Idade na aplicação: ${idade.anos} anos e ${idade.meses} meses.`;
  const faixa = faixaEtariaWAISIII(idade);
  faixaEl.textContent = faixa ? `Faixa normativa: ${faixa}` : "Faixa normativa: não encontrada.";
}

/* ═══════════════════════════════════
   LOADING OVERLAY + MODAL
   ═══════════════════════════════════ */
function showLoading(msg) {
  const overlay = document.createElement("div");
  overlay.id = "loadingOverlay";
  overlay.className = "loading-overlay";
  overlay.innerHTML = `<div class="loading-card">
    <div class="loading-spinner"></div>
    <div class="loading-title">${msg || "Gerando relatório..."}</div>
    <div class="loading-sub">Conectando com a API e processando dados</div>
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

  // Remove modal anterior se existir
  closeReportModal();

  const backdrop = document.createElement("div");
  backdrop.id = "reportModal";
  backdrop.className = "report-modal-backdrop";
  backdrop.innerHTML = `
    <div class="report-modal">
      <div class="report-modal-toolbar no-print">
        <div class="toolbar-title">📄 Relatório Gerado</div>
        <div class="toolbar-actions">
          <button class="toolbar-btn toolbar-btn-primary" onclick="baixarPDF()">📥 Baixar PDF</button>
          <button class="toolbar-btn toolbar-btn-secondary" onclick="window.print()">🖨️ Imprimir</button>
          <button class="toolbar-btn toolbar-btn-secondary" onclick="closeReportModal()">✕ Fechar</button>
        </div>
      </div>
      <div class="report-modal-body" id="reportModalBody"></div>
    </div>`;

  document.body.appendChild(backdrop);

  // Mover conteúdo do relatório para o modal
  const body = document.getElementById("reportModalBody");
  body.appendChild(rel);
  rel.style.display = "block";

  // Fechar ao clicar no backdrop
  backdrop.addEventListener("click", function(e) {
    if (e.target === backdrop) closeReportModal();
  });

  // Fechar com ESC
  document.addEventListener("keydown", _escHandler);
}

function _escHandler(e) {
  if (e.key === "Escape") closeReportModal();
}

function closeReportModal() {
  const modal = document.getElementById("reportModal");
  if (!modal) return;

  // Devolver o relatório para o main content (oculto)
  const rel = document.getElementById("relatorio");
  if (rel) {
    const main = document.querySelector(".main-content");
    if (main) { main.appendChild(rel); }
    rel.style.display = "none";
  }

  modal.remove();
  document.removeEventListener("keydown", _escHandler);
}

/* ═══════════════════════════════════
   CALCULAR — com loading + modal
   ═══════════════════════════════════ */
async function calcular(salvar) {
  try {
    const nome = (document.getElementById("nome")?.value || "").trim();
    const nasc = document.getElementById("dataNascimento")?.value;
    const apl = document.getElementById("dataAplicacao")?.value;
    const cpf = (document.getElementById("cpf")?.value || "").trim();
    const sexo = document.getElementById("sexo")?.value || "";
    const escolaridade = document.getElementById("escolaridade")?.value || "";

    const profNome = (document.getElementById("profNome")?.value || "").trim();
    const profCRP = (document.getElementById("profCRP")?.value || "").trim();
    const profEspecialidade = (document.getElementById("profEspecialidade")?.value || "").trim();
    const motivo = (document.getElementById("motivo")?.value || "").trim();
    const obsComportamentais = (document.getElementById("obsComportamentais")?.value || "").trim();
    const recomendacoes = (document.getElementById("recomendacoes")?.value || "").trim();

    if (!nome || !nasc || !apl) { alert("Preencha Nome, Nascimento e Aplicação."); return; }
    if (!cpf || !sexo || !escolaridade) { alert("Preencha CPF, sexo e escolaridade."); return; }
    if (!validarCPF(cpf)) { alert("CPF inválido. Verifique e tente novamente."); return; }

    const brutos = {};
    for (const s of SUBTESTES) {
      const v = document.getElementById(s.id)?.value;
      if (v !== "" && v != null) {
        const bruto = Number(v);
        if (Number.isNaN(bruto) || bruto < 0) { alert(`Valor inválido em ${s.nome}`); return; }
        brutos[s.codigo] = bruto;
      }
    }
    if (Object.keys(brutos).length === 0) { alert("Preencha ao menos um subteste."); return; }

    // ► LOADING
    showLoading(salvar ? "Salvando e gerando relatório..." : "Calculando resultados...");

    const API_URL = "https://equilibrium-api-yjxx.onrender.com/wais/calcular";
    const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nasc, apl, brutos }) });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Erro desconhecido.");

    const { idade, faixa, resultados, somas: somasAPI, compostos, indicesInfo: indicesInfoAPI, qiInfo } = data.resultado;

    // ► RECALCULO LOCAL: garante que todos os pontos ponderados sejam somados,
    //   incluindo suplementares quando disponíveis. Corrige erros de soma da API.
    const { somasRecalc, indicesRecalc } = recalcularSomasLocalmente(resultados, somasAPI, indicesInfoAPI);

    montarRelatorio({ nome, cpf, sexo, escolaridade, nasc, apl, idade, faixa, resultados,
      indicesInfo: indicesRecalc, qiInfo, somas: somasRecalc, compostos,
      profNome, profCRP, profEspecialidade, motivo, obsComportamentais, recomendacoes });

    if (salvar) {
      const rel = document.getElementById("relatorio");
      await esperarImagensCarregarem(rel);
      await new Promise(r => setTimeout(r, 150));
      const laudos = getLaudos();
      laudos.unshift({ nome, dataAplicacao: apl, faixa, createdAt: new Date().toISOString(), htmlRelatorio: rel.outerHTML,
        // Salva também somas recalculadas para referência
        somasRecalc, indicesRecalc });
      setLaudos(laudos);
    }

    // ► HIDE LOADING + OPEN MODAL
    hideLoading();

    if (salvar) {
      openReportModal();
      // Notifica que salvou — o botão "Imprimir" no modal fica disponível
      setTimeout(() => {
        const toolbar = document.querySelector(".toolbar-title");
        if (toolbar) toolbar.textContent = "📄 Relatório Gerado — Laudo salvo com sucesso!";
      }, 100);
    } else {
      openReportModal();
    }

  } catch (e) {
    hideLoading();
    console.error(e);
    alert(`Erro ao calcular: ${e.message}`);
  }
}

/* ═══════════════════════════════════
   HELPERS — Badges e Barras (sem Chart.js)
   ═══════════════════════════════════ */
function clBadgeClass(cl) {
  const m = {"Muito Superior":"cl-vs","Superior":"cl-s","Médio Superior":"cl-ms","Médio":"cl-m","Médio Inferior":"cl-mi","Limítrofe":"cl-l","Extremamente Baixo":"cl-eb","Inferior":"cl-inf"};
  return m[cl] || "cl-m";
}
function clBadge(cl) { return `<span class="cl-badge ${clBadgeClass(cl)}">${cl}</span>`; }

function barColor(p) {
  if (p >= 12) return "#1a56db";
  if (p >= 9) return "#3b82f6";
  if (p >= 7) return "#f59e0b";
  return "#dc2626";
}

function icColor(comp) {
  if (comp >= 110) return "#059669";
  if (comp >= 90) return "#1a56db";
  if (comp >= 80) return "#f59e0b";
  return "#dc2626";
}

function icScale(v) { return ((v - 40) / 130) * 100; }

const GRUPOS_WAIS = [
  { t: "Compreensão Verbal", codes: ["SM","VC","IN","CO"] },
  { t: "Organização Perceptual", codes: ["CB","CF","RM","AF"] },
  { t: "Memória Operacional", codes: ["AR","DG","SNL"] },
  { t: "Velocidade de Processamento", codes: ["CD","PS"] },
];

/* ═══════════════════════════════════
   RENDER: MATRIZ PB → PONDERADO
   ═══════════════════════════════════ */
function renderMatrizHTML(resultados, indicesInfo, somas) {
  const ordem = ["CF","VC","CD","SM","CB","AR","RM","DG","IN","AF","CO","PS","SNL","AO"];
  const flags = {
    verbal: new Set(somas?.QI_VERBAL?.usados || []), exec: new Set(somas?.QI_EXECUCAO?.usados || []),
    icv: new Set(indicesInfo?.ICV?.usados || []), iop: new Set(indicesInfo?.IOP?.usados || []),
    imo: new Set(indicesInfo?.IMO?.usados || []), ivp: new Set(indicesInfo?.IVP?.usados || []),
  };
  // Todos os possiveis (principal OU suplementar) que pertencem a cada grupo
  const possib = {
    verbal: new Set(["VC","SM","AR","DG","IN","CO","SNL"]), exec: new Set(["CF","CD","CB","RM","AF","PS","AO"]),
    icv: new Set(["SM","VC","IN","CO"]), iop: new Set(["CB","CF","RM","AF"]),
    imo: new Set(["AR","DG","SNL"]), ivp: new Set(["CD","PS"]),
  };
  const keys = ["verbal","exec","icv","iop","imo","ivp"];
  const labels = ["Verbal","Exec.","ICV","IOP","IMO","IVP"];

  function cell(code, key) {
    if (!possib[key].has(code)) return '<td class="fill"></td>';
    const v = resultados?.[code]?.ponderado;
    if (v == null) return '<td class="fill"></td>';
    const used = flags[key].has(code);
    return `<td class="ctr fill"><span class="pill${used ? '' : ' pill-sup'}">${used ? v : '(' + v + ')'}</span></td>`;
  }

  const rows = ordem.map((c, i) => {
    const r = resultados[c] || {};
    return `<tr${i % 2 ? ' class="alt"' : ''}>
      <td class="sub-name">${obterNomeSubteste(c)} <span>(${c})</span></td>
      <td class="ctr">${r.bruto ?? ""}</td>
      <td class="ctr" style="font-weight:700">${r.ponderado ?? ""}</td>
      ${keys.map(k => cell(c, k)).join("")}
    </tr>`;
  }).join("");

  // Somas calculadas localmente (recalcularSomasLocalmente já foi chamado antes)
  const somaVals = [
    somas?.QI_VERBAL?.soma,
    somas?.QI_EXECUCAO?.soma,
    indicesInfo?.ICV?.soma,
    indicesInfo?.IOP?.soma,
    indicesInfo?.IMO?.soma,
    indicesInfo?.IVP?.soma,
  ];

  // Subteste TODOS: soma geral de todos os ponderados disponíveis (para referência interna apenas)
  const somaGeralTodos = somas?._SOMA_TOTAL_GERAL?.soma;

  return `<div style="overflow-x:auto;border-radius:10px;border:1px solid #e2e8f0">
    <table class="rpt-matrix"><thead>
      <tr><th class="sub-name" rowspan="2">Subtestes</th><th class="ctr" rowspan="2" style="width:45px">PB</th><th class="ctr" rowspan="2" style="width:55px">Pond.</th><th class="ctr" colspan="6" style="border-bottom:1px solid rgba(59,130,246,.25)">Contribuição (Pontos Ponderados)</th></tr>
      <tr>${labels.map(l => `<th class="ctr" style="width:48px;font-size:9px">${l}</th>`).join("")}</tr>
    </thead><tbody>${rows}</tbody>
    <tfoot>
      <tr><td class="lbl" colspan="3">Soma dos Pontos Ponderados</td>${somaVals.map(v => `<td class="ctr">${v ?? "—"}</td>`).join("")}</tr>
    </tfoot>
    </table></div>`;
}

/* ═══════════════════════════════════
   RENDER: BARRAS HORIZONTAIS (perfil)
   ═══════════════════════════════════ */
function renderBarChart(resultados) {
  return GRUPOS_WAIS.map(g => {
    const bars = g.codes.map(code => {
      const r = resultados?.[code];
      const p = r?.ponderado != null ? +r.ponderado : 0;
      const cl = r?.classificacao || classByPonderado(p);
      const col = barColor(p);
      const avgL = ((9 / 19) * 100).toFixed(1);
      const avgW = ((2 / 19) * 100).toFixed(1);
      return `<div class="bar-row">
        <div class="bar-code">${code}</div>
        <div class="bar-track">
          <div class="bar-avg-zone" style="left:${avgL}%;width:${avgW}%"></div>
          <div class="bar-fill" style="width:${((p / 19) * 100).toFixed(1)}%;background:${col}"></div>
        </div>
        <div class="bar-val">${p}</div>
        <div class="bar-badge">${clBadge(cl)}</div>
      </div>`;
    }).join("");
    return `<div style="margin-bottom:${16}px" class="no-break"><div class="bar-group-title">${g.t}</div>${bars}</div>`;
  }).join("");
}

/* ═══════════════════════════════════
   RENDER: IC BAR CHART (índices)
   ═══════════════════════════════════ */
function renderICChart(compostos, somas) {
  const items = [
    { s: "QIV", k: "QI_VERBAL" }, { s: "QIE", k: "QI_EXECUCAO" }, { s: "QIT", k: "QI_TOTAL" },
    { s: "ICV", k: "ICV" }, { s: "IOP", k: "IOP" }, { s: "IMO", k: "IMO" }, { s: "IVP", k: "IVP" },
  ];

  const rows = items.map(x => {
    const c = compostos?.[x.k];
    if (!c?.composto) return "";
    const comp = +c.composto;
    const cl = classByComposite(comp);
    const col = icColor(comp);
    const ic = c.ic95 || [comp - 5, comp + 5];

    const gridLines = [60, 80, 100, 120, 140].map(v =>
      `<div class="ic-gridline" style="left:${icScale(v)}%;width:${v === 100 ? 2 : 1}px;background:${v === 100 ? 'rgba(100,116,139,.3)' : 'rgba(203,213,225,.3)'}"></div>`
    ).join("");

    return `<div class="ic-row">
      <div class="ic-label" style="color:${col}">${x.s}</div>
      <div class="ic-track">
        ${gridLines}
        <div class="ic-bar" style="left:${icScale(ic[0])}%;width:${icScale(ic[1]) - icScale(ic[0])}%;background:${col}30;border:1px solid ${col}40"></div>
        <div class="ic-whisker" style="left:${icScale(ic[0])}%;background:${col}60"></div>
        <div class="ic-whisker" style="left:${icScale(ic[1])}%;background:${col}60"></div>
        <div class="ic-dot" style="left:${icScale(comp)}%;background:${col};box-shadow:0 2px 6px ${col}50">${comp}</div>
      </div>
      <div class="ic-badge">${clBadge(cl)}</div>
    </div>`;
  }).join("");

  return `<div class="rpt-box no-break">
    <div class="ic-scale"><span>40</span><span>60</span><span>80</span><span style="font-weight:800;color:#475569">100</span><span>120</span><span>140</span><span>160</span></div>
    ${rows}
    <div class="ic-legend">Linha escura = média normativa (100) · Faixa colorida = IC 95% · Círculo = composto obtido</div>
  </div>`;
}

/* ═══════════════════════════════════
   MONTAR RELATÓRIO — DESIGN JSX
   ═══════════════════════════════════ */
function montarRelatorio(data) {
  const rel = document.getElementById("relatorio");
  if (!rel) return;

  const { nome, cpf, sexo, escolaridade, nasc, apl, idade, faixa, resultados, indicesInfo, qiInfo, compostos, somas,
    profNome, profCRP, profEspecialidade, motivo, obsComportamentais, recomendacoes } = data;

  const textoInterp = gerarTextoInterpretativo({ nome, compostos });
  const cpfTxt = formatarCPF(cpf);
  const discrepancias = calcularDiscrepancias(compostos);
  const { media, fortes, fracos } = calcularPontosFortesFracos(resultados);
  const dataHoje = new Date().toLocaleDateString("pt-BR");

  // Matriz, barras e IC chart (tudo HTML puro)
  const matrizHTML = renderMatrizHTML(resultados, indicesInfo, somas);
  const barsHTML = renderBarChart(resultados);
  const icHTML = renderICChart(compostos, somas);

  // Tabela de índices
  const idxItems = [["QIV","QI_VERBAL"],["QIE","QI_EXECUCAO"],["QIT","QI_TOTAL"],["ICV","ICV"],["IOP","IOP"],["IMO","IMO"],["IVP","IVP"]];
  const idxRows = idxItems.map(([rotulo, chave], i) => {
    // Para índices (ICV, IOP, IMO, IVP) a soma vem de indicesInfo; para QIs vem de somas
    const s = (chave === "ICV" || chave === "IOP" || chave === "IMO" || chave === "IVP")
      ? indicesInfo?.[chave]
      : somas?.[chave];
    const c = compostos?.[chave];
    const cl = c?.composto ? classByComposite(c.composto) : "—";
    const somaExibir = s?.soma ?? "—";
    return `<tr${i % 2 ? ' class="alt"' : ''}><td style="font-weight:700">${rotulo}</td><td class="ctr">${somaExibir}</td><td class="ctr" style="font-weight:800;font-size:15px;color:${icColor(c?.composto || 0)}">${c?.composto ?? "—"}</td><td class="ctr">${c?.percentil ?? "—"}</td><td class="ctr">${fmtIC(c?.ic90)}</td><td class="ctr">${fmtIC(c?.ic95)}</td><td>${clBadge(cl)}</td></tr>`;
  }).join("");

  // Tabela de detalhamento
  const detalheRows = Object.values(resultados).map((r, i) => {
    const p = +r.ponderado; const dev = p - media; const devAbs = Math.abs(dev);
    const devCol = dev >= 3 ? "#059669" : dev <= -3 ? "#dc2626" : "#94a3b8";
    const cl = r.classificacao || classByPonderado(p);
    const bg = devAbs >= 3 ? (dev > 0 ? "background:#d1fae580" : "background:#fee2e280") : (i % 2 ? 'background:#f8fafc' : '');
    return `<tr style="${bg}"><td style="font-weight:600">${r.nome} <span style="color:#94a3b8">(${r.codigo})</span></td><td class="ctr">${r.bruto}</td><td class="ctr" style="font-weight:700;font-size:14px">${r.ponderado}</td><td>${clBadge(cl)}</td><td class="ctr" style="font-weight:700;color:${devCol};font-size:12px">${dev >= 0 ? "+" : ""}${dev.toFixed(1)}</td></tr>`;
  }).join("");

  // Tabela de discrepâncias
  const discRows = discrepancias.map((d, i) => {
    const absD = Math.abs(d.diff);
    let bg = i % 2 ? '#f8fafc' : '#fff';
    let diffCol = '#334155';
    if (d.sig) { bg = '#fee2e2'; diffCol = '#dc2626'; }
    else if (absD >= 8) { bg = '#fef3c7'; diffCol = '#ea580c'; }
    return `<tr style="background:${bg}"><td style="font-weight:600">${d.par}</td><td class="ctr" style="font-weight:700">${d.va}</td><td class="ctr" style="font-weight:700">${d.vb}</td><td class="ctr" style="font-weight:800;color:${diffCol};font-size:14px">${d.diff > 0 ? "+" : ""}${d.diff}${absD >= 8 && !d.sig ? ' ⚠️' : ''}</td><td class="ctr">${d.vc}</td><td class="ctr"><span class="cl-badge ${d.sig ? 'cl-l' : 'cl-s'}">${d.sig ? "SIM" : "NÃO"}</span></td></tr>`;
  }).join("");

  // Fortes/fracos
  const fortesHtml = fortes.length === 0 ? '<div style="font-size:12px;opacity:.7">Nenhum desvio ≥3 positivo encontrado</div>' : fortes.map(s => `<div class="sw-item"><strong>${s.nome}</strong> <span style="color:#94a3b8">(${s.cod})</span><div style="font-size:11px;margin-top:2px">Ponderado: <strong>${s.p}</strong> · Desvio: <strong>+${(s.p - media).toFixed(1)}</strong> acima da média pessoal</div></div>`).join("");
  const fracosHtml = fracos.length === 0 ? '<div style="font-size:12px;opacity:.7">Nenhum desvio ≥3 negativo encontrado</div>' : fracos.map(s => `<div class="sw-item"><strong>${s.nome}</strong> <span style="color:#94a3b8">(${s.cod})</span><div style="font-size:11px;margin-top:2px">Ponderado: <strong>${s.p}</strong> · Desvio: <strong>${(s.p - media).toFixed(1)}</strong> abaixo da média pessoal</div></div>`).join("");

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
            <div class="title">WAIS-III</div>
            <div class="subtitle">Escala Wechsler de Inteligência para Adultos — 3ª Edição</div>
            <div class="sub2">Conversão PB → Ponderado e somatórios por índice</div>
          </div>
        </div>
        <div class="rpt-hdr-badge">
          <div class="lbl">Faixa Normativa</div>
          <div class="val">${faixa}</div>
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
      ${obsComportamentais ? `<div class="rpt-sh"><span class="num" style="background:#7c3aed">2</span><span class="sh-title">Observações Comportamentais</span><span class="sh-new">Novo</span></div><div class="rpt-box-obs no-break">${obsComportamentais}</div>` : ""}

      <!-- 3. CONVERSÃO PB → PONDERADO -->
      <div class="rpt-sh"><span class="num">3</span><span class="sh-title">Conversão PB → Ponderado e Contribuição nos Índices</span><div class="sh-sub">Células azuis = subtestes usados. Parênteses = suplementares.</div></div>
      <div class="no-break">${matrizHTML}</div>

      <!-- 4. PERFIL DOS SUBTESTES -->
      <div class="rpt-sh"><span class="num">4</span><span class="sh-title">Perfil dos Pontos Ponderados dos Subtestes</span><div class="sh-sub">Barras por domínio cognitivo. Faixa azul = média (9–11).</div></div>
      <div class="rpt-box no-break">${barsHTML}</div>

      <!-- 5. ÍNDICES E QI -->
      <div class="rpt-sh"><span class="num">5</span><span class="sh-title">Índices e QI Total</span><div class="sh-sub">Gráfico com intervalos de confiança (95%) e tabela completa.</div></div>
      ${icHTML}
      <div style="border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;margin-top:16px" class="no-break">
        <table class="rpt-tbl"><thead><tr><th>Escala</th><th class="ctr">Soma Pond.</th><th class="ctr">QI / Índice</th><th class="ctr">Rank Percentil</th><th class="ctr">IC 90%</th><th class="ctr">IC 95%</th><th>Classificação</th></tr></thead>
        <tbody>${idxRows}</tbody></table>
      </div>

      <!-- 6. DETALHAMENTO -->
      <div class="rpt-sh"><span class="num">6</span><span class="sh-title">Subtestes — Detalhamento</span></div>
      <div style="border-radius:10px;border:1px solid #e2e8f0;overflow:hidden" class="no-break">
        <table class="rpt-tbl"><thead><tr><th>Subteste</th><th class="ctr">PB</th><th class="ctr">Ponderado</th><th>Classificação</th><th class="ctr" title="Desvio da média pessoal">Desvio MP</th></tr></thead>
        <tbody>${detalheRows}</tbody>
        <tfoot><tr><td colspan="4">Média pessoal dos ponderados</td><td class="ctr" style="font-weight:800;color:#1e40af">${media.toFixed(1)}</td></tr></tfoot></table>
      </div>

      <!-- 7. DISCREPÂNCIAS -->
      <div class="rpt-sh"><span class="num" style="background:#7c3aed">7</span><span class="sh-title">Análise de Discrepâncias entre Índices</span><span class="sh-new">Novo</span><div class="sh-sub">Comparações pareadas com valores críticos (p < .05).</div></div>
      <div style="border-radius:10px;border:1px solid rgba(124,58,237,.2);overflow:hidden" class="no-break">
        <table class="rpt-tbl"><thead style="background:#ede9fe"><tr style="background:#ede9fe"><th style="color:#7c3aed;background:#ede9fe">Comparação</th><th class="ctr" style="color:#7c3aed;background:#ede9fe">Índice 1</th><th class="ctr" style="color:#7c3aed;background:#ede9fe">Índice 2</th><th class="ctr" style="color:#7c3aed;background:#ede9fe">Diferença</th><th class="ctr" style="color:#7c3aed;background:#ede9fe">Val. Crítico (.05)</th><th class="ctr" style="color:#7c3aed;background:#ede9fe">Significativo?</th></tr></thead>
        <tbody>${discRows}</tbody></table>
      </div>
      <div style="display:flex;gap:12px;margin-top:8px;font-size:10px;color:#64748b"><span>🟢 Não significativo</span><span>🟡 Notável (≥8)</span><span>🔴 Significativo (p < .05)</span></div>

      <!-- 8. FORTES / FRACOS -->
      <div class="rpt-sh"><span class="num" style="background:#7c3aed">8</span><span class="sh-title">Pontos Fortes e Fracos Pessoais</span><span class="sh-new">Novo</span><div class="sh-sub">Média pessoal: ${media.toFixed(1)} · Desvio ≥ 3 pontos = significativo</div></div>
      <div class="sw-row no-break">
        <div class="sw-card sw-strong"><h4><span style="font-size:16px">▲</span> Pontos Fortes</h4>${fortesHtml}</div>
        <div class="sw-card sw-weak"><h4><span style="font-size:16px">▼</span> Pontos Fracos</h4>${fracosHtml}</div>
      </div>

      <!-- 9. INTERPRETAÇÃO -->
      <div class="rpt-sh"><span class="num">9</span><span class="sh-title">Interpretação Clínica</span></div>
      <div class="rpt-interp">${textoInterp.split("\n\n").map(p => `<p>${p}</p>`).join("")}</div>

      <!-- 10. RECOMENDAÇÕES -->
      ${recomendacoes ? `<div class="rpt-sh"><span class="num" style="background:#7c3aed">10</span><span class="sh-title">Conclusão e Recomendações</span><span class="sh-new">Novo</span></div><div class="rpt-rec">${recomendacoes}</div>` : ""}

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
   LAUDOS / PRINT / INIT
   ═══════════════════════════════════ */
function renderListaLaudos() {
  const box = document.getElementById("listaLaudos");
  if (!box) return;
  const laudos = getLaudos();
  if (!laudos.length) { box.innerHTML = '<p class="muted">Nenhum laudo salvo ainda.</p>'; return; }
  box.innerHTML = '<table class="rpt-tbl"><thead><tr><th>Paciente</th><th>Aplicação</th><th>Faixa</th><th>Ações</th></tr></thead><tbody>' + laudos.map((x, idx) => '<tr><td>' + x.nome + '</td><td>' + x.dataAplicacao + '</td><td>' + x.faixa + '</td><td><button onclick="baixarPDFSalvo(' + idx + ')">PDF</button></td></tr>').join("") + '</tbody></table>';
}

async function esperarImagensCarregarem(container) {
  const imgs = Array.from(container.querySelectorAll("img"));
  await Promise.all(imgs.map(img => { if (img.complete && img.naturalWidth > 0) return Promise.resolve(); return new Promise(r => { img.onload = () => r(); img.onerror = () => r(); }); }));
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
  const nomeArquivo = 'WAIS-III_' + nome.replace(/\s+/g, '_').substring(0, 30) + '.pdf';

  showLoading("Gerando PDF...");

  // Esconde temporariamente o cabeçalho azul (rpt-hdr) antes de gerar o PDF
  const hdr = rel.querySelector('.rpt-hdr');
  if (hdr) hdr.style.display = 'none';

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
    // Restaura o cabeçalho na tela após gerar o PDF
    if (hdr) hdr.style.display = '';
    hideLoading();
  }
}

async function imprimirRelatorio() {
  window.print();
}

(function init() {
  if (document.getElementById("tbodySubtestes")) {
    montarInputsSubtestes();
    document.getElementById("dataNascimento")?.addEventListener("change", atualizarPreviewIdade);
    document.getElementById("dataAplicacao")?.addEventListener("change", atualizarPreviewIdade);
  }
  if (document.getElementById("listaLaudos")) renderListaLaudos();
})();

window.calcular = calcular;
window.imprimirRelatorio = imprimirRelatorio;
window.baixarPDF = baixarPDF;
window.baixarPDFSalvo = baixarPDFSalvo;
window.closeReportModal = closeReportModal;
window.openReportModal = openReportModal;