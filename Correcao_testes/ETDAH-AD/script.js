console.log("SCRIPT ETDAH-AD CARREGADO v1 — RELATÓRIO COM MODAL");
const LAUDOS_KEY = "empresa_laudos_etdahad";

/* ═══════════════════════════════════
   DEFINIÇÃO DOS 34 ITENS E DOMÍNIOS
   ═══════════════════════════════════ */
const ITENS_ETDAH = [
  // Desatenção (DA) — 9 itens
  { n: 1,  texto: "Deixa de prestar atenção a detalhes ou comete erros por descuido em atividades do dia a dia.", dom: "DA" },
  { n: 2,  texto: "Tem dificuldade para manter a atenção em tarefas ou atividades prolongadas.", dom: "DA" },
  { n: 3,  texto: "Parece não escutar quando lhe dirigem a palavra diretamente.", dom: "DA" },
  { n: 4,  texto: "Não segue instruções até o fim e não termina tarefas ou obrigações.", dom: "DA" },
  { n: 5,  texto: "Tem dificuldade para organizar tarefas e atividades do cotidiano.", dom: "DA" },
  { n: 6,  texto: "Evita ou reluta em se envolver em tarefas que exijam esforço mental prolongado.", dom: "DA" },
  { n: 7,  texto: "Perde coisas necessárias para tarefas ou atividades (chaves, celular, documentos).", dom: "DA" },
  { n: 8,  texto: "É facilmente distraído(a) por estímulos externos ou pensamentos não relacionados.", dom: "DA" },
  { n: 9,  texto: "É esquecido(a) em relação a atividades diárias, compromissos ou obrigações.", dom: "DA" },

  // Hiperatividade / Impulsividade (HI) — 9 itens
  { n: 10, texto: "Mexe as mãos ou os pés ou se remexe na cadeira com frequência.", dom: "HI" },
  { n: 11, texto: "Levanta-se em situações em que se espera que permaneça sentado(a).", dom: "HI" },
  { n: 12, texto: "Sente-se inquieto(a) internamente, mesmo quando está parado(a).", dom: "HI" },
  { n: 13, texto: "Tem dificuldade para se envolver em atividades de lazer de forma calma.", dom: "HI" },
  { n: 14, texto: "Sente-se \"a mil\" ou age como se estivesse \"ligado(a) a um motor\".", dom: "HI" },
  { n: 15, texto: "Fala demais em situações sociais ou profissionais.", dom: "HI" },
  { n: 16, texto: "Responde antes que a pergunta seja concluída ou antecipa respostas.", dom: "HI" },
  { n: 17, texto: "Tem dificuldade para esperar a sua vez (filas, conversas, trânsito).", dom: "HI" },
  { n: 18, texto: "Interrompe ou se intromete em conversas ou atividades de outras pessoas.", dom: "HI" },

  // Autorregulação Emocional (RE) — 8 itens
  { n: 19, texto: "Tem dificuldade em controlar a raiva ou irritabilidade.", dom: "RE" },
  { n: 20, texto: "Fica facilmente frustrado(a) diante de obstáculos ou contrariedades.", dom: "RE" },
  { n: 21, texto: "Reage de forma exagerada a situações emocionais do cotidiano.", dom: "RE" },
  { n: 22, texto: "Apresenta mudanças bruscas de humor ao longo do dia.", dom: "RE" },
  { n: 23, texto: "Tem baixa tolerância ao estresse ou à pressão.", dom: "RE" },
  { n: 24, texto: "É impaciente com os outros, irritando-se facilmente.", dom: "RE" },
  { n: 25, texto: "Fica facilmente perturbado(a) por situações que outros consideram menores.", dom: "RE" },
  { n: 26, texto: "Tem dificuldade em se acalmar quando está irritado(a) ou ansioso(a).", dom: "RE" },

  // Funcionamento Executivo (FE) — 8 itens
  { n: 27, texto: "Tem dificuldade em planejar e priorizar tarefas importantes.", dom: "FE" },
  { n: 28, texto: "Tem dificuldade para iniciar tarefas, especialmente as que exigem organização.", dom: "FE" },
  { n: 29, texto: "Procrastina tarefas importantes, deixando para a última hora.", dom: "FE" },
  { n: 30, texto: "Tem dificuldade em gerenciar o tempo de forma eficiente.", dom: "FE" },
  { n: 31, texto: "Esquece compromissos, prazos ou obrigações com frequência.", dom: "FE" },
  { n: 32, texto: "Tem dificuldade em manter rotinas ou hábitos consistentes.", dom: "FE" },
  { n: 33, texto: "Perde o foco em conversas longas ou reuniões.", dom: "FE" },
  { n: 34, texto: "Tem dificuldade em concluir projetos que iniciou.", dom: "FE" },
];

