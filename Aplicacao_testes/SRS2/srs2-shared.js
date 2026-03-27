/**
 * SRS-2 SHARED SCRIPT — Equilibrium
 * Variável FORM_KEY e SRS_ACCENT_VAR devem ser definidas antes deste script em cada página.
 * 
 * FORM_KEY: "pre_escolar" | "idade_escolar_feminino" | "idade_escolar_masculino" | "adulto_autorrelato" | "adulto_heterorrelato"
 * SRS_ACCENT_VAR: "--srs-pre-escolar" | "--srs-escolar-f" | "--srs-escolar-m" | "--srs-adulto-het" | "--srs-adulto-auto"
 */

let SRS2_RULES = null;
const $ = (sel) => document.querySelector(sel);

// ─── INICIALIZAÇÃO DAS CORES ─────────────────────────────────────────────────
function aplicarAcento(){
  if(!window.SRS_ACCENT_VAR) return;
  const root = document.documentElement;
  const val = getComputedStyle(root).getPropertyValue(window.SRS_ACCENT_VAR).trim();
  const valLight = getComputedStyle(root).getPropertyValue(window.SRS_ACCENT_VAR + '-light').trim();
  const valDark  = getComputedStyle(root).getPropertyValue(window.SRS_ACCENT_VAR + '-dark').trim();
  if(val)      root.style.setProperty('--srs-accent', val);
  if(valLight) root.style.setProperty('--srs-accent-light', valLight);
  if(valDark)  root.style.setProperty('--srs-accent-dark', valDark);
}

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }

function classificarT(t){
  if(t == null || Number.isNaN(t)) return { label: "—", cls: "" };
  if(t <= 59)  return { label: "Típico",   cls: "cls-normal" };
  if(t <= 65)  return { label: "N1",       cls: "cls-leve" };
  if(t <= 75)  return { label: "N2",       cls: "cls-moderado" };
  return             { label: "N3",       cls: "cls-severo" };
}

function setSubtitle(msg){
  const el = $("#subtitle");
  if(el) el.textContent = msg;
}

// ─── CARREGAR JSON ────────────────────────────────────────────────────────────
async function carregarRegras(){
  const res = await fetch("../data/srs2_rules.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Não foi possível carregar ../data/srs2_rules.json");
  SRS2_RULES = await res.json();
}

function getForm(){
  if(!SRS2_RULES) return null;
  return (SRS2_RULES.forms || []).find(f => f.form === FORM_KEY) || null;
}

// ─── RENDERIZAR ITENS ─────────────────────────────────────────────────────────
function renderItens(){
  const form = getForm();
  const container = $("#itens");
  container.innerHTML = "";

  if(!form){
    container.innerHTML = `<div class="srs-hint">FORM_KEY inválida: <b>${escapeHtml(FORM_KEY)}</b></div>`;
    return;
  }

  $("#pillForm").textContent = form.label || FORM_KEY;
  $("#hintForm").textContent = `${form.items.length} itens • ${form.scales.length} escalas`;

  const labels = form.answer_labels || { 1:"Nunca", 2:"Às vezes", 3:"Frequentemente", 4:"Quase sempre" };
  const optLabels = { 1: "Nunca", 2: "Às vezes", 3: "Frequentemente", 4: "Quase sempre" };

  for(const item of form.items){
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.itemId = item.id;

    const reverseTag = item.reverse
      ? `<span class="tag tag-reverso">⇄ reverso</span>`
      : `<span class="tag tag-normal">direto</span>`;

    div.innerHTML = `
      <div class="top">
        <div class="qid">${escapeHtml(item.id)}</div>
        <div class="txt">${escapeHtml(item.text)}</div>
        ${reverseTag}
      </div>
      <div class="opts">
        ${[1,2,3,4].map(v => `
          <label class="opt">
            <input type="radio" name="i${escapeHtml(item.id)}" value="${v}" />
            <span>${v} — ${escapeHtml(labels[v] || optLabels[v] || "")}</span>
          </label>
        `).join("")}
      </div>
    `;

    // Marca item como respondido + atualiza opt selecionada
    div.addEventListener("change", (e) => {
      div.classList.add("respondido");
      div.querySelectorAll(".opt").forEach(o => o.classList.remove("selecionada"));
      e.target.closest(".opt")?.classList.add("selecionada");
      atualizarProgresso();
    });

    container.appendChild(div);
  }
}

// ─── PROGRESSO ────────────────────────────────────────────────────────────────
function atualizarProgresso(){
  const form = getForm();
  if(!form) return;
  let answered = 0;
  for(const item of form.items){
    const r = document.querySelector(`input[name="i${CSS.escape(String(item.id))}"]:checked`);
    if(r) answered++;
  }
  const total = form.items.length;
  const pct = Math.round((answered / total) * 100);
  $("#pillAnswered").textContent = `${answered}/${total}`;
  const fill = $(".srs-progress-fill");
  if(fill) fill.style.width = pct + "%";
}

