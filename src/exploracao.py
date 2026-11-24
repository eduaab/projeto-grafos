"""Eventos de visualização dos algoritmos existentes do grupo.

# [IA] ChatGPT – instrumentação e apresentação da exploração no simulador.
Os retornos e as decisões dos algoritmos permanecem nos algoritmos do grupo.
"""
import sys
from time import perf_counter

from .graphs.algorithms import bfs, dfs, dijkstra, bellman_ford
from .graphs.estados import ALVO, criar_estado_inicial, criar_grafo_estados
from .graphs.io import validar_mapa
from .graphs.resultados import armadilhas, reconstruir, custo


def explorar(mapa, fonte_consumivel=False):
    validar_mapa(mapa)
    grafo = criar_grafo_estados(mapa, fonte_consumivel=fonte_consumivel)
    inicial = criar_estado_inicial(mapa)
    estados = [estado for estado in grafo if estado != ALVO]
    indices = {estado: indice for indice, estado in enumerate(estados)}
    consumiveis = [(l, c) for l, linha in enumerate(mapa)
                   for c, celula in enumerate(linha)
                   if celula == '+' or (celula == '*' and fonte_consumivel)]
    ids_bonus = {posicao: indice for indice, posicao in enumerate(consumiveis)}
    dados = {
        'mapa': [''.join(linha) for linha in mapa],
        'fonte_consumivel': fonte_consumivel,
        'estados': [[l, c, chaves, [ids_bonus[b] for b in bonus]]
                    for l, c, chaves, bonus in estados],
        'consumiveis': consumiveis,
        'armadilhas': [indices[estado] for estado in armadilhas(grafo)],
        'algoritmos': {},
    }
    # A DFS do grupo é recursiva. A exportação também precisa suportar m08.
    sys.setrecursionlimit(max(sys.getrecursionlimit(), len(grafo) * 2 + 100))
    negativo = any(peso < 0 for arestas in grafo.values() for _, peso in arestas)
    for nome, algoritmo in [('BFS', bfs), ('DFS', dfs), ('DIJKSTRA', dijkstra),
                            ('BELLMAN_FORD', bellman_ford)]:
        eventos = []

        def observar(estado, valor, rodada):
            if estado != ALVO:
                eventos.append([indices[estado], valor, rodada])

        resultado = {'eventos': eventos, 'status': 'OK', 'caminho': [],
                     'passos': None, 'custo': None, 'ciclo': [], 'classes': {},
                     'tempo_ms': None}
        if nome == 'DIJKSTRA' and negativo:
            resultado['status'] = 'RECUSA'
            dados['algoritmos'][nome] = resultado
            continue
        inicio = perf_counter()
        retorno = algoritmo(grafo, inicial, observar=observar)
        resultado['tempo_ms'] = (perf_counter() - inicio) * 1000
        distancias = retorno[0]
        predecessores = retorno[1]
        ciclo = None
        if nome == 'DFS':
            predecessores = retorno[2]
            resultado['classes'] = {tipo: len(arcos) for tipo, arcos in retorno[3].items()}
            resultado['tem_ciclo'] = retorno[4]
        if nome == 'BELLMAN_FORD':
            ciclo = retorno[2]
        if ciclo:
            resultado['status'] = 'CICLO_NEGATIVO'
            resultado['ciclo'] = [indices[estado] for estado in ciclo]
            resultado['custo'] = retorno[3]
        elif distancias.get(ALVO) is None or distancias.get(ALVO) == float('inf'):
            resultado['status'] = 'SEM_SOLUCAO'
        else:
            caminho = reconstruir(predecessores, ALVO)
            resultado['caminho'] = [indices[estado] for estado in caminho if estado != ALVO]
            resultado['passos'] = len(caminho) - 2
            resultado['custo'] = custo(grafo, caminho)
        dados['algoritmos'][nome] = resultado
    return dados
