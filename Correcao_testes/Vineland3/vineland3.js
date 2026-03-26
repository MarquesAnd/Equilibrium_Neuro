// vineland3.js — Lógica de correção Vineland-3
let RULES = null;

async function loadRules() {
    try {
        const response = await fetch('vineland3_rules.json');
        RULES = await response.json();
        return RULES;
    } catch (e) {
        console.error('Erro ao carregar regras:', e);
        return null;
    }
}

function calcularIdade(dataNascimento, dataTeste) {
    if (!dataNascimento || !dataTeste) return null;
    const nasc = new Date(dataNascimento);
    const teste = new Date(dataTeste);
    let anos = teste.getFullYear() - nasc.getFullYear();
    let meses = teste.getMonth() - nasc.getMonth();
    let dias = teste.getDate() - nasc.getDate();
    if (dias < 0) { meses--; }
    if (meses < 0) { anos--; meses += 12; }
    return { anos, meses };
}

function formatarData(dataStr) {
    if (!dataStr) return '—';
    const [y, m, d] = dataStr.split('-');
    return d + '/' + m + '/' + y;
}

function calcularPontuacaoBruta(domainKey) {
    const domain = RULES.domains[domainKey];
    if (!domain) return { bruta: 0, estimativas: 0, totalItens: 0, percentEstimativas: 0 };
    let soma = 0, estimativas = 0;
    const totalItens = domain.maxItems;
    for (let i = 1; i <= totalItens; i++) {
        const input = document.querySelector('input[name="' + domainKey + '_' + i + '"]:checked');
        if (input) soma += parseInt(input.value);
        const estCheckbox = document.getElementById('est_' + domainKey + '_' + i);
        if (estCheckbox && estCheckbox.checked) estimativas++;
    }
    return { bruta: soma, estimativas, totalItens, percentEstimativas: totalItens > 0 ? Math.round((estimativas / totalItens) * 100) : 0 };
}

function calcularComportamento(sectionKey) {
    const section = RULES.behavior[sectionKey];
    if (!section) return { soma: 0, estimativas: 0 };
    let soma = 0, estimativas = 0;
    for (let i = 1; i <= section.maxItems; i++) {
        const input = document.querySelector('input[name="' + sectionKey + '_' + i + '"]:checked');
        if (input) soma += parseInt(input.value);
        const estCheckbox = document.getElementById('est_' + sectionKey + '_' + i);
        if (estCheckbox && estCheckbox.checked) estimativas++;
    }
    return { soma, estimativas };
}

function classificarNivelAdaptativo(pontuacaoPadrao) {
    if (!pontuacaoPadrao || pontuacaoPadrao === '' || isNaN(pontuacaoPadrao)) return { label: '—', color: '#6b7280' };
    const pp = parseInt(pontuacaoPadrao);
    const niveis = RULES.classification.adaptiveLevel;
    for (const nivel of niveis) {
        if (pp >= nivel.min && pp <= nivel.max) return { label: nivel.label, color: nivel.color };
    }
    return { label: '—', color: '#6b7280' };
}

function calcularSomaPP() {
    const ppCOM = parseInt(document.getElementById('pp_COM')?.value) || 0;
    const ppAVD = parseInt(document.getElementById('pp_AVD')?.value) || 0;
    const ppSOC = parseInt(document.getElementById('pp_SOC')?.value) || 0;
    return ppCOM + ppAVD + ppSOC;
}

function processarResultados() {
    const dataNasc = document.getElementById('dataNascimento')?.value;
    const dataTeste = document.getElementById('dataTeste')?.value;
    const idade = calcularIdade(dataNasc, dataTeste);
    if (idade) {
        document.getElementById('idadeAnos').textContent = idade.anos;
        document.getElementById('idadeMeses').textContent = idade.meses;
    }

    ['COM', 'AVD', 'SOC', 'HMOT'].forEach(key => {
        const res = calcularPontuacaoBruta(key);
        const brutaEl = document.getElementById('bruta_' + key);
        if (brutaEl) brutaEl.textContent = res.bruta;
        const estEl = document.getElementById('est_count_' + key);
        if (estEl) estEl.textContent = res.estimativas + ' (' + res.percentEstimativas + '%)';
        const ppInput = document.getElementById('pp_' + key);
        if (ppInput) {
            const cl = classificarNivelAdaptativo(ppInput.value);
            const nivelEl = document.getElementById('nivel_' + key);
            if (nivelEl) { nivelEl.textContent = cl.label; nivelEl.style.color = cl.color; nivelEl.style.fontWeight = '700'; }
        }
        const brutaRes = document.getElementById('bruta_' + key + '_res');
        if (brutaEl && brutaRes) brutaRes.textContent = brutaEl.textContent;
    });

    const somaPP = calcularSomaPP();
    const somaPPEl = document.getElementById('soma_pp');
    if (somaPPEl) somaPPEl.textContent = somaPP;

    const ccaInput = document.getElementById('pp_CCA');
    if (ccaInput) {
        const cl = classificarNivelAdaptativo(ccaInput.value);
        const nivelCCA = document.getElementById('nivel_CCA');
        if (nivelCCA) { nivelCCA.textContent = cl.label; nivelCCA.style.color = cl.color; nivelCCA.style.fontWeight = '700'; }
    }

    ['sectionA', 'sectionB', 'sectionC'].forEach(key => {
        const res = calcularComportamento(key);
        const somaEl = document.getElementById('soma_' + key);
        if (somaEl) somaEl.textContent = res.soma;
        const somaRes = document.getElementById('soma_' + key + '_res');
        if (somaRes) somaRes.textContent = res.soma;
    });

    atualizarItensCriticos();
    atualizarGrafico();
}