// ─── CÁLCULO ──────────────────────────────────────────────────────────────────
function pontosItem(item, resp14){
  const r = parseInt(resp14, 10);
  if(Number.isNaN(r)) return null;
  return item.reverse ? (4 - r) : (r - 1);
}

function coletarRespostas(){
  const form = getForm();
  const map = {}; let missing = 0;
  for(const item of form.items){
    const el = document.querySelector(`input[name="i${CSS.escape(String(item.id))}"]:checked`);
    if(!el){ missing++; continue; }
    map[item.id] = parseInt(el.value, 10);
  }
  return { respostas: map, missing };
}

function calcularBrutos(respostasMap){
  const form = getForm();
  const brutos = {};
  for(const scale of form.scales) brutos[scale.key] = 0;
  for(const item of form.items){
    const resp = respostasMap[item.id];
    if(resp == null) continue;
    const pts = pontosItem(item, resp);
    if(pts == null) continue;
    for(const sKey of item.scales){
      brutos[sKey] += pts;
    }
  }
  return brutos;
}

function calcularTscores(brutos){
  const form = getForm();
  const ts = {};
  for(const scale of form.scales){
    const bruto = brutos[scale.key];
    const norms = form.norms?.[scale.key] || null;
    if(!norms){ ts[scale.key] = null; continue; }
    const t = norms[String(bruto)];
    ts[scale.key] = (t == null) ? null : Number(t);
  }
  return ts;
}

// ─── TABELAS DE RESULTADO (SIDEBAR) ──────────────────────────────────────────
function renderTabelaResultados(brutos, tscores){
  const form = getForm();
  const tbody = $("#tblResultados tbody");
  tbody.innerHTML = "";

  for(const scale of form.scales){
    const bruto = brutos[scale.key];
    const t = tscores[scale.key];
    const { label: clsLabel, cls } = classificarT(t);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div style="font-weight:800;font-size:12px;">${escapeHtml(scale.label || scale.key)}</div>
        <div style="font-size:10px;color:#64748b;">${escapeHtml(scale.key)}</div>
      </td>
      <td class="right nowrap"><b>${bruto ?? "—"}</b></td>
      <td class="right nowrap"><b>${t ?? "—"}</b></td>
      <td><span class="cls-badge ${cls}">${clsLabel}</span></td>
    `;
    tbody.appendChild(tr);
  }
}

function renderTabelaItens(respostasMap){
  const form = getForm();
  const tbody = $("#tblItens tbody");
  tbody.innerHTML = "";
  for(const item of form.items){
    const resp = respostasMap[item.id];
    const pts = (resp != null) ? pontosItem(item, resp) : null;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="nowrap">${escapeHtml(item.id)}</td>
      <td class="nowrap">${resp ?? "—"}</td>
      <td class="right nowrap">${pts ?? "—"}</td>
      <td>${item.reverse ? "✓" : "—"}</td>
    `;
    tbody.appendChild(tr);
  }
}

function calcularEExibir(){
  const form = getForm();
  if(!form) return null;
  const { respostas, missing } = coletarRespostas();
  const brutos = calcularBrutos(respostas);
  const tscores = calcularTscores(brutos);
  renderTabelaResultados(brutos, tscores);
  renderTabelaItens(respostas);
  const el = $("#summaryLine");
  if(el){
    const tTotal = tscores["SRS_Total"] ?? tscores["total"] ?? null;
    const { label } = classificarT(tTotal);
    el.textContent = missing > 0
      ? `⚠️ ${missing} item(s) sem resposta — resultado parcial`
      : `✅ Todos os itens respondidos${tTotal != null ? ` · Escore Total T = ${tTotal} (${label})` : ""}`;
  }
  return { brutos, tscores, missing };
}

function limparTudo(){
  document.querySelectorAll("input[type=radio]").forEach(r => r.checked = false);
  document.querySelectorAll(".item").forEach(el => el.classList.remove("respondido"));
  document.querySelectorAll(".opt").forEach(el => el.classList.remove("selecionada"));
  ["#tblResultados tbody","#tblItens tbody"].forEach(s => {
    const el = $(s);
    if(el) el.innerHTML = "";
  });
  const sl = $("#summaryLine");
  if(sl) sl.textContent = 'Preencha os itens e clique em "Recalcular".';
  const fill = $(".srs-progress-fill");
  if(fill) fill.style.width = "0%";
  atualizarProgresso();
}

// ═══════════════════════════════════════════════════════
// RELATÓRIO CLÍNICO
// ═══════════════════════════════════════════════════════

const SCALE_ORDER_HINTS = [
  "Percepção Social",
  "Cognição Social",
  "Comunicação Social",
  "Motivação Social",
  "Padrões Restritos",
  "Comunicação e Interação Social",
  "Escore Total"
];