/* Mapeamento domínio → info */
const DOMINIOS = {
  DA: { label: "Desatenção",                     itens: [1,2,3,4,5,6,7,8,9],           max: 27, corte: 14 },
  HI: { label: "Hiperatividade / Impulsividade", itens: [10,11,12,13,14,15,16,17,18],   max: 27, corte: 14 },
  RE: { label: "Autorregulação Emocional",        itens: [19,20,21,22,23,24,25,26],       max: 24, corte: 12 },
  FE: { label: "Funcionamento Executivo",          itens: [27,28,29,30,31,32,33,34],       max: 24, corte: 12 },
};
const TOTAL_MAX = 102;
const TOTAL_CORTE = 46;

/* ═══════════════════════════════════
   CLASSIFICAÇÃO INVERTIDA
   (alto = indicativo/vermelho)
   ═══════════════════════════════════ */
function classificar(soma, max) {
  const pct = (soma / max) * 100;
  if (pct >= 80) return "Muito Indicativo";
  if (pct >= 60) return "Indicativo";
  if (pct >= 40) return "Moderado";
  if (pct >= 20) return "Leve";
  return "Não Indicativo";
}

function corClassificacao(cl) {
  switch (cl) {
    case "Muito Indicativo": return "#991b1b";
    case "Indicativo":       return "#dc2626";
    case "Moderado":         return "#ea580c";
    case "Leve":             return "#64748b";
    case "Não Indicativo":   return "#059669";
    default:                 return "#64748b";
  }
}

function bgClassificacao(cl) {
  switch (cl) {
    case "Muito Indicativo": return "#fecaca";
    case "Indicativo":       return "#fee2e2";
    case "Moderado":         return "#ffedd5";
    case "Leve":             return "#f1f5f9";
    case "Não Indicativo":   return "#d1fae5";
    default:                 return "#f1f5f9";
  }
}

function badgeClassificacao(cl) {
  const cor = corClassificacao(cl);
  const bg = bgClassificacao(cl);
  return `<span class="cl-badge" style="background:${bg};color:${cor};font-weight:700;padding:3px 10px;border-radius:8px;font-size:11px">${cl}</span>`;
}

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
  return { anos, meses };
}

function formatarData(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function atualizarIdade() {
  const nasc = document.getElementById("dataNascimento")?.value;
  const apl = document.getElementById("dataAplicacao")?.value;
  const idade = calcularIdade(nasc, apl);
  const el = document.getElementById("idadeCalculada");
  if (el) {
    if (idade) {
      const fora = idade.anos < 12 || idade.anos > 87;
      el.textContent = `Idade calculada: ${idade.anos} anos e ${idade.meses} meses` + (fora ? " — ⚠️ Fora da faixa etária do ETDAH-AD (12–87 anos)" : "");
    } else {
      el.textContent = "";
    }
  }
}
window.atualizarIdade = atualizarIdade;

function insertObs(text) {
  const ta = document.getElementById("obsComportamentais");
  if (!ta) return;
  ta.value += (ta.value ? ". " : "") + text;
  ta.focus();
}
window.insertObs = insertObs;

function getLaudos() { return JSON.parse(localStorage.getItem(LAUDOS_KEY) || "[]"); }
function setLaudos(arr) { localStorage.setItem(LAUDOS_KEY, JSON.stringify(arr)); }

/* ═══════════════════════════════════
   INICIALIZAÇÃO DA TABELA DE ITENS
   ═══════════════════════════════════ */
const COR_DOMINIO = {
  DA: "#dbeafe",
  HI: "#fef3c7",
  RE: "#fce7f3",
  FE: "#ede9fe",
};

const LABEL_DOMINIO = {
  DA: "Desatenção",
  HI: "Hiperatividade / Impulsividade",
  RE: "Autorregulação Emocional",
  FE: "Funcionamento Executivo",
};

function renderTabelaItens() {
  const tbody = document.getElementById("tbodyItens");
  if (!tbody) return;

  let domAtual = "";
  tbody.innerHTML = ITENS_ETDAH.map(item => {
    const bg = COR_DOMINIO[item.dom] || "#fff";
    let header = "";
    if (item.dom !== domAtual) {
      domAtual = item.dom;
      header = `<tr><td colspan="3" style="background:${bg};font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:.5px;padding:8px 12px;color:#1e40af">${LABEL_DOMINIO[item.dom]}</td></tr>`;
    }
    return header + `<tr style="background:${bg}15">
      <td style="font-weight:700;color:#64748b;font-size:12px">${item.n}</td>
      <td style="font-size:12px">${item.texto}</td>
      <td class="center">
        <select id="item_${item.n}" style="width:56px;padding:5px 4px;border-radius:8px;border:1px solid #e2e8f0;font-size:13px;font-weight:600;text-align:center;font-family:inherit;outline:none;">
          <option value="">—</option>
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
      </td>
    </tr>`;
  }).join("");
}

/* ═══════════════════════════════════
   CÁLCULO DOS DOMÍNIOS
   ═══════════════════════════════════ */
function calcularDominios() {
  const result = {};
  let totalSoma = 0;
  let algumRespondido = false;

  for (const [key, dom] of Object.entries(DOMINIOS)) {
    let soma = 0;
    let nenhumRespondido = true;
    for (const n of dom.itens) {
      const el = document.getElementById(`item_${n}`);
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
      algumRespondido = true;
    }
  }

  result.total = algumRespondido ? totalSoma : null;
  return result;
}

/* ═══════════════════════════════════
   LOADING E MODAL (estilo WAIS)
   ═══════════════════════════════════ */
function showLoading(msg) {
  let ov = document.getElementById("loadingOverlay");
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "loadingOverlay";
    ov.className = "loading-overlay";
    document.body.appendChild(ov);
  }
  ov.innerHTML = `<div class="loading-card">
    <div class="loading-spinner"></div>
    <div class="loading-title">${msg || "Gerando relatório..."}</div>
    <div class="loading-sub">Processando dados e montando relatório</div>
  </div>`;
  ov.style.display = "flex";
}

function hideLoading() {
  const ov = document.getElementById("loadingOverlay");
  if (ov) ov.style.display = "none";
}

