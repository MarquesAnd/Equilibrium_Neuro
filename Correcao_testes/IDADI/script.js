console.log("SCRIPT IDADI v2.0 — com normas");
const LAUDOS_KEY = "empresa_laudos_idadi";

/* ═══════════════════════════════════
   ESTADO GLOBAL
   ═══════════════════════════════════ */
let IDADI_DATA  = null;
let NORMAS_DATA = null;
let idadeMeses  = null;
let faixaAtual  = null;
let currentDomainIdx = 0;
let respostas = {};

/* ═══════════════════════════════════
   CONFIGURAÇÃO DOS DOMÍNIOS
   ═══════════════════════════════════ */
const DOMINIOS_CONFIG = [
  { id:"COG", emoji:"🧠", nome:"Cognitivo",            normaKey:"Cognitivo",                          cor:"#1a56db" },
  { id:"SE",  emoji:"💛", nome:"Socioemocional",         normaKey:"Socioemocional",                     cor:"#7c3aed" },
  { id:"CLR", emoji:"👂", nome:"Ling. Receptiva",        normaKey:"Comunicação e Linguagem Receptiva",  cor:"#0891b2" },
  { id:"CLE", emoji:"🗣️",nome:"Ling. Expressiva",       normaKey:"Comunicação e Linguagem Expressiva", cor:"#059669" },
  { id:"MA",  emoji:"🏃", nome:"Motricidade Ampla",      normaKey:"Motricidade Ampla",                  cor:"#dc2626" },
  { id:"MF",  emoji:"✋", nome:"Motricidade Fina",       normaKey:"Motricidade Fina",                   cor:"#d97706" },
  { id:"CA",  emoji:"🎯", nome:"Comp. Adaptativo",       normaKey:"Comportamento Adaptativo",           cor:"#be185d" },
];

/* ═══════════════════════════════════
   FAIXA ETÁRIA
   ═══════════════════════════════════ */
function detectarFaixa(dominioFaixas, meses) {
  for (const [faixa, range] of Object.entries(dominioFaixas)) {
    const [min, max] = faixa.split("-").map(Number);
    if (meses >= min && meses <= max) return faixa;
  }
  return null;
}

function faixaLabel(meses) {
  if (meses < 4)   return "Abaixo de 4 meses";
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
  return meses <= 35 ? "📋 Caderno Vol. 2 (4-35 meses)" : "📋 Caderno Vol. 3 (36-72 meses)";
}

/* ═══════════════════════════════════
   CÁLCULO DE IDADE
   ═══════════════════════════════════ */
function calcularIdade(nascISO, aplISO) {
  if (!nascISO || !aplISO) return null;
  const n = new Date(nascISO + "T12:00:00");
  const a = new Date(aplISO  + "T12:00:00");
  if (isNaN(n) || isNaN(a) || a < n) return null;
  let anos = a.getFullYear() - n.getFullYear();
  let meses = a.getMonth() - n.getMonth();
  if (a.getDate() < n.getDate()) meses--;
  if (meses < 0) { anos--; meses += 12; }
  return { anos, meses, totalMeses: anos * 12 + meses };
}