const SCALE_DESCRIPTIONS = {
  "Percepção Social":
    "Mede a capacidade de reconhecer pistas sociais e lidar com os aspectos perceptivos do comportamento social recíproco. Avalia se o indivíduo consegue identificar nuances nas interações sociais cotidianas.",
  "Cognição Social":
    "Refere-se à capacidade de interpretar as pistas sociais após reconhecê-las. Avalia o aspecto cognitivo-interpretativo do comportamento social recíproco.",
  "Comunicação Social":
    "Mede a capacidade de comunicação expressiva, lidando com os aspectos motores do comportamento social recíproco. Representa os comportamentos mais 'robotizados' da comunicação.",
  "Motivação Social":
    "Avalia o grau em que a pessoa é motivada a se engajar em comportamento sócio interpessoal. Inclui elementos de ansiedade social, inibição e orientação empática.",
  "Padrões Restritos e Repetitivos":
    "Mede a presença de comportamentos estereotípicos característicos de TEA e áreas de interesse muito limitadas. Presente tanto nas subescalas de intervenção quanto nas escalas compatíveis ao DSM-5.",
  "Comunicação e Interação Social":
    "Escala compatível ao DSM-5 que avalia a reciprocidade socioemocional, comportamentos comunicativos não verbais e a capacidade de desenvolver, manter e compreender relacionamentos.",
};

function normalizeStr(s){ return String(s||"").trim().toLowerCase(); }

function sortScalesLikePdf(scales){
  return [...scales].sort((a,b)=>{
    const lA = a.label||a.key, lB = b.label||b.key;
    const iA = SCALE_ORDER_HINTS.findIndex(h=>normalizeStr(lA).includes(normalizeStr(h)));
    const iB = SCALE_ORDER_HINTS.findIndex(h=>normalizeStr(lB).includes(normalizeStr(h)));
    return (iA===-1?999:iA) - (iB===-1?999:iB);
  });
}

function countMissingByScale(form){
  const m = {};
  for(const sc of form.scales) m[sc.key] = 0;
  for(const item of form.items){
    const answered = !!document.querySelector(`input[name="i${CSS.escape(String(item.id))}"]:checked`);
    if(!answered) for(const sKey of item.scales) if(m[sKey]!=null) m[sKey]++;
  }
  return m;
}