function atualizarItensCriticos() {
    const criticos = [];
    ['sectionA', 'sectionB', 'sectionC'].forEach(sectionKey => {
        const section = RULES.behavior[sectionKey];
        for (let i = 1; i <= section.maxItems; i++) {
            const input = document.querySelector('input[name="' + sectionKey + '_' + i + '"]:checked');
            if (input && parseInt(input.value) >= 1) {
                criticos.push({ section: section.name, num: i, text: section.items[i - 1].text, value: parseInt(input.value) });
            }
        }
    });
    const container = document.getElementById('itensCriticos');
    if (container) {
        if (criticos.length === 0) {
            container.innerHTML = '<p class="no-criticos">Nenhum item crítico identificado.</p>';
        } else {
            container.innerHTML = criticos.map(c => '<div class="critico-item ' + (c.value === 2 ? 'critico-alto' : 'critico-medio') + '"><span class="critico-badge">' + (c.value === 2 ? 'Frequente' : 'Às vezes') + '</span><span class="critico-section">' + c.section + '</span> — Item ' + c.num + ': ' + c.text + '</div>').join('');
        }
    }
}

function atualizarGrafico() {
    const canvas = document.getElementById('perfilGrafico');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const padding = { top: 40, right: 40, bottom: 60, left: 70 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const minY = 20, maxY = 140, rangeY = maxY - minY;
    function yPos(val) { return padding.top + chartH - ((val - minY) / rangeY) * chartH; }

    [{ min:130,max:140,color:'rgba(26,116,49,0.1)' },{ min:115,max:129,color:'rgba(45,158,66,0.1)' },{ min:86,max:114,color:'rgba(59,130,246,0.08)' },{ min:71,max:85,color:'rgba(245,158,11,0.1)' },{ min:20,max:70,color:'rgba(220,38,38,0.1)' }].forEach(f => {
        ctx.fillStyle = f.color;
        ctx.fillRect(padding.left, yPos(Math.min(f.max, maxY)), chartW, yPos(Math.max(f.min, minY)) - yPos(Math.min(f.max, maxY)));
    });

    [70, 85, 100, 115, 130].forEach(val => {
        ctx.beginPath();
        ctx.strokeStyle = val === 100 ? '#dc2626' : '#d1d5db';
        ctx.lineWidth = val === 100 ? 2 : 1;
        if (val !== 100) ctx.setLineDash([4, 4]); else ctx.setLineDash([]);
        ctx.moveTo(padding.left, yPos(val)); ctx.lineTo(padding.left + chartW, yPos(val)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#6b7280'; ctx.font = '11px system-ui'; ctx.textAlign = 'right';
        ctx.fillText(val, padding.left - 10, yPos(val) + 4);
    });

    const labels = ['COM', 'AVD', 'SOC', 'CCA', 'HMOT'];
    const fullLabels = ['Comunicação', 'AVD', 'Socialização', 'CCA', 'Hab. Motoras'];
    const barWidth = chartW / labels.length;
    const pontos = [];

    labels.forEach((key, i) => {
        const x = padding.left + barWidth * i + barWidth / 2;
        ctx.fillStyle = '#374151'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(fullLabels[i], x, h - padding.bottom + 20);
        ctx.font = '10px system-ui'; ctx.fillStyle = '#6b7280';
        ctx.fillText('(' + key + ')', x, h - padding.bottom + 34);
        const ppInput = document.getElementById('pp_' + key);
        const val = ppInput ? parseInt(ppInput.value) : NaN;
        if (!isNaN(val) && val >= minY && val <= maxY) pontos.push({ x, y: yPos(val), val, key });
    });

    if (pontos.length > 1) {
        ctx.beginPath(); ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2.5;
        pontos.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
        ctx.stroke();
    }

    pontos.forEach(p => {
        const cl = classificarNivelAdaptativo(p.val);
        ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = cl.color; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#1f2937'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(p.val, p.x, p.y - 14);
    });

    ctx.fillStyle = '#1f2937'; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Perfil da Pontuação Padrão do Domínio e CCA', w / 2, 20);
}

function gerarFormulario() {
    if (!RULES) return;
    ['COM', 'AVD', 'SOC', 'HMOT'].forEach(key => {
        const domain = RULES.domains[key];
        const container = document.getElementById('items_' + key);
        if (!container || !domain) return;
        let html = '';
        domain.items.forEach(item => {
            const isBinary = item.type === 'binary';
            html += '<div class="item-row"><div class="item-number">' + item.num + '.</div><div class="item-content"><div class="item-text">' + item.text + '</div>' + (item.tip ? '<div class="item-tip">ℹ ' + item.tip + '</div>' : '') + '</div><div class="item-scoring"><label class="score-option"><input type="radio" name="' + key + '_' + item.num + '" value="2" onchange="processarResultados()"><span class="score-btn score-2">2</span></label>' + (!isBinary ? '<label class="score-option"><input type="radio" name="' + key + '_' + item.num + '" value="1" onchange="processarResultados()"><span class="score-btn score-1">1</span></label>' : '') + '<label class="score-option"><input type="radio" name="' + key + '_' + item.num + '" value="0" onchange="processarResultados()"><span class="score-btn score-0">0</span></label></div><div class="item-est"><input type="checkbox" id="est_' + key + '_' + item.num + '" class="est-checkbox" onchange="processarResultados()" title="Estimado"></div></div>';
        });
        container.innerHTML = html;
    });

    ['sectionA', 'sectionB', 'sectionC'].forEach(sectionKey => {
        const section = RULES.behavior[sectionKey];
        const container = document.getElementById('items_' + sectionKey);
        if (!container || !section) return;
        let html = '';
        section.items.forEach(item => {
            html += '<div class="item-row"><div class="item-number">' + item.num + '.</div><div class="item-content"><div class="item-text">' + item.text + '</div>' + (item.tip ? '<div class="item-tip">ℹ ' + item.tip + '</div>' : '') + '</div><div class="item-scoring"><label class="score-option"><input type="radio" name="' + sectionKey + '_' + item.num + '" value="2" onchange="processarResultados()"><span class="score-btn score-2">2</span></label><label class="score-option"><input type="radio" name="' + sectionKey + '_' + item.num + '" value="1" onchange="processarResultados()"><span class="score-btn score-1">1</span></label><label class="score-option"><input type="radio" name="' + sectionKey + '_' + item.num + '" value="0" onchange="processarResultados()"><span class="score-btn score-0">0</span></label></div><div class="item-est"><input type="checkbox" id="est_' + sectionKey + '_' + item.num + '" class="est-checkbox" onchange="processarResultados()" title="Estimado"></div></div>';
        });
        container.innerHTML = html;
    });
}

function mostrarSecao(secaoId) {
    document.querySelectorAll('.secao-conteudo').forEach(el => el.classList.remove('ativa'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(secaoId)?.classList.add('ativa');
    document.querySelector('[data-secao="' + secaoId + '"]')?.classList.add('active');
    document.getElementById(secaoId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function limparFormulario() {
    if (!confirm('Deseja limpar todos os dados? Esta ação não pode ser desfeita.')) return;
    document.querySelectorAll('input[type="radio"]').forEach(el => el.checked = false);
    document.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
    document.querySelectorAll('input[type="number"]').forEach(el => el.value = '');
    document.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
    document.querySelectorAll('input[type="date"]').forEach(el => el.value = '');
    document.querySelectorAll('textarea').forEach(el => el.value = '');
    processarResultados();
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadRules();
    if (RULES) { gerarFormulario(); processarResultados(); }
});

// ==========================================
// FUNÇÃO DE GERAÇÃO COM LOADING E MODAL
// ==========================================
function gerarRelatorio() {
    
    // 1. Mostrar a tela de Loading
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'vineland-loading';
    loadingScreen.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.8); z-index: 999999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);';
    loadingScreen.innerHTML = `
        <div style="background: white; padding: 2rem 3rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); display: flex; flex-direction: column; align-items: center; gap: 1rem;">
            <div class="spinner" style="width:40px;height:40px;border:4px solid #ede9fe;border-top:4px solid #7c3aed;border-radius:50%;animation:spin 1s linear infinite;"></div>
            <div style="font-weight: 700; color: #4c1d95; font-size: 1.1rem;">Gerando relatório...</div>
            <div style="font-size: 0.8rem; color: #6b7280;">Isso pode levar alguns segundos.</div>
        </div>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `;
    document.body.appendChild(loadingScreen);

    // 2. Usar setTimeout para dar tempo ao navegador de renderizar o loading
    setTimeout(() => {
        const nome = document.getElementById('nomeExaminado')?.value || '—';
        const dataNasc = document.getElementById('dataNascimento')?.value;
        const dataTeste = document.getElementById('dataTeste')?.value;
        const sexo = document.getElementById('sexo')?.value;
        const sexoLabel = sexo === 'M' ? 'Masculino' : sexo === 'F' ? 'Feminino' : '—';
        const respondente = document.getElementById('nomeRespondente')?.value || '—';
        const avaliador = document.getElementById('avaliador')?.value || '—';
        const comentarios = document.getElementById('comentarios')?.value || '';

        const idade = calcularIdade(dataNasc, dataTeste);
        const idadeStr = idade ? (idade.anos + ' anos e ' + idade.meses + ' meses') : '—';

        const nomesDominios = { COM: 'Comunicação', AVD: 'Atividade de Vida Diária', SOC: 'Socialização', HMOT: 'Habilidades Motoras' };
        const dadosDominios = ['COM', 'AVD', 'SOC', 'HMOT'].map(key => {
            const bruta = parseInt(document.getElementById('bruta_' + key)?.textContent) || 0;
            const pp = parseInt(document.getElementById('pp_' + key)?.value) || null;
            const cl = classificarNivelAdaptativo(pp);
            return { key, nome: nomesDominios[key], bruta, pp, nivel: cl.label, cor: cl.color };
        });

        const somaPP = calcularSomaPP();
        const ppCCA = parseInt(document.getElementById('pp_CCA')?.value) || null;
        const clCCA = classificarNivelAdaptativo(ppCCA);
        const somaA = parseInt(document.getElementById('soma_sectionA')?.textContent) || 0;
        const somaB = parseInt(document.getElementById('soma_sectionB')?.textContent) || 0;
        const somaC = parseInt(document.getElementById('soma_sectionC')?.textContent) || 0;
        const veA = document.getElementById('ve_sectionA')?.value || '—';
        const veB = document.getElementById('ve_sectionB')?.value || '—';

        const criticos = [];
        ['sectionA', 'sectionB', 'sectionC'].forEach(sectionKey => {
            const section = RULES.behavior[sectionKey];
            for (let i = 1; i <= section.maxItems; i++) {
                const input = document.querySelector('input[name="' + sectionKey + '_' + i + '"]:checked');
                if (input && parseInt(input.value) >= 1) {
                    criticos.push({ section: section.name, num: i, text: section.items[i - 1].text, value: parseInt(input.value) });
                }
            }
        });

        // SVG do perfil
        const labels = ['COM','AVD','SOC','CCA','HMOT'];
        const fullLabels = ['Comunicação','AVD','Socialização','CCA','Hab. Motoras'];
        const ppValues = { COM: parseInt(document.getElementById('pp_COM')?.value)||null, AVD: parseInt(document.getElementById('pp_AVD')?.value)||null, SOC: parseInt(document.getElementById('pp_SOC')?.value)||null, CCA: parseInt(document.getElementById('pp_CCA')?.value)||null, HMOT: parseInt(document.getElementById('pp_HMOT')?.value)||null };
        const svgW=700,svgH=300,padL=60,padR=30,padT=35,padB=60,cW=svgW-padL-padR,cH=svgH-padT-padB;
        function yP(v) { return padT + cH - ((v-20)/(140-20))*cH; }

        let svgParts = ['<svg width="700" height="300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 300">'];
        [{ min:130,max:140,fill:'rgba(26,116,49,0.12)'},{min:115,max:129,fill:'rgba(45,158,66,0.12)'},{min:86,max:114,fill:'rgba(59,130,246,0.10)'},{min:71,max:85,fill:'rgba(245,158,11,0.12)'},{min:20,max:70,fill:'rgba(220,38,38,0.10)'}].forEach(f => {
            const y1=yP(Math.min(f.max,140));const h2=yP(Math.max(f.min,20))-y1;
            svgParts.push('<rect x="'+padL+'" y="'+y1.toFixed(1)+'" width="'+cW+'" height="'+h2.toFixed(1)+'" fill="'+f.fill+'"/>');
        });
        [70,85,100,115,130].forEach(v => {
            const y=yP(v).toFixed(1);
            const cor=v===100?'#dc2626':'#d1d5db';const lw=v===100?1.5:1;const dash=v===100?'':'stroke-dasharray="4,4"';
            svgParts.push('<line x1="'+padL+'" y1="'+y+'" x2="'+(padL+cW)+'" y2="'+y+'" stroke="'+cor+'" stroke-width="'+lw+'" '+dash+'/>');
            svgParts.push('<text x="'+(padL-6)+'" y="'+(parseFloat(y)+4).toFixed(1)+'" font-size="10" fill="#6b7280" text-anchor="end">'+v+'</text>');
        });
        const colW=cW/labels.length;
        const pontosCoords=[];
        labels.forEach((key,i) => {
            const x=(padL+colW*i+colW/2).toFixed(1);
            const val=ppValues[key];
            svgParts.push('<text x="'+x+'" y="'+(padT+cH+20).toFixed(1)+'" font-size="10" font-weight="600" fill="#374151" text-anchor="middle">'+fullLabels[i]+'</text>');
            svgParts.push('<text x="'+x+'" y="'+(padT+cH+33).toFixed(1)+'" font-size="9" fill="#6b7280" text-anchor="middle">('+key+')</text>');
            if(val && val>=20 && val<=140) {
                const y=yP(val);const cl=classificarNivelAdaptativo(val);
                pontosCoords.push({x:parseFloat(x),y,cor:cl.color,val});
            }
        });
        if(pontosCoords.length>1){
            const d=pontosCoords.map((p,i)=>(i===0?'M':'L')+p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
            svgParts.push('<path d="'+d+'" stroke="#7c3aed" stroke-width="2" fill="none"/>');
        }
        pontosCoords.forEach(p=>{
            svgParts.push('<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="6" fill="'+p.cor+'" stroke="white" stroke-width="2"/>');
            svgParts.push('<text x="'+p.x.toFixed(1)+'" y="'+(p.y-12).toFixed(1)+'" font-size="11" font-weight="700" fill="#1f2937" text-anchor="middle">'+p.val+'</text>');
        });
        svgParts.push('<text x="350" y="18" font-size="12" font-weight="700" fill="#1f2937" text-anchor="middle">Perfil da Pontuação Padrão do Domínio e CCA</text>');
        svgParts.push('</svg>');
        const svgGrafico = svgParts.join('');

        const tabelaDoms = dadosDominios.map(d =>
            '<tr><td style="padding:0.6rem 1rem;font-weight:600;">'+d.nome+' ('+d.key+')</td><td style="padding:0.6rem 1rem;text-align:center;font-weight:700;">'+d.bruta+'</td><td style="padding:0.6rem 1rem;text-align:center;font-weight:800;font-size:1.1rem;color:#4c1d95;">'+(d.pp!==null?d.pp:'—')+'</td><td style="padding:0.6rem 1rem;text-align:center;"><span style="font-weight:700;color:'+d.cor+';">'+d.nivel+'</span></td></tr>'
        ).join('');

        const criticoHTML = criticos.length===0
            ? '<p style="color:#059669;font-weight:600;padding:0.5rem 0;">Nenhum item crítico identificado.</p>'
            : criticos.map(c=>'<div style="padding:0.6rem 1rem;margin-bottom:0.4rem;border-radius:6px;font-size:0.82rem;line-height:1.5;border-left:4px solid '+(c.value===2?'#dc2626':'#d97706')+';background:'+(c.value===2?'#fef2f2':'#fffbeb')+';"><span style="display:inline-block;padding:0.1rem 0.5rem;border-radius:20px;font-size:0.7rem;font-weight:700;margin-right:0.4rem;background:'+(c.value===2?'#dc2626':'#d97706')+';color:white;">'+(c.value===2?'Frequente':'Às vezes')+'</span><strong style="color:#4b5563;">'+c.section+'</strong> — Item '+c.num+': '+c.text+'</div>').join('');

        const comentariosHTML = comentarios.trim() ? '<div style="margin-top:1.5rem;"><div class="section-title">OBSERVAÇÕES DO AVALIADOR</div><div class="section-body" style="font-size:0.88rem;line-height:1.7;color:#374151;white-space:pre-line;">'+comentarios+'</div></div>' : '';
        const dataGerado = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

        // CSS INJETADO NO IFRAME (COM A REGRA DE FORÇAR CORES DE IMPRESSÃO)
// CSS INJETADO NO IFRAME (COM A REGRA DE FORÇAR CORES DE IMPRESSÃO E ESCALA 89%)
        const reportStyles = `
        <style>
            @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap");
            
            /* FORÇAR O NAVEGADOR A IMPRIMIR CORES */
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #f8f9fb; color: #1a1d23; margin: 0; padding: 0; }
            .page { width: 794px; min-height: 1123px; margin: 0 auto; background: white; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
            .report-header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%); color: white; padding: 1.5rem 2rem; display: flex; align-items: center; justify-content: space-between; }
            .logo-box { width: 42px; height: 42px; background: rgba(255,255,255,0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
            .brand-name { font-size: 1.15rem; font-weight: 800; } .brand-sub { font-size: 0.72rem; color: #c4b5fd; }
            .report-title { font-size: 1.3rem; font-weight: 800; text-align: right; }
            .report-subtitle { font-size: 0.72rem; color: #c4b5fd; text-align: right; }
            .ident { padding: 1.2rem 2rem; background: #f9fafb; border-bottom: 1px solid #e2e5ea; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem 1.5rem; }
            .ident label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; display: block; margin-bottom: 0.2rem; }
            .ident span { font-size: 0.85rem; font-weight: 600; }
            .report-body { padding: 1.5rem 2rem; }
            .section-title { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #4c1d95; border-bottom: 2px solid #e2e5ea; padding-bottom: 0.4rem; margin-bottom: 1rem; }
            .section-body { margin-bottom: 1.5rem; }
            .results-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
            .results-table thead tr { background: #4c1d95; color: white; }
            .results-table thead th { padding: 0.6rem 1rem; font-weight: 700; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
            .results-table thead th:not(:first-child) { text-align: center; }
            .results-table tbody tr:nth-child(even) { background: #f9fafb; }
            .results-table tbody tr:last-child { border-top: 2px solid #7c3aed; }
            .results-table tbody tr:last-child td { font-weight: 800; color: #4c1d95; }
            .cca-box { background: #f5f3ff; border: 1px solid #c4b5fd; border-radius: 8px; padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between; margin-top: 1rem; flex-wrap: wrap; gap: 0.5rem; }
            .cca-values { display: flex; align-items: center; gap: 2rem; }
            .cca-mini-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: #7c3aed; }
            .cca-mini-val { font-size: 1.6rem; font-weight: 800; color: #4c1d95; line-height: 1; }
            .grafico-wrap { border: 1px solid #e2e5ea; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; overflow: hidden; }
            .grafico-wrap svg { width: 100%; height: auto; }
            .faixas-legend { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem; font-size: 0.72rem; }
            .faixa-item { display: flex; align-items: center; gap: 0.35rem; }
            .faixa-dot { width: 10px; height: 10px; border-radius: 50%; }
            .behavior-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8rem; margin-bottom: 1rem; }
            .behavior-box { border: 1px solid #e2e5ea; border-radius: 8px; padding: 0.8rem 1rem; text-align: center; }
            .behavior-box h4 { font-size: 0.7rem; text-transform: uppercase; color: #6b7280; margin-bottom: 0.3rem; }
            .soma-val { font-size: 1.6rem; font-weight: 800; color: #4c1d95; line-height: 1.2; }
            .ve-row { font-size: 0.75rem; color: #6b7280; margin-top: 0.3rem; }
            .interp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-bottom: 1.5rem; }
            .interp-box { border-radius: 8px; padding: 0.8rem 1rem; border: 1px solid; }
            .interp-box h4 { font-size: 0.75rem; font-weight: 800; margin-bottom: 0.4rem; }
            .interp-box p { font-size: 0.76rem; line-height: 1.55; }
            .report-footer { border-top: 1px solid #e2e5ea; padding: 1rem 2rem; display: flex; align-items: flex-end; justify-content: space-between; margin-top: 1rem; }
            .footer-sig { border-top: 1px solid #374151; width: 160px; margin-bottom: 0.2rem; }
            .footer-prof { font-weight: 800; font-size: 0.88rem; }
            .footer-crp { font-size: 0.75rem; color: #6b7280; }
            .footer-date { font-size: 0.75rem; color: #6b7280; text-align: right; }
            .footer-conf { font-size: 0.68rem; color: #9ca3af; text-align: right; max-width: 220px; }
            
            /* =========================================================
               MAGIA DA ESCALA DE IMPRESSÃO
            ========================================================= */
            @media print {
                @page {
                    size: A4 portrait; /* Define o tamanho do papel na impressora */
                    margin: 10mm; /* Força uma margem padrão pequena */
                }
                body { background: white; }
                
                .page { 
                    width: 794px !important; /* Mantém a largura original do design */
                    margin: 0 auto !important; 
                    padding: 0 !important; 
                    box-shadow: none !important; 
                    border: none !important; 
                    
                    /* Escala o conteúdo visualmente para 89% */
                    zoom: 0.89; 
                    
                    /* Fallback para navegadores como Firefox */
                    transform: scale(0.90);
                    transform-origin: top center;
                }
            }
        </style>
        `;

        const reportContent = '<div class="page">'
        + '<div class="report-header"><div style="display:flex;align-items:center;gap:1rem;"><div class="logo-box" style="background:transparent; padding:0;"><img src="/logo2.png" alt="Equilibrium Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;" /></div><div><div class="brand-name">Equilibrium</div><div class="brand-sub">Neuropsicologia</div></div></div><div><div class="report-title">Vineland-3</div><div class="report-subtitle">Escala de Comportamento Adaptativo &#8212; 3&#170; Edi&#231;&#227;o</div></div></div>'    
        + '<div class="ident"><div style="grid-column:1/3;"><label>Examinado(a)</label><span>'+nome+'</span></div><div><label>Sexo</label><span>'+sexoLabel+'</span></div><div><label>Data de Nascimento</label><span>'+formatarData(dataNasc)+'</span></div><div><label>Data da Avalia&#231;&#227;o</label><span>'+formatarData(dataTeste)+'</span></div><div><label>Idade na Avalia&#231;&#227;o</label><span>'+idadeStr+'</span></div><div><label>Respondente</label><span>'+respondente+'</span></div><div><label>Avaliador</label><span>'+avaliador+'</span></div><div><label>Formul&#225;rio</label><span>Pais/Cuidadores &#8212; N&#237;vel de Dom&#237;nio</span></div></div>'
        + '<div class="report-body">'
        + '<div class="section-title">PONTUA&#199;&#213;ES POR DOM&#205;NIO</div><div class="section-body"><table class="results-table"><thead><tr><th>Dom&#237;nio</th><th>Pont. Bruta</th><th>Pont. Padr&#227;o</th><th>N&#237;vel Adaptativo</th></tr></thead><tbody>'+tabelaDoms+'<tr><td style="padding:0.6rem 1rem;">Composto de Comportamento Adaptativo (CCA)</td><td style="padding:0.6rem 1rem;text-align:center;">&#8212;</td><td style="padding:0.6rem 1rem;text-align:center;font-size:1.1rem;">'+(ppCCA!==null?ppCCA:'&#8212;')+'</td><td style="padding:0.6rem 1rem;text-align:center;"><span style="font-weight:800;color:'+clCCA.color+';">'+clCCA.label+'</span></td></tr></tbody></table>'
        + '<div class="cca-box"><div><div style="font-size:0.82rem;font-weight:700;color:#4c1d95;">Composto de Comportamento Adaptativo (CCA)</div><div style="font-size:0.7rem;color:#7c3aed;margin-top:0.2rem;">Soma das Pontua&#231;&#245;es Padr&#227;o (COM + AVD + SOC) &#8594; Consultar Tabela D.3</div></div><div class="cca-values"><div><div class="cca-mini-label">Soma PP</div><div class="cca-mini-val">'+somaPP+'</div></div><div><div class="cca-mini-label">CCA</div><div class="cca-mini-val">'+(ppCCA!==null?ppCCA:'&#8212;')+'</div></div><div><span style="font-size:0.82rem;font-weight:700;color:'+clCCA.color+';">'+clCCA.label+'</span></div></div></div></div>'
        + '<div class="section-title">PERFIL DE PONTUA&#199;&#213;ES PADR&#195;O</div><div class="section-body"><div class="faixas-legend"><div class="faixa-item"><div class="faixa-dot" style="background:#1a7431;"></div><span>Alto (&#8805; 130)</span></div><div class="faixa-item"><div class="faixa-dot" style="background:#2d9e42;"></div><span>Moderadamente Alto (115&#8211;129)</span></div><div class="faixa-item"><div class="faixa-dot" style="background:#3b82f6;"></div><span>Adequado (86&#8211;114)</span></div><div class="faixa-item"><div class="faixa-dot" style="background:#f59e0b;"></div><span>Moderadamente Baixo (71&#8211;85)</span></div><div class="faixa-item"><div class="faixa-dot" style="background:#dc2626;"></div><span>Baixo (&#8804; 70)</span></div></div><div class="grafico-wrap">'+svgGrafico+'</div></div>'
        + '<div class="section-title">COMPORTAMENTO MAL-ADAPTATIVO</div><div class="section-body"><div class="behavior-grid"><div class="behavior-box"><h4>Se&#231;&#227;o A &#8212; Internalizante</h4><div class="soma-val">'+somaA+'</div><div class="ve-row">V-Escala: <strong>'+veA+'</strong></div></div><div class="behavior-box"><h4>Se&#231;&#227;o B &#8212; Externalizante</h4><div class="soma-val">'+somaB+'</div><div class="ve-row">V-Escala: <strong>'+veB+'</strong></div></div><div class="behavior-box"><h4>Se&#231;&#227;o C &#8212; Outros</h4><div class="soma-val">'+somaC+'</div><div class="ve-row">Sem V-Escala</div></div></div>'+(criticos.length>0?'<div style="margin-top:0.75rem;"><div style="font-size:0.78rem;font-weight:700;color:#374151;margin-bottom:0.5rem;">Itens Cr&#237;ticos (pontua&#231;&#227;o &#8805; 1)</div>'+criticoHTML+'</div>':'')+'</div>'
        + '<div class="section-title">INTERPRETA&#199;&#195;O CL&#205;NICA DO N&#205;VEL ADAPTATIVO</div><div class="section-body"><div class="interp-grid"><div class="interp-box" style="background:#ecfdf5;border-color:#6ee7b7;"><h4 style="color:#065f46;">Alto / Moderadamente Alto (&#8805; 115)</h4><p style="color:#065f46;">O comportamento adaptativo encontra-se acima da m&#233;dia normativa. O indiv&#237;duo demonstra habilidades adaptativas bem desenvolvidas para sua faixa et&#225;ria, com funcionamento independente e competente nas atividades cotidianas.</p></div><div class="interp-box" style="background:#eff6ff;border-color:#93c5fd;"><h4 style="color:#1e40af;">Adequado (86&#8211;114)</h4><p style="color:#1e40af;">O comportamento adaptativo situa-se dentro da faixa esperada para a faixa et&#225;ria. As habilidades adaptativas est&#227;o desenvolvidas de forma compat&#237;vel com as expectativas normativas, sem comprometimentos significativos.</p></div><div class="interp-box" style="background:#fffbeb;border-color:#fcd34d;"><h4 style="color:#92400e;">Moderadamente Baixo (71&#8211;85)</h4><p style="color:#92400e;">O comportamento adaptativo situa-se abaixo da m&#233;dia normativa. Indica limita&#231;&#245;es nas habilidades adaptativas que podem interferir no funcionamento independente. Recomenda-se avalia&#231;&#227;o mais abrangente e suporte nas &#225;reas deficit&#225;rias.</p></div><div class="interp-box" style="background:#fef2f2;border-color:#fca5a5;"><h4 style="color:#991b1b;">Baixo (&#8804; 70)</h4><p style="color:#991b1b;">O comportamento adaptativo situa-se significativamente abaixo da m&#233;dia normativa. Indica comprometimento substancial do funcionamento adaptativo. Esse resultado, combinado com limita&#231;&#245;es intelectuais, pode indicar Defici&#234;ncia Intelectual (DSM-5).</p></div></div></div>'
        + comentariosHTML
        + '<div class="report-footer"><div><div class="footer-sig"></div><div class="footer-prof">'+(avaliador!=='—'?avaliador:'Profissional')+'</div><div class="footer-crp">Neuropsic&#243;logo(a)</div></div><div><div class="footer-date">Documento gerado em '+dataGerado+'</div><div class="footer-conf">Este documento &#233; confidencial e destinado exclusivamente ao profissional solicitante. V&#225;lido apenas com assinatura.</div></div></div>'
        + '</div>';

        const htmlContent = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Vineland-3 — Relatório | ' + nome + '</title>' + reportStyles + '</head><body>' + reportContent + '</body></html>';

        // Montar a Janela Modal flutuante
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'modal-relatorio-overlay';
        modalOverlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.85); z-index: 99999; display: flex; flex-direction: column; align-items: center; padding: 2rem 1rem; backdrop-filter: blur(4px);';

        const modalWrapper = document.createElement('div');
        modalWrapper.style.cssText = 'background: #f8f9fb; border-radius: 8px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); width: 850px; max-width: 100%; height: 95vh; display: flex; flex-direction: column; overflow: hidden;';

        const modalHeader = document.createElement('div');
        modalHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: white; border-bottom: 1px solid #e2e5ea; flex-shrink: 0;';
        modalHeader.innerHTML = `
            <div style="font-weight: 800; color: #4c1d95; font-size: 1.1rem;">Visualização do Relatório</div>
            <div style="display: flex; gap: 0.5rem;">
                <button id="btn-print-modal" style="padding: 0.6rem 1.2rem; background: #7c3aed; color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">🖨️ Imprimir / Salvar PDF</button>
                <button id="btn-close-modal" style="padding: 0.6rem 1.2rem; background: #ef4444; color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">❌ Fechar</button>
            </div>
        `;

        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'flex: 1; width: 100%; border: none; background: #f8f9fb;';

        modalWrapper.appendChild(modalHeader);
        modalWrapper.appendChild(iframe);
        modalOverlay.appendChild(modalWrapper);
        
        // Remove tela de loading e exibe modal
        document.getElementById('vineland-loading').remove();
        document.body.appendChild(modalOverlay);

        // Escrever o conteúdo dentro do Iframe
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        // Eventos dos botões do Modal
        document.getElementById('btn-close-modal').addEventListener('click', () => modalOverlay.remove());
        
        document.getElementById('btn-print-modal').addEventListener('click', () => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        });

        // Fechar se clicar fora da área branca do relatório
        modalOverlay.addEventListener('click', (e) => {
            if(e.target === modalOverlay) {
                modalOverlay.remove();
            }
        });

    }, 800); 
}
