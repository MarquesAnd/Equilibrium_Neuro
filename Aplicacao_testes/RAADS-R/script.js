/**
 * RAADS-R SHARED SCRIPT — Equilibrium
 * Variáveis a definir em cada página ANTES deste script:
 *   FORM_KEY        : "raadsr_screen"
 *   RAADSR_ACCENT_VAR  : "--raadsr-accent"
 *   DATA_PATH       : caminho para raadsr_rules.json (opcional)
 *   URL_DO_GOOGLE_SCRIPT : URL do Apps Script para envio ao Drive (opcional)
 */

let RAADSR_RULES = null;
const $ = (sel) => document.querySelector(sel);

// Caminho para o JSON — pode ser sobrescrito em cada index.html
//if (typeof DATA_PATH === "undefined") { var DATA_PATH = "/Aplicacao_testes/RAADS-R/data/raadsr_rules.json"; }

// ─── INICIALIZAÇÃO DAS CORES ─────────────────────────────────────────────────
function aplicarAcento(){
  if(!window.RAADSR_ACCENT_VAR) return;
  const root = document.documentElement;
  const val = getComputedStyle(root).getPropertyValue(window.RAADSR_ACCENT_VAR).trim();
  if(val) root.style.setProperty('--raadsr-accent', val);
}

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function setSubtitle(msg){
  const el = $("#subtitle");
  if(el) el.textContent = msg;
}

// ─── CARREGAR JSON ────────────────────────────────────────────────────────────
async function carregarRegras(){
  const path = (typeof DATA_PATH !== "undefined") ? DATA_PATH : "/Aplicacao_testes/RAADS-R/data/raadsr_rules.json";
  let res;
  try {
    res = await fetch(path, { cache: "no-store" });
  } catch(netErr) {
    throw new Error("Falha de rede ao carregar dados: " + path + "\n" + netErr.message);
  }
  if(!res.ok) throw new Error("Ficheiro não encontrado (" + res.status + "): " + path);
  try {
    RAADSR_RULES = await res.json();
  } catch(jsonErr) {
    throw new Error("JSON inválido em: " + path + "\n" + jsonErr.message);
  }
  if(!RAADSR_RULES || !Array.isArray(RAADSR_RULES.forms)) {
    throw new Error("Formato inesperado em raadsr_rules.json — campo 'forms' não encontrado.");
  }
}

function getForm(){
  if(!RAADSR_RULES) return null;
  return (RAADSR_RULES.forms || []).find(f => f.form === FORM_KEY) || null;
}

// ─── RENDERIZAR ITENS ─────────────────────────────────────────────────────────
function renderItens(){
  const form = getForm();
  const container = $("#itens");
  if(!container) return;
  container.innerHTML = "";

  if(!form){
    container.innerHTML = `<div class="raadsr-hint" style="color:#dc2626">⚠️ Não foi possível carregar os dados do formulário.<br>Verifique se o ficheiro <b>data/raadsr_rules.json</b> está acessível.</div>`;
    return;
  }

  setSubtitle(form.label || "RAADS-R-BR Screen");

  const labels = Array.isArray(form.answer_labels) ? form.answer_labels : [
    "Isso é verdade agora e era verdade quando eu era jovem",
    "Isso é verdade apenas agora",
    "Isso é verdade apenas quando eu era mais jovem (16 anos ou menos)",
    "Isso nunca foi verdade"
  ];

  for(const item of form.items){
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.itemId = item.id;

    const reverseTag = item.reverse ? `<span class="tag">⚠️ Invertida</span>` : "";

    let optionsHtml = "";
    for(let val = 1; val <= 4; val++){
      const inputId = `q${item.id}_opt${val}`;
      const labelText = labels[val - 1];
      optionsHtml += `
        <div class="item-option">
          <input type="radio" name="q${item.id}" id="${inputId}" value="${val}">
          <label for="${inputId}">${escapeHtml(labelText)}</label>
        </div>
      `;
    }

    div.innerHTML = `
      <div class="item-header">
        <div class="item-num">${item.id}</div>
        <div class="item-text">${escapeHtml(item.text)} ${reverseTag}</div>
      </div>
      <div class="item-options">
        ${optionsHtml}
      </div>
    `;

    container.appendChild(div);
  }

  // Listener para marcar item como respondido
  container.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener("change", () => {
      const itemDiv = radio.closest(".item");
      if(itemDiv) itemDiv.classList.add("answered");
      atualizarContadores();
    });
  });

  atualizarContadores();
}

