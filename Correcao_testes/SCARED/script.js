console.log("SCRIPT SCARED CARREGADO v1 — RELATÓRIO COMPLETO");
const LAUDOS_KEY = "empresa_laudos_scared";

/* ═══════════════════════════════════
   DEFINIÇÃO DOS 41 ITENS E SUBESCALAS
   ═══════════════════════════════════ */
const ITENS_SCARED = [
  { n: 1,  texto: "Quando sinto medo, tenho dificuldade para respirar.",               sub: "panico" },
  { n: 2,  texto: "Tenho dores de cabeça quando estou na escola.",                     sub: "escolar" },
  { n: 3,  texto: "Não gosto de estar com pessoas que não conheço bem.",               sub: "social" },
  { n: 4,  texto: "Fico assustado(a) se durmo fora de casa.",                          sub: "separacao" },
  { n: 5,  texto: "Preocupo-me se as outras pessoas gostam de mim.",                   sub: "generalizada" },
  { n: 6,  texto: "Quando sinto medo, sinto-me como se fosse desmaiar.",               sub: "panico" },
  { n: 7,  texto: "Sou uma pessoa nervosa.",                                            sub: "generalizada" },
  { n: 8,  texto: "Sigo os meus pais para todo o lugar onde eles vão.",                sub: "separacao" },
  { n: 9,  texto: "As pessoas dizem-me que pareço nervoso(a).",                        sub: "social" },
  { n: 10, texto: "Fico nervoso(a) com pessoas que não conheço bem.",                  sub: "panico" },
  { n: 11, texto: "Tenho dores de barriga quando estou na escola.",                    sub: "social" },
  { n: 12, texto: "Quando sinto medo, sinto-me como se estivesse a enlouquecer.",      sub: "escolar" },
  { n: 13, texto: "Preocupo-me em dormir sozinho(a).",                                 sub: "panico" },
  { n: 14, texto: "Preocupo-me em ser tão bom(boa) como as outras pessoas.",           sub: "separacao" },
  { n: 15, texto: "Quando sinto medo, sinto-me como se as coisas não fossem reais.",   sub: "generalizada" },
  { n: 16, texto: "Tenho pesadelos com coisas más que acontecem aos meus pais.",       sub: "panico" },
  { n: 17, texto: "Preocupo-me em ir para a escola.",                                  sub: "separacao" },
  { n: 18, texto: "Quando sinto medo, o meu coração bate muito depressa.",             sub: "escolar" },
  { n: 19, texto: "Sinto-me a tremer.",                                                 sub: "panico" },
  { n: 20, texto: "Tenho pesadelos com coisas más que me acontecem.",                  sub: "panico" },
  { n: 21, texto: "Preocupo-me com as coisas que vão acontecer.",                      sub: "separacao" },
  { n: 22, texto: "Quando sinto medo, começo a suar muito.",                           sub: "generalizada" },
  { n: 23, texto: "Sou uma pessoa que se preocupa muito.",                              sub: "panico" },
  { n: 24, texto: "Fico com muito medo sem razão nenhuma.",                            sub: "generalizada" },
  { n: 25, texto: "Tenho medo de estar sozinho(a) em casa.",                           sub: "panico" },
  { n: 26, texto: "Tenho dificuldade em falar com pessoas que não conheço bem.",       sub: "separacao" },
  { n: 27, texto: "Quando sinto medo, sinto como se estivesse a sufocar.",             sub: "social" },
  { n: 28, texto: "As pessoas dizem-me que me preocupo demasiado.",                    sub: "generalizada" },
  { n: 29, texto: "Não gosto de estar longe da minha família.",                        sub: "separacao" },
  { n: 30, texto: "Tenho ataques de medo sem razão nenhuma.",                          sub: "panico" },
  { n: 31, texto: "Preocupo-me que aconteça alguma coisa má aos meus pais.",           sub: "panico" },
  { n: 32, texto: "Sinto-me tímido(a) com pessoas que não conheço bem.",               sub: "separacao" },
  { n: 33, texto: "Preocupo-me com o que vai acontecer no futuro.",                    sub: "social" },
  { n: 34, texto: "Quando sinto medo, tenho vontade de vomitar.",                      sub: "generalizada" },
  { n: 35, texto: "Preocupo-me se faço as coisas bem.",                                sub: "panico" },
  { n: 36, texto: "Tenho medo de ir para a escola.",                                   sub: "generalizada" },
  { n: 37, texto: "Preocupo-me com coisas que já aconteceram.",                        sub: "escolar" },
  { n: 38, texto: "Quando sinto medo, sinto tonturas.",                                sub: "generalizada" },
  { n: 39, texto: "Fico nervoso(a) quando tenho de fazer qualquer coisa à frente de outras pessoas.", sub: "panico" },
  { n: 40, texto: "Fico nervoso(a) quando tenho de ir a festas, bailes ou a qualquer lugar onde haja pessoas que não conheço bem.", sub: "social" },
  { n: 41, texto: "Sou uma pessoa tímida.",                                             sub: "social" },
];

