console.log("SCRIPT ETDAH-AD CARREGADO v1 — RELATÓRIO COMPLETO");
const LAUDOS_KEY = "empresa_laudos_etdah_ad";

// ═══════════════════════════════════════════════════════════════════
// DEFINIÇÃO DOS ITENS
// ═══════════════════════════════════════════════════════════════════
const ITENS_ETDAH = [
  { n: 1,  txt: "É atento quando conversa com alguém.",                                              fator: "AAMA" },
  { n: 2,  txt: "É afobado no trabalho.",                                                            fator: "Hiperatividade" },
  { n: 3,  txt: "Necessita fazer listas de tudo o que tem para fazer para não se esquecer de nada.", fator: "Hiperatividade" },
  { n: 4,  txt: "Sente-se chateado e infeliz.",                                                      fator: "Aspectos Emocionais" },
  { n: 5,  txt: "Quando tem de seguir instruções, segue passo a passo e em sequência.",               fator: "AAMA" },
  { n: 6,  txt: "É desorganizado financeiramente.",                                                   fator: "Desatenção" },
  { n: 7,  txt: "É solitário.",                                                                      fator: "Aspectos Emocionais" },
  { n: 8,  txt: "Termina tudo o que começa.",                                                        fator: "AAMA" },
  { n: 9,  txt: "Explode com facilidade (é do tipo pavio curto).",                                   fator: "Impulsividade" },
  { n: 10, txt: "É detalhista e minucioso.",                                                         fator: "AAMA" },
  { n: 11, txt: "Arruma encrenca e confusão facilmente.",                                            fator: "Impulsividade" },
  { n: 12, txt: "Mostra-se insensível à dor e ao perigo.",                                          fator: "Impulsividade" },
  { n: 13, txt: "Tem sono agitado, mexe-se na cama.",                                                fator: "Hiperatividade" },
  { n: 14, txt: "É bem-aceito por todos.",                                                           fator: "AAMA" },
  { n: 15, txt: "Costuma se dar mal por falar as coisas sem pensar.",                                fator: "Impulsividade" },
  { n: 16, txt: "É persistente e insistente diante de uma ideia.",                                   fator: "AAMA" },
  { n: 17, txt: "Acidenta-se com facilidade (cai, tropeça, esbarra em móveis).",                    fator: "Hiperatividade" },
  { n: 18, txt: "Tende a discordar das regras e normas.",                                            fator: "Impulsividade" },
  { n: 19, txt: "Dá impressão de que não sabe o que quer.",                                          fator: "Desatenção" },
  { n: 20, txt: "Evita trabalhos longos, detalhados e complicados.",                                 fator: "Desatenção" },
  { n: 21, txt: "Tem dificuldade para se adaptar às mudanças.",                                      fator: "Aspectos Emocionais" },
  { n: 22, txt: "A qualidade do trabalho é comprometida porque não presta atenção suficiente.",      fator: "Desatenção" },
  { n: 23, txt: "Inicia uma atividade com entusiasmo e dificilmente chega ao fim.",                  fator: "Desatenção" },
  { n: 24, txt: "Evita atividades que exijam esforço mental prolongado.",                            fator: "Desatenção" },
  { n: 25, txt: "Perde a paciência com os familiares.",                                              fator: "Impulsividade" },
  { n: 26, txt: "É rebelde com as pessoas e as situações.",                                          fator: "Impulsividade" },
  { n: 27, txt: "Persiste quando quer alguma coisa.",                                                fator: "AAMA" },
  { n: 28, txt: "Tem tendência a sonhar acordado.",                                                  fator: "Desatenção" },
  { n: 29, txt: "Faz planos cuidadosamente, considera todos os passos.",                             fator: "AAMA" },
  { n: 30, txt: "Parece sonhar acordado.",                                                           fator: "Desatenção" },
  { n: 31, txt: "Faz seu trabalho rápido demais.",                                                   fator: "Hiperatividade" },
  { n: 32, txt: "É distraído com tudo.",                                                             fator: "Desatenção" },
  { n: 33, txt: "Dificilmente chega ao final de um projeto.",                                        fator: "Desatenção" },
  { n: 34, txt: "Seu hábito de trabalho é confuso e desorganizado.",                                 fator: "Desatenção" },
  { n: 35, txt: "Necessita estar em constante movimentação.",                                        fator: "Hiperatividade" },
  { n: 36, txt: "Atrasa pagamentos porque se esquece das datas de vencimento.",                      fator: "Desatenção" },
  { n: 37, txt: "Mostra-se apático e indiferente diante das situações.",                             fator: "Desatenção" },
  { n: 38, txt: "Tem fortes reações emocionais (explosões de raiva, choro).",                        fator: "Impulsividade" },
  { n: 39, txt: "É agressivo.",                                                                      fator: "Impulsividade" },
  { n: 40, txt: "Tem problemas com a lei e/ou com a justiça.",                                       fator: "Impulsividade" },
  { n: 41, txt: "É imprudente, arrisca sempre.",                                                     fator: "Impulsividade" },
  { n: 42, txt: "É tolerante diante das situações.",                                                 fator: "AAMA" },
  { n: 43, txt: "Tem dificuldade para permanecer sentado.",                                          fator: "Hiperatividade" },
  { n: 44, txt: "É conhecido pelos outros como desligado.",                                          fator: "Desatenção" },
  { n: 45, txt: "Seu jeito de ser é motivo de discussão em casa.",                                   fator: "Impulsividade" },
  { n: 46, txt: "Tira conclusões mesmo antes de conhecer os fatos.",                                 fator: "Impulsividade" },
  { n: 47, txt: "Necessita estar em situações mais perigosas e arriscadas.",                         fator: "Impulsividade" },
  { n: 48, txt: "Tem dificuldade em aceitar a opinião dos outros.",                                  fator: "Impulsividade" },
  { n: 49, txt: "Faz as coisas devagar, ritmo de trabalho lento.",                                   fator: "Desatenção" },
  { n: 50, txt: "Distrai-se enquanto trabalha e outras pessoas conversam.",                          fator: "Desatenção" },
  { n: 51, txt: "A mente voa longe enquanto lê.",                                                    fator: "Desatenção" },
  { n: 52, txt: "Faz tudo o que dá em sua cabeça.",                                                  fator: "Impulsividade" },
  { n: 53, txt: "Costuma vingar-se das pessoas, não engole sapo.",                                   fator: "Impulsividade" },
  { n: 54, txt: "Precisa ser lembrado dos compromissos diários.",                                    fator: "Desatenção" },
  { n: 55, txt: "Vive isolado, evita atividades de grupo.",                                          fator: "Aspectos Emocionais" },
  { n: 56, txt: "É mais desorganizado do que a maioria das pessoas.",                                fator: "Desatenção" },
  { n: 57, txt: "Não observa detalhes e minúcias.",                                                  fator: "Desatenção" },
  { n: 58, txt: "Persiste até o fim com os seus objetivos.",                                         fator: "AAMA" },
  { n: 59, txt: "Sabe aguardar a vez.",                                                              fator: "AAMA" },
  { n: 60, txt: "Responde antes de ouvir a pergunta inteira.",                                       fator: "Impulsividade" },
  { n: 61, txt: "É criticado por seu jeito de ser.",                                                 fator: "Impulsividade" },
  { n: 62, txt: "Intromete-se em assuntos que não lhe dizem respeito.",                              fator: "Impulsividade" },
  { n: 63, txt: "Costuma criticar os outros.",                                                       fator: "Impulsividade" },
  { n: 64, txt: "Tem memória ruim para guardar instruções ou ordens.",                               fator: "Desatenção" },
  { n: 65, txt: "Planeja suas ações, respeitando cada etapa.",                                       fator: "AAMA" },
  { n: 66, txt: "É impulsivo; age antes de pensar.",                                                 fator: "Impulsividade" },
  { n: 67, txt: "Costuma se esquecer de compromissos se não os anota.",                              fator: "Desatenção" },
  { n: 68, txt: "Necessita de novidades e de variedades em sua vida.",                               fator: "Impulsividade" },
  { n: 69, txt: "Tem dificuldade para processar informações recebidas.",                             fator: "Desatenção" },
];

