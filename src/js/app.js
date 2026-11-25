import {
  CATEGORIAS,
  LIMITES,
  STATUS,
  alternarStatus,
  calcularResumo,
  contarPorCategoria,
  criarOcorrencia,
  filtrarOcorrencias,
} from './ocorrencias.js';
import { CHAVE, criarRepositorio } from './storage.js';

const ICONES = {
  'Iluminação Pública': 'iluminacao',
  Buracos: 'buracos',
  'Descarte Irregular': 'descarte',
  Outros: 'outros',
};
const GRUPOS = ['categoria', 'urgencia'];
const CAMPOS = ['categoria', 'descricao', 'bairro', 'urgencia'];
const ERRO_AO_SALVAR = 'Não foi possível salvar neste navegador. Libere espaço ou permita dados do site e tente de novo.';

const repositorio = criarRepositorio();
const buscar = (seletor) => document.querySelector(seletor);

const formulario = buscar('#formulario');
const lista = buscar('#lista');
const vazio = buscar('#vazio');
const titulo = buscar('#titulo-lista');
const limpar = buscar('#limpar-filtros');
const filtroCategoria = buscar('#filtro-categoria');
const filtroStatus = buscar('#filtro-status');
const contador = buscar('#contador');
const avisoFormulario = buscar('#aviso-formulario');
const avisoLista = buscar('#aviso-lista');
const formatoData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

let ocorrencias = repositorio.carregar();

function elemento(tag, classe, texto) {
  const no = document.createElement(tag);
  if (classe) no.className = classe;
  if (texto !== undefined) no.textContent = texto;
  return no;
}

function criarIcone(categoria) {
  const espaco = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(espaco, 'svg');
  const uso = document.createElementNS(espaco, 'use');
  svg.setAttribute('class', 'icone');
  svg.setAttribute('aria-hidden', 'true');
  uso.setAttribute('href', `#icone-${ICONES[categoria]}`);
  svg.append(uso);
  return svg;
}

function statusFiltrado() {
  return filtroStatus.querySelector(':checked').value;
}

function limparFiltros() {
  filtroCategoria.value = '';
  filtroStatus.querySelector('[value=""]').checked = true;
}

function formatarData(valor) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? '' : formatoData.format(data);
}

function criarItem(ocorrencia) {
  const aberta = ocorrencia.status === STATUS.ABERTA;
  const item = elemento('li', `ocorrencia ${aberta ? 'ocorrencia--aberta' : 'ocorrencia--resolvida'}`);
  const topo = elemento('div', 'ocorrencia__topo');
  topo.append(
    elemento('h3', 'ocorrencia__categoria', ocorrencia.categoria),
    elemento('span', `urgencia urgencia--${ocorrencia.urgencia === 'Alta' ? 'alta' : 'normal'}`, `Urgência ${ocorrencia.urgencia.toLowerCase()}`),
    elemento('span', `status ${aberta ? 'status--aberta' : 'status--resolvida'}`, ocorrencia.status),
  );

  const local = elemento('p', 'ocorrencia__local');
  local.append(elemento('span', 'ocorrencia__bairro', ocorrencia.bairro));
  const data = formatarData(ocorrencia.criadaEm);
  if (data) local.append(elemento('span', '', data));

  const botao = elemento('button', aberta ? 'botao botao--linha' : 'botao botao--texto', aberta ? 'Marcar como resolvida' : 'Reabrir');
  botao.type = 'button';
  botao.dataset.id = ocorrencia.id;
  botao.setAttribute('aria-label', `${botao.textContent}: ${ocorrencia.categoria}, ${ocorrencia.bairro}`);

  const base = elemento('div', 'ocorrencia__base');
  base.append(local, botao);
  const marca = elemento('div', 'ocorrencia__icone');
  marca.append(criarIcone(ocorrencia.categoria));
  const corpo = elemento('div', 'ocorrencia__corpo');
  corpo.append(topo, elemento('p', 'ocorrencia__descricao', ocorrencia.descricao), base);
  item.append(marca, corpo);
  return item;
}

function renderizar() {
  const filtros = { categoria: filtroCategoria.value, status: statusFiltrado() };
  const visiveis = filtrarOcorrencias(ocorrencias, filtros);
  const resumo = calcularResumo(ocorrencias);

  lista.replaceChildren(...visiveis.map(criarItem));
  vazio.hidden = visiveis.length > 0;
  buscar('#vazio-texto').textContent = ocorrencias.length
    ? 'Nenhuma ocorrência corresponde aos filtros.'
    : 'Nenhuma ocorrência ainda. Registre a primeira no formulário acima.';
  limpar.hidden = !filtros.categoria && !filtros.status;

  for (const chave of ['total', 'abertas', 'resolvidas']) buscar(`#resumo-${chave}`).textContent = resumo[chave];
  buscar('#resumo-categorias').replaceChildren(
    ...Object.entries(contarPorCategoria(ocorrencias)).map(([categoria, quantidade]) => {
      const linha = elemento('li');
      const trilho = elemento('div', 'barras__trilho');
      const barra = elemento('div', 'barras__valor');
      barra.style.width = `${resumo.total ? (quantidade / resumo.total) * 100 : 0}%`;
      trilho.append(barra);
      linha.append(elemento('span', '', categoria), elemento('strong', '', quantidade), trilho);
      return linha;
    }),
  );
}

