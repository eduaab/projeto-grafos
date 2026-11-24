import json
import sys
import pytest

from src.benchmark_parte2 import executar_consulta_dataset
from src.cli import main as executar_cli


def salvar_dataset(pasta, linhas):
    conteudo = ["origem,destino,peso,n_eventos,par_fraco"]
    conteudo.extend(linhas)
    (pasta / "arestas_paises.csv").write_text("\n".join(conteudo) + "\n", encoding="utf-8")


def test_consulta_bfs_e_dfs(tmp_path):
    salvar_dataset(
        tmp_path,
        [
            "Brasil,Chile,2.0,10,False",
            "Chile,Peru,4.0,5,False",
            "Brasil,Peru,-3.0,8,False",
            "Peru,Brasil,-2.0,6,False",
        ],
    )

    resultado_bfs = executar_consulta_dataset(tmp_path, "BFS", "Brasil", "Peru")
    assert resultado_bfs["status"] == "OK"
    assert resultado_bfs["alcancados"] == 3
    assert resultado_bfs["max_camada"] == 1
    assert resultado_bfs["saltos"] == 1
    assert resultado_bfs["caminho"] == ["Brasil", "Peru"]
    assert resultado_bfs["custo_transformado"] == 13.0
    assert resultado_bfs["usa_par_fraco"] is False

    resultado_dfs = executar_consulta_dataset(tmp_path, "DFS", "Brasil", "Peru")
    assert resultado_dfs["status"] == "OK"
    assert resultado_dfs["alcancados"] == 3
    assert resultado_dfs["tem_ciclo"] is True
    assert resultado_dfs["caminho"][0] == "Brasil"
    assert resultado_dfs["caminho"][-1] == "Peru"


def test_consulta_dijkstra_prefere_menor_atrito(tmp_path):
    salvar_dataset(
        tmp_path,
        [
            "PaisA,PaisC,-5.0,20,False",
            "PaisA,PaisB,8.0,1,True",
            "PaisB,PaisC,7.0,15,False",
        ],
    )

    resultado = executar_consulta_dataset(tmp_path, "DIJKSTRA", "PaisA", "PaisC")
    assert resultado["status"] == "OK"
    assert resultado["transformacao"] == "10 - peso"
    assert resultado["caminho"] == ["PaisA", "PaisB", "PaisC"]
    assert resultado["saltos"] == 2
    assert resultado["custo_transformado"] == 5.0
    assert resultado["usa_par_fraco"] is True
    assert resultado["qtd_pares_fracos"] == 1


def test_consulta_bellman_ford_com_ciclo_e_recorte(tmp_path):
    salvar_dataset(
        tmp_path,
        [
            "PaisA,PaisB,-4.0,50,False",
            "PaisB,PaisA,-3.0,30,False",
            "PaisB,PaisC,1.0,20,False",
            "PaisA,PaisD,1.0,50,False",
        ],
    )

    completo = executar_consulta_dataset(tmp_path, "BELLMAN_FORD", "PaisA", "PaisC")
    assert completo["status"] == "CICLO_NEGATIVO"
    assert completo["custo_ciclo"] == -7.0
    assert completo["ciclo"][0] == completo["ciclo"][-1]
    assert set(completo["ciclo"]) == {"PaisA", "PaisB"}

    recorte = executar_consulta_dataset(
        tmp_path, "BELLMAN_FORD", "PaisA", "PaisC", recorte_aciclico=True
    )
    assert recorte["status"] == "OK"
    assert recorte["recorte_aciclico"] is True
    assert recorte["ciclo"] is None
    assert recorte["caminho"] == ["PaisA", "PaisB", "PaisC"]
    assert recorte["custo"] == -3.0


def test_consulta_origem_ou_destino_inexistente(tmp_path):
    salvar_dataset(tmp_path, ["Brasil,Chile,2.0,10,False"])

    with pytest.raises(ValueError, match="origem"):
        executar_consulta_dataset(tmp_path, "BFS", "Inexistente")

    with pytest.raises(ValueError, match="destino"):
        executar_consulta_dataset(tmp_path, "BFS", "Brasil", "Inexistente")


def test_cli_dataset_consulta_e_salva_json(tmp_path, monkeypatch, capsys):
    salvar_dataset(
        tmp_path,
        [
            "Brasil,Chile,-2.0,10,False",
            "Brasil,Uruguai,6.0,10,False",
            "Uruguai,Chile,7.0,10,False",
        ],
    )
    pasta_saida = tmp_path / "saida"

    monkeypatch.setattr(
        sys,
        "argv",
        [
            "cli",
            "--dataset",
            str(tmp_path),
            "--alg",
            "DIJKSTRA",
            "--source",
            "Brasil",
            "--target",
            "Chile",
            "--out",
            str(pasta_saida),
        ],
    )

    executar_cli()
    saida_texto = capsys.readouterr().out
    arquivo = pasta_saida / "consulta_dijkstra.json"

    assert arquivo.is_file()
    dados = json.loads(arquivo.read_text(encoding="utf-8"))
    assert dados["caminho"] == ["Brasil", "Uruguai", "Chile"]
    assert dados["custo_transformado"] == 7.0
    assert "Caminho:" in saida_texto
