from pathlib import Path
import pytest
import networkx as nx
from src.graphs.algorithms import dfs
from src.graphs.io import mapa_input
from src.graphs.estados import criar_grafo_estados, criar_estado_inicial
from tests.test_bfs import ref_grafo, NOMES, MAPAS


def test_dfs_as_quatro_classes_de_arestas():
    # A ordem dos vizinhos é determinante para a classificação.
    grafo = {'s': [('a', 1), ('b', 1), ('c', 1)],
             'a': [('s', 1), ('c', 1)], 'c': [], 'b': [('a', 1)]}
    d, f, p, arcos, ciclo = dfs(grafo, 's')
    assert arcos['arvore'] == [('s', 'a'), ('a', 'c'), ('s', 'b')]
    assert arcos['retorno'] == [('a', 's')]
    assert arcos['avanco'] == [('s', 'c')]
    assert arcos['cruzamento'] == [('b', 'a')]
    assert ciclo is True
    assert all(d[v] < f[v] for v in grafo)
    assert p['a'] == 's' and p['c'] == 'a' and p['b'] == 's'


def test_dfs_sem_ciclo_e_com_vertice_inalcancavel():
    grafo = {'s': [('a', 1)], 'a': [('b', 1)], 'b': [], 'isolado': []}
    d, f, p, arcos, ciclo = dfs(grafo, 's')
    assert not ciclo
    assert arcos['arvore'] == [('s', 'a'), ('a', 'b')]
    assert all(not arcos[t] for t in ('retorno', 'avanco', 'cruzamento'))
    assert (d['isolado'], f['isolado'], p['isolado']) == (None, None, None)


def test_dfs_ciclo_por_retorno():
    grafo = {'s': [('a', 1)], 'a': [('b', 1)], 'b': [('s', 1)]}
    d, f, p, arcos, ciclo = dfs(grafo, 's')
    assert ciclo and ('b', 's') in arcos['retorno']


@pytest.mark.parametrize('nome', NOMES)
def test_dfs_mapas_integridade_tempos_e_classes(nome):
    mapa = mapa_input(MAPAS / (nome + '.txt'))
    grafo = criar_grafo_estados(mapa)
    inicial = criar_estado_inicial(mapa)
    d, f, p, arcos, ciclo = dfs(grafo, inicial)
    alcan = set(nx.descendants(ref_grafo(grafo), inicial)) | {inicial}
    assert all((d[v] is not None and f[v] is not None and d[v] < f[v]) for v in alcan)
    assert all((d[v] is None and f[v] is None) for v in set(grafo) - alcan)
    pares_grafo = {(u, v) for u, adj in grafo.items() for v, _ in adj}
    classes = [a for lista in arcos.values() for a in lista]
    assert len(classes) == len(set(classes))
    assert set(classes) == {(u, v) for u, v in pares_grafo if u in alcan}
    assert ciclo == bool(arcos['retorno'])
    for u, v in arcos['arvore']:
        assert p[v] == u and d[u] < d[v] < f[v] < f[u]
    for u, v in arcos['retorno']:
        assert d[v] <= d[u] < f[u] <= f[v]
    for u, v in arcos['avanco']:
        assert d[u] < d[v] < f[v] < f[u]
    for u, v in arcos['cruzamento']:
        assert not (d[u] < d[v] < f[v] < f[u])
        assert not (d[v] <= d[u] < f[u] <= f[v])