// ─── SVG: Perfil ─────────────────────────────────────────────────────────────
function svgProfileChart(rows, accentOverride, accentLightOverride){
  const W=860, H=420;
  const left=100, right=260, top=50, bottom=40;
  const plotW=W-left-right, plotH=H-top-bottom;
  const tMin=20, tMax=80;

  // Lê CSS variables — mas aceita valores pré-resolvidos para captura PDF (html2pdf não resolve vars)
  const accent = accentOverride
    || getComputedStyle(document.documentElement).getPropertyValue('--srs-accent').trim()
    || '#1a56db';
  const accentLight = accentLightOverride
    || getComputedStyle(document.documentElement).getPropertyValue('--srs-accent-light').trim()
    || '#dbeafe';

  function xOfT(t){ return left+((clamp(Number(t),tMin,tMax)-tMin)/(tMax-tMin))*plotW; }
  const yStep = plotH/Math.max(1,rows.length);
  function yOfI(i){ return top+(i+0.5)*yStep; }

  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="font-family:sans-serif">
    <rect x="0" y="0" width="${W}" height="${H}" fill="#fff" rx="12"/>`;

  // Fundo da área de plot
  svg += `<rect x="${xOfT(20)}" y="${top}" width="${xOfT(80)-xOfT(20)}" height="${plotH}" fill="#f8fafc" rx="4"/>`;

  // Zona Normal (40-60) destacada
  svg += `<rect x="${xOfT(40)}" y="${top}" width="${xOfT(60)-xOfT(40)}" height="${plotH}" fill="${accentLight}" opacity="0.5" rx="2"/>`;

  // Zonas após 60 — neutras
  svg += `<rect x="${xOfT(60)}" y="${top}" width="${xOfT(80)-xOfT(60)}" height="${plotH}" fill="#f1f5f9" opacity="0.5"/>`;

  // Linhas verticais de grade
  for(let t=20;t<=80;t+=5){
    const x=xOfT(t);
    svg += `<line x1="${x}" y1="${top}" x2="${x}" y2="${top+plotH}" stroke="#e2e8f0" stroke-width="1.5"/>`;
    let lbl = String(t);
    if(t===50) lbl = "50 (M)";
    svg += `<text x="${x}" y="${top-12}" text-anchor="middle" font-size="11" fill="#64748b" font-weight="${t===50?'700':'400'}">${lbl}</text>`;
  }

  // Labels de zona
  svg += `<text x="${xOfT(50)}" y="${top-28}" text-anchor="middle" font-size="10" fill="${accent}" font-weight="700">TÍPICO</text>`;
  svg += `<text x="${xOfT(62)}" y="${top-28}" text-anchor="middle" font-size="10" fill="#64748b" font-weight="700">N1</text>`;
  svg += `<text x="${xOfT(70)}" y="${top-28}" text-anchor="middle" font-size="10" fill="#64748b" font-weight="700">N2</text>`;
  svg += `<text x="${xOfT(77)}" y="${top-28}" text-anchor="middle" font-size="10" fill="#64748b" font-weight="700">N3</text>`;

  // Headers laterais
  svg += `<text x="10" y="${top-12}" font-size="10" fill="#64748b" font-weight="700">Bruto</text>`;
  svg += `<text x="48" y="${top-12}" font-size="10" fill="#64748b" font-weight="700">T</text>`;

  // Linhas horizontais de separação
  rows.forEach((_,i)=>{
    svg += `<line x1="${xOfT(20)}" y1="${yOfI(i)+yStep/2}" x2="${xOfT(80)}" y2="${yOfI(i)+yStep/2}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3"/>`;
  });

  // Linha conectando pontos
  let path = "";
  rows.forEach((r,i)=>{
    const x=xOfT(r.t??50), y=yOfI(i);
    path += (i===0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
  });
  svg += `<path d="${path}" fill="none" stroke="${accent}" stroke-width="2.5" stroke-linejoin="round"/>`;

  // Pontos e labels
  rows.forEach((r,i)=>{
    const y=yOfI(i), x=xOfT(r.t??50);
    const t = r.t==null ? null : Number(r.t);
    const color = t==null ? '#94a3b8' : t<=59 ? '#16a34a' : '#64748b';

    // Valores numéricos
    svg += `<text x="10" y="${y+4}" font-size="11" fill="#374151" font-weight="700">${r.bruto??'—'}</text>`;
    svg += `<text x="48" y="${y+4}" font-size="11" fill="#374151" font-weight="700">${r.t??'—'}</text>`;

    // Ponto colorido
    svg += `<circle cx="${x}" cy="${y}" r="7" fill="${color}" stroke="#fff" stroke-width="2"/>`;
    svg += `<circle cx="${x}" cy="${y}" r="3" fill="#fff"/>`;

    // Nome à direita
    const label = r.label.length > 30 ? r.label.slice(0,28)+'…' : r.label;
    svg += `<text x="${xOfT(80)+14}" y="${y+4}" font-size="12" fill="#1e293b" font-weight="700">${escapeHtml(label)}</text>`;
  });

  svg += `</svg>`;
  return svg;
}

// ─── SVG: Sino ───────────────────────────────────────────────────────────────
function svgBell(t, accentOverride, accentLightOverride){
  const W=400, H=130;
  const tMin=20, tMax=80;
  const xPad=20, baseY=H-28, plotW=W-xPad*2;

  const accent = accentOverride
    || getComputedStyle(document.documentElement).getPropertyValue('--srs-accent').trim()
    || '#1a56db';
  const accentLight = accentLightOverride
    || getComputedStyle(document.documentElement).getPropertyValue('--srs-accent-light').trim()
    || '#dbeafe';

  function xOfT(val){ return xPad+((clamp(Number(val),tMin,tMax)-tMin)/(tMax-tMin))*plotW; }

  const pts = [];
  for(let i=0;i<=80;i++){
    const u=i/80, x=xPad+u*plotW;
    const y = baseY - Math.exp(-Math.pow((u-0.5)/0.22,2))*90;
    pts.push([x,y]);
  }
  const d = pts.map((p,i)=>(i===0?`M ${p[0]} ${p[1]}`:`L ${p[0]} ${p[1]}`)).join(" ")
    + ` L ${xPad+plotW} ${baseY} L ${xPad} ${baseY} Z`;

  const tv = t ?? 50;
  const xt = xOfT(tv);
  const color = tv<=59 ? '#16a34a' : '#64748b';

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#fff" rx="8"/>
    <path d="${d}" fill="${accentLight}" opacity="0.6"/>
    <rect x="${xOfT(40)}" y="${baseY-90}" width="${xOfT(60)-xOfT(40)}" height="90" fill="${accent}" opacity="0.12" rx="2"/>
    <line x1="${xt}" y1="${baseY-90}" x2="${xt}" y2="${baseY}" stroke="${color}" stroke-width="2.5"/>
    <circle cx="${xt}" cy="${baseY-90}" r="5" fill="${color}"/>
    <circle cx="${xt}" cy="${baseY-90}" r="2" fill="#fff"/>
    <line x1="${xPad}" y1="${baseY}" x2="${xPad+plotW}" y2="${baseY}" stroke="#94a3b8" stroke-width="1.5"/>
    ${[20,30,40,50,60,70,80].map(v=>`
      <text x="${xOfT(v)}" y="${baseY+16}" text-anchor="middle" font-size="10" fill="#64748b">${v}</text>
    `).join("")}
    <text x="${xt}" y="${baseY-95}" text-anchor="middle" font-size="10" fill="${color}" font-weight="800">T=${tv??'—'}</text>
  </svg>`;
}

