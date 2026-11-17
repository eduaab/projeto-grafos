"""Métricas da Parte 1 para grafos de posições e de estados.

# [IA] ChatGPT – apoio à implementação e testes de métricas de grafos.
O nó virtual ALVO e seus arcos são excluídos das métricas da Seção 3.
"""

from collections import Counter, defaultdict
from pathlib import Path
import csv
import json

from .estados import ALVO, criar_grafo_estados
from .graph import encontrar_vizinhos
from .io import mapa_input

DIRECOES_ESTEIRAS = {'^': (-1, 0), '>': (0, 1), 'v': (1, 0), '<': (0, -1)}


def grafo_posicoes(mapa):
    """G_pos: casas livres e movimentos geométricos dirigidos (portas = chão)."""
    grafo = {}
    for linha, row in enumerate(mapa):
        for coluna, simbolo in enumerate(row):
            if simbolo == '#':
                continue
            origem = (linha, coluna)
            if simbolo == 'G':
                grafo[origem] = []
                continue
            vizinhos = encontrar_vizinhos(mapa, origem)
            if simbolo in DIRECOES_ESTEIRAS:
                dl, dc = DIRECOES_ESTEIRAS[simbolo]
                vizinhos = [v for v in vizinhos if v == (linha + dl, coluna + dc)]
            grafo[origem] = vizinhos
    return grafo


def resumo_grafo(grafo):
    """Aceita dicionário origem -> destinos (ou arestas [destino,peso])."""
    ordem = len(grafo)
    tamanho = sum(len(adjs) for adjs in grafo.values())
    densidade = tamanho / (ordem * (ordem - 1)) if ordem > 1 else 0.0
    return {'ordem': ordem, 'tamanho': tamanho, 'densidade': densidade}


def calcular_metricas(mapa):
    bonus_ids = { (i, j): k for k, (i, j) in enumerate(
        ( (i, j) for i, linha in enumerate(mapa) for j, cel in enumerate(linha) if cel == "+" )
    ) }
    rotulo = lambda estado: rotulo_estado(estado, bonus_ids)
    posicoes = grafo_posicoes(mapa)
    estados_com_alvo = criar_grafo_estados(mapa)
    estados = {v: [(dest, peso) for dest, peso in adjs if dest != ALVO]
               for v, adjs in estados_com_alvo.items() if v != ALVO}
    resumo_pos = resumo_grafo(posicoes)
    resumo_est = resumo_grafo(estados)

    chaves = {cel for linha in mapa for cel in linha if cel in 'abcd'}
    bonus = sum(cel == '+' for linha in mapa for cel in linha)
    teto = len(posicoes) * (2 ** len(chaves)) * (2 ** bonus)

    entrada = Counter({v: 0 for v in estados})
    for arestas in estados.values():
        for destino, _peso in arestas:
            entrada[destino] += 1

    por_chave = defaultdict(list)
    for estado in estados:
        por_chave[estado[2] or '-'].append(estado)

    camadas = {}
    for chave, nos in sorted(por_chave.items()):
        conjunto = set(nos)
        arcos_internos = sum(1 for no in nos for dest, _ in estados[no] if dest in conjunto)
        n = len(nos)
        camadas[chave] = {'ordem': n, 'tamanho': arcos_internos,
                          'densidade': arcos_internos / (n * (n - 1)) if n > 1 else 0.0}

    transicoes = Counter()
    for origem, arcos in estados.items():
        for destino, _ in arcos:
            antes, depois = origem[2] or '-', destino[2] or '-'
            if antes != depois:
                l, c = destino[0], destino[1]
                transicoes[(antes, depois, l, c, mapa[l][c])] += 1

    arcos_entre = [{'origem_camada': ant, 'destino_camada': dep,
                    'casa': {'linha': l, 'coluna': c, 'simbolo': simbolo}, 'quantidade': qtd}
                   for (ant, dep, l, c, simbolo), qtd in sorted(transicoes.items())]

    multiplicidades = Counter((e[0], e[1]) for e in estados)
    max_mult = max(multiplicidades.values(), default=0)
    becos = [e for e, adjs in estados.items() if not adjs and mapa[e[0]][e[1]] != 'G']

    # Desempate de rankings pelo rótulo textual (ordem lexicográfica).
    saida_max = sorted(estados, key=lambda e: (-len(estados[e]), rotulo(e)))[0] if estados else None
    entrada_max = sorted(estados, key=lambda e: (-entrada[e], rotulo(e)))[0] if estados else None

    globais = {
        'G_pos': resumo_pos, 'G_est': resumo_est,
        'teto_teorico': teto,
        'taxa_ocupacao': resumo_est['ordem'] / teto if teto else 0.0,
        'numero_chaves': len(chaves), 'numero_bonus': bonus,
        'maior_grau_saida': {'estado': rotulo(saida_max), 'grau': len(estados[saida_max])} if saida_max else None,
        'maior_grau_entrada': {'estado': rotulo(entrada_max), 'grau': entrada[entrada_max]} if entrada_max else None,
        'multiplicidade_maxima': max_mult,
        'casas_com_multiplicidade_maxima': sum(q == max_mult for q in multiplicidades.values()),
        'numero_becos': len(becos),
        'becos': [rotulo(e) for e in sorted(becos, key=rotulo_estado)],
    }
    graus = [{'estado': rotulo(e), 'grau_entrada': entrada[e], 'grau_saida': len(estados[e])}
             for e in sorted(estados, key=rotulo_estado)]
    return globais, {'camadas': camadas, 'total_arcos_entre_camadas': sum(transicoes.values()),
                     'arcos_entre_camadas': arcos_entre}, graus


