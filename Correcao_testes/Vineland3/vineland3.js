// vineland3.js — Vineland-3 Pais/Cuidadores Nível de Domínio — Correção AUTOMÁTICA
let RULES = null, NORMS = null, NORMS_E2 = null;

async function loadRules() {
    try {
        const [r1, r2, r3] = await Promise.all([
            fetch('vineland3_rules.json'),
            fetch('vineland3_norms_C3.json'),
            fetch('vineland3_norms_E2.json')
        ]);
        RULES = await r1.json();
        NORMS = await r2.json();
        NORMS_E2 = await r3.json();
        return true;
    } catch (e) { console.error('Erro ao carregar regras:', e); return false; }
}

// ── IDADE ──
function calcularIdade(dn, dt) {
    if (!dn || !dt) return null;
    const n = new Date(dn), t = new Date(dt);
    let a = t.getFullYear() - n.getFullYear(), m = t.getMonth() - n.getMonth(), d = t.getDate() - n.getDate();
    if (d < 0) m--; if (m < 0) { a--; m += 12; }
    return { anos: a, meses: m };
}

function formatarData(s) { if (!s) return '—'; const [y, m, d] = s.split('-'); return d + '/' + m + '/' + y; }

// ── FAIXAS ETÁRIAS ──
function determinarFaixaC3(a, m) {
    const t = a * 12 + m;
    const f = [["3:0-3:3",36,39],["3:4-3:7",40,43],["3:8-3:11",44,47],["4:0-4:5",48,53],["4:6-4:11",54,59],["5:0-5:5",60,65],["5:6-5:11",66,71],["6:0-6:5",72,77],["6:6-6:11",78,83],["7:0-7:5",84,89],["7:6-7:11",90,95],["8:0-8:5",96,101],["8:6-8:11",102,107],["9:0-9:5",108,113],["9:6-9:11",114,119],["10:0-10:11",120,131],["11:0-11:11",132,143],["12:0-12:11",144,155],["13:0-13:11",156,167],["14:0-14:11",168,179],["15:0-15:11",180,191],["16:0-16:11",192,203],["17:0-18:11",204,227],["19:0-20:11",228,251],["21:0-49:11",252,599],["50:0-69:11",600,839],["70:0-90+",840,9999]];
    for (const [k, mn, mx] of f) if (t >= mn && t <= mx) return k;
    return null;
}

function determinarFaixaE2(a) {
    if (a >= 3 && a <= 6) return "3-6";
    if (a >= 7 && a <= 11) return "7-11";
    if (a >= 12 && a <= 20) return "12-20";
    if (a >= 21 && a <= 69) return "21-69";
    if (a >= 70) return "70-90+";
    return null;
}

// ── LOOKUPS ──
function lookupPP(faixa, dom, bruta) {
    if (!NORMS || !faixa) return null;
    const tb = NORMS.tables[faixa]; if (!tb || !tb[dom]) return null;
    for (const e of tb[dom]) if (bruta >= e[0] && bruta <= e[1]) return e[2];
    const entries = tb[dom];
    if (entries.length > 0 && bruta > entries[entries.length - 1][1]) return entries[entries.length - 1][2];
    if (entries.length > 0 && bruta < entries[0][0]) return entries[0][2];
    return null;
}

function lookupCCA(faixa, soma) {
    if (!NORMS || !faixa) return null;
    const tb = NORMS.tables[faixa]; if (!tb || !tb['ABC']) return null;
    for (const e of tb['ABC']) if (soma >= e[0] && soma <= e[1]) return e[2];
    const entries = tb['ABC'];
    if (entries.length > 0 && soma > entries[entries.length - 1][1]) return entries[entries.length - 1][2];
    if (entries.length > 0 && soma < entries[0][0]) return entries[0][2];
    return null;
}

function lookupVescala(faixaE2, tipo, bruta) {
    if (!NORMS_E2 || !faixaE2) return null;
    const tb = NORMS_E2.tables[faixaE2]; if (!tb || !tb[tipo]) return null;
    for (const e of tb[tipo]) if (bruta >= e[0] && bruta <= e[1]) return e[2];
    return null;
}

function classificarVescala(v) {
    if (v === null) return { label: '—', color: '#9ca3af' };
    for (const l of NORMS_E2.classification.levels) if (v >= l.v_min && v <= l.v_max) return { label: l.label, color: l.color };
    return { label: '—', color: '#9ca3af' };
}

// ── PONTUAÇÕES ──
function calcBruta(dk) {
    const d = RULES.domains[dk]; if (!d) return { bruta: 0, est: 0, total: 0, pct: 0 };
    let s = 0, e = 0;
    for (let i = 1; i <= d.maxItems; i++) {
        const inp = document.querySelector('input[name="' + dk + '_' + i + '"]:checked');
        if (inp) s += parseInt(inp.value);
        const ec = document.getElementById('est_' + dk + '_' + i);
        if (ec && ec.checked) e++;
    }
    return { bruta: s, est: e, total: d.maxItems, pct: d.maxItems > 0 ? Math.round(e / d.maxItems * 100) : 0 };
}

