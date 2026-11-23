"""Testes dos 2 mapas do grupo (Parte 1, Secao 10)."""
from pathlib import Path

from src.graphs.io import mapa_input
from src.graphs.estados import ALVO, criar_grafo_estados, criar_estado_inicial
from src.graphs.algorithms import bfs, dijkstra, bellman_ford
from src.graphs.resultados import armadilhas, reconstruir

MAPAS_GRUPO = Path(__file__).resolve().parents[1] / 'data' / 'mapas_grupo'


def test_mapa_cofre_tem_3_chaves_esteira_e_bonus():
    mapa = mapa_input(MAPAS_GRUPO / 'mapa_grupo_cofre.txt')
    simbolos = {c for linha in mapa for c in linha}
    assert simbolos & set('abc') == set('abc')
    assert simbolos & set('><^v')
    assert '+' in simbolos


def test_mapa_cofre_caminho_de_menor_custo_passa_por_bonus_e_esteira():
    mapa = mapa_input(MAPAS_GRUPO / 'mapa_grupo_cofre.txt')
    grafo = criar_grafo_estados(mapa)
    inicial = criar_estado_inicial(mapa)

    _, p_dij = None, None
    tem_negativo = any(peso < 0 for arcos in grafo.values() for _, peso in arcos)
    assert tem_negativo  # o bonus garante peso negativo, como em m05/m06

    d, p, ciclo, custo = bellman_ford(grafo, inicial)
    assert ciclo is None and custo is None  # sem ciclo negativo: bonus so se paga uma vez

    caminho = reconstruir(p, ALVO)
    assert caminho and caminho[-1] == ALVO
    assert any(mapa[l][c] == '+' for l, c, *_ in caminho[:-1])
    assert any(mapa[l][c] in '><^v' for l, c, *_ in caminho[:-1])


def test_mapa_armadilha_tem_pelo_menos_20_porcento_de_estados_armadilha():
    mapa = mapa_input(MAPAS_GRUPO / 'mapa_grupo_armadilha.txt')
    grafo = criar_grafo_estados(mapa)
    total = len(grafo) - 1  # exclui o no virtual ALVO
    traps = armadilhas(grafo)
    assert len(traps) / total >= 0.20


def test_mapa_armadilha_bfs_e_dijkstra_ignoram_a_esteira():
    # BFS conta a aresta de custo 0 ate ALVO como mais um passo, por isso
    # d_bfs[ALVO] == d_dij[ALVO] + 1 aqui (todo o resto custa 1 por aresta).
    mapa = mapa_input(MAPAS_GRUPO / 'mapa_grupo_armadilha.txt')
    grafo = criar_grafo_estados(mapa)
    inicial = criar_estado_inicial(mapa)

    d_bfs, p_bfs = bfs(grafo, inicial)
    d_dij, p_dij = dijkstra(grafo, inicial)
    assert d_bfs[ALVO] == d_dij[ALVO] + 1

    for pred in (p_bfs, p_dij):
        caminho = reconstruir(pred, ALVO)
        assert not any(mapa[l][c] == 'v' for l, c, *_ in caminho[:-1])