// Itens AAMA que são INVERTIDOS (escore = 5 - resposta_bruta)
const ITENS_AAMA_INVERTIDOS = new Set([1, 5, 8, 10, 14, 16, 27, 29, 42, 58, 59, 65]);

// Fatores e ordem no relatório
const FATORES = ["Desatenção", "Hiperatividade", "Impulsividade", "Aspectos Emocionais", "AAMA"];

// Cores por fator (para gráfico)
const COR_FATOR = {
  "Desatenção":         "#2563eb",
  "Hiperatividade":     "#dc2626",
  "Impulsividade":      "#d97706",
  "Aspectos Emocionais":"#7c3aed",
  "AAMA":               "#059669",
};

// ═══════════════════════════════════════════════════════════════════
// TABELAS NORMATIVAS (percentil → bruto mínimo, por escolaridade)
// Estrutura: [percentil, bruto]  — bruto=null = sem dado
// ═══════════════════════════════════════════════════════════════════
const NORMAS = {
  "Ensino Fundamental": {
    "Desatenção":          [[1,6],[5,16],[10,21],[15,23],[20,26],[25,30],[30,32],[35,34],[40,37],[45,39],[50,42],[55,43],[60,45],[65,47],[70,49],[75,54],[80,59],[85,63],[90,68],[95,70]],
    "Impulsividade":       [[1,8],[5,15],[10,21],[15,26],[20,28],[25,31],[30,33],[35,35],[40,37],[45,39],[50,42],[55,44],[60,49],[65,51],[70,52],[75,54],[80,58],[85,64],[90,71],[95,82]],
    "Hiperatividade":      [[1,2],[5,6],[10,null],[15,8],[20,10],[25,12],[30,13],[35,14],[40,15],[45,16],[50,17],[55,18],[60,null],[65,null],[70,null],[75,18],[80,null],[85,20],[90,21],[95,22]],
    "Aspectos Emocionais": [[1,null],[5,null],[10,null],[15,null],[20,2],[25,null],[30,3],[35,null],[40,4],[45,null],[50,5],[55,6],[60,null],[65,6],[70,null],[75,7],[80,8],[85,10],[90,12],[95,15]],
    "AAMA":                [[1,2],[5,8],[10,12],[15,13],[20,14],[25,16],[30,17],[35,18],[40,19],[45,21],[50,22],[55,23],[60,23],[65,24],[70,25],[75,25],[80,27],[85,28],[90,31],[95,36]],
  },
  "Ensino Médio": {
    "Desatenção":          [[1,6],[5,13],[10,17],[15,19],[20,22],[25,24],[30,27],[35,29],[40,31],[45,34],[50,37],[55,39],[60,41],[65,43],[70,44],[75,46],[80,49],[85,54],[90,57],[95,67],[99,79]],
    "Impulsividade":       [[1,8],[5,16],[10,19],[15,23],[20,25],[25,27],[30,29],[35,32],[40,34],[45,36],[50,40],[55,42],[60,45],[65,47],[70,51],[75,52],[80,54],[85,57],[90,61],[95,70],[99,91]],
    "Hiperatividade":      [[1,3],[5,6],[10,8],[15,9],[20,null],[25,10],[30,11],[35,12],[40,13],[45,14],[50,15],[55,16],[60,17],[65,null],[70,null],[75,18],[80,18],[85,19],[90,21],[95,23],[99,29]],
    "Aspectos Emocionais": [[1,null],[5,1],[10,2],[15,null],[20,null],[25,3],[30,null],[35,4],[40,null],[45,4],[50,5],[55,6],[60,6],[65,7],[70,7],[75,8],[80,9],[85,10],[90,11],[95,13],[99,16]],
    "AAMA":                [[1,4],[5,7],[10,9],[15,11],[20,13],[25,14],[30,15],[35,16],[40,17],[45,18],[50,19],[55,20],[60,21],[65,22],[70,23],[75,24],[80,24],[85,26],[90,28],[95,32],[99,43]],
  },
  "Ensino Superior": {
    "Desatenção":          [[1,7],[5,11],[10,16],[15,19],[20,21],[25,23],[30,25],[35,27],[40,29],[45,31],[50,34],[55,36],[60,38],[65,40],[70,42],[75,44],[80,46],[85,50],[90,54],[95,62],[99,72]],
    "Impulsividade":       [[1,10],[5,15],[10,19],[15,21],[20,24],[25,26],[30,27],[35,29],[40,31],[45,34],[50,36],[55,39],[60,41],[65,43],[70,45],[75,47],[80,48],[85,52],[90,56],[95,60],[99,78]],
    "Hiperatividade":      [[1,4],[5,6],[10,7],[15,9],[20,null],[25,10],[30,11],[35,12],[40,13],[45,14],[50,15],[55,16],[60,17],[65,null],[70,null],[75,18],[80,18],[85,19],[90,21],[95,23],[99,29]],
    "Aspectos Emocionais": [[1,null],[5,null],[10,2],[15,null],[20,null],[25,3],[30,null],[35,3],[40,null],[45,4],[50,5],[55,5],[60,6],[65,6],[70,7],[75,7],[80,null],[85,9],[90,11],[95,13],[99,17]],
    "AAMA":                [[1,4],[5,8],[10,11],[15,12],[20,14],[25,15],[30,16],[35,17],[40,18],[45,19],[50,20],[55,21],[60,22],[65,23],[70,23],[75,24],[80,24],[85,26],[90,27],[95,31],[99,37]],
  },
};

