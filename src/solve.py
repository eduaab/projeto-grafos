import os
import csv

from src.graphs.io import mapa_input
from src.graphs.estados import ALVO, criar_grafo_estados, criar_estado_inicial
from src.graphs.algorithms import bfs, dfs, dijkstra, bellman_ford

ALGORITMOS = {
    "BFS": bfs,
    "DFS": dfs,
    "DIJKSTRA": dijkstra,
    "BELLMAN_FORD": bellman_ford,
}


def tem_peso_negativo(grafo):
    for origem in grafo:
        for destino, peso in grafo[origem]:
            if peso < 0:
                return True

    return False


def encontrar_saidas(mapa, grafo):
    saidas = []

    for estado in grafo:
        
        if estado == ALVO:
            continue

        linha, coluna = estado[0], estado[1]

        if mapa[linha][coluna] == 'G':
            saidas.append(estado)

    return saidas


def nao_alcancado(valor):
    return valor is None or valor == float("inf")


def extrair_predecessores(nome_algoritmo, resultado):
    if nome_algoritmo == "DFS":
        d, f, p, arestas, tem_ciclo = resultado
        return p, {"arestas": arestas, "tem_ciclo": tem_ciclo}

    if nome_algoritmo == "BELLMAN_FORD":
        d, p, ciclo, custo_ciclo = resultado
        return p, {"ciclo": ciclo, "custo_ciclo": custo_ciclo}

    d, p = resultado
    return p, {}


def escolher_melhor_saida(d, saidas):
    melhor = None
    melhor_distancia = None

    for saida in saidas:
        distancia = d[saida]

        if nao_alcancado(distancia):
            continue

        if melhor_distancia is None or distancia < melhor_distancia:
            melhor = saida
            melhor_distancia = distancia

    return melhor


def reconstruir_caminho(p, destino):
    caminho = [destino]
    atual = destino

    while p[atual] is not None and p[atual] != -1:
        atual = p[atual]
        caminho.append(atual)

    caminho.reverse()
    return caminho


def custo_do_caminho(grafo, caminho):
    custo = 0

    for indice in range(len(caminho) - 1):
        origem = caminho[indice]
        destino = caminho[indice + 1]

        for vizinho, peso in grafo[origem]:
            if vizinho == destino:
                custo += peso
                break

    return custo


def resolver(caminho_mapa, nome_algoritmo, fonte_consumivel=False):
    mapa = mapa_input(caminho_mapa)

    grafo = criar_grafo_estados(mapa)
    inicial = criar_estado_inicial(mapa)

    nome_mapa = os.path.basename(caminho_mapa)

    if nome_algoritmo == "DIJKSTRA" and tem_peso_negativo(grafo):
        return {
            "mapa": nome_mapa,
            "algoritmo": nome_algoritmo,
            "passos": None,
            "custo": None,
            "status": "RECUSA",
            "caminho": None,
        }

    algoritmo = ALGORITMOS[nome_algoritmo]
    resultado = algoritmo(grafo, inicial)
    d = resultado[0]
    p, extra = extrair_predecessores(nome_algoritmo, resultado)

    if nome_algoritmo == "BELLMAN_FORD" and extra["ciclo"] is not None:
        return {
            "mapa": nome_mapa,
            "algoritmo": nome_algoritmo,
            "passos": None,
            "custo": extra["custo_ciclo"],
            "status": "CICLO_NEGATIVO",
            "caminho": extra["ciclo"],
        }

    if nao_alcancado(d[ALVO]):
        return {
            "mapa": nome_mapa,
            "algoritmo": nome_algoritmo,
            "passos": None,
            "custo": None,
            "status": "SEM_SOLUCAO",
            "caminho": None,
        }

    caminho = reconstruir_caminho(p, ALVO)
    custo = custo_do_caminho(grafo, caminho)
    passos = len(caminho) - 2

    return {
        "mapa": nome_mapa,
        "algoritmo": nome_algoritmo,
        "passos": passos,
        "custo": custo,
        "status": "OK",
        "caminho": caminho,
    }


def gravar_resultado_csv(resultado, pasta_saida):
    os.makedirs(pasta_saida, exist_ok=True)
    arquivo_csv = os.path.join(pasta_saida, "solucoes.csv")
    existe = os.path.exists(arquivo_csv)

    with open(arquivo_csv, "a", newline="", encoding="utf-8") as arquivo:
        escritor = csv.writer(arquivo)

        if not existe:
            escritor.writerow(["mapa", "algoritmo", "passos", "custo", "status", "caminho"])

        escritor.writerow([
            resultado["mapa"],
            resultado["algoritmo"],
            resultado["passos"],
            resultado["custo"],
            resultado["status"],
            resultado["caminho"],
        ])