/* Mapeamento subescala → itens (itens que CONTRIBUEM para cada subescala — numeração 1-based) */
const SUBESCALAS = {
  panico:      { label: "Pânico / Somático",       itens: [1,6,9,12,15,18,19,22,24,27,30,34,38], corte: 7,  max: 26 },
  generalizada:{ label: "Ansiedade Generalizada",  itens: [5,7,14,21,23,28,33,35,37],            corte: 9,  max: 18 },
  separacao:   { label: "Ansiedade de Separação",  itens: [4,8,13,16,20,25,29,31],               corte: 5,  max: 16 },
  social:      { label: "Fobia Social",             itens: [3,10,26,32,39,40,41],                 corte: 8,  max: 14 },
  escolar:     { label: "Fobia Escolar",            itens: [2,11,17,36],                          corte: 3,  max: 8  },
};

/* Normas — Birmaher et al. 1999 / adaptação brasileira (estratificadas por faixa e sexo)
   Grupo "7-12" e "13-18", sexo "Masculino" e "Feminino"
   Ordem: [Total, Pânico, Generalizada, Separação, Social, Escolar]
*/
const NORMAS = {
  "7-12": {
    "Masculino":  { Total:{m:22.60,dp:10.45}, panico:{m:4.16,dp:3.80}, generalizada:{m:7.24,dp:3.57}, separacao:{m:4.98,dp:2.65}, social:{m:4.98,dp:2.83}, escolar:{m:1.24,dp:1.19} },
    "Feminino":   { Total:{m:26.55,dp:12.21}, panico:{m:5.36,dp:4.69}, generalizada:{m:8.03,dp:3.70}, separacao:{m:6.03,dp:3.22}, social:{m:5.74,dp:2.92}, escolar:{m:1.39,dp:1.30} },
  },
  "13-18": {
    "Masculino":  { Total:{m:19.73,dp:10.41}, panico:{m:3.29,dp:3.40}, generalizada:{m:7.51,dp:3.73}, separacao:{m:3.55,dp:2.36}, social:{m:4.43,dp:2.95}, escolar:{m:0.94,dp:1.14} },
    "Feminino":   { Total:{m:25.69,dp:12.17}, panico:{m:5.34,dp:4.58}, generalizada:{m:8.87,dp:3.78}, separacao:{m:4.78,dp:2.86}, social:{m:5.46,dp:3.20}, escolar:{m:1.24,dp:1.21} },
  },
};

/* Estado da aba ativa */
let tabAtiva = "crianca";

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

function faixaEtaria(idade) {
  if (!idade) return null;
  if (idade.anos >= 7 && idade.anos <= 12) return "7-12";
  if (idade.anos >= 13 && idade.anos <= 18) return "13-18";
  return null;
}

function formatarData(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/* CDF normal padrão (aproximação de Abramowitz & Stegun) */
function normCDF(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const pdf = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  const p = 1 - pdf * poly;
  return z >= 0 ? p : 1 - p;
}

function calcZScore(valor, media, dp) {
  if (!dp || dp === 0) return null;
  return (valor - media) / dp;
}

function calcPercentil(z) {
  if (z == null) return null;
  return Math.round(normCDF(z) * 100);
}

function classifRisco(soma, corte) {
  return soma >= corte ? "Risco Clínico" : "Não Clínico";
}

function badgeRisco(soma, corte) {
  const rc = soma >= corte;
  return rc
    ? `<span class="cl-badge cl-l">🔴 Risco Clínico</span>`
    : `<span class="cl-badge cl-s">✅ Não Clínico</span>`;
}

function getLaudos() { return JSON.parse(localStorage.getItem(LAUDOS_KEY) || "[]"); }
function setLaudos(arr) { localStorage.setItem(LAUDOS_KEY, JSON.stringify(arr)); }

/* ═══════════════════════════════════
   INICIALIZAÇÃO DA TABELA DE ITENS
   ═══════════════════════════════════ */
// Armazena respostas de cada aba ao alternar
const _respostasSaved = { c: {}, p: {} };

function _salvarRespostasAtuais() {
  const prefixo = tabAtiva === "pais" ? "p" : "c";
  ITENS_SCARED.forEach(item => {
    const el = document.getElementById(`${prefixo}_${item.n}`);
    if (el) _respostasSaved[prefixo][item.n] = el.value;
  });
}

function renderTabelaItens() {
  const tbody = document.getElementById("tbodyItens");
  if (!tbody) return;

  const corSub = {
    panico:      "#dbeafe",
    generalizada:"#d1fae5",
    separacao:   "#fef3c7",
    social:      "#fce7f3",
    escolar:     "#ede9fe",
  };

  const prefixo = tabAtiva === "pais" ? "p" : "c";
  const saved = _respostasSaved[prefixo];

  tbody.innerHTML = ITENS_SCARED.map(item => {
    const bg = corSub[item.sub] || "#fff";
    const val = saved[item.n] || "";
    return `<tr style="background:${bg}15">
      <td style="font-weight:700;color:#64748b;font-size:12px">${item.n}</td>
      <td style="font-size:12px">${item.texto}</td>
      <td class="center">
        <select id="${prefixo}_${item.n}" style="width:56px;padding:5px 4px;border-radius:8px;border:1px solid #e2e8f0;font-size:13px;font-weight:600;text-align:center;font-family:inherit;outline:none;">
          <option value="" ${val === "" ? "selected" : ""}>—</option>
          <option value="0" ${val === "0" ? "selected" : ""}>0</option>
          <option value="1" ${val === "1" ? "selected" : ""}>1</option>
          <option value="2" ${val === "2" ? "selected" : ""}>2</option>
        </select>
      </td>
    </tr>`;
  }).join("");
}

function alternarTab(tab) {
  _salvarRespostasAtuais();
  tabAtiva = tab;
  document.getElementById("tabCrianca").className = "tab-btn" + (tab === "crianca" ? " tab-active" : "");
  document.getElementById("tabPais").className = "tab-btn" + (tab === "pais" ? " tab-active" : "");
  renderTabelaItens();
}

function insertObs(text) {
  const ta = document.getElementById("obsComportamentais");
  if (!ta) return;
  ta.value += (ta.value ? ". " : "") + text;
  ta.focus();
}
window.insertObs = insertObs;
window.alternarTab = alternarTab;

/* ═══════════════════════════════════
   CÁLCULO DAS SUBESCALAS
   ═══════════════════════════════════ */
function calcularSubescalas(prefixo) {
  const result = {};
  let totalSoma = 0;

  for (const [key, sub] of Object.entries(SUBESCALAS)) {
    let soma = 0;
    let nenhumRespondido = true;
    for (const n of sub.itens) {
      const el = document.getElementById(`${prefixo}_${n}`);
      if (el && el.value !== "") {
        soma += parseInt(el.value, 10);
        nenhumRespondido = false;
      }
    }
    if (nenhumRespondido) {
      result[key] = null;
    } else {
      result[key] = soma;
      totalSoma += soma;
    }
  }

  const algumRespondido = Object.values(result).some(v => v !== null);
  result.total = algumRespondido ? totalSoma : null;
  return result;
}

function atualizarIdade() {
  const nasc = document.getElementById("dataNascimento")?.value;
  const apl = document.getElementById("dataAplicacao")?.value;
  const idade = calcularIdade(nasc, apl);
  const faixa = faixaEtaria(idade);
  const idadeEl = document.getElementById("idadeCalculada");
  const faixaEl = document.getElementById("faixaCalculada");
  if (idadeEl) idadeEl.textContent = idade ? `Idade calculada: ${idade.anos} anos e ${idade.meses} meses` : "";
  if (faixaEl) faixaEl.textContent = faixa ? `Faixa normativa: ${faixa} anos` : (idade ? "⚠️ Fora da faixa normativa do SCARED (7–18 anos)" : "");
}
window.atualizarIdade = atualizarIdade;

/* ═══════════════════════════════════
   FUNÇÃO PRINCIPAL: CALCULAR
   ═══════════════════════════════════ */
function showLoading(msg) {
  let ov = document.getElementById("scaredLoading");
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "scaredLoading";
    ov.className = "loading-overlay";
    document.body.appendChild(ov);
  }
  ov.innerHTML = `<div class="loading-card"><div class="loading-spinner"></div><div class="loading-title">${msg || "Processando..."}</div><div class="loading-sub">Aguarde</div></div>`;
  ov.style.display = "flex";
}
function hideLoading() {
  const ov = document.getElementById("scaredLoading");
  if (ov) ov.style.display = "none";
}