// ═══════════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════════════════
function calcularIdade(nascISO, aplISO) {
  if (!nascISO || !aplISO) return null;
  const n = new Date(nascISO), a = new Date(aplISO);
  if (isNaN(n) || isNaN(a) || a < n) return null;
  let anos = a.getFullYear() - n.getFullYear();
  let meses = a.getMonth() - n.getMonth();
  if (a.getDate() < n.getDate()) meses--;
  if (meses < 0) { anos--; meses += 12; }
  return { anos, meses, totalMeses: anos * 12 + meses };
}

function formatarData(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function getLaudos() { return JSON.parse(localStorage.getItem(LAUDOS_KEY) || "[]"); }
function setLaudos(arr) { localStorage.setItem(LAUDOS_KEY, JSON.stringify(arr)); }

// ── Busca percentil para um escore bruto numa tabela normativa ────
// Retorna o maior percentil cujo bruto-âncora <= bruto informado
function buscarPercentil(tabela, bruto) {
  // Filtra entradas com bruto numérico
  const validas = tabela.filter(([p, b]) => b !== null && b !== undefined && !isNaN(b));
  if (validas.length === 0) return null;

  // Menor bruto da tabela — score abaixo disso = percentil < 1
  if (bruto < validas[0][1]) return 1;

  let percentilAchado = null;
  for (const [p, b] of validas) {
    if (bruto >= b) percentilAchado = p;
  }
  // Se está acima do maior valor da tabela
  const maiorEntrada = validas[validas.length - 1];
  if (bruto > maiorEntrada[1]) return maiorEntrada[0];

  return percentilAchado ?? 1;
}

// ── Classificação por percentil (escala ETDAH-AD) ─────────────────
function classificarPercentil(p) {
  if (p == null) return { label: "—", cor: "#94a3b8", bg: "#f8fafc" };
  if (p >= 85) return { label: "Superior",        cor: "#166534", bg: "#dcfce7" };
  if (p >= 65) return { label: "Médio Superior",  cor: "#14532d", bg: "#bbf7d0" };
  if (p >= 45) return { label: "Médio",           cor: "#854d0e", bg: "#fef9c3" };
  if (p >= 25) return { label: "Médio Inferior",  cor: "#9a3412", bg: "#fed7aa" };
  return          { label: "Inferior",            cor: "#991b1b", bg: "#fee2e2" };
}

// ── Cores para tabela de resultados (hex report) ──────────────────
const COR_CLASS = {
  "Superior":        { bg: "#D5F5E3", txt: "#006100" },
  "Médio Superior":  { bg: "#D6EAF8", txt: "#1F3864" },
  "Médio":           { bg: "#FFF2CC", txt: "#BF8F00" },
  "Médio Inferior":  { bg: "#FFC7CE", txt: "#9C0006" },
  "Inferior":        { bg: "#FFC7CE", txt: "#9C0006" },
  "—":               { bg: "#f8fafc", txt: "#94a3b8" },
};

// ═══════════════════════════════════════════════════════════════════
// RENDER TABELA DE ITENS (formulário)
// ═══════════════════════════════════════════════════════════════════
function renderTabelaItens() {
  const tbody = document.getElementById("tbodyItens");
  if (!tbody) return;
  tbody.innerHTML = ITENS_ETDAH.map(item => `
    <tr>
      <td style="color:#94a3b8;font-weight:700;">${item.n}</td>
      <td style="font-size:13px;">${item.txt}</td>
      <td style="text-align:center;">
        <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:${COR_FATOR[item.fator]}22;color:${COR_FATOR[item.fator]}">
          ${item.fator}
        </span>
      </td>
      <td style="text-align:center;">
        <input
          type="number" min="0" max="5" step="1"
          id="resp_${item.n}"
          style="width:64px;padding:6px 8px;border-radius:8px;border:1px solid var(--border);
                 text-align:center;font-size:14px;font-family:inherit;outline:none;"
          placeholder="0–5"
        />
      </td>
    </tr>
  `).join("");
}

// ═══════════════════════════════════════════════════════════════════
// CÁLCULO PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
function calcularEscores() {
  const escolaridade = document.getElementById("escolaridade").value;
  if (!escolaridade || !NORMAS[escolaridade]) {
    alert("Selecione a escolaridade para normatizar corretamente.");
    return null;
  }

  // Ler e validar respostas
  const respostas = {};
  let faltando = [];
  for (const item of ITENS_ETDAH) {
    const el = document.getElementById(`resp_${item.n}`);
    const val = el ? el.value.trim() : "";
    if (val === "" || val === null) { faltando.push(item.n); continue; }
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 0 || num > 5) {
      alert(`Item ${item.n}: valor inválido "${val}". Use 0 a 5.`);
      return null;
    }
    respostas[item.n] = num;
  }

  if (faltando.length > 0) {
    const ok = confirm(`${faltando.length} item(ns) sem resposta: [${faltando.slice(0,8).join(", ")}${faltando.length > 8 ? "..." : ""}].\nDeseja calcular mesmo assim?`);
    if (!ok) return null;
  }

  // Calcular escores ajustados e somas por fator
  const somaFator = { "Desatenção": 0, "Hiperatividade": 0, "Impulsividade": 0, "Aspectos Emocionais": 0, "AAMA": 0 };
  const countFator = { "Desatenção": 0, "Hiperatividade": 0, "Impulsividade": 0, "Aspectos Emocionais": 0, "AAMA": 0 };

  for (const item of ITENS_ETDAH) {
    const raw = respostas[item.n];
    if (raw === undefined) continue;
    // Inversão AAMA
    const ajustado = ITENS_AAMA_INVERTIDOS.has(item.n) ? (5 - raw) : raw;
    somaFator[item.fator] += ajustado;
    countFator[item.fator]++;
  }

  // Lookup percentis
  const tabelaNorma = NORMAS[escolaridade];
  const resultados = {};
  for (const fator of FATORES) {
    const bruto = somaFator[fator];
    const tabela = tabelaNorma[fator];
    const percentil = tabela ? buscarPercentil(tabela, bruto) : null;
    const classif  = classificarPercentil(percentil);
    resultados[fator] = {
      bruto,
      itensRespondidos: countFator[fator],
      percentil,
      classificacao: classif.label,
      cor: classif.cor,
      bg:  classif.bg,
    };
  }

  return { respostas, somaFator, resultados, escolaridade };
}