function formatarData(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/* ═══════════════════════════════════
   NORMAS — LOOKUP E SANITIZAÇÃO
   ═══════════════════════════════════ */
function encontrarFaixaNorma(normaKey, meses) {
  if (!NORMAS_DATA) return null;
  const prefix = normaKey + " ";
  const faixas = Object.keys(NORMAS_DATA)
    .filter(k => k.startsWith(prefix))
    .map(k => {
      const f = k.replace(prefix, "").replace(" meses", "");
      const [min, max] = f.split("-").map(Number);
      return { key: k, min, max, centro: (min + max) / 2 };
    });
  if (!faixas.length) return null;
  const exata = faixas.find(f => meses >= f.min && meses <= f.max);
  if (exata) return exata.key;
  return faixas.sort((a, b) => Math.abs(a.centro - meses) - Math.abs(b.centro - meses))[0].key;
}

function sanitizarZ(z)    { if (z == null) return null; const n = Number(z); return (isNaN(n)||Math.abs(n)>5) ? null : parseFloat(n.toFixed(2)); }
function sanitizarPad(v)  { if (v == null) return null; const n = Number(v); return (isNaN(n)||n<40||n>160) ? null : n; }
function sanitizarDesenv(v){ if (v == null) return null; const n = Number(v); return (isNaN(n)||n<=0||n>200) ? null : parseFloat(n.toFixed(1)); }
function sanitizarIC(inf, sup) {
  const i = Number(inf), s = Number(sup);
  if (isNaN(i)||isNaN(s)||i<=0||s<=0||i>=200||s>=200||i>=s) return null;
  return { inf: parseFloat(i.toFixed(1)), sup: parseFloat(s.toFixed(1)) };
}

function lookupNorma(domId, meses, rawBruto) {
  const dom = DOMINIOS_CONFIG.find(d => d.id === domId);
  if (!dom || !NORMAS_DATA) return null;
  const chave = encontrarFaixaNorma(dom.normaKey, meses);
  if (!chave) return null;
  const tabela = NORMAS_DATA[chave];
  if (!tabela?.length) return null;
  const closest = tabela.reduce((prev, curr) =>
    Math.abs((curr.escore_bruto||0) - rawBruto) < Math.abs((prev.escore_bruto||0) - rawBruto) ? curr : prev
  );
  return {
    faixaNorma: chave.replace(dom.normaKey + " ", "").replace(" meses",""),
    escore_bruto: closest.escore_bruto,
    padronizado:  sanitizarPad(closest.padronizado),
    z:            sanitizarZ(closest.z),
    escore_desenvolvimental: sanitizarDesenv(closest.escore_desenvolvimental),
    ic:           sanitizarIC(closest.ic_inferior, closest.ic_superior),
    see:          (closest.see != null && closest.see < 10) ? parseFloat(Number(closest.see).toFixed(2)) : null,
  };
}

/* ═══════════════════════════════════
   CLASSIFICAÇÃO (Escala M=100, DP=15)
   ═══════════════════════════════════ */
function classByPad(pad) {
  if (pad == null) return { txt:"—", cls:"", hex:"#64748b" };
  if (pad >= 130) return { txt:"Muito Superior",           cls:"cl-s",  hex:"#065f46" };
  if (pad >= 115) return { txt:"Acima da Média",           cls:"cl-ms", hex:"#1e40af" };
  if (pad >= 85)  return { txt:"Dentro do Esperado",       cls:"cl-m",  hex:"#1e3a5f" };
  if (pad >= 70)  return { txt:"Abaixo da Média",          cls:"cl-mi", hex:"#92400e" };
  if (pad >= 55)  return { txt:"Muito Abaixo do Esperado", cls:"cl-l",  hex:"#991b1b" };
  return               { txt:"Extremamente Abaixo",        cls:"cl-eb", hex:"#7f1d1d" };
}

/* ═══════════════════════════════════
   INICIALIZAÇÃO
   ═══════════════════════════════════ */
async function initIDadi() {
  try {
    const [r1, r2] = await Promise.all([
      fetch("/Correcao_testes/IDADI/data/idadi_items.json"),
      fetch("/Correcao_testes/IDADI/data/idadi_normas.json"),
    ]);
    IDADI_DATA  = await r1.json();
    NORMAS_DATA = await r2.json();
    console.log(`IDADI: ${IDADI_DATA.dominios.length} domínios | ${Object.keys(NORMAS_DATA).length} tabelas normativas`);
  } catch(e) {
    console.error("Erro ao carregar IDADI:", e);
    alert("Erro ao carregar dados do IDADI. Verifique /data/idadi_items.json e /data/idadi_normas.json.");
  }
}

/* ═══════════════════════════════════
   PREVIEW DE IDADE
   ═══════════════════════════════════ */
function atualizarPreviewIdade() {
  const nasc = document.getElementById("dataNascimento")?.value;
  const apl  = document.getElementById("dataAplicacao")?.value;
  const preview    = document.getElementById("idadePreview");
  const ageText    = document.getElementById("ageText");
  const faixaText  = document.getElementById("faixaText");
  const volumeText = document.getElementById("volumeText");
  const cardQ  = document.getElementById("cardQuestionario");
  const cardPh = document.getElementById("cardPlaceholder");

  if (!nasc || !apl) {
    if (preview) preview.style.display = "none";
    if (cardQ)  cardQ.style.display   = "none";
    if (cardPh) cardPh.style.display  = "block";
    return;
  }
  const idade = calcularIdade(nasc, apl);
  if (!idade || idade.totalMeses < 4) {
    if (ageText) ageText.textContent = "Datas inválidas ou criança com menos de 4 meses.";
    if (faixaText) faixaText.textContent = "";
    if (volumeText) volumeText.textContent = "";
    if (preview) preview.style.display = "block";
    if (cardQ)  cardQ.style.display   = "none";
    if (cardPh) cardPh.style.display  = "block";
    return;
  }
  idadeMeses = idade.totalMeses;
  faixaAtual = faixaLabel(idadeMeses);
  if (ageText)    ageText.textContent    = `Idade na aplicação: ${idade.anos} ano(s) e ${idade.meses} mês(es) — ${idadeMeses} meses`;
  if (faixaText)  faixaText.textContent  = `Faixa etária: ${faixaAtual}`;
  if (volumeText) volumeText.textContent = volumeLabel(idadeMeses);
  if (preview) preview.style.display = "block";
  const sub = document.getElementById("questSubtitle");
  if (sub) sub.textContent = `Faixa etária: ${faixaAtual} · Itens definidos automaticamente`;
  if (IDADI_DATA) {
    montarQuestionario();
    if (cardQ)  cardQ.style.display  = "block";
    if (cardPh) cardPh.style.display = "none";
  }
}

/* ═══════════════════════════════════
   MONTAR QUESTIONÁRIO
   ═══════════════════════════════════ */
function montarQuestionario() {
  currentDomainIdx = 0; respostas = {};
  montarTabs(); renderDomainContent(0); updateNavButtons();
}

function getDominioData(domId) { return IDADI_DATA?.dominios.find(d => d.id === domId); }

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
    const n = getItensFaixa(d.id).length;
    const on = i === 0;
    return `<button class="idadi-tab${on?" active":""}" id="tab_${d.id}" onclick="switchDomain(${i})"
      style="${on?`background:${d.cor};color:#fff`:""}">
      ${d.emoji} ${d.nome}
      <span class="tab-count" style="${on?"background:rgba(255,255,255,.35);color:#fff":"background:rgba(0,0,0,.08);color:#64748b"}">${n}</span>
    </button>`;
  }).join("");
}

function switchDomain(idx) {
  currentDomainIdx = idx;
  DOMINIOS_CONFIG.forEach((d, i) => {
    const tab = document.getElementById(`tab_${d.id}`);
    if (!tab) return;
    const cnt = tab.querySelector(".tab-count");
    if (i === idx) {
      tab.classList.add("active"); tab.style.background = d.cor; tab.style.color = "#fff";
      if (cnt) { cnt.style.background = "rgba(255,255,255,.35)"; cnt.style.color = "#fff"; }
    } else {
      tab.classList.remove("active"); tab.style.background = "#f1f5f9"; tab.style.color = "#64748b";
      if (cnt) { cnt.style.background = "rgba(0,0,0,.08)"; cnt.style.color = "#64748b"; }
    }
  });
  renderDomainContent(idx); updateNavButtons();
}

function renderDomainContent(idx) {
  const d = DOMINIOS_CONFIG[idx];
  const itens = getItensFaixa(d.id);
  const content = document.getElementById("domainContent");
  if (!content) return;
  if (!itens.length) {
    content.innerHTML = `<div class="idadi-domain-block"><div style="text-align:center;padding:24px;color:#94a3b8;"><div style="font-size:24px;">—</div><div style="font-size:13px;">Nenhum item para esta faixa neste domínio.</div></div></div>`;
    return;
  }
  const domData = getDominioData(d.id);
  const faixa = detectarFaixa(domData.faixas, idadeMeses);
  const { inicio, fim } = domData.faixas[faixa];
  const rows = itens.map(it => {
    const key = `${d.id}_${it.num}`, r = respostas[key]||"";
    return `<tr>
      <td class="idadi-item-num">${it.num}</td>
      <td class="idadi-item-texto">${it.texto}</td>
      <td class="idadi-item-resp">
        <div class="idadi-radio-group">
          <label class="idadi-radio-label"><input type="radio" name="${key}" value="sim" ${r==="sim"?"checked":""} onchange="registrarResposta('${key}','sim')"><span class="idadi-radio-pill sim">Sim</span></label>
          <label class="idadi-radio-label"><input type="radio" name="${key}" value="av" ${r==="av"?"checked":""} onchange="registrarResposta('${key}','av')"><span class="idadi-radio-pill av">Às vezes</span></label>
          <label class="idadi-radio-label"><input type="radio" name="${key}" value="nao" ${r==="nao"?"checked":""} onchange="registrarResposta('${key}','nao')"><span class="idadi-radio-pill nao">Ainda não</span></label>
        </div>
      </td>
    </tr>`;
  }).join("");
  content.innerHTML = `
    <div class="idadi-domain-block">
      <div class="idadi-domain-header" style="background:${d.cor};">
        <div class="idadi-domain-icon">${d.emoji}</div>
        <div><div class="idadi-domain-title">${domData.nome}</div>
          <div class="idadi-domain-range">${domData.descricao} · Itens ${inicio} a ${fim}</div></div>
      </div>
      <div style="overflow-x:auto;">
        <table class="idadi-item-table">
          <thead><tr><th style="width:40px">Nº</th><th>Item</th><th class="ctr" style="width:260px">Resposta</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function registrarResposta(key, valor) { respostas[key] = valor; }

function updateNavButtons() {
  const prev = document.getElementById("btnPrevDomain");
  const next = document.getElementById("btnNextDomain");
  const ctr  = document.getElementById("domainCounter");
  const isLast = currentDomainIdx === DOMINIOS_CONFIG.length - 1;
  if (prev) prev.disabled = (currentDomainIdx === 0);
  if (next) next.textContent = isLast ? "✅ Concluir" : "Próximo →";
  if (ctr)  ctr.textContent = `Domínio ${currentDomainIdx+1} de ${DOMINIOS_CONFIG.length}`;
}

function prevDomain() { if (currentDomainIdx > 0) switchDomain(currentDomainIdx - 1); }
function nextDomain() {
  if (currentDomainIdx < DOMINIOS_CONFIG.length - 1) switchDomain(currentDomainIdx + 1);
  else document.querySelector(".form-card:last-of-type")?.scrollIntoView({ behavior:"smooth" });
}

/* ═══════════════════════════════════
   PONTUAÇÃO + NORMA
   ═══════════════════════════════════ */
function calcularScore(domId) {
  const itens = getItensFaixa(domId);
  let rawScore = 0, respondidos = 0;
  itens.forEach(it => {
    const r = respostas[`${domId}_${it.num}`];
    if (r==="sim") { rawScore+=2; respondidos++; }
    else if (r==="av")  { rawScore+=1; respondidos++; }
    else if (r==="nao") { respondidos++; }
  });
  const maxScore = itens.length * 2;
  const pct = maxScore > 0 ? Math.round((rawScore/maxScore)*100) : 0;
  const norma = (NORMAS_DATA && respondidos > 0) ? lookupNorma(domId, idadeMeses, rawScore) : null;
  return { rawScore, maxScore, pct, respondidos, total: itens.length, itens, norma };
}

/* ═══════════════════════════════════
   LOADING / MODAL
   ═══════════════════════════════════ */
function showLoading(msg) {
  document.getElementById("loadingOverlay")?.remove();
  const o = document.createElement("div");
  o.id = "loadingOverlay"; o.className = "loading-overlay";
  o.innerHTML = `<div class="loading-card"><div class="loading-spinner"></div>
    <div class="loading-title">${msg||"Gerando relatório..."}</div>
    <div class="loading-sub">Calculando pontuações e consultando normas</div></div>`;
  document.body.appendChild(o);
}
function hideLoading() { document.getElementById("loadingOverlay")?.remove(); }

function openReportModal() {
  const rel = document.getElementById("relatorio"); if (!rel) return;
  closeReportModal();
  const bd = document.createElement("div");
  bd.id = "reportModal"; bd.className = "report-modal-backdrop";
  const pac = window.Integration ? Integration.getPacienteAtual() : null;
  const btnV = pac ? `<button class="toolbar-btn toolbar-btn-voltar" onclick="voltarParaPaciente()">👤 Voltar ao Paciente</button>` : "";
  bd.innerHTML = `<div class="report-modal">
    <div class="report-modal-toolbar no-print">
      <div class="toolbar-title">📄 Relatório IDADI</div>
      <div class="toolbar-actions">
        ${btnV}
        <button class="toolbar-btn toolbar-btn-primary" onclick="baixarPDF()">📥 Baixar PDF</button>
        <button class="toolbar-btn toolbar-btn-secondary" onclick="window.print()">🖨️ Imprimir</button>
        <button class="toolbar-btn toolbar-btn-secondary" onclick="closeReportModal()">✕ Fechar</button>
      </div>
    </div>
    <div class="report-modal-body" id="reportModalBody"></div>
  </div>`;
  document.body.appendChild(bd);
  document.getElementById("reportModalBody").appendChild(rel);
  rel.style.display = "block";
  bd.addEventListener("click", e => { if (e.target===bd) closeReportModal(); });
  document.addEventListener("keydown", _escHandler);
}

function _escHandler(e) { if (e.key==="Escape") closeReportModal(); }

function closeReportModal() {
  const modal = document.getElementById("reportModal"); if (!modal) return;
  const rel = document.getElementById("relatorio");
  if (rel) { document.querySelector(".main-content")?.appendChild(rel); rel.style.display = "none"; }
  modal.remove();
  document.removeEventListener("keydown", _escHandler);
}

async function baixarPDF() {
  const el = document.getElementById("reportModalBody")||document.getElementById("relatorio");
  if (!el) return;
  await html2pdf().set({ margin:[10,12], filename:"IDADI_Laudo.pdf",
    image:{type:"jpeg",quality:.92}, html2canvas:{scale:2,useCORS:true,logging:false},
    jsPDF:{unit:"mm",format:"a4",orientation:"portrait"} }).from(el).save();
}

/* ═══════════════════════════════════
   CALCULAR PRINCIPAL
   ═══════════════════════════════════ */
async function calcular(salvar) {
  const nomeCrianca       = (document.getElementById("nomeCrianca")?.value||"").trim();
  const nasc              = document.getElementById("dataNascimento")?.value;
  const apl               = document.getElementById("dataAplicacao")?.value;
  const sexo              = document.getElementById("sexo")?.value||"";
  const nomeInformante    = (document.getElementById("nomeInformante")?.value||"").trim();
  const parentesco        = document.getElementById("parentesco")?.value||"";
  const profNome          = (document.getElementById("profNome")?.value||"").trim();
  const profCRP           = (document.getElementById("profCRP")?.value||"").trim();
  const profEspecialidade = (document.getElementById("profEspecialidade")?.value||"").trim();
  const motivo            = (document.getElementById("motivo")?.value||"").trim();
  const obsComp           = (document.getElementById("obsComportamentais")?.value||"").trim();
  const recomendacoes     = (document.getElementById("recomendacoes")?.value||"").trim();

  if (!nomeCrianca||!nasc||!apl) { alert("Preencha nome, data de nascimento e data de aplicação."); return; }
  if (!idadeMeses) { alert("Verifique as datas inseridas."); return; }
  if (!Object.keys(respostas).length) { alert("Preencha pelo menos um domínio antes de calcular."); return; }

  showLoading(salvar ? "Salvando e gerando relatório..." : "Calculando resultados...");
  await new Promise(r => setTimeout(r, 300));

  try {
    const scores = {};
    DOMINIOS_CONFIG.forEach(d => { scores[d.id] = calcularScore(d.id); });
    montarRelatorio({ nomeCrianca, nasc, apl, sexo, idadeMeses, faixaAtual,
      nomeInformante, parentesco, profNome, profCRP, profEspecialidade,
      motivo, obsComp, recomendacoes, scores });
    hideLoading();
    if (salvar) {
      const rel = document.getElementById("relatorio");
      const laudos = getLaudos();
      laudos.unshift({ nomeCrianca, dataAplicacao: apl, idadeMeses, faixa: faixaAtual,
        createdAt: new Date().toISOString(), htmlRelatorio: rel.outerHTML, scores });
      setLaudos(laudos);
      if (window.Integration) {
        const resumo = DOMINIOS_CONFIG.map(d => {
          const s = scores[d.id]; const pad = s.norma?.padronizado;
          return `${d.nome}: bruto=${s.rawScore}/${s.maxScore}${pad?` pad=${pad}`:""}`;
        }).join("; ");
        await Integration.salvarTesteNoFirebase("idadi", { dataAplicacao: apl,
          resumo: `IDADI — ${faixaAtual} | ${resumo}`, scores, observacoes: obsComp, htmlRelatorio: rel.outerHTML });
      }
    }
    openReportModal();
  } catch(e) { hideLoading(); console.error(e); alert("Erro ao gerar relatório: " + e.message); }
}

function getLaudos()    { try { return JSON.parse(localStorage.getItem(LAUDOS_KEY)||"[]"); } catch { return []; } }
function setLaudos(arr) { localStorage.setItem(LAUDOS_KEY, JSON.stringify(arr)); }

function voltarParaPaciente() {
  let pac = null; try { pac = JSON.parse(sessionStorage.getItem("pacienteAtual")); } catch {}
  if (pac?.id) location.href = `/Pacientes/ficha.html?id=${pac.id}`;
}

/* ═══════════════════════════════════
   MONTAR RELATÓRIO HTML
   ═══════════════════════════════════ */
function montarRelatorio(dados) {
  const { nomeCrianca, nasc, apl, sexo, idadeMeses, faixaAtual,
    nomeInformante, parentesco, profNome, profCRP, profEspecialidade,
    motivo, obsComp, recomendacoes, scores } = dados;
  const rel = document.getElementById("relatorio"); if (!rel) return;

  const anosMeses = idadeMeses >= 12
    ? `${Math.floor(idadeMeses/12)} ano(s) e ${idadeMeses%12} mês(es)`
    : `${idadeMeses} meses`;

  /* ─── PERFIL COM BARRAS ─── */
  let perfil = "";
  DOMINIOS_CONFIG.forEach(d => {
    const s = scores[d.id];
    if (!s.total || !s.respondidos) return;
    const pad = s.norma?.padronizado;
    // Normalizar para largura da barra: escala 40-160 → 0-100%
    const barW = pad != null
      ? Math.max(2, Math.min(100, Math.round(((pad - 40) / 120) * 100)))
      : Math.max(2, s.pct);
    const cls = classByPad(pad);
    const barColor = pad == null ? d.cor
      : pad >= 115 ? "#059669"
      : pad >= 85  ? "#1a56db"
      : pad >= 70  ? "#d97706"
      : "#dc2626";

    perfil += `
      <div class="idadi-profile-bar">
        <div class="idadi-pb-label">${d.emoji} ${d.nome}</div>
        <div class="idadi-pb-track">
          <!-- zona esperada 85-115 mapeada em escala 40-160 -->
          <div style="position:absolute;top:0;bottom:0;
            left:${((85-40)/120*100).toFixed(1)}%;width:${((115-85)/120*100).toFixed(1)}%;
            background:rgba(26,86,219,.07);
            border-left:1px dashed rgba(26,86,219,.2);border-right:1px dashed rgba(26,86,219,.2);"></div>
          <div class="idadi-pb-fill" style="width:${barW}%;background:${barColor};"></div>
        </div>
        <div class="idadi-pb-pct" style="color:${barColor};font-weight:800;">${pad!=null?pad:`${s.pct}%`}</div>
        <div class="idadi-pb-raw"><span class="cl-badge ${cls.cls}" style="font-size:9px;">${cls.txt}</span></div>
      </div>`;
  });

  /* ─── TABELA RESUMO ─── */
  let tblRows = "";
  DOMINIOS_CONFIG.forEach((d, i) => {
    const s = scores[d.id]; if (!s.total) return;
    const nr = s.norma;
    const pad    = nr?.padronizado;
    const z      = nr?.z;
    const desenv = nr?.escore_desenvolvimental;
    const ic     = nr?.ic;
    const cls    = classByPad(pad);
    tblRows += `<tr class="${i%2?"":"alt"}">
      <td><b>${d.emoji} ${d.nome}</b></td>
      <td class="ctr">${s.total}</td>
      <td class="ctr">${s.respondidos}</td>
      <td class="ctr"><b>${s.rawScore}</b></td>
      <td class="ctr">${s.maxScore}</td>
      <td class="ctr"><b>${pad!=null?pad:"—"}</b></td>
      <td class="ctr">${z!=null?z.toFixed(2):"—"}</td>
      <td class="ctr">${desenv!=null?`${desenv} m`:"—"}</td>
      <td class="ctr">${ic?`${ic.inf}–${ic.sup}`:"—"}</td>
      <td class="ctr"><span class="cl-badge ${cls.cls}">${cls.txt}</span></td>
    </tr>`;
  });

  /* ─── DETALHAMENTO POR DOMÍNIO ─── */
  let detalhes = "";
  DOMINIOS_CONFIG.forEach((d, di) => {
    const s = scores[d.id]; if (!s.total || !s.respondidos) return;
    const nr  = s.norma;
    const pad = nr?.padronizado;
    const cls = classByPad(pad);

    // Fichas normativas
    const normCards = nr ? `
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
        ${pad!=null?`<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:6px 12px;text-align:center;min-width:70px;">
          <div style="font-size:9px;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:.5px;">Padronizado</div>
          <div style="font-size:20px;font-weight:800;color:#0c4a6e;">${pad}</div>
          <div style="font-size:10px;font-weight:700;color:${cls.hex}">${cls.txt}</div>
        </div>`:""}
        ${nr.z!=null?`<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:6px 12px;text-align:center;min-width:60px;">
          <div style="font-size:9px;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:.5px;">Escore-Z</div>
          <div style="font-size:20px;font-weight:800;color:#0c4a6e;">${nr.z.toFixed(2)}</div>
        </div>`:""}
        ${nr.escore_desenvolvimental!=null?`<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:6px 12px;text-align:center;min-width:70px;">
          <div style="font-size:9px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:.5px;">E. Desenvolvimental</div>
          <div style="font-size:20px;font-weight:800;color:#14532d;">${nr.escore_desenvolvimental}</div>
          <div style="font-size:9px;color:#166534;">meses</div>
        </div>`:""}
        ${nr.ic?`<div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:6px 12px;text-align:center;min-width:80px;">
          <div style="font-size:9px;font-weight:700;color:#854d0e;text-transform:uppercase;letter-spacing:.5px;">IC 95%</div>
          <div style="font-size:14px;font-weight:800;color:#713f12;">${nr.ic.inf}–${nr.ic.sup}</div>
          <div style="font-size:9px;color:#854d0e;">meses</div>
        </div>`:""}
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;text-align:center;min-width:60px;">
          <div style="font-size:9px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.5px;">Bruto</div>
          <div style="font-size:18px;font-weight:800;color:#0f172a;">${s.rawScore}/${s.maxScore}</div>
          <div style="font-size:9px;color:#64748b;">${s.pct}%</div>
        </div>
        ${nr.faixaNorma?`<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;text-align:center;min-width:70px;">
          <div style="font-size:9px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.5px;">Faixa Normativa</div>
          <div style="font-size:12px;font-weight:700;color:#0f172a;">${nr.faixaNorma}</div>
        </div>`:""}
      </div>` : `
      <div style="background:#fef3c7;border:1px solid rgba(217,119,6,.2);border-radius:8px;padding:8px 12px;margin-top:6px;font-size:11px;color:#92400e;">
        ⚠️ Norma não disponível para esta faixa neste domínio. Pontuação bruta: ${s.rawScore}/${s.maxScore} (${s.pct}%).
      </div>`;

    const naoItens = s.itens.filter(it => respostas[`${d.id}_${it.num}`]==="nao");
    const avItens  = s.itens.filter(it => respostas[`${d.id}_${it.num}`]==="av");

    const domRows = s.itens.map(it => {
      const r = respostas[`${d.id}_${it.num}`];
      const badge = !r ? `<span class="idadi-r-no">N/R</span>`
        : r==="sim" ? `<span class="idadi-r-sim">✓ Sim</span>`
        : r==="av"  ? `<span class="idadi-r-av">~ Às vezes</span>`
        : `<span class="idadi-r-nao">✗ Ainda não</span>`;
      return `<tr>
        <td style="font-size:10px;color:#94a3b8;text-align:center;width:32px;">${it.num}</td>
        <td style="font-size:11px;color:#334155;line-height:1.4;">${it.texto}</td>
        <td style="text-align:center;">${badge}</td>
      </tr>`;
    }).join("");

    detalhes += `
      <div class="no-break" style="margin-top:10px;">
        <div class="rpt-sh">
          <span class="num" style="background:${d.cor};">${di+1}</span>
          <div><div class="sh-title">${d.emoji} ${d.nome}</div>
            <div class="sh-sub">${s.respondidos}/${s.total} itens respondidos · bruto ${s.rawScore}/${s.maxScore}</div></div>
          ${pad!=null?`<span class="cl-badge ${cls.cls}" style="margin-left:auto;">${pad} — ${cls.txt}</span>`:""}
        </div>
        ${normCards}
        <div style="margin-top:10px;">
          <table class="rpt-tbl">
            <thead><tr>
              <th style="width:32px;" class="ctr">Nº</th>
              <th>Item</th>
              <th class="ctr" style="width:110px;">Resposta</th>
            </tr></thead>
            <tbody>${domRows}</tbody>
          </table>
        </div>
        ${(avItens.length||naoItens.length)?`
        <div class="rpt-box-obs" style="margin-top:6px;">
          ${avItens.length?`<b>🎯 Em desenvolvimento (Às vezes):</b>
            <ul style="margin:4px 0 8px 16px;">${avItens.map(it=>`<li style="font-size:11px;">${it.texto}</li>`).join("")}</ul>`:""}
          ${naoItens.length?`<b>🔴 Ainda não adquiridas:</b>
            <ul style="margin:4px 0 0 16px;">${naoItens.map(it=>`<li style="font-size:11px;">${it.texto}</li>`).join("")}</ul>`:""}
        </div>`:""}
      </div>`;
  });

  /* ─── HTML COMPLETO ─── */
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
          <div class="sub">${idadeMeses} meses · ${anosMeses}</div>
        </div>
      </div>
    </div>
    <div class="rpt-body">

      <div class="rpt-sh"><span class="num">1</span><div class="sh-title">Identificação</div></div>
      <div class="rpt-box">
        <div class="rpt-info">
          <div><div class="lbl">Criança</div><div class="val bold">${nomeCrianca||"—"}</div></div>
          <div><div class="lbl">Sexo</div><div class="val">${sexo||"—"}</div></div>
          <div><div class="lbl">Data de Nascimento</div><div class="val">${formatarData(nasc)}</div></div>
          <div><div class="lbl">Data de Aplicação</div><div class="val">${formatarData(apl)}</div></div>
          <div><div class="lbl">Idade na Aplicação</div><div class="val bold">${anosMeses}</div></div>
          <div><div class="lbl">Faixa IDADI</div><div class="val bold">${faixaAtual}</div></div>
          <div class="sep"></div>
          <div><div class="lbl">Informante</div><div class="val">${nomeInformante||"—"}</div></div>
          <div><div class="lbl">Parentesco</div><div class="val">${parentesco||"—"}</div></div>
          ${profNome?`<div class="sep"></div>
          <div><div class="lbl">Profissional</div><div class="val bold">${profNome}</div></div>
          <div><div class="lbl">CRP</div><div class="val">${profCRP||"—"}</div></div>
          <div><div class="lbl">Especialidade</div><div class="val">${profEspecialidade||"—"}</div></div>`:""}
        </div>
      </div>

      ${motivo?`<div class="rpt-sh"><span class="num">2</span><div class="sh-title">Motivo do Encaminhamento</div></div>
      <div class="rpt-box-obs">${motivo}</div>`:""}

      <div class="rpt-sh">
        <span class="num">3</span>
        <div><div class="sh-title">Perfil de Desenvolvimento</div>
          <div class="sh-sub">Escala padronizada M=100, DP=15 · Zona sombreada = faixa esperada (85–115)</div></div>
      </div>
      <div class="rpt-box" style="padding:14px 18px;">${perfil}</div>

      <div class="rpt-sh"><span class="num">4</span><div class="sh-title">Resultados por Domínio</div></div>
      <table class="rpt-tbl" style="font-size:11px;">
        <thead><tr>
          <th>Domínio</th><th class="ctr">Itens</th><th class="ctr">Resp.</th>
          <th class="ctr">Bruto</th><th class="ctr">Máx.</th>
          <th class="ctr">Pad.</th><th class="ctr">Z</th>
          <th class="ctr">E.Desenv.</th><th class="ctr">IC 95%</th>
          <th class="ctr">Classificação</th>
        </tr></thead>
        <tbody>${tblRows}</tbody>
      </table>
      <div style="font-size:9px;color:#94a3b8;margin-top:4px;">
        Pad.=Escore padronizado (M=100, DP=15) · E.Desenv.=Escore desenvolvimental em meses · IC=Intervalo de confiança 95%
      </div>

      <div class="rpt-sh"><span class="num">5</span><div class="sh-title">Detalhamento por Domínio</div></div>
      ${detalhes}

      ${obsComp?`<div class="rpt-sh"><span class="num">6</span><div class="sh-title">Observações Comportamentais</div></div>
      <div class="rpt-box-obs">${obsComp}</div>`:""}

      ${recomendacoes?`<div class="rpt-sh"><span class="num">7</span><div class="sh-title">Conclusão e Recomendações</div></div>
      <div class="rpt-box-obs">${recomendacoes}</div>`:""}

      <div class="rpt-foot">
        <div>
          ${profNome?`<div class="sign-line">${profNome}${profCRP?` — ${profCRP}`:""}${profEspecialidade?`<br>${profEspecialidade}`:""}</div>`:""}
          <div class="rpt-foot-disclaimer">Gerado por Equilibrium Neuropsicologia. Normas: IDADI, Silva, Mendonça Filho &amp; Bandeira (2020).</div>
        </div>
        <div class="rpt-foot-right">
          <div style="font-size:10px;color:#94a3b8;">Gerado em</div>
          <div style="font-size:11px;font-weight:700;">${new Date().toLocaleDateString("pt-BR")}</div>
          <div style="font-size:9px;color:#cbd5e1;margin-top:4px;">IDADI · Equilibrium</div>
        </div>
      </div>
    </div>`;
}

window.addEventListener("load", updateNavButtons);
