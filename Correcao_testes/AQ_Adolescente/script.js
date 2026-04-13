/**
 * AQ-ADOLESCENTE — script.js
 * Equilibrium Neuropsicologia
 * Baron-Cohen et al. (2006) — Adolescentes 12–15 anos
 */

console.log("AQ-ADOLESCENTE script.js carregado");

const LAUDOS_KEY_AQ = "empresa_laudos_aq_adolescente";

// ── UTILITÁRIOS ───────────────────────────────────────────────────────────────

function getLaudos()  { return JSON.parse(localStorage.getItem(LAUDOS_KEY_AQ) || "[]"); }
function setLaudos(a) { localStorage.setItem(LAUDOS_KEY_AQ, JSON.stringify(a)); }

function escHtml(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function formatarData(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function calcularIdade() {
  const nasc = document.getElementById("dataNascimento")?.value;
  const apli = document.getElementById("dataAplicacao")?.value;
  const el   = document.getElementById("idadeCalculada");
  if (!el) return null;
  if (!nasc || !apli) { el.textContent = ""; return null; }
  const n = new Date(nasc), a = new Date(apli);
  if (isNaN(n) || isNaN(a) || a < n) { el.textContent = ""; return null; }
  let anos = a.getFullYear() - n.getFullYear();
  let meses = a.getMonth() - n.getMonth();
  if (a.getDate() < n.getDate()) meses--;
  if (meses < 0) { anos--; meses += 12; }
  el.textContent = `Idade na avaliação: ${anos} anos e ${meses} meses`;
  return { anos, meses };
}

// ── CLASSIFICAÇÃO AQ ──────────────────────────────────────────────────────────

function getClassificacao(total) {
  if (total >= 30) return {
    label: "Rastreio Positivo",
    desc:  "Pontuação acima do ponto de corte clínico (≥ 30). Indicativo de presença significativa de traços do espectro autista. Avaliação diagnóstica complementar recomendada.",
    cor:   "#dc2626",
    bg:    "#fef2f2",
    nivel: 3
  };
  if (total >= 20) return {
    label: "Zona de Atenção",
    desc:  "Pontuação em zona intermediária (20–29). Presença de traços em nível moderado. Monitoramento clínico e acompanhamento indicados.",
    cor:   "#d97706",
    bg:    "#fffbeb",
    nivel: 2
  };
  return {
    label: "Dentro do Esperado",
    desc:  "Pontuação abaixo do limiar de atenção clínica (< 20). Nível de traços consistente com a população geral da faixa etária.",
    cor:   "#16a34a",
    bg:    "#f0fdf4",
    nivel: 1
  };
}

function getFacetaClassificacao(score) {
  if (score >= 7) return { label: "Elevada", cor: "#dc2626", bg: "#fef2f2" };
  if (score >= 5) return { label: "Moderada", cor: "#d97706", bg: "#fffbeb" };
  return { label: "Típica", cor: "#16a34a", bg: "#f0fdf4" };
}

// ── INTERPRETAÇÕES CLÍNICAS DAS FACETAS ──────────────────────────────────────

const INTERPRETACOES_FACETA = {
  "Habilidades Sociais": {
    0: "O adolescente demonstra repertório social dentro do esperado para a faixa etária, com facilidade em situações grupais e sociais.",
    1: "Habilidades sociais levemente reduzidas. Pode apresentar algum desconforto ou desinteresse em contextos sociais.",
    2: "Habilidades sociais moderadamente comprometidas. Tendência ao isolamento, dificuldade em fazer amizades e preferência por atividades solitárias.",
    3: "Habilidades sociais significativamente prejudicadas. Padrão consistente com dificuldades em Teoria da Mente e compreensão das regras implícitas de convivência social."
  },
  "Mudança de Atenção": {
    0: "Flexibilidade cognitiva e adaptabilidade dentro do esperado. Transições entre atividades sem rigidez aparente.",
    1: "Leve tendência à rigidez. Preferência por rotinas com alguma dificuldade em mudanças.",
    2: "Flexibilidade cognitiva moderadamente reduzida. Hiperfoco em atividades específicas com dificuldade de interrupção. Possível desconforto com mudanças na rotina.",
    3: "Rigidez cognitiva acentuada. Padrão fortemente restrito e repetitivo de comportamento, com intenso desconforto diante de imprevistos ou alterações na rotina."
  },
  "Atenção aos Detalhes": {
    0: "Processamento de informações voltado para o contexto geral, consistente com padrão típico.",
    1: "Atenção aos detalhes levemente aumentada, dentro da variação normal.",
    2: "Processamento orientado a detalhes de forma moderada. Tendência a notar estímulos irrelevantes ao contexto e dificuldade em priorizar informações salientes.",
    3: "Foco excessivo em detalhes. Estilo cognitivo de processamento bottom-up acentuado, com dificuldade em integrar informações para o contexto geral — padrão descrito como 'coerência central fraca'."
  },
  "Comunicação": {
    0: "Pragmática da linguagem dentro do esperado. Compreensão de turnos de fala e subentendidos preservados.",
    1: "Leves dificuldades pragmáticas, sem impacto funcional significativo.",
    2: "Dificuldades moderadas na comunicação pragmática. Tendência a monólogos, dificuldade em inferir intenções do interlocutor e em perceber pistas não-verbais.",
    3: "Comprometimento significativo da comunicação pragmática. Dificuldades expressivas no uso contextual da linguagem, compreensão de piadas, ironia e linguagem figurada."
  },
  "Imaginação": {
    0: "Capacidade imaginativa e criativa dentro do esperado. Facilidade em jogos simbólicos e empatia cognitiva.",
    1: "Imaginação levemente reduzida, sem comprometimento funcional aparente.",
    2: "Dificuldade moderada em perspectiva imaginativa. Tendência ao pensamento concreto e dificuldade em se colocar no lugar do outro.",
    3: "Comprometimento importante da imaginação social. Dificuldade acentuada em Teoria da Mente, empatia cognitiva e jogos de faz-de-conta — padrão compatível com rigidez do pensamento social."
  }
};

function getInterpretacaoFaceta(nome, score) {
  const nivel = score >= 7 ? 3 : score >= 5 ? 2 : score >= 3 ? 1 : 0;
  return INTERPRETACOES_FACETA[nome]?.[nivel] || "—";
}

// ── ATUALIZAR TOTAL (tempo real) ──────────────────────────────────────────────

function atualizarTotal() {
  const ids = ["f_social","f_atencao","f_detalhes","f_comunicacao","f_imaginacao"];
  let total = 0;
  ids.forEach(id => {
    const v = parseInt(document.getElementById(id)?.value || "0", 10);
    if (!isNaN(v) && v >= 0 && v <= 10) total += v;
  });
  const el = document.getElementById("totalAQ");
  if (el) el.textContent = total;

  const classEl = document.getElementById("classificacaoTotal");
  if (classEl) {
    const c = getClassificacao(total);
    classEl.style.color = c.cor;
    classEl.textContent = total > 0 ? `Classificação: ${c.label} — ${c.desc}` : "";
  }
}

// ── BUSCAR RESPOSTAS DO FIRESTORE ─────────────────────────────────────────────

async function buscarRespostasFirestore() {
  const cpf = document.getElementById("cpfBusca")?.value?.trim();
  if (!cpf) { alert("Informe o CPF do paciente."); return; }

  if (!window.firebase || !firebase.firestore) {
    alert("Firebase não disponível. Insira as pontuações manualmente.");
    return;
  }

  try {
    const db = firebase.firestore();
    const snap = await db.collection("aq_adolescente_respostas")
      .where("cpf", "==", cpf)
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (snap.empty) {
      alert("Nenhuma resposta encontrada para este CPF.\nVerifique se o paciente já preencheu o formulário online.");
      return;
    }

    const data = snap.docs[0].data();
    const facetas = typeof data.facetas === "string" ? JSON.parse(data.facetas) : data.facetas;

    // Preencher campos
    if (data.paciente) document.getElementById("nome").value = data.paciente;
    if (data.cpf) document.getElementById("cpf").value = data.cpf;
    if (data.dataNascimento) document.getElementById("dataNascimento").value = data.dataNascimento;
    if (data.dataAvaliacao) document.getElementById("dataAplicacao").value = data.dataAvaliacao;
    if (data.sexo) document.getElementById("sexo").value = data.sexo;
    if (data.escolaridade) document.getElementById("escolaridade").value = data.escolaridade;
    if (data.respondente) document.getElementById("respondente").value = data.respondente;

    if (facetas) {
      document.getElementById("f_social").value       = facetas["Habilidades Sociais"]  || 0;
      document.getElementById("f_atencao").value      = facetas["Mudança de Atenção"]   || 0;
      document.getElementById("f_detalhes").value     = facetas["Atenção aos Detalhes"] || 0;
      document.getElementById("f_comunicacao").value  = facetas["Comunicação"]          || 0;
      document.getElementById("f_imaginacao").value   = facetas["Imaginação"]           || 0;
    }

    atualizarTotal();
    calcularIdade();
    alert("✅ Respostas carregadas com sucesso!\nVerifique os dados e clique em 'Salvar e Gerar PDF'.");
  } catch(err) {
    alert("Erro ao buscar respostas: " + err.message);
  }
}

// ── CALCULAR E GERAR RELATÓRIO ────────────────────────────────────────────────

function calcular(salvar = false) {
  const profNome         = document.getElementById("profNome")?.value?.trim() || "";
  const profCRP          = document.getElementById("profCRP")?.value?.trim() || "";
  const profEspecialidade = document.getElementById("profEspecialidade")?.value?.trim() || "";
  const profContato      = document.getElementById("profContato")?.value?.trim() || "";
  const nome             = document.getElementById("nome")?.value?.trim() || "";
  const cpf              = document.getElementById("cpf")?.value?.trim() || "";
  const dataNasc         = document.getElementById("dataNascimento")?.value || "";
  const dataApli         = document.getElementById("dataAplicacao")?.value || "";
  const sexo             = document.getElementById("sexo")?.value || "";
  const escolaridade     = document.getElementById("escolaridade")?.value || "";
  const respondente      = document.getElementById("respondente")?.value?.trim() || "";
  const motivo           = document.getElementById("motivo")?.value?.trim() || "";
  const obs              = document.getElementById("obsComportamentais")?.value?.trim() || "";
  const recomendacoes    = document.getElementById("recomendacoes")?.value?.trim() || "";

  if (!nome) { alert("Informe o nome do adolescente."); return; }

  const sFacetas = {
    "Habilidades Sociais":  parseInt(document.getElementById("f_social")?.value || "0", 10),
    "Mudança de Atenção":   parseInt(document.getElementById("f_atencao")?.value || "0", 10),
    "Atenção aos Detalhes": parseInt(document.getElementById("f_detalhes")?.value || "0", 10),
    "Comunicação":          parseInt(document.getElementById("f_comunicacao")?.value || "0", 10),
    "Imaginação":           parseInt(document.getElementById("f_imaginacao")?.value || "0", 10),
  };

  const total = Object.values(sFacetas).reduce((s, v) => s + v, 0);
  const classTotal = getClassificacao(total);
  const idadeInfo = calcularIdade();

  const laudo = {
    profNome, profCRP, profEspecialidade, profContato,
    nome, cpf, dataNascimento: dataNasc, dataAplicacao: dataApli,
    sexo, escolaridade, respondente, motivo, obs, recomendacoes,
    facetas: sFacetas, total,
    timestamp: new Date().toISOString(),
  };

  if (salvar) {
    const laudos = getLaudos();
    laudos.push(laudo);
    setLaudos(laudos);
  }

  const html = gerarRelatorioHTML(laudo, idadeInfo, classTotal);
  const relDiv = document.getElementById("relatorio");
  if (relDiv) {
    relDiv.style.display = "block";
    relDiv.innerHTML = html;
    relDiv.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => renderChartAQ(sFacetas, total), 300);
  }

  if (salvar) {
    setTimeout(() => gerarPDF(nome, dataApli), 800);
  }
}

// ── GERAR HTML DO RELATÓRIO ───────────────────────────────────────────────────

function gerarRelatorioHTML(l, idadeInfo, classTotal) {
  const facetasCores = {
    "Habilidades Sociais":  "#0d9488",
    "Mudança de Atenção":   "#3b82f6",
    "Atenção aos Detalhes": "#f59e0b",
    "Comunicação":          "#8b5cf6",
    "Imaginação":           "#ec4899",
  };

  // Tabela de facetas
  const tabelaFacetas = Object.entries(l.facetas).map(([nome, score]) => {
    const c = getFacetaClassificacao(score);
    const barra = Math.round((score / 10) * 100);
    return `
      <tr>
        <td style="padding:12px 16px; vertical-align:middle;">
          <span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${facetasCores[nome]}; margin-right:8px; vertical-align:middle;"></span>
          <strong>${escHtml(nome)}</strong>
        </td>
        <td style="padding:12px 16px; vertical-align:middle; text-align:center;">
          <span style="font-size:22px; font-weight:800; color:${c.cor};">${score}</span>
          <span style="font-size:12px; color:#94a3b8;">/10</span>
        </td>
        <td style="padding:12px 16px; vertical-align:middle; width:140px;">
          <div style="background:#f1f5f9; border-radius:6px; height:8px; overflow:hidden;">
            <div style="height:100%; width:${barra}%; background:${facetasCores[nome]}; border-radius:6px; transition:width .5s;"></div>
          </div>
        </td>
        <td style="padding:12px 16px; vertical-align:middle;">
          <span style="background:${c.bg}; color:${c.cor}; border-radius:8px; padding:3px 12px; font-size:12px; font-weight:700;">${c.label}</span>
        </td>
        <td style="padding:12px 16px; vertical-align:middle; font-size:13px; color:#475569; line-height:1.55;">
          ${escHtml(getInterpretacaoFaceta(nome, score))}
        </td>
      </tr>`;
  }).join("");

  // Análise clínica por domínio
  const analiseTexto = gerarAnaliseClinica(l.facetas, l.total, classTotal, l.nome);

  const idadeStr = idadeInfo ? `${idadeInfo.anos} anos e ${idadeInfo.meses} meses` : "—";

  return `
    <div id="aq-report-content" style="font-family:'DM Sans',Arial,sans-serif; color:#1e293b; max-width:860px; margin:0 auto; padding:0;">

      <!-- CAPA / CABEÇALHO -->
      <div style="background:linear-gradient(135deg,#0d9488 0%,#0f766e 100%); color:#fff; border-radius:16px 16px 0 0; padding:36px 40px 28px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px;">
          <div>
            <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.12em; opacity:.75; margin-bottom:4px;">Equilibrium Neuropsicologia</div>
            <div style="font-size:24px; font-weight:800; letter-spacing:-.02em;">AQ — Quociente do Espectro Autista</div>
            <div style="font-size:14px; opacity:.8; margin-top:4px;">Versão Adolescente · Baron-Cohen et al. (2006)</div>
          </div>
          <div style="text-align:right; font-size:13px; opacity:.8; line-height:1.7;">
            Data: ${formatarData(l.dataAplicacao)}<br>
            Respondente: ${escHtml(l.respondente || "—")}
          </div>
        </div>
        <div style="background:rgba(255,255,255,.15); border-radius:12px; padding:18px 24px; display:flex; gap:32px; flex-wrap:wrap;">
          <div><div style="font-size:10px; text-transform:uppercase; letter-spacing:.07em; opacity:.7; margin-bottom:4px;">Nome</div><div style="font-weight:700; font-size:16px;">${escHtml(l.nome)}</div></div>
          <div><div style="font-size:10px; text-transform:uppercase; letter-spacing:.07em; opacity:.7; margin-bottom:4px;">Idade</div><div style="font-weight:700; font-size:16px;">${idadeStr}</div></div>
          <div><div style="font-size:10px; text-transform:uppercase; letter-spacing:.07em; opacity:.7; margin-bottom:4px;">Sexo</div><div style="font-weight:700; font-size:16px;">${escHtml(l.sexo || "—")}</div></div>
          <div><div style="font-size:10px; text-transform:uppercase; letter-spacing:.07em; opacity:.7; margin-bottom:4px;">Escolaridade</div><div style="font-weight:700; font-size:16px;">${escHtml(l.escolaridade || "—")}</div></div>
        </div>
      </div>

      <div style="background:#fff; border-radius:0 0 16px 16px; padding:32px 40px; box-shadow:0 4px 24px rgba(0,0,0,.08);">

        <!-- PONTUAÇÃO TOTAL -->
        <div style="display:flex; align-items:center; gap:24px; background:${classTotal.bg}; border:2px solid ${classTotal.cor}30; border-radius:14px; padding:22px 28px; margin-bottom:28px;">
          <div style="text-align:center; flex-shrink:0;">
            <div style="font-size:56px; font-weight:900; color:${classTotal.cor}; line-height:1;">${l.total}</div>
            <div style="font-size:12px; color:#94a3b8; font-weight:600; margin-top:2px;">/ 50 pontos</div>
          </div>
          <div>
            <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.1em; color:#94a3b8; margin-bottom:6px;">Pontuação Total AQ</div>
            <div style="font-size:22px; font-weight:800; color:${classTotal.cor};">${classTotal.label}</div>
            <div style="font-size:13px; color:#475569; margin-top:6px; line-height:1.5;">${classTotal.desc}</div>
            <div style="margin-top:10px; font-size:12px; color:#94a3b8; font-style:italic;">Ponto de corte clínico: ≥ 30 pontos (Baron-Cohen et al., 2006)</div>
          </div>
        </div>

        <!-- BARRA VISUAL DE CORTE -->
        <div style="margin-bottom:28px;">
          <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; margin-bottom:10px;">Posição na Escala (0–50)</div>
          <div style="position:relative; background:#f1f5f9; border-radius:10px; height:24px; overflow:visible;">
            <div style="height:100%; width:${Math.min(100, (l.total/50)*100)}%; background:${classTotal.cor}; border-radius:10px; transition:width .7s;"></div>
            <!-- Linha de corte em 30 -->
            <div style="position:absolute; left:60%; top:-6px; bottom:-6px; width:2px; background:#dc262680; border-radius:2px;"></div>
            <div style="position:absolute; left:60%; bottom:-20px; font-size:10px; color:#dc2626; font-weight:700; transform:translateX(-50%);">corte=30</div>
            <!-- Marcador de zona -->
            <div style="position:absolute; left:40%; top:-6px; bottom:-6px; width:2px; background:#d9770680; border-radius:2px;"></div>
            <div style="position:absolute; left:40%; bottom:-20px; font-size:10px; color:#d97706; font-weight:700; transform:translateX(-50%);">atenção=20</div>
          </div>
          <div style="height:28px;"></div>
        </div>

        <!-- SEÇÃO: GRÁFICO + TABELA -->
        <div style="font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:#64748b; margin-bottom:16px; padding-bottom:8px; border-bottom:2px solid #f1f5f9;">
          📊 Perfil por Facetas
        </div>

        <!-- Canvas do gráfico -->
        <div style="background:#fafcff; border-radius:12px; padding:20px; margin-bottom:24px;">
          <canvas id="aqChart" height="120"></canvas>
        </div>

        <!-- Tabela de facetas -->
        <div style="overflow-x:auto; margin-bottom:28px;">
          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:12px 16px; text-align:left; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.07em; color:#94a3b8;">Faceta</th>
                <th style="padding:12px 16px; text-align:center; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.07em; color:#94a3b8;">Pontuação</th>
                <th style="padding:12px 16px; text-align:left; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.07em; color:#94a3b8;">Perfil</th>
                <th style="padding:12px 16px; text-align:left; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.07em; color:#94a3b8;">Nível</th>
                <th style="padding:12px 16px; text-align:left; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.07em; color:#94a3b8;">Interpretação Clínica</th>
              </tr>
            </thead>
            <tbody>${tabelaFacetas}</tbody>
          </table>
        </div>

        <!-- Análise clínica qualitativa -->
        <div style="font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:#64748b; margin-bottom:16px; padding-bottom:8px; border-bottom:2px solid #f1f5f9;">
          🔬 Análise Clínica Qualitativa
        </div>
        <div style="background:#fafcff; border-radius:12px; padding:20px 24px; margin-bottom:28px; line-height:1.75; font-size:14px; color:#334155;">
          ${analiseTexto}
        </div>

        ${l.motivo ? `
        <!-- Motivo do encaminhamento -->
        <div style="font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:#64748b; margin-bottom:12px; padding-bottom:8px; border-bottom:2px solid #f1f5f9;">
          📋 Demanda e Procedimento
        </div>
        <div style="margin-bottom:24px; font-size:14px; color:#334155; line-height:1.7;">
          <strong>Motivo do encaminhamento:</strong> ${escHtml(l.motivo)}<br><br>
          <strong>Instrumento utilizado:</strong> Autism-Spectrum Quotient (AQ) — Versão Adolescente (Baron-Cohen et al., 2006), composto por 50 itens distribuídos em cinco facetas: Habilidades Sociais, Mudança de Atenção, Atenção aos Detalhes, Comunicação e Imaginação. Respondido por: ${escHtml(l.respondente || "—")}.
        </div>` : ""}

        ${l.obs ? `
        <!-- Observações comportamentais -->
        <div style="font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:#64748b; margin-bottom:12px; padding-bottom:8px; border-bottom:2px solid #f1f5f9;">
          👁 Observações Comportamentais
        </div>
        <div style="background:#f8fafc; border-radius:12px; padding:18px 22px; margin-bottom:28px; font-size:14px; color:#334155; line-height:1.7;">
          ${escHtml(l.obs)}
        </div>` : ""}

        ${l.recomendacoes ? `
        <!-- Recomendações -->
        <div style="font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:#64748b; margin-bottom:12px; padding-bottom:8px; border-bottom:2px solid #f1f5f9;">
          💡 Conclusão e Recomendações
        </div>
        <div style="background:#f0fdfa; border:1.5px solid #99f6e4; border-radius:12px; padding:18px 22px; margin-bottom:28px; font-size:14px; color:#134e4a; line-height:1.7;">
          ${escHtml(l.recomendacoes)}
        </div>` : ""}

        <!-- Aviso ético obrigatório -->
        <div style="background:#fff7ed; border:1.5px solid #fbbf24; border-radius:12px; padding:16px 20px; margin-bottom:32px;">
          <div style="font-size:12px; font-weight:700; color:#92400e; margin-bottom:6px;">⚠️ AVISO IMPORTANTE</div>
          <div style="font-size:12px; color:#78350f; line-height:1.65;">
            O AQ é um instrumento de <strong>rastreio</strong> e não constitui, por si só, diagnóstico clínico. Os resultados devem ser interpretados no contexto de uma avaliação neuropsicológica abrangente, incluindo entrevista clínica, observação comportamental e outros instrumentos validados. O diagnóstico de Transtorno do Espectro Autista (CID-11: 6A02 / DSM-5: 299.00) requer avaliação multiprofissional.
          </div>
        </div>

        <!-- Assinatura -->
        ${l.profNome ? `
        <div style="border-top:1.5px solid #e2e8f0; padding-top:24px; text-align:center;">
          <div style="display:inline-block; border-top:2px solid #1e293b; padding-top:12px; min-width:220px; text-align:center;">
            <div style="font-weight:700; font-size:15px;">${escHtml(l.profNome)}</div>
            <div style="font-size:13px; color:#64748b;">${escHtml(l.profCRP || "")}</div>
            <div style="font-size:13px; color:#64748b;">${escHtml(l.profEspecialidade || "")}</div>
            ${l.profContato ? `<div style="font-size:12px; color:#94a3b8;">${escHtml(l.profContato)}</div>` : ""}
          </div>
          <div style="margin-top:16px; font-size:12px; color:#94a3b8;">
            ${formatarData(l.dataAplicacao)}
          </div>
        </div>` : ""}

      </div><!-- /body card -->

      <!-- Botões de ação (no-print) -->
      <div class="no-print" style="display:flex; gap:12px; margin-top:24px; justify-content:flex-end;">
        <button onclick="window.print()" class="btn-secondary">🖨 Imprimir</button>
        <button onclick="gerarPDF('${escHtml(l.nome)}','${l.dataAplicacao}')" class="btn-primary">📄 Exportar PDF</button>
      </div>
    </div>`;
}

// ── ANÁLISE CLÍNICA QUALITATIVA AUTOMÁTICA ────────────────────────────────────

function gerarAnaliseClinica(facetas, total, classTotal, nome) {
  const fs   = facetas["Habilidades Sociais"]  || 0;
  const fa   = facetas["Mudança de Atenção"]   || 0;
  const fd   = facetas["Atenção aos Detalhes"] || 0;
  const fc   = facetas["Comunicação"]          || 0;
  const fi   = facetas["Imaginação"]           || 0;

  const nPrimeiro = nome.split(" ")[0] || "O adolescente";

  // Identifica facetas elevadas (≥7), moderadas (≥5), e a maior
  const elevadas  = Object.entries(facetas).filter(([,v]) => v >= 7).map(([k]) => k);
  const moderadas = Object.entries(facetas).filter(([,v]) => v >= 5 && v < 7).map(([k]) => k);
  const sorted    = Object.entries(facetas).sort((a,b) => b[1]-a[1]);
  const maiorFaceta = sorted[0]?.[0];
  const menorFaceta = sorted[sorted.length-1]?.[0];

  let texto = `<p><strong>${escHtml(nPrimeiro)}</strong> obteve pontuação total de <strong>${total} pontos</strong> no AQ-Adolescente, `;

  if (classTotal.nivel === 3) {
    texto += `resultado <strong style="color:#dc2626">acima do ponto de corte clínico estabelecido de 30 pontos</strong>, indicando rastreio positivo para traços do espectro autista em nível clinicamente significativo.</p>`;
  } else if (classTotal.nivel === 2) {
    texto += `resultado na <strong style="color:#d97706">zona intermediária de atenção (20–29 pontos)</strong>, sugerindo presença de traços do espectro autista em nível moderado que justifica acompanhamento clínico sistemático.</p>`;
  } else {
    texto += `resultado <strong style="color:#16a34a">abaixo do limiar de atenção clínica</strong>, consistente com o padrão de desenvolvimento típico para a faixa etária.</p>`;
  }

  if (elevadas.length > 0) {
    texto += `<p>As facetas <strong>${elevadas.map(escHtml).join(", ")}</strong> apresentaram pontuações elevadas (≥ 7/10), indicando áreas de comprometimento relevante. `;
  }

  // Análise por faceta relevante
  if (fs >= 5) {
    texto += `Em <strong>Habilidades Sociais</strong> (${fs}/10), os dados sugerem dificuldades no repertório de interação social, com menor orientação para o outro e possível prejuízo na compreensão das regras implícitas de convivência — padrão consistente com déficits em Teoria da Mente. `;
  }
  if (fa >= 5) {
    texto += `A faceta <strong>Mudança de Atenção</strong> (${fa}/10) indica tendência à rigidez cognitiva e comportamental, com dificuldade em transições entre atividades e forte apego a rotinas e padrões. `;
  }
  if (fd >= 5) {
    texto += `Em <strong>Atenção aos Detalhes</strong> (${fd}/10), observa-se estilo cognitivo orientado para processamento focal e detalhista, com possível comprometimento da integração contextual das informações (coerência central fraca). `;
  }
  if (fc >= 5) {
    texto += `A faceta <strong>Comunicação</strong> (${fc}/10) revela dificuldades na pragmática da linguagem, incluindo compreensão de subentendidos, gestão de turnos de fala e uso contextual da comunicação verbal. `;
  }
  if (fi >= 5) {
    texto += `Em <strong>Imaginação</strong> (${fi}/10), os resultados apontam para dificuldades no pensamento simbólico, empatia cognitiva e na capacidade de representar estados mentais alheios. `;
  }

  if (elevadas.length === 0 && moderadas.length === 0 && total < 20) {
    texto += `<p>O perfil por facetas apresenta-se dentro do esperado para a faixa etária, sem concentração de pontuação em domínios específicos que indique necessidade de investigação aprofundada com base nos critérios deste instrumento.</p>`;
  }

  texto += `</p><p style="font-size:13px; color:#64748b; font-style:italic; margin-top:8px;">Os resultados ora apresentados devem ser interpretados como dados de rastreio, integrando-se ao contexto clínico global do adolescente, incluindo história do desenvolvimento, observação comportamental e demais instrumentos da bateria neuropsicológica.</p>`;

  return texto;
}

// ── RENDER CHART ──────────────────────────────────────────────────────────────

function renderChartAQ(facetas, total) {
  const canvas = document.getElementById("aqChart");
  if (!canvas || typeof Chart === "undefined") return;

  // Destruir chart anterior se existir
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const labels = Object.keys(facetas).map(k => k.replace("Atenção aos", "At. aos"));
  const data   = Object.values(facetas);
  const colors = ["#0d9488","#3b82f6","#f59e0b","#8b5cf6","#ec4899"];

  new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Pontuação por Faceta",
        data,
        backgroundColor: colors.map(c => c + "cc"),
        borderColor:     colors,
        borderWidth: 2,
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.raw}/10 pts — ${getFacetaClassificacao(ctx.raw).label}`
          }
        },
        // Linha de corte por faceta (6 pts = alerta)
        annotation: undefined,
      },
      scales: {
        y: {
          min: 0, max: 10,
          ticks: { stepSize: 2 },
          grid: { color: "#f1f5f9" },
          title: { display: true, text: "Pontuação (0–10)", font: { size: 12 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 12, weight: "600" } }
        }
      }
    },
    plugins: [{
      // Desenha linha de alerta em y=6
      id: "alertLine",
      afterDraw(chart) {
        const { ctx, chartArea: { left, right }, scales: { y } } = chart;
        const yPos = y.getPixelForValue(6);
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = "#dc2626aa";
        ctx.lineWidth = 1.5;
        ctx.moveTo(left, yPos);
        ctx.lineTo(right, yPos);
        ctx.stroke();
        ctx.fillStyle = "#dc2626";
        ctx.font = "11px DM Sans, sans-serif";
        ctx.fillText("alerta ≥ 6", right - 70, yPos - 6);
        ctx.restore();
      }
    }]
  });
}

// ── GERAR PDF ─────────────────────────────────────────────────────────────────

function gerarPDF(nome, data) {
  const el = document.getElementById("aq-report-content");
  if (!el) { alert("Relatório não encontrado. Clique em 'Calcular' primeiro."); return; }

  const nomeArquivo = `AQ_Adolescente_${(nome || "paciente").replace(/\s+/g,"_")}_${(data || "").replace(/-/g,"")}.pdf`;

  const opt = {
    margin:      [10, 10, 10, 10],
    filename:    nomeArquivo,
    image:       { type: "jpeg", quality: 0.97 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF:       { unit: "mm", format: "a4", orientation: "portrait" },
  };

  html2pdf().set(opt).from(el).save();
}

// Expõe globais necessários
window.calcular            = calcular;
window.atualizarTotal      = atualizarTotal;
window.calcularIdade       = calcularIdade;
window.gerarPDF            = gerarPDF;
window.getLaudos           = getLaudos;
window.setLaudos           = setLaudos;
window.getClassificacao    = getClassificacao;
window.buscarRespostasFirestore = buscarRespostasFirestore;