// ─── CONTADORES DE PROGRESSO ───────────────────────────────────────────────────
function atualizarContadores(){
  const form = getForm();
  if(!form) return;

  const total = form.items.length;
  const answered = form.items.filter(item => {
    const name = `q${item.id}`;
    return document.querySelector(`input[name="${name}"]:checked`) !== null;
  }).length;

  // Atualizar elementos de contagem
  const pillAnswered = $("#pillAnswered");
  if(pillAnswered) pillAnswered.textContent = `${answered}/${total}`;

  const footerAnswered = $("#footerAnswered");
  if(footerAnswered) footerAnswered.textContent = answered;

  const footerTotal = $("#footerTotal");
  if(footerTotal) footerTotal.textContent = total;

  // Atualizar barra de progresso
  const progressFill = $("#patientProgressFill");
  if(progressFill) {
    const percent = total > 0 ? (answered / total) * 100 : 0;
    progressFill.style.width = `${percent}%`;
  }

  // Habilitar/desabilitar botão de enviar
  const btnEnviar = $("#btnEnviar");
  if(btnEnviar) {
    btnEnviar.disabled = (answered < total);
  }
}

// ─── COLETAR RESPOSTAS ────────────────────────────────────────────────────────
function coletarRespostas(){
  const form = getForm();
  if(!form) return null;

  const respostas = {};
  for(const item of form.items){
    const name = `q${item.id}`;
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    if(checked){
      respostas[item.id] = parseInt(checked.value);
    }
  }

  return respostas;
}

// ─── CALCULAR PONTUAÇÃO ────────────────────────────────────────────────────────
function calcularPontuacao(respostas){
  const form = getForm();
  if(!form) return { total: 0, interpretacao: "" };

  let total = 0;

  // Itens diretos: 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20
  const diretos = [2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20];
  
  // Itens invertidos: 1, 5, 13
  const invertidos = [1, 5, 13];

  for(const itemId in respostas){
    const valor = respostas[itemId];
    const id = parseInt(itemId);

    if(diretos.includes(id)){
      // Pontuação direta: 1, 2, 3, 4
      total += valor;
    } else if(invertidos.includes(id)){
      // Pontuação invertida: 4, 3, 2, 1
      total += (5 - valor);
    }
  }

  const cutoff = form.cutoff || 46;
  const maxScore = form.max_score || 80;

  let interpretacao = "";
  if(total >= cutoff){
    interpretacao = `A pontuação de ${total} pontos encontra-se ACIMA do ponto de corte estabelecido (${cutoff}) pelos estudos de validação. Este resultado indica que a participante reporta uma frequência de comportamentos e experiências compatível com o perfil do Espectro Autista. Estatisticamente, pontuações nesta faixa apresentam alta sensibilidade (90,1%) para a identificação do transtorno.`;
  } else {
    interpretacao = `A pontuação de ${total} pontos encontra-se ABAIXO do ponto de corte estabelecido (${cutoff}) pelos estudos de validação. Este resultado indica que a participante reporta uma frequência de comportamentos abaixo do limiar clínico de rastreio para o Espectro Autista nesta escala.`;
  }

  return {
    total,
    cutoff,
    maxScore,
    interpretacao
  };
}

