import os
import pytest

from src.graphs.io import carregar_arestas
from src.graphs.graph import montar_grafo_paises


def salvar_csv(pasta, conteudo):
    caminho = os.path.join(pasta, "arestas_paises.csv")
    with open(caminho, "w", encoding="utf-8", newline="") as f:
        f.write(conteudo)


def test_carregar_e_montar_grafo_valido(tmp_path):
    conteudo = (
        "origem,destino,peso,n_eventos,par_fraco\n"
        "Brazil,Argentina,1.5,10,False\n"
        "Argentina,Chile,-2.0,3,True\n"
    )
    salvar_csv(tmp_path, conteudo)

    arestas = carregar_arestas(tmp_path)
    grafo, info_arestas = montar_grafo_paises(arestas)

    assert len(grafo) == 3
    assert grafo["Brazil"] == [("Argentina", 1.5)]
    assert grafo["Argentina"] == [("Chile", -2.0)]
    assert grafo["Chile"] == []
    assert info_arestas[("Argentina", "Chile")] == {
        "n_eventos": 3,
        "par_fraco": True,
    }


def test_arquivo_inexistente(tmp_path):
    with pytest.raises(FileNotFoundError):
        carregar_arestas(tmp_path)


def test_coluna_faltando(tmp_path):
    conteudo = (
        "origem,destino,peso,n_eventos\n"
        "Brazil,Argentina,1.5,10\n"
    )
    salvar_csv(tmp_path, conteudo)

    with pytest.raises(ValueError, match="Coluna obrigatória ausente"):
        carregar_arestas(tmp_path)


def test_laco_origem_igual_destino(tmp_path):
    conteudo = (
        "origem,destino,peso,n_eventos,par_fraco\n"
        "Brazil,Brazil,1.0,5,False\n"
    )
    salvar_csv(tmp_path, conteudo)

    with pytest.raises(ValueError, match="laço"):
        carregar_arestas(tmp_path)


def test_par_repetido(tmp_path):
    conteudo = (
        "origem,destino,peso,n_eventos,par_fraco\n"
        "Brazil,Argentina,1.0,5,False\n"
        "Brazil,Argentina,2.0,8,False\n"
    )
    salvar_csv(tmp_path, conteudo)

    with pytest.raises(ValueError, match="par repetido"):
        carregar_arestas(tmp_path)


def test_origem_ou_destino_vazio(tmp_path):
    conteudo = (
        "origem,destino,peso,n_eventos,par_fraco\n"
        " ,Argentina,1.0,5,False\n"
    )
    salvar_csv(tmp_path, conteudo)

    with pytest.raises(ValueError, match="vazio"):
        carregar_arestas(tmp_path)


@pytest.mark.parametrize("peso_ruim", ["abc", "nan", "inf", "-inf"])
def test_peso_invalido_ou_nao_finito(tmp_path, peso_ruim):
    conteudo = (
        "origem,destino,peso,n_eventos,par_fraco\n"
        f"Brazil,Argentina,{peso_ruim},5,False\n"
    )
    salvar_csv(tmp_path, conteudo)

    with pytest.raises(ValueError, match="peso"):
        carregar_arestas(tmp_path)


@pytest.mark.parametrize("eventos_ruim", ["0", "-3", "abc"])
def test_n_eventos_invalido(tmp_path, eventos_ruim):
    conteudo = (
        "origem,destino,peso,n_eventos,par_fraco\n"
        f"Brazil,Argentina,1.0,{eventos_ruim},False\n"
    )
    salvar_csv(tmp_path, conteudo)

    with pytest.raises(ValueError, match="n_eventos"):
        carregar_arestas(tmp_path)


def test_par_fraco_invalido(tmp_path):
    conteudo = (
        "origem,destino,peso,n_eventos,par_fraco\n"
        "Brazil,Argentina,1.0,5,talvez\n"
    )
    salvar_csv(tmp_path, conteudo)

    with pytest.raises(ValueError, match="par_fraco"):
        carregar_arestas(tmp_path)


def test_integracao_dataset_paises():
    raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pasta = os.path.join(raiz, "data", "dataset_parte2")
    arestas = carregar_arestas(pasta)
    grafo, _ = montar_grafo_paises(arestas)

    assert len(grafo) == 251

    total_arestas = 0
    for pais, vizinhos in grafo.items():
        total_arestas += len(vizinhos)
        for destino, _ in vizinhos:
            assert destino != pais

    assert total_arestas == 29383
    assert ("Iraq", -2.840676) in grafo["United States"]