// ─── TEXTOS ───────────────────────────────────────────────────────────────────
function buildInterpretation(){
  return [
    { cls: "normal",   range: "T ≤ 59 — Dentro dos limites normais",
      text: "Pontuações geralmente não associadas ao TEA. Indivíduos com autismo muito leve podem mostrar pontuações na extremidade superior do nível normal quando bem ajustados e com funcionalidade adaptativa relativamente intacta." },
    { cls: "leve",     range: "T 60–65 — Nível leve",
      text: "Indicam prejuízos clinicamente significativos com interferência leve a moderada nas interações sociais. Comuns em quadros do espectro autista e, ocasionalmente, em TDAH mais severo. Para pré-escolares, considerar Transtorno Específico de Linguagem (TEL) ou deficiência intelectual." },
    { cls: "moderado", range: "T 66–75 — Nível moderado",
      text: "Indicam prejuízos clinicamente significativos com interferência substancial nas interações. Típicos em TEA de gravidade moderada, incluindo diagnósticos DSM-IV (Autismo, TGD-SOE, Asperger) e DSM-5 (TEA, Transtorno de Comunicação Social)." },
    { cls: "severo",   range: "T ≥ 76 — Nível severo",
      text: "Indicam prejuízos clinicamente severos com interferência marcante nas interações diárias. Fortemente associados a Transtorno do Autismo, Síndrome de Asperger e TGD-SOE mais severos. É comum que pontuações se atenuem entre a idade pré-escolar e escolar." },
  ];
}

// ─── RESOLVER CORES (necessário antes de gerar SVGs para PDF) ─────────────────
function resolverCores(){
  const root = document.documentElement;
  return {
    accent:      (getComputedStyle(root).getPropertyValue('--srs-accent').trim()       || '#1a56db'),
    accentLight: (getComputedStyle(root).getPropertyValue('--srs-accent-light').trim() || '#dbeafe'),
    accentDark:  (getComputedStyle(root).getPropertyValue('--srs-accent-dark').trim()  || '#1d4ed8'),
  };
}