// ─── GERAR RELATÓRIO ───────────────────────────────────────────────────────────
async function gerarRelatorio(paciente, data, respostas, resultado){
  const form = getForm();
  if(!form) return "";

  const dataFormatada = new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Collect extra patient fields
  const cpf = document.getElementById("cpf")?.value?.trim() || "";
  const dataNasc = document.getElementById("dataNascimento")?.value || "";
  const respondente = document.getElementById("respondente")?.value?.trim() || "";
  const dataNascFmt = dataNasc ? dataNasc.split("-").reverse().join("/") : "---";

  // Calculate age
  let idadeStr = "---";
  if (dataNasc && data) {
    const dn = new Date(dataNasc + "T12:00:00");
    const da = new Date(data + "T12:00:00");
    let age = da.getFullYear() - dn.getFullYear();
    if (da.getMonth() < dn.getMonth() || (da.getMonth() === dn.getMonth() && da.getDate() < dn.getDate())) age--;
    idadeStr = age + " anos";
  }

  const dataHoje = new Date().toLocaleDateString("pt-BR");

  return `
    <div style="font-family:'DM Sans',Arial,sans-serif;color:#1e293b;background:#fff;border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 8px 40px rgba(0,0,0,.06);overflow:hidden;">

      <!-- HEADER (padrão WAIS) -->
      <div style="background:linear-gradient(135deg,#0c1f3f 0%,#1a3a6a 50%,#1e40af 100%);color:#fff;padding:14px 24px 12px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-50px;right:-50px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.03);"></div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;position:relative;">
          <div style="display:flex;align-items:center;gap:16px;">
            <img src="/logo2.png" alt="Logo" style="width:30px;height:30px;object-fit:contain;filter:brightness(10);" onerror="this.style.display='none'" />
            <div>
              <div style="font-size:8px;text-transform:uppercase;letter-spacing:3px;opacity:.45;">Relatório Neuropsicológico</div>
              <div style="font-size:20px;font-weight:800;margin-top:3px;letter-spacing:-.5px;">RAADS-R-BR Screen</div>
              <div style="font-size:10px;opacity:.55;margin-top:2px;">Escala Ritvo para Diagnóstico de Autismo em Adultos</div>
              <div style="font-size:9px;opacity:.45;margin-top:1px;">Versão Brasileira Reduzida</div>
            </div>
          </div>
          <div style="background:rgba(255,255,255,.08);border-radius:8px;padding:6px 10px;backdrop-filter:blur(8px);text-align:right;">
            <div style="font-size:7px;text-transform:uppercase;letter-spacing:2px;opacity:.5;">Pontuação</div>
            <div style="font-size:16px;font-weight:800;margin-top:1px;">${resultado.total}</div>
            <div style="font-size:8px;opacity:.5;margin-top:1px;">de ${resultado.maxScore} pontos</div>
          </div>
        </div>
      </div>

      <div style="padding:0 24px 24px;">

      <!-- 1. Identificação -->
      <div style="display:flex;align-items:center;gap:8px;margin:14px 0 10px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:#1a56db;color:#fff;font-size:10px;font-weight:800;">1</span><span style="font-weight:700;font-size:13px;color:#0f172a;">Identificação</span></div>
      <div style="background:#f8fafc;border-radius:10px;padding:12px 16px;border:1px solid #e2e8f0;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;font-size:12px;">
          <div><span style="font-size:10px;color:#64748b;font-weight:600;">Nome:</span> <span style="font-weight:600;">${escapeHtml(paciente)}</span></div>
          <div><span style="font-size:10px;color:#64748b;font-weight:600;">CPF:</span> <span>${escapeHtml(cpf || "—")}</span></div>
          <div><span style="font-size:10px;color:#64748b;font-weight:600;">Nascimento:</span> <span>${escapeHtml(dataNascFmt)} (${escapeHtml(idadeStr)})</span></div>
          <div><span style="font-size:10px;color:#64748b;font-weight:600;">Avaliação:</span> <span>${dataFormatada}</span></div>
          ${respondente ? `<div style="grid-column:1/-1;"><span style="font-size:10px;color:#64748b;font-weight:600;">Respondente:</span> <span>${escapeHtml(respondente)}</span></div>` : ""}
        </div>
      </div>

      <!-- 2. Sobre o Instrumento -->
      <div style="display:flex;align-items:center;gap:8px;margin:14px 0 10px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:#1a56db;color:#fff;font-size:10px;font-weight:800;">2</span><span style="font-weight:700;font-size:13px;color:#0f172a;">Sobre o Instrumento</span></div>
      <div style="background:#f8fafc;border-radius:10px;padding:14px 18px;border:1px solid #e2e8f0;">
          <p style="color:#334155;font-size:12px;line-height:1.75;margin:0 0 10px;">
            O RAADS-R-BR Screen e uma escala de rastreio desenvolvida para identificar caracteristicas do Transtorno do Espectro Autista (TEA) em adultos. A versao utilizada e composta por 20 itens que avaliam dominios centrais do perfil neurodivergente, incluindo: Interacao Social, Linguagem, Sensorio-Motor e Interesses Circunscritos.
          </p>
          <p style="color:#334155;font-size:12px;line-height:1.75;margin:0;">
            O instrumento foi validado para o contexto brasileiro, apresentando evidencias robustas de validade e confiabilidade, com <strong>sensibilidade de 90,1%</strong> e <strong>especificidade de 87,9%</strong> para o ponto de corte estabelecido.
          </p>
      </div>

      <!-- 3. Resultados Obtidos -->
      <div style="display:flex;align-items:center;gap:8px;margin:14px 0 10px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:#1a56db;color:#fff;font-size:10px;font-weight:800;">3</span><span style="font-weight:700;font-size:13px;color:#0f172a;">Resultados Obtidos</span></div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
          <div style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);border-radius:14px;padding:18px 16px;color:white;text-align:center;box-shadow:0 4px 14px rgba(220,38,38,.2);">
            <div style="font-size:10px;opacity:0.85;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;">Paciente</div>
            <div style="font-size:32px;font-weight:800;letter-spacing:-1px;">${resultado.total}</div>
          </div>
          <div style="background:linear-gradient(135deg,#1a56db 0%,#1e40af 100%);border-radius:14px;padding:18px 16px;color:white;text-align:center;box-shadow:0 4px 14px rgba(26,86,219,.2);">
            <div style="font-size:10px;opacity:0.85;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;">Ponto de Corte</div>
            <div style="font-size:32px;font-weight:800;letter-spacing:-1px;">${resultado.cutoff}</div>
          </div>
          <div style="background:linear-gradient(135deg,#475569 0%,#334155 100%);border-radius:14px;padding:18px 16px;color:white;text-align:center;box-shadow:0 4px 14px rgba(51,65,85,.2);">
            <div style="font-size:10px;opacity:0.85;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;">Maximo</div>
            <div style="font-size:32px;font-weight:800;letter-spacing:-1px;">${resultado.maxScore}</div>
          </div>
        </div>

        <!-- Gráfico -->
        <div id="grafico-container" style="margin:20px 0;">
          <div style="text-align:center;padding:32px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:12px;">O grafico comparativo sera gerado automaticamente</p>
          </div>
        </div>

      <!-- 4. Interpretação -->
      <div style="display:flex;align-items:center;gap:8px;margin:14px 0 10px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:#1a56db;color:#fff;font-size:10px;font-weight:800;">4</span><span style="font-weight:700;font-size:13px;color:#0f172a;">Interpretação</span></div>
      <div style="background:#fffbeb;border:1px solid rgba(245,158,11,.15);border-radius:12px;padding:16px 20px;">
          <p style="color:#334155;font-size:12px;line-height:1.8;margin:0;">
            ${resultado.interpretacao}
          </p>
      </div>

      <!-- FOOTER (padrão WAIS) -->
      <div style="border-top:2px solid #e2e8f0;padding-top:16px;margin-top:22px;display:flex;justify-content:space-between;">
        <div>
          <div style="color:#64748b;font-size:12px;">Equilibrium Neuropsicologia</div>
          <div style="font-size:10px;color:#94a3b8;margin-top:4px;">Correção automatizada RAADS-R-BR Screen</div>
        </div>
        <div style="text-align:right;font-size:11px;color:#64748b;">
          <div>Documento gerado em ${dataHoje}</div>
          <div style="font-size:9px;color:#cbd5e1;max-width:220px;margin-top:8px;">Este documento é confidencial e destinado exclusivamente ao profissional solicitante.</div>
        </div>
      </div>

      </div>
    </div>
  `;
}

