const CHAVE_OCORRENCIAS = 'smartown.ocorrencias';

function obterOcorrencias() {
  try {
    const ocorrencias = JSON.parse(localStorage.getItem(CHAVE_OCORRENCIAS) ?? '[]');
    return Array.isArray(ocorrencias) ? ocorrencias : [];
  } catch {
    return [];
  }
}

function adicionarCelula(linha, valor) {
  const celula = document.createElement('td');
  celula.textContent = valor;
  linha.append(celula);
}

function preencherTabela(corpo, ocorrencias, campos) {
  corpo.replaceChildren();

  for (const ocorrencia of ocorrencias) {
    const linha = document.createElement('tr');
    for (const campo of campos) adicionarCelula(linha, ocorrencia[campo]);
    corpo.append(linha);
  }
}

function inicializarPaginaInicial() {
  const botaoListar = document.querySelector('#botao-listar');
  const botaoResumo = document.querySelector('#botao-resumo');
  if (!botaoListar || !botaoResumo) return;

  const lista = document.querySelector('#lista-ocorrencias');
  const resumo = document.querySelector('#resumo-ocorrencias');
  const ocorrencias = obterOcorrencias();

  preencherTabela(document.querySelector('#linhas-lista'), ocorrencias, [
    'categoria', 'descricao', 'bairro', 'urgencia', 'status',
  ]);
  preencherTabela(document.querySelector('#linhas-resumo'), ocorrencias, [
    'categoria', 'descricao', 'status',
  ]);
  document.querySelector('#vazio-lista').hidden = ocorrencias.length > 0;
  document.querySelector('#vazio-resumo').hidden = ocorrencias.length > 0;

  botaoListar.addEventListener('click', () => {
    lista.hidden = !lista.hidden;
    resumo.hidden = true;
    botaoListar.setAttribute('aria-expanded', String(!lista.hidden));
    botaoResumo.setAttribute('aria-expanded', 'false');
  });

  botaoResumo.addEventListener('click', () => {
    resumo.hidden = !resumo.hidden;
    lista.hidden = true;
    botaoResumo.setAttribute('aria-expanded', String(!resumo.hidden));
    botaoListar.setAttribute('aria-expanded', 'false');
  });
}

function inicializarFormulario() {
  const formulario = document.querySelector('#formulario-registro');
  if (!formulario) return;

  const campoDescricao = formulario.elements.descricao;
  const contadorDescricao = document.querySelector('#contador-descricao');
  campoDescricao.addEventListener('input', () => {
    contadorDescricao.textContent = `${campoDescricao.value.length}/500 caracteres`;
  });

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const dados = new FormData(formulario);
    const ocorrencia = {
      categoria: formulario.elements.categoria.selectedOptions[0].textContent,
      descricao: dados.get('descricao').trim(),
      bairro: dados.get('bairro').trim(),
      urgencia: formulario.elements.urgencia.selectedOptions[0].textContent,
      status: 'Em andamento',
    };
    const ocorrencias = obterOcorrencias();
    ocorrencias.push(ocorrencia);

    try {
      localStorage.setItem(CHAVE_OCORRENCIAS, JSON.stringify(ocorrencias));
      window.location.href = 'index.html';
    } catch {
      document.querySelector('#mensagem-registro').textContent =
        'Não foi possível salvar a ocorrência neste navegador.';
    }
  });
}

async function mostrarVersao() {
  const resposta = await fetch('version.json', { cache: 'no-store' });
  if (!resposta.ok) return;
  const { version, commit } = await resposta.json();
  const elementoVersao = document.querySelector('#versao');
  if (elementoVersao) elementoVersao.textContent = `v${version} · ${commit.slice(0, 7)}`;
}

inicializarPaginaInicial();
inicializarFormulario();
mostrarVersao().catch(() => {});
