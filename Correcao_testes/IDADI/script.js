console.log("SCRIPT IDADI CARREGADO v1.0");
const LAUDOS_KEY = "empresa_laudos_idadi";

/* ═══════════════════════════════════
   ESTADO GLOBAL
   ═══════════════════════════════════ */
let IDADI_DATA = null;        // JSON com todos os itens
let idadeMeses = null;        // Idade calculada em meses
let faixaAtual = null;        // Faixa etária detectada
let currentDomainIdx = 0;     // Índice do domínio ativo nas abas
let respostas = {};           // { "COG_1": "sim"|"av"|"nao", ... }

/* ═══════════════════════════════════
   DOMÍNIOS — CONFIGURAÇÃO
   ═══════════════════════════════════ */
const DOMINIOS_CONFIG = [
  { id: "COG",  emoji: "🧠", nome: "Cognitivo",         cor: "#1a56db" },
  { id: "SE",   emoji: "💛", nome: "Socioemocional",     cor: "#7c3aed" },
  { id: "CLR",  emoji: "👂", nome: "Ling. Receptiva",    cor: "#0891b2" },
  { id: "CLE",  emoji: "🗣️", nome: "Ling. Expressiva",  cor: "#059669" },
  { id: "MA",   emoji: "🏃", nome: "Motricidade Ampla",  cor: "#dc2626" },
  { id: "MF",   emoji: "✋", nome: "Motricidade Fina",   cor: "#d97706" },
  { id: "CA",   emoji: "🎯", nome: "Comp. Adaptativo",   cor: "#be185d" },
];

/* ═══════════════════════════════════
   FAIXA ETÁRIA
   ═══════════════════════════════════ */
const FAIXAS_ORDEM = [
  "4-5","6-8","9-11","12-14","15-17","18-20","18-23",
  "21-23","21-29","24-26","24-29","27-29","30-32","30-35","33-35",
  "36-41","42-47","48-53","54-59","60-65","60-72","66-72"
];

/**
 * Detecta a faixa etária de um domínio para uma idade em meses.
 * Percorre as faixas do domínio e encontra a que cobre a idade.
 */
function detectarFaixa(dominioFaixas, meses) {
  for (const [faixa, range] of Object.entries(dominioFaixas)) {
    const [min, max] = faixa.split("-").map(Number);
    if (meses >= min && meses <= max) return faixa;
  }
  return null;
}

/**
 * Retorna label amigável da faixa etária global.
 */
function faixaLabel(meses) {
  if (meses < 4)  return "Abaixo de 4 meses";
  if (meses <= 5)  return "4-5 meses";
  if (meses <= 8)  return "6-8 meses";
  if (meses <= 11) return "9-11 meses";
  if (meses <= 14) return "12-14 meses";
  if (meses <= 17) return "15-17 meses";
  if (meses <= 23) return "18-23 meses";
  if (meses <= 26) return "24-26 meses";
  if (meses <= 29) return "27-29 meses";
  if (meses <= 35) return "30-35 meses";
  if (meses <= 41) return "36-41 meses";
  if (meses <= 47) return "42-47 meses";
  if (meses <= 53) return "48-53 meses";
  if (meses <= 59) return "54-59 meses";
  if (meses <= 65) return "60-65 meses";
  if (meses <= 72) return "66-72 meses";
  return "Acima de 72 meses";
}

function volumeLabel(meses) {
  if (meses <= 35) return "📋 Caderno Vol. 2 (4-35 meses)";
  return "📋 Caderno Vol. 3 (36-72 meses)";
}

/* ═══════════════════════════════════
   CÁLCULO DE IDADE
   ═══════════════════════════════════ */
function calcularIdade(nascISO, aplISO) {
  if (!nascISO || !aplISO) return null;
  const n = new Date(nascISO + "T12:00:00");
  const a = new Date(aplISO  + "T12:00:00");
  if (isNaN(n.getTime()) || isNaN(a.getTime()) || a < n) return null;
  let anos = a.getFullYear() - n.getFullYear();
  let meses = a.getMonth() - n.getMonth();
  if (a.getDate() < n.getDate()) meses -= 1;
  if (meses < 0) { anos -= 1; meses += 12; }
  const totalMeses = anos * 12 + meses;
  return { anos, meses, totalMeses };
}

