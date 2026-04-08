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
    loadingScreen.innerHTML = '<div style="background:white;padding:2rem 3rem;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.2);display:flex;flex-direction:column;align-items:center;gap:1rem;"><div class="spinner" style="width:40px;height:40px;border:4px solid #ede9fe;border-top:4px solid #7c3aed;border-radius:50%;animation:spin 1s linear infinite;"></div><div style="font-weight:700;color:#4c1d95;font-size:1.1rem;">Gerando relatório...</div><div style="font-size:0.8rem;color:#6b7280;">Isso pode levar alguns segundos.</div></div><style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>';
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

        const tabelaDoms = dadosDominios.map(d =>
            '<tr><td style="padding:0.6rem 1rem;font-weight:600;">' + d.nome + ' (' + d.key + ')</td><td style="padding:0.6rem 1rem;text-align:center;font-weight:700;">' + d.bruta + '</td><td style="padding:0.6rem 1rem;text-align:center;font-weight:800;font-size:1.1rem;color:#4c1d95;">' + (d.pp !== null ? d.pp : '—') + '</td><td style="padding:0.6rem 1rem;text-align:center;">' + d.ic + '</td><td style="padding:0.6rem 1rem;text-align:center;">' + d.rank + '</td><td style="padding:0.6rem 1rem;text-align:center;"><span style="font-weight:700;color:' + d.cor + ';">' + d.nivel + '</span></td></tr>'
        ).join('');

        const criticoHTML = criticos.length === 0 ? '<p style="color:#059669;font-weight:600;padding:0.5rem 0;">Nenhum item crítico identificado.</p>'
            : criticos.map(c => '<div style="padding:0.6rem 1rem;margin-bottom:0.4rem;border-radius:6px;font-size:0.82rem;line-height:1.5;border-left:4px solid ' + (c.value === 2 ? '#dc2626' : '#d97706') + ';background:' + (c.value === 2 ? '#fef2f2' : '#fffbeb') + ';"><span style="display:inline-block;padding:0.1rem 0.5rem;border-radius:20px;font-size:0.7rem;font-weight:700;margin-right:0.4rem;background:' + (c.value === 2 ? '#dc2626' : '#d97706') + ';color:white;">' + (c.value === 2 ? 'Frequente' : 'Às vezes') + '</span><strong style="color:#4b5563;">' + c.section + '</strong> — Item ' + c.num + ': ' + c.text + '</div>').join('');

        const comentariosHTML = comentarios.trim() ? '<div style="margin-top:1.5rem;"><div class="section-title">OBSERVAÇÕES DO AVALIADOR</div><div class="section-body" style="font-size:0.88rem;line-height:1.7;color:#374151;white-space:pre-line;">' + comentarios + '</div></div>' : '';
        const dataGerado = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const reportStyles = '<style>@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap");*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:#f8f9fb;color:#1a1d23;margin:0;padding:0;}.page{width:794px;min-height:1123px;margin:0 auto;background:white;box-shadow:0 4px 24px rgba(0,0,0,0.1);}.report-header{background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4c1d95 100%);color:white;padding:1.5rem 2rem;display:flex;align-items:center;justify-content:space-between;}.logo-box{width:42px;height:42px;background:rgba(255,255,255,0.15);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;}.brand-name{font-size:1.15rem;font-weight:800;}.brand-sub{font-size:0.72rem;color:#c4b5fd;}.report-title{font-size:1.3rem;font-weight:800;text-align:right;}.report-subtitle{font-size:0.72rem;color:#c4b5fd;text-align:right;}.ident{padding:1.2rem 2rem;background:#f9fafb;border-bottom:1px solid #e2e5ea;display:grid;grid-template-columns:repeat(4,1fr);gap:0.8rem 1.5rem;}.ident label{font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;display:block;margin-bottom:0.2rem;}.ident span{font-size:0.85rem;font-weight:600;}.report-body{padding:1.5rem 2rem;}.section-title{font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#4c1d95;border-bottom:2px solid #e2e5ea;padding-bottom:0.4rem;margin-bottom:1rem;}.section-body{margin-bottom:1.5rem;}.results-table{width:100%;border-collapse:collapse;font-size:0.85rem;}.results-table thead tr{background:#4c1d95;color:white;}.results-table thead th{padding:0.6rem 1rem;font-weight:700;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em;text-align:left;}.results-table thead th:not(:first-child){text-align:center;}.results-table tbody tr:nth-child(even){background:#f9fafb;}.results-table tbody tr:last-child{border-top:2px solid #7c3aed;}.results-table tbody tr:last-child td{font-weight:800;color:#4c1d95;}.cca-box{background:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between;margin-top:1rem;flex-wrap:wrap;gap:0.5rem;}.cca-values{display:flex;align-items:center;gap:2rem;}.cca-mini-label{font-size:0.65rem;font-weight:700;text-transform:uppercase;color:#7c3aed;}.cca-mini-val{font-size:1.6rem;font-weight:800;color:#4c1d95;line-height:1;}.grafico-wrap{border:1px solid #e2e5ea;border-radius:8px;padding:1rem;margin-bottom:1.5rem;overflow:hidden;}.grafico-wrap svg{width:100%;height:auto;}.faixas-legend{display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:0.75rem;font-size:0.72rem;}.faixa-item{display:flex;align-items:center;gap:0.35rem;}.faixa-dot{width:10px;height:10px;border-radius:50%;}.behavior-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0.8rem;margin-bottom:1rem;}.behavior-box{border:1px solid #e2e5ea;border-radius:8px;padding:0.8rem 1rem;text-align:center;}.behavior-box h4{font-size:0.72rem;text-transform:uppercase;color:#6b7280;margin-bottom:0.4rem;}.soma-val{font-size:1.5rem;font-weight:800;color:#7c3aed;}.ve-row{font-size:0.75rem;color:#6b7280;margin-top:0.3rem;}.interp-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;}.interp-box{border:1px solid;border-radius:8px;padding:0.8rem 1rem;}.interp-box h4{font-size:0.78rem;font-weight:700;margin-bottom:0.3rem;}.interp-box p{font-size:0.72rem;line-height:1.5;}.report-footer{margin-top:2rem;padding-top:1rem;border-top:1px solid #e2e5ea;display:flex;justify-content:space-between;align-items:flex-end;}.footer-sig{width:200px;border-bottom:1px solid #374151;margin-bottom:0.3rem;height:1px;}.footer-prof{font-size:0.82rem;font-weight:700;}.footer-crp{font-size:0.72rem;color:#6b7280;}.footer-date{font-size:0.72rem;color:#6b7280;text-align:right;}.footer-conf{font-size:0.62rem;color:#9ca3af;text-align:right;margin-top:0.3rem;max-width:300px;}@media print{body{background:white;}.page{box-shadow:none;margin:0;width:100%;}}</style>';

        const reportContent = '<div class="page">'
            + '<div class="report-header"><div style="display:flex;align-items:center;gap:0.75rem;"><div class="logo-box">🧠</div><div><div class="brand-name">Equilibrium</div><div class="brand-sub">Neuropsicologia</div></div></div><div><div class="report-title">Vineland-3</div><div class="report-subtitle">Formulário de Pais/Cuidadores — Níveis de Domínio — Correção Automática</div></div></div>'
            + '<div class="ident"><div style="grid-column:1/3;"><label>Examinado(a)</label><span>' + nome + '</span></div><div><label>Sexo</label><span>' + sexoLabel + '</span></div><div><label>Data de Nascimento</label><span>' + formatarData(dataNasc) + '</span></div><div><label>Data da Avaliação</label><span>' + formatarData(dataTeste) + '</span></div><div><label>Idade na Avaliação</label><span>' + idadeStr + '</span></div><div><label>Respondente</label><span>' + respondente + '</span></div><div><label>Avaliador</label><span>' + avaliador + '</span></div><div><label>Formulário</label><span>Pais/Cuidadores — Nível de Domínio</span></div></div>'
            + '<div class="report-body">'
            + '<div class="section-title">PONTUAÇÕES POR DOMÍNIO</div><div class="section-body"><table class="results-table"><thead><tr><th>Domínio</th><th>Pont. Bruta</th><th>Pont. Padrão</th><th>IC 95%</th><th>Rank %</th><th>Nível Adaptativo</th></tr></thead><tbody>' + tabelaDoms + '<tr><td style="padding:0.6rem 1rem;">Composto Adaptativo (CCA)</td><td style="padding:0.6rem 1rem;text-align:center;">' + somaPP + '</td><td style="padding:0.6rem 1rem;text-align:center;font-size:1.1rem;">' + (ppCCA !== null ? ppCCA : '—') + '</td><td style="padding:0.6rem 1rem;text-align:center;">' + ic95(ppCCA) + '</td><td style="padding:0.6rem 1rem;text-align:center;">' + rankP(ppCCA) + '</td><td style="padding:0.6rem 1rem;text-align:center;"><span style="font-weight:800;color:' + clCCA.color + ';">' + clCCA.label + '</span></td></tr></tbody></table>'
            + '<div class="cca-box"><div><div style="font-size:0.82rem;font-weight:700;color:#4c1d95;">Composto de Comportamento Adaptativo (CCA)</div><div style="font-size:0.7rem;color:#7c3aed;margin-top:0.2rem;">Soma PP (COM+AVD+SOC) → Tabela C.3</div></div><div class="cca-values"><div><div class="cca-mini-label">Soma PP</div><div class="cca-mini-val">' + somaPP + '</div></div><div><div class="cca-mini-label">CCA</div><div class="cca-mini-val">' + (ppCCA !== null ? ppCCA : '—') + '</div></div><div><span style="font-size:0.82rem;font-weight:700;color:' + clCCA.color + ';">' + clCCA.label + '</span></div></div></div></div>'
            + '<div class="section-title">PERFIL DE PONTUAÇÕES PADRÃO</div><div class="section-body"><div class="faixas-legend"><div class="faixa-item"><div class="faixa-dot" style="background:#1a7431;"></div><span>Alto (≥ 130)</span></div><div class="faixa-item"><div class="faixa-dot" style="background:#2d9e42;"></div><span>Mod. Alto (115–129)</span></div><div class="faixa-item"><div class="faixa-dot" style="background:#3b82f6;"></div><span>Adequado (86–114)</span></div><div class="faixa-item"><div class="faixa-dot" style="background:#f59e0b;"></div><span>Mod. Baixo (71–85)</span></div><div class="faixa-item"><div class="faixa-dot" style="background:#dc2626;"></div><span>Baixo (≤ 70)</span></div></div><div class="grafico-wrap">' + svgGrafico + '</div></div>'
            + '<div class="section-title">COMPORTAMENTO MAL-ADAPTATIVO</div><div class="section-body"><div class="behavior-grid"><div class="behavior-box"><h4>Seção A — Internalizante</h4><div class="soma-val">' + somaA + '</div><div class="ve-row">V-Escala: <strong>' + veA + '</strong> — ' + veLabelA + '</div></div><div class="behavior-box"><h4>Seção B — Externalizante</h4><div class="soma-val">' + somaB + '</div><div class="ve-row">V-Escala: <strong>' + veB + '</strong> — ' + veLabelB + '</div></div><div class="behavior-box"><h4>Seção C — Outros</h4><div class="soma-val">' + somaC + '</div><div class="ve-row">Sem V-Escala</div></div></div>' + (criticos.length > 0 ? '<div style="margin-top:0.75rem;"><div style="font-size:0.78rem;font-weight:700;color:#374151;margin-bottom:0.5rem;">Itens Críticos (pontuação ≥ 1)</div>' + criticoHTML + '</div>' : '') + '</div>'
            + '<div class="section-title">INTERPRETAÇÃO CLÍNICA DO NÍVEL ADAPTATIVO</div><div class="section-body"><div class="interp-grid"><div class="interp-box" style="background:#ecfdf5;border-color:#6ee7b7;"><h4 style="color:#065f46;">Alto / Mod. Alto (≥ 115)</h4><p style="color:#065f46;">O comportamento adaptativo encontra-se acima da média normativa. Habilidades adaptativas bem desenvolvidas para a faixa etária.</p></div><div class="interp-box" style="background:#eff6ff;border-color:#93c5fd;"><h4 style="color:#1e40af;">Adequado (86–114)</h4><p style="color:#1e40af;">Comportamento adaptativo dentro da faixa esperada. Habilidades compatíveis com as expectativas normativas.</p></div><div class="interp-box" style="background:#fffbeb;border-color:#fcd34d;"><h4 style="color:#92400e;">Mod. Baixo (71–85)</h4><p style="color:#92400e;">Abaixo da média normativa. Limitações que podem interferir no funcionamento independente. Recomenda-se avaliação abrangente.</p></div><div class="interp-box" style="background:#fef2f2;border-color:#fca5a5;"><h4 style="color:#991b1b;">Baixo (≤ 70)</h4><p style="color:#991b1b;">Significativamente abaixo da média. Comprometimento substancial do funcionamento adaptativo. Combinado com limitações intelectuais, pode indicar Deficiência Intelectual (DSM-5).</p></div></div></div>'
            + comentariosHTML
            + '<div class="report-footer"><div><div class="footer-sig"></div><div class="footer-prof">' + (avaliador !== '—' ? avaliador : 'Profissional') + '</div><div class="footer-crp">Neuropsicólogo(a)</div></div><div><div class="footer-date">Documento gerado em ' + dataGerado + '</div><div class="footer-conf">Este documento é confidencial e destinado exclusivamente ao profissional solicitante. Válido apenas com assinatura.</div></div></div>'
            + '</div></div>';

        const htmlContent = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Vineland-3 — Relatório | ' + nome + '</title>' + reportStyles + '</head><body>' + reportContent + '</body></html>';

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'modal-relatorio-overlay';
        modalOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,0.85);z-index:99999;display:flex;flex-direction:column;align-items:center;padding:2rem 1rem;backdrop-filter:blur(4px);';
        const modalWrapper = document.createElement('div');
        modalWrapper.style.cssText = 'background:#f8f9fb;border-radius:8px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);width:850px;max-width:100%;height:95vh;display:flex;flex-direction:column;overflow:hidden;';
        const modalHeader = document.createElement('div');
        modalHeader.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:1rem 1.5rem;background:white;border-bottom:1px solid #e2e5ea;flex-shrink:0;';
        modalHeader.innerHTML = '<div style="font-weight:800;color:#4c1d95;font-size:1.1rem;">Visualização do Relatório</div><div style="display:flex;gap:0.5rem;"><button id="btn-print-modal" style="padding:0.6rem 1.2rem;background:#7c3aed;color:white;border:none;border-radius:6px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:0.5rem;">🖨️ Imprimir / Salvar PDF</button><button id="btn-close-modal" style="padding:0.6rem 1.2rem;background:#ef4444;color:white;border:none;border-radius:6px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:0.5rem;">❌ Fechar</button></div>';
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
