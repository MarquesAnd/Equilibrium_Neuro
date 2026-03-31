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
      const labelText = labels[val - 1]; // Array começa em 0, mas valor é 1-4
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

async function gerarPDFDrive(nome, data, pontuacao) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const dataObj = new Date(data + 'T00:00:00');
  const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  // Determinar interpretação detalhada
  let interpretacao = '';
  let recomendacoes = '';
  let nivelRisco = '';
  let corNivel = [0, 0, 0];
  
  if (pontuacao >= 65) {
    nivelRisco = 'ALTO';
    corNivel = [220, 38, 38]; // Vermelho forte
    interpretacao = `A pontuação de ${pontuacao} pontos situa-se significativamente ACIMA do ponto de corte clínico (46 pontos), indicando presença marcante de características compatíveis com o Transtorno do Espectro Autista (TEA). Este resultado sugere padrões consistentes de comportamento, comunicação e interação social alinhados com o perfil neurodivergente do espectro autista.`;
    recomendacoes = 'Recomenda-se avaliação diagnóstica especializada completa, incluindo entrevista clínica estruturada, observação comportamental e aplicação de instrumentos complementares (ADOS-2, ADI-R). A pontuação elevada indica necessidade de investigação aprofundada para diagnóstico diferencial e planejamento terapêutico individualizado.';
  } else if (pontuacao >= 46) {
    nivelRisco = 'MODERADO A ALTO';
    corNivel = [245, 158, 11]; // Laranja
    interpretacao = `A pontuação de ${pontuacao} pontos encontra-se ACIMA do ponto de corte estabelecido (46 pontos) pelos estudos de validação brasileira. Este resultado indica que a pessoa avaliada reporta frequência significativa de comportamentos e experiências compatíveis com características do Transtorno do Espectro Autista. Estatisticamente, pontuações nesta faixa apresentam sensibilidade de 90,1% para identificação do TEA.`;
    recomendacoes = 'Indicada avaliação diagnóstica complementar por profissional especializado em TEA. Recomenda-se investigação de áreas específicas: comunicação social, padrões restritos/repetitivos de comportamento, processamento sensorial e funcionamento adaptativo. A pontuação sugere necessidade de acompanhamento clínico.';
  } else if (pontuacao >= 32) {
    nivelRisco = 'LIMÍTROFE';
    corNivel = [250, 204, 21]; // Amarelo
    interpretacao = `A pontuação de ${pontuacao} pontos situa-se em zona limítrofe, abaixo do ponto de corte clínico (46 pontos), porém indicando presença de algumas características do espectro autista. Este resultado pode sugerir traços subclínicos, perfil neurodivergente sem necessariamente preencher critérios diagnósticos completos, ou possibilidade de diagnóstico diferencial.`;
    recomendacoes = 'Sugere-se avaliação clínica para investigação de possíveis traços autistas, condições comórbidas (TDAH, ansiedade, depressão) ou outros perfis neurodivergentes. Considerar histórico de desenvolvimento, funcionalidade atual e impacto nas áreas de vida. Acompanhamento pode ser benéfico mesmo sem diagnóstico formal.';
  } else {
    nivelRisco = 'BAIXO';
    corNivel = [34, 197, 94]; // Verde
    interpretacao = `A pontuação de ${pontuacao} pontos encontra-se ABAIXO do ponto de corte estabelecido (46 pontos), indicando ausência ou baixa frequência de características típicas do Transtorno do Espectro Autista conforme rastreadas por este instrumento. O resultado sugere padrão de respostas não compatível com o perfil autista na população clínica.`;
    recomendacoes = 'Resultado não indica necessidade de investigação diagnóstica para TEA. Caso persistam dúvidas clínicas ou dificuldades significativas nas áreas de comunicação social, comportamento ou processamento sensorial, considerar avaliação neuropsicológica abrangente para investigação de outras condições ou perfis cognitivos.';
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // PÁGINA 1 - CAPA E INFORMAÇÕES GERAIS
  // ═══════════════════════════════════════════════════════════════════
  
  // Cabeçalho com gradiente roxo
  doc.setFillColor(91, 33, 182); // Roxo escuro
  doc.rect(0, 0, 210, 50, 'F');
  
  // Logo (se houver)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('RAADS-R-BR SCREEN', 105, 22, { align: 'center' });
  
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text('Escala Ritvo de Diagnóstico de Autismo em Adultos', 105, 32, { align: 'center' });
  doc.text('Versão Brasileira Reduzida (20 itens)', 105, 40, { align: 'center' });
  
  // Informações do paciente em card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 60, 180, 35, 3, 3, 'F');
  
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 78, 195, 78);
  
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO PACIENTE', 20, 68);
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Nome:', 20, 85);
  doc.setFont('helvetica', 'normal');
  doc.text(nome, 38, 85);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Data da Avaliação:', 20, 91);
  doc.setFont('helvetica', 'normal');
  doc.text(dataFormatada, 58, 91);
  
  // Sobre o Instrumento
  doc.setFontSize(16);
  doc.setTextColor(91, 33, 182);
  doc.setFont('helvetica', 'bold');
  doc.text('Sobre o Instrumento', 15, 110);
  
  doc.setDrawColor(91, 33, 182);
  doc.setLineWidth(1);
  doc.line(15, 112, 50, 112);
  
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  
  const textoSobre1 = 'O RAADS-R-BR Screen é um instrumento de rastreamento desenvolvido especificamente para identificar características do Transtorno do Espectro Autista (TEA) em adultos. Esta versão brasileira reduzida é composta por 20 itens criteriosamente selecionados que avaliam domínios centrais do perfil neurodivergente autista:';
  const linhasSobre1 = doc.splitTextToSize(textoSobre1, 175);
  doc.text(linhasSobre1, 15, 120);
  
  // Domínios em bullets com ícones
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(237, 233, 254);
  doc.circle(20, 144, 2, 'F');
  doc.setTextColor(91, 33, 182);
  doc.text('Comunicação e Interação Social:', 25, 145);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Habilidades de reciprocidade social, empatia e teoria da mente', 82, 145);
  
  doc.setFillColor(237, 233, 254);
  doc.circle(20, 151, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(91, 33, 182);
  doc.text('Linguagem e Comunicação:', 25, 152);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Compreensão literal, interpretação de expressões idiomáticas', 70, 152);
  
  doc.setFillColor(237, 233, 254);
  doc.circle(20, 158, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(91, 33, 182);
  doc.text('Processamento Sensório-Motor:', 25, 159);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Sensibilidades sensoriais, estereotipias, maneirismos motores', 72, 159);
  
  doc.setFillColor(237, 233, 254);
  doc.circle(20, 165, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(91, 33, 182);
  doc.text('Interesses Circunscritos e Rotinas:', 25, 166);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Padrões repetitivos, rigidez comportamental, interesses específicos', 80, 166);
  
  // Propriedades Psicométricas
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(15, 175, 180, 28, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setTextColor(146, 64, 14);
  doc.setFont('helvetica', 'bold');
  doc.text('⚡ Propriedades Psicométricas da Versão Brasileira', 20, 183);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(92, 64, 14);
  doc.text('• Sensibilidade: 90,1% (alta capacidade de identificar casos positivos)', 20, 190);
  doc.text('• Especificidade: 87,9% (baixa taxa de falsos positivos)', 20, 195);
  doc.text('• Ponto de corte: 46 pontos (validado em população brasileira)', 20, 200);
  
  // Nota Importante
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.8);
  doc.roundedRect(15, 210, 180, 25, 3, 3, 'FD');
  
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.text('ℹ IMPORTANTE', 20, 217);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 58, 138);
  const textoNota = 'Este é um instrumento de RASTREAMENTO, não diagnóstico. O diagnóstico de TEA deve ser realizado por profissional especializado, utilizando critérios do DSM-5 ou CID-11, avaliação clínica abrangente e instrumentos diagnósticos padronizados (ADOS-2, ADI-R).';
  const linhasNota = doc.splitTextToSize(textoNota, 170);
  doc.text(linhasNota, 20, 223);
  
  // Rodapé página 1
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'italic');
  doc.text('Relatório gerado por Equilibrium Neuropsicologia', 105, 285, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Página 1 de 2', 195, 285, { align: 'right' });
  
  // ═══════════════════════════════════════════════════════════════════
  // PÁGINA 2 - RESULTADOS E INTERPRETAÇÃO
  // ═══════════════════════════════════════════════════════════════════
  
  doc.addPage();
  
  // Cabeçalho página 2
  doc.setFillColor(91, 33, 182);
  doc.rect(0, 0, 210, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Resultados da Avaliação', 15, 16);
  
  // Card de Pontuação Total com destaque
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1.5);
  doc.roundedRect(15, 35, 180, 45, 5, 5, 'FD');
  
  // Título do resultado
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('PONTUAÇÃO TOTAL OBTIDA', 105, 45, { align: 'center' });
  
  // Pontuação grande centralizada
  doc.setFontSize(48);
  doc.setTextColor(...corNivel);
  doc.setFont('helvetica', 'bold');
  doc.text(pontuacao.toString(), 105, 65, { align: 'center' });
  
  // Classificação
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`NÍVEL DE RISCO: ${nivelRisco}`, 105, 74, { align: 'center' });
  
  // Barras de referência
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('Ponto de Corte: 46 pts', 40, 74);
  doc.text('Pontuação Máxima: 80 pts', 135, 74);
  
  // Gráfico de barras melhorado
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('Comparativo de Pontuações', 15, 95);
  
  const graficoY = 105;
  const graficoAltura = 60;
  const graficoLargura = 180;
  
  // Fundo do gráfico
  doc.setFillColor(248, 250, 252);
  doc.rect(15, graficoY, graficoLargura, graficoAltura, 'F');
  
  // Grid horizontal
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  for (let i = 0; i <= 80; i += 20) {
    const y = graficoY + graficoAltura - (i / 80) * graficoAltura;
    doc.line(15, y, 195, y);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(i.toString(), 12, y + 1.5, { align: 'right' });
  }
  
  // Barras
  const barWidth = 35;
  const barSpacing = 20;
  const startX = 40;
  
  // Barra 1 - Pontuação do Paciente
  const altura1 = (pontuacao / 80) * graficoAltura;
  doc.setFillColor(...corNivel);
  doc.roundedRect(startX, graficoY + graficoAltura - altura1, barWidth, altura1, 2, 2, 'F');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(pontuacao.toString(), startX + barWidth/2, graficoY + graficoAltura - altura1 + 12, { align: 'center' });
  
  // Barra 2 - Ponto de Corte
  const altura2 = (46 / 80) * graficoAltura;
  doc.setFillColor(59, 130, 246);
  doc.roundedRect(startX + barWidth + barSpacing, graficoY + graficoAltura - altura2, barWidth, altura2, 2, 2, 'F');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('46', startX + barWidth + barSpacing + barWidth/2, graficoY + graficoAltura - altura2 + 12, { align: 'center' });
  
  // Barra 3 - Máxima
  doc.setFillColor(148, 163, 184);
  doc.roundedRect(startX + (barWidth + barSpacing) * 2, graficoY + graficoAltura - graficoAltura, barWidth, graficoAltura, 2, 2, 'F');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('80', startX + (barWidth + barSpacing) * 2 + barWidth/2, graficoY + 12, { align: 'center' });
  
  // Labels das barras
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Pontuação', startX + barWidth/2, graficoY + graficoAltura + 5, { align: 'center' });
  doc.text('do Paciente', startX + barWidth/2, graficoY + graficoAltura + 9, { align: 'center' });
  
  doc.text('Ponto de', startX + barWidth + barSpacing + barWidth/2, graficoY + graficoAltura + 5, { align: 'center' });
  doc.text('Corte', startX + barWidth + barSpacing + barWidth/2, graficoY + graficoAltura + 9, { align: 'center' });
  
  doc.text('Pontuação', startX + (barWidth + barSpacing) * 2 + barWidth/2, graficoY + graficoAltura + 5, { align: 'center' });
  doc.text('Máxima', startX + (barWidth + barSpacing) * 2 + barWidth/2, graficoY + graficoAltura + 9, { align: 'center' });
  
  // Interpretação Clínica
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('Interpretação Clínica', 15, 183);
  
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(147, 197, 253);
  doc.setLineWidth(0.8);
  doc.roundedRect(15, 188, 180, 35, 3, 3, 'FD');
  
  doc.setFontSize(9);
  doc.setTextColor(30, 58, 138);
  doc.setFont('helvetica', 'normal');
  const linhasInterp = doc.splitTextToSize(interpretacao, 170);
  doc.text(linhasInterp, 20, 193);
  
  // Recomendações
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('Recomendações', 15, 232);
  
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(253, 224, 71);
  doc.setLineWidth(0.8);
  doc.roundedRect(15, 237, 180, 30, 3, 3, 'FD');
  
  doc.setFontSize(9);
  doc.setTextColor(113, 63, 18);
  doc.setFont('helvetica', 'normal');
  const linhasRec = doc.splitTextToSize(recomendacoes, 170);
  doc.text(linhasRec, 20, 242);
  
  // Rodapé final
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 275, 195, 275);
  
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('Este relatório é confidencial e destina-se exclusivamente ao paciente e profissionais autorizados.', 105, 280, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Equilibrium Neuropsicologia | Avaliação Neuropsicológica Especializada', 105, 285, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Página 2 de 2', 195, 285, { align: 'right' });
  
  // Retornar PDF em base64
  return doc.output('datauristring').split(',')[1];
}
