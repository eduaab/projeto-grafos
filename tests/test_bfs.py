"""Testes de BFS — implementação do grupo, com oráculo externo só em tests/."""
from pathlib import Path
import pytest
import networkx as nx
from src.graphs.algorithms import bfs
from src.graphs.io import mapa_input
from src.graphs.estados import ALVO, criar_grafo_estados, criar_estado_inicial

MAPAS = Path(__file__).resolve().parents[1] / 'data' / 'mapas'
NOMES = ['m01_terreno', 'm02_uma_chave', 'm03_tres_chaves',
         'm04_esteiras', 'm05_bonus', 'm06_fonte', 'm07_impossivel', 'm08_grande']


def ref_grafo(grafo):
    g = nx.DiGraph()
    g.add_nodes_from(grafo)
    for u, adj in grafo.items():
        for v, _ in adj:
            g.add_edge(u, v)
    return g


def test_bfs_niveis_predecessores_e_desconectado():
    grafo = {'s': [('a', 8), ('b', -4)], 'a': [('c', 2)],
             'b': [('c', 0)], 'c': [('d', 3)], 'd': [], 'isolado': []}
    d, p = bfs(grafo, 's')
    assert d == {'s': 0, 'a': 1, 'b': 1, 'c': 2, 'd': 3, 'isolado': None}
    assert p == {'s': None, 'a': 's', 'b': 's', 'c': 'a', 'd': 'c', 'isolado': None}


def test_bfs_ciclo_nao_repete_visitas():
    grafo = {'s': [('a', 1)], 'a': [('s', 1), ('b', 1)], 'b': [('a', 1)]}
    d, p = bfs(grafo, 's')
    assert d == {'s': 0, 'a': 1, 'b': 2}
    assert p['s'] is None and p['b'] == 'a'


@pytest.mark.parametrize('nome', NOMES)
def test_bfs_mapas_oraculo_e_caminho(nome):
    mapa = mapa_input(MAPAS / (nome + '.txt'))
    grafo = criar_grafo_estados(mapa)
    inicial = criar_estado_inicial(mapa)
    d, p = bfs(grafo, inicial)
    ref = nx.single_source_shortest_path_length(ref_grafo(grafo), inicial)
    assert all(d[v] == ref.get(v) for v in grafo)
    for v in ref:
        if v == inicial:
            assert p[v] is None
        else:
            assert p[v] in grafo
            assert any(w == v for w, _ in grafo[p[v]])
            assert d[p[v]] == d[v] - 1
    if nome == 'm07_impossivel':
        assert d[ALVO] is None