function calcular(salvar) {
  const nome = document.getElementById("nome")?.value?.trim() || "";
  const nasc = document.getElementById("dataNascimento")?.value || "";
  const apl  = document.getElementById("dataAplicacao")?.value  || "";
  const sexo = document.getElementById("sexo")?.value || "";
  const escolaridade = document.getElementById("escolaridade")?.value || "";
  const respondente  = document.getElementById("respondente")?.value || "";
  const profNome = document.getElementById("profNome")?.value?.trim() || "";
  const profCRP  = document.getElementById("profCRP")?.value?.trim() || "";
  const profEspecialidade = document.getElementById("profEspecialidade")?.value?.trim() || "";
  const motivo = document.getElementById("motivo")?.value?.trim() || "";
  const obsComportamentais = document.getElementById("obsComportamentais")?.value?.trim() || "";
  const recomendacoes = document.getElementById("recomendacoes")?.value?.trim() || "";

  if (!nome) { alert("Informe o nome do avaliado."); return; }
  if (!nasc) { alert("Informe a data de nascimento."); return; }
  if (!apl)  { alert("Informe a data de aplicação."); return; }
  if (!sexo || (sexo !== "Masculino" && sexo !== "Feminino")) {
    alert("Informe o sexo (Masculino ou Feminino) para o cálculo das normas.");
    return;
  }

  // Salvar respostas da aba actual antes de calcular
  _salvarRespostasAtuais();

  const idade = calcularIdade(nasc, apl);
  const faixa = faixaEtaria(idade);
  const sexoNorm = sexo;

  // Reconstruir inputs de ambas as abas para leitura pelo cálculo
  // Criar inputs temporários para a aba que não está visível
  const outroPrefixo = tabAtiva === "pais" ? "c" : "p";
  const outroSaved = _respostasSaved[outroPrefixo];
  const tempInputs = [];
  ITENS_SCARED.forEach(item => {
    const val = outroSaved[item.n];
    if (val !== undefined && val !== "") {
      const inp = document.createElement("input");
      inp.type = "hidden";
      inp.id = `${outroPrefixo}_${item.n}`;
      inp.value = val;
      document.body.appendChild(inp);
      tempInputs.push(inp);
    }
  });

  // Calcular subescalas
  const crianca = calcularSubescalas("c");
  const pais    = calcularSubescalas("p");

  // Remover inputs temporários
  tempInputs.forEach(inp => inp.remove());

  // Normas para Z-score
  let normas = null;
  if (faixa && sexoNorm && NORMAS[faixa] && NORMAS[faixa][sexoNorm]) {
    normas = NORMAS[faixa][sexoNorm];
  }

  const data = {
    nome, nasc, apl, sexo, escolaridade, respondente,
    idade, faixa, normas, crianca, pais,
    profNome, profCRP, profEspecialidade, motivo, obsComportamentais, recomendacoes,
    temHetero: pais.total != null,
  };

  montarRelatorio(data, salvar);
}
window.calcular = calcular;