function calcComp(sk) {
    const sec = RULES.behavior[sk]; if (!sec) return { soma: 0 };
    let s = 0;
    for (let i = 1; i <= sec.maxItems; i++) {
        const inp = document.querySelector('input[name="' + sk + '_' + i + '"]:checked');
        if (inp) s += parseInt(inp.value);
    }
    return { soma: s };
}

function classificarNivelAdaptativo(pp) {
    if (pp === null || pp === undefined || isNaN(pp)) return { label: '—', color: '#6b7280' };
    for (const n of RULES.classification.adaptiveLevel) if (pp >= n.min && pp <= n.max) return { label: n.label, color: n.color };
    return { label: '—', color: '#6b7280' };
}

function cdfN(z) { const a1 = .254829592, a2 = -.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = .3275911; const s = z < 0 ? -1 : 1; z = Math.abs(z) / Math.sqrt(2); const t = 1 / (1 + p * z); return .5 * (1 + s * (1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z))); }
function rankP(pp) { if (pp === null) return '—'; const pct = Math.round(cdfN((pp - 100) / 15) * 100); return pct < 1 ? '<1' : pct > 99 ? '>99' : pct + ''; }
function ic95(pp) { if (pp === null) return '—'; return (pp - 10) + '–' + (pp + 10); }
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v; }

// ── PROCESSAMENTO PRINCIPAL ──
function processarResultados() {
    const dataNasc = document.getElementById('dataNascimento')?.value;
    const dataTeste = document.getElementById('dataTeste')?.value;
    const idade = calcularIdade(dataNasc, dataTeste);
    let faixaC3 = null, faixaE2 = null;

    if (idade) {
        setText('idadeAnos', idade.anos);
        setText('idadeMeses', idade.meses);
        faixaC3 = determinarFaixaC3(idade.anos, idade.meses);
        faixaE2 = determinarFaixaE2(idade.anos);
        setText('faixaEtaria', faixaC3 || 'Fora do intervalo (< 3 anos)');
    }

    const hmotOk = idade ? idade.anos < 10 : true;
    const pps = {};

    // Domínios adaptativos — correção automática
    ['COM', 'AVD', 'SOC', 'HMOT'].forEach(key => {
        const r = calcBruta(key);
        setText('bruta_' + key, r.bruta);
        setText('est_count_' + key, r.est + ' (' + r.pct + '%)');

        let pp = null;
        if (faixaC3 && (key !== 'HMOT' || hmotOk)) pp = lookupPP(faixaC3, key, r.bruta);
        pps[key] = pp;

        // Atualizar os campos de PP (agora automáticos, mas mantemos input para override manual)
        const ppInput = document.getElementById('pp_' + key);
        if (ppInput) {
            if (pp !== null && !ppInput.dataset.manual) ppInput.value = pp;
            const usedPP = ppInput.value ? parseInt(ppInput.value) : pp;
            if (usedPP) pps[key] = usedPP;
            const cl = classificarNivelAdaptativo(usedPP);
            const nivelEl = document.getElementById('nivel_' + key);
            if (nivelEl) { nivelEl.textContent = cl.label; nivelEl.style.color = cl.color; nivelEl.style.fontWeight = '700'; }
        }

        // Sync para área de resultados
        const brutaRes = document.getElementById('bruta_' + key + '_res');
        if (brutaRes) brutaRes.textContent = r.bruta;
    });

    // CCA
    const ppCOM = pps.COM || 0, ppAVD = pps.AVD || 0, ppSOC = pps.SOC || 0;
    const somaPP = ppCOM + ppAVD + ppSOC;
    setText('soma_pp', somaPP > 0 ? somaPP : '—');

    let ppCCA = (faixaC3 && somaPP > 0) ? lookupCCA(faixaC3, somaPP) : null;
    const ccaInput = document.getElementById('pp_CCA');
    if (ccaInput) {
        if (ppCCA !== null && !ccaInput.dataset.manual) ccaInput.value = ppCCA;
        const usedCCA = ccaInput.value ? parseInt(ccaInput.value) : ppCCA;
        if (usedCCA) ppCCA = usedCCA;
        const clCCA = classificarNivelAdaptativo(usedCCA);
        const nivelCCA = document.getElementById('nivel_CCA');
        if (nivelCCA) { nivelCCA.textContent = clCCA.label; nivelCCA.style.color = clCCA.color; nivelCCA.style.fontWeight = '700'; }
    }

    // Comportamento mal-adaptativo — com V-Escala automática
    ['sectionA', 'sectionB', 'sectionC'].forEach(key => {
        const r = calcComp(key);
        setText('soma_' + key, r.soma);
        const somaRes = document.getElementById('soma_' + key + '_res');
        if (somaRes) somaRes.textContent = r.soma;

        // V-Escala automática para seções A (int) e B (ext)
        if (key === 'sectionA' && faixaE2) {
            const vScore = lookupVescala(faixaE2, 'int', r.soma);
            const veEl = document.getElementById('ve_sectionA');
            if (veEl) veEl.value = vScore !== null ? vScore : '';
            const veLabel = document.getElementById('ve_label_sectionA');
            if (veLabel) {
                const cl = classificarVescala(vScore);
                veLabel.textContent = cl.label;
                veLabel.style.color = cl.color;
            }
        }
        if (key === 'sectionB' && faixaE2) {
            const vScore = lookupVescala(faixaE2, 'ext', r.soma);
            const veEl = document.getElementById('ve_sectionB');
            if (veEl) veEl.value = vScore !== null ? vScore : '';
            const veLabel = document.getElementById('ve_label_sectionB');
            if (veLabel) {
                const cl = classificarVescala(vScore);
                veLabel.textContent = cl.label;
                veLabel.style.color = cl.color;
            }
        }
    });

    atualizarItensCriticos();
    atualizarGrafico();
}

