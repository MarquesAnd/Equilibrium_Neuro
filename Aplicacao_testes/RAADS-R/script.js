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
  
  // Cores do tema AZUL
  const azulPrimario = [26, 86, 219];
  const azulEscuro = [30, 58, 138];
  const azulClaro = [147, 197, 253];
  const azulClarissimo = [239, 246, 255];
  
  let interpretacao, detalhes, recomendacoes, consideracoes, nivelRisco, corNivel;
  
  if (pontuacao >= 65) {
    nivelRisco = 'ALTO';
    corNivel = [220, 38, 38];
    interpretacao = `A pontuação de ${pontuacao} pontos situa-se significativamente ACIMA do ponto de corte clínico (46 pontos), indicando presença marcante e consistente de características compatíveis com o Transtorno do Espectro Autista (TEA). Este resultado sugere padrões robustos de comportamento, comunicação e interação social alinhados com o perfil neurodivergente do espectro autista.`;
    detalhes = `Pontuações nesta faixa (≥65) apresentam alta probabilidade de corresponder a diagnóstico clínico de TEA quando confirmadas por avaliação especializada. Os comportamentos reportados indicam impacto significativo nas áreas de comunicação social, processamento sensorial e padrões de comportamento repetitivo/restrito. A intensidade e frequência das características autistas sugerem que o perfil neurodivergente é uma parte central da experiência e funcionamento da pessoa avaliada.`;
    recomendacoes = `INDICAÇÕES PRIORITÁRIAS: (1) Avaliação diagnóstica especializada completa, incluindo entrevista clínica estruturada (ADI-R) e observação comportamental padronizada (ADOS-2); (2) Investigação de áreas específicas: comunicação pragmática, teoria da mente, flexibilidade cognitiva, processamento sensorial; (3) Avaliação de funcionalidade adaptativa e identificação de necessidades de suporte; (4) Rastreamento de condições comórbidas (ansiedade, depressão, TDAH).`;
    consideracoes = `Este resultado não constitui diagnóstico, mas indica necessidade urgente de avaliação especializada. O diagnóstico formal de TEA requer análise criteriosa do histórico de desenvolvimento, observação clínica e aplicação de instrumentos diagnósticos padrão-ouro. Recomenda-se buscar profissional com experiência específica em avaliação de autismo em adultos.`;
  } else if (pontuacao >= 46) {
    nivelRisco = 'MODERADO A ALTO';
    corNivel = [245, 158, 11];
    interpretacao = `A pontuação de ${pontuacao} pontos encontra-se ACIMA do ponto de corte estabelecido (46 pontos) pelos estudos de validação brasileira do instrumento. Este resultado indica que a pessoa avaliada reporta frequência significativa de comportamentos e experiências compatíveis com características do Transtorno do Espectro Autista. Estatisticamente, pontuações nesta faixa apresentam sensibilidade de 90,1% para identificação do TEA, o que significa alta capacidade de detecção de casos verdadeiros.`;
    detalhes = `Pontuações entre 46 e 64 pontos sugerem presença de traços autistas em intensidade clinicamente relevante, com possível impacto no funcionamento social, comunicativo e comportamental. O resultado indica que características como dificuldades em reciprocidade social, comunicação não-verbal, compreensão de nuances sociais, flexibilidade comportamental ou sensibilidades sensoriais podem estar presentes de forma consistente. É importante considerar que este perfil pode manifestar-se de diferentes formas, especialmente em adultos que desenvolveram estratégias compensatórias ao longo da vida.`;
    recomendacoes = `RECOMENDAÇÕES: (1) Avaliação diagnóstica complementar por profissional especializado em TEA, incluindo investigação aprofundada de histórico de desenvolvimento e funcionamento atual; (2) Exploração de áreas específicas: comunicação social (pragmática, reciprocidade), padrões restritos/repetitivos de comportamento e interesses, processamento sensorial; (3) Avaliação de funcionamento adaptativo em contextos diversos (trabalho, relacionamentos, autonomia); (4) Investigação de possíveis condições comórbidas ou diagnósticos diferenciais.`;
    consideracoes = `Mesmo com pontuação acima do corte, o diagnóstico formal requer avaliação clínica abrangente. Alguns adultos no espectro autista desenvolvem mecanismos de compensação (masking) que podem não ser totalmente capturados por instrumentos de autorrelato. A avaliação especializada considerará histórico desenvolvimental, impacto funcional atual e observação comportamental direta.`;
  } else if (pontuacao >= 32) {
    nivelRisco = 'LIMÍTROFE';
    corNivel = [234, 179, 8];
    interpretacao = `A pontuação de ${pontuacao} pontos situa-se em zona limítrofe, abaixo do ponto de corte clínico (46 pontos), porém indicando presença de algumas características associadas ao espectro autista. Este resultado pode sugerir diferentes cenários: (a) presença de traços autistas subclínicos (Broader Autism Phenotype); (b) perfil neurodivergente que não preenche critérios diagnósticos completos; (c) condições relacionadas ou comórbidas que compartilham características com TEA; ou (d) estratégias compensatórias bem desenvolvidas (masking) que minimizam a expressão aparente dos traços.`;
    detalhes = `Pontuações na faixa limítrofe (32-45) requerem análise clínica cuidadosa. Podem indicar: traços autistas leves que não causam prejuízo significativo; autismo compensado/mascarado (comum em pessoas com alto funcionamento cognitivo ou que desenvolveram estratégias sociais ao longo da vida); outras condições neurodivergentes (TDAH, dispraxia, perfil de alta sensibilidade); ou características de personalidade que se sobrepõem parcialmente com o espectro. É importante considerar o contexto de vida, histórico de desenvolvimento e nível de funcionalidade atual.`;
    recomendacoes = `SUGESTÕES: (1) Avaliação clínica para investigação aprofundada de possíveis traços autistas e seu impacto no funcionamento diário; (2) Exploração de condições comórbidas ou alternativas (TDAH, ansiedade social, transtornos de personalidade, alta sensibilidade sensorial); (3) Análise do histórico de desenvolvimento, especialmente primeira infância e adolescência; (4) Consideração de contexto: masking (camuflagem social), compensação cognitiva, burnout autista; (5) Avaliação de necessidades de suporte, independente de diagnóstico formal.`;
    consideracoes = `Resultado limítrofe não exclui possibilidade de TEA, especialmente em adultos com estratégias compensatórias desenvolvidas. Acompanhamento pode ser benéfico mesmo sem diagnóstico formal, focando em autoconhecimento, desenvolvimento de estratégias adaptativas e suporte em áreas de dificuldade. Considere que diagnóstico tardio de autismo é comum em pessoas que desenvolveram mecanismos sofisticados de compensação social.`;
  } else {
    nivelRisco = 'BAIXO';
    corNivel = [34, 197, 94];
    interpretacao = `A pontuação de ${pontuacao} pontos encontra-se ABAIXO do ponto de corte estabelecido (46 pontos), indicando ausência ou baixa frequência de características típicas do Transtorno do Espectro Autista conforme rastreadas por este instrumento. O resultado sugere padrão de respostas não compatível com o perfil autista na população clínica, com especificidade de 87,9% (baixa taxa de falsos positivos).`;
    detalhes = `Pontuações baixas (<32) geralmente indicam que a pessoa não apresenta características autistas em intensidade ou frequência clinicamente significativas. A comunicação social, flexibilidade comportamental, processamento sensorial e outros domínios avaliados parecem estar dentro da variabilidade neurotípica esperada. Este resultado, no entanto, não exclui completamente outras condições ou perfis neurodivergentes que possam compartilhar algumas características pontuais com o espectro autista.`;
    recomendacoes = `ORIENTAÇÕES: (1) Resultado não indica necessidade de investigação diagnóstica para TEA no momento atual; (2) Caso persistam dúvidas clínicas, dificuldades significativas em comunicação social, padrões comportamentais rígidos ou sensibilidades sensoriais impactantes, considerar avaliação neuropsicológica abrangente; (3) Investigar outras possíveis condições se houver queixas específicas: TDAH, ansiedade, depressão, dificuldades de aprendizagem, transtornos de processamento sensorial; (4) Considerar que características autistas podem manifestar-se de forma diferente ao longo da vida.`;
    consideracoes = `Um resultado negativo no rastreamento não exclui definitivamente TEA em casos atípicos ou com apresentação sutil. Mulheres, pessoas com alto QI e indivíduos com forte camuflagem social podem pontuar abaixo do corte mesmo apresentando características autistas. Se houver suspeita clínica fundamentada, avaliação especializada ainda pode ser pertinente.`;
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // PÁGINA 1
  // ═══════════════════════════════════════════════════════════════════
  
  // Cabeçalho
  doc.setFillColor(...azulEscuro);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setFillColor(...azulPrimario);
  doc.rect(0, 0, 210, 42, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('RELATÓRIO DE RASTREAMENTO NEUROPSICOLÓGICO', 105, 12, { align: 'center' });
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('RAADS-R-BR SCREEN', 105, 23, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Escala Ritvo de Diagnóstico de Autismo em Adultos', 105, 30, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Versão Brasileira Reduzida (20 itens)', 105, 36, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.text('Equilibrium Neuropsicologia', 105, 40, { align: 'center' });
  
  // Dados do paciente
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...azulClaro);
  doc.setLineWidth(0.8);
  doc.roundedRect(15, 50, 180, 22, 3, 3, 'FD');
  
  doc.setTextColor(...azulPrimario);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('IDENTIFICAÇÃO DO PACIENTE', 20, 56);
  
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(20, 58, 190, 58);
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Nome:', 20, 64);
  doc.setFont('helvetica', 'normal');
  doc.text(nome, 35, 64);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Data da Avaliação:', 20, 69);
  doc.setFont('helvetica', 'normal');
  doc.text(dataFormatada, 54, 69);
  
  // Sobre o instrumento
  doc.setFontSize(12);
  doc.setTextColor(...azulPrimario);
  doc.setFont('helvetica', 'bold');
  doc.text('Sobre o Instrumento', 15, 80);
  
  doc.setDrawColor(...azulPrimario);
  doc.setLineWidth(1.5);
  doc.line(15, 82, 50, 82);
  
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  const sobre = `O RAADS-R-BR Screen (Ritvo Autism Asperger Diagnostic Scale - Revised - Brazilian version) é um instrumento de rastreamento autoaplicável desenvolvido especificamente para identificar características do Transtorno do Espectro Autista (TEA) em adultos. Esta versão brasileira reduzida, validada para a população nacional, é composta por 20 itens criteriosamente selecionados que avaliam quatro domínios centrais do perfil neurodivergente autista: Comunicação e Interação Social, Linguagem Pragmática, Processamento Sensório-Motor e Padrões Restritos/Repetitivos de Comportamento.`;
  doc.text(doc.splitTextToSize(sobre, 175), 15, 88);
  
  // Propriedades
  doc.setFillColor(...azulClarissimo);
  doc.setDrawColor(...azulClaro);
  doc.setLineWidth(0.8);
  doc.roundedRect(15, 112, 180, 24, 3, 3, 'FD');
  
  doc.setFontSize(10);
  doc.setTextColor(...azulEscuro);
  doc.setFont('helvetica', 'bold');
  doc.text('Propriedades Psicométricas (Validação Brasileira)', 20, 119);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...azulPrimario);
  doc.text('• Sensibilidade: 90,1% (capacidade de identificar casos verdadeiros de TEA)', 20, 125);
  doc.text('• Especificidade: 87,9% (capacidade de excluir casos não-TEA)', 20, 130);
  doc.text('• Ponto de Corte: 46 pontos (≥46 = rastreamento positivo para TEA)', 20, 135);
  
  // Nota importante
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(234, 179, 8);
  doc.setLineWidth(0.8);
  doc.roundedRect(15, 142, 180, 26, 3, 3, 'FD');
  
  doc.setFontSize(9);
  doc.setTextColor(146, 64, 14);
  doc.setFont('helvetica', 'bold');
  doc.text('⚠ IMPORTANTE - Natureza do Instrumento', 20, 149);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(92, 64, 14);
  doc.setFontSize(7.5);
  const nota = `Este é um instrumento de RASTREAMENTO (screening), não diagnóstico. Sua função é identificar indivíduos que apresentam características compatíveis com TEA e que devem ser encaminhados para avaliação diagnóstica especializada. O diagnóstico formal de Transtorno do Espectro Autista deve ser realizado por profissional qualificado (psiquiatra ou psicólogo especializado), utilizando critérios do DSM-5-TR ou CID-11, avaliação clínica abrangente, histórico desenvolvimental detalhado e, preferencialmente, instrumentos diagnósticos padrão-ouro (ADOS-2, ADI-R).`;
  doc.text(doc.splitTextToSize(nota, 170), 20, 154);
  
  // Contexto clínico
  doc.setFontSize(12);
  doc.setTextColor(...azulPrimario);
  doc.setFont('helvetica', 'bold');
  doc.text('Contexto Clínico', 15, 176);
  
  doc.setDrawColor(...azulPrimario);
  doc.setLineWidth(1.5);
  doc.line(15, 178, 45, 178);
  
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  const contexto = `O TEA é uma condição do neurodesenvolvimento caracterizada por diferenças persistentes na comunicação social e interação, acompanhadas de padrões restritos e repetitivos de comportamento, interesses ou atividades. Em adultos, o diagnóstico pode ser desafiador devido a estratégias compensatórias desenvolvidas ao longo da vida (masking/camouflage). Características como dificuldades em reciprocidade social-emocional, comunicação não-verbal, compreensão de nuances sociais, flexibilidade cognitiva, e sensibilidades sensoriais atípicas são centrais ao perfil autista. É importante considerar que o espectro é amplo e heterogêneo, manifestando-se de formas diversas entre indivíduos.`;
  doc.text(doc.splitTextToSize(contexto, 175), 15, 184);
  
  // Rodapé
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(15, 283, 195, 283);
  
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'italic');
  doc.text('Documento confidencial | Equilibrium Neuropsicologia | Avaliação Neuropsicológica Especializada', 105, 287, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Página 1 de 2', 195, 287, { align: 'right' });
  
  // ═══════════════════════════════════════════════════════════════════
  // PÁGINA 2
  // ═══════════════════════════════════════════════════════════════════
  
  doc.addPage();
  
  // Cabeçalho
  doc.setFillColor(...azulPrimario);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Resultados da Avaliação', 15, 14);
  
  // Card de pontuação
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...azulClaro);
  doc.setLineWidth(1.5);
  doc.roundedRect(15, 28, 180, 38, 4, 4, 'FD');
  
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('PONTUAÇÃO TOTAL OBTIDA', 105, 35, { align: 'center' });
  
  doc.setFontSize(42);
  doc.setTextColor(...corNivel);
  doc.setFont('helvetica', 'bold');
  doc.text(pontuacao.toString(), 105, 52, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`NÍVEL DE RISCO: ${nivelRisco}`, 105, 61, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('Corte: 46 pts | Máxima: 80 pts', 105, 65, { align: 'center' });
  
  // Gráfico compacto e bonito
  doc.setFontSize(11);
  doc.setTextColor(...azulPrimario);
  doc.setFont('helvetica', 'bold');
  doc.text('Visualização Comparativa', 15, 76);
  
  const gy = 82, gh = 45, gw = 180;
  
  // Fundo
  doc.setFillColor(248, 250, 252);
  doc.rect(15, gy, gw, gh, 'F');
  
  // Grid fino
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  for (let i = 0; i <= 80; i += 20) {
    const y = gy + gh - (i / 80) * gh;
    doc.line(15, y, 195, y);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(i.toString(), 12, y + 1, { align: 'right' });
  }
  
  // Barras finas e elegantes
  const bw = 28, bs = 22, bx = 50;
  
  const h1 = (pontuacao / 80) * gh;
  doc.setFillColor(...corNivel);
  doc.roundedRect(bx, gy + gh - h1, bw, h1, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(pontuacao.toString(), bx + bw/2, gy + gh - h1 + 10, { align: 'center' });
  
  const h2 = (46 / 80) * gh;
  doc.setFillColor(...azulPrimario);
  doc.roundedRect(bx + bw + bs, gy + gh - h2, bw, h2, 2, 2, 'F');
  doc.text('46', bx + bw + bs + bw/2, gy + gh - h2 + 10, { align: 'center' });
  
  doc.setFillColor(148, 163, 184);
  doc.roundedRect(bx + (bw + bs) * 2, gy, bw, gh, 2, 2, 'F');
  doc.text('80', bx + (bw + bs) * 2 + bw/2, gy + 10, { align: 'center' });
  
  // Labels
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('Paciente', bx + bw/2, gy + gh + 4, { align: 'center' });
  doc.text('Corte', bx + bw + bs + bw/2, gy + gh + 4, { align: 'center' });
  doc.text('Máxima', bx + (bw + bs) * 2 + bw/2, gy + gh + 4, { align: 'center' });
  
  // Interpretação
  doc.setFontSize(11);
  doc.setTextColor(...azulPrimario);
  doc.setFont('helvetica', 'bold');
  doc.text('Interpretação Clínica', 15, 136);
  
  doc.setFillColor(...azulClarissimo);
  doc.setDrawColor(...azulClaro);
  doc.setLineWidth(0.8);
  doc.roundedRect(15, 140, 180, 30, 3, 3, 'FD');
  
  doc.setFontSize(8);
  doc.setTextColor(...azulEscuro);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(interpretacao, 170), 20, 144);
  
  // Detalhamento
  doc.setFontSize(11);
  doc.setTextColor(...azulPrimario);
  doc.setFont('helvetica', 'bold');
  doc.text('Análise Detalhada', 15, 176);
  
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.8);
  doc.roundedRect(15, 180, 180, 28, 3, 3, 'FD');
  
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(detalhes, 170), 20, 184);
  
  // Recomendações
  doc.setFontSize(11);
  doc.setTextColor(...azulPrimario);
  doc.setFont('helvetica', 'bold');
  doc.text('Recomendações Clínicas', 15, 214);
  
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(234, 179, 8);
  doc.setLineWidth(0.8);
  doc.roundedRect(15, 218, 180, 26, 3, 3, 'FD');
  
  doc.setFontSize(7.5);
  doc.setTextColor(113, 63, 18);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(recomendacoes, 170), 20, 222);
  
  // Considerações finais
  doc.setFontSize(11);
  doc.setTextColor(...azulPrimario);
  doc.setFont('helvetica', 'bold');
  doc.text('Considerações Finais', 15, 250);
  
  doc.setFillColor(...azulClarissimo);
  doc.setDrawColor(...azulClaro);
  doc.setLineWidth(0.8);
  doc.roundedRect(15, 254, 180, 24, 3, 3, 'FD');
  
  doc.setFontSize(7.5);
  doc.setTextColor(...azulEscuro);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(consideracoes, 170), 20, 258);
  
  // Rodapé
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(15, 283, 195, 283);
  
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('Confidencial | Destinado exclusivamente ao paciente e profissionais autorizados', 105, 286, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Equilibrium Neuropsicologia | Avaliação Especializada em Neurodesenvolvimento', 105, 290, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Página 2 de 2', 195, 290, { align: 'right' });
  
  return doc.output('datauristring').split(',')[1];
}

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
