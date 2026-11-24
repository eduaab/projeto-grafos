# [IA] ChatGPT - modularização e validação do benchmark existente no notebook.
import json
import math
import random
from pathlib import Path
from statistics import mean, stdev
from time import perf_counter
from src.graphs.algorithms import bellman_ford, bfs, dfs, dijkstra
from src.graphs.graph import criar_recorte_aciclico, montar_grafo_paises
from src.graphs.io import carregar_arestas

RAIZ = Path(__file__).resolve().parents[1]
DATASET = RAIZ / "data/dataset_parte2"
SAIDA = RAIZ / "out/parte2/parte2_report.json"

SEED = 42
REPETICOES = 5

FONTES = ("United States", "Brazil", "Israel")
PARES = (
    ("Israel", "Lebanon"),
    ("Saudi Arabia", "Yemen"),
    ("Russian Federation", "Ukraine"),
    ("Brazil", "Bhutan"),
    ("United States", "China"),
)

def transformar_grafo_atrito(grafo):
    grafo_atrito = {}

    for origem, vizinhos in grafo.items():
        arestas_com_atrito = []

        for destino, peso in vizinhos:
            custo = round(10.0 - peso, 6)
            arestas_com_atrito.append((destino, custo))

        grafo_atrito[origem] = arestas_com_atrito

    return grafo_atrito


def filtrar_grafo_sem_pares_fracos(grafo, info_arestas):
    grafo_filtrado = {}

    for origem, vizinhos in grafo.items():
        arestas_mantidas = []

        for destino, peso in vizinhos:
            dados = info_arestas[origem, destino]

            if not dados["par_fraco"]:
                arestas_mantidas.append((destino, peso))

        grafo_filtrado[origem] = arestas_mantidas

    return grafo_filtrado


def reconstruir_caminho(predecessores, origem, destino):

    if origem not in predecessores:
        return []

    caminho = []
    atual = destino

    while atual not in (None, -1):

        caminho.append(atual)

        if atual == origem:
            caminho.reverse()
            return caminho

        atual = predecessores.get(atual)

    return []


def predecessores_da_fonte(algoritmo, grafo, origem):

    if origem not in grafo:
        return {}

    distancias, predecessores = algoritmo(grafo, origem)

    return predecessores


def resumir_caminho(caminho, grafo_atrito, info_arestas):
    saltos = None
    custo_transformado = None
    qtd_pares_fracos = 0

    if caminho:
        custo = 0.0
        saltos = len(caminho) - 1

        for origem, destino in zip(caminho, caminho[1:]):

            custos_da_origem = dict(grafo_atrito[origem])
            custo += custos_da_origem[destino]

            if info_arestas[origem, destino]["par_fraco"]:
                qtd_pares_fracos += 1

        custo_transformado = round(custo, 6)

    return {
        "saltos": saltos,
        "custo_transformado": custo_transformado,
        "caminho": caminho,
        "usa_par_fraco": qtd_pares_fracos > 0,
        "qtd_pares_fracos": qtd_pares_fracos,
    }


def comparar_bfs_dijkstra_par(
    grafo_original,
    grafo_atrito,
    info_arestas,
    origem,
    destino,
):
    pred_bfs = predecessores_da_fonte(bfs, grafo_original, origem)
    pred_dijkstra = predecessores_da_fonte(dijkstra, grafo_atrito, origem)

    caminho_bfs = reconstruir_caminho(pred_bfs, origem, destino)
    caminho_dijkstra = reconstruir_caminho(pred_dijkstra, origem, destino)

    return {
        "origem": origem,
        "destino": destino,
        "bfs": resumir_caminho(caminho_bfs, grafo_atrito, info_arestas),
        "dijkstra": resumir_caminho(caminho_dijkstra, grafo_atrito, info_arestas),
    }