// ── ITENS CRÍTICOS ──
function atualizarItensCriticos() {
    const criticos = [];
    ['sectionA', 'sectionB', 'sectionC'].forEach(sectionKey => {
        const section = RULES.behavior[sectionKey];
        for (let i = 1; i <= section.maxItems; i++) {
            const input = document.querySelector('input[name="' + sectionKey + '_' + i + '"]:checked');
            if (input && parseInt(input.value) >= 1)
                criticos.push({ section: section.name, num: i, text: section.items[i - 1].text, value: parseInt(input.value) });
        }
    });
    const container = document.getElementById('itensCriticos');
    if (!container) return;
    if (criticos.length === 0) {
        container.innerHTML = '<p class="no-criticos">Nenhum item crítico identificado.</p>';
    } else {
        container.innerHTML = criticos.map(c => '<div class="critico-item ' + (c.value === 2 ? 'critico-alto' : 'critico-medio') + '"><span class="critico-badge">' + (c.value === 2 ? 'Frequente' : 'Às vezes') + '</span><span class="critico-section">' + c.section + '</span> — Item ' + c.num + ': ' + c.text + '</div>').join('');
    }
}

// ── GRÁFICO ──
function atualizarGrafico() {
    const canvas = document.getElementById('perfilGrafico');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 800 * dpr; canvas.height = 400 * dpr;
    canvas.style.width = '800px'; canvas.style.height = '400px';
    ctx.scale(dpr, dpr);
    const w = 800, h = 400;
    ctx.clearRect(0, 0, w, h);
    const pad = { top: 40, right: 60, bottom: 55, left: 55 };
    const cw = w - pad.left - pad.right, ch = h - pad.top - pad.bottom;
    const minY = 20, maxY = 140, rY = maxY - minY;
    function yP(v) { return pad.top + ch - ((v - minY) / rY) * ch; }

    [{ min: 130, max: 140, c: 'rgba(26,116,49,0.08)' }, { min: 115, max: 129, c: 'rgba(45,158,66,0.08)' }, { min: 86, max: 114, c: 'rgba(59,130,246,0.06)' }, { min: 71, max: 85, c: 'rgba(245,158,11,0.08)' }, { min: 20, max: 70, c: 'rgba(220,38,38,0.08)' }].forEach(f => {
        ctx.fillStyle = f.c; ctx.fillRect(pad.left, yP(Math.min(f.max, maxY)), cw, yP(Math.max(f.min, minY)) - yP(Math.min(f.max, maxY)));
    });

    [70, 85, 100, 115, 130].forEach(v => {
        ctx.beginPath(); ctx.strokeStyle = v === 100 ? '#dc2626' : '#d1d5db'; ctx.lineWidth = v === 100 ? 1.5 : .8;
        ctx.setLineDash(v === 100 ? [] : [3, 3]); ctx.moveTo(pad.left, yP(v)); ctx.lineTo(pad.left + cw, yP(v)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#9ca3af'; ctx.font = '10px system-ui'; ctx.textAlign = 'right'; ctx.fillText(v, pad.left - 8, yP(v) + 4);
    });

    [{ y: 135, l: 'Alto', c: '#1a7431' }, { y: 122, l: 'Mod. Alto', c: '#2d9e42' }, { y: 100, l: 'Adequado', c: '#3b82f6' }, { y: 78, l: 'Mod. Baixo', c: '#f59e0b' }, { y: 50, l: 'Baixo', c: '#dc2626' }].forEach(r => {
        ctx.fillStyle = r.c; ctx.font = '9px system-ui'; ctx.textAlign = 'left'; ctx.fillText(r.l, pad.left + cw + 4, yP(r.y) + 3);
    });

    const labels = ['COM', 'AVD', 'SOC', 'CCA', 'HMOT'];
    const fullLabels = ['Comunicação', 'AVD', 'Socialização', 'CCA', 'Hab. Motoras'];
    const barWidth = cw / labels.length;
    const pontos = [];

    labels.forEach((key, i) => {
        const x = pad.left + barWidth * i + barWidth / 2;
        ctx.fillStyle = '#374151'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(fullLabels[i], x, h - pad.bottom + 20);
        ctx.font = '10px system-ui'; ctx.fillStyle = '#6b7280';
        ctx.fillText('(' + key + ')', x, h - pad.bottom + 34);
        const ppInput = document.getElementById('pp_' + key);
        const val = ppInput ? parseInt(ppInput.value) : NaN;
        if (!isNaN(val) && val >= minY && val <= maxY) pontos.push({ x, y: yP(val), val, key });
    });

    if (pontos.length > 1) {
        ctx.beginPath(); ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2.5;
        pontos.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }); ctx.stroke();
    }

    pontos.forEach(p => {
        const cl = classificarNivelAdaptativo(p.val);
        ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = cl.color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#1f2937'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(p.val, p.x, p.y - 14);
    });

    ctx.fillStyle = '#1f2937'; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Perfil da Pontuação Padrão do Domínio e CCA', w / 2, 20);
}

