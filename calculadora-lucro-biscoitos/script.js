/* ============================================================
   MINHA CALCULADORA DE LUCRO — BISCOITOS DE NATAL
   Toda a lógica roda no navegador. Nenhum dado sai do aparelho.
   ============================================================ */

(function () {
  "use strict";

  const STORAGE_KEY = "calculadoraLucroBiscoitos_v1";

  const UNIDADE_GRUPO = {
    g: "massa", kg: "massa",
    ml: "volume", l: "volume",
    un: "contagem"
  };
  const UNIDADE_LABEL = {
    g: "g", kg: "kg", ml: "ml", l: "L", un: "un"
  };
  const GRUPO_UNIDADES = {
    massa: ["g", "kg"],
    volume: ["ml", "l"],
    contagem: ["un"]
  };
  // quantas unidades-base (g, ml ou un) existem em 1 unidade informada
  const PARA_BASE = { g: 1, kg: 1000, ml: 1, l: 1000, un: 1 };

  function novoId() {
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function formatarMoeda(valor) {
    if (!isFinite(valor)) return "—";
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function formatarQtd(valor, unidade) {
    const n = Number(valor);
    const texto = Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(".", ",");
    return `${texto} ${UNIDADE_LABEL[unidade] || ""}`.trim();
  }

  /* ============================================================
     ESTADO + PERSISTÊNCIA
     ============================================================ */

  function estadoPadrao() {
    return { nome: "", ingredientes: [], receitas: [] };
  }

  let estado = carregarEstado();

  function carregarEstado() {
    try {
      const bruto = localStorage.getItem(STORAGE_KEY);
      if (!bruto) return estadoPadrao();
      const dados = JSON.parse(bruto);
      return Object.assign(estadoPadrao(), dados);
    } catch (e) {
      console.warn("Não foi possível ler os dados salvos, começando do zero.", e);
      return estadoPadrao();
    }
  }

  function salvarEstado() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    } catch (e) {
      mostrarToast("Não foi possível salvar seus dados neste navegador.", true);
    }
  }

  /* ============================================================
     ELEMENTOS
     ============================================================ */

  const $ = (sel) => document.querySelector(sel);
  const $all = (sel) => Array.from(document.querySelectorAll(sel));

  const telaEntrada = $("#tela-entrada");
  const appPrincipal = $("#app-principal");
  const formNome = $("#form-nome");
  const inputNome = $("#input-nome");
  const saudacaoNome = $("#saudacao-nome");
  const fraseBoasVindas = $("#frase-boasvindas");

  const toast = $("#toast");

  /* ============================================================
     TOAST
     ============================================================ */

  let toastTimer = null;
  function mostrarToast(mensagem, erro) {
    clearTimeout(toastTimer);
    toast.textContent = mensagem;
    toast.classList.toggle("toast-erro", !!erro);
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
  }

  function marcarErro(elemento) {
    elemento.classList.add("campo-erro");
    elemento.addEventListener("input", function limpar() {
      elemento.classList.remove("campo-erro");
      elemento.removeEventListener("input", limpar);
    }, { once: true });
  }

  /* ============================================================
     TELA DE ENTRADA / SAUDAÇÃO / TROCAR NOME
     ============================================================ */

  function iniciarApp() {
    if (estado.nome) {
      mostrarAppPrincipal();
    } else {
      telaEntrada.classList.add("tela-ativa");
      appPrincipal.classList.remove("tela-ativa");
    }
  }

  function mostrarAppPrincipal() {
    telaEntrada.classList.remove("tela-ativa");
    appPrincipal.classList.add("tela-ativa");
    saudacaoNome.textContent = `Olá, ${estado.nome}!`;
    fraseBoasVindas.textContent = `Olá, ${estado.nome}! Vamos descobrir quanto seus biscoitos podem render?`;
    renderizarIngredientes();
    renderizarSelectReceitas();
    renderizarHistorico();
    atualizarPainelResultados();
  }

  formNome.addEventListener("submit", function (e) {
    e.preventDefault();
    const nome = inputNome.value.trim();
    if (!nome) { marcarErro(inputNome); return; }
    estado.nome = nome;
    salvarEstado();
    mostrarAppPrincipal();
  });

  $("#btn-trocar-nome").addEventListener("click", function () {
    $("#input-novo-nome").value = estado.nome;
    abrirModal("#modal-trocar-nome");
  });

  $("#form-trocar-nome").addEventListener("submit", function (e) {
    e.preventDefault();
    const novo = $("#input-novo-nome").value.trim();
    if (!novo) return;
    estado.nome = novo;
    salvarEstado();
    saudacaoNome.textContent = `Olá, ${estado.nome}!`;
    fecharModal("#modal-trocar-nome");
    mostrarToast("Nome atualizado.");
  });

  $("#btn-cancelar-nome").addEventListener("click", () => fecharModal("#modal-trocar-nome"));

  /* ============================================================
     MODAIS (genérico)
     ============================================================ */

  function abrirModal(sel) { $(sel).hidden = false; }
  function fecharModal(sel) { $(sel).hidden = true; }

  $all(".modal").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) modal.hidden = true;
    });
  });

  let confirmarCallback = null;
  function pedirConfirmacao(titulo, texto, callback) {
    $("#confirmar-titulo").textContent = titulo;
    $("#confirmar-texto").textContent = texto;
    confirmarCallback = callback;
    abrirModal("#modal-confirmar");
  }
  $("#btn-confirmar-sim").addEventListener("click", function () {
    fecharModal("#modal-confirmar");
    if (confirmarCallback) confirmarCallback();
    confirmarCallback = null;
  });
  $("#btn-confirmar-nao").addEventListener("click", function () {
    fecharModal("#modal-confirmar");
    confirmarCallback = null;
  });

  /* ============================================================
     ABAS
     ============================================================ */

  $all(".aba").forEach((botao) => {
    botao.addEventListener("click", function () {
      const alvo = botao.dataset.aba;
      $all(".aba").forEach((b) => b.classList.remove("aba-ativa"));
      botao.classList.add("aba-ativa");
      $all(".painel").forEach((p) => p.classList.remove("painel-ativo"));
      $(`#painel-${alvo}`).classList.add("painel-ativo");
      if (alvo === "resultados") atualizarPainelResultados();
      if (alvo === "receita") atualizarAvisoIngredientesReceita();
    });
  });

  function irParaAba(nomeAba) {
    const botao = $all(".aba").find((b) => b.dataset.aba === nomeAba);
    if (botao) botao.click();
  }

  /* ============================================================
     INGREDIENTES
     ============================================================ */

  const formIngrediente = $("#form-ingrediente");
  const listaIngredientesEl = $("#lista-ingredientes");
  const vazioIngredientes = $("#vazio-ingredientes");

  function custoPorUnidadeBase(ingrediente) {
    const qtdBase = Number(ingrediente.qtdComprada) * PARA_BASE[ingrediente.unidade];
    if (!qtdBase) return 0;
    return Number(ingrediente.preco) / qtdBase;
  }

  function renderizarIngredientes() {
    listaIngredientesEl.innerHTML = "";
    vazioIngredientes.hidden = estado.ingredientes.length > 0;

    estado.ingredientes.forEach((ing) => {
      const precoBase = custoPorUnidadeBase(ing);
      const card = document.createElement("div");
      card.className = "cartao-item";
      card.innerHTML = `
        <div class="cartao-item-info">
          <div class="cartao-item-titulo">${escapeHtml(ing.nome)}</div>
          <div class="cartao-item-sub">
            ${formatarQtd(ing.qtdComprada, ing.unidade)} por ${formatarMoeda(Number(ing.preco))}
            — ${formatarMoeda(precoBase)} por ${UNIDADE_LABEL[ing.unidade === "kg" ? "g" : ing.unidade === "l" ? "ml" : ing.unidade]}
          </div>
        </div>
        <div class="cartao-item-acoes">
          <button type="button" class="btn-mini" title="Editar" data-acao="editar">✏️</button>
          <button type="button" class="btn-mini perigo" title="Excluir" data-acao="excluir">🗑</button>
        </div>`;
      card.querySelector('[data-acao="editar"]').addEventListener("click", () => editarIngrediente(ing.id));
      card.querySelector('[data-acao="excluir"]').addEventListener("click", () => excluirIngrediente(ing.id));
      listaIngredientesEl.appendChild(card);
    });

    refrescarSelectsIngredientesReceita();
  }

  function escapeHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
  }

  formIngrediente.addEventListener("submit", function (e) {
    e.preventDefault();
    const nome = $("#ing-nome").value.trim();
    const qtd = parseFloat($("#ing-qtd-comprada").value);
    const unidade = $("#ing-unidade").value;
    const preco = parseFloat($("#ing-preco").value);
    const editandoId = $("#ing-editando-id").value;

    let valido = true;
    if (!nome) { marcarErro($("#ing-nome")); valido = false; }
    if (!(qtd > 0)) { marcarErro($("#ing-qtd-comprada")); valido = false; }
    if (!(preco >= 0) || isNaN(preco)) { marcarErro($("#ing-preco")); valido = false; }
    if (!valido) { mostrarToast("Confira os campos destacados.", true); return; }

    if (editandoId) {
      const ing = estado.ingredientes.find((i) => i.id === editandoId);
      Object.assign(ing, { nome, qtdComprada: qtd, unidade, preco });
      mostrarToast("Ingrediente atualizado.");
    } else {
      estado.ingredientes.push({ id: novoId(), nome, qtdComprada: qtd, unidade, preco });
      mostrarToast("Ingrediente adicionado.");
    }
    salvarEstado();
    formIngrediente.reset();
    $("#ing-editando-id").value = "";
    $("#btn-salvar-ingrediente").textContent = "Adicionar ingrediente";
    renderizarIngredientes();
  });

  function editarIngrediente(id) {
    const ing = estado.ingredientes.find((i) => i.id === id);
    if (!ing) return;
    $("#ing-nome").value = ing.nome;
    $("#ing-qtd-comprada").value = ing.qtdComprada;
    $("#ing-unidade").value = ing.unidade;
    $("#ing-preco").value = ing.preco;
    $("#ing-editando-id").value = id;
    $("#btn-salvar-ingrediente").textContent = "Salvar alterações";
    $("#ing-nome").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function excluirIngrediente(id) {
    pedirConfirmacao(
      "Excluir ingrediente",
      "Tem certeza? Receitas que já usam esse ingrediente manterão o custo calculado anteriormente.",
      function () {
        estado.ingredientes = estado.ingredientes.filter((i) => i.id !== id);
        salvarEstado();
        renderizarIngredientes();
        mostrarToast("Ingrediente excluído.");
      }
    );
  }

  /* ============================================================
     RECEITA — itens dinâmicos
     ============================================================ */

  const formReceita = $("#form-receita");
  const listaItensReceita = $("#lista-ingredientes-receita");
  const avisoSemIngredientes = $("#vazio-ingredientes-receita-aviso");

  function atualizarAvisoIngredientesReceita() {
    avisoSemIngredientes.hidden = estado.ingredientes.length > 0;
    $("#btn-add-item-receita").disabled = estado.ingredientes.length === 0;
  }

  function opcoesIngredientesHtml(selecionadoId) {
    return estado.ingredientes.map((ing) =>
      `<option value="${ing.id}" ${ing.id === selecionadoId ? "selected" : ""}>${escapeHtml(ing.nome)}</option>`
    ).join("");
  }

  function opcoesUnidadeHtml(grupo, selecionada) {
    return GRUPO_UNIDADES[grupo].map((u) =>
      `<option value="${u}" ${u === selecionada ? "selected" : ""}>${UNIDADE_LABEL[u]}</option>`
    ).join("");
  }

  function criarLinhaItemReceita(dadosIniciais) {
    if (estado.ingredientes.length === 0) {
      mostrarToast("Cadastre ao menos um ingrediente primeiro.", true);
      return;
    }
    const linha = document.createElement("div");
    linha.className = "linha-item-receita";
    const ingredienteSelecionado = (dadosIniciais && dadosIniciais.ingredienteId) || estado.ingredientes[0].id;
    const ing = estado.ingredientes.find((i) => i.id === ingredienteSelecionado) || estado.ingredientes[0];
    const grupo = UNIDADE_GRUPO[ing.unidade];
    const unidadeSelecionada = (dadosIniciais && dadosIniciais.unidade) || ing.unidade;

    linha.innerHTML = `
      <select class="item-receita-ingrediente">${opcoesIngredientesHtml(ingredienteSelecionado)}</select>
      <div style="display:flex; gap:4px;">
        <input type="number" class="item-receita-qtd" min="0" step="0.01" placeholder="Qtd"
               value="${dadosIniciais ? dadosIniciais.quantidade : ""}" style="width:60%">
        <select class="item-receita-unidade" style="width:40%">${opcoesUnidadeHtml(grupo, unidadeSelecionada)}</select>
      </div>
      <button type="button" class="btn-mini perigo" title="Remover">✕</button>`;

    linha.querySelector(".item-receita-ingrediente").addEventListener("change", function () {
      const novoIng = estado.ingredientes.find((i) => i.id === this.value);
      const novoGrupo = UNIDADE_GRUPO[novoIng.unidade];
      linha.querySelector(".item-receita-unidade").innerHTML = opcoesUnidadeHtml(novoGrupo, novoIng.unidade);
    });

    linha.querySelector(".btn-mini").addEventListener("click", function () {
      linha.remove();
    });

    listaItensReceita.appendChild(linha);
  }

  $("#btn-add-item-receita").addEventListener("click", () => criarLinhaItemReceita());

  function refrescarSelectsIngredientesReceita() {
    atualizarAvisoIngredientesReceita();
    $all(".item-receita-ingrediente").forEach((select) => {
      const atual = select.value;
      select.innerHTML = opcoesIngredientesHtml(atual);
    });
  }

  function lerItensReceitaDoFormulario() {
    return $all(".linha-item-receita").map((linha) => ({
      ingredienteId: linha.querySelector(".item-receita-ingrediente").value,
      quantidade: parseFloat(linha.querySelector(".item-receita-qtd").value),
      unidade: linha.querySelector(".item-receita-unidade").value
    }));
  }

  function calcularCustoReceita(itens) {
    let custoTotal = 0;
    const detalhes = [];
    for (const item of itens) {
      const ing = estado.ingredientes.find((i) => i.id === item.ingredienteId);
      if (!ing || !(item.quantidade > 0)) continue;
      const precoBase = custoPorUnidadeBase(ing);
      const qtdEmBase = item.quantidade * PARA_BASE[item.unidade];
      const custoItem = qtdEmBase * precoBase;
      custoTotal += custoItem;
      detalhes.push({ nome: ing.nome, custo: custoItem });
    }
    return { custoTotal, detalhes };
  }

  formReceita.addEventListener("submit", function (e) {
    e.preventDefault();
    const nome = $("#receita-nome").value.trim();
    const rendimento = parseInt($("#receita-rendimento").value, 10);
    const itens = lerItensReceitaDoFormulario();
    const editandoId = $("#receita-editando-id").value;

    let valido = true;
    if (!nome) { marcarErro($("#receita-nome")); valido = false; }
    if (!(rendimento > 0)) { marcarErro($("#receita-rendimento")); valido = false; }
    if (itens.length === 0) { mostrarToast("Adicione ao menos um ingrediente à receita.", true); valido = false; }
    for (const item of itens) {
      if (!(item.quantidade > 0)) {
        mostrarToast("Confira as quantidades dos ingredientes da receita — não podem ser zero ou negativas.", true);
        valido = false;
        break;
      }
    }
    if (!valido) return;

    const { custoTotal } = calcularCustoReceita(itens);
    const custoUnidade = custoTotal / rendimento;

    let receita;
    if (editandoId) {
      receita = estado.receitas.find((r) => r.id === editandoId);
      Object.assign(receita, { nome, itens, rendimento, custoTotal, custoUnidade });
      mostrarToast("Receita atualizada.");
    } else {
      receita = { id: novoId(), nome, itens, rendimento, custoTotal, custoUnidade, criadoEm: Date.now(), precoConfig: null };
      estado.receitas.push(receita);
      mostrarToast("Receita calculada e salva.");
    }
    salvarEstado();

    $("#rr-custo-total").textContent = formatarMoeda(custoTotal);
    $("#rr-rendimento").textContent = `${rendimento} biscoitos`;
    $("#rr-custo-unidade").textContent = formatarMoeda(custoUnidade);
    $("#resumo-receita-calculada").hidden = false;

    $("#receita-editando-id").value = receita.id;
    $("#btn-salvar-receita").textContent = "Salvar alterações";

    renderizarSelectReceitas();
    renderizarHistorico();
  });

  /* ============================================================
     PREÇO — custos adicionais dinâmicos
     ============================================================ */

  const listaCustosAdicionais = $("#lista-custos-adicionais");

  function criarLinhaCusto(dados) {
    const linha = document.createElement("div");
    linha.className = "linha-custo";
    linha.innerHTML = `
      <input type="text" class="custo-nome" placeholder="Ex: Gás, mão de obra..." value="${dados ? escapeHtml(dados.nome) : ""}">
      <input type="number" class="custo-valor" min="0" step="0.01" placeholder="R$" value="${dados ? dados.valor : ""}">
      <button type="button" class="btn-mini perigo" title="Remover">✕</button>`;
    linha.querySelector(".btn-mini").addEventListener("click", () => linha.remove());
    listaCustosAdicionais.appendChild(linha);
  }

  $("#btn-add-custo").addEventListener("click", () => criarLinhaCusto());

  function lerCustosAdicionaisDoFormulario() {
    return $all(".linha-custo").map((linha) => ({
      nome: linha.querySelector(".custo-nome").value.trim() || "Custo adicional",
      valor: parseFloat(linha.querySelector(".custo-valor").value) || 0
    })).filter((c) => c.valor > 0);
  }

  function renderizarSelectReceitas() {
    const select = $("#preco-receita");
    const atual = select.value;
    select.innerHTML = '<option value="">Selecione uma receita calculada</option>' +
      estado.receitas.map((r) => `<option value="${r.id}" ${r.id === atual ? "selected" : ""}>${escapeHtml(r.nome)}</option>`).join("");
  }

  let ultimoResultado = null; // guarda o último cálculo de resultados para o painel

  const formPreco = $("#form-preco");

  formPreco.addEventListener("submit", function (e) {
    e.preventDefault();

    const receitaId = $("#preco-receita").value;
    const receita = estado.receitas.find((r) => r.id === receitaId);
    if (!receita) { marcarErro($("#preco-receita")); mostrarToast("Selecione uma receita calculada.", true); return; }

    const tipoVenda = $("#preco-tipo-venda").value;
    const qtdEmbalagem = parseInt($("#preco-qtd-embalagem").value, 10);
    const custoEmbalagemFisica = parseFloat($("#preco-custo-embalagem").value) || 0;
    const margem = parseFloat($("#preco-margem").value);
    const taxa = parseFloat($("#preco-taxa").value) || 0;

    let valido = true;
    if (!(qtdEmbalagem > 0)) { marcarErro($("#preco-qtd-embalagem")); valido = false; }
    if (!(margem >= 0) || isNaN(margem)) { marcarErro($("#preco-margem")); valido = false; }
    if (margem + taxa >= 100) {
      mostrarToast("Margem + taxas não podem somar 100% ou mais. Ajuste os valores.", true);
      marcarErro($("#preco-margem"));
      valido = false;
    }
    if (!valido) return;

    const custosAdicionais = lerCustosAdicionaisDoFormulario();
    const somaCustosAdicionais = custosAdicionais.reduce((soma, c) => soma + c.valor, 0);

    // custo total de produção do lote = custo dos ingredientes da receita inteira + custos adicionais do lote
    const custoProducaoTotalLote = receita.custoTotal + somaCustosAdicionais;
    const custoProducaoPorBiscoito = custoProducaoTotalLote / receita.rendimento;

    const custoPorEmbalagem = (custoProducaoPorBiscoito * qtdEmbalagem) + custoEmbalagemFisica;

    const divisor = 1 - (margem + taxa) / 100;
    const precoVenda = custoPorEmbalagem / divisor;
    const lucroPorVenda = precoVenda - custoPorEmbalagem;
    const quantidadeEmbalagensProduzidas = Math.floor(receita.rendimento / qtdEmbalagem);
    const lucroPotencialTotal = lucroPorVenda * quantidadeEmbalagensProduzidas;

    const rotuloTipo = { unidade: "unidade", caixa: "caixa", pacote: "pacote", kit: "kit" }[tipoVenda];

    $("#explicacao-calculo").innerHTML =
      `Cada ${rotuloTipo} leva ${qtdEmbalagem} biscoito(s), custando ${formatarMoeda(custoPorEmbalagem)} no total ` +
      `(ingredientes + custos extras rateados + embalagem). Para garantir ${margem}% de margem` +
      (taxa > 0 ? ` e cobrir ${taxa}% de taxas` : "") +
      `, o preço de venda é o custo dividido por (1 − ${((margem + taxa) / 100).toFixed(2).replace(".", ",")}).`;

    $("#pr-custo-total").textContent = formatarMoeda(custoPorEmbalagem);
    $("#pr-custo-unidade").textContent = formatarMoeda(custoProducaoPorBiscoito);
    $("#pr-preco-venda").textContent = formatarMoeda(precoVenda);
    $("#pr-lucro").textContent = formatarMoeda(lucroPorVenda);
    $("#resumo-preco-calculado").hidden = false;

    receita.precoConfig = {
      tipoVenda, qtdEmbalagem, custoEmbalagemFisica, margem, taxa, custosAdicionais
    };
    salvarEstado();

    ultimoResultado = {
      custoProducao: custoPorEmbalagem,
      precoVenda,
      lucroEstimado: lucroPorVenda,
      quantidadeProduzida: quantidadeEmbalagensProduzidas,
      lucroPotencialTotal
    };

    renderizarHistorico();
  });

  $("#btn-ver-resultados").addEventListener("click", function () {
    irParaAba("resultados");
  });

  function atualizarPainelResultados() {
    if (!ultimoResultado) {
      $("#resultados-vazio").hidden = false;
      $("#resultados-conteudo").hidden = true;
      $("#nota-estimativa").hidden = true;
      return;
    }
    $("#resultados-vazio").hidden = true;
    $("#resultados-conteudo").hidden = false;
    $("#nota-estimativa").hidden = false;
    $("#res-custo").textContent = formatarMoeda(ultimoResultado.custoProducao);
    $("#res-preco").textContent = formatarMoeda(ultimoResultado.precoVenda);
    $("#res-lucro").textContent = formatarMoeda(ultimoResultado.lucroEstimado);
    $("#res-qtd").textContent = `${ultimoResultado.quantidadeProduzida} embalagens`;
    $("#res-lucro-total").textContent = formatarMoeda(ultimoResultado.lucroPotencialTotal);
  }

  /* ============================================================
     HISTÓRICO
     ============================================================ */

  function renderizarHistorico() {
    const lista = $("#lista-historico");
    lista.innerHTML = "";
    $("#vazio-historico").hidden = estado.receitas.length > 0;

    estado.receitas.slice().reverse().forEach((r) => {
      const card = document.createElement("div");
      card.className = "cartao-item";
      const temPreco = !!r.precoConfig;
      card.innerHTML = `
        <div class="cartao-item-info">
          <div class="cartao-item-titulo">${escapeHtml(r.nome)}</div>
          <div class="cartao-item-sub">
            Rende ${r.rendimento} biscoitos · custo ${formatarMoeda(r.custoUnidade)}/un
            ${temPreco ? ` · preço já calculado` : ""}
          </div>
        </div>
        <div class="cartao-item-acoes">
          <button type="button" class="btn-mini" title="Abrir">📂</button>
          <button type="button" class="btn-mini" title="Duplicar">📄</button>
          <button type="button" class="btn-mini perigo" title="Excluir">🗑</button>
        </div>`;
      const [btnAbrir, btnDuplicar, btnExcluir] = card.querySelectorAll(".btn-mini");
      btnAbrir.addEventListener("click", () => abrirReceita(r.id));
      btnDuplicar.addEventListener("click", () => duplicarReceita(r.id));
      btnExcluir.addEventListener("click", () => excluirReceita(r.id));
      lista.appendChild(card);
    });
  }

  function preencherFormularioReceita(receita) {
    $("#receita-nome").value = receita.nome;
    $("#receita-rendimento").value = receita.rendimento;
    listaItensReceita.innerHTML = "";
    receita.itens.forEach((item) => criarLinhaItemReceita(item));
    $("#receita-editando-id").value = receita.id;
    $("#btn-salvar-receita").textContent = "Salvar alterações";
    $("#rr-custo-total").textContent = formatarMoeda(receita.custoTotal);
    $("#rr-rendimento").textContent = `${receita.rendimento} biscoitos`;
    $("#rr-custo-unidade").textContent = formatarMoeda(receita.custoUnidade);
    $("#resumo-receita-calculada").hidden = false;
  }

  function abrirReceita(id) {
    const receita = estado.receitas.find((r) => r.id === id);
    if (!receita) return;
    preencherFormularioReceita(receita);

    if (receita.precoConfig) {
      const cfg = receita.precoConfig;
      $("#preco-receita").value = receita.id;
      $("#preco-tipo-venda").value = cfg.tipoVenda;
      $("#preco-qtd-embalagem").value = cfg.qtdEmbalagem;
      $("#preco-custo-embalagem").value = cfg.custoEmbalagemFisica || "";
      $("#preco-margem").value = cfg.margem;
      $("#preco-taxa").value = cfg.taxa || "";
      listaCustosAdicionais.innerHTML = "";
      (cfg.custosAdicionais || []).forEach((c) => criarLinhaCusto(c));
      irParaAba("preco");
      formPreco.requestSubmit();
    } else {
      renderizarSelectReceitas();
      $("#preco-receita").value = receita.id;
      irParaAba("preco");
    }
    mostrarToast(`Receita "${receita.nome}" aberta.`);
  }

  function duplicarReceita(id) {
    const original = estado.receitas.find((r) => r.id === id);
    if (!original) return;
    const copia = JSON.parse(JSON.stringify(original));
    copia.id = novoId();
    copia.nome = original.nome + " (cópia)";
    copia.criadoEm = Date.now();
    estado.receitas.push(copia);
    salvarEstado();
    renderizarSelectReceitas();
    renderizarHistorico();
    mostrarToast("Receita duplicada.");
  }

  function excluirReceita(id) {
    const receita = estado.receitas.find((r) => r.id === id);
    if (!receita) return;
    pedirConfirmacao(
      "Excluir receita",
      `Tem certeza que deseja excluir "${receita.nome}"? Essa ação não pode ser desfeita.`,
      function () {
        estado.receitas = estado.receitas.filter((r) => r.id !== id);
        salvarEstado();
        renderizarSelectReceitas();
        renderizarHistorico();
        mostrarToast("Receita excluída.");
      }
    );
  }

  /* ============================================================
     PRIVACIDADE: EXPORTAR / IMPORTAR / APAGAR
     ============================================================ */

  $("#btn-abrir-privacidade").addEventListener("click", () => abrirModal("#modal-privacidade"));
  $("#btn-fechar-privacidade").addEventListener("click", () => fecharModal("#modal-privacidade"));

  $("#btn-exportar-dados").addEventListener("click", function () {
    const blob = new Blob([JSON.stringify(estado, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const data = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `minha-calculadora-de-lucro-${data}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    mostrarToast("Seus dados foram exportados.");
  });

  $("#input-importar-dados").addEventListener("change", function (e) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = function () {
      try {
        const dados = JSON.parse(leitor.result);
        if (typeof dados !== "object" || dados === null) throw new Error("formato inválido");
        estado = Object.assign(estadoPadrao(), dados);
        salvarEstado();
        mostrarToast("Dados importados com sucesso! Atualizando...");
        setTimeout(() => window.location.reload(), 900);
      } catch (err) {
        mostrarToast("Esse arquivo não parece ser um backup válido da calculadora.", true);
      }
    };
    leitor.readAsText(arquivo);
    e.target.value = "";
  });

  $("#btn-apagar-dados").addEventListener("click", function () {
    pedirConfirmacao(
      "Apagar todos os dados",
      "Isso vai excluir seu nome, ingredientes, receitas e históricos salvos neste navegador. Essa ação não pode ser desfeita. Deseja continuar?",
      function () {
        localStorage.removeItem(STORAGE_KEY);
        mostrarToast("Todos os dados foram apagados.");
        setTimeout(() => window.location.reload(), 600);
      }
    );
  });

  /* ============================================================
     INÍCIO
     ============================================================ */

  iniciarApp();
})();
