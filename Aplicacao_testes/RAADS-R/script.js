/**
 * RAADS-R SCRIPT — Aplicação com Google Drive
 * Equilibrium Neuropsicologia
 */

let RAADSR_RULES = null;
const $ = (sel) => document.querySelector(sel);

if (typeof DATA_PATH === "undefined") { var DATA_PATH = "/Aplicacao_testes/RAADS-R/data/raadsr_rules.json"; }

function aplicarAcento(){
  if(!window.RAADSR_ACCENT_VAR) return;
  const root = document.documentElement;
  const val = getComputedStyle(root).getPropertyValue(window.RAADSR_ACCENT_VAR).trim();
  if(val) root.style.setProperty('--raadsr-accent', val);
}

function escapeHtml(str){
  return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function setSubtitle(msg){
  const el = $("#subtitle");
  if(el) el.textContent = msg;
}

async function carregarRegras(){
  const path = (typeof DATA_PATH !== "undefined") ? DATA_PATH : "/Aplicacao_testes/RAADS-R/data/raadsr_rules.json";
  let res;
  try {
    res = await fetch(path, { cache: "no-store" });
  } catch(netErr) {
    throw new Error("Falha de rede: " + path);
  }
  if(!res.ok) throw new Error("Arquivo não encontrado: " + path);
  try {
    RAADSR_RULES = await res.json();
  } catch(jsonErr) {
    throw new Error("JSON inválido: " + path);
  }
  if(!RAADSR_RULES || !Array.isArray(RAADSR_RULES.forms)) {
    throw new Error("Formato inválido em raadsr_rules.json");
  }
}

function getForm(){
  if(!RAADSR_RULES) return null;
  return (RAADSR_RULES.forms || []).find(f => f.form === FORM_KEY) || null;
}

function renderItens(){
  const form = getForm();
  const container = $("#itens");
  if(!container) return;
  container.innerHTML = "";

  if(!form){
    container.innerHTML = `<div style="color:#dc2626">⚠️ Erro ao carregar formulário.</div>`;
    return;
  }

  setSubtitle(form.label || "RAADS-R-BR Screen");

  for(const item of form.items){
    const itemDiv = document.createElement("div");
    itemDiv.className = "item";
    const reverseTag = item.reverse ? '<span class="tag">⚠️ INVERTIDA</span>' : '';
    itemDiv.innerHTML = `
      <div class="item-header">
        <div class="item-num">${item.id}</div>
        <div class="item-text">${escapeHtml(item.text)} ${reverseTag}</div>
      </div>
      <div class="item-options">
        ${form.answer_labels.map((label, idx) => {
          const value = idx + 1;
          return `<label class="opt">
            <input type="radio" name="q${item.id}" value="${value}" style="display:none" />
            <span>${escapeHtml(label)}</span>
          </label>`;
        }).join('')}
      </div>
    `;
    container.appendChild(itemDiv);
  }

  container.querySelectorAll(".opt").forEach(opt => {
    opt.addEventListener("click", function(){
      const input = this.querySelector("input");
      if(input){
        input.checked = true;
        const name = input.name;
        this.closest(".item-options").querySelectorAll(".opt").forEach(o => o.classList.remove("active"));
        this.classList.add("active");
        atualizarProgresso();
      }
    });
  });

  atualizarProgresso();
}

function atualizarProgresso(){
  const form = getForm();
  if(!form) return;

  const total = form.items.length;
  const respostas = coletarRespostas();
  const answered = Object.keys(respostas).length;

  const pillAnswered = $("#pillAnswered");
  if(pillAnswered) pillAnswered.textContent = `${answered}/${total}`;

  const footerAnswered = $("#footerAnswered");
  if(footerAnswered) footerAnswered.textContent = answered;

  const footerTotal = $("#footerTotal");
  if(footerTotal) footerTotal.textContent = total;

  const progressFill = $("#patientProgressFill");
  if(progressFill){
    const percent = total > 0 ? (answered / total) * 100 : 0;
    progressFill.style.width = `${percent}%`;
  }

  const btnEnviar = $("#btnEnviar");
  if(btnEnviar) {
    btnEnviar.disabled = (answered < total);
  }
}

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

function calcularPontuacao(respostas){
  const form = getForm();
  if(!form) return { total: 0, interpretacao: "" };

  let total = 0;
  const diretos = [2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20];
  const invertidos = [1, 5, 13];

  for(const itemId in respostas){
    const valor = respostas[itemId];
    const id = parseInt(itemId);
    if(diretos.includes(id)){
      total += valor;
    } else if(invertidos.includes(id)){
      total += (5 - valor);
    }
  }

  const cutoff = form.cutoff || 46;
  const maxScore = form.max_score || 80;

  let interpretacao = "";
  if(total >= cutoff){
    interpretacao = `A pontuação de ${total} pontos encontra-se ACIMA do ponto de corte estabelecido (${cutoff}). Este resultado indica comportamentos compatíveis com o perfil do Espectro Autista. Sensibilidade: 90,1%.`;
  } else {
    interpretacao = `A pontuação de ${total} pontos encontra-se ABAIXO do ponto de corte estabelecido (${cutoff}).`;
  }

  return { total, cutoff, maxScore, interpretacao };
}

async function gerarPDFBase64(nome, data, pontuacao) {
  if (!window.jspdf) throw new Error("jsPDF não carregado");
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const dataObj = new Date(data + 'T00:00:00');
  const df = dataObj.toLocaleDateString('pt-BR', {day:'2-digit',month:'long',year:'numeric'});
  
  const interp = pontuacao >= 46 
    ? `A pontuação de ${pontuacao} pontos encontra-se ACIMA do ponto de corte (46). Este resultado indica comportamentos compatíveis com o Espectro Autista (sensibilidade 90,1%).`
    : `A pontuação de ${pontuacao} pontos encontra-se ABAIXO do ponto de corte (46).`;
  
  // Cabeçalho
  doc.setFillColor(124,58,237);
  doc.rect(0,0,210,40,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(22);
  doc.setFont('helvetica','bold');
  doc.text('RAADS-R-BR Screen',105,18,{align:'center'});
  doc.setFontSize(11);
  doc.setFont('helvetica','normal');
  doc.text('Escala Ritvo - Diagnóstico de Autismo em Adultos',105,28,{align:'center'});
  
  // Dados
  doc.setFillColor(248,250,252);
  doc.roundedRect(15,50,180,25,3,3,'F');
  doc.setTextColor(148,163,184);
  doc.setFontSize(9);
  doc.setFont('helvetica','bold');
  doc.text('PACIENTE',20,58);
  doc.text('DATA DA AVALIAÇÃO',115,58);
  doc.setTextColor(30,41,59);
  doc.setFontSize(13);
  doc.text(nome,20,68);
  doc.text(df,115,68);
  
  // Sobre
  doc.setFontSize(15);
  doc.setTextColor(30,41,59);
  doc.setFont('helvetica','bold');
  doc.text('Sobre o Instrumento',15,88);
  doc.setFontSize(10);
  doc.setTextColor(71,85,105);
  doc.setFont('helvetica','normal');
  const txt1 = doc.splitTextToSize('O RAADS-R-BR Screen identifica características do TEA em adultos (20 itens). Sensibilidade 90,1%, especificidade 87,9%.',175);
  doc.text(txt1,15,96);
  
  // Resultados
  doc.setFontSize(15);
  doc.setFont('helvetica','bold');
  doc.text('Resultados',15,120);
  
  // Cards
  doc.setFillColor(239,68,68);
  doc.roundedRect(25,130,45,25,3,3,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(9);
  doc.setFont('helvetica','normal');
  doc.text('Pontuação',47.5,138,{align:'center'});
  doc.setFontSize(24);
  doc.setFont('helvetica','bold');
  doc.text(pontuacao.toString(),47.5,150,{align:'center'});
  
  doc.setFillColor(59,130,246);
  doc.roundedRect(82.5,130,45,25,3,3,'F');
  doc.setFontSize(9);
  doc.setFont('helvetica','normal');
  doc.text('Corte',105,138,{align:'center'});
  doc.setFontSize(24);
  doc.setFont('helvetica','bold');
  doc.text('46',105,150,{align:'center'});
  
  doc.setFillColor(107,114,128);
  doc.roundedRect(140,130,45,25,3,3,'F');
  doc.setFontSize(9);
  doc.setFont('helvetica','normal');
  doc.text('Máxima',162.5,138,{align:'center'});
  doc.setFontSize(24);
  doc.setFont('helvetica','bold');
  doc.text('80',162.5,150,{align:'center'});
  
  // Gráfico
  doc.setFont('helvetica','bold');
  doc.setTextColor(30,41,59);
  doc.setFontSize(12);
  doc.text('Visualização Gráfica',105,170,{align:'center'});
  
  const h=55,w=35,s=15,by=220,bx=40;
  
  // Eixo Y
  doc.setDrawColor(203,213,225);
  doc.setLineWidth(0.3);
  doc.line(bx-5,by-h,bx-5,by);
  doc.setFontSize(8);
  doc.setTextColor(100,116,139);
  doc.setFont('helvetica','normal');
  for(let i=0;i<=80;i+=20){
    const y=by-(i/80)*h;
    doc.line(bx-7,y,bx-5,y);
    doc.text(i.toString(),bx-10,y+1,{align:'right'});
  }
  
  // Grid
  doc.setDrawColor(229,231,235);
  doc.setLineWidth(0.2);
  for(let i=20;i<=80;i+=20){
    const y=by-(i/80)*h;
    doc.line(bx,y,bx+(w+s)*2+w,y);
  }
  
  // Barras
  const ap=(pontuacao/80)*h;
  doc.setFillColor(239,68,68);
  doc.rect(bx,by-ap,w,ap,'F');
  doc.setTextColor(30,41,59);
  doc.setFontSize(14);
  doc.setFont('helvetica','bold');
  doc.text(pontuacao.toString(),bx+w/2,by-ap-3,{align:'center'});
  
  const ac=(46/80)*h;
  const xc=bx+w+s;
  doc.setFillColor(59,130,246);
  doc.rect(xc,by-ac,w,ac,'F');
  doc.text('46',xc+w/2,by-ac-3,{align:'center'});
  
  const xm=bx+(w+s)*2;
  doc.setFillColor(107,114,128);
  doc.rect(xm,by-h,w,h,'F');
  doc.text('80',xm+w/2,by-h-3,{align:'center'});
  
  // Eixo X
  doc.setDrawColor(203,213,225);
  doc.setLineWidth(0.5);
  doc.line(bx,by,xm+w,by);
  
  // Labels
  doc.setFontSize(8);
  doc.setFont('helvetica','normal');
  doc.text('Paciente',bx+w/2,by+5,{align:'center'});
  doc.text('Corte',xc+w/2,by+5,{align:'center'});
  doc.text('Máxima',xm+w/2,by+5,{align:'center'});
  
  // Interpretação
  doc.setFontSize(15);
  doc.setTextColor(30,41,59);
  doc.setFont('helvetica','bold');
  doc.text('Interpretação',15,235);
  doc.setFillColor(240,249,255);
  doc.setDrawColor(59,130,246);
  doc.setLineWidth(1);
  doc.roundedRect(15,240,180,25,2,2,'FD');
  doc.setFontSize(9);
  doc.setTextColor(30,41,59);
  doc.setFont('helvetica','normal');
  const txt2=doc.splitTextToSize(interp,170);
  doc.text(txt2,20,245);
  
  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(148,163,184);
  doc.text('Relatório - Equilibrium Neuropsicologia',105,280,{align:'center'});
  
  return doc.output('datauristring').split(',')[1];
}

async function enviarFormulario(){
  const paciente = $("#paciente")?.value?.trim();
  const data = $("#data")?.value;

  if(!paciente){ alert("Preencha o nome do paciente."); return; }
  if(!data){ alert("Preencha a data."); return; }

  const respostas = coletarRespostas();
  const form = getForm();
  
  if(!respostas || Object.keys(respostas).length < form.items.length){
    alert("Responda todos os 20 itens.");
    return;
  }

  const modal = $("#modalGerando");
  if(modal) modal.classList.add("active");
  
  const modalTitle = $("#__raadsr_modal_title__");
  const modalSub = $("#__raadsr_modal_sub__");

  try {
    if(modalTitle) modalTitle.textContent = "Calculando...";
    const resultado = calcularPontuacao(respostas);
    
    if(modalTitle) modalTitle.textContent = "Gerando PDF...";
    const pdfBase64 = await gerarPDFBase64(paciente, data, resultado.total);
    
    if(typeof URL_DO_GOOGLE_SCRIPT !== 'undefined' && URL_DO_GOOGLE_SCRIPT && URL_DO_GOOGLE_SCRIPT.length > 10) {
      if(modalTitle) modalTitle.textContent = "Enviando ao Drive...";
      
      await fetch(URL_DO_GOOGLE_SCRIPT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          paciente: paciente,
          data: data,
          pontuacao: resultado.total,
          pdfBase64: pdfBase64
        })
      });
    }

    if(modal) modal.classList.remove("active");
    mostrarSucesso();

  } catch(error) {
    console.error("Erro:", error);
    if(modal) modal.classList.remove("active");
    alert("Erro ao processar. Tente novamente.");
  }
}

