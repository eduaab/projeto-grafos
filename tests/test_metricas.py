import pytest

from src.graphs.metricas import calcular_metricas, grafo_posicoes, resumo_grafo, rotulo_estado


def test_resumo_vazio_e_simples():
    assert resumo_grafo({}) == {'ordem': 0, 'tamanho': 0, 'densidade': 0.0}
    assert resumo_grafo({'A': ['B'], 'B': ['A']}) == {
        'ordem': 2, 'tamanho': 2, 'densidade': 1.0}


def test_mapa_basico_sem_chaves():
    mapa = [list('#####'), list('#S.G#'), list('#####')]
    globais, info, graus = calcular_metricas(mapa)
    assert globais['G_pos']['ordem'] == 3
    assert globais['G_pos']['tamanho'] == 3  # S -> .; . -> S e G
    assert globais['G_est']['ordem'] == 3
    assert globais['G_est']['tamanho'] == 3  # sem contar G -> ALVO
    assert globais['teto_teorico'] == 3
    assert globais['taxa_ocupacao'] == 1
    assert info['camadas']['-']['ordem'] == 3
    assert info['total_arcos_entre_camadas'] == 0
    assert {x['estado']: x['grau_saida'] for x in graus}['(1,3)|-|{}'] == 0


def test_mapa_chave_transicao_e_conservacao():
    mapa = [list('######'), list('#SaAG#'), list('######')]
    globais, info, graus = calcular_metricas(mapa)
    assert globais['teto_teorico'] == 8
    assert info['total_arcos_entre_camadas'] >= 1
    assert sum(v['ordem'] for v in info['camadas'].values()) == globais['G_est']['ordem']
    assert (sum(v['tamanho'] for v in info['camadas'].values()) +
            info['total_arcos_entre_camadas'] == globais['G_est']['tamanho'])
    assert all(x['grau_saida'] >= 0 and x['grau_entrada'] >= 0 for x in graus)


def test_esteira_gera_beco_no_grafo_posicoes():
    mapa = [list('#####'), list('#S^G#'), list('#####')]
    pos = grafo_posicoes(mapa)
    assert pos[(1, 2)] == []


def test_rotulo_bonus_numerado():
    assert rotulo_estado((2, 5, 'ab', ((1, 2), (2, 3))), {(1, 2): 0, (2, 3): 2}) == '(2,5)|ab|{0,2}'
