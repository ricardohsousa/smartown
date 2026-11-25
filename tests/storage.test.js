import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { STATUS } from '../src/js/ocorrencias.js';
import { CHAVE, criarRepositorio } from '../src/js/storage.js';

function criarStorageMemoria() {
  const mapa = new Map();
  return {
    getItem(chave) {
      return mapa.has(chave) ? mapa.get(chave) : null;
    },
    setItem(chave, valor) {
      mapa.set(chave, String(valor));
    },
  };
}

describe('Persistência - Repositório (src/js/storage.js)', () => {
  it('deve salvar e carregar ocorrências válidas no armazenamento', () => {
    const storage = criarStorageMemoria();
    const repo = criarRepositorio(storage);
    const lista = [
      {
        id: '1',
        descricao: 'Lixo acumulado na calçada',
        categoria: 'Descarte Irregular',
        bairro: 'Centro',
        urgencia: 'Média',
        status: STATUS.ABERTA,
      },
    ];

    repo.salvar(lista);
    assert.deepEqual(repo.carregar(), lista);
  });

  it('deve descartar registros corrompidos ou inválidos e lidar com JSON quebrado', () => {
    const storage = criarStorageMemoria();
    const repo = criarRepositorio(storage);

    storage.setItem(CHAVE, '{json-invalido');
    assert.deepEqual(repo.carregar(), []);

    storage.setItem(
      CHAVE,
      JSON.stringify([
        { id: 'valido', descricao: 'Poste apagado', bairro: 'Centro', categoria: 'Iluminação Pública', urgencia: 'Alta', status: STATUS.ABERTA },
        { id: 'invalido', descricao: 'Sem categoria válida', bairro: 'Centro', categoria: 'Errada', urgencia: 'Alta', status: STATUS.ABERTA },
      ]),
    );

    const carregados = repo.carregar();
    assert.equal(carregados.length, 1);
    assert.equal(carregados[0].id, 'valido');
  });
});