function formatarData(iso) {
  if (!iso) return "—";
  const [y,m,d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/* ═══════════════════════════════════
   INICIALIZAÇÃO
   ═══════════════════════════════════ */
async function initIDadi() {
  try {
    const resp = await fetch("/Correcao_testes/IDADI/data/idadi_items.json");
    IDADI_DATA = await resp.json();
    console.log("IDADI data carregado:", IDADI_DATA.dominios.length, "domínios");
  } catch(e) {
    console.error("Erro ao carregar idadi_items.json:", e);
    alert("Erro ao carregar dados do IDADI. Verifique o arquivo JSON.");
  }
}

/* ═══════════════════════════════════
   PREVIEW DE IDADE / FAIXA
   ═══════════════════════════════════ */
function atualizarPreviewIdade() {
  const nasc = document.getElementById("dataNascimento")?.value;
  const apl  = document.getElementById("dataAplicacao")?.value;
  const preview = document.getElementById("idadePreview");
  const ageText  = document.getElementById("ageText");
  const faixaText = document.getElementById("faixaText");
  const volumeText = document.getElementById("volumeText");
  const cardQ = document.getElementById("cardQuestionario");
  const cardPh = document.getElementById("cardPlaceholder");

  if (!nasc || !apl) {
    preview.style.display = "none";
    if (cardQ) cardQ.style.display = "none";
    if (cardPh) cardPh.style.display = "block";
    return;
  }

  const idade = calcularIdade(nasc, apl);
  if (!idade || idade.totalMeses < 4) {
    ageText.textContent = "Datas inválidas ou idade abaixo de 4 meses.";
    faixaText.textContent = "";
    volumeText.textContent = "";
    preview.style.display = "block";
    if (cardQ) cardQ.style.display = "none";
    if (cardPh) cardPh.style.display = "block";
    return;
  }

  idadeMeses = idade.totalMeses;
  faixaAtual = faixaLabel(idadeMeses);

  ageText.textContent = `Idade na aplicação: ${idade.anos} ano(s) e ${idade.meses} mês(es) — ${idadeMeses} meses`;
  faixaText.textContent = `Faixa etária: ${faixaAtual}`;
  volumeText.textContent = volumeLabel(idadeMeses);
  preview.style.display = "block";

  const subtitleEl = document.getElementById("questSubtitle");
  if (subtitleEl) subtitleEl.textContent = `Faixa etária: ${faixaAtual} · Itens por domínio definidos automaticamente`;

  // Monta o questionário
  if (IDADI_DATA) {
    montarQuestionario();
    if (cardQ) cardQ.style.display = "block";
    if (cardPh) cardPh.style.display = "none";
  }
}

/* ═══════════════════════════════════
   MONTAR QUESTIONÁRIO
   ═══════════════════════════════════ */
function montarQuestionario() {
  currentDomainIdx = 0;
  respostas = {};
  montarTabs();
  renderDomainContent(0);
}

function getDominioData(domId) {
  return IDADI_DATA.dominios.find(d => d.id === domId);
}

function getItensFaixa(domId) {
  const dom = getDominioData(domId);
  if (!dom) return [];
  const faixa = detectarFaixa(dom.faixas, idadeMeses);
  if (!faixa) return [];
  const { inicio, fim } = dom.faixas[faixa];
  return dom.itens.filter(it => it.num >= inicio && it.num <= fim);
}

function montarTabs() {
  const tabs = document.getElementById("domainTabs");
  if (!tabs) return;
  tabs.innerHTML = DOMINIOS_CONFIG.map((d, i) => {
    const itens = getItensFaixa(d.id);
    return `
      <button class="idadi-tab ${i === 0 ? 'active' : ''}"
        id="tab_${d.id}"
        onclick="switchDomain(${i})"
        style="${i === 0 ? `background:${d.cor}` : ''}">
        ${d.emoji} ${d.nome}
        <span class="tab-count" style="${i === 0 ? '' : 'background:rgba(0,0,0,.08);color:#64748b'}">${itens.length}</span>
      </button>`;
  }).join("");
}

function switchDomain(idx) {
  // Salvar respostas visíveis antes de trocar
  currentDomainIdx = idx;
  DOMINIOS_CONFIG.forEach((d, i) => {
    const tab = document.getElementById(`tab_${d.id}`);
    if (!tab) return;
    if (i === idx) {
      tab.classList.add("active");
      tab.style.background = d.cor;
      tab.style.color = "#fff";
      const cnt = tab.querySelector(".tab-count");
      if (cnt) { cnt.style.background = "rgba(255,255,255,.35)"; cnt.style.color = "#fff"; }
    } else {
      tab.classList.remove("active");
      tab.style.background = "#f1f5f9";
      tab.style.color = "#64748b";
      const cnt = tab.querySelector(".tab-count");
      if (cnt) { cnt.style.background = "rgba(0,0,0,.08)"; cnt.style.color = "#64748b"; }
    }
  });
  renderDomainContent(idx);
  updateNavButtons();
}

function renderDomainContent(idx) {
  const d = DOMINIOS_CONFIG[idx];
  const itens = getItensFaixa(d.id);
  const content = document.getElementById("domainContent");
  if (!content) return;

  if (itens.length === 0) {
    content.innerHTML = `<div class="idadi-domain-block">
      <div style="text-align:center;padding:24px;color:#94a3b8;">
        <div style="font-size:24px;margin-bottom:6px;">—</div>
        <div style="font-size:13px;">Nenhum item encontrado para esta faixa etária neste domínio.</div>
      </div>
    </div>`;
    return;
  }

  const domData = getDominioData(d.id);
  const faixa = detectarFaixa(domData.faixas, idadeMeses);
  const { inicio, fim } = domData.faixas[faixa];

  let rows = "";
  itens.forEach(it => {
    const key = `${d.id}_${it.num}`;
    const r = respostas[key] || "";
    rows += `
      <tr>
        <td class="idadi-item-num">${it.num}</td>
        <td class="idadi-item-texto">${it.texto}</td>
        <td class="idadi-item-resp">
          <div class="idadi-radio-group">
            <label class="idadi-radio-label">
              <input type="radio" name="${key}" value="sim" ${r === "sim" ? "checked" : ""} onchange="registrarResposta('${key}','sim')">
              <span class="idadi-radio-pill sim">Sim</span>
            </label>
            <label class="idadi-radio-label">
              <input type="radio" name="${key}" value="av" ${r === "av" ? "checked" : ""} onchange="registrarResposta('${key}','av')">
              <span class="idadi-radio-pill av">Às vezes</span>
            </label>
            <label class="idadi-radio-label">
              <input type="radio" name="${key}" value="nao" ${r === "nao" ? "checked" : ""} onchange="registrarResposta('${key}','nao')">
              <span class="idadi-radio-pill nao">Ainda não</span>
            </label>
          </div>
        </td>
      </tr>`;
  });

  content.innerHTML = `
    <div class="idadi-domain-block">
      <div class="idadi-domain-header" style="background:${d.cor};">
        <div class="idadi-domain-icon">${d.emoji}</div>
        <div>
          <div class="idadi-domain-title">${domData.nome}</div>
          <div class="idadi-domain-range">${domData.descricao} · Itens ${inicio} a ${fim}</div>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table class="idadi-item-table">
          <thead>
            <tr>
              <th style="width:40px">Nº</th>
              <th>Item</th>
              <th class="ctr" style="width:260px">Resposta</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function registrarResposta(key, valor) {
  respostas[key] = valor;
}

function updateNavButtons() {
  const prev = document.getElementById("btnPrevDomain");
  const next = document.getElementById("btnNextDomain");
  const counter = document.getElementById("domainCounter");
  if (prev) prev.disabled = (currentDomainIdx === 0);
  if (next) {
    const isLast = currentDomainIdx === DOMINIOS_CONFIG.length - 1;
    next.textContent = isLast ? "✅ Finalizar" : "Próximo →";
  }
  if (counter) counter.textContent = `Domínio ${currentDomainIdx + 1} de ${DOMINIOS_CONFIG.length}`;
}

function prevDomain() {
  if (currentDomainIdx > 0) switchDomain(currentDomainIdx - 1);
}

function nextDomain() {
  if (currentDomainIdx < DOMINIOS_CONFIG.length - 1) {
    switchDomain(currentDomainIdx + 1);
  } else {
    // Último domínio: scroll até ações
    document.querySelector(".form-card:last-of-type")?.scrollIntoView({ behavior: "smooth" });
  }
}

/* ═══════════════════════════════════
   PONTUAÇÃO
   ═══════════════════════════════════ */
function calcularScore(domId) {
  const itens = getItensFaixa(domId);
  const maxScore = itens.length * 2;
  let rawScore = 0;
  let respondidos = 0;

  itens.forEach(it => {
    const key = `${domId}_${it.num}`;
    const r = respostas[key];
    if (r === "sim")  { rawScore += 2; respondidos++; }
    else if (r === "av") { rawScore += 1; respondidos++; }
    else if (r === "nao") { respondidos++; }
  });

  const pct = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;
  return { rawScore, maxScore, pct, respondidos, total: itens.length, itens };
}

/* ═══════════════════════════════════
   LOADING / MODAL
   ═══════════════════════════════════ */
function showLoading(msg) {
  const overlay = document.createElement("div");
  overlay.id = "loadingOverlay";
  overlay.className = "loading-overlay";
  overlay.innerHTML = `<div class="loading-card">
    <div class="loading-spinner"></div>
    <div class="loading-title">${msg || "Gerando relatório..."}</div>
    <div class="loading-sub">Calculando pontuações por domínio</div>
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
        <div class="toolbar-title">📄 Relatório IDADI</div>
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

  backdrop.addEventListener("click", e => { if (e.target === backdrop) closeReportModal(); });
  document.addEventListener("keydown", _escHandler);
}

function _escHandler(e) { if (e.key === "Escape") closeReportModal(); }

function closeReportModal() {
  const modal = document.getElementById("reportModal");
  if (!modal) return;
  const rel = document.getElementById("relatorio");
  if (rel) {
    const main = document.querySelector(".main-content");
    if (main) main.appendChild(rel);
    rel.style.display = "none";
  }
  modal.remove();
  document.removeEventListener("keydown", _escHandler);
}

async function baixarPDF() {
  const el = document.getElementById("reportModalBody") || document.getElementById("relatorio");
  if (!el) return;
  const opt = {
    margin: [10,12], filename: 'IDADI_Laudo.pdf',
    image: { type: 'jpeg', quality: .92 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  await html2pdf().set(opt).from(el).save();
}

/* ═══════════════════════════════════
   CALCULAR E MONTAR RELATÓRIO
   ═══════════════════════════════════ */
async function calcular(salvar) {
  const nomeCrianca = (document.getElementById("nomeCrianca")?.value || "").trim();
  const nasc = document.getElementById("dataNascimento")?.value;
  const apl  = document.getElementById("dataAplicacao")?.value;
  const sexo = document.getElementById("sexo")?.value || "";
  const nomeInformante = (document.getElementById("nomeInformante")?.value || "").trim();
  const parentesco = document.getElementById("parentesco")?.value || "";
  const profNome = (document.getElementById("profNome")?.value || "").trim();
  const profCRP  = (document.getElementById("profCRP")?.value || "").trim();
  const profEspecialidade = (document.getElementById("profEspecialidade")?.value || "").trim();
  const motivo = (document.getElementById("motivo")?.value || "").trim();
  const obsComportamentais = (document.getElementById("obsComportamentais")?.value || "").trim();
  const recomendacoes = (document.getElementById("recomendacoes")?.value || "").trim();

  if (!nomeCrianca || !nasc || !apl) {
    alert("Preencha o nome da criança, data de nascimento e data de aplicação.");
    return;
  }
  if (!idadeMeses) {
    alert("Verifique as datas inseridas.");
    return;
  }

  // Verificar se há respostas suficientes
  const totalRespostas = Object.keys(respostas).length;
  if (totalRespostas === 0) {
    alert("Preencha pelo menos um domínio antes de calcular.");
    return;
  }

  showLoading(salvar ? "Salvando e gerando relatório..." : "Calculando resultados...");

  await new Promise(r => setTimeout(r, 400));

  try {
    // Calcular scores por domínio
    const scores = {};
    DOMINIOS_CONFIG.forEach(d => {
      scores[d.id] = calcularScore(d.id);
    });

    montarRelatorio({
      nomeCrianca, nasc, apl, sexo, idadeMeses, faixaAtual,
      nomeInformante, parentesco,
      profNome, profCRP, profEspecialidade,
      motivo, obsComportamentais, recomendacoes,
      scores
    });

    hideLoading();

    if (salvar) {
      const rel = document.getElementById("relatorio");
      const laudos = getLaudos();
      laudos.unshift({
        nomeCrianca, dataAplicacao: apl, idadeMeses, faixa: faixaAtual,
        createdAt: new Date().toISOString(),
        htmlRelatorio: rel.outerHTML,
        scores
      });
      setLaudos(laudos);

      // Salvar no Firebase via Integration
      if (window.Integration) {
        const resumoScores = DOMINIOS_CONFIG.map(d => {
          const s = scores[d.id];
          return `${d.nome}: ${s.rawScore}/${s.maxScore} (${s.pct}%)`;
        }).join("; ");
        await Integration.salvarTesteNoFirebase("idadi", {
          dataAplicacao: apl,
          resumo: `IDADI — ${faixaAtual} — ${resumoScores}`,
          scores,
          classificacao: "",
          observacoes: obsComportamentais,
          htmlRelatorio: rel.outerHTML
        });
      }
    }

    openReportModal();
  } catch(e) {
    hideLoading();
    console.error(e);
    alert("Erro ao gerar relatório: " + e.message);
  }
}

function getLaudos()       { try { return JSON.parse(localStorage.getItem(LAUDOS_KEY) || "[]"); } catch(e) { return []; } }
function setLaudos(arr)    { localStorage.setItem(LAUDOS_KEY, JSON.stringify(arr)); }

function voltarParaPaciente() {
  let pac = null;
  try { pac = JSON.parse(sessionStorage.getItem("pacienteAtual")); } catch(e) {}
  if (pac?.id) location.href = `/Pacientes/ficha.html?id=${pac.id}`;
}

/* ═══════════════════════════════════
   CORES E CLASSIFICAÇÃO
   ═══════════════════════════════════ */
function getBarColor(pct, domCor) {
  // Usa cor do domínio mas ajusta intensidade
  return domCor;
}

function pctLabel(pct) {
  if (pct >= 80) return { txt: "Desempenho Esperado",   cls: "cl-s"  };
  if (pct >= 60) return { txt: "Limítrofe",              cls: "cl-ms" };
  if (pct >= 40) return { txt: "Abaixo do Esperado",     cls: "cl-mi" };
  return               { txt: "Muito Abaixo do Esperado", cls: "cl-l"  };
}

/* ═══════════════════════════════════
   MONTAR RELATÓRIO HTML
   ═══════════════════════════════════ */
function montarRelatorio(dados) {
  const {
    nomeCrianca, nasc, apl, sexo, idadeMeses, faixaAtual,
    nomeInformante, parentesco,
    profNome, profCRP, profEspecialidade,
    motivo, obsComportamentais, recomendacoes,
    scores
  } = dados;

  const rel = document.getElementById("relatorio");
  if (!rel) return;

  const anosMeses = idadeMeses >= 12
    ? `${Math.floor(idadeMeses/12)} ano(s) e ${idadeMeses % 12} mês(es)`
    : `${idadeMeses} meses`;

  /* — Perfil horizontal — */
  let perfil = "";
  DOMINIOS_CONFIG.forEach(d => {
    const s = scores[d.id];
    if (s.total === 0) return;
    const corBar = d.cor;
    const label = s.respondidos > 0 ? pctLabel(s.pct) : { txt: "Não respondido", cls: "cl-l" };
    perfil += `
      <div class="idadi-profile-bar">
        <div class="idadi-pb-label">${d.emoji} ${d.nome}</div>
        <div class="idadi-pb-track">
          <div class="idadi-pb-fill" style="width:${s.pct}%;background:${corBar};"></div>
        </div>
        <div class="idadi-pb-pct">${s.pct}%</div>
        <div class="idadi-pb-raw">${s.rawScore}/${s.maxScore}</div>
      </div>`;
  });

  /* — Tabela resumo por domínio — */
  let tblResumo = `
    <table class="rpt-tbl" style="margin-top:10px;">
      <thead><tr>
        <th>Domínio</th>
        <th class="ctr">Itens</th>
        <th class="ctr">Respondidos</th>
        <th class="ctr">Pontuação</th>
        <th class="ctr">Máximo</th>
        <th class="ctr">% Atingido</th>
        <th class="ctr">Situação</th>
      </tr></thead>
      <tbody>`;
  DOMINIOS_CONFIG.forEach((d, i) => {
    const s = scores[d.id];
    if (s.total === 0) return;
    const lab = s.respondidos > 0 ? pctLabel(s.pct) : { txt: "—", cls: "" };
    tblResumo += `
      <tr class="${i%2===0?'alt':''}">
        <td><b>${d.emoji} ${d.nome}</b></td>
        <td class="ctr">${s.total}</td>
        <td class="ctr">${s.respondidos}</td>
        <td class="ctr"><b>${s.rawScore}</b></td>
        <td class="ctr">${s.maxScore}</td>
        <td class="ctr"><b>${s.pct}%</b></td>
        <td class="ctr"><span class="cl-badge ${lab.cls}">${lab.txt}</span></td>
      </tr>`;
  });
  tblResumo += `</tbody></table>`;

  /* — Seções detalhadas por domínio — */
  let detalhes = "";
  DOMINIOS_CONFIG.forEach((d, domI) => {
    const s = scores[d.id];
    if (s.total === 0 || s.respondidos === 0) return;

    // Itens com "Ainda não" (possíveis alvos de intervenção)
    const naoAlcancados = s.itens.filter(it => {
      const key = `${d.id}_${it.num}`;
      return respostas[key] === "nao";
    });
    const avItens = s.itens.filter(it => {
      const key = `${d.id}_${it.num}`;
      return respostas[key] === "av";
    });

    let domRows = "";
    s.itens.forEach(it => {
      const key = `${d.id}_${it.num}`;
      const r = respostas[key];
      let badgeHtml = `<span class="idadi-r-no">N/R</span>`;
      if (r === "sim")  badgeHtml = `<span class="idadi-r-sim">✓ Sim</span>`;
      if (r === "av")   badgeHtml = `<span class="idadi-r-av">~ Às vezes</span>`;
      if (r === "nao")  badgeHtml = `<span class="idadi-r-nao">✗ Ainda não</span>`;
      domRows += `<tr><td style="font-size:10px;color:#94a3b8;text-align:center;width:32px;">${it.num}</td>
        <td style="font-size:11px;color:#334155;line-height:1.4;">${it.texto}</td>
        <td style="text-align:center;">${badgeHtml}</td></tr>`;
    });

    detalhes += `
      <div class="no-break" style="margin-top:8px;">
        <div class="rpt-sh">
          <span class="num" style="background:${d.cor};">${domI+1}</span>
          <div>
            <div class="sh-title">${d.emoji} ${d.nome}</div>
            <div class="sh-sub">${s.rawScore}/${s.maxScore} pts (${s.pct}%) · ${s.respondidos}/${s.total} itens respondidos</div>
          </div>
        </div>
        <table class="rpt-tbl">
          <thead><tr>
            <th style="width:32px;" class="ctr">Nº</th>
            <th>Item</th>
            <th class="ctr" style="width:110px;">Resposta</th>
          </tr></thead>
          <tbody>${domRows}</tbody>
        </table>
        ${naoAlcancados.length > 0 || avItens.length > 0 ? `
        <div class="rpt-box-obs" style="margin-top:6px;">
          <b>🎯 Habilidades em desenvolvimento (Às vezes):</b>
          ${avItens.length > 0
            ? `<ul style="margin:4px 0 6px 16px;padding:0;">${avItens.map(it=>`<li style="font-size:11px;">${it.texto}</li>`).join("")}</ul>`
            : `<span style="color:#94a3b8;font-size:11px;"> nenhum</span>`}
          <b>🔴 Habilidades ainda não adquiridas:</b>
          ${naoAlcancados.length > 0
            ? `<ul style="margin:4px 0 0 16px;padding:0;">${naoAlcancados.map(it=>`<li style="font-size:11px;">${it.texto}</li>`).join("")}</ul>`
            : `<span style="color:#94a3b8;font-size:11px;"> nenhuma</span>`}
        </div>` : ""}
      </div>`;
  });

  /* — HTML completo do relatório — */
  rel.innerHTML = `
    <div class="rpt-hdr">
      <div class="deco1"></div><div class="deco2"></div>
      <div class="rpt-hdr-inner">
        <div>
          <div class="kicker">Equilibrium Neuropsicologia</div>
          <div class="title">IDADI</div>
          <div class="subtitle">Inventário Dimensional de Avaliação do Desenvolvimento Infantil</div>
          <div class="sub2">Silva, Mendonça Filho &amp; Bandeira (2020) · Vetor Editora</div>
        </div>
        <div class="rpt-hdr-badge">
          <div class="lbl">Faixa Etária</div>
          <div class="val" style="font-size:13px;">${faixaAtual}</div>
          <div class="sub">${idadeMeses} meses</div>
        </div>
      </div>
    </div>

    <div class="rpt-body">

      <!-- Seção 1: Identificação -->
      <div class="rpt-sh">
        <span class="num">1</span>
        <div class="sh-title">Identificação</div>
      </div>
      <div class="rpt-box">
        <div class="rpt-info">
          <div><div class="lbl">Criança</div><div class="val bold">${nomeCrianca || "—"}</div></div>
          <div><div class="lbl">Sexo</div><div class="val">${sexo || "—"}</div></div>
          <div><div class="lbl">Data de Nascimento</div><div class="val">${formatarData(nasc)}</div></div>
          <div><div class="lbl">Data de Aplicação</div><div class="val">${formatarData(apl)}</div></div>
          <div><div class="lbl">Idade na Aplicação</div><div class="val bold">${anosMeses} (${idadeMeses} meses)</div></div>
          <div><div class="lbl">Faixa Etária IDADI</div><div class="val bold">${faixaAtual}</div></div>
          <div class="sep"></div>
          <div><div class="lbl">Informante</div><div class="val">${nomeInformante || "—"}</div></div>
          <div><div class="lbl">Parentesco / Relação</div><div class="val">${parentesco || "—"}</div></div>
          ${profNome ? `<div class="sep"></div>
          <div><div class="lbl">Profissional Aplicador</div><div class="val bold">${profNome}</div></div>
          <div><div class="lbl">CRP</div><div class="val">${profCRP || "—"}</div></div>
          <div><div class="lbl">Especialidade</div><div class="val">${profEspecialidade || "—"}</div></div>` : ""}
        </div>
      </div>

      ${motivo ? `
      <!-- Seção 2: Motivo -->
      <div class="rpt-sh"><span class="num">2</span><div class="sh-title">Motivo do Encaminhamento</div></div>
      <div class="rpt-box-obs">${motivo}</div>` : ""}

      <!-- Seção 3: Perfil de Desenvolvimento -->
      <div class="rpt-sh">
        <span class="num">3</span>
        <div>
          <div class="sh-title">Perfil de Desenvolvimento</div>
          <div class="sh-sub">Pontuação por domínio — Sim=2, Às vezes=1, Ainda não=0</div>
        </div>
      </div>
      <div class="rpt-box" style="padding:14px 18px;">
        ${perfil}
        <div style="font-size:9px;color:#94a3b8;margin-top:6px;text-align:center;">
          ⚠️ Classificação provisória por percentual atingido. Aguardando tabelas normativas para escore-z e percentil.
        </div>
      </div>
      ${tblResumo}

      <!-- Seção 4: Detalhamento por Domínio -->
      <div class="rpt-sh">
        <span class="num">4</span>
        <div class="sh-title">Detalhamento por Domínio</div>
      </div>
      ${detalhes}

      <!-- Seção 5: Observações -->
      ${obsComportamentais ? `
      <div class="rpt-sh"><span class="num">5</span><div class="sh-title">Observações Comportamentais / Contexto de Coleta</div></div>
      <div class="rpt-box-obs">${obsComportamentais}</div>` : ""}

      <!-- Seção 6: Recomendações -->
      ${recomendacoes ? `
      <div class="rpt-sh"><span class="num">6</span><div class="sh-title">Conclusão e Recomendações</div></div>
      <div class="rpt-box-obs">${recomendacoes}</div>` : ""}

      <!-- Rodapé -->
      <div class="rpt-foot">
        <div>
          ${profNome ? `<div class="sign-line">${profNome}${profCRP ? ` — ${profCRP}` : ""}${profEspecialidade ? `<br>${profEspecialidade}` : ""}</div>` : ""}
          <div class="rpt-foot-disclaimer">Documento gerado por Equilibrium Neuropsicologia. Classificações provisórias até integração de tabelas normativas.</div>
        </div>
        <div class="rpt-foot-right">
          <div style="font-size:10px;color:#94a3b8;">Gerado em</div>
          <div style="font-size:11px;font-weight:700;">${new Date().toLocaleDateString("pt-BR")}</div>
          <div style="font-size:9px;color:#cbd5e1;margin-top:6px;">IDADI · Equilibrium</div>
        </div>
      </div>
    </div>`;
}

/* Inicializa a navegação de domínios */
window.addEventListener("load", () => {
  updateNavButtons();
});