function mostrarSucesso(){
  document.body.innerHTML = `
    <div class="success-screen">
      <div class="success-card">
        <div class="success-icon">✅</div>
        <h1>Respostas Enviadas com Sucesso!</h1>
        <p>Obrigado por completar o questionário RAADS-R-BR Screen.</p>
        <p>Suas respostas foram registradas.</p>
        <p class="success-note">Você pode fechar esta janela agora.</p>
      </div>
    </div>
  `;
}

window.addEventListener("DOMContentLoaded", async () => {
  try {
    aplicarAcento();
    await carregarRegras();
    renderItens();

    const dataInput = $("#data");
    if(dataInput && !dataInput.value){
      dataInput.value = new Date().toISOString().split('T')[0];
    }

    const btnEnviar = $("#btnEnviar");
    if(btnEnviar){
      btnEnviar.addEventListener("click", enviarFormulario);
    }

  } catch(err) {
    console.error("Erro:", err);
    setSubtitle("⚠️ Erro ao carregar");
    const itens = $("#itens");
    if(itens){
      itens.innerHTML = `
        <div style="padding:32px;text-align:center;color:#dc2626;">
          <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
          <div style="font-weight:700;font-size:18px;margin-bottom:8px;">
            Erro ao Carregar
          </div>
          <div style="font-size:14px;color:#64748b;">
            ${escapeHtml(err.message)}
          </div>
        </div>
      `;
    }
  }
});
