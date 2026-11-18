"""Validação de Dijkstra sem modificar a implementação do grupo.
NetworkX é utilizado apenas como oráculo nos testes, conforme o enunciado.
"""
from pathlib import Path
import pytest
import networkx as nx

from src.graphs.algorithms import dijkstra
from src.graphs.io import mapa_input
from src.graphs.estados import ALVO, criar_grafo_estados, criar_estado_inicial

MAPAS = Path(__file__).resolve().parents[1] / 'data' / 'mapas'
MAPAS_SEM_NEGATIVOS = ['m01_terreno', 'm02_uma_chave', 'm03_tres_chaves',
                      'm04_esteiras', 'm07_impossivel', 'm08_grande']


def oraculo(grafo):
    g = nx.DiGraph()
    g.add_nodes_from(grafo)
    for u, adj in grafo.items():
        for v, peso in adj:
            g.add_edge(u, v, weight=peso)
    return g


def conferir_predecessores(grafo, inicio, distancias, predecessores):
    assert distancias[inicio] == 0
    for v, valor in distancias.items():
        if valor is None:
            continue
        atual, vistos, custo = v, set(), 0
        while atual != inicio:
            assert atual not in vistos, 'Ciclo na cadeia de predecessores'
            vistos.add(atual)
            anterior = predecessores[atual]
            assert anterior in grafo
            pesos = [p for destino, p in grafo[anterior] if destino == atual]
            assert pesos, 'Predecessor sem arco correspondente'
            custo += pesos[0]
            atual = anterior
        assert custo == valor


def test_dijkstra_caminho_mais_barato_pode_ter_mais_passos():
    g = {'s': [('t', 10), ('a', 1)], 'a': [('b', 1)],
         'b': [('t', 1)], 't': []}
    d, p = dijkstra(g, 's')
    assert d['t'] == 3
    assert p['t'] == 'b' and p['b'] == 'a' and p['a'] == 's'


def test_dijkstra_peso_zero_e_desconectado():
    g = {'s': [('a', 0), ('b', 5)], 'a': [('b', 0)],
         'b': [], 'isolado': []}
    d, p = dijkstra(g, 's')
    assert d == {'s': 0, 'a': 0, 'b': 0, 'isolado': None}
    assert p['b'] == 'a'


def test_dijkstra_recusa_peso_negativo_mesmo_inalcancavel():
    g = {'s': [('a', 1)], 'a': [], 'x': [('y', -1)], 'y': []}
    with pytest.raises(ValueError, match='negativ'):
        dijkstra(g, 's')


def test_dijkstra_origem_invalida():
    with pytest.raises(ValueError, match='origem'):
        dijkstra({'a': []}, 'inexistente')


@pytest.mark.parametrize('nome', MAPAS_SEM_NEGATIVOS)
def test_dijkstra_mapas_contra_oraculo(nome):
    mapa = mapa_input(MAPAS / f'{nome}.txt')
    grafo = criar_grafo_estados(mapa)
    inicial = criar_estado_inicial(mapa)
    assert all(p >= 0 for adj in grafo.values() for _, p in adj)
    d, p = dijkstra(grafo, inicial)
    ref = nx.single_source_dijkstra_path_length(oraculo(grafo), inicial)
    assert all(d[v] == ref.get(v) for v in grafo)
    conferir_predecessores(grafo, inicial, d, p)
    if nome == 'm07_impossivel':
        assert d[ALVO] is None


@pytest.mark.parametrize('nome', ['m05_bonus', 'm06_fonte'])
def test_dijkstra_recusa_mapas_com_pesos_negativos(nome):
    mapa = mapa_input(MAPAS / f'{nome}.txt')
    grafo = criar_grafo_estados(mapa)
    assert any(p < 0 for adj in grafo.values() for _, p in adj)
    with pytest.raises(ValueError, match='negativ'):
        dijkstra(grafo, criar_estado_inicial(mapa))


def test_integracao_resolver_dijkstra_recusa_m05():
    from src.solve import resolver
    resultado = resolver(MAPAS / 'm05_bonus.txt', 'DIJKSTRA')
    assert resultado['status'] == 'RECUSA'


def test_integracao_resolver_dijkstra_sem_solucao_m07():
    from src.solve import resolver
    resultado = resolver(MAPAS / 'm07_impossivel.txt', 'DIJKSTRA')
    assert resultado['status'] == 'SEM_SOLUCAO'
