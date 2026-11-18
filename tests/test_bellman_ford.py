import math
import pytest
import networkx as nx

from src.graphs.algorithms import bellman_ford
from src.graphs.io import mapa_input
from src.graphs.estados import ALVO, criar_grafo_estados, criar_estado_inicial
from tests.test_dijkstra import MAPAS, MAPAS_SEM_NEGATIVOS, oraculo


def conferir_ciclo(grafo, ciclo, custo):
    assert ciclo is not None and len(ciclo) >= 2
    assert ciclo[0] == ciclo[-1]
    assert len(set(ciclo[:-1])) == len(ciclo) - 1
    total = 0
    for u, v in zip(ciclo, ciclo[1:]):
        pesos = [peso for vizinho, peso in grafo[u] if vizinho == v]
        assert pesos, f'O arco {u!r} -> {v!r} não existe'
        assert len(set(pesos)) == 1, 'Peso ambíguo em arestas paralelas'
        total += pesos[0]
    assert total == custo and custo < 0


def test_bellman_ford_pesos_negativos_sem_ciclo():
    g = {'s': [('a', 4), ('b', 5)], 'a': [('b', -7)], 'b': [('t', 2)], 't': []}
    d, p, ciclo, custo = bellman_ford(g, 's')
    assert d == {'s': 0, 'a': 4, 'b': -3, 't': -1}
    assert p['b'] == 'a' and p['t'] == 'b'
    assert ciclo is None and custo is None


def test_bellman_ford_ciclo_negativo_alcancavel():
    g = {'s': [('a', 1)], 'a': [('b', -3)], 'b': [('a', 1), ('t', 2)], 't': []}
    d, p, ciclo, custo = bellman_ford(g, 's')
    conferir_ciclo(g, ciclo, custo)
    assert set(ciclo[:-1]) == {'a', 'b'}


def test_bellman_ford_ciclo_negativo_inalcancavel_nao_afeta_origem():
    g = {'s': [('t', 2)], 't': [], 'x': [('y', -3)], 'y': [('x', 1)]}
    d, p, ciclo, custo = bellman_ford(g, 's')
    assert d['t'] == 2 and math.isinf(d['x']) and math.isinf(d['y'])
    assert ciclo is None and custo is None


def test_bellman_ford_origem_invalida():
    with pytest.raises(ValueError, match='origem'):
        bellman_ford({'a': []}, 'inexistente')


def test_bellman_ford_m05_peso_negativo_sem_ciclo():
    mapa = mapa_input(MAPAS / 'm05_bonus.txt')
    grafo = criar_grafo_estados(mapa)
    inicial = criar_estado_inicial(mapa)
    d, p, ciclo, custo = bellman_ford(grafo, inicial)
    assert ciclo is None and custo is None
    referencia = nx.single_source_bellman_ford_path_length(oraculo(grafo), inicial)
    assert all(d[v] == referencia.get(v, float('inf')) for v in grafo)


def test_bellman_ford_m06_detecta_ciclo_negativo_real():
    mapa = mapa_input(MAPAS / 'm06_fonte.txt')
    grafo = criar_grafo_estados(mapa)
    inicial = criar_estado_inicial(mapa)
    d, p, ciclo, custo = bellman_ford(grafo, inicial)
    conferir_ciclo(grafo, ciclo, custo)
    assert nx.negative_edge_cycle(oraculo(grafo), weight='weight')


@pytest.mark.parametrize('nome', MAPAS_SEM_NEGATIVOS)
def test_bellman_ford_mapas_sem_negativos_contra_oraculo(nome):
    mapa = mapa_input(MAPAS / f'{nome}.txt')
    grafo = criar_grafo_estados(mapa)
    inicial = criar_estado_inicial(mapa)
    d, p, ciclo, custo = bellman_ford(grafo, inicial)
    assert ciclo is None and custo is None
    ref = nx.single_source_bellman_ford_path_length(oraculo(grafo), inicial)
    assert all(d[v] == ref.get(v, float('inf')) for v in grafo)
    if nome == 'm07_impossivel':
        assert math.isinf(d[ALVO])


def test_integracao_resolver_bellman_ford_ciclo_m06():
    from src.solve import resolver
    resultado = resolver(MAPAS / 'm06_fonte.txt', 'BELLMAN_FORD')
    assert resultado['status'] == 'CICLO_NEGATIVO'
    assert resultado['custo'] < 0
    assert resultado['caminho'][0] == resultado['caminho'][-1]


def test_integracao_resolver_bellman_ford_sem_solucao_m07():
    from src.solve import resolver
    resultado = resolver(MAPAS / 'm07_impossivel.txt', 'BELLMAN_FORD')
    assert resultado['status'] == 'SEM_SOLUCAO'
