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
if (typeof DATA_PATH === "undefined") { var DATA_PATH = "../data/raadsr_rules.json"; }

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
  const path = (typeof DATA_PATH !== "undefined") ? DATA_PATH : "../data/raadsr_rules.json";
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

  const labels = form.answer_labels || {
    "1": "Isso é verdade agora e era verdade quando eu era jovem",
    "2": "Isso é verdade apenas agora",
    "3": "Isso é verdade apenas quando eu era mais jovem (16 anos ou menos)",
    "4": "Isso nunca foi verdade"
  };

  for(const item of form.items){
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.itemId = item.id;

    const reverseTag = item.reverse ? `<span class="tag">⚠️ Invertida</span>` : "";

    let optionsHtml = "";
    for(let val = 1; val <= 4; val++){
      const inputId = `q${item.id}_opt${val}`;
      optionsHtml += `
        <div class="item-option">
          <input type="radio" name="q${item.id}" id="${inputId}" value="${val}">
          <label for="${inputId}">${escapeHtml(labels[String(val)])}</label>
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
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:800px;margin:0 auto;">

      <!-- HEADER -->
      <div style="background:linear-gradient(135deg,#0c1f3f 0%,#1a3a6a 50%,#1e40af 100%);color:#fff;padding:14px 24px 12px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-50px;right:-50px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.03)"></div>
        <div style="position:absolute;bottom:-30px;left:40%;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,.02)"></div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;position:relative;">
          <div style="display:flex;align-items:center;gap:16px;">
            <img src="/logo2.png" alt="Logo" style="width:30px;height:30px;object-fit:contain;filter:brightness(10);flex-shrink:0;" onerror="this.style.display='none'">
            <div>
              <div style="font-size:8px;text-transform:uppercase;letter-spacing:3px;opacity:.45;">Relatório Neuropsicológico</div>
              <div style="font-size:20px;font-weight:800;margin-top:3px;letter-spacing:-.5px;">RAADS-R-BR Screen</div>
              <div style="font-size:10px;opacity:.55;margin-top:2px;">Escala Ritvo para Diagnóstico de Autismo em Adultos — Versão Brasileira Reduzida</div>
              <div style="font-size:9px;opacity:.45;margin-top:1px;">Rastreio de Transtorno do Espectro Autista em adultos</div>
            </div>
          </div>
          <div style="background:rgba(255,255,255,.08);border-radius:8px;padding:6px 10px;backdrop-filter:blur(8px);text-align:right;">
            <div style="font-size:7px;text-transform:uppercase;letter-spacing:2px;opacity:.5;">Pontuação</div>
            <div style="font-size:16px;font-weight:800;margin-top:1px;">${resultado.total} / ${resultado.maxScore}</div>
            <div style="font-size:8px;opacity:.5;margin-top:1px;">Corte: ${resultado.cutoff}</div>
          </div>
        </div>
      </div>

      <div style="padding:0 24px 24px;">

        <!-- 1. IDENTIFICAÇÃO -->
        <div style="display:flex;align-items:center;gap:8px;margin:14px 0 10px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:#1a56db;color:#fff;font-size:10px;font-weight:800;">1</span>
          <span style="font-weight:700;font-size:13px;color:#0f172a;">Identificação</span>
        </div>
        <div style="background:#f8fafc;border-radius:10px;padding:12px 16px;border:1px solid #e2e8f0;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:#334155;">
            <div><span style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.3px;">Paciente:</span> <span style="font-weight:700;">${escapeHtml(paciente)}</span></div>
            <div><span style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.3px;">Data da Avaliação:</span> <span style="font-weight:600;">${dataFormatada}</span></div>
          </div>
        </div>

        <!-- 2. SOBRE O INSTRUMENTO -->
        <div style="display:flex;align-items:center;gap:8px;margin:14px 0 10px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:#1a56db;color:#fff;font-size:10px;font-weight:800;">2</span>
          <span style="font-weight:700;font-size:13px;color:#0f172a;">Sobre o Instrumento</span>
        </div>
        <div style="background:#f8fafc;border-radius:10px;padding:12px 16px;border:1px solid #e2e8f0;">
          <p style="color:#475569;font-size:11px;line-height:1.7;margin:0 0 8px;">
            O RAADS-R-BR Screen é uma escala de rastreio desenvolvida para identificar características do Transtorno do Espectro Autista (TEA) em adultos. A versão utilizada é composta por 20 itens que avaliam domínios centrais do perfil neurodivergente, incluindo: Interação Social, Linguagem, Sensório-Motor e Interesses Circunscritos.
          </p>
          <p style="color:#475569;font-size:11px;line-height:1.7;margin:0;">
            O instrumento foi validado para o contexto brasileiro, apresentando evidências robustas de validade e confiabilidade, com <strong>sensibilidade de 90,1%</strong> e <strong>especificidade de 87,9%</strong> para o ponto de corte estabelecido.
          </p>
        </div>

        <!-- 3. RESULTADOS OBTIDOS -->
        <div style="display:flex;align-items:center;gap:8px;margin:14px 0 10px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:#1a56db;color:#fff;font-size:10px;font-weight:800;">3</span>
          <span style="font-weight:700;font-size:13px;color:#0f172a;">Resultados Obtidos</span>
        </div>

        <div style="border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:16px;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr>
                <th style="padding:6px 8px;text-align:left;font-weight:700;font-size:9px;text-transform:uppercase;letter-spacing:.4px;border-bottom:2px solid #e2e8f0;background:#dbeafe;color:#1e40af;">Medida</th>
                <th style="padding:6px 8px;text-align:center;font-weight:700;font-size:9px;text-transform:uppercase;letter-spacing:.4px;border-bottom:2px solid #e2e8f0;background:#dbeafe;color:#1e40af;">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:5px 8px;font-size:11px;border-bottom:1px solid #f1f5f9;font-weight:600;">Pontuação do Paciente</td>
                <td style="padding:5px 8px;font-size:15px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:800;color:#dc2626;">${resultado.total}</td>
              </tr>
              <tr style="background:#f8fafc;">
                <td style="padding:5px 8px;font-size:11px;border-bottom:1px solid #f1f5f9;font-weight:600;">Ponto de Corte</td>
                <td style="padding:5px 8px;font-size:15px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:800;color:#1e40af;">${resultado.cutoff}</td>
              </tr>
              <tr>
                <td style="padding:5px 8px;font-size:11px;border-bottom:1px solid #f1f5f9;font-weight:600;">Pontuação Máxima</td>
                <td style="padding:5px 8px;font-size:11px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:700;color:#334155;">${resultado.maxScore}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Gráfico -->
        <div id="grafico-container" style="margin:16px 0;">
          <div style="text-align:center;padding:30px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
            <p style="color:#64748b;font-size:11px;margin:0;">O gráfico comparativo será gerado automaticamente</p>
          </div>
        </div>

        <!-- 4. INTERPRETAÇÃO -->
        <div style="display:flex;align-items:center;gap:8px;margin:14px 0 10px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:#1a56db;color:#fff;font-size:10px;font-weight:800;">4</span>
          <span style="font-weight:700;font-size:13px;color:#0f172a;">Interpretação</span>
        </div>
        <div style="background:#f8fafc;border-radius:10px;padding:12px 16px;border:1px solid #e2e8f0;">
          <p style="color:#334155;font-size:11px;line-height:1.8;margin:0;">
            ${resultado.interpretacao}
          </p>
        </div>

        <!-- RODAPÉ -->
        <div style="border-top:2px solid #e2e8f0;padding-top:16px;margin-top:22px;display:flex;justify-content:space-between;">
          <div style="color:#64748b;font-size:12px;">Documento gerado automaticamente</div>
          <div style="text-align:right;">
            <div style="font-size:11px;color:#64748b;">Documento gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
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