// ─── ENVIAR FORMULÁRIO ────────────────────────────────────────────────────────
async function enviarFormulario(){
  const paciente = $("#paciente")?.value?.trim();
  const data = $("#data")?.value;

  if(!paciente){
    alert("Por favor, preencha o nome do paciente.");
    return;
  }

  if(!data){
    alert("Por favor, preencha a data da avaliação.");
    return;
  }

  const respostas = coletarRespostas();
  const form = getForm();
  
  if(!respostas || Object.keys(respostas).length < form.items.length){
    alert("Por favor, responda todos os itens antes de enviar.");
    return;
  }

  // Mostrar modal de processamento
  const modal = $("#modalGerando");
  if(modal){
    modal.classList.add("active");
    const modalTitle = $("#__raadsr_modal_title__");
    const modalSub = $("#__raadsr_modal_sub__");
    if(modalTitle) modalTitle.textContent = "Processando respostas...";
    if(modalSub) modalSub.textContent = "Por favor, aguarde.";
  }

  try {
    // Calcular resultado
    const resultado = calcularPontuacao(respostas);

    // Gerar relatório HTML
    const relatorioHTML = await gerarRelatorio(paciente, data, respostas, resultado);

    // Salvar no Firebase
    if(typeof db !== 'undefined' && db){
      await db.collection('raadsr_results').add({
        paciente,
        data,
        respostas,
        resultado,
        relatorioHTML,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    // Enviar PDF ao Google Drive
    if(typeof URL_DO_GOOGLE_SCRIPT !== 'undefined' && URL_DO_GOOGLE_SCRIPT && URL_DO_GOOGLE_SCRIPT.length > 10) {
      const modalTitle = $("#__raadsr_modal_title__");
      if(modalTitle) modalTitle.textContent = "Enviando ao Drive...";
      const pdfBase64 = await gerarPDFDrive(paciente, data, resultado.total);
      await fetch(URL_DO_GOOGLE_SCRIPT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ paciente, data, pontuacao: resultado.total, pdfBase64 })
      });
    }

    // Esconder modal
    if(modal) modal.classList.remove("active");

    // Mostrar tela de sucesso
    mostrarSucesso();

  } catch(error) {
    console.error("Erro ao processar:", error);
    if(modal) modal.classList.remove("active");
    alert("Ocorreu um erro ao processar as respostas. Por favor, tente novamente.");
  }
}