def subgrafo_amostra(grafo, fracao, seed=42):
    """Devolve o subgrafo, seus tamanhos e a origem de maior grau de saída."""

    if not 0 < fracao <= 1:
        raise ValueError("A fração deve estar no intervalo (0, 1].")

    amostra = grafo

    if fracao < 1 and grafo:
        nos = sorted(grafo)
        tamanho = round(len(nos) * fracao)
        tamanho = max(1, tamanho)
        sorteador = random.Random(seed)
        paises_sorteados = sorteador.sample(nos, tamanho)
        selecionados = set(paises_sorteados)
        amostra = {}

        for origem in nos:

            if origem not in selecionados:
                continue

            arestas_mantidas = []

            for destino, peso in grafo[origem]:

                if destino in selecionados:
                    arestas_mantidas.append((destino, peso))

            amostra[origem] = arestas_mantidas

    origem = None
    maior_grau = -1
    n_arestas = 0

    for pais in sorted(amostra):
        grau = len(amostra[pais])
        n_arestas += grau

        if grau > maior_grau:
            origem = pais
            maior_grau = grau

    return amostra, len(amostra), n_arestas, origem


def medir_execucoes(algoritmo, grafo, fontes, repeticoes=5):

    if repeticoes < 1:
        raise ValueError("O número de repetições deve ser positivo.")

    tempos = []

    for repeticao in range(repeticoes):
        inicio = perf_counter()

        for fonte in fontes:

            if fonte not in grafo:
                raise ValueError(f"Fonte ausente no grafo: {fonte}")
            algoritmo(grafo, fonte)

        duracao_ms = (perf_counter() - inicio) * 1000
        tempos.append(duracao_ms)

    desvio_ms = 0.0
    
    if repeticoes > 1:
        desvio_ms = stdev(tempos)

    return {
        "tempos_ms": tempos,
        "media_ms": mean(tempos),
        "desvio_ms": desvio_ms,
    }


def medir_tarefas(grafo, atrito, recorte, repeticoes):

    origens_pares = []

    for origem, destino in PARES:

        if origem not in origens_pares:
            origens_pares.append(origem)

    tarefas = (
        ("BFS", "3_fontes", bfs, grafo, FONTES),
        ("DFS", "3_fontes", dfs, grafo, FONTES),
        ("DIJKSTRA", "5_pares", dijkstra, atrito, origens_pares),
        ("BELLMAN_FORD", "completo_com_ciclo", bellman_ford, grafo, ("Brazil",)),
        ("BELLMAN_FORD", "recorte_sem_ciclo", bellman_ford, recorte, ("United States",)),
    )

    resultados = []

    for nome, tarefa, algoritmo, rede, fontes in tarefas:

        medida = medir_execucoes(algoritmo, rede, fontes, repeticoes)

        resultados.append({
            "algoritmo": nome,
            "tarefa": tarefa,
            **medida,
        })

    return resultados


def medir_escalabilidade(grafo, seed, repeticoes):

    resultados = []

    for fracao in (0.1, 0.5, 1.0):
        amostra, n_nos, n_arestas, origem = subgrafo_amostra(grafo, fracao, seed)

        amostra_atrito = transformar_grafo_atrito(amostra)

        algoritmos = (
            ("BFS", bfs, amostra),
            ("DFS", dfs, amostra),
            ("DIJKSTRA", dijkstra, amostra_atrito),
            ("BELLMAN_FORD", bellman_ford, amostra),
        )

        for nome, algoritmo, rede in algoritmos:

            medida = medir_execucoes(algoritmo, rede, (origem,), repeticoes)
            resultados.append({
                "fracao": fracao,
                "n_nos": n_nos,
                "n_arestas": n_arestas,
                "origem": origem,
                "algoritmo": nome,
                **medida,
            })

    return resultados

