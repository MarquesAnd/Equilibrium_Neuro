// === APLICAÇÃO: Aplicacao_testes/EQ15/eq15-shared.js ===
/**
 * EQ-15 SHARED SCRIPT — Equilibrium
 * Quociente de Empatia — Versão Reduzida Brasileira
 * Gouveia et al. (2012)
 *
 * Variáveis a definir em cada página ANTES deste script:
 *   URL_DO_GOOGLE_SCRIPT : URL do Apps Script para envio ao Drive
 */

let EQ15_RULES = null;
const $ = (sel) => document.querySelector(sel);

if (typeof DATA_PATH === "undefined") {
  window.DATA_PATH = "./data/eq15_rules.json";
}

// ─── INICIALIZAÇÃO ────────────────────────────────────────────────────────────
async function carregarRegras() {
  let res;
  try {
    res = await fetch(DATA_PATH, { cache: "no-store" });
  } catch (e) {
    throw new Error("Falha de rede ao carregar regras: " + DATA_PATH + "\n" + e.message);
  }
  if (!res.ok) throw new Error("Arquivo não encontrado (" + res.status + "): " + DATA_PATH);
  try {
    EQ15_RULES = await res.json();
  } catch (e) {
    throw new Error("JSON inválido em: " + DATA_PATH);
  }
}

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function setSubtitle(msg) {
  const el = $("#subtitle");
  if (el) el.textContent = msg;
}

function getClassification(total) {
  for (const c of EQ15_RULES.classification) {
    if (total >= c.min && total <= c.max) return c;
  }
  return { label: "—", cls: "", color: "#94a3b8" };
}

// ─── RENDERIZAR ITENS ─────────────────────────────────────────────────────────
function renderItens() {
  const container = $("#itens");
  if (!container || !EQ15_RULES) return;
  container.innerHTML = "";

  const labels = EQ15_RULES.answer_labels;

  for (const item of EQ15_RULES.items) {
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.itemId = item.id;

    const reverseTag = item.reverse
      ? `<span class="tag tag-reverso">⇄ reverso</span>`
      : `<span class="tag tag-normal">direto</span>`;

    div.innerHTML = `
      <div class="top">
        <div class="qid">${escapeHtml(item.id)}</div>
        <div class="txt">${escapeHtml(item.text)}</div>
        ${reverseTag}
      </div>
      <div class="opts">
        ${[1, 2, 3, 4].map(v => `
          <label class="opt">
            <input type="radio" name="i${item.id}" value="${v}" />
            <span>${v} — ${escapeHtml(labels[v] || "")}</span>
          </label>
        `).join("")}
      </div>
    `;

    div.addEventListener("change", (e) => {
      div.classList.add("respondido");
      div.querySelectorAll(".opt").forEach(o => o.classList.remove("selecionada"));
      e.target.closest(".opt")?.classList.add("selecionada");
      atualizarProgresso();
    });

    container.appendChild(div);
  }
}

// ─── PROGRESSO ────────────────────────────────────────────────────────────────
function atualizarProgresso() {
  if (!EQ15_RULES) return;
  let answered = 0;
  for (const item of EQ15_RULES.items) {
    if (document.querySelector(`input[name="i${item.id}"]:checked`)) answered++;
  }
  const total = EQ15_RULES.items.length;
  const pct = Math.round((answered / total) * 100);

  const pillEl = $("#pillAnswered");
  if (pillEl) pillEl.textContent = `${answered}/${total}`;

  const pFill = document.getElementById("patientProgressFill");
  if (pFill) pFill.style.width = pct + "%";

  const fAns = document.getElementById("footerAnswered");
  if (fAns) fAns.textContent = answered;

  const fTot = document.getElementById("footerTotal");
  if (fTot) fTot.textContent = total;
}

// ─── CÁLCULO ──────────────────────────────────────────────────────────────────
function coletarRespostas() {
  const map = {};
  let missing = 0;
  for (const item of EQ15_RULES.items) {
    const el = document.querySelector(`input[name="i${item.id}"]:checked`);
    if (!el) { missing++; continue; }
    map[item.id] = parseInt(el.value, 10);
  }
  return { respostas: map, missing };
}

function calcularFatores(respostas) {
  const result = {};
  for (const fator of EQ15_RULES.factors) {
    let soma = 0;
    for (const itemId of fator.items) {
      const item = EQ15_RULES.items.find(i => i.id === itemId);
      const r = respostas[itemId];
      if (r == null) continue;
      const pts = item.reverse ? (5 - r) : r;
      soma += pts;
    }
    result[fator.key] = soma;
  }
  return result;
}