// ── FORMULÁRIO ──
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

    // Marcar inputs manuais de PP para não serem sobrescritos pelo auto-cálculo
    ['COM', 'AVD', 'SOC', 'HMOT', 'CCA'].forEach(key => {
        const ppInput = document.getElementById('pp_' + key);
        if (ppInput) {
            ppInput.addEventListener('input', function () {
                this.dataset.manual = this.value ? '1' : '';
                processarResultados();
            });
        }
    });
}

// ── NAVEGAÇÃO ──
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
    document.querySelectorAll('input[type="number"]').forEach(el => { el.value = ''; delete el.dataset.manual; });
    document.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
    document.querySelectorAll('input[type="date"]').forEach(el => el.value = '');
    document.querySelectorAll('textarea').forEach(el => el.value = '');
    processarResultados();
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
    const ok = await loadRules();
    if (ok) { gerarFormulario(); processarResultados(); }
});

// ==========================================
// RELATÓRIO — GERAÇÃO COM LOADING E MODAL
// ==========================================
function gerarRelatorio() {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'vineland-loading';
    loadingScreen.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,0.8);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
    loadingScreen.innerHTML = '<div style="background:white;padding:2rem 3rem;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.2);display:flex;flex-direction:column;align-items:center;gap:1rem;"><div class="spinner" style="width:40px;height:40px;border:4px solid #dbeafe;border-top:4px solid #1a56db;border-radius:50%;animation:spin 1s linear infinite;"></div><div style="font-weight:700;color:#0c1f3f;font-size:1.1rem;">Gerando relatório...</div><div style="font-size:0.8rem;color:#6b7280;">Isso pode levar alguns segundos.</div></div><style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>';
    document.body.appendChild(loadingScreen);

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
            const rk = rankP(pp);
            const icStr = ic95(pp);
            return { key, nome: nomesDominios[key], bruta, pp, rank: rk, ic: icStr, nivel: cl.label, cor: cl.color };
        });

        const somaPP = (parseInt(document.getElementById('pp_COM')?.value) || 0) + (parseInt(document.getElementById('pp_AVD')?.value) || 0) + (parseInt(document.getElementById('pp_SOC')?.value) || 0);
        const ppCCA = parseInt(document.getElementById('pp_CCA')?.value) || null;
        const clCCA = classificarNivelAdaptativo(ppCCA);

        const somaA = parseInt(document.getElementById('soma_sectionA')?.textContent) || 0;
        const somaB = parseInt(document.getElementById('soma_sectionB')?.textContent) || 0;
        const somaC = parseInt(document.getElementById('soma_sectionC')?.textContent) || 0;
        const veA = document.getElementById('ve_sectionA')?.value || '—';
        const veB = document.getElementById('ve_sectionB')?.value || '—';
        const veLabelA = document.getElementById('ve_label_sectionA')?.textContent || '—';
        const veLabelB = document.getElementById('ve_label_sectionB')?.textContent || '—';

        const criticos = [];
        ['sectionA', 'sectionB', 'sectionC'].forEach(sectionKey => {
            const section = RULES.behavior[sectionKey];
            for (let i = 1; i <= section.maxItems; i++) {
                const input = document.querySelector('input[name="' + sectionKey + '_' + i + '"]:checked');
                if (input && parseInt(input.value) >= 1) criticos.push({ section: section.name, num: i, text: section.items[i - 1].text, value: parseInt(input.value) });
            }
        });

        // SVG do perfil
        const labels = ['COM', 'AVD', 'SOC', 'CCA', 'HMOT'];
        const fullLabels = ['Comunicação', 'AVD', 'Socialização', 'CCA', 'Hab. Motoras'];
        const ppValues = { COM: parseInt(document.getElementById('pp_COM')?.value) || null, AVD: parseInt(document.getElementById('pp_AVD')?.value) || null, SOC: parseInt(document.getElementById('pp_SOC')?.value) || null, CCA: ppCCA, HMOT: parseInt(document.getElementById('pp_HMOT')?.value) || null };
        const svgW = 700, svgH = 300, padL = 60, padR = 30, padT = 35, padB = 60, cW = svgW - padL - padR, cH = svgH - padT - padB;
        function yP(v) { return padT + cH - ((v - 20) / (140 - 20)) * cH; }
        let svgParts = ['<svg width="700" height="300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 300">'];
        [{ min: 130, max: 140, fill: 'rgba(26,116,49,0.12)' }, { min: 115, max: 129, fill: 'rgba(45,158,66,0.12)' }, { min: 86, max: 114, fill: 'rgba(59,130,246,0.10)' }, { min: 71, max: 85, fill: 'rgba(245,158,11,0.12)' }, { min: 20, max: 70, fill: 'rgba(220,38,38,0.10)' }].forEach(f => {
            const y1 = yP(Math.min(f.max, 140)); const h2 = yP(Math.max(f.min, 20)) - y1;
            svgParts.push('<rect x="' + padL + '" y="' + y1.toFixed(1) + '" width="' + cW + '" height="' + h2.toFixed(1) + '" fill="' + f.fill + '"/>');
        });
        [70, 85, 100, 115, 130].forEach(v => {
            const y = yP(v).toFixed(1); const cor = v === 100 ? '#dc2626' : '#d1d5db'; const lw = v === 100 ? 1.5 : 1; const dash = v === 100 ? '' : 'stroke-dasharray="4,4"';
            svgParts.push('<line x1="' + padL + '" y1="' + y + '" x2="' + (padL + cW) + '" y2="' + y + '" stroke="' + cor + '" stroke-width="' + lw + '" ' + dash + '/>');
            svgParts.push('<text x="' + (padL - 6) + '" y="' + (parseFloat(y) + 4).toFixed(1) + '" font-size="10" fill="#6b7280" text-anchor="end">' + v + '</text>');
        });
        const colW = cW / labels.length; const pontosCoords = [];
        labels.forEach((key, i) => {
            const x = (padL + colW * i + colW / 2).toFixed(1); const val = ppValues[key];
            svgParts.push('<text x="' + x + '" y="' + (padT + cH + 20).toFixed(1) + '" font-size="10" font-weight="600" fill="#374151" text-anchor="middle">' + fullLabels[i] + '</text>');
            svgParts.push('<text x="' + x + '" y="' + (padT + cH + 33).toFixed(1) + '" font-size="9" fill="#6b7280" text-anchor="middle">(' + key + ')</text>');
            if (val && val >= 20 && val <= 140) { const y = yP(val); const cl = classificarNivelAdaptativo(val); pontosCoords.push({ x: parseFloat(x), y, cor: cl.color, val }); }
        });
        if (pontosCoords.length > 1) { const d = pontosCoords.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' '); svgParts.push('<path d="' + d + '" stroke="#7c3aed" stroke-width="2" fill="none"/>'); }
        pontosCoords.forEach(p => {
            svgParts.push('<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="6" fill="' + p.cor + '" stroke="white" stroke-width="2"/>');
            svgParts.push('<text x="' + p.x.toFixed(1) + '" y="' + (p.y - 12).toFixed(1) + '" font-size="11" font-weight="700" fill="#1f2937" text-anchor="middle">' + p.val + '</text>');
        });
        svgParts.push('<text x="350" y="18" font-size="12" font-weight="700" fill="#1f2937" text-anchor="middle">Perfil da Pontuação Padrão do Domínio e CCA</text>');
        svgParts.push('</svg>');
        const svgGrafico = svgParts.join('');

        const tabelaDoms = dadosDominios.map((d, i) =>
            '<tr' + (i % 2 ? ' class="alt"' : '') + '><td style="font-weight:600">' + d.nome + ' <span style="color:#94a3b8">(' + d.key + ')</span></td><td class="ctr" style="font-weight:700">' + d.bruta + '</td><td class="ctr" style="font-weight:800;font-size:13px;color:#1e40af">' + (d.pp !== null ? d.pp : '—') + '</td><td class="ctr">' + d.ic + '</td><td class="ctr">' + d.rank + '</td><td class="ctr"><span style="font-weight:700;color:' + d.cor + ';">' + d.nivel + '</span></td></tr>'
        ).join('');

        const criticoHTML = criticos.length === 0 ? '<p style="color:#059669;font-weight:600;padding:0.5rem 0;">Nenhum item crítico identificado.</p>'
            : criticos.map(c => '<div style="padding:0.6rem 1rem;margin-bottom:0.4rem;border-radius:6px;font-size:0.82rem;line-height:1.5;border-left:4px solid ' + (c.value === 2 ? '#dc2626' : '#d97706') + ';background:' + (c.value === 2 ? '#fef2f2' : '#fffbeb') + ';"><span style="display:inline-block;padding:0.1rem 0.5rem;border-radius:20px;font-size:0.7rem;font-weight:700;margin-right:0.4rem;background:' + (c.value === 2 ? '#dc2626' : '#d97706') + ';color:white;">' + (c.value === 2 ? 'Frequente' : 'Às vezes') + '</span><strong style="color:#4b5563;">' + c.section + '</strong> — Item ' + c.num + ': ' + c.text + '</div>').join('');

        const comentariosHTML = comentarios.trim() ? '<div class="rpt-sh"><span class="num">6</span><span class="sh-title">Observações do Avaliador</span></div><div class="rpt-box" style="font-size:12px;line-height:1.7;color:#334155;white-space:pre-line;">' + comentarios + '</div>' : '';
        const dataGerado = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const reportStyles = '<style>@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap");*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}body{margin:0;padding:20px;background:#f1f5f9;font-family:"DM Sans",Arial,sans-serif;color:#1e293b;}.report{background:#fff;border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 8px 40px rgba(0,0,0,.06);overflow:hidden;font-family:"DM Sans",Arial,sans-serif}.rpt-hdr{background:linear-gradient(135deg,#0c1f3f 0%,#1a3a6a 50%,#1e40af 100%);color:#fff;padding:14px 24px 12px;position:relative;overflow:hidden}.rpt-hdr .deco1{position:absolute;top:-50px;right:-50px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.03)}.rpt-hdr .deco2{position:absolute;bottom:-30px;left:40%;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,.02)}.rpt-hdr .hdr-logo{width:30px;height:30px;object-fit:contain;filter:brightness(10);flex-shrink:0}.rpt-hdr-inner{display:flex;justify-content:space-between;align-items:flex-start;position:relative}.rpt-hdr .kicker{font-size:8px;text-transform:uppercase;letter-spacing:3px;opacity:.45}.rpt-hdr .title{font-size:20px;font-weight:800;margin-top:3px;letter-spacing:-.5px}.rpt-hdr .subtitle{font-size:10px;opacity:.55;margin-top:2px}.rpt-hdr .sub2{font-size:9px;opacity:.45;margin-top:1px}.rpt-hdr-badge{background:rgba(255,255,255,.08);border-radius:8px;padding:6px 10px;backdrop-filter:blur(8px);text-align:right}.rpt-hdr-badge .lbl{font-size:7px;text-transform:uppercase;letter-spacing:2px;opacity:.5}.rpt-hdr-badge .val{font-size:16px;font-weight:800;margin-top:1px}.rpt-hdr-badge .sub{font-size:8px;opacity:.5;margin-top:1px}.rpt-body{padding:0 24px 24px}.rpt-sh{display:flex;align-items:center;gap:8px;margin-bottom:10px;margin-top:14px}.rpt-sh:first-child{margin-top:10px}.rpt-sh .num{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:#1a56db;color:#fff;font-size:10px;font-weight:800;flex-shrink:0}.rpt-sh .sh-title{font-weight:700;font-size:13px;color:#0f172a}.rpt-sh .sh-sub{font-size:10px;color:#64748b;margin-top:1px}.rpt-box{background:#f8fafc;border-radius:10px;padding:12px 16px;border:1px solid #e2e8f0}.rpt-info{display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;font-size:12px}.rpt-info .lbl{font-size:10px;color:#64748b;font-weight:600}.rpt-info .val{font-size:12px;color:#0f172a;font-weight:400}.rpt-info .val.bold{font-weight:600}.rpt-info .sep{grid-column:1/-1;border-top:1px dashed rgba(26,86,219,.18);margin:3px 0;padding:0}.rpt-tbl{width:100%;border-collapse:collapse;font-size:12px;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0}.rpt-tbl th{padding:6px 8px;text-align:left;font-weight:700;font-size:9px;text-transform:uppercase;letter-spacing:.4px;border-bottom:2px solid #e2e8f0;background:#dbeafe;color:#1e40af}.rpt-tbl th.ctr{text-align:center}.rpt-tbl td{padding:5px 8px;font-size:11px;border-bottom:1px solid #f1f5f9}.rpt-tbl td.ctr{text-align:center}.rpt-tbl tr.alt{background:#f8fafc}.rpt-tbl tfoot td{background:#dbeafe;font-weight:800;color:#1e40af;font-size:11px;text-transform:uppercase;letter-spacing:.5px}.cca-box{background:#eff6ff;border:1px solid #93c5fd;border-radius:10px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;margin-top:12px;flex-wrap:wrap;gap:8px}.cca-values{display:flex;align-items:center;gap:24px}.cca-mini-label{font-size:9px;font-weight:700;text-transform:uppercase;color:#1e40af}.cca-mini-val{font-size:22px;font-weight:800;color:#0c1f3f;line-height:1}.grafico-wrap{border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:16px;overflow:hidden}.grafico-wrap svg{width:100%;height:auto}.faixas-legend{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;font-size:11px}.faixa-item{display:flex;align-items:center;gap:4px}.faixa-dot{width:10px;height:10px;border-radius:50%}.behavior-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px}.behavior-box{border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;text-align:center;background:#f8fafc}.behavior-box h4{font-size:10px;text-transform:uppercase;color:#64748b;margin:0 0 6px;letter-spacing:.3px}.soma-val{font-size:20px;font-weight:800;color:#1a56db}.ve-row{font-size:11px;color:#64748b;margin-top:4px}.interp-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.interp-box{border:1px solid;border-radius:10px;padding:10px 14px}.interp-box h4{font-size:11px;font-weight:700;margin:0 0 4px}.interp-box p{font-size:11px;line-height:1.5;margin:0}.rpt-foot{border-top:2px solid #e2e8f0;padding-top:16px;margin-top:22px;display:flex;justify-content:space-between}.rpt-foot .sign-line{margin-top:12px;border-top:1px solid #0f172a;width:200px;padding-top:4px;font-size:10px;color:#94a3b8}.rpt-foot-right{text-align:right;font-size:11px;color:#64748b}.rpt-foot-disclaimer{font-size:9px;color:#cbd5e1;max-width:220px;margin-top:8px}.no-break{break-inside:avoid;page-break-inside:avoid}@media print{body{background:white;padding:0;}.report{border:none;box-shadow:none;border-radius:0;margin:0;width:100%}.rpt-hdr{border-radius:0!important;background:linear-gradient(135deg,#0c1f3f 0%,#1a3a6a 50%,#1e40af 100%)!important}}</style>';

        const reportContent = '<div class="report">'
            + '<!-- HEADER --><div class="rpt-hdr"><div class="deco1"></div><div class="deco2"></div><div class="rpt-hdr-inner"><div style="display:flex;align-items:center;gap:16px"><img class="hdr-logo" src="/logo2.png" alt="Logo" onerror="this.style.display=\'none\'"><div><div class="kicker">Relatório Neuropsicológico</div><div class="title">Vineland-3</div><div class="subtitle">Formulário de Pais/Cuidadores — Níveis de Domínio</div><div class="sub2">Correção Automática</div></div></div><div class="rpt-hdr-badge"><div class="lbl">Idade</div><div class="val">' + idadeStr + '</div><div class="sub">Formulário Pais/Cuidadores</div></div></div></div>'
            + '<div class="rpt-body">'
            + '<!-- 1. IDENTIFICAÇÃO --><div class="rpt-sh"><span class="num">1</span><span class="sh-title">Identificação</span></div><div class="rpt-box no-break"><div class="rpt-info"><div><span class="lbl">Nome:</span> <span class="val bold">' + nome + '</span></div><div><span class="lbl">Sexo:</span> <span class="val">' + sexoLabel + '</span></div><div><span class="lbl">Nascimento:</span> <span class="val">' + formatarData(dataNasc) + '</span></div><div><span class="lbl">Avaliação:</span> <span class="val">' + formatarData(dataTeste) + '</span></div><div><span class="lbl">Idade:</span> <span class="val">' + idadeStr + '</span></div><div><span class="lbl">Respondente:</span> <span class="val">' + respondente + '</span></div><div><span class="lbl">Avaliador:</span> <span class="val bold">' + avaliador + '</span></div><div><span class="lbl">Formulário:</span> <span class="val">Pais/Cuidadores — Nível de Domínio</span></div></div></div>'
            + '<!-- 2. PONTUAÇÕES POR DOMÍNIO --><div class="rpt-sh"><span class="num">2</span><span class="sh-title">Pontuações por Domínio</span></div><div style="border-radius:10px;border:1px solid #e2e8f0;overflow:hidden" class="no-break"><table class="rpt-tbl"><thead><tr><th>Domínio</th><th class="ctr">Pont. Bruta</th><th class="ctr">Pont. Padrão</th><th class="ctr">IC 95%</th><th class="ctr">Rank %</th><th class="ctr">Nível Adaptativo</th></tr></thead><tbody>' + tabelaDoms + '<tr style="background:#dbeafe"><td style="padding:5px 8px;font-weight:800;color:#1e40af;font-size:11px">Composto Adaptativo (CCA)</td><td class="ctr" style="font-weight:800;color:#1e40af">' + somaPP + '</td><td class="ctr" style="font-weight:800;color:#1e40af;font-size:13px">' + (ppCCA !== null ? ppCCA : '—') + '</td><td class="ctr" style="font-weight:700;color:#1e40af">' + ic95(ppCCA) + '</td><td class="ctr" style="font-weight:700;color:#1e40af">' + rankP(ppCCA) + '</td><td class="ctr"><span style="font-weight:800;color:' + clCCA.color + ';">' + clCCA.label + '</span></td></tr></tbody></table></div>'
            + '<div class="cca-box"><div><div style="font-size:12px;font-weight:700;color:#0c1f3f;">Composto de Comportamento Adaptativo (CCA)</div><div style="font-size:10px;color:#1e40af;margin-top:2px;">Soma PP (COM+AVD+SOC) → Tabela C.3</div></div><div class="cca-values"><div><div class="cca-mini-label">Soma PP</div><div class="cca-mini-val">' + somaPP + '</div></div><div><div class="cca-mini-label">CCA</div><div class="cca-mini-val">' + (ppCCA !== null ? ppCCA : '—') + '</div></div><div><span style="font-size:12px;font-weight:700;color:' + clCCA.color + ';">' + clCCA.label + '</span></div></div></div>'
            + '<!-- 3. PERFIL DE PONTUAÇÕES --><div class="rpt-sh"><span class="num">3</span><span class="sh-title">Perfil de Pontuações Padrão</span></div><div class="faixas-legend"><div class="faixa-item"><div class="faixa-dot" style="background:#1a7431;"></div><span>Alto (≥ 130)</span></div><div class="faixa-item"><div class="faixa-dot" style="background:#2d9e42;"></div><span>Mod. Alto (115–129)</span></div><div class="faixa-item"><div class="faixa-dot" style="background:#3b82f6;"></div><span>Adequado (86–114)</span></div><div class="faixa-item"><div class="faixa-dot" style="background:#f59e0b;"></div><span>Mod. Baixo (71–85)</span></div><div class="faixa-item"><div class="faixa-dot" style="background:#dc2626;"></div><span>Baixo (≤ 70)</span></div></div><div class="grafico-wrap">' + svgGrafico + '</div>'
            + '<!-- 4. COMPORTAMENTO MAL-ADAPTATIVO --><div class="rpt-sh"><span class="num">4</span><span class="sh-title">Comportamento Mal-Adaptativo</span></div><div class="behavior-grid"><div class="behavior-box"><h4>Seção A — Internalizante</h4><div class="soma-val">' + somaA + '</div><div class="ve-row">V-Escala: <strong>' + veA + '</strong> — ' + veLabelA + '</div></div><div class="behavior-box"><h4>Seção B — Externalizante</h4><div class="soma-val">' + somaB + '</div><div class="ve-row">V-Escala: <strong>' + veB + '</strong> — ' + veLabelB + '</div></div><div class="behavior-box"><h4>Seção C — Outros</h4><div class="soma-val">' + somaC + '</div><div class="ve-row">Sem V-Escala</div></div></div>' + (criticos.length > 0 ? '<div style="margin-top:10px;"><div style="font-size:11px;font-weight:700;color:#0f172a;margin-bottom:6px;">Itens Críticos (pontuação ≥ 1)</div>' + criticoHTML + '</div>' : '')
            + '<!-- 5. INTERPRETAÇÃO --><div class="rpt-sh"><span class="num">5</span><span class="sh-title">Interpretação Clínica do Nível Adaptativo</span></div><div class="interp-grid"><div class="interp-box" style="background:#ecfdf5;border-color:#6ee7b7;"><h4 style="color:#065f46;">Alto / Mod. Alto (≥ 115)</h4><p style="color:#065f46;">O comportamento adaptativo encontra-se acima da média normativa. Habilidades adaptativas bem desenvolvidas para a faixa etária.</p></div><div class="interp-box" style="background:#eff6ff;border-color:#93c5fd;"><h4 style="color:#1e40af;">Adequado (86–114)</h4><p style="color:#1e40af;">Comportamento adaptativo dentro da faixa esperada. Habilidades compatíveis com as expectativas normativas.</p></div><div class="interp-box" style="background:#fffbeb;border-color:#fcd34d;"><h4 style="color:#92400e;">Mod. Baixo (71–85)</h4><p style="color:#92400e;">Abaixo da média normativa. Limitações que podem interferir no funcionamento independente. Recomenda-se avaliação abrangente.</p></div><div class="interp-box" style="background:#fef2f2;border-color:#fca5a5;"><h4 style="color:#991b1b;">Baixo (≤ 70)</h4><p style="color:#991b1b;">Significativamente abaixo da média. Comprometimento substancial do funcionamento adaptativo. Combinado com limitações intelectuais, pode indicar Deficiência Intelectual (DSM-5).</p></div></div>'
            + comentariosHTML
            + '<!-- RODAPÉ --><div class="rpt-foot no-break"><div>' + (avaliador !== '—' ? '<div style="font-weight:700;font-size:14px;color:#0f172a">' + avaliador + '</div><div style="font-size:12px;color:#64748b">Neuropsicólogo(a)</div>' : '<div style="color:#64748b;font-size:12px">Documento gerado automaticamente</div>') + '<div class="sign-line">Assinatura do profissional</div></div><div class="rpt-foot-right"><div>Documento gerado em ' + dataGerado + '</div><div class="rpt-foot-disclaimer">Este documento é confidencial e destinado exclusivamente ao profissional solicitante. Válido apenas com assinatura.</div></div></div>'
            + '</div></div>';

        const htmlContent = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Vineland-3 — Relatório | ' + nome + '</title>' + reportStyles + '</head><body>' + reportContent + '</body></html>';

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'modal-relatorio-overlay';
        modalOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,0.85);z-index:99999;display:flex;flex-direction:column;align-items:center;padding:2rem 1rem;backdrop-filter:blur(4px);';
        const modalWrapper = document.createElement('div');
        modalWrapper.style.cssText = 'background:#f8f9fb;border-radius:8px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);width:850px;max-width:100%;height:95vh;display:flex;flex-direction:column;overflow:hidden;';
        const modalHeader = document.createElement('div');
        modalHeader.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:1rem 1.5rem;background:white;border-bottom:1px solid #e2e5ea;flex-shrink:0;';
        modalHeader.innerHTML = '<div style="font-weight:800;color:#0c1f3f;font-size:1.1rem;">Visualização do Relatório</div><div style="display:flex;gap:0.5rem;"><button id="btn-print-modal" style="padding:0.6rem 1.2rem;background:#1a56db;color:white;border:none;border-radius:6px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:0.5rem;">🖨️ Imprimir / Salvar PDF</button><button id="btn-close-modal" style="padding:0.6rem 1.2rem;background:#ef4444;color:white;border:none;border-radius:6px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:0.5rem;">❌ Fechar</button></div>';
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'flex:1;width:100%;border:none;background:#f8f9fb;';
        modalWrapper.appendChild(modalHeader);
        modalWrapper.appendChild(iframe);
        modalOverlay.appendChild(modalWrapper);
        document.getElementById('vineland-loading').remove();
        document.body.appendChild(modalOverlay);
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open(); iframeDoc.write(htmlContent); iframeDoc.close();
        document.getElementById('btn-close-modal').addEventListener('click', () => modalOverlay.remove());
        document.getElementById('btn-print-modal').addEventListener('click', () => { iframe.contentWindow.focus(); iframe.contentWindow.print(); });
        modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.remove(); });

        // ── Salvar no Firebase ──
        if (window.Integration) {
          const clLabel = clCCA.label || '';
          Integration.salvarTesteNoFirebase("vineland-3", {
            dataAplicacao: dataTeste,
            resumo: ppCCA ? `CCA: ${ppCCA} — ${clLabel}` : '',
            scores: { dadosDominios: dadosDominios.map(d => ({ key: d.key, bruta: d.bruta, pp: d.pp, nivel: d.nivel })), ppCCA, somaPP },
            classificacao: clLabel,
            observacoes: comentarios,
            htmlRelatorio: reportStyles + reportContent,
          });
        }
    }, 800);
}