// ═══════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL: calcular()
// ═══════════════════════════════════════════════════════════════════
let _chartInstance = null;

window.calcular = async function(salvar) {
  // Dados do profissional e examinando
  const profNome         = document.getElementById("profNome")?.value.trim() || "";
  const profCRP          = document.getElementById("profCRP")?.value.trim() || "";
  const profEspecialidade= document.getElementById("profEspecialidade")?.value.trim() || "";
  const profContato      = document.getElementById("profContato")?.value.trim() || "";
  const nome             = document.getElementById("nome")?.value.trim() || "";
  const cpf              = document.getElementById("cpf")?.value.trim() || "";
  const dataNascimento   = document.getElementById("dataNascimento")?.value || "";
  const dataAplicacao    = document.getElementById("dataAplicacao")?.value || "";
  const sexo             = document.getElementById("sexo")?.value || "";
  const escolaridade     = document.getElementById("escolaridade")?.value || "";
  const motivo           = document.getElementById("motivo")?.value.trim() || "";
  const obs              = document.getElementById("obsComportamentais")?.value.trim() || "";
  const recomendacoes    = document.getElementById("recomendacoes")?.value.trim() || "";

  if (!nome) { alert("Informe o nome do avaliado."); return; }
  if (!escolaridade) { alert("Selecione a escolaridade."); return; }

  // ► LOADING
  showLoading(salvar ? "Salvando e gerando relatório..." : "Calculando resultados...");

  try {
    const dados = calcularEscores();
    if (!dados) { hideLoading(); return; }

    const idade = calcularIdade(dataNascimento, dataAplicacao);
    const idadeTxt = idade ? `${idade.anos} anos e ${idade.meses} meses` : "—";

    // ── Montar objeto laudo ──────────────────────────────────────────
    const laudoObj = {
      id: Date.now().toString(),
      instrumento: "ETDAH-AD",
      profNome, profCRP, profEspecialidade, profContato,
      nome, cpf, dataNascimento, dataAplicacao, sexo, escolaridade, motivo,
      obs, recomendacoes, idadeTxt,
      respostas: dados.respostas,
      resultados: dados.resultados,
    };

    // ── Renderizar relatório ─────────────────────────────────────────
    renderRelatorio(laudoObj);

    // Aguardar o gráfico Chart.js renderizar (setTimeout de 100ms no renderRelatorio)
    await new Promise(r => setTimeout(r, 400));

    // ── Converter canvas do gráfico para imagem estática ─────────────
    const rel = document.getElementById("relatorio");
    if (rel) {
      const canvas = rel.querySelector("canvas");
      if (canvas && _chartInstance) {
        try {
          const imgDataUrl = canvas.toDataURL("image/png");
          const imgEl = document.createElement("img");
          imgEl.src = imgDataUrl;
          imgEl.style.cssText = "width:100%;height:auto;display:block;border-radius:8px;";
          canvas.parentNode.replaceChild(imgEl, canvas);
          // Destruir a instância Chart.js (já não precisa do canvas)
          try { _chartInstance.destroy(); } catch(e) {}
          _chartInstance = null;
        } catch(e) { console.warn("Erro ao converter gráfico:", e); }
      }
    }

    // ── Salvar no localStorage ───────────────────────────────────────
    if (salvar) {
      const lista = getLaudos();
      lista.unshift(laudoObj);
      if (lista.length > 200) lista.length = 200;
      setLaudos(lista);
    }

    // ── Salvar no Firebase via Integration ────────────────────────────
    if (salvar && window.Integration && Integration.getPacienteAtual()) {
      try {
        const resumoFatores = FATORES.map(f => `${f}: ${dados.resultados[f]?.percentil ?? "—"}%`).join(" | ");
        await Integration.salvarTesteNoFirebase("etdah_ad", {
          dataAplicacao,
          resumo: resumoFatores,
          scores: dados.resultados,
          classificacao: dados.resultados["Desatenção"]?.classificacao || "—",
          observacoes: obs,
          htmlRelatorio: rel ? rel.outerHTML : "",
        });
      } catch(e) { console.warn("Erro ao salvar no Firebase:", e); }
    }

    // ► HIDE LOADING + OPEN MODAL (padrão WAIS)
    hideLoading();
    openReportModal();

    if (salvar) {
      setTimeout(() => {
        const toolbar = document.querySelector(".toolbar-title");
        if (toolbar) toolbar.textContent = "📄 Relatório ETDAH-AD — Laudo salvo com sucesso!";
      }, 100);
    }

  } catch (e) {
    hideLoading();
    console.error("Erro ao processar:", e);
    alert("Ocorreu um erro ao processar. Verifique o console.\n\n" + e.message);
  }
};