// ─── RELATÓRIO HTML (profissional, self-contained) ────────────────────────────
function gerarRelatorioHTML(paciente, data, fatores, total) {
  const cls = getClassification(total);
  const dataFmt = data ? new Date(data + "T12:00:00").toLocaleDateString("pt-BR") : "---";

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

  // Total bar
  const totalPct = Math.round((total / EQ15_RULES.max_total) * 100);
  const cutPct = Math.round((EQ15_RULES.clinical_cutoff / EQ15_RULES.max_total) * 100);

  // SVG bar chart
  const factorColors = ["#7c3aed", "#3b82f6", "#10b981"];
  const barW = 120, barGap = 30, chartH = 160, padTop = 30, padBot = 50;
  const numFactors = EQ15_RULES.factors.length;
  const svgW = numFactors * (barW + barGap) + barGap + 50;
  const svgH = chartH + padTop + padBot;
  const maxVal = 20;

  const gridLines = [0, 5, 10, 15, 20].map(v => {
    const y = padTop + chartH - (v / maxVal) * chartH;
    return `
      <line x1="30" y1="${y}" x2="${svgW - 10}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>
      <text x="26" y="${y + 4}" text-anchor="end" font-size="10" fill="#94a3b8">${v}</text>
    `;
  }).join("");

  const svgBars = EQ15_RULES.factors.map((f, i) => {
    const val = fatores[f.key] || 0;
    const bH = (val / maxVal) * chartH;
    const x = barGap + i * (barW + barGap) + 30;
    const y = padTop + chartH - bH;
    const color = factorColors[i % factorColors.length];

    // Reference line
    const refH = (f.ref_mean / maxVal) * chartH;
    const refY = padTop + chartH - refH;

    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${bH}" rx="6" fill="${color}" opacity="0.85"/>
      <text x="${x + barW/2}" y="${y - 8}" text-anchor="middle" font-size="14" font-weight="800" fill="${color}">${val}</text>
      <line x1="${x - 6}" y1="${refY}" x2="${x + barW + 6}" y2="${refY}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5,3"/>
      <text x="${x + barW/2}" y="${padTop + chartH + 18}" text-anchor="middle" font-size="11" fill="#64748b" font-weight="600">${escapeHtml(f.label)}</text>
      <text x="${x + barW/2}" y="${padTop + chartH + 32}" text-anchor="middle" font-size="9" fill="#94a3b8">(ref: ${f.ref_mean})</text>
    `;
  }).join("");

  // Factor table rows
  const factorTableRows = EQ15_RULES.factors.map((f, i) => {
    const val = fatores[f.key] || 0;
    const pct = Math.round(((val - f.min) / (f.max - f.min)) * 100);
    const refPct = Math.round(((f.ref_mean - f.min) / (f.max - f.min)) * 100);
    const color = factorColors[i % factorColors.length];
    return `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 14px;font-weight:600;color:#1e293b;">${escapeHtml(f.label)}</td>
        <td style="padding:10px 14px;text-align:center;color:#64748b;font-size:12px;">${f.items.join(", ")}</td>
        <td style="padding:10px 14px;text-align:center;font-weight:800;font-size:15px;color:${color};">${val}</td>
        <td style="padding:10px 14px;text-align:center;color:#94a3b8;">${f.max}</td>
        <td style="padding:10px 14px;text-align:center;color:#f59e0b;font-weight:700;">${f.ref_mean}</td>
        <td style="padding:10px 14px;width:140px;">
          <div style="height:8px;background:#e2e8f0;border-radius:4px;position:relative;overflow:visible;">
            <div style="height:100%;width:${pct}%;background:${color};border-radius:4px;"></div>
            <div style="position:absolute;top:-3px;bottom:-3px;left:${refPct}%;width:2px;background:#f59e0b;border-radius:2px;"></div>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  // Item detail rows
  const itemRows = EQ15_RULES.items.map(item => {
    const r = document.querySelector(`input[name="i${item.id}"]:checked`)?.value || "---";
    const pts = (r !== "---" && item.reverse) ? (5 - parseInt(r)) : r;
    const fator = EQ15_RULES.factors.find(f => f.items.includes(item.id));
    return `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:6px 10px;width:32px;font-weight:700;color:#7c3aed;text-align:center;">${item.id}</td>
        <td style="padding:6px 10px;font-size:11.5px;color:#374151;line-height:1.4;">${escapeHtml(item.text.substring(0, 85))}${item.text.length > 85 ? "..." : ""}</td>
        <td style="padding:6px 10px;width:55px;text-align:center;font-size:12px;color:#64748b;">${escapeHtml(String(r))}</td>
        <td style="padding:6px 10px;width:55px;text-align:center;font-size:12px;font-weight:600;">${escapeHtml(String(pts))}${item.reverse ? " R" : ""}</td>
        <td style="padding:6px 10px;width:120px;font-size:11px;color:#64748b;">${escapeHtml(fator?.label || "---")}</td>
      </tr>
    `;
  }).join("");

  const refTotal = EQ15_RULES.factors.reduce((s, f) => s + f.ref_mean, 0);

  return `
  <div style="font-family:'DM Sans',Arial,sans-serif;color:#1e293b;max-width:760px;margin:0 auto;padding:32px 40px;background:#fff;">

    <!-- ===== HEADER ===== -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2.5px solid #7c3aed;margin-bottom:28px;">
      <div style="display:flex;align-items:center;gap:14px;">
        <img src="/logo.png" alt="Equilibrium" style="height:44px;" onerror="this.style.display='none'" />
        <div>
          <div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7c3aed;">Equilibrium Neuropsicologia</div>
          <div style="font-size:20px;font-weight:800;color:#1e293b;margin-top:2px;">EQ-15 -- Quociente de Empatia</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">Versao Reduzida Brasileira -- Gouveia et al. (2012)</div>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:12px;color:#64748b;">Data da Avaliacao</div>
        <div style="font-size:14px;font-weight:700;color:#1e293b;">${escapeHtml(dataFmt)}</div>
        <div style="font-size:10px;color:#94a3b8;margin-top:4px;">Gerado em ${new Date().toLocaleDateString("pt-BR")}</div>
      </div>
    </div>

    <!-- ===== PATIENT INFO ===== -->
    <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:18px 22px;margin-bottom:24px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:10px;">Identificacao do Paciente</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
        <div>
          <div style="font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Nome</div>
          <div style="font-size:14px;font-weight:700;color:#1e293b;margin-top:2px;">${escapeHtml(paciente || "Nao informado")}</div>
        </div>
        <div>
          <div style="font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">CPF</div>
          <div style="font-size:14px;color:#1e293b;margin-top:2px;">${escapeHtml(cpf || "---")}</div>
        </div>
        <div>
          <div style="font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Data Nasc. / Idade</div>
          <div style="font-size:14px;color:#1e293b;margin-top:2px;">${escapeHtml(dataNascFmt)} (${escapeHtml(idadeStr)})</div>
        </div>
      </div>
      ${respondente ? `<div style="margin-top:10px;"><div style="font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Respondente</div><div style="font-size:13px;color:#1e293b;margin-top:2px;">${escapeHtml(respondente)}</div></div>` : ""}
    </div>

    <!-- ===== TOTAL SCORE ===== -->
    <div style="background:linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%);border-radius:16px;padding:26px 30px;margin-bottom:24px;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:20px;">
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.8;">Pontuacao Total</div>
        <div style="font-size:52px;font-weight:800;line-height:1;">${total}</div>
        <div style="font-size:13px;opacity:.7;margin-top:2px;">de ${EQ15_RULES.max_total} pontos</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;opacity:.7;margin-bottom:8px;">Classificacao</div>
        <div style="background:${cls.color};border-radius:12px;padding:12px 24px;">
          <div style="font-size:20px;font-weight:800;">${escapeHtml(cls.label)}</div>
        </div>
      </div>
    </div>

    <!-- ===== TOTAL SCALE BAR ===== -->
    <div style="margin-bottom:28px;">
      <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;">Posicao na Escala Total</div>
      <div style="height:22px;background:#e2e8f0;border-radius:11px;position:relative;overflow:visible;">
        <div style="height:100%;width:${totalPct}%;background:${cls.color};border-radius:11px;"></div>
        <div style="position:absolute;top:-6px;bottom:-6px;left:${cutPct}%;width:2.5px;background:#dc2626;border-radius:2px;" title="Corte clinico (${EQ15_RULES.clinical_cutoff})"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;margin-top:4px;">
        <span>0</span>
        <span style="color:#dc2626;font-weight:700;">| corte clinico (${EQ15_RULES.clinical_cutoff})</span>
        <span>${EQ15_RULES.max_total}</span>
      </div>
    </div>

    <!-- ===== SVG BAR CHART ===== -->
    <div style="margin-bottom:28px;">
      <div style="font-size:12px;font-weight:800;color:#1e293b;text-transform:uppercase;letter-spacing:.07em;margin-bottom:14px;">Perfil por Fator</div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;overflow-x:auto;">
        <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="display:block;margin:0 auto;">
          ${gridLines}
          ${svgBars}
        </svg>
        <div style="text-align:center;font-size:10px;color:#94a3b8;margin-top:8px;">Linha tracejada amarela = media normativa (Gouveia et al., 2012)</div>
      </div>
    </div>

    <!-- ===== FACTOR TABLE ===== -->
    <div style="margin-bottom:28px;">
      <div style="font-size:12px;font-weight:800;color:#1e293b;text-transform:uppercase;letter-spacing:.07em;margin-bottom:12px;">Pontuacao por Fator</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <thead>
          <tr style="background:#ede9fe;">
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:800;color:#5b21b6;text-transform:uppercase;">Fator</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:800;color:#5b21b6;text-transform:uppercase;">Itens</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:800;color:#5b21b6;text-transform:uppercase;">Pontos</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:800;color:#5b21b6;text-transform:uppercase;">Max.</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:800;color:#5b21b6;text-transform:uppercase;">Ref.</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:800;color:#5b21b6;text-transform:uppercase;">Grafico</th>
          </tr>
        </thead>
        <tbody>
          ${factorTableRows}
          <tr style="background:#f8fafc;font-weight:800;border-top:2px solid #e2e8f0;">
            <td style="padding:12px 14px;">TOTAL</td>
            <td style="padding:12px 14px;text-align:center;color:#64748b;">1-15</td>
            <td style="padding:12px 14px;text-align:center;font-size:17px;color:#7c3aed;">${total}</td>
            <td style="padding:12px 14px;text-align:center;color:#94a3b8;">${EQ15_RULES.max_total}</td>
            <td style="padding:12px 14px;text-align:center;color:#f59e0b;">${refTotal.toFixed(1)}</td>
            <td style="padding:12px 14px;">
              <div style="height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden;">
                <div style="height:100%;width:${totalPct}%;background:#7c3aed;border-radius:4px;"></div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ===== ITEM DETAIL ===== -->
    <div style="margin-bottom:28px;">
      <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;">Detalhamento por Item</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:7px 10px;text-align:center;color:#64748b;border-bottom:1.5px solid #e2e8f0;font-size:10px;text-transform:uppercase;">N</th>
            <th style="padding:7px 10px;text-align:left;color:#64748b;border-bottom:1.5px solid #e2e8f0;font-size:10px;text-transform:uppercase;">Item</th>
            <th style="padding:7px 10px;text-align:center;color:#64748b;border-bottom:1.5px solid #e2e8f0;font-size:10px;text-transform:uppercase;">Resp.</th>
            <th style="padding:7px 10px;text-align:center;color:#64748b;border-bottom:1.5px solid #e2e8f0;font-size:10px;text-transform:uppercase;">Pts.</th>
            <th style="padding:7px 10px;text-align:left;color:#64748b;border-bottom:1.5px solid #e2e8f0;font-size:10px;text-transform:uppercase;">Fator</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    <!-- ===== CLINICAL INTERPRETATION ===== -->
    <div style="background:#f8fafc;border-radius:12px;padding:18px 22px;margin-bottom:24px;border-left:4px solid #7c3aed;">
      <div style="font-size:12px;font-weight:800;color:#5b21b6;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Interpretacao Clinica</div>
      <div style="font-size:12.5px;color:#475569;line-height:1.65;">
        <p style="margin:0 0 8px;">O <strong>EQ-15 (Quociente de Empatia - Versao Reduzida)</strong> e um instrumento de autorrelato com 15 itens que avalia tres dimensoes da empatia: Empatia Cognitiva, Habilidades Sociais e Reatividade Emocional.</p>
        <p style="margin:0 0 8px;">A pontuacao total obtida foi de <strong>${total} pontos</strong> (de ${EQ15_RULES.max_total} possiveis), classificada como <strong style="color:${cls.color};">${cls.label}</strong>. ${total <= EQ15_RULES.clinical_cutoff ? 'Este resultado encontra-se abaixo ou no ponto de corte clinico (' + EQ15_RULES.clinical_cutoff + '), sugerindo niveis reduzidos de empatia que podem justificar uma avaliacao mais aprofundada.' : total <= 39 ? 'Este resultado encontra-se na faixa media, indicando niveis tipicos de empatia.' : 'Este resultado indica niveis adequados a elevados de empatia.'}</p>
        <p style="margin:0;"><strong>Nota:</strong> O EQ-15 e um instrumento de rastreio e nao substitui o diagnostico clinico. Os resultados devem ser interpretados no contexto de uma avaliacao neuropsicologica abrangente. Referencia normativa: Gouveia, V.V. et al. (2012).</p>
      </div>
    </div>

    <!-- ===== FOOTER ===== -->
    <div style="border-top:1.5px solid #e2e8f0;padding-top:16px;display:flex;justify-content:space-between;align-items:flex-end;font-size:10px;color:#94a3b8;">
      <div>
        <div style="font-weight:700;color:#64748b;">Equilibrium Neuropsicologia</div>
        <div>Correcao automatizada EQ-15</div>
      </div>
      <div style="text-align:right;max-width:380px;line-height:1.5;">
        Gouveia, V.V. et al. (2012). Quociente de Empatia -- Versao Reduzida Brasileira. <em>Gerado em ${new Date().toLocaleDateString("pt-BR")}</em>
      </div>
    </div>

  </div>`;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  try {
    setSubtitle("Carregando…");
    await carregarRegras();
    setSubtitle("EQ-15 · Quociente de Empatia");

    const today = new Date().toISOString().slice(0, 10);
    const dataEl = $("#data");
    if (dataEl) dataEl.value = today;

    renderItens();
    atualizarProgresso();

    $("#btnEnviar")?.addEventListener("click", () => finalizarEEnviar());

  } catch (err) {
    console.error(err);
    setSubtitle("Falha ao carregar regras.");
    const container = $("#itens");
    if (container) container.innerHTML = `
      <div style="color:#dc2626;padding:16px;background:#fee2e2;border-radius:10px;">
        Erro: ${escapeHtml(err.message || String(err))}<br><br>
        Verifique se o arquivo existe em: <b>./data/eq15_rules.json</b>
      </div>`;
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// MODO PACIENTE — Envio ao Google Drive
// ══════════════════════════════════════════════════════════════════════════════

async function finalizarEEnviar() {

  // 1. Coletar e validar
  const { respostas, missing } = coletarRespostas();
  if (missing > 0) {
    alert(`Por favor, responda todos os itens.\n\nFaltam ${missing} resposta(s).`);
    return;
  }

  // 2. Calcular
  const fatores = calcularFatores(respostas);
  const total = Object.values(fatores).reduce((s, v) => s + v, 0);

  // 3. Gerar HTML do relatório
  const paciente = document.getElementById("paciente")?.value?.trim() || "Paciente";
  const data = document.getElementById("data")?.value || "";
  const repHTML = gerarRelatorioHTML(paciente, data, fatores, total);

  // 3b. Salvar no Firebase via Integration
  if (window.Integration && typeof Integration.salvarTesteNoFirebase === "function") {
    try {
      const cls = getClassification(total);
      const scoresObj = {};
      for (const f of EQ15_RULES.factors) {
        scoresObj[f.label] = { bruto: fatores[f.key], maximo: f.max, referencia: f.ref_mean };
      }
      scoresObj["Total"] = { bruto: total, maximo: EQ15_RULES.max_total };

      await Integration.salvarTesteNoFirebase("eq15", {
        dataAplicacao: new Date().toISOString(),
        resumo: "EQ-15 - Total: " + total + "/" + EQ15_RULES.max_total + " (" + cls.label + ") | " +
                EQ15_RULES.factors.map(f => f.label + ": " + fatores[f.key]).join(", "),
        scores: scoresObj,
        classificacao: cls.label,
        htmlRelatorio: repHTML,
        observacoes: ""
      });
      console.log("EQ-15 salvo no Firebase com sucesso.");
    } catch (fbErr) {
      console.warn("Erro ao salvar EQ-15 no Firebase (continuando envio):", fbErr);
    }
  } else {
    console.info("Integration nao disponivel - Firebase save ignorado.");
  }

  // 4. Contentor de renderização (fora do viewport)
  const captureWrap = document.createElement("div");
  captureWrap.id = "__eq15_capture__";
  captureWrap.style.cssText = [
    "position:absolute", "top:0", "left:-9999px",
    "width:760px", "background:#fff",
    "font-family:'DM Sans',Arial,sans-serif",
    "z-index:0", "pointer-events:none"
  ].join(";");
  captureWrap.innerHTML = repHTML;
  document.body.appendChild(captureWrap);

  await new Promise(r => requestAnimationFrame(() => setTimeout(r, 100)));
  const captureHeight = captureWrap.scrollHeight;

  // 5. Cortina de processamento
  const btnEnviar = document.getElementById("btnEnviar");
  if (btnEnviar) { btnEnviar.disabled = true; btnEnviar.textContent = "A processar…"; }

  const cortina = document.createElement("div");
  cortina.style.cssText = [
    "position:fixed", "inset:0", "background:#2d1b69",
    "z-index:999999", "display:flex", "align-items:center", "justify-content:center"
  ].join(";");
  cortina.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:40px 48px;text-align:center;
                box-shadow:0 24px 60px rgba(0,0,0,.35);max-width:340px;width:90%;">
      <div style="width:52px;height:52px;border:5px solid #ede9fe;border-top-color:#7c3aed;
                  border-radius:50%;animation:__eq15spin__ 0.8s linear infinite;margin:0 auto 20px;"></div>
      <div id="__eq15_msg__" style="font-size:16px;font-weight:800;color:#5b21b6;margin-bottom:6px;">
        A processar as suas respostas…
      </div>
      <div style="font-size:13px;color:#64748b;">Por favor, não feche esta página.</div>
    </div>
    <style>@keyframes __eq15spin__{to{transform:rotate(360deg)}}</style>
  `;
  document.body.appendChild(cortina);

  await new Promise(r => setTimeout(r, 120));

  const setMsg = (txt) => {
    const el = document.getElementById("__eq15_msg__");
    if (el) el.textContent = txt;
  };

  try {
    captureWrap.style.left = "0";
    captureWrap.style.top = "0";
    await new Promise(r => setTimeout(r, 150));

    setMsg("A formatar o relatório em PDF…");

    const opt = {
      margin: [12, 12, 12, 12],
      filename: `EQ15_${paciente.replace(/\s+/g, "_")}.pdf`,
      image: { type: "jpeg", quality: 1.0 },
      html2canvas: {
        scale: 4, useCORS: true, allowTaint: true,
        scrollX: 0, scrollY: 0, x: 0, y: 0,
        width: 760, height: captureHeight,
        windowWidth: 760, windowHeight: captureHeight, logging: false
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    const pdfUri = await html2pdf().set(opt).from(captureWrap).outputPdf("datauristring");
    document.body.removeChild(captureWrap);

    setMsg("A enviar com segurança…");

    const base64 = pdfUri.split(",")[1];
    const urlScript = (typeof URL_DO_GOOGLE_SCRIPT !== "undefined") ? URL_DO_GOOGLE_SCRIPT : null;
    if (!urlScript) throw new Error("URL_DO_GOOGLE_SCRIPT não definida na página.");

    const res = await fetch(urlScript, {
      method: "POST",
      body: JSON.stringify({ pdf: base64, nome: paciente, form: "eq15" })
    });
    const resData = await res.json();

    if (resData.status === "sucesso") {
      document.body.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
                    background:#2d1b69;padding:24px;">
          <div style="background:#fff;border-radius:20px;padding:56px 44px;text-align:center;
                      max-width:480px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
            <div style="width:72px;height:72px;background:#ede9fe;border-radius:50%;
                        display:flex;align-items:center;justify-content:center;
                        margin:0 auto 24px;font-size:32px;">✅</div>
            <h1 style="font-size:22px;font-weight:800;color:#5b21b6;margin:0 0 12px;">
              Avaliação Finalizada!
            </h1>
            <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 8px;">
              As suas respostas foram processadas e enviadas com segurança.
            </p>
            <p style="font-size:13px;color:#94a3b8;margin:24px 0 0;">
              Já pode fechar esta janela.
            </p>
          </div>
        </div>`;
    } else {
      throw new Error(resData.mensagem || "Resposta inesperada do servidor.");
    }

  } catch (err) {
    console.error("Erro ao enviar:", err);
    const cw = document.getElementById("__eq15_capture__");
    if (cw?.parentNode) document.body.removeChild(cw);
    cortina.remove();
    if (btnEnviar) { btnEnviar.disabled = false; btnEnviar.textContent = "📤 Enviar Respostas"; }
    alert("Não foi possível enviar as respostas.\n\nVerifique a sua ligação à internet e tente novamente.\n\nDetalhe: " + err.message);
  }
}
