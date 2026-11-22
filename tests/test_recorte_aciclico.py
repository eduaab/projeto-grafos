import os
import pytest

from src.graphs.io import carregar_arestas
from src.graphs.graph import montar_grafo_paises, criar_recorte_aciclico
from src.graphs.algorithms import bellman_ford


def test_recorte_remove_ciclo_e_mantem_todos_os_nos():
    grafo = {
        "A": [("B", -5.0)],
        "B": [("A", -3.0), ("C", 2.0)],
        "C": [],
    }
    info_arestas = {
        ("A", "B"): {"n_eventos": 10, "par_fraco": False},
        ("B", "A"): {"n_eventos": 5, "par_fraco": False},
        ("B", "C"): {"n_eventos": 20, "par_fraco": False},
    }

    recorte, ordem = criar_recorte_aciclico(grafo, info_arestas)

    assert ordem == ["B", "C", "A"]
    assert set(recorte.keys()) == {"A", "B", "C"}
    assert recorte["B"] == [("A", -3.0), ("C", 2.0)]
    assert recorte["A"] == []
    assert recorte["C"] == []


def test_recorte_desempate_alfabetico():
    grafo = {
        "Chile": [("Argentina", -1.0)],
        "Argentina": [("Chile", 2.0)],
    }
    info_arestas = {
        ("Chile", "Argentina"): {"n_eventos": 10, "par_fraco": False},
        ("Argentina", "Chile"): {"n_eventos": 10, "par_fraco": False},
    }

    recorte, ordem = criar_recorte_aciclico(grafo, info_arestas)

    assert ordem == ["Argentina", "Chile"]
    assert recorte["Argentina"] == [("Chile", 2.0)]
    assert recorte["Chile"] == []


def test_recorte_propriedade_ordem_estrita():
    grafo = {
        "A": [("B", -2.0), ("C", 1.0)],
        "B": [("C", -4.0), ("A", 3.0)],
        "C": [("A", -1.0)],
    }
    info_arestas = {
        ("A", "B"): {"n_eventos": 50, "par_fraco": False},
        ("A", "C"): {"n_eventos": 10, "par_fraco": False},
        ("B", "C"): {"n_eventos": 5, "par_fraco": False},
        ("B", "A"): {"n_eventos": 2, "par_fraco": False},
        ("C", "A"): {"n_eventos": 1, "par_fraco": True},
    }

    recorte, ordem = criar_recorte_aciclico(grafo, info_arestas)

    posicao = {}
    for i, pais in enumerate(ordem):
        posicao[pais] = i

    for origem, vizinhos in recorte.items():
        for destino, _ in vizinhos:
            assert posicao[origem] < posicao[destino]


def test_integracao_recorte_aciclico_dataset_paises():
    raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pasta = os.path.join(raiz, "data", "dataset_parte2")

    arestas = carregar_arestas(pasta)
    grafo, info_arestas = montar_grafo_paises(arestas)
    recorte, ordem = criar_recorte_aciclico(grafo, info_arestas)

    assert len(recorte) == 250
    assert ordem[:3] == ["United States", "Russian Federation", "China"]
    assert ordem[-2:] == ["Saint Barthelemy", "Heard Island and McDonald Islands"]
    assert ordem.index("Brazil") + 1 == 35

    posicao = {}
    for i, pais in enumerate(ordem):
        posicao[pais] = i

    total_arestas = 0
    negativas = 0
    sem_saida = 0

    for origem, vizinhos in recorte.items():
        if len(vizinhos) == 0:
            sem_saida += 1
        total_arestas += len(vizinhos)
        for destino, peso in vizinhos:
            assert posicao[origem] < posicao[destino]
            if peso < 0:
                negativas += 1

    assert total_arestas == 14692
    assert negativas == 1406
    assert sem_saida == 29


def test_bellman_ford_no_recorte_sem_ciclo_negativo():
    raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pasta = os.path.join(raiz, "data", "dataset_parte2")

    arestas = carregar_arestas(pasta)
    grafo, info_arestas = montar_grafo_paises(arestas)
    recorte, _ = criar_recorte_aciclico(grafo, info_arestas)

    distancias, _, ciclo, custo_ciclo = bellman_ford(recorte, "United States")

    assert ciclo is None
    assert custo_ciclo is None

    alcancados = 0
    for distancia in distancias.values():
        if distancia != float("inf"):
            alcancados += 1

    assert alcancados == 250