/* ═══════════════════════════════════
   GRÁFICO DE BARRAS HORIZONTAIS (subescalas)
   ═══════════════════════════════════ */
function renderBarrasSubescalas(crianca, pais, temHetero) {
  const maxVals = { panico: 26, generalizada: 18, separacao: 16, social: 14, escolar: 8 };
  const cortes  = { panico: 7,  generalizada: 9,  separacao: 5,  social: 8,  escolar: 3 };
  const cores   = {
    panico:       "#3b82f6",
    generalizada: "#10b981",
    separacao:    "#f59e0b",
    social:       "#ec4899",
    escolar:      "#8b5cf6",
  };

  let html = `<div style="font-size:10px;color:#94a3b8;margin-bottom:6px;padding-left:155px;display:flex;justify-content:space-between"><span>0</span><span>Max</span></div>`;

  for (const [key, sub] of Object.entries(SUBESCALAS)) {
    const maxV = maxVals[key];
    const corte = cortes[key];
    const cor = cores[key];
    const vcrianca = crianca[key];
    const vpais = pais[key];

    const pctCorte = (corte / maxV) * 100;

    function barra(val, label) {
      if (val == null) return `<div class="bar-row"><span class="bar-code" style="width:40px;text-align:right;font-weight:700;font-size:11px">${label}</span><div class="bar-track" style="flex:1;margin:0 6px;height:18px;background:#e2e8f0;border-radius:4px;position:relative"><span style="position:absolute;top:50%;left:6px;transform:translateY(-50%);font-size:10px;color:#94a3b8">—</span></div></div>`;
      const pct = Math.min((val / maxV) * 100, 100);
      const rc = val >= corte;
      const barCor = rc ? "#dc2626" : cor;
      return `<div class="bar-row">
        <span class="bar-code" style="width:40px;text-align:right;font-weight:700;font-size:11px;color:#64748b">${label}</span>
        <div class="bar-track" style="flex:1;margin:0 6px;height:18px;background:#e2e8f0;border-radius:4px;position:relative;overflow:visible;">
          <div style="position:absolute;top:0;bottom:0;left:${pctCorte}%;width:1px;background:rgba(220,38,38,.3);z-index:1"></div>
          <div style="position:absolute;left:0;top:2px;bottom:2px;width:${pct}%;background:${barCor};border-radius:3px;transition:width .3s;z-index:2"></div>
        </div>
        <span style="width:28px;font-size:12px;font-weight:800;color:#0f172a">${val}</span>
        <span style="width:30px">${rc ? '<span style="font-size:10px">🔴</span>' : '<span style="font-size:10px">✅</span>'}</span>
      </div>`;
    }

    html += `<div style="margin-bottom:8px">
      <div style="font-size:9px;font-weight:800;color:#1e40af;text-transform:uppercase;letter-spacing:.8px;margin-bottom:2px;padding-left:48px">${sub.label} <span style="color:#94a3b8;font-weight:400">(corte≥${corte}, max${maxV})</span></div>
      ${barra(vcrianca, "C")}
      ${temHetero ? barra(vpais, "P") : ""}
    </div>`;
  }

  // Total
  const maxTotal = 82;
  const corteTotal = 25;
  function barraTotal(val, label) {
    if (val == null) return "";
    const pct = Math.min((val / maxTotal) * 100, 100);
    const rc = val >= corteTotal;
    return `<div class="bar-row">
      <span class="bar-code" style="width:40px;text-align:right;font-weight:800;font-size:12px;color:#1e40af">${label}</span>
      <div class="bar-track" style="flex:1;margin:0 6px;height:22px;background:#e2e8f0;border-radius:4px;position:relative;overflow:visible">
        <div style="position:absolute;top:0;bottom:0;left:${(corteTotal/maxTotal)*100}%;width:1px;background:rgba(220,38,38,.3);z-index:1"></div>
        <div style="position:absolute;left:0;top:2px;bottom:2px;width:${pct}%;background:${rc?"#dc2626":"#1a56db"};border-radius:3px;z-index:2"></div>
      </div>
      <span style="width:28px;font-size:13px;font-weight:800;color:#0f172a">${val}</span>
      <span style="width:30px">${rc ? '<span style="font-size:11px">🔴</span>' : '<span style="font-size:11px">✅</span>'}</span>
    </div>`;
  }
  html += `<div style="margin-top:6px;border-top:1px solid #e2e8f0;padding-top:6px">
    <div style="font-size:9px;font-weight:800;color:#1e40af;text-transform:uppercase;letter-spacing:.8px;margin-bottom:2px;padding-left:48px">PONTUAÇÃO TOTAL <span style="color:#94a3b8;font-weight:400">(corte≥25, max82)</span></div>
    ${barraTotal(crianca.total, "C")}
    ${temHetero ? barraTotal(pais.total, "P") : ""}
  </div>`;

  return `<div style="padding:4px 0">${html}</div>`;
}

