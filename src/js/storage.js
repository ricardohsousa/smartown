import { CATEGORIAS, STATUS, URGENCIAS } from './ocorrencias.js';

export const CHAVE = 'smartown:ocorrencias:v1';

function registroValido(item) {
  return (
    item !== null &&
    typeof item === 'object' &&
    ['id', 'descricao', 'bairro'].every((campo) => typeof item[campo] === 'string') &&
    CATEGORIAS.includes(item.categoria) &&
    URGENCIAS.includes(item.urgencia) &&
    Object.values(STATUS).includes(item.status)
  );
}

export function criarRepositorio(armazenamento) {
  return {
    carregar() {
      try {
        const dados = JSON.parse((armazenamento ?? globalThis.localStorage).getItem(CHAVE) ?? '[]');
        return Array.isArray(dados) ? dados.filter(registroValido) : [];
      } catch {
        return [];
      }
    },
    salvar(lista) {
      (armazenamento ?? globalThis.localStorage).setItem(CHAVE, JSON.stringify(lista));
    },
  };
}