function salvar(nova) {
  try {
    repositorio.salvar(nova);
  } catch {
    return false;
  }
  ocorrencias = nova;
  renderizar();
  return true;
}

function mostrarErros(erros = []) {
  for (const campo of CAMPOS) {
    const mensagem = erros.find((erro) => erro.campo === campo)?.mensagem ?? '';
    buscar(`#erro-${campo}`).textContent = mensagem;
    const alvo = GRUPOS.includes(campo) ? buscar(`#grupo-${campo}`) : formulario.elements[campo];
    alvo.classList.toggle('invalido', Boolean(mensagem));
    if (!GRUPOS.includes(campo)) alvo.setAttribute('aria-invalid', String(Boolean(mensagem)));
  }
}

function focarErro(erros) {
  const { campo } = erros[0];
  const alvo = formulario.elements[campo];
  (GRUPOS.includes(campo) ? alvo[0] : alvo).focus();
}

function atualizarContador() {
  contador.textContent = `${formulario.elements.descricao.value.length}/${LIMITES.descricaoMax}`;
}

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  avisoFormulario.textContent = '';
  try {
    const nova = criarOcorrencia(repositorio.carregar(), Object.fromEntries(new FormData(formulario)));
    mostrarErros();
    limparFiltros();
    if (!salvar(nova)) {
      avisoFormulario.textContent = ERRO_AO_SALVAR;
      return;
    }
    lista.firstElementChild?.classList.add('ocorrencia--nova');
    formulario.reset();
    atualizarContador();
    avisoFormulario.textContent = 'Ocorrência registrada.';
  } catch (erro) {
    if (!erro.erros) throw erro;
    mostrarErros(erro.erros);
    focarErro(erro.erros);
  }
});

formulario.addEventListener('input', (evento) => {
  avisoFormulario.textContent = '';
  const campo = evento.target.name;
  if (campo === 'descricao') atualizarContador();
  if (!CAMPOS.includes(campo)) return;
  buscar(`#erro-${campo}`).textContent = '';
  const alvo = GRUPOS.includes(campo) ? buscar(`#grupo-${campo}`) : evento.target;
  alvo.classList.remove('invalido');
  if (!GRUPOS.includes(campo)) alvo.setAttribute('aria-invalid', 'false');
});

lista.addEventListener('click', (evento) => {
  const botao = evento.target.closest('button[data-id]');
  if (!botao) return;
  const { id } = botao.dataset;
  const atuais = repositorio.carregar();
  if (!atuais.some((item) => item.id === id)) {
    ocorrencias = atuais;
    renderizar();
    return;
  }
  const nova = alternarStatus(atuais, id);
  if (!salvar(nova)) {
    avisoLista.textContent = ERRO_AO_SALVAR;
    return;
  }
  const { status } = nova.find((item) => item.id === id);
  avisoLista.textContent = status === STATUS.RESOLVIDA ? 'Ocorrência marcada como resolvida.' : 'Ocorrência reaberta.';
  const mesmo = [...lista.querySelectorAll('button[data-id]')].find((no) => no.dataset.id === id);
  (mesmo ?? titulo).focus();
});

for (const filtro of [filtroCategoria, filtroStatus]) {
  filtro.addEventListener('change', () => {
    avisoLista.textContent = '';
    renderizar();
  });
}

limpar.addEventListener('click', () => {
  limparFiltros();
  renderizar();
  filtroCategoria.focus();
});

window.addEventListener('storage', (evento) => {
  if (evento.key !== CHAVE && evento.key !== null) return;
  ocorrencias = repositorio.carregar();
  renderizar();
});

async function mostrarVersao() {
  const resposta = await fetch('version.json', { cache: 'no-store' });
  if (!resposta.ok) return;
  const { version, commit } = await resposta.json();
  buscar('#versao').textContent = `v${version} (${commit.slice(0, 7)})`;
}

for (const categoria of CATEGORIAS) {
  filtroCategoria.append(new Option(categoria, categoria));
}
formulario.elements.descricao.maxLength = LIMITES.descricaoMax;
formulario.elements.bairro.maxLength = LIMITES.bairroMax;
atualizarContador();
renderizar();
mostrarVersao().catch(() => {});