function mostrarSucesso(){
  const appShell = $("#appShell");
  const footer = $(".p-footer");

  if(appShell) appShell.style.display = "none";
  if(footer) footer.style.display = "none";

  document.body.innerHTML = `
    <div class="success-screen">
      <div class="success-card">
        <div class="success-icon">✅</div>
        <h1>Respostas Enviadas com Sucesso!</h1>
        <p>Obrigado por completar o questionário RAADS-R-BR Screen.</p>
        <p>Suas respostas foram registradas e o relatório será gerado em breve.</p>
        <p class="success-note">Você pode fechar esta janela agora.</p>
      </div>
    </div>
  `;
}

// ─── INICIALIZAÇÃO ────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  try {
    aplicarAcento();
    await carregarRegras();
    renderItens();

    // Definir data atual como padrão
    const dataInput = $("#data");
    if(dataInput && !dataInput.value){
      dataInput.value = new Date().toISOString().split('T')[0];
    }

    // Listener do botão enviar
    const btnEnviar = $("#btnEnviar");
    if(btnEnviar){
      btnEnviar.addEventListener("click", enviarFormulario);
    }

  } catch(err) {
    console.error("Erro na inicialização:", err);
    setSubtitle("⚠️ Erro ao carregar");
    const itens = $("#itens");
    if(itens){
      itens.innerHTML = `
        <div style="padding: 32px; text-align: center; color: #dc2626;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <div style="font-weight: 700; font-size: 18px; margin-bottom: 8px;">
            Erro ao Carregar o Formulário
          </div>
          <div style="font-size: 14px; color: #64748b;">
            ${escapeHtml(err.message)}
          </div>
        </div>
      `;
    }
  }
});

