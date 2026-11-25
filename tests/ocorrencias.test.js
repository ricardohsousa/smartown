import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LIMITES,
  STATUS,
  alternarStatus,
  calcularResumo,
  contarPorCategoria,
  criarOcorrencia,
  filtrarOcorrencias,
  validarOcorrencia,
} from '../src/js/ocorrencias.js';

describe('Regras de Negócio - Ocorrências (src/js/ocorrencias.js)', () => {
  it('deve rejeitar ocorrência com campos obrigatórios vazios, curtos ou inválidos', () => {
    const resultado = validarOcorrencia({
      descricao: 'Curta',
      categoria: 'Inexistente',
      bairro: '123',
      urgencia: 'Urgentíssimo',
    });

    assert.equal(resultado.valido, false);
    assert.equal(resultado.erros.length, 4);
    assert.deepEqual(
      resultado.erros.map((e) => e.campo),
      ['categoria', 'descricao', 'bairro', 'urgencia'],
    );
  });

  it('deve validar ocorrência com dados dentro dos limites permitidos', () => {
    const resultado = validarOcorrencia({
      descricao: 'A'.repeat(LIMITES.descricaoMin),
      categoria: 'Iluminação Pública',
      bairro: 'Centro',
      urgencia: 'Alta',
    });

    assert.equal(resultado.valido, true);
    assert.equal(resultado.erros.length, 0);
  });

  it('deve cadastrar ocorrência válida normalizando espaços e inserindo no início da lista', () => {
    const existente = [
      {
        id: 'antigo-1',
        descricao: 'Buraco antigo na via',
        categoria: 'Buracos',
        bairro: 'Vila Nova',
        urgencia: 'Baixa',
        status: STATUS.ABERTA,
        criadaEm: '2026-11-24T10:00:00.000Z',
      },
    ];

    const novaLista = criarOcorrencia(existente, {
      descricao: '   Poste   apagado   na praça   ',
      categoria: 'Iluminação Pública',
      bairro: '  Jardim   América  ',
      urgencia: 'Alta',
    });

    assert.equal(novaLista.length, 2);
    assert.equal(novaLista[0].descricao, 'Poste apagado na praça');
    assert.equal(novaLista[0].bairro, 'Jardim América');
    assert.equal(novaLista[0].status, STATUS.ABERTA);
    assert.ok(novaLista[0].id);
    assert.equal(novaLista[1].id, 'antigo-1');
  });

  it('deve lançar erro com lista de campos ao tentar criar ocorrência inválida', () => {
    assert.throws(
      () =>
        criarOcorrencia([], {
          descricao: '',
          categoria: '',
          bairro: '',
          urgencia: '',
        }),
      (erro) => erro.message === 'Dados da ocorrência inválidos.' && Array.isArray(erro.erros),
    );
  });

  it('deve filtrar ocorrências por categoria, por status e por ambos combinados', () => {
    const base = [
      { id: '1', categoria: 'Buracos', status: STATUS.ABERTA },
      { id: '2', categoria: 'Descarte Irregular', status: STATUS.RESOLVIDA },
      { id: '3', categoria: 'Buracos', status: STATUS.RESOLVIDA },
    ];

    assert.equal(filtrarOcorrencias(base, {}).length, 3);
    assert.equal(filtrarOcorrencias(base, { categoria: 'Buracos' }).length, 2);
    assert.equal(filtrarOcorrencias(base, { status: STATUS.RESOLVIDA }).length, 2);

    const combinado = filtrarOcorrencias(base, {
      categoria: 'Buracos',
      status: STATUS.RESOLVIDA,
    });
    assert.equal(combinado.length, 1);
    assert.equal(combinado[0].id, '3');
  });

  it('deve alternar status entre Aberta e Resolvida e lançar erro para ID inexistente', () => {
    const base = [{ id: '10', status: STATUS.ABERTA }];

    const resolvida = alternarStatus(base, '10');
    assert.equal(resolvida[0].status, STATUS.RESOLVIDA);

    const reaberta = alternarStatus(resolvida, '10');
    assert.equal(reaberta[0].status, STATUS.ABERTA);

    assert.throws(() => alternarStatus(base, 'id-nao-existe'), /Ocorrência não encontrada/);
  });

  it('deve calcular corretamente o resumo quantitativo e a contagem por categoria', () => {
    const base = [
      { id: '1', categoria: 'Buracos', status: STATUS.ABERTA },
      { id: '2', categoria: 'Buracos', status: STATUS.RESOLVIDA },
      { id: '3', categoria: 'Iluminação Pública', status: STATUS.ABERTA },
    ];

    assert.deepEqual(calcularResumo(base), {
      total: 3,
      abertas: 2,
      resolvidas: 1,
    });

    assert.deepEqual(contarPorCategoria(base), {
      'Iluminação Pública': 1,
      Buracos: 2,
      'Descarte Irregular': 0,
      Outros: 0,
    });
  });
});