function openReportModal() {
  const rel = document.getElementById("relatorio");
  if (!rel) return;

  let backdrop = document.getElementById("reportModal");
  if (backdrop) backdrop.remove();

  backdrop = document.createElement("div");
  backdrop.id = "reportModal";
  backdrop.className = "report-modal-backdrop";

  const paciente = window.Integration ? Integration.getPacienteAtual() : null;
  const btnVoltar = paciente ? `<button class="toolbar-btn toolbar-btn-voltar" onclick="voltarParaPaciente()">👤 Voltar ao Paciente</button>` : "";

  backdrop.innerHTML = `
    <div class="report-modal">
      <div class="report-modal-toolbar no-print">
        <div class="toolbar-title">📄 Relatório ETDAH-AD</div>
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

  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeReportModal();
  });
  document.addEventListener("keydown", _escHandler);
}

function _escHandler(e) {
  if (e.key === "Escape") closeReportModal();
}

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
window.closeReportModal = closeReportModal;

function voltarParaPaciente() {
  let paciente = null;
  try { const raw = sessionStorage.getItem("pacienteAtual"); if (raw) paciente = JSON.parse(raw); } catch (e) {}
  if (!paciente && window.Integration) paciente = Integration.getPacienteAtual();
  if (paciente?.id) {
    closeReportModal();
    location.href = `/Pacientes/perfil.html?id=${paciente.id}`;
  }
}
window.voltarParaPaciente = voltarParaPaciente;

/* ═══════════════════════════════════
   GRÁFICO DE BARRAS (domínios)
   ═══════════════════════════════════ */
function renderBarrasDominios(scores) {
  let html = `<div style="font-size:10px;color:#94a3b8;margin-bottom:6px;padding-left:215px;display:flex;justify-content:space-between"><span>0</span><span>Max</span></div>`;

  for (const [key, dom] of Object.entries(DOMINIOS)) {
    const val = scores[key];
    const maxV = dom.max;
    const corte = dom.corte;
    const pctCorte = (corte / maxV) * 100;

    if (val == null) {
      html += `<div style="margin-bottom:10px">
        <div style="font-size:9px;font-weight:800;color:#1e40af;text-transform:uppercase;letter-spacing:.8px;margin-bottom:2px">${dom.label} <span style="color:#94a3b8;font-weight:400">(corte≥${corte}, max${maxV})</span></div>
        <div class="bar-row"><span class="bar-code" style="width:210px"></span><div class="bar-track" style="flex:1;height:20px;background:#e2e8f0;border-radius:4px"><span style="position:relative;top:2px;left:6px;font-size:10px;color:#94a3b8">—</span></div></div>
      </div>`;
      continue;
    }

    const pct = Math.min((val / maxV) * 100, 100);
    const cl = classificar(val, maxV);
    const barCor = corClassificacao(cl);

    html += `<div style="margin-bottom:10px">
      <div style="font-size:9px;font-weight:800;color:#1e40af;text-transform:uppercase;letter-spacing:.8px;margin-bottom:2px">${dom.label} <span style="color:#94a3b8;font-weight:400">(corte≥${corte}, max${maxV})</span></div>
      <div class="bar-row">
        <div class="bar-track" style="flex:1;margin-right:8px;height:20px;background:#e2e8f0;border-radius:4px;position:relative;overflow:visible;">
          <div style="position:absolute;top:0;bottom:0;left:${pctCorte}%;width:1.5px;background:rgba(220,38,38,.4);z-index:1"></div>
          <div style="position:absolute;left:0;top:2px;bottom:2px;width:${pct}%;background:${barCor};border-radius:3px;transition:width .3s;z-index:2"></div>
        </div>
        <span style="width:28px;font-size:13px;font-weight:800;color:#0f172a">${val}</span>
        <span style="width:80px;text-align:right">${badgeClassificacao(cl)}</span>
      </div>
    </div>`;
  }

  // Total
  const totalVal = scores.total;
  if (totalVal != null) {
    const pct = Math.min((totalVal / TOTAL_MAX) * 100, 100);
    const cl = classificar(totalVal, TOTAL_MAX);
    const barCor = corClassificacao(cl);
    html += `<div style="margin-top:8px;border-top:1px solid #e2e8f0;padding-top:8px">
      <div style="font-size:9px;font-weight:800;color:#1e40af;text-transform:uppercase;letter-spacing:.8px;margin-bottom:2px">PONTUAÇÃO TOTAL <span style="color:#94a3b8;font-weight:400">(corte≥${TOTAL_CORTE}, max${TOTAL_MAX})</span></div>
      <div class="bar-row">
        <div class="bar-track" style="flex:1;margin-right:8px;height:24px;background:#e2e8f0;border-radius:4px;position:relative;overflow:visible">
          <div style="position:absolute;top:0;bottom:0;left:${(TOTAL_CORTE/TOTAL_MAX)*100}%;width:1.5px;background:rgba(220,38,38,.4);z-index:1"></div>
          <div style="position:absolute;left:0;top:2px;bottom:2px;width:${pct}%;background:${barCor};border-radius:3px;z-index:2"></div>
        </div>
        <span style="width:28px;font-size:14px;font-weight:900;color:#0f172a">${totalVal}</span>
        <span style="width:80px;text-align:right">${badgeClassificacao(cl)}</span>
      </div>
    </div>`;
  }

  return `<div style="padding:4px 0">${html}</div>`;
}

/* ═══════════════════════════════════
   TABELA DE RESULTADOS
   ═══════════════════════════════════ */
function renderTabelaResultados(scores) {
  const domOrder = ["DA", "HI", "RE", "FE"];

  const rows = domOrder.map((key, i) => {
    const dom = DOMINIOS[key];
    const val = scores[key];
    if (val == null) return `<tr${i%2?' class="alt"':''}><td style="font-weight:700">${dom.label}</td><td class="ctr">—</td><td class="ctr">—</td><td class="ctr">—</td><td>—</td></tr>`;

    const pctMax = Math.round((val / dom.max) * 100);
    const cl = classificar(val, dom.max);
    const acima = val >= dom.corte;

    return `<tr${i%2?' class="alt"':''} style="${acima ? 'background:#fee2e280' : ''}">
      <td style="font-weight:700">${dom.label}</td>
      <td class="ctr" style="font-weight:800">${val} <span style="color:#94a3b8;font-size:10px">/ ${dom.max}</span></td>
      <td class="ctr">${pctMax}%</td>
      <td class="ctr">${acima ? '<span style="color:#dc2626;font-weight:700">SIM</span>' : '<span style="color:#059669">NÃO</span>'}</td>
      <td>${badgeClassificacao(cl)}</td>
    </tr>`;
  }).join("");

  // Total
  const totalVal = scores.total;
  let totalRow = "";
  if (totalVal != null) {
    const pctTotal = Math.round((totalVal / TOTAL_MAX) * 100);
    const clTotal = classificar(totalVal, TOTAL_MAX);
    const acimaTotal = totalVal >= TOTAL_CORTE;
    totalRow = `<tr style="background:${acimaTotal ? '#fecaca' : '#dbeafe'}">
      <td style="font-weight:900;color:#1e40af">TOTAL</td>
      <td class="ctr" style="font-weight:900;font-size:15px;color:#1e40af">${totalVal} <span style="color:#94a3b8;font-size:10px">/ ${TOTAL_MAX}</span></td>
      <td class="ctr" style="font-weight:700">${pctTotal}%</td>
      <td class="ctr">${acimaTotal ? '<span style="color:#dc2626;font-weight:800">SIM</span>' : '<span style="color:#059669;font-weight:700">NÃO</span>'}</td>
      <td>${badgeClassificacao(clTotal)}</td>
    </tr>`;
  }

  return `<div style="border-radius:10px;border:1px solid #e2e8f0;overflow:hidden">
    <table class="rpt-tbl">
      <thead><tr>
        <th>Domínio</th>
        <th class="ctr">Pontuação</th>
        <th class="ctr">% Máximo</th>
        <th class="ctr">Acima do Corte</th>
        <th>Classificação</th>
      </tr></thead>
      <tbody>${rows}${totalRow}</tbody>
    </table>
  </div>`;
}

/* ═══════════════════════════════════
   DETALHAMENTO POR ITEM
   ═══════════════════════════════════ */
function renderDetalhamentoItens() {
  const domOrder = ["DA", "HI", "RE", "FE"];
  let html = "";

  for (const key of domOrder) {
    const dom = DOMINIOS[key];
    const itens = ITENS_ETDAH.filter(i => i.dom === key);
    const bg = COR_DOMINIO[key];

    const rows = itens.map((item, i) => {
      const el = document.getElementById(`item_${item.n}`);
      const val = el && el.value !== "" ? parseInt(el.value, 10) : null;
      const valStr = val !== null ? val : "—";
      const barW = val !== null ? (val / 3) * 100 : 0;
      const barCol = val !== null ? (val >= 2 ? "#dc2626" : val >= 1 ? "#f59e0b" : "#059669") : "#e2e8f0";

      return `<tr${i%2?' class="alt"':''}>
        <td style="font-weight:700;color:#64748b;font-size:11px;width:30px">${item.n}</td>
        <td style="font-size:11px">${item.texto}</td>
        <td class="ctr" style="font-weight:800;width:40px">${valStr}</td>
        <td style="width:60px"><div style="height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden"><div style="height:100%;width:${barW}%;background:${barCol};border-radius:4px"></div></div></td>
      </tr>`;
    }).join("");

    html += `<div style="margin-bottom:16px">
      <div style="font-size:10px;font-weight:800;color:#1e40af;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;padding:4px 8px;background:${bg};border-radius:6px">${dom.label}</div>
      <div style="border-radius:8px;border:1px solid #e2e8f0;overflow:hidden">
        <table class="rpt-tbl"><tbody>${rows}</tbody></table>
      </div>
    </div>`;
  }

  return html;
}

/* ═══════════════════════════════════
   TEXTO INTERPRETATIVO
   ═══════════════════════════════════ */
function gerarTextoInterpretativo(data) {
  const { nome, scores } = data;
  const primeiro = nome.split(" ")[0] || nome;
  const total = scores.total;

  let texto = `O ETDAH-AD (Escala de Transtorno do Déficit de Atenção e Hiperatividade — Adolescentes e Adultos) foi aplicado como instrumento de rastreio de sintomas de TDAH. `;

  if (total == null) {
    texto += `Não foi possível calcular os resultados pois nenhum item foi respondido.`;
    return texto;
  }

  const clTotal = classificar(total, TOTAL_MAX);
  const acimaTotal = total >= TOTAL_CORTE;
  texto += `${primeiro} obteve pontuação total de ${total} pontos (de ${TOTAL_MAX} possíveis), classificada como "${clTotal}". `;

  if (acimaTotal) {
    texto += `Esse escore supera o ponto de corte clínico (≥${TOTAL_CORTE}), sugerindo presença significativa de sintomas compatíveis com TDAH, o que requer investigação diagnóstica complementar. `;
  } else {
    texto += `Esse escore está abaixo do ponto de corte clínico (≥${TOTAL_CORTE}), não configurando rastreio positivo para TDAH no momento da avaliação. `;
  }

  // Domínios acima do corte
  const domOrder = ["DA", "HI", "RE", "FE"];
  const acima = domOrder.filter(k => scores[k] != null && scores[k] >= DOMINIOS[k].corte);
  const abaixo = domOrder.filter(k => scores[k] != null && scores[k] < DOMINIOS[k].corte);

  if (acima.length > 0) {
    texto += `\n\nOs domínios com pontuação acima do ponto de corte foram: ${acima.map(k => `${DOMINIOS[k].label} (${scores[k]} pontos; corte≥${DOMINIOS[k].corte}; classificação: ${classificar(scores[k], DOMINIOS[k].max)})`).join("; ")}. `;
    texto += `Esses resultados sugerem presença de sintomas clinicamente significativos nessas dimensões, indicando necessidade de avaliação diagnóstica individualizada. `;
  }

  if (abaixo.length > 0 && acima.length > 0) {
    texto += `Não foram identificados escores acima do ponto de corte nos domínios: ${abaixo.map(k => DOMINIOS[k].label).join(", ")}. `;
  }

  if (acima.length === 0) {
    texto += `\n\nNenhum domínio atingiu o ponto de corte clínico. `;
  }

  // Análise específica DA vs HI
  if (scores.DA != null && scores.HI != null) {
    const diff = Math.abs(scores.DA - scores.HI);
    if (diff >= 8) {
      const predominante = scores.DA > scores.HI ? "Desatenção" : "Hiperatividade/Impulsividade";
      texto += `\n\nObserva-se discrepância expressiva (${diff} pontos) entre os domínios de Desatenção e Hiperatividade/Impulsividade, sugerindo apresentação predominantemente do tipo ${predominante === "Desatenção" ? "desatento" : "hiperativo-impulsivo"}. `;
    }
  }

  texto += `\n\nOs resultados do ETDAH-AD devem ser interpretados de forma integrada com os demais dados clínicos, histórico de desenvolvimento, observações comportamentais e outros instrumentos aplicados. O instrumento possui função de rastreio e avaliação dimensional, não sendo suficiente para estabelecer diagnóstico por si só.`;

  return texto;
}

/* ═══════════════════════════════════
   LEGENDA DE CLASSIFICAÇÕES
   ═══════════════════════════════════ */
function renderLegenda() {
  const cls = ["Muito Indicativo", "Indicativo", "Moderado", "Leve", "Não Indicativo"];
  return `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;font-size:10px;align-items:center">
    <span style="color:#64748b;font-weight:600">Classificações:</span>
    ${cls.map(c => `<span style="display:inline-flex;align-items:center;gap:3px"><span style="width:8px;height:8px;border-radius:50%;background:${corClassificacao(c)}"></span>${c}</span>`).join("")}
    <span style="color:#94a3b8;margin-left:8px">| Linha vermelha = ponto de corte clínico</span>
  </div>`;
}

/* ═══════════════════════════════════
   FUNÇÃO PRINCIPAL: GERAR RELATÓRIO
   ═══════════════════════════════════ */
function gerarRelatorio() {
  const nome = document.getElementById("nome")?.value?.trim() || "";
  const nasc = document.getElementById("dataNascimento")?.value || "";
  const apl  = document.getElementById("dataAplicacao")?.value  || "";
  const sexo = document.getElementById("sexo")?.value || "";
  const escolaridade = document.getElementById("escolaridade")?.value || "";
  const profNome = document.getElementById("profNome")?.value?.trim() || "";
  const profCRP  = document.getElementById("profCRP")?.value?.trim() || "";
  const profEspecialidade = document.getElementById("profEspecialidade")?.value?.trim() || "";
  const motivo = document.getElementById("motivo")?.value?.trim() || "";
  const obsComportamentais = document.getElementById("obsComportamentais")?.value?.trim() || "";
  const recomendacoes = document.getElementById("recomendacoes")?.value?.trim() || "";

  if (!nome) { alert("Informe o nome do avaliado."); return; }
  if (!nasc) { alert("Informe a data de nascimento."); return; }
  if (!apl)  { alert("Informe a data de aplicação."); return; }

  // Mostrar loading
  showLoading("Gerando relatório ETDAH-AD...");

  // Simular processamento (para a máscara de carregamento aparecer)
  setTimeout(() => {
    try {
      const idade = calcularIdade(nasc, apl);
      const scores = calcularDominios();

      if (scores.total == null) {
        hideLoading();
        alert("Preencha pelo menos alguns itens para gerar o relatório.");
        return;
      }

      const data = {
        nome, nasc, apl, sexo, escolaridade, idade, scores,
        profNome, profCRP, profEspecialidade, motivo, obsComportamentais, recomendacoes,
      };

      montarRelatorio(data);

      // Salvar
      const rel = document.getElementById("relatorio");
      const laudos = getLaudos();
      laudos.unshift({
        nome,
        dataAplicacao: formatarData(apl),
        idade: idade ? `${idade.anos}a ${idade.meses}m` : "—",
        htmlRelatorio: rel.innerHTML,
        ts: Date.now(),
      });
      setLaudos(laudos);

      // Salvar no Firebase se integração disponível
      if (window.Integration && Integration.getPacienteAtual()) {
        const resumo = Object.entries(DOMINIOS).map(([k, d]) => `${d.label}: ${scores[k] ?? "—"}`).join(" | ");
        Integration.salvarTesteNoFirebase("etdah-ad", {
          resumo: `Total: ${scores.total} — ${resumo}`,
          scores,
          classificacao: classificar(scores.total, TOTAL_MAX),
          htmlRelatorio: rel.innerHTML,
        });
      }

      hideLoading();
      openReportModal();
    } catch (e) {
      hideLoading();
      console.error("Erro ao gerar relatório:", e);
      alert("Erro ao gerar relatório. Verifique os dados e tente novamente.");
    }
  }, 600);
}
window.gerarRelatorio = gerarRelatorio;

/* ═══════════════════════════════════
   MONTAR RELATÓRIO HTML
   ═══════════════════════════════════ */
function montarRelatorio(data) {
  const rel = document.getElementById("relatorio");
  if (!rel) return;

  const { nome, nasc, apl, sexo, escolaridade, idade, scores,
    profNome, profCRP, profEspecialidade, motivo, obsComportamentais, recomendacoes } = data;

  const textoInterp = gerarTextoInterpretativo(data);
  const dataHoje = new Date().toLocaleDateString("pt-BR");
  const idadeStr = idade ? `${idade.anos}a ${idade.meses}m` : "—";

  const barrasHTML = renderBarrasDominios(scores);
  const tabelaHTML = renderTabelaResultados(scores);
  const detalheHTML = renderDetalhamentoItens();
  const legendaHTML = renderLegenda();

  rel.innerHTML = `<div class="report">
    <!-- HEADER -->
    <div class="rpt-hdr">
      <div class="deco1"></div><div class="deco2"></div>
      <div class="rpt-hdr-inner">
        <div style="display:flex;align-items:center;gap:16px">
          <img class="hdr-logo" src="/logo2.png" alt="Logo" onerror="this.style.display='none'">
          <div>
            <div class="kicker">Relatório Neuropsicológico</div>
            <div class="title">ETDAH-AD</div>
            <div class="subtitle">Escala de Transtorno do Déficit de Atenção e Hiperatividade</div>
            <div class="sub2">Adolescentes e Adultos · Autoavaliação · 12–87 anos</div>
          </div>
        </div>
        <div class="rpt-hdr-badge">
          <div class="lbl">Idade</div>
          <div class="val">${idadeStr}</div>
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
        </div>
        ${profNome ? `<div class="rpt-info sep"></div><div class="rpt-info"><div><span class="lbl" style="color:#1a56db">Profissional:</span> <span class="val bold">${profNome}${profCRP ? ` — ${profCRP}` : ""}</span></div><div><span class="lbl" style="color:#1a56db">Especialidade:</span> <span class="val">${profEspecialidade || "—"}</span></div></div>` : ""}
        ${motivo ? `<div class="rpt-info sep"></div><div><span class="lbl" style="color:#1a56db">Motivo do encaminhamento:</span> <span class="val">${motivo}</span></div>` : ""}
      </div>

      <!-- 2. OBSERVAÇÕES -->
      ${obsComportamentais ? `<div class="rpt-sh"><span class="num" style="background:#7c3aed">2</span><span class="sh-title">Observações Comportamentais</span></div><div class="rpt-box-obs no-break">${obsComportamentais}</div>` : ""}

      <!-- 3. PERFIL DOS DOMÍNIOS (BARRAS) -->
      <div class="rpt-sh"><span class="num">3</span><span class="sh-title">Perfil dos Domínios</span><div class="sh-sub">Visualização gráfica com pontos de corte clínicos</div></div>
      <div class="rpt-box no-break">
        ${barrasHTML}
        ${legendaHTML}
      </div>

      <!-- 4. RESULTADOS POR DOMÍNIO -->
      <div class="rpt-sh"><span class="num">4</span><span class="sh-title">Resultados por Domínio</span><div class="sh-sub">Pontuação, percentual e classificação clínica</div></div>
      <div class="no-break">${tabelaHTML}</div>

      <!-- 5. DETALHAMENTO POR ITEM -->
      <div class="rpt-sh"><span class="num">5</span><span class="sh-title">Detalhamento por Item</span><div class="sh-sub">Respostas individuais por domínio</div></div>
      ${detalheHTML}

      <!-- 6. INTERPRETAÇÃO -->
      <div class="rpt-sh"><span class="num">6</span><span class="sh-title">Interpretação Clínica</span></div>
      <div class="rpt-interp">${textoInterp.split("\n\n").map(p => `<p>${p}</p>`).join("")}</div>

      <!-- 7. RECOMENDAÇÕES -->
      ${recomendacoes ? `<div class="rpt-sh"><span class="num" style="background:#7c3aed">7</span><span class="sh-title">Conclusão e Recomendações</span></div><div class="rpt-rec">${recomendacoes}</div>` : ""}

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
  const nomeArquivo = "ETDAH-AD_" + nome.replace(/\s+/g, "_").substring(0, 30) + ".pdf";

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
      pagebreak: { mode: ["avoid-all"] }
    }).from(rel).save();
  } catch (e) {
    console.error("Erro ao gerar PDF:", e);
    alert("Erro ao gerar PDF. Tente novamente.");
  } finally {
    decos.forEach(d => d.style.display = "");
    if (badge) badge.style.backdropFilter = "";
    if (reportEl) reportEl.style.overflow = "";
    hideLoading();
  }
}
window.baixarPDF = baixarPDF;

