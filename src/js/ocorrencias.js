export const CATEGORIAS = Object.freeze(['Iluminação Pública', 'Buracos', 'Descarte Irregular', 'Outros']);
export const URGENCIAS = Object.freeze(['Baixa', 'Média', 'Alta']);
export const STATUS = Object.freeze({ ABERTA: 'Aberta', RESOLVIDA: 'Resolvida' });
export const LIMITES = Object.freeze({ descricaoMin: 10, descricaoMax: 500, bairroMin: 2, bairroMax: 60 });

function normalizar(valor) {
  return typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ') : '';
}

export function validarOcorrencia(dados) {
  const { descricao, categoria, bairro, urgencia } = dados ?? {};
  const textoDescricao = normalizar(descricao);
  const textoBairro = normalizar(bairro);
  const erros = [];

  if (!CATEGORIAS.includes(categoria)) {
    erros.push({ campo: 'categoria', mensagem: 'Selecione uma categoria.' });
  }
  if (textoDescricao.length < LIMITES.descricaoMin || textoDescricao.length > LIMITES.descricaoMax) {
    erros.push({
      campo: 'descricao',
      mensagem: `Descreva o problema usando de ${LIMITES.descricaoMin} a ${LIMITES.descricaoMax} caracteres.`,
    });
  }
  if (
    textoBairro.length < LIMITES.bairroMin ||
    textoBairro.length > LIMITES.bairroMax ||
    !/\p{L}/u.test(textoBairro)
  ) {
    erros.push({ campo: 'bairro', mensagem: 'Informe o nome do bairro, por exemplo: Centro.' });
  }
  if (!URGENCIAS.includes(urgencia)) {
    erros.push({ campo: 'urgencia', mensagem: 'Escolha o nível de urgência.' });
  }

  return { valido: erros.length === 0, erros };
}

export function criarOcorrencia(lista, dados) {
  const { valido, erros } = validarOcorrencia(dados);
  if (!valido) {
    throw Object.assign(new Error('Dados da ocorrência inválidos.'), { erros });
  }

  const nova = {
    id: crypto.randomUUID(),
    descricao: normalizar(dados.descricao),
    categoria: dados.categoria,
    bairro: normalizar(dados.bairro),
    urgencia: dados.urgencia,
    status: 'Pendente',
    criadaEm: new Date().toISOString(),
  };
  return [nova, ...lista];
}

export function filtrarOcorrencias(lista, { categoria = '', status = '' } = {}) {
  return lista.filter(
    (item) => (!categoria || item.categoria === categoria) && (!status || item.status === status),
  );
}

export function alternarStatus(lista, id) {
  if (!lista.some((item) => item.id === id)) {
    throw new Error(`Ocorrência não encontrada: ${id}`);
  }
  return lista.map((item) =>
    item.id === id
      ? { ...item, status: item.status === STATUS.ABERTA ? STATUS.RESOLVIDA : STATUS.ABERTA }
      : item,
  );
}

export function calcularResumo(lista) {
  const abertas = lista.filter((item) => item.status === STATUS.ABERTA).length;
  return { total: lista.length, abertas, resolvidas: lista.length - abertas };
}

export function contarPorCategoria(lista) {
  return Object.fromEntries(
    CATEGORIAS.map((categoria) => [categoria, filtrarOcorrencias(lista, { categoria }).length]),
  );
}