def resumir_buscas(grafo, fonte, resultado_bfs):

    distancias, predecessores = resultado_bfs
    primeiros = []
    descoberta = {}
    arestas = {}
    tem_ciclo = False

    if fonte in grafo:
        primeiros.append(fonte)
        descoberta, encerramento, predecessores_dfs, arestas, tem_ciclo = dfs(grafo, fonte)

    for origem in primeiros:

        if len(primeiros) == 5:
            break

        for destino, peso in grafo[origem]:

            if predecessores[destino] == origem:
                primeiros.append(destino)

                if len(primeiros) == 5:
                    break

    camadas = []

    for camada in distancias.values():

        if camada is not None:
            camadas.append(camada)

    dfs_alcancados = 0

    for tempo in descoberta.values():

        if tempo is not None:
            dfs_alcancados += 1

    contagem_arestas = {}

    for tipo in ("arvore", "retorno", "avanco", "cruzamento"):
        contagem_arestas[tipo] = len(arestas.get(tipo, ()))

    return {
        "bfs_alcancados": len(camadas),
        "bfs_max_camada": max(camadas, default=None),
        "bfs_primeiros_5": primeiros,
        "dfs_alcancados": dfs_alcancados,
        "dfs_tem_ciclo": tem_ciclo,
        "dfs_contagem_arestas": contagem_arestas,
    }


def resumir_ciclo(grafo, info_arestas, origem):
    ciclo = None
    custo = None
    arestas = []
    usa_par_fraco = False

    if origem in grafo:
        distancias, predecessores, ciclo, custo = bellman_ford(grafo, origem)

    if ciclo:

        for inicio, destino in zip(ciclo, ciclo[1:]):
            pesos = dict(grafo[inicio])
            dados = info_arestas[inicio, destino]
            arestas.append({
                "origem": inicio,
                "destino": destino,
                "peso": pesos[destino],
                **dados,
            })

            if dados["par_fraco"]:
                usa_par_fraco = True

    return {
        "ciclo": ciclo,
        "custo_ciclo": custo,
        "arestas_ciclo": arestas,
        "usa_par_fraco": usa_par_fraco,
    }


def resumir_execucao_aciclica(grafo, origem):

    if origem not in grafo:
        return {
            "alcancados": 0,
            "ciclo": None,
            "dfs_arestas_retorno": 0,
        }

    distancias, predecessores, ciclo, custo_ciclo = bellman_ford(grafo, origem)
    descoberta, encerramento, predecessores_dfs, arestas, tem_ciclo_dfs = dfs(grafo, origem)

    alcancados = 0
    for distancia in distancias.values():

        if math.isfinite(distancia):
            alcancados += 1

    return {
        "alcancados": alcancados,
        "ciclo": ciclo,
        "dfs_arestas_retorno": len(arestas["retorno"]),
    }


def contar_grafo(grafo):
    n_arestas = 0
    n_negativas = 0

    for vizinhos in grafo.values():
        n_arestas += len(vizinhos)

        for destino, peso in vizinhos:

            if peso < 0:
                n_negativas += 1

    return {
        "n_nos": len(grafo),
        "n_arestas": n_arestas,
        "n_negativas": n_negativas,
    }


def verificar_robustez(grafo, info_arestas, comparacoes):
    filtrado = filtrar_grafo_sem_pares_fracos(grafo, info_arestas)
    info_filtrada = {}

    for par, info in info_arestas.items():

        if not info["par_fraco"]:
            info_filtrada[par] = info

    recorte, ordem = criar_recorte_aciclico(filtrado, info_filtrada)
    atrito = transformar_grafo_atrito(filtrado)
    rotas = []

    for caso in comparacoes:
        origem, destino = caso["origem"], caso["destino"]
        pred = predecessores_da_fonte(dijkstra, atrito, origem)
        caminho = reconstruir_caminho(pred, origem, destino)
        resumo = resumir_caminho(caminho, atrito, info_filtrada)
        rotas.append({
            "origem": origem,
            "destino": destino,
            "caminho": caminho,
            "saltos": resumo["saltos"],
            "custo_transformado": resumo["custo_transformado"],
            "mudou_em_relacao_ao_completo": caminho != caso["dijkstra"]["caminho"],
        })

    ciclo_brasil = resumir_ciclo(filtrado, info_filtrada, "Brazil")
    recorte_eua = resumir_execucao_aciclica(recorte, "United States")

    return {
        **contar_grafo(filtrado),
        "dijkstra_5_pares": rotas,
        "bellman_ford_com_ciclo": {"Brazil": ciclo_brasil},
        "bellman_ford_sem_ciclo": {"United States": recorte_eua},
    }