async function gerarPDFDrive(n,d,p){const{jsPDF:j}=window.jspdf;const o=new j('p','mm','a4');const df=new Date(d+'T00:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});const a=[26,86,219],ae=[30,58,138],al=[147,197,253],ac=[239,246,255];let i,dt,r,c,nr,cn;if(p>=65){nr='ALTO';cn=[220,38,38];i=`A pontuação de ${p} pontos situa-se significativamente ACIMA do ponto de corte (46), indicando presença marcante de características compatíveis com TEA.`;dt=`Pontuações ≥65 apresentam alta probabilidade de diagnóstico quando confirmadas por avaliação especializada. Impacto significativo em comunicação social, processamento sensorial e padrões repetitivos.`;r=`INDICAÇÕES: (1) Avaliação diagnóstica completa (ADI-R, ADOS-2); (2) Investigação de comunicação pragmática, teoria da mente, flexibilidade cognitiva; (3) Rastreamento de comorbidades.`;c=`Resultado não constitui diagnóstico, mas indica necessidade urgente de avaliação especializada. Diagnóstico requer histórico desenvolvimental e instrumentos padrão-ouro.`;}else if(p>=46){nr='MODERADO A ALTO';cn=[245,158,11];i=`A pontuação de ${p} pontos encontra-se ACIMA do ponto de corte (46). Sensibilidade de 90,1% para identificação de TEA, indicando alta capacidade de detecção.`;dt=`Pontuações 46-64 sugerem traços autistas em intensidade clinicamente relevante. Possíveis dificuldades em reciprocidade social, compreensão de nuances sociais, flexibilidade comportamental ou sensibilidades sensoriais.`;r=`RECOMENDAÇÕES: (1) Avaliação diagnóstica por especialista em TEA; (2) Investigação de áreas específicas: comunicação social, padrões repetitivos, processamento sensorial; (3) Avaliação de funcionalidade adaptativa.`;c=`Mesmo acima do corte, diagnóstico requer avaliação clínica. Adultos podem desenvolver compensações (masking) não totalmente capturadas por autorrelato. Avaliação considerará histórico e observação direta.`;}else if(p>=32){nr='LIMÍTROFE';cn=[234,179,8];i=`A pontuação de ${p} pontos situa-se em zona limítrofe, indicando algumas características autistas. Pode sugerir traços subclínicos, perfil neurodivergente não-diagnóstico, ou estratégias compensatórias desenvolvidas.`;dt=`Pontuações 32-45 requerem análise cuidadosa. Podem indicar: traços leves sem prejuízo; autismo compensado/mascarado; outras condições neurodivergentes; ou características de personalidade sobrepostas ao espectro.`;r=`SUGESTÕES: (1) Avaliação clínica para investigação de traços autistas e impacto funcional; (2) Exploração de comorbidades (TDAH, ansiedade, alta sensibilidade); (3) Análise de histórico desenvolvimental e contexto de masking.`;c=`Resultado limítrofe não exclui TEA, especialmente em adultos com compensações desenvolvidas. Acompanhamento pode ser benéfico mesmo sem diagnóstico formal, focando em autoconhecimento e estratégias adaptativas.`;}else{nr='BAIXO';cn=[34,197,94];i=`A pontuação de ${p} pontos encontra-se ABAIXO do ponto de corte (46), indicando ausência ou baixa frequência de características típicas do TEA. Especificidade de 87,9% (baixa taxa de falsos positivos).`;dt=`Pontuações <32 geralmente indicam que a pessoa não apresenta características autistas em intensidade clinicamente significativa. Comunicação social, flexibilidade e processamento sensorial dentro da variabilidade neurotípica.`;r=`ORIENTAÇÕES: (1) Resultado não indica necessidade de investigação para TEA; (2) Se persistirem dúvidas, considerar avaliação neuropsicológica abrangente; (3) Investigar outras condições se houver queixas específicas.`;c=`Resultado negativo não exclui definitivamente TEA em casos atípicos. Mulheres, alto QI e forte camuflagem podem pontuar abaixo do corte. Se houver suspeita fundamentada, avaliação ainda pode ser pertinente.`;}o.setFillColor(...ae);o.rect(0,0,210,45,'F');o.setFillColor(...a);o.rect(0,0,210,42,'F');o.setTextColor(255,255,255);o.setFontSize(9);o.setFont('helvetica','normal');o.text('RELATÓRIO DE RASTREAMENTO NEUROPSICOLÓGICO',105,12,{align:'center'});o.setFontSize(24);o.setFont('helvetica','bold');o.text('RAADS-R-BR SCREEN',105,23,{align:'center'});o.setFontSize(10);o.setFont('helvetica','normal');o.text('Escala Ritvo de Diagnóstico de Autismo em Adultos',105,30,{align:'center'});o.setFontSize(8);o.setFont('helvetica','italic');o.text('Versão Brasileira Reduzida (20 itens)',105,36,{align:'center'});o.setFont('helvetica','bold');o.text('Equilibrium Neuropsicologia',105,40,{align:'center'});o.setFillColor(248,250,252);o.setDrawColor(...al);o.setLineWidth(0.8);o.roundedRect(15,50,180,22,3,3,'FD');o.setTextColor(...a);o.setFontSize(9);o.setFont('helvetica','bold');o.text('IDENTIFICAÇÃO DO PACIENTE',20,56);o.setDrawColor(226,232,240);o.setLineWidth(0.3);o.line(20,58,190,58);o.setTextColor(30,41,59);o.setFont('helvetica','bold');o.text('Nome:',20,64);o.setFont('helvetica','normal');o.text(n,35,64);o.setFont('helvetica','bold');o.text('Data:',20,69);o.setFont('helvetica','normal');o.text(df,35,69);o.setFontSize(12);o.setTextColor(...a);o.setFont('helvetica','bold');o.text('Sobre o Instrumento',15,80);o.setDrawColor(...a);o.setLineWidth(1.5);o.line(15,82,50,82);o.setFontSize(8.5);o.setTextColor(51,65,85);o.setFont('helvetica','normal');o.text(o.splitTextToSize('O RAADS-R-BR Screen é um instrumento de rastreamento para identificar características do TEA em adultos. Versão validada brasileira de 20 itens que avaliam: Comunicação Social, Linguagem Pragmática, Processamento Sensório-Motor e Padrões Restritos/Repetitivos.',175),15,88);o.setFillColor(...ac);o.setDrawColor(...al);o.roundedRect(15,105,180,18,3,3,'FD');o.setFontSize(9);o.setTextColor(...ae);o.setFont('helvetica','bold');o.text('Propriedades Psicométricas',20,112);o.setFontSize(7.5);o.setFont('helvetica','normal');o.setTextColor(...a);o.text('• Sensibilidade: 90,1%  • Especificidade: 87,9%  • Ponto de Corte: 46 pontos',20,118);o.setFillColor(254,243,199);o.setDrawColor(234,179,8);o.roundedRect(15,128,180,22,3,3,'FD');o.setFontSize(8);o.setTextColor(146,64,14);o.setFont('helvetica','bold');o.text('⚠ IMPORTANTE',20,134);o.setFont('helvetica','normal');o.setTextColor(92,64,14);o.setFontSize(7);o.text(o.splitTextToSize('Instrumento de RASTREAMENTO, não diagnóstico. Diagnóstico de TEA requer profissional especializado, critérios DSM-5/CID-11, avaliação clínica e instrumentos padrão-ouro (ADOS-2, ADI-R).',170),20,138);o.setFontSize(11);o.setTextColor(...a);o.setFont('helvetica','bold');o.text('Contexto Clínico',15,157);o.setDrawColor(...a);o.setLineWidth(1.5);o.line(15,159,45,159);o.setFontSize(7.5);o.setTextColor(51,65,85);o.setFont('helvetica','normal');o.text(o.splitTextToSize('TEA é condição do neurodesenvolvimento com diferenças em comunicação social e padrões repetitivos. Em adultos, diagnóstico pode ser desafiador devido a estratégias compensatórias (masking). Características: dificuldades em reciprocidade social, comunicação não-verbal, flexibilidade cognitiva e sensibilidades sensoriais.',175),15,165);o.setDrawColor(226,232,240);o.setLineWidth(0.3);o.line(15,283,195,283);o.setFontSize(7);o.setTextColor(148,163,184);o.setFont('helvetica','italic');o.text('Equilibrium Neuropsicologia | Avaliação Especializada',105,287,{align:'center'});o.setFont('helvetica','normal');o.text('Página 1 de 2',195,287,{align:'right'});o.addPage();o.setFillColor(...a);o.rect(0,0,210,22,'F');o.setTextColor(255,255,255);o.setFontSize(16);o.setFont('helvetica','bold');o.text('Resultados da Avaliação',15,14);o.setFillColor(255,255,255);o.setDrawColor(...al);o.setLineWidth(1.5);o.roundedRect(15,28,180,38,4,4,'FD');o.setFontSize(9);o.setTextColor(100,116,139);o.setFont('helvetica','bold');o.text('PONTUAÇÃO TOTAL OBTIDA',105,35,{align:'center'});o.setFontSize(42);o.setTextColor(...cn);o.text(p.toString(),105,52,{align:'center'});o.setFontSize(10);o.text(`NÍVEL: ${nr}`,105,61,{align:'center'});o.setFontSize(7);o.setTextColor(71,85,105);o.setFont('helvetica','normal');o.text('Corte: 46 pts | Máxima: 80 pts',105,65,{align:'center'});o.setFontSize(11);o.setTextColor(...a);o.setFont('helvetica','bold');o.text('Visualização Comparativa',15,76);const gy=82,gh=45;o.setFillColor(248,250,252);o.rect(15,gy,180,gh,'F');o.setDrawColor(226,232,240);o.setLineWidth(0.2);for(let k=0;k<=80;k+=20){const y=gy+gh-(k/80)*gh;o.line(15,y,195,y);o.setFontSize(7);o.setTextColor(148,163,184);o.text(k.toString(),12,y+1,{align:'right'});}const bw=28,bs=22,bx=50,h1=(p/80)*gh;o.setFillColor(...cn);o.roundedRect(bx,gy+gh-h1,bw,h1,2,2,'F');o.setTextColor(255,255,255);o.setFontSize(14);o.setFont('helvetica','bold');o.text(p.toString(),bx+bw/2,gy+gh-h1+10,{align:'center'});const h2=(46/80)*gh;o.setFillColor(...a);o.roundedRect(bx+bw+bs,gy+gh-h2,bw,h2,2,2,'F');o.text('46',bx+bw+bs+bw/2,gy+gh-h2+10,{align:'center'});o.setFillColor(148,163,184);o.roundedRect(bx+(bw+bs)*2,gy,bw,gh,2,2,'F');o.text('80',bx+(bw+bs)*2+bw/2,gy+10,{align:'center'});o.setFontSize(7);o.setTextColor(71,85,105);o.setFont('helvetica','normal');o.text('Paciente',bx+bw/2,gy+gh+4,{align:'center'});o.text('Corte',bx+bw+bs+bw/2,gy+gh+4,{align:'center'});o.text('Máxima',bx+(bw+bs)*2+bw/2,gy+gh+4,{align:'center'});o.setFontSize(11);o.setTextColor(...a);o.setFont('helvetica','bold');o.text('Interpretação Clínica',15,136);o.setFillColor(...ac);o.setDrawColor(...al);o.setLineWidth(0.8);o.roundedRect(15,140,180,28,3,3,'FD');o.setFontSize(7.5);o.setTextColor(...ae);o.setFont('helvetica','normal');o.text(o.splitTextToSize(i,170),20,144);o.setFontSize(11);o.setTextColor(...a);o.setFont('helvetica','bold');o.text('Análise Detalhada',15,174);o.setFillColor(248,250,252);o.setDrawColor(203,213,225);o.roundedRect(15,178,180,26,3,3,'FD');o.setFontSize(7.5);o.setTextColor(51,65,85);o.setFont('helvetica','normal');o.text(o.splitTextToSize(dt,170),20,182);o.setFontSize(11);o.setTextColor(...a);o.setFont('helvetica','bold');o.text('Recomendações Clínicas',15,210);o.setFillColor(254,252,232);o.setDrawColor(234,179,8);o.roundedRect(15,214,180,24,3,3,'FD');o.setFontSize(7.5);o.setTextColor(113,63,18);o.setFont('helvetica','normal');o.text(o.splitTextToSize(r,170),20,218);o.setFontSize(11);o.setTextColor(...a);o.setFont('helvetica','bold');o.text('Considerações Finais',15,244);o.setFillColor(...ac);o.setDrawColor(...al);o.roundedRect(15,248,180,26,3,3,'FD');o.setFontSize(7.5);o.setTextColor(...ae);o.setFont('helvetica','normal');o.text(o.splitTextToSize(c,170),20,252);o.setDrawColor(226,232,240);o.setLineWidth(0.3);o.line(15,283,195,283);o.setFontSize(7);o.setTextColor(148,163,184);o.setFont('helvetica','italic');o.text('Equilibrium Neuropsicologia',105,287,{align:'center'});o.setFont('helvetica','normal');o.text('Página 2 de 2',195,287,{align:'right'});return o.output('datauristring').split(',')[1];}