/* ═══════════════════════════════════
   TABELA DE RESULTADOS COM Z-SCORE
   ═══════════════════════════════════ */
function renderTabelaResultados(crianca, pais, normas, temHetero) {
  const subOrder = ["panico","generalizada","separacao","social","escolar"];

  function zeRow(key, soma, normas, i) {
    if (soma == null) return `<tr${i%2?' class="alt"':''}><td style="font-weight:700">${SUBESCALAS[key].label}</td><td class="ctr">—</td><td class="ctr">—</td><td class="ctr">—</td><td>—</td></tr>`;
    const sub = SUBESCALAS[key];
    const norm = normas?.[key];
    let z = null, pct = null;
    if (norm) { z = calcZScore(soma, norm.m, norm.dp); pct = calcPercentil(z); }
    const rc = soma >= sub.corte;
    const badge = rc
      ? `<span class="cl-badge cl-l">🔴 Risco Clínico</span>`
      : `<span class="cl-badge cl-s">✅ Não Clínico</span>`;
    const zStr = z != null ? z.toFixed(2) : "—";
    const pctStr = pct != null ? `${pct}%` : "—";
    return `<tr${i%2?' class="alt"':''}><td style="font-weight:700">${sub.label}</td><td class="ctr" style="font-weight:800">${soma}</td><td class="ctr">${zStr}</td><td class="ctr">${pctStr}</td><td>${badge}</td></tr>`;
  }

  function totalRow(soma, normas) {
    if (soma == null) return `<tr><td style="font-weight:800;color:#1e40af">TOTAL</td><td class="ctr">—</td><td class="ctr">—</td><td class="ctr">—</td><td>—</td></tr>`;
    const norm = normas?.Total;
    let z = null, pct = null;
    if (norm) { z = calcZScore(soma, norm.m, norm.dp); pct = calcPercentil(z); }
    const rc = soma >= 25;
    const badge = rc
      ? `<span class="cl-badge cl-l">🔴 Risco Clínico</span>`
      : `<span class="cl-badge cl-s">✅ Não Clínico</span>`;
    return `<tr style="background:#dbeafe"><td style="font-weight:800;color:#1e40af">TOTAL</td><td class="ctr" style="font-weight:900;font-size:15px;color:#1e40af">${soma}</td><td class="ctr" style="font-weight:700">${z!=null?z.toFixed(2):"—"}</td><td class="ctr" style="font-weight:700">${pct!=null?pct+"%":"—"}</td><td>${badge}</td></tr>`;
  }

  function buildTable(scores, titulo) {
    const rows = subOrder.map((k,i) => zeRow(k, scores[k], normas, i)).join("") + totalRow(scores.total, normas);
    return `<div style="margin-bottom:${temHetero?12:0}px">
      ${titulo ? `<div style="font-size:11px;font-weight:800;color:#1e40af;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">${titulo}</div>` : ""}
      <div style="border-radius:10px;border:1px solid #e2e8f0;overflow:hidden">
        <table class="rpt-tbl">
          <thead><tr>
            <th>Subescala</th>
            <th class="ctr">Pontuação</th>
            <th class="ctr">Z-Score</th>
            <th class="ctr">Percentil</th>
            <th>Classificação</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
  }

  let html = buildTable(crianca, temHetero ? "👦 Autorrelato (Criança)" : "");
  if (temHetero) html += buildTable(pais, "👨‍👩 Heterorelato (Pais/Responsável)");
  return html;
}

/* ═══════════════════════════════════
   COMPARATIVO AUTO vs HETERO
   ═══════════════════════════════════ */
function renderComparativo(crianca, pais) {
  const subOrder = ["panico","generalizada","separacao","social","escolar","total"];
  const labels = {...Object.fromEntries(Object.entries(SUBESCALAS).map(([k,v])=>[k,v.label])), total:"TOTAL"};

  const rows = subOrder.map((key, i) => {
    const vc = crianca[key]; const vp = pais[key];
    if (vc == null && vp == null) return "";
    const diff = (vc != null && vp != null) ? vc - vp : null;
    const absDiff = diff != null ? Math.abs(diff) : 0;
    let bgDiff = "#94a3b8";
    if (diff != null) bgDiff = absDiff >= 4 ? "#dc2626" : absDiff >= 2 ? "#f59e0b" : "#059669";
    return `<tr${i%2?' class="alt"':''}>
      <td style="font-weight:700">${labels[key]}</td>
      <td class="ctr" style="font-weight:700">${vc ?? "—"}</td>
      <td class="ctr" style="font-weight:700">${vp ?? "—"}</td>
      <td class="ctr" style="font-weight:800;color:${bgDiff}">${diff != null ? (diff > 0 ? "+"+diff : diff) : "—"}</td>
    </tr>`;
  }).join("");

  return `<div style="border-radius:10px;border:1px solid #e2e8f0;overflow:hidden">
    <table class="rpt-tbl">
      <thead><tr>
        <th>Subescala</th>
        <th class="ctr">Criança</th>
        <th class="ctr">Pais</th>
        <th class="ctr">Diferença</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <div style="font-size:10px;color:#64748b;margin-top:6px;display:flex;gap:12px">
    <span style="color:#059669">● Concordância (≤1)</span>
    <span style="color:#f59e0b">● Discrepância moderada (2–3)</span>
    <span style="color:#dc2626">● Discrepância importante (≥4)</span>
  </div>`;
}

/* ═══════════════════════════════════
   TEXTO INTERPRETATIVO AUTOMÁTICO
   ═══════════════════════════════════ */
function gerarTextoInterpretativo({ nome, crianca, normas, faixa, sexo, temHetero, pais }) {
  const primeiro = nome.split(" ")[0] || nome;
  const subOrder = ["panico","generalizada","separacao","social","escolar"];
  const total = crianca.total;
  const totalRC = total != null && total >= 25;

  let texto = `O SCARED (Screen for Child Anxiety Related Emotional Disorders) foi aplicado como instrumento de rastreio de sintomas ansiosos. `;

  if (total != null) {
    const normTotal = normas?.Total;
    let zStr = "";
    if (normTotal) {
      const z = calcZScore(total, normTotal.m, normTotal.dp);
      const pct = calcPercentil(z);
      zStr = ` (Z = ${z.toFixed(2)}; percentil ${pct}${faixa && sexo ? `, norma ${faixa} anos, ${sexo}` : ""})`;
    }
    texto += `No autorrelato, ${primeiro} obteve pontuação total de ${total} pontos${zStr}. `;
    if (totalRC) {
      texto += `Esse escore supera o ponto de corte clínico (≥25), indicando rastreio positivo para transtorno de ansiedade, o que requer investigação diagnóstica complementar. `;
    } else {
      texto += `Esse escore está abaixo do ponto de corte clínico (≥25), não configurando rastreio positivo para transtorno de ansiedade no momento da avaliação. `;
    }
  }

  // Subescalas
  const subRC = subOrder.filter(k => crianca[k] != null && crianca[k] >= SUBESCALAS[k].corte);
  const subNRC = subOrder.filter(k => crianca[k] != null && crianca[k] < SUBESCALAS[k].corte);

  if (subRC.length > 0) {
    texto += `As subescalas com pontuação acima do ponto de corte foram: ${subRC.map(k => `${SUBESCALAS[k].label} (${crianca[k]} pontos; corte≥${SUBESCALAS[k].corte})`).join(", ")}. `;
    texto += `Esses resultados sugerem presença de sintomas clinicamente significativos nessas dimensões, exigindo avaliação diagnóstica individualizada. `;
  }

  if (subNRC.length > 0 && subRC.length > 0) {
    texto += `Não foram identificados escores acima do ponto de corte nas subescalas: ${subNRC.map(k => SUBESCALAS[k].label).join(", ")}. `;
  }

  if (subRC.length === 0 && total != null) {
    texto += `Nenhuma subescala atingiu o ponto de corte clínico no autorrelato. `;
  }

  // Heterorelato
  if (temHetero && pais.total != null) {
    const paisTotalRC = pais.total >= 25;
    texto += `\n\nNo heterorelato (pais/responsável), a pontuação total registrada foi de ${pais.total} pontos. `;
    texto += paisTotalRC
      ? `Esse escore supera o ponto de corte (≥25), convergindo com os dados do autorrelato quanto à presença de sintomas ansiosos significativos. `
      : `Esse escore está abaixo do ponto de corte (≥25). `;

    const subRCpais = subOrder.filter(k => pais[k] != null && pais[k] >= SUBESCALAS[k].corte);
    if (subRCpais.length > 0) {
      texto += `No relato dos responsáveis, as subescalas com pontuação acima do corte foram: ${subRCpais.map(k => `${SUBESCALAS[k].label} (${pais[k]} pontos)`).join(", ")}. `;
    }

    // Divergência
    const divs = subOrder.filter(k => crianca[k] != null && pais[k] != null && Math.abs(crianca[k] - pais[k]) >= 4);
    if (divs.length > 0) {
      texto += `Destaca-se divergência expressiva (≥4 pontos) entre auto e heterorelato nas subescalas: ${divs.map(k => SUBESCALAS[k].label).join(", ")}, o que pode refletir diferenças de percepção entre o avaliado e seus responsáveis, merecendo investigação clínica aprofundada. `;
    }
  }

  texto += `\n\nOs resultados do SCARED devem ser interpretados de forma integrada com os demais dados clínicos, histórico de desenvolvimento, observações comportamentais e outros instrumentos aplicados. O instrumento possui função exclusivamente de rastreio, não sendo suficiente para estabelecer diagnóstico por si só.`;

  return texto;
}

/* ═══════════════════════════════════
   MONTAR RELATÓRIO — DESIGN JSX
   ═══════════════════════════════════ */
function montarRelatorio(data, salvar) {
  const rel = document.getElementById("relatorio");
  if (!rel) return;

  const { nome, nasc, apl, sexo, escolaridade, respondente, idade, faixa, normas,
    crianca, pais, profNome, profCRP, profEspecialidade, motivo, obsComportamentais,
    recomendacoes, temHetero } = data;

  const textoInterp = gerarTextoInterpretativo({ nome, crianca, normas, faixa, sexo, temHetero, pais });
  const dataHoje = new Date().toLocaleDateString("pt-BR");

  const barrasHTML  = renderBarrasSubescalas(crianca, pais, temHetero);
  const tabelaHTML  = renderTabelaResultados(crianca, pais, normas, temHetero);
  const compHTML    = temHetero ? renderComparativo(crianca, pais) : "";

  const idadeStr = idade ? `${idade.anos}a ${idade.meses}m` : "—";
  const faixaStr = faixa ? `${faixa} anos` : "—";

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
            <div class="title">SCARED</div>
            <div class="subtitle">Screen for Child Anxiety Related Emotional Disorders</div>
            <div class="sub2">Rastreio de Ansiedade — Autorrelato e Heterorelato · 7–18 anos</div>
          </div>
        </div>
        <div class="rpt-hdr-badge">
          <div class="lbl">Faixa Normativa</div>
          <div class="val">${faixaStr}</div>
          <div class="sub">Idade: ${idadeStr}</div>
        </div>
      </div>
    </div>

    <div class="rpt-body">
      <!-- 1. IDENTIFICAÇÃO -->
      <div class="rpt-sh"><span class="num">1</span><span class="sh-title">Identificação</span></div>
      <div class="rpt-box no-break">
        <div class="rpt-info">
          <div><span class="lbl">Nome:</span> <span class="val bold">${nome}</span></div>
          <div><span class="lbl">Sexo:</span> <span class="val">${sexo || "—"}</span></div>
          <div><span class="lbl">Escolaridade:</span> <span class="val">${escolaridade || "—"}</span></div>
          <div><span class="lbl">Nascimento:</span> <span class="val">${formatarData(nasc)}${idade ? ` (${idadeStr})` : ""}</span></div>
          <div><span class="lbl">Aplicação:</span> <span class="val">${formatarData(apl)}</span></div>
          <div><span class="lbl">Respondente Heterorelato:</span> <span class="val">${respondente || "—"}</span></div>
        </div>
        ${profNome ? `<div class="rpt-info sep"></div><div class="rpt-info"><div><span class="lbl" style="color:#1a56db">Profissional:</span> <span class="val bold">${profNome}${profCRP ? ` — ${profCRP}` : ""}</span></div><div><span class="lbl" style="color:#1a56db">Especialidade:</span> <span class="val">${profEspecialidade || "—"}</span></div></div>` : ""}
        ${motivo ? `<div class="rpt-info sep"></div><div><span class="lbl" style="color:#1a56db">Motivo do encaminhamento:</span> <span class="val">${motivo}</span></div>` : ""}
      </div>

      <!-- 2. OBSERVAÇÕES -->
      ${obsComportamentais ? `<div class="rpt-sh"><span class="num" style="background:#7c3aed">2</span><span class="sh-title">Observações Comportamentais</span><span class="sh-new">Reg.</span></div><div class="rpt-box-obs no-break">${obsComportamentais}</div>` : ""}

      <!-- 3. PERFIL DE SUBESCALAS (BARRAS) -->
      <div class="rpt-sh"><span class="num">3</span><span class="sh-title">Perfil das Subescalas</span><div class="sh-sub">C = Criança (autorrelato) · P = Pais (heterorelato) · Linha vermelha = ponto de corte clínico</div></div>
      <div class="rpt-box no-break">${barrasHTML}</div>

      <!-- 4. RESULTADOS COM Z-SCORE E PERCENTIL -->
      <div class="rpt-sh"><span class="num">4</span><span class="sh-title">Resultados por Subescala</span><div class="sh-sub">${normas ? `Normas: ${faixaStr}, ${sexo} · Z-Score e percentil calculados` : "Normas não disponíveis para o sexo/faixa informados — Z-Score e percentil não calculados"}</div></div>
      <div class="no-break">${tabelaHTML}</div>

      <!-- 5. COMPARATIVO AUTO vs HETERO (somente se heterorelato) -->
      ${temHetero ? `<div class="rpt-sh"><span class="num" style="background:#7c3aed">5</span><span class="sh-title">Comparativo: Autorrelato vs Heterorelato</span><span class="sh-new">Comparação</span></div><div class="no-break">${compHTML}</div>` : ""}

      <!-- 6. INTERPRETAÇÃO -->
      <div class="rpt-sh"><span class="num">${temHetero?6:5}</span><span class="sh-title">Interpretação Clínica</span></div>
      <div class="rpt-interp">${textoInterp.split("\n\n").map(p => `<p>${p}</p>`).join("")}</div>

      <!-- 7. RECOMENDAÇÕES -->
      ${recomendacoes ? `<div class="rpt-sh"><span class="num" style="background:#7c3aed">${temHetero?7:6}</span><span class="sh-title">Conclusão e Recomendações</span><span class="sh-new">Novo</span></div><div class="rpt-rec">${recomendacoes}</div>` : ""}

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

  // Salvar
  if (salvar) {
    const laudos = getLaudos();
    laudos.unshift({
      nome,
      dataAplicacao: formatarData(apl),
      faixa: faixaStr,
      htmlRelatorio: rel.innerHTML,
      ts: Date.now(),
    });
    setLaudos(laudos);
  }

  // Modal de visualização
  abrirModal(rel);
}

/* ═══════════════════════════════════
   MODAL DE RELATÓRIO
   ═══════════════════════════════════ */
function abrirModal(rel) {
  let backdrop = document.getElementById("reportModal");
  if (backdrop) backdrop.remove();

  backdrop = document.createElement("div");
  backdrop.id = "reportModal";
  backdrop.className = "report-modal-backdrop";
  backdrop.innerHTML = `
    <div class="report-modal">
      <div class="report-modal-toolbar no-print">
        <span class="toolbar-title">Relatório SCARED</span>
        <div class="toolbar-actions">
          <button class="toolbar-btn toolbar-btn-primary" onclick="baixarPDF()">⬇️ Baixar PDF</button>
          <button class="toolbar-btn toolbar-btn-secondary" onclick="window.print()">🖨️ Imprimir</button>
          <button class="toolbar-btn toolbar-btn-voltar" onclick="fecharModal()">✕ Fechar</button>
        </div>
      </div>
      <div class="report-modal-body" id="reportModalBody"></div>
    </div>`;
  document.body.appendChild(backdrop);

  const body = document.getElementById("reportModalBody");
  if (body) body.appendChild(rel.cloneNode(true));
}

function fecharModal() {
  const m = document.getElementById("reportModal");
  if (m) m.remove();
}
window.fecharModal = fecharModal;

/* ═══════════════════════════════════
   PDF
   ═══════════════════════════════════ */
async function esperarImagensCarregarem(container) {
  const imgs = Array.from(container.querySelectorAll("img"));
  await Promise.all(imgs.map(img => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise(r => { img.onload = () => r(); img.onerror = () => r(); });
  }));
}

async function baixarPDF() {
  const rel = document.getElementById("relatorio");
  if (!rel) return;
  await esperarImagensCarregarem(rel);
  const nome = rel.querySelector(".val.bold")?.textContent || "Relatorio";
  const nomeArquivo = "SCARED_" + nome.replace(/\s+/g, "_").substring(0, 30) + ".pdf";

  showLoading("Gerando PDF...");

  const decos = rel.querySelectorAll(".deco1, .deco2");
  const badge = rel.querySelector(".rpt-hdr-badge");
  const reportEl = rel.querySelector(".report");
  decos.forEach(d => d.style.display = "none");
  if (badge) badge.style.backdropFilter = "none";
  if (reportEl) reportEl.style.overflow = "visible";

  try {
    await html2pdf().set({
      margin: [5, 5, 5, 5],
      filename: nomeArquivo,
      image: { type: "jpeg", quality: 1.00 },
      html2canvas: { scale: 4, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: "mm", format: [210, 900], orientation: "portrait" },
      pagebreak: { mode: ["avoid-all"] },
    }).from(rel).save();
  } finally {
    decos.forEach(d => d.style.display = "");
    if (badge) badge.style.backdropFilter = "";
    if (reportEl) reportEl.style.overflow = "";
    hideLoading();
  }
}
window.baixarPDF = baixarPDF;

/* ═══════════════════════════════════
   LISTA DE LAUDOS SALVOS
   ═══════════════════════════════════ */
function renderListaLaudos() {
  const box = document.getElementById("listaLaudos");
  if (!box) return;
  const laudos = getLaudos();
  if (!laudos.length) {
    box.innerHTML = '<p class="muted">Nenhum laudo salvo ainda.</p>';
    return;
  }
  box.innerHTML = `<table class="rpt-tbl">
    <thead><tr><th>Paciente</th><th>Aplicação</th><th>Faixa</th><th>Ações</th></tr></thead>
    <tbody>${laudos.map((x, idx) => `<tr>
      <td>${x.nome}</td>
      <td>${x.dataAplicacao}</td>
      <td>${x.faixa}</td>
      <td><button onclick="baixarPDFSalvo(${idx})" style="padding:4px 12px;border-radius:8px;border:none;background:#1a56db;color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">PDF</button>
      <button onclick="excluirLaudo(${idx})" style="margin-left:4px;padding:4px 10px;border-radius:8px;border:none;background:#fee2e2;color:#dc2626;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Excluir</button></td>
    </tr>`).join("")}</tbody>
  </table>`;
}
window.renderListaLaudos = renderListaLaudos;

async function baixarPDFSalvo(index) {
  const item = getLaudos()[index];
  if (!item) return alert("Laudo não encontrado.");
  const temp = document.createElement("div");
  temp.innerHTML = item.htmlRelatorio;
  document.body.appendChild(temp);
  showLoading("Gerando PDF...");
  await esperarImagensCarregarem(temp);
  await new Promise(r => setTimeout(r, 150));
  const nome = item.nome || "Relatorio";
  try {
    await html2pdf().set({
      margin: [5, 5, 5, 5],
      filename: "SCARED_" + nome.replace(/\s+/g, "_").substring(0, 30) + ".pdf",
      image: { type: "jpeg", quality: 1.00 },
      html2canvas: { scale: 4, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: "mm", format: [210, 900], orientation: "portrait" },
      pagebreak: { mode: ["avoid-all"] },
    }).from(temp).save();
  } finally {
    temp.remove();
    hideLoading();
  }
}
window.baixarPDFSalvo = baixarPDFSalvo;

function excluirLaudo(index) {
  if (!confirm("Excluir este laudo?")) return;
  const laudos = getLaudos();
  laudos.splice(index, 1);
  setLaudos(laudos);
  renderListaLaudos();
}
window.excluirLaudo = excluirLaudo;

/* ═══════════════════════════════════
   INICIALIZAÇÃO
   ═══════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  renderTabelaItens();
  const hoje = new Date().toISOString().split("T")[0];
  const aplEl = document.getElementById("dataAplicacao");
  if (aplEl && !aplEl.value) aplEl.value = hoje;
});
