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

  const labels = Array.isArray(form.answer_labels) 
    ? form.answer_labels 
    : [
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

  return `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
      
      <!-- Cabeçalho -->
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #7c3aed; padding-bottom: 30px;">
        <h1 style="color: #7c3aed; font-size: 26px; font-weight: 800; margin: 0 0 10px;">
          RAADS-R-BR Screen
        </h1>
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          Escala Ritvo para Diagnóstico de Autismo em Adultos - Versão Brasileira Reduzida
        </p>
      </div>

      <!-- Informações do Paciente -->
      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">
              Paciente
            </div>
            <div style="font-size: 16px; color: #1e293b; font-weight: 600;">
              ${escapeHtml(paciente)}
            </div>
          </div>
          <div>
            <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">
              Data da Avaliação
            </div>
            <div style="font-size: 16px; color: #1e293b; font-weight: 600;">
              ${dataFormatada}
            </div>
          </div>
        </div>
      </div>

      <!-- Descrição do Instrumento -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b; font-size: 18px; font-weight: 700; margin: 0 0 16px;">
          Sobre o RAADS-R-BR Screen
        </h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 12px;">
          O RAADS-R-BR Screen é uma escala de rastreio desenvolvida para identificar características do Transtorno do Espectro Autista (TEA) em adultos. A versão utilizada é composta por 20 itens que avaliam domínios centrais do perfil neurodivergente, incluindo: Interação Social, Linguagem, Sensório-Motor e Interesses Circunscritos.
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0;">
          O instrumento foi validado para o contexto brasileiro, apresentando evidências robustas de validade e confiabilidade, com <strong>sensibilidade de 90,1%</strong> e <strong>especificidade de 87,9%</strong> para o ponto de corte estabelecido.
        </p>
      </div>

      <!-- Resultados Obtidos -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b; font-size: 18px; font-weight: 700; margin: 0 0 20px;">
          Resultados Obtidos
        </h2>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 12px; padding: 20px; color: white; text-align: center;">
            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">
              Pontuação da Paciente
            </div>
            <div style="font-size: 32px; font-weight: 800;">
              ${resultado.total}
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 12px; padding: 20px; color: white; text-align: center;">
            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">
              Ponto de Corte
            </div>
            <div style="font-size: 32px; font-weight: 800;">
              ${resultado.cutoff}
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); border-radius: 12px; padding: 20px; color: white; text-align: center;">
            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">
              Pontuação Máxima
            </div>
            <div style="font-size: 32px; font-weight: 800;">
              ${resultado.maxScore}
            </div>
          </div>
        </div>

        <!-- Gráfico será inserido aqui via Python -->
        <div id="grafico-container" style="margin: 30px 0;">
          <div style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 12px;">
            <p style="color: #64748b; font-size: 14px;">
              📊 O gráfico comparativo será gerado automaticamente
            </p>
          </div>
        </div>
      </div>

      <!-- Interpretação -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b; font-size: 18px; font-weight: 700; margin: 0 0 16px;">
          Interpretação
        </h2>
        <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px;">
          <p style="color: #1e293b; font-size: 14px; line-height: 1.8; margin: 0;">
            ${resultado.interpretacao}
          </p>
        </div>
      </div>

      <!-- Rodapé -->
      <div style="border-top: 2px solid #e2e8f0; padding-top: 24px; margin-top: 40px; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Relatório gerado por Equilibrium Neuropsicologia
        </p>
        <p style="color: #cbd5e1; font-size: 11px; margin: 8px 0 0;">
          Este documento é confidencial e destina-se exclusivamente ao paciente e profissionais autorizados
        </p>
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

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÃO PARA GERAR PDF PROFISSIONAL E ENVIAR AO GOOGLE DRIVE
// ═══════════════════════════════════════════════════════════════════════════

async function gerarPDFDrive(nome, data, pontuacao) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const dataObj = new Date(data + 'T00:00:00');
  const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  // Cores do tema AZUL Equilibrium
  const azulPrimario = [26, 86, 219];
  const azulEscuro = [30, 58, 138];
  const azulClaro = [147, 197, 253];
  const azulClarissimo = [239, 246, 255];
  
  let interpretacao, recomendacoes, nivelRisco, corNivel;
  
  if (pontuacao >= 65) {
    nivelRisco = 'ALTO';
    corNivel = [220, 38, 38];
    interpretacao = `A pontuação de ${pontuacao} pontos situa-se significativamente ACIMA do ponto de corte clínico (46 pontos), indicando presença marcante de características compatíveis com o TEA.`;
    recomendacoes = 'Recomenda-se avaliação diagnóstica especializada completa com ADOS-2 e ADI-R.';
  } else if (pontuacao >= 46) {
    nivelRisco = 'MODERADO A ALTO';
    corNivel = [245, 158, 11];
    interpretacao = `A pontuação de ${pontuacao} pontos encontra-se ACIMA do ponto de corte (46). Sensibilidade de 90,1% para identificação do TEA.`;
    recomendacoes = 'Indicada avaliação diagnóstica complementar por profissional especializado em TEA.';
  } else if (pontuacao >= 32) {
    nivelRisco = 'LIMÍTROFE';
    corNivel = [234, 179, 8];
    interpretacao = `A pontuação de ${pontuacao} pontos situa-se em zona limítrofe, indicando algumas características do espectro.`;
    recomendacoes = 'Sugere-se avaliação clínica para investigação de possíveis traços autistas ou condições comórbidas.';
  } else {
    nivelRisco = 'BAIXO';
    corNivel = [34, 197, 94];
    interpretacao = `A pontuação de ${pontuacao} pontos encontra-se ABAIXO do ponto de corte (46), indicando baixa frequência de características do TEA.`;
    recomendacoes = 'Resultado não indica necessidade de investigação diagnóstica para TEA no momento.';
  }
  
  // PÁGINA 1
  doc.setFillColor(...azulEscuro);
  doc.rect(0, 0, 210, 60, 'F');
  doc.setFillColor(...azulPrimario);
  doc.rect(0, 0, 210, 55, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('RELATÓRIO DE RASTREAMENTO', 105, 15, { align: 'center' });
  
  doc.setFontSize(30);
  doc.setFont('helvetica', 'bold');
  doc.text('RAADS-R-BR SCREEN', 105, 28, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Escala Ritvo de Diagnóstico de Autismo em Adultos', 105, 37, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('Versão Brasileira Reduzida • 20 Itens', 105, 45, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.text('Equilibrium Neuropsicologia', 105, 52, { align: 'center' });
  
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...azulClaro);
  doc.setLineWidth(1);
  doc.roundedRect(15, 70, 180, 32, 4, 4, 'FD');
  
  doc.setTextColor(...azulPrimario);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO PACIENTE', 20, 78);
  
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(20, 80, 190, 80);
  
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('Paciente:', 20, 88);
  doc.setFont('helvetica', 'normal');
  doc.text(nome, 42, 88);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Data:', 20, 95);
  doc.setFont('helvetica', 'normal');
  doc.text(dataFormatada, 35, 95);
  
  doc.setFontSize(15);
  doc.setTextColor(...azulPrimario);
  doc.setFont('helvetica', 'bold');
  doc.text('Sobre o Instrumento', 15, 115);
  
  doc.setDrawColor(...azulPrimario);
  doc.setLineWidth(2);
  doc.line(15, 117, 55, 117);
  
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize('Instrumento de rastreamento para identificar características do TEA em adultos (20 itens).', 175), 15, 125);
  
  doc.setFillColor(...azulClarissimo);
  doc.setDrawColor(...azulClaro);
  doc.roundedRect(15, 140, 180, 22, 4, 4, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(...azulPrimario);
  doc.text('• Sensibilidade: 90,1%  • Especificidade: 87,9%  • Ponto de corte: 46 pontos', 20, 150);
  
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Página 1 de 2', 195, 285, { align: 'right' });
  
  // PÁGINA 2
  doc.addPage();
  
  doc.setFillColor(...azulPrimario);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Resultados da Avaliação', 15, 18);
  
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...azulClaro);
  doc.setLineWidth(2);
  doc.roundedRect(15, 38, 180, 50, 5, 5, 'FD');
  
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text('PONTUAÇÃO TOTAL OBTIDA', 105, 48, { align: 'center' });
  
  doc.setFontSize(52);
  doc.setTextColor(...corNivel);
  doc.text(pontuacao.toString(), 105, 70, { align: 'center' });
  
  doc.setFontSize(11);
  doc.text(`NÍVEL: ${nivelRisco}`, 105, 81, { align: 'center' });
  
  doc.setFontSize(13);
  doc.setTextColor(...azulPrimario);
  doc.setFont('helvetica', 'bold');
  doc.text('Comparativo', 15, 102);
  
  const gy = 110, gh = 60;
  doc.setFillColor(248, 250, 252);
  doc.rect(15, gy, 180, gh, 'F');
  
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  for (let i = 0; i <= 80; i += 20) {
    const y = gy + gh - (i / 80) * gh;
    doc.line(15, y, 195, y);
  }
  
  const bw = 35, bs = 20, bx = 45;
  const h1 = (pontuacao / 80) * gh;
  doc.setFillColor(...corNivel);
  doc.roundedRect(bx, gy + gh - h1, bw, h1, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(pontuacao.toString(), bx + bw/2, gy + gh - h1 + 14, { align: 'center' });
  
  const h2 = (46 / 80) * gh;
  doc.setFillColor(...azulPrimario);
  doc.roundedRect(bx + bw + bs, gy + gh - h2, bw, h2, 3, 3, 'F');
  doc.text('46', bx + bw + bs + bw/2, gy + gh - h2 + 14, { align: 'center' });
  
  doc.setFillColor(148, 163, 184);
  doc.roundedRect(bx + (bw + bs) * 2, gy, bw, gh, 3, 3, 'F');
  doc.text('80', bx + (bw + bs) * 2 + bw/2, gy + 14, { align: 'center' });
  
  doc.setFontSize(13);
  doc.setTextColor(...azulPrimario);
  doc.setFont('helvetica', 'bold');
  doc.text('Interpretação', 15, 191);
  
  doc.setFillColor(...azulClarissimo);
  doc.setDrawColor(...azulClaro);
  doc.roundedRect(15, 196, 180, 30, 4, 4, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(...azulEscuro);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(interpretacao, 170), 20, 201);
  
  doc.setFontSize(13);
  doc.setTextColor(...azulPrimario);
  doc.setFont('helvetica', 'bold');
  doc.text('Recomendações', 15, 235);
  
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(234, 179, 8);
  doc.roundedRect(15, 240, 180, 25, 4, 4, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(113, 63, 18);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(recomendacoes, 170), 20, 245);
  
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'italic');
  doc.text('Equilibrium Neuropsicologia', 105, 285, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Página 2 de 2', 195, 285, { align: 'right' });
  
  return doc.output('datauristring').split(',')[1];
}