// ═══════════════════════════════════════════════════════════════════
// RENDERIZAR RELATÓRIO HTML
// ═══════════════════════════════════════════════════════════════════
function renderRelatorio(d) {
  const rel = document.getElementById("relatorio");
  if (!rel) return;

  const { resultados } = d;

  // ── Linhas da tabela de fatores ──────────────────────────────────
  const linhasTabela = FATORES.map(fator => {
    const r = resultados[fator];
    const cc = COR_CLASS[r.classificacao] || COR_CLASS["—"];
    return `
      <tr>
        <td style="font-weight:600;font-size:13px;">${fator}</td>
        <td style="text-align:center;font-size:13px;">${r.itensRespondidos}</td>
        <td style="text-align:center;font-size:14px;font-weight:700;">${r.bruto}</td>
        <td style="text-align:center;font-size:13px;font-weight:700;">${r.percentil != null ? r.percentil + "%" : "—"}</td>
        <td style="text-align:center;">
          <span style="
            background:${cc.bg};color:${cc.txt};
            padding:3px 12px;border-radius:20px;
            font-size:11.5px;font-weight:700;
            display:inline-block;
          ">${r.classificacao}</span>
        </td>
      </tr>`;
  }).join("");

  // ── Canvas para gráfico ──────────────────────────────────────────
  const canvasId = "chartEtdah_" + Date.now();

  // ── Texto interpretativo por fator ──────────────────────────────
  const interpretacoes = FATORES.map(fator => {
    const r = resultados[fator];
    return gerarInterpretacaoFator(fator, r, d.nome || "O avaliado");
  }).join("");

  rel.innerHTML = `
  <!-- ════════ CABEÇALHO DO RELATÓRIO ════════ -->
  <div style="border-bottom:3px solid #2563eb;padding-bottom:18px;margin-bottom:24px;">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
      <div>
        <div style="font-size:9px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;">
          Relatório de Avaliação Neuropsicológica
        </div>
        <div style="font-size:22px;font-weight:800;color:#1e293b;">ETDAH-AD</div>
        <div style="font-size:13px;color:#64748b;margin-top:2px;">Escala de TDAH para Adultos — Autoavaliação</div>
      </div>
      <div style="text-align:right;font-size:12px;color:#64748b;line-height:1.8;">
        <div><strong style="color:#1e293b;">Data:</strong> ${formatarData(d.dataAplicacao)}</div>
        <div><strong style="color:#1e293b;">Psicólogo(a):</strong> ${d.profNome || "—"}</div>
        <div><strong style="color:#1e293b;">CRP:</strong> ${d.profCRP || "—"}</div>
      </div>
    </div>
  </div>

  <!-- ════════ DADOS DO EXAMINANDO ════════ -->
  <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin-bottom:24px;border:1px solid #e2e8f0;">
    <div style="font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Dados do Examinando</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px 24px;">
      <div><span style="font-size:11px;color:#94a3b8;">Nome</span><br/><strong style="font-size:13px;">${d.nome || "—"}</strong></div>
      <div><span style="font-size:11px;color:#94a3b8;">Data de Nascimento</span><br/><strong style="font-size:13px;">${formatarData(d.dataNascimento)}</strong></div>
      <div><span style="font-size:11px;color:#94a3b8;">Idade</span><br/><strong style="font-size:13px;">${d.idadeTxt}</strong></div>
      <div><span style="font-size:11px;color:#94a3b8;">Sexo</span><br/><strong style="font-size:13px;">${d.sexo || "—"}</strong></div>
      <div><span style="font-size:11px;color:#94a3b8;">Escolaridade</span><br/><strong style="font-size:13px;">${d.escolaridade || "—"}</strong></div>
      <div><span style="font-size:11px;color:#94a3b8;">Data da Avaliação</span><br/><strong style="font-size:13px;">${formatarData(d.dataAplicacao)}</strong></div>
    </div>
    ${d.motivo ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:12.5px;color:#475569;"><strong>Demanda:</strong> ${d.motivo}</div>` : ""}
  </div>

  <!-- ════════ TABELA DE RESULTADOS ════════ -->
  <div style="margin-bottom:28px;">
    <div style="font-size:13px;font-weight:800;color:#1e293b;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #e2e8f0;">
      Escores por Fator
    </div>
    <table style="width:100%;border-collapse:collapse;font-family:inherit;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid #e2e8f0;">Fator</th>
          <th style="padding:9px 12px;text-align:center;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid #e2e8f0;">Itens</th>
          <th style="padding:9px 12px;text-align:center;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid #e2e8f0;">Escore Bruto</th>
          <th style="padding:9px 12px;text-align:center;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid #e2e8f0;">Percentil</th>
          <th style="padding:9px 12px;text-align:center;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid #e2e8f0;">Classificação</th>
        </tr>
      </thead>
      <tbody style="font-family:inherit;">
        ${linhasTabela}
      </tbody>
    </table>
  </div>

  <!-- ════════ GRÁFICO DE PERCENTIS ════════ -->
  <div style="margin-bottom:28px;">
    <div style="font-size:13px;font-weight:800;color:#1e293b;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #e2e8f0;">
      Perfil Gráfico dos Fatores (Percentil)
    </div>
    <div style="background:#f8fafc;border-radius:12px;padding:16px;border:1px solid #e2e8f0;">
      <canvas id="${canvasId}" style="max-height:280px;"></canvas>
    </div>
    <p style="font-size:11px;color:#94a3b8;margin-top:8px;text-align:center;">
      Normas por escolaridade (${d.escolaridade}). Linha tracejada = percentil 50.
    </p>
  </div>

  <!-- ════════ OBSERVAÇÕES COMPORTAMENTAIS ════════ -->
  ${d.obs ? `
  <div style="margin-bottom:24px;">
    <div style="font-size:13px;font-weight:800;color:#1e293b;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #e2e8f0;">
      Observações Comportamentais
    </div>
    <p style="font-size:13px;color:#334155;line-height:1.75;">${d.obs}</p>
  </div>` : ""}

  <!-- ════════ INTERPRETAÇÃO CLÍNICA POR FATOR ════════ -->
  <div style="margin-bottom:24px;">
    <div style="font-size:13px;font-weight:800;color:#1e293b;margin-bottom:14px;padding-bottom:6px;border-bottom:2px solid #e2e8f0;">
      Resultados e Análise
    </div>
    ${interpretacoes}
  </div>

  <!-- ════════ CONCLUSÃO E RECOMENDAÇÕES ════════ -->
  ${d.recomendacoes ? `
  <div style="margin-bottom:24px;">
    <div style="font-size:13px;font-weight:800;color:#1e293b;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #e2e8f0;">
      Conclusão e Recomendações
    </div>
    <p style="font-size:13px;color:#334155;line-height:1.75;">${d.recomendacoes}</p>
  </div>` : ""}

  <!-- ════════ NOTA TÉCNICA ════════ -->
  <div style="background:#eff6ff;border-radius:10px;padding:14px 16px;border:1px solid #bfdbfe;margin-bottom:24px;">
    <p style="font-size:11.5px;color:#1e40af;line-height:1.7;margin:0;">
      <strong>Nota técnica:</strong> O ETDAH-AD é um instrumento de autoavaliação de sintomas de TDAH para adultos (12–87 anos), composto por 69 itens com escala de resposta de 0 (Nunca) a 5 (Sempre — intensamente).
      Os escores refletem a frequência autopercebida de comportamentos em cada domínio clínico.
      Percentis elevados em Desatenção, Hiperatividade e Impulsividade indicam frequência sintomática
      acima da média normativa para a escolaridade. O fator AAMA (Auto-Avaliação e Monitoramento do Autocontrole)
      é de interpretação inversa — escores mais altos indicam melhor autocontrole.
      Este instrumento deve ser interpretado em conjunto com outros dados da avaliação.
    </p>
  </div>

  <!-- ════════ ASSINATURA ════════ -->
  <div style="margin-top:40px;display:flex;justify-content:flex-end;">
    <div style="text-align:center;min-width:240px;">
      <div style="border-top:1.5px solid #334155;padding-top:10px;">
        <div style="font-size:13px;font-weight:700;color:#1e293b;">${d.profNome || "________________________"}</div>
        <div style="font-size:12px;color:#64748b;">${d.profEspecialidade || "Psicólogo(a)"}</div>
        <div style="font-size:12px;color:#64748b;">${d.profCRP || ""}</div>
        ${d.profContato ? `<div style="font-size:11px;color:#94a3b8;">${d.profContato}</div>` : ""}
      </div>
    </div>
  </div>
  `;

  rel.style.display = "block";
  rel.scrollIntoView({ behavior: "smooth", block: "start" });

  // ── Renderizar gráfico Chart.js ──────────────────────────────────
  setTimeout(() => renderGrafico(canvasId, resultados), 100);
}

// ═══════════════════════════════════════════════════════════════════
// GRÁFICO CHART.JS (barras horizontais — percentis por fator)
// ═══════════════════════════════════════════════════════════════════
function renderGrafico(canvasId, resultados) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return;

  if (_chartInstance) { try { _chartInstance.destroy(); } catch(e) {} _chartInstance = null; }

  const labels     = FATORES;
  const percentis  = FATORES.map(f => resultados[f].percentil ?? 0);
  const cores      = FATORES.map(f => COR_FATOR[f] + "cc");
  const coresBorda = FATORES.map(f => COR_FATOR[f]);

  _chartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Percentil",
        data: percentis,
        backgroundColor: cores,
        borderColor: coresBorda,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const fator = labels[ctx.dataIndex];
              const r = resultados[fator];
              return [
                ` Percentil: ${r.percentil != null ? r.percentil + "%" : "—"}`,
                ` Escore Bruto: ${r.bruto}`,
                ` Classificação: ${r.classificacao}`,
              ];
            }
          }
        },
        annotation: {
          annotations: {
            linha50: {
              type: "line",
              xMin: 50, xMax: 50,
              borderColor: "#94a3b8",
              borderWidth: 1.5,
              borderDash: [5, 5],
            }
          }
        }
      },
      scales: {
        x: {
          min: 0, max: 100,
          ticks: {
            callback: v => v + "%",
            font: { size: 11 },
          },
          grid: { color: "#f1f5f9" },
          title: { display: true, text: "Percentil", font: { size: 11 } },
        },
        y: {
          ticks: { font: { size: 12, weight: "600" } },
          grid: { display: false },
        }
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
// INTERPRETAÇÃO CLÍNICA POR FATOR
// ═══════════════════════════════════════════════════════════════════
function gerarInterpretacaoFator(fator, r, nome) {
  const p    = r.percentil;
  const cl   = r.classificacao;
  const b    = r.bruto;
  const pTxt = p != null ? `${p}º percentil` : "percentil não disponível";
  const cc   = COR_CLASS[cl] || COR_CLASS["—"];

  const titulo = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
      <span style="width:12px;height:12px;border-radius:50%;background:${COR_FATOR[fator]};display:inline-block;flex-shrink:0;"></span>
      <span style="font-size:13px;font-weight:700;color:#1e293b;">${fator}</span>
      <span style="background:${cc.bg};color:${cc.txt};padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;margin-left:auto;">${cl} · ${pTxt}</span>
    </div>`;

  let corpo = "";

  if (fator === "Desatenção") {
    if (cl === "Superior" || cl === "Médio Superior") {
      corpo = `O escore obtido (bruto = ${b}) situa ${nome} no ${pTxt} para Desatenção, indicando frequência elevada de comportamentos desatentos em comparação ao grupo normativo. São esperados padrões como distratibilidade, dificuldade em concluir tarefas, sonhar acordado e desorganização no trabalho — com impacto funcional relevante nos contextos acadêmico, profissional e cotidiano.`;
    } else if (cl === "Médio") {
      corpo = `O escore de Desatenção (bruto = ${b}; ${pTxt}) situa-se na faixa Média, indicando frequência de comportamentos desatentos compatível com a maioria da população normativa para a escolaridade avaliada. Não há indicativo de comprometimento significativo neste domínio isoladamente.`;
    } else {
      corpo = `O escore de Desatenção (bruto = ${b}; ${pTxt}) encontra-se abaixo da média normativa, sugerindo baixa frequência de comportamentos desatentos no autorrelato. Este dado deve ser interpretado considerando o padrão global da avaliação.`;
    }
  } else if (fator === "Hiperatividade") {
    if (cl === "Superior" || cl === "Médio Superior") {
      corpo = `O escore de Hiperatividade (bruto = ${b}; ${pTxt}) indica frequência elevada de comportamentos hiperativos. ${nome} relata padrões como agitação motora, inquietação, sono agitado e ritmo de trabalho acelerado em grau acima do esperado para o grupo normativo. Esses comportamentos podem comprometer a qualidade das execuções e a adaptação em ambientes que exigem controle postural e regulação do ritmo.`;
    } else if (cl === "Médio") {
      corpo = `O escore de Hiperatividade (bruto = ${b}; ${pTxt}) encontra-se na faixa Média, sem indicativo de comprometimento clinicamente relevante neste domínio por este instrumento.`;
    } else {
      corpo = `O escore de Hiperatividade (bruto = ${b}; ${pTxt}) está abaixo da média normativa. A frequência de comportamentos hiperativos relatada é baixa em relação ao grupo de referência.`;
    }
  } else if (fator === "Impulsividade") {
    if (cl === "Superior" || cl === "Médio Superior") {
      corpo = `O escore de Impulsividade (bruto = ${b}; ${pTxt}) evidencia frequência elevada de comportamentos impulsivos no autorrelato, como dificuldade em controlar reações emocionais, tendência a agir antes de pensar, baixa tolerância à frustração e comportamentos de risco. Esses padrões, quando persistentes, têm repercussão nos relacionamentos interpessoais e no gerenciamento de situações adversas.`;
    } else if (cl === "Médio") {
      corpo = `O escore de Impulsividade (bruto = ${b}; ${pTxt}) situa-se na faixa Média, indicando frequência de comportamentos impulsivos compatível com a norma para a escolaridade avaliada.`;
    } else {
      corpo = `O escore de Impulsividade (bruto = ${b}; ${pTxt}) está abaixo da média normativa, sugerindo boa capacidade de controle comportamental neste domínio conforme o autorrelato.`;
    }
  } else if (fator === "Aspectos Emocionais") {
    if (cl === "Superior" || cl === "Médio Superior") {
      corpo = `O escore de Aspectos Emocionais (bruto = ${b}; ${pTxt}) indica frequência elevada de vivências emocionais negativas, como humor rebaixado, isolamento social, labilidade emocional e dificuldades de adaptação a mudanças. Esses dados reforçam a importância de investigação complementar para avaliar a presença de comorbidades afetivas associadas ao quadro clínico.`;
    } else if (cl === "Médio") {
      corpo = `O escore de Aspectos Emocionais (bruto = ${b}; ${pTxt}) situa-se na faixa Média, sem indicativo de sofrimento emocional de intensidade elevada neste instrumento. Avaliação complementar pode esclarecer a dimensão afetiva do quadro.`;
    } else {
      corpo = `O escore de Aspectos Emocionais (bruto = ${b}; ${pTxt}) está abaixo da média normativa, não sugerindo frequência elevada de sintomatologia emocional negativa neste autorrelato.`;
    }
  } else if (fator === "AAMA") {
    if (cl === "Superior" || cl === "Médio Superior") {
      corpo = `O escore de AAMA (Auto-Avaliação e Monitoramento do Autocontrole; bruto = ${b}; ${pTxt}) é elevado — neste fator, escores altos refletem positivamente, indicando que ${nome} avalia a si mesmo(a) como atento(a), organizado(a) e com bom autocontrole comportamental. Este dado deve ser interpretado em contraste com os demais fatores para avaliar coerência interna do perfil.`;
    } else if (cl === "Médio") {
      corpo = `O escore de AAMA (bruto = ${b}; ${pTxt}) situa-se na faixa Média. O fator AAMA avalia autocontrole e monitoramento do próprio comportamento — escores médios indicam percepção autorreferida de autocontrole dentro do esperado para o grupo normativo.`;
    } else {
      corpo = `O escore de AAMA (bruto = ${b}; ${pTxt}) está abaixo da média normativa. Como este fator é de interpretação positiva (escores altos = melhor autocontrole), o resultado indica que ${nome} percebe déficits no próprio autocontrole, organização e monitoramento comportamental — dado clinicamente relevante no contexto da investigação de TDAH.`;
    }
  }

  return `
    <div style="background:#f8fafc;border-radius:10px;padding:14px 16px;margin-bottom:14px;border-left:4px solid ${COR_FATOR[fator]};">
      ${titulo}
      <p style="font-size:13px;color:#334155;line-height:1.75;margin:0;">${corpo}</p>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// LOADING OVERLAY (padrão WAIS)
// ═══════════════════════════════════════════════════════════════════
function showLoading(msg) {
  const overlay = document.createElement("div");
  overlay.id = "loadingOverlay";
  overlay.className = "loading-overlay";
  overlay.innerHTML = `<div class="loading-card">
    <div class="loading-spinner"></div>
    <div class="loading-title">${msg || "Gerando relatório..."}</div>
    <div class="loading-sub">Processando dados do ETDAH-AD</div>
  </div>`;
  document.body.appendChild(overlay);
}

function hideLoading() {
  const el = document.getElementById("loadingOverlay");
  if (el) el.remove();
}

// ═══════════════════════════════════════════════════════════════════
// REPORT MODAL (padrão WAIS)
// ═══════════════════════════════════════════════════════════════════
function _escHandler(e) {
  if (e.key === "Escape") closeReportModal();
}

function openReportModal() {
  const rel = document.getElementById("relatorio");
  if (!rel) return;

  closeReportModal();

  const backdrop = document.createElement("div");
  backdrop.id = "reportModal";
  backdrop.className = "report-modal-backdrop";
  const paciente = window.Integration ? Integration.getPacienteAtual() : null;
  const btnVoltar = paciente ? `<button class="toolbar-btn toolbar-btn-voltar" onclick="voltarParaPaciente()">👤 Voltar ao Paciente</button>` : "";
  backdrop.innerHTML = `
    <div class="report-modal">
      <div class="report-modal-toolbar no-print">
        <div class="toolbar-title">📄 Relatório ETDAH-AD</div>
        <div class="toolbar-actions">
          ${btnVoltar}
          <button class="toolbar-btn toolbar-btn-primary" onclick="baixarPDF()">📥 Baixar PDF</button>
          <button class="toolbar-btn toolbar-btn-secondary" onclick="window.print()">🖨️ Imprimir</button>
          <button class="toolbar-btn toolbar-btn-secondary" onclick="closeReportModal()">✕ Fechar</button>
        </div>
      </div>
      <div class="report-modal-body" id="reportModalBody"></div>
    </div>`;

  document.body.appendChild(backdrop);

  const body = document.getElementById("reportModalBody");
  body.appendChild(rel);
  rel.style.display = "block";

  backdrop.addEventListener("click", function(e) {
    if (e.target === backdrop) closeReportModal();
  });
  document.addEventListener("keydown", _escHandler);
}

function closeReportModal() {
  const modal = document.getElementById("reportModal");
  if (!modal) return;

  const rel = document.getElementById("relatorio");
  if (rel) {
    const main = document.querySelector(".main-content");
    if (main) { main.appendChild(rel); }
    rel.style.display = "none";
  }

  modal.remove();
  document.removeEventListener("keydown", _escHandler);

  let paciente = null;
  try { const raw = sessionStorage.getItem("pacienteAtual"); if (raw) paciente = JSON.parse(raw); } catch(e) {}
  if (paciente && paciente.id) {
    if (confirm(`Deseja voltar à ficha do paciente "${paciente.nome}"?`)) {
      voltarParaPaciente();
    }
  }
}

function voltarParaPaciente() {
  let paciente = null;
  try {
    const raw = sessionStorage.getItem("pacienteAtual");
    if (raw) paciente = JSON.parse(raw);
  } catch(e) {}
  if (!paciente && window.Integration) paciente = Integration.getPacienteAtual();

  if (paciente && paciente.id) {
    sessionStorage.setItem("abrirPacienteId", paciente.id);
  }
  window.location.href = "/Pacientes/";
}

// ═══════════════════════════════════════════════════════════════════
// GERAR PDF (padrão WAIS — a partir do relatório renderizado)
// ═══════════════════════════════════════════════════════════════════
async function esperarImagensCarregarem(container) {
  const imgs = Array.from(container.querySelectorAll("img"));
  await Promise.all(imgs.map(img => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise(r => { img.onload = () => r(); img.onerror = () => r(); });
  }));
}

async function gerarPDF(nome, dataAplicacao) {
  // Chamada standalone — compatibilidade com laudos salvos
  if (typeof html2pdf === "undefined") { alert("Biblioteca PDF não carregada."); return; }
  const el = document.getElementById("relatorio");
  if (!el) return;

  await esperarImagensCarregarem(el);

  const nomeArq = `ETDAH-AD_${(nome || "avaliado").replace(/\s+/g, "_")}_${(dataAplicacao || "").replace(/-/g,"")}.pdf`;

  showLoading("Gerando PDF...");

  try {
    await html2pdf().set({
      margin: [5, 5, 5, 5],
      filename: nomeArq,
      image: { type: "jpeg", quality: 1.00 },
      html2canvas: { scale: 4, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: "mm", format: [210, 900], orientation: "portrait" },
      pagebreak: { mode: ["avoid-all"] },
    }).from(el).save();
  } catch(e) {
    console.error("Erro ao gerar PDF:", e);
    alert("Erro ao gerar PDF. Tente novamente.");
  } finally {
    hideLoading();
  }
}

async function baixarPDF() {
  const rel = document.getElementById("relatorio");
  if (!rel) return;

  await esperarImagensCarregarem(rel);

  const nomeEl = rel.querySelector("strong");
  const nome = nomeEl ? nomeEl.textContent.trim() : "avaliado";
  const nomeArquivo = "ETDAH-AD_" + nome.replace(/\s+/g, "_").substring(0, 30) + ".pdf";

  showLoading("Gerando PDF...");

  try {
    await html2pdf().set({
      margin: [5, 5, 5, 5],
      filename: nomeArquivo,
      image: { type: "jpeg", quality: 1.00 },
      html2canvas: { scale: 4, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: "mm", format: [210, 900], orientation: "portrait" },
      pagebreak: { mode: ["avoid-all"] },
    }).from(rel).save();
  } catch(e) {
    console.error("Erro ao gerar PDF:", e);
    alert("Erro ao gerar PDF. Tente novamente.");
  } finally {
    hideLoading();
  }
}

window.gerarPDF = gerarPDF;
window.baixarPDF = baixarPDF;
window.openReportModal = openReportModal;
window.closeReportModal = closeReportModal;
window.voltarParaPaciente = voltarParaPaciente;

// ═══════════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  // Preencher data de hoje
  const hoje = new Date().toISOString().split("T")[0];
  const dtApl = document.getElementById("dataAplicacao");
  if (dtApl && !dtApl.value) dtApl.value = hoje;

  // Renderizar tabela de itens
  renderTabelaItens();

  // Cálculo automático de idade
  const nascEl = document.getElementById("dataNascimento");
  const aplEl  = document.getElementById("dataAplicacao");
  const idadeEl= document.getElementById("idadeCalculada");

  function atualizarIdade() {
    if (!nascEl || !aplEl || !idadeEl) return;
    const id = calcularIdade(nascEl.value, aplEl.value);
    if (!id) { idadeEl.textContent = ""; return; }
    const { anos, meses } = id;
    if (anos < 12 || anos > 87) {
      idadeEl.textContent = `⚠️ Idade calculada: ${anos} anos — fora da faixa normativa (12–87 anos)`;
      idadeEl.style.color = "#dc2626";
    } else {
      idadeEl.textContent = `Idade calculada: ${anos} anos e ${meses} meses`;
      idadeEl.style.color = "#16a34a";
    }
  }

  if (nascEl) nascEl.addEventListener("change", atualizarIdade);
  if (aplEl)  aplEl.addEventListener("change",  atualizarIdade);
});