def executar_pipeline_parte2(pasta_dataset, seed=42, repeticoes=5):
    arestas = carregar_arestas(pasta_dataset)
    grafo, info_arestas = montar_grafo_paises(arestas)
    atrito = transformar_grafo_atrito(grafo)
    recorte, ordem = criar_recorte_aciclico(grafo, info_arestas)

    tempo_medio = medir_tarefas(grafo, atrito, recorte, repeticoes)
    escalabilidade = medir_escalabilidade(grafo, seed, repeticoes)

    buscas_por_fonte = {}

    for fonte in FONTES:
        resultado_bfs = ({}, {})

        if fonte in grafo:
            resultado_bfs = bfs(grafo, fonte)

        buscas_por_fonte[fonte] = resumir_buscas(grafo, fonte, resultado_bfs)

    comparacoes = []
    pares_do_relatorio = []

    for origem, destino in PARES:
        comparacao = comparar_bfs_dijkstra_par(
            grafo, atrito, info_arestas, origem, destino
        )
        comparacoes.append(comparacao)
        pares_do_relatorio.append([origem, destino])

    ciclos_por_fonte = {}

    for fonte in ("Brazil", "United States"):
        ciclos_por_fonte[fonte] = resumir_ciclo(grafo, info_arestas, fonte)

    recorte_por_fonte = {}

    for fonte in ("United States", "Brazil"):
        recorte_por_fonte[fonte] = resumir_execucao_aciclica(recorte, fonte)

    nos_sem_saida = 0

    for vizinhos in recorte.values():

        if not vizinhos:
            nos_sem_saida += 1

    n_pares_fracos = 0

    for dados in info_arestas.values():
        
        if dados["par_fraco"]:
            n_pares_fracos += 1

    contagem_completa = contar_grafo(grafo)
    robustez = verificar_robustez(grafo, info_arestas, comparacoes)

    return {
        "metadata": {
            "seed": seed,
            "repeticoes": repeticoes,
            "transformacao_dijkstra": "10 - peso",
            "n_nos_completo": contagem_completa["n_nos"],
            "n_arestas_completo": contagem_completa["n_arestas"],
            "n_negativas_completo": contagem_completa["n_negativas"],
            "n_pares_fracos": n_pares_fracos,
            "fontes_bfs_dfs": list(FONTES),
            "pares_bfs_dijkstra": pares_do_relatorio,
        },
        "tempo_medio": tempo_medio,
        "escalabilidade": escalabilidade,
        "bfs_vs_dijkstra_5_pares": comparacoes,
        "casos_obrigatorios": {
            "bfs_dfs_3_fontes": buscas_por_fonte,
            "bellman_ford_com_ciclo": ciclos_por_fonte,
            "bellman_ford_sem_ciclo": {
                **contar_grafo(recorte),
                "nos_sem_saida": nos_sem_saida,
                "top_5_ordem": ordem[:5],
                "execucoes": recorte_por_fonte,
            },
        },
        "robustez_sem_pares_fracos": robustez,
    }

def executar_benchmark(pasta_dataset=DATASET, saida=SAIDA, seed=SEED, repeticoes=REPETICOES):
    relatorio = executar_pipeline_parte2(Path(pasta_dataset), seed, repeticoes)
    saida = Path(saida)
    saida.parent.mkdir(parents=True, exist_ok=True)
    with saida.open("w", encoding="utf-8") as arquivo:
        json.dump(relatorio, arquivo, ensure_ascii=False, indent=2, allow_nan=False)
        arquivo.write("\n")
    return relatorio


if __name__ == "__main__":
    executar_benchmark()
    print(f"Benchmark salvo em {SAIDA}")