// ─── GERAR HTML DO RELATÓRIO (reutilizável pelo db.js para PDF) ───────────────
function gerarHtmlRelatorio(result, cores){
  const form = getForm();
  if(!form) return '';

  // cores podem vir pré-resolvidas (para PDF) ou serem lidas ao vivo
  const c = cores || resolverCores();

  const scalesSorted = sortScalesLikePdf(form.scales);
  const missingByScale = countMissingByScale(form);
  const rows = scalesSorted.map(sc=>({
    key: sc.key, label: sc.label||sc.key,
    bruto: result.brutos?.[sc.key],
    t: result.tscores?.[sc.key]
  }));

  const paciente  = ($("#paciente")?.value || "—");
  const data      = ($("#data")?.value || "—");
  const avaliador = ($("#avaliador")?.value || "—");
  const formLabel = form.label || FORM_KEY;

  const totalRow = rows.find(r=>normalizeStr(r.label).includes("total")) || rows[rows.length-1];
  const tTotal = totalRow?.t;
  const { label: clsTotal, cls: clsCSS } = classificarT(tTotal);

  // Seções por escala — passa cores resolvidas para os SVGs
  const scaleSections = rows.map(r=>{
    const t = r.t==null ? null : Number(r.t);
    const ciA = t==null ? "—" : clamp(t-4,20,80);
    const ciB = t==null ? "—" : clamp(t+4,20,80);
    const missing = missingByScale[r.key]??0;
    const descKey = SCALE_ORDER_HINTS.find(h=>normalizeStr(r.label).includes(normalizeStr(h)))||r.label;
    const desc = SCALE_DESCRIPTIONS[descKey]||"";
    const { label: clsLbl, cls: clsCl } = classificarT(t);
    return `
    <div class="rep-scale-card" style="border:1.5px solid #e2e8f0;border-radius:14px;margin-bottom:16px;page-break-inside:avoid;break-inside:avoid;">
      <div class="rep-scale-card-header" style="background:${c.accentLight};padding:12px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid ${c.accent};border-radius:13px 13px 0 0;">
        <span style="font-size:14px;font-weight:800;color:${c.accentDark};">${escapeHtml(r.label)}</span>
        <span class="cls-badge ${clsCl}">${clsLbl}</span>
      </div>
      <div style="padding:14px 20px;display:grid;grid-template-columns:1fr 300px;gap:16px;align-items:center;">
        <div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">Pontuação bruta</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:800;color:${c.accentDark};">${r.bruto??'—'}</td></tr>
            <tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">Escore T</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:800;color:${c.accentDark};">${r.t??'—'}</td></tr>
            <tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">Itens sem resposta</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:800;color:${c.accentDark};">${missing}</td></tr>
            <tr><td style="padding:8px 10px;">Intervalo de confiança (±4)</td><td style="padding:8px 10px;text-align:right;font-weight:800;color:${c.accentDark};">[${ciA} – ${ciB}]</td></tr>
          </table>
        </div>
        <div>${svgBell(t, c.accent, c.accentLight)}</div>
        ${desc ? `<div style="font-size:13px;line-height:1.65;color:#374151;margin-top:12px;padding:14px 16px;background:#f8fafc;border-radius:10px;border-left:4px solid ${c.accent};grid-column:1 / -1;">${escapeHtml(desc)}</div>` : ''}
      </div>
    </div>`;
  }).join("");

  // Cards de interpretação com estilos inline (seguro para PDF)
  const interpStyles = {
    normal:   { bg:'#f0fdf4', border:'#86efac', badgeColor:'#15803d' },
    leve:     { bg:'#fefce8', border:'#fde047', badgeColor:'#a16207' },
    moderado: { bg:'#fff7ed', border:'#fdba74', badgeColor:'#c2410c' },
    severo:   { bg:'#fef2f2', border:'#fca5a5', badgeColor:'#b91c1c' },
  };
  const interpCards = buildInterpretation().map(i=>{
    const s = interpStyles[i.cls]||interpStyles.normal;
    return `
    <div style="border-radius:12px;padding:14px 16px;border:1.5px solid ${s.border};background:${s.bg};">
      <div style="display:inline-block;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;color:${s.badgeColor};">${i.range.split('—')[0].trim()}</div>
      <div style="font-size:12px;font-weight:700;margin-bottom:4px;color:#111;">${i.range.split('—')[1]?.trim()||''}</div>
      <div style="font-size:12px;line-height:1.6;color:#374151;">${i.text}</div>
    </div>`;
  }).join("");

  // Tabela de scores com estilos inline
  const scoreRows = rows.map(r=>{
    const {label:clsLbl, cls:clsCls} = classificarT(r.t);
    const isTotal = normalizeStr(r.label).includes("total");
    const rowBg = isTotal ? c.accentLight : '#fafafa';
    const rowWeight = isTotal ? '800' : '400';
    const rowColor = isTotal ? c.accentDark : 'inherit';
    return `<tr style="background:${rowBg};font-weight:${rowWeight};color:${rowColor};">
      <td style="padding:12px 14px;font-size:13px;vertical-align:middle;border-bottom:1px solid #e2e8f0;${isTotal?'border-top:2px solid '+c.accent+';':''}"><b>${escapeHtml(r.label)}</b></td>
      <td style="padding:12px 14px;font-size:13px;text-align:center;font-weight:700;vertical-align:middle;border-bottom:1px solid #e2e8f0;">${r.bruto??'—'}</td>
      <td style="padding:12px 14px;font-size:13px;text-align:center;font-weight:700;vertical-align:middle;border-bottom:1px solid #e2e8f0;">${r.t??'—'}</td>
      <td style="padding:12px 14px;font-size:13px;text-align:center;vertical-align:middle;border-bottom:1px solid #e2e8f0;"><span class="cls-badge ${clsCls}">${clsLbl}</span></td>
    </tr>`;
  }).join("");

  return `
  <div class="rep-wrapper" style="background:#fff;font-family:'DM Sans',Arial,sans-serif;">
    <div class="rep-header" style="background:linear-gradient(135deg,${c.accentDark} 0%,${c.accent} 100%);padding:32px 36px;color:#fff;display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:14px;">
        <img src="/logo.png" alt="Equilibrium" style="height:52px;width:auto;filter:brightness(0) invert(1);opacity:0.9;" onerror="this.style.display='none'">
        <div>
          <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px;">Equilibrium</div>
          <div style="font-size:13px;opacity:0.8;font-weight:500;">Neuropsicologia</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:18px;font-weight:800;letter-spacing:-0.3px;">SRS-2 — Escala de Responsividade Social</div>
        <div style="font-size:13px;opacity:0.8;margin-top:3px;">${escapeHtml(formLabel)}</div>
      </div>
    </div>

    <div style="background:${c.accentLight};border-bottom:2px solid ${c.accent};padding:16px 36px;display:flex;gap:32px;flex-wrap:wrap;">
      <div style="display:flex;flex-direction:column;gap:2px;">
        <label style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:${c.accentDark};">Paciente</label>
        <span style="font-size:14px;font-weight:700;color:#111;">${escapeHtml(paciente)}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:2px;">
        <label style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:${c.accentDark};">Data de Avaliação</label>
        <span style="font-size:14px;font-weight:700;color:#111;">${escapeHtml(data)}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:2px;">
        <label style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:${c.accentDark};">Avaliador</label>
        <span style="font-size:14px;font-weight:700;color:#111;">${escapeHtml(avaliador)}</span>
      </div>
      ${tTotal != null ? `
      <div style="display:flex;flex-direction:column;gap:2px;">
        <label style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:${c.accentDark};">Resultado Geral</label>
        <span style="font-size:14px;font-weight:700;color:#111;"><span class="cls-badge ${clsCSS}" style="font-size:13px;">${clsTotal} (T=${tTotal})</span></span>
      </div>` : ''}
    </div>

    <div style="padding:32px 36px;">

      <div style="margin-bottom:36px;">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:${c.accent};margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid ${c.accentLight};display:flex;align-items:center;gap:8px;"><span style="display:inline-block;width:20px;height:3px;border-radius:2px;background:${c.accent};flex-shrink:0;"></span>Perfil de Escores T</div>
        <div style="border-radius:14px;border:1px solid #e2e8f0;background:#fff;">
          ${svgProfileChart(rows, c.accent, c.accentLight)}
        </div>
      </div>

      <div style="margin-bottom:36px;">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:${c.accent};margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid ${c.accentLight};display:flex;align-items:center;gap:8px;"><span style="display:inline-block;width:20px;height:3px;border-radius:2px;background:${c.accent};flex-shrink:0;"></span>Tabela de Resultados</div>
        <table style="width:100%;border-collapse:separate;border-spacing:0 4px;">
          <thead>
            <tr>
              <th style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.4px;color:${c.accentDark};padding:8px 14px;background:${c.accentLight};text-align:left;">Escala</th>
              <th style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.4px;color:${c.accentDark};padding:8px 14px;background:${c.accentLight};text-align:center;">Bruto</th>
              <th style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.4px;color:${c.accentDark};padding:8px 14px;background:${c.accentLight};text-align:center;">Escore T</th>
              <th style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.4px;color:${c.accentDark};padding:8px 14px;background:${c.accentLight};text-align:center;">Classificação</th>
            </tr>
          </thead>
          <tbody>${scoreRows}</tbody>
        </table>
      </div>

      <div style="margin-bottom:36px;">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:${c.accent};margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid ${c.accentLight};display:flex;align-items:center;gap:8px;"><span style="display:inline-block;width:20px;height:3px;border-radius:2px;background:${c.accent};flex-shrink:0;"></span>Detalhamento por Escala</div>
        ${scaleSections}
      </div>

      <div style="margin-bottom:36px;">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:${c.accent};margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid ${c.accentLight};display:flex;align-items:center;gap:8px;"><span style="display:inline-block;width:20px;height:3px;border-radius:2px;background:${c.accent};flex-shrink:0;"></span>Interpretação Clínica do Escore T</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          ${interpCards}
        </div>
      </div>

    </div>

    <div style="background:${c.accentLight};border-top:2px solid ${c.accent};padding:16px 36px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:${c.accentDark};font-weight:600;">
      <span>Equilibrium Neuropsicologia · Correção automatizada SRS-2</span>
      <span>Gerado em ${new Date().toLocaleDateString('pt-BR')}</span>
    </div>
  </div>`;
}