def rotulo_estado(estado, bonus_ids=None):
    if estado is None:
        return None
    linha, coluna, chaves, bonus = estado
    # Numerar bônus em ordem de leitura: linha, depois coluna.
    bonus_str = ','.join(str(bonus_ids[coord]) if bonus_ids is not None else str(coord)
                         for coord in sorted(bonus))
    return f'({linha},{coluna})|{chaves or "-"}|{{{bonus_str}}}'


def exportar_metricas(diretorio_mapas, diretorio_saida):
    """Lê todos os mapas .txt da pasta e exporta métricas e graus."""
    diretorios = [Path(p) for p in (diretorio_mapas if isinstance(diretorio_mapas, (list, tuple)) else [diretorio_mapas])]
    diretorio_saida = Path(diretorio_saida)
    diretorio_saida.mkdir(parents=True, exist_ok=True)
    global_por_mapa, camadas_por_mapa = {}, {}
    arquivos = sorted(arquivo for diretorio in diretorios for arquivo in diretorio.glob('*.txt')
                      if arquivo.name != 'sobre.txt')
    if not arquivos:
        raise ValueError(f'Nenhum mapa .txt encontrado em {diretorios}')
    if len({f.stem for f in arquivos}) != len(arquivos):
        raise ValueError('Nomes repetidos de mapas: renomeie os arquivos para evitar sobrescrita')
    for arquivo in arquivos:
        mapa = mapa_input(arquivo)
        globais, camada, graus = calcular_metricas(mapa)
        global_por_mapa[arquivo.stem] = globais
        camadas_por_mapa[arquivo.stem] = camada
        csv_path = diretorio_saida / f'graus_{arquivo.stem}.csv'
        with csv_path.open('w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['estado', 'grau_entrada', 'grau_saida'])
            writer.writeheader()
            writer.writerows(graus)
    for filename, dados in [('metricas_global.json', global_por_mapa), ('camadas.json', camadas_por_mapa)]:
        with (diretorio_saida / filename).open('w', encoding='utf-8') as f:
            json.dump(dados, f, indent=2, ensure_ascii=False)
    return global_por_mapa, camadas_por_mapa