/* ═══════════════════════════════════
   LAUDOS SALVOS
   ═══════════════════════════════════ */
function renderListaLaudos() {
  const box = document.getElementById("listaLaudos");
  if (!box) return;
  const laudos = getLaudos();
  if (!laudos.length) { box.innerHTML = '<p class="muted">Nenhum laudo salvo ainda.</p>'; return; }
  box.innerHTML = '<table class="rpt-tbl"><thead><tr><th>Paciente</th><th>Aplicação</th><th>Idade</th><th>Ações</th></tr></thead><tbody>' +
    laudos.map((x, idx) => '<tr><td>' + x.nome + '</td><td>' + x.dataAplicacao + '</td><td>' + (x.idade || "—") + '</td><td><button class="btn-secondary" style="padding:4px 12px;font-size:11px" onclick="baixarPDFSalvo(' + idx + ')">PDF</button></td></tr>').join("") +
    '</tbody></table>';
}
window.renderListaLaudos = renderListaLaudos;

async function baixarPDFSalvo(index) {
  const item = getLaudos()[index];
  if (!item) return alert("Laudo não encontrado.");
  const temp = document.createElement("div");
  temp.innerHTML = item.htmlRelatorio;
  temp.style.position = "absolute"; temp.style.left = "-9999px";
  document.body.appendChild(temp);
  await esperarImagensCarregarem(temp);
  await new Promise(r => setTimeout(r, 150));

  const nome = item.nome || "Relatorio";
  const nomeArquivo = "ETDAH-AD_" + nome.replace(/\s+/g, "_").substring(0, 30) + ".pdf";

  try {
    await html2pdf().set({
      margin: [5, 5, 5, 5],
      filename: nomeArquivo,
      image: { type: "jpeg", quality: 1.00 },
      html2canvas: { scale: 4, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: "mm", format: [210, 900], orientation: "portrait" },
      pagebreak: { mode: ["avoid-all"] }
    }).from(temp).save();
  } catch (e) {
    console.error("Erro PDF salvo:", e);
    alert("Erro ao gerar PDF.");
  } finally {
    temp.remove();
  }
}
window.baixarPDFSalvo = baixarPDFSalvo;

/* ═══════════════════════════════════
   INIT
   ═══════════════════════════════════ */
(function init() {
  if (document.getElementById("tbodyItens")) {
    renderTabelaItens();
  }
})();
