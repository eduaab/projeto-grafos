"""Regressões da instrumentação, sem substituir os testes dos algoritmos."""
import pytest

from src.exploracao import explorar
from src.graphs.algorithms import bfs, dfs, dijkstra, bellman_ford


@pytest.mark.parametrize('algoritmo', [bfs, dfs, dijkstra, bellman_ford])
def test_observador_preserva_retorno(algoritmo):
    grafo = {'s': [('a', 2), ('b', 7)], 'a': [('b', 1)], 'b': [], 'isolado': []}
    eventos = []
    observado = algoritmo(grafo, 's', observar=lambda *evento: eventos.append(evento))
    assert observado == algoritmo(grafo, 's')
    assert eventos[0][0] == 's'
    assert all(evento[0] != 'isolado' for evento in eventos)


def test_exploracao_inclui_casas_fora_do_caminho_e_estados_da_mesma_casa():
    mapa = [list(linha) for linha in ['#######', '#S..G##', '#a#####', '#######']]
    dados = explorar(mapa)
    bfs_resultado = dados['algoritmos']['BFS']
    caminho = set(bfs_resultado['caminho'])
    visitados = {evento[0] for evento in bfs_resultado['eventos']}
    assert visitados - caminho
    estados_na_origem = [dados['estados'][i] for i in visitados
                         if dados['estados'][i][:2] == [1, 1]]
    assert {estado[2] for estado in estados_na_origem} == {'', 'a'}
    assert all(len(estado) == 4 for estado in dados['estados'])


def test_bellman_ford_eventos_de_melhoria_e_rodada():
    grafo = {'s': [('a', 4), ('b', 1)], 'a': [], 'b': [('a', 1)]}
    eventos = []
    distancias, _, ciclo, _ = bellman_ford(grafo, 's', observar=lambda *e: eventos.append(e))
    assert distancias['a'] == 2 and ciclo is None
    assert [e[1] for e in eventos if e[0] == 'a'] == [4, 2]
    assert [e[2] for e in eventos if e[0] == 'a'] == [1, 1]


def test_recusa_dijkstra_na_visualizacao():
    dados = explorar([list(linha) for linha in ['#######', '#S+..G#', '#######']])
    assert dados['algoritmos']['DIJKSTRA']['status'] == 'RECUSA'
    assert dados['algoritmos']['DIJKSTRA']['eventos'] == []
    assert dados['algoritmos']['DIJKSTRA']['tempo_ms'] is None


def test_fonte_consumivel_registra_objeto_e_preserva_mapa():
    mapa = [list(linha) for linha in ['#######', '#S*..G#', '#######']]
    dados = explorar(mapa, fonte_consumivel=True)
    assert dados['consumiveis'] == [(1, 2)]
    assert dados['fonte_consumivel'] is True
    assert dados['algoritmos']['BELLMAN_FORD']['status'] == 'OK'
    assert dados['algoritmos']['BELLMAN_FORD']['tempo_ms'] >= 0
    assert mapa[1][2] == '*'
