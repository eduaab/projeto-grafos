"""Testes de integridade dos arquivos exportados da Parte 1.
# [IA] ChatGPT – apoio à validação das exportações.
"""
import csv
import json
from pathlib import Path
from src.graphs.io import mapa_input
from src.graphs.estados import ALVO, criar_grafo_estados
from src.graphs.resultados import generate, armadilhas, bonus_index, codigo_mapa, gerar_html_interativo

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

def test_generate_usa_nome_curto_para_armadilhas_m04_e_m07(tmp_path):
    mapdir=tmp_path/'maps';mapdir.mkdir()
    for nome in ('m04_esteiras.txt','m07_impossivel.txt'):
        src=ROOT/'data'/'mapas'/nome
        (mapdir/nome).write_text(src.read_text(encoding='utf-8'),encoding='utf-8')
    out=tmp_path/'output'
    generate([mapdir],out)
    assert (out/'armadilhas_m04.csv').is_file()
    assert (out/'armadilhas_m07.csv').is_file()
    assert not (out/'armadilhas_m04_esteiras.csv').exists()
    assert not (out/'armadilhas_m07_impossivel.csv').exists()

def test_dfs_sem_solucao_no_m07_nao_inventa_passos_negativos(tmp_path):
    src = ROOT/'data'/'mapas'/'m07_impossivel.txt'
    mapdir=tmp_path/'maps';mapdir.mkdir()
    (mapdir/src.name).write_text(src.read_text(encoding='utf-8'),encoding='utf-8')
    out=tmp_path/'output'
    generate([mapdir],out)
    data=json.loads((out/'dados_interativos.json').read_text(encoding='utf-8'))
    dfs=data['m07_impossivel']['algoritmos']['DFS']
    assert dfs['status']=='SEM_SOLUCAO'
    assert dfs['passos'] is None
    assert dfs['custo'] is None
    with (out/'solucoes.csv').open(encoding='utf-8') as f:
        linha=next(r for r in csv.DictReader(f) if r['mapa']=='m07_impossivel' and r['algoritmo']=='DFS')
    assert linha['status']=='SEM_SOLUCAO'
    assert linha['passos']==''

def test_codigo_mapa_extrai_o_prefixo_m_numero():
    assert codigo_mapa('m04_esteiras') == 'm04'
    assert codigo_mapa('m07_impossivel') == 'm07'
    assert codigo_mapa('mapa_grupo_cofre') == 'mapa_grupo_cofre'

def test_gerar_html_interativo_usa_dados_e_marca_o_mapa_padrao(tmp_path):
    dados = {'m01_terreno': {'mapa': ['#####'], 'armadilhas': [], 'algoritmos': {}}}
    (tmp_path/'dados_interativos.json').write_text(json.dumps(dados), encoding='utf-8')
    destino = gerar_html_interativo(tmp_path, mapa_padrao='m01_terreno')
    conteudo = destino.read_text(encoding='utf-8')
    assert destino == tmp_path/'labirinto_interativo.html'
    assert 'const DEFAULT_MAP="m01_terreno"' in conteudo
    assert '"m01_terreno"' in conteudo

def test_gerar_html_interativo_ignora_mapa_padrao_inexistente(tmp_path):
    dados = {'m01_terreno': {'mapa': ['#####'], 'armadilhas': [], 'algoritmos': {}}}
    (tmp_path/'dados_interativos.json').write_text(json.dumps(dados), encoding='utf-8')
    destino = gerar_html_interativo(tmp_path, mapa_padrao='nao_existe')
    assert 'const DEFAULT_MAP=null' in destino.read_text(encoding='utf-8')

def test_calcular_e_salvar_armadilhas_usa_nome_curto_do_mapa(tmp_path):
    from src.solve import calcular_e_salvar_armadilhas
    resultado = calcular_e_salvar_armadilhas(ROOT/'data'/'mapas'/'m04_esteiras.txt', tmp_path)
    assert resultado['mapa'] == 'm04'
    assert resultado['quantidade'] == 4
    assert (tmp_path/'armadilhas_m04.csv').is_file()
    with (tmp_path/'armadilhas_m04.csv').open(encoding='utf-8') as f:
        linhas = list(csv.DictReader(f))
    assert len(linhas) == 4


def test_bonus_index_inclui_fonte_quando_pedido():
    mapa = [list('#+*#')]
    assert bonus_index(mapa) == {(0, 1): 0}
    assert bonus_index(mapa, incluir_fonte=True) == {(0, 1): 0, (0, 2): 1}


def test_m06_exporta_com_fonte_consumivel(tmp_path):
    origem = ROOT / 'data' / 'mapas' / 'm06_fonte.txt'
    pasta_mapas = tmp_path / 'mapas'
    pasta_mapas.mkdir()
    (pasta_mapas / origem.name).write_text(origem.read_text(encoding='utf-8'), encoding='utf-8')
    saida = tmp_path / 'saida'
    generate([pasta_mapas], saida)
    dados = json.loads((saida / 'ciclo_negativo_m06.json').read_text(encoding='utf-8'))
    assert dados['status'] == 'CICLO_NEGATIVO'
    assert dados['custo'] < 0
    assert dados['fonte_consumivel']['status'] == 'OK'
    assert dados['fonte_consumivel']['passos'] == 10
    assert dados['fonte_consumivel']['custo'] == 10