// ─── PREENCHER E ABRIR RELATÓRIO (visualização na tela) ───────────────────────
function abrirRelatorio(result){
  const overlay = $("#repOverlay");
  if(!overlay) return;

  const cores = resolverCores();
  const html = gerarHtmlRelatorio(result, cores);
  if(!html) return;

  const frame = overlay.querySelector(".srs-report-frame");
  if(frame) frame.innerHTML = html;
  overlay.classList.add("ativo");
}

// ─── GERAR PDF BLOB (para envio ao Drive via db.js) ───────────────────────────
// Uso no db.js:
//   const blob = await gerarPdfBlob(result);
//   // blob é um Blob PDF pronto para upload
async function gerarPdfBlob(result){
  if(typeof html2pdf === 'undefined') throw new Error('html2pdf não carregado');

  // 1. Resolve cores ANTES de criar o HTML (html2canvas não resolve CSS vars)
  const cores = resolverCores();

  // 2. Aguarda fontes carregadas
  await document.fonts.ready;

  // 3. Cria container temporário VISÍVEL e de tamanho fixo
  //    (não pode estar off-screen — html2canvas falha com left:-99999px)
  const wrap = document.createElement('div');
  wrap.style.cssText = [
    'position:fixed', 'top:0', 'left:0',
    'width:794px',           // A4 @ 96dpi
    'background:#fff',
    'z-index:2147483647',    // acima de tudo
    'pointer-events:none',
    'overflow:visible',
    'font-family:"DM Sans",Arial,sans-serif',
  ].join(';');
  wrap.innerHTML = gerarHtmlRelatorio(result, cores);
  document.body.appendChild(wrap);

  // 4. Pequena espera para render do DOM + imagens
  await new Promise(r => setTimeout(r, 300));

  try {
    const blob = await html2pdf()
      .set({
        margin:        [10, 10, 10, 10],
        filename:      'relatorio-srs2.pdf',
        image:         { type: 'jpeg', quality: 0.97 },
        html2canvas:   {
          scale:           2,
          useCORS:         true,
          allowTaint:      true,
          backgroundColor: '#ffffff',
          scrollX:         0,
          scrollY:         0,
          windowWidth:     794,
        },
        jsPDF:         { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:     { mode: ['avoid-all', 'css'] },
      })
      .from(wrap)
      .outputPdf('blob');
    return blob;
  } finally {
    document.body.removeChild(wrap);
  }
}

// ─── MODAL DE LOADING ─────────────────────────────────────────────────────────
function mostrarModalGerandoRelatorio(callback){
  const modal = $("#modalGerando");
  if(!modal){ callback(); return; }
  modal.classList.add("ativo");
  setTimeout(()=>{
    modal.classList.remove("ativo");
    callback();
  }, 1100);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  aplicarAcento();

  try {
    setSubtitle("Carregando regras…");
    await carregarRegras();
    const form = getForm();
    if(!form){
      setSubtitle(`ERRO: FORM_KEY inválida (${FORM_KEY})`);
    } else {
      setSubtitle(form.label || FORM_KEY);
    }

    // Data padrão = hoje
    const today = new Date().toISOString().slice(0,10);
    const dataEl = $("#data");
    if(dataEl) dataEl.value = today;

    renderItens();
    atualizarProgresso();

    $("#btnRecalc")?.addEventListener("click", ()=>{ calcularEExibir(); });
    $("#btnClear")?.addEventListener("click", ()=>{ limparTudo(); });

    // Botão Relatório
    $("#btnRelatorio")?.addEventListener("click", ()=>{
      const result = calcularEExibir();
      if(!result) return;
      mostrarModalGerandoRelatorio(()=>{ abrirRelatorio(result); });
    });

    // Botão Imprimir (dentro do overlay)
    $("#btnPrintRep")?.addEventListener("click", ()=>{ window.print(); });

    // Botão Fechar overlay
    $("#btnCloseRep")?.addEventListener("click", ()=>{
      $("#repOverlay")?.classList.remove("ativo");
    });

    // ─── Botão Enviar (modo paciente) ─────────────────────────────────────────
    const btnEnviar = $("#btnEnviar");
    if(btnEnviar){
      btnEnviar.addEventListener("click", async () => {

        // 1. Valida nome do paciente
        const nomePaciente = ($("#paciente")?.value || "").trim();
        if(!nomePaciente){
          alert("Por favor, preencha o nome do paciente antes de enviar.");
          return;
        }

        // 2. Calcula resultados
        const result = calcularEExibir();
        if(!result) return;

        // 3. Avisa se há itens sem resposta
        if(result.missing > 0){
          const ok = confirm(`Atenção: ${result.missing} item(s) sem resposta.\nDeseja enviar mesmo assim?`);
          if(!ok) return;
        }

        // 4. Desabilita botão e mostra cortina de carregamento
        btnEnviar.disabled = true;
        const cortina    = $("#cortina");
        const cortinaMsg = $("#cortinaMsg");
        if(cortina) cortina.classList.add("ativa");
        if(cortinaMsg) cortinaMsg.textContent = "Gerando relatório…";

        try {
          // 5. Gera o PDF como Blob usando a função robusta (container visível, fontes carregadas)
          if(cortinaMsg) cortinaMsg.textContent = "Gerando PDF…";
          const pdfBlob = await gerarPdfBlob(result);

          // 6. Converte Blob → base64 para envio via Google Script
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload  = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(pdfBlob);
          });

          // 7. Prepara dados para o Google Script
          const form     = getForm();
          const dataAval = ($("#data")?.value || new Date().toISOString().slice(0,10));
          const payload  = {
            paciente:   nomePaciente,
            data:       dataAval,
            avaliador:  ($("#avaliador")?.value || "Paciente"),
            formulario: (form?.label || FORM_KEY),
            brutos:     result.brutos,
            tscores:    result.tscores,
            pdfBase64:  base64,
            filename:   `SRS2_${nomePaciente.replace(/\s+/g,"_")}_${dataAval}.pdf`,
          };

          // 8. Envia para o Google Script (Drive)
          if(cortinaMsg) cortinaMsg.textContent = "Enviando para o Drive…";
          if(typeof URL_DO_GOOGLE_SCRIPT !== "undefined" && URL_DO_GOOGLE_SCRIPT){
            const resp = await fetch(URL_DO_GOOGLE_SCRIPT, {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify(payload),
            });
            if(!resp.ok) throw new Error(`Erro HTTP ${resp.status} ao enviar para o Drive.`);
          }

          // 9. Salva registro no Firestore (se Firebase disponível)
          if(typeof DB !== "undefined" && DB.isReady && DB.isReady()){
            if(cortinaMsg) cortinaMsg.textContent = "Salvando registro…";
            await DB.saveRelatorio({
              paciente:   nomePaciente,
              data:       dataAval,
              formulario: (form?.label || FORM_KEY),
              brutos:     result.brutos,
              tscores:    result.tscores,
              missing:    result.missing,
            });
          }

          // 10. Sucesso — mostra tela de confirmação
          if(cortina) cortina.classList.remove("ativa");
          const appShell = $("#appShell");
          if(appShell){
            appShell.innerHTML = `
              <div class="success-screen">
                <div class="success-card">
                  <div class="success-icon">✅</div>
                  <h1>Respostas enviadas!</h1>
                  <p>O relatório de <b>${escapeHtml(nomePaciente)}</b> foi gerado e salvo com sucesso.</p>
                  <p class="success-note">Você já pode fechar esta página.</p>
                </div>
              </div>`;
          }

        } catch(err){
          console.error("Erro ao enviar:", err);
          if(cortina) cortina.classList.remove("ativa");
          btnEnviar.disabled = false;
          alert("Ocorreu um erro ao enviar o relatório:\n" + (err.message || String(err)));
        }
      });
    }
    // ──────────────────────────────────────────────────────────────────────────

  } catch(err){
    console.error(err);
    setSubtitle("Falha ao carregar regras.");
    const container = $("#itens");
    if(container) container.innerHTML = `
      <div class="srs-hint" style="color:#dc2626">
        Erro: ${escapeHtml(err.message || String(err))}<br><br>
        Confira se o arquivo existe em: <b>../data/srs2_rules.json</b>
      </div>`;
  }
});
