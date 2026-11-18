"""Testes de integridade dos arquivos exportados da Parte 1.
# [IA] ChatGPT – apoio à validação das exportações.
"""
import csv
import json
from pathlib import Path
from src.graphs.io import mapa_input
from src.graphs.estados import ALVO, criar_grafo_estados
from src.graphs.resultados import generate, armadilhas

ROOT = Path(__file__).resolve().parents[1]

def test_exportacoes_em_mapa_pequeno(tmp_path):
    src = ROOT/'data'/'mapas'/'m02_uma_chave.txt'
    mapdir=tmp_path/'maps';mapdir.mkdir()
    (mapdir/src.name).write_text(src.read_text(encoding='utf-8'),encoding='utf-8')
    out=tmp_path/'output'
    generate([mapdir],out)
    required=['arestas_m02_uma_chave.csv','solucoes.csv','dfs_classificacao.csv',
              'comparacao_modelagem.csv','metricas_global.json','camadas.json',
              'graus_m02_uma_chave.csv','dados_interativos.json']
    assert all((out/p).is_file() for p in required)
    with (out/'arestas_m02_uma_chave.csv').open(encoding='utf-8') as f:
        assert len(list(csv.DictReader(f)))==sum(len(a) for a in criar_grafo_estados(mapa_input(src)).values())
    data=json.loads((out/'dados_interativos.json').read_text(encoding='utf-8'))
    assert set(data['m02_uma_chave']['algoritmos'])=={'BFS','DFS','DIJKSTRA','BELLMAN_FORD'}

def test_armadilhas_m07_sem_alvo():
    graph=criar_grafo_estados(mapa_input(ROOT/'data'/'mapas'/'m07_impossivel.txt'))
    traps=armadilhas(graph)
    assert ALVO not in traps
    assert len(traps)==len(graph)-1
