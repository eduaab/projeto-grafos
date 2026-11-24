"""Exportação reprodutível dos resultados da Parte 1.
# [IA] ChatGPT – apoio à exportação/UX (uso a declarar conforme orientação docente).
As buscas são executadas usando os algoritmos já existentes do grupo.
"""
import csv
import json
import re
import sys
from collections import deque
from pathlib import Path
from .io import mapa_input
from .estados import ALVO, criar_grafo_estados, criar_estado_inicial, gerar_movimentos
from .algorithms import bfs, dfs, dijkstra, bellman_ford
from .metricas import grafo_posicoes, grafo_posicoes_ponderado, rotulo_estado, exportar_metricas

FIELDS = ('mapa','algoritmo','passos','custo','status','caminho')

def save_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')

def save_csv(path, fields, rows):
    with path.open('w', newline='', encoding='utf-8') as handle:
        wr = csv.DictWriter(handle, fieldnames=fields)
        wr.writeheader()
        wr.writerows(rows)

def codigo_mapa(nome):
    """'m04_esteiras' -> 'm04'; nomes fora do padrao m<numero>_... ficam como estao."""
    casado = re.match(r'^(m\d+)(?:_|$)', nome)
    return casado.group(1) if casado else nome

def bonus_index(mapa, incluir_fonte=False):
    simbolos = ('+', '*') if incluir_fonte else ('+',)
    return {(i,j): k for k,(i,j) in enumerate((i,j) for i,r in enumerate(mapa) for j,x in enumerate(r) if x in simbolos)}

def encode(st, ids):
    return 'ALVO' if st == ALVO else rotulo_estado(st, ids)

def reconstruir(pred, target):
    if target not in pred: return []
    path, visited, v = [], set(), target
    while v is not None and v != -1 and v not in visited:
        visited.add(v); path.append(v); v = pred.get(v)
    return path[::-1] if v in (None,-1) else []

def custo(grafo, path):
    total = 0
    for u,v in zip(path,path[1:]):
        matches = [w for d,w in grafo[u] if d==v]
        if not matches: raise ValueError('Caminho contem arco inexistente')
        total += matches[0]
    return total

def armadilhas(grafo):
    reverse = {s: [] for s in grafo}
    for u, edges in grafo.items():
        for v,_ in edges: reverse[v].append(u)
    queue=deque([ALVO]); can_reach={ALVO}
    while queue:
        v=queue.popleft()
        for u in reverse[v]:
            if u not in can_reach:
                can_reach.add(u); queue.append(u)
    return [s for s in grafo if s not in can_reach and s != ALVO]

def posicao_inicial(mapa):
    return next((i, j) for i, row in enumerate(mapa) for j, c in enumerate(row) if c == 'S')

def shortest_position(mapa, doors):
    pos=grafo_posicoes(mapa)
    if doors=='wall':
        closed={(i,j) for i,row in enumerate(mapa) for j,c in enumerate(row) if c in 'ABCD'}
        pos={u:[v for v in edges if v not in closed] if u not in closed else [] for u,edges in pos.items()}
    start=next((i,j) for i,row in enumerate(mapa) for j,c in enumerate(row) if c=='S')
    exits={(i,j) for i,row in enumerate(mapa) for j,c in enumerate(row) if c=='G'}
    prev={start:None}; q=deque([start]); goal=None
    while q:
        u=q.popleft()
        if u in exits:goal=u;break
        for v in pos[u]:
            if v not in prev:prev[v]=u;q.append(v)
    if goal is None: return None, []
    path=reconstruir(prev,goal)
    return len(path)-1,path

def path_is_valid(mapa, path):
    st=criar_estado_inicial(mapa)
    for r,c in path[1:]:
        options=[v for v,w in gerar_movimentos(mapa,st) if v != ALVO and v[:2]==(r,c)]
        if not options:return False
        st=options[0]
    return True

def generate(map_dirs, output):
    output=Path(output); output.mkdir(parents=True,exist_ok=True)
    exportar_metricas(map_dirs, output)
    files=sorted(p for directory in map_dirs for p in Path(directory).glob('*.txt') if p.name != 'sobre.txt')
    results, dfs_rows, comparisons = [], [], []
    animations={}
    sys.setrecursionlimit(max(sys.getrecursionlimit(),15000))
    for file in files:
        maze=mapa_input(file); name=file.stem; ids=bonus_index(maze)
        graph=criar_grafo_estados(maze); start=criar_estado_inicial(maze)
        rows=[]
        for u,edges in graph.items():
            if u==ALVO: continue
            for v,w in edges:
                if v==ALVO: move='ALVO'; tile='G'
                else:
                    dr,dc=v[0]-u[0],v[1]-u[1]
                    move={(-1,0):'N',(0,1):'L',(1,0):'S',(0,-1):'O'}[(dr,dc)]
                    tile=maze[v[0]][v[1]]
                rows.append({'origem':encode(u,ids),'destino':encode(v,ids),'movimento':move,'casa_destino':tile,'peso':w})
        save_csv(output/f'arestas_{name}.csv',['origem','destino','movimento','casa_destino','peso'],rows)
        traps=armadilhas(graph)
        if name in ('m04_esteiras','m07_impossivel'):
            save_csv(output/f'armadilhas_{codigo_mapa(name)}.csv',['estado'],[{'estado':encode(s,ids)} for s in traps])
        animations[name]={'mapa':[''.join(r) for r in maze], 'armadilhas':[[s[0],s[1],s[2] or '-'] for s in traps], 'algoritmos':{}}
        has_negative=any(w<0 for es in graph.values() for _,w in es)
        for algo,fn in [('BFS',bfs),('DFS',dfs),('DIJKSTRA',dijkstra),('BELLMAN_FORD',bellman_ford)]:
            status='OK'; path=[]; cost=None; steps=None; cycle=None
            if algo=='DIJKSTRA' and has_negative:status='RECUSA'
            else:
                r=fn(graph,start)
                if algo=='DFS':
                    disc,finished,pred,arcs,has_cycle=r
                    linha_dfs = {'mapa': name}

                    for categoria, arcos in arcs.items():
                        linha_dfs[categoria] = json.dumps(
                            [[encode(u, ids), encode(v, ids)] for u, v in arcos],
                            ensure_ascii=False,
                        )
                        linha_dfs[f'quantidade_{categoria}'] = len(arcos)

                    dfs_rows.append(linha_dfs)
                    alcancado=disc.get(ALVO) is not None
                elif algo=='BELLMAN_FORD':
                    dist,pred,cycle,cycle_cost=r
                    if cycle: status='CICLO_NEGATIVO';cost=cycle_cost
                    alcancado=dist.get(ALVO) is not None and dist.get(ALVO)!=float('inf')
                else:
                    dist,pred=r
                    alcancado=dist.get(ALVO) is not None and dist.get(ALVO)!=float('inf')
                if status=='OK':
                    if not alcancado:status='SEM_SOLUCAO'
                    else:
                        path=reconstruir(pred,ALVO)
                        if not path:status='SEM_SOLUCAO'
                        else:steps=len(path)-2;cost=custo(graph,path)
            encoded=[encode(s,ids) for s in path]
            results.append(dict(mapa=name,algoritmo=algo,passos=steps,custo=cost,status=status,caminho=json.dumps(encoded,ensure_ascii=False) if path else (json.dumps([encode(s,ids) for s in cycle],ensure_ascii=False) if cycle else '')))
            animations[name]['algoritmos'][algo]={'status':status,'passos':steps,'custo':cost,'caminho':[{'linha':s[0],'coluna':s[1],'chaves':s[2] or '-','bonus':[ids[b] for b in s[3]]} for s in path if s != ALVO], 'ciclo':[encode(s,ids) for s in cycle] if cycle else []}
            if name=='m03_tres_chaves' and algo=='BELLMAN_FORD' and path:
                save_json(output/'percurso_m03.json', [{'estado':encode(s,ids),'custo_acumulado':custo(graph,path[:idx+1])} for idx,s in enumerate(path)])
            if name=='m06_fonte' and algo=='BELLMAN_FORD':
                grafo_consumivel=criar_grafo_estados(maze,fonte_consumivel=True)
                ids_consumivel=bonus_index(maze,incluir_fonte=True)
                dist_c,pred_c,ciclo_c,custo_ciclo_c=bellman_ford(grafo_consumivel,start)
                if ciclo_c:
                    status_c,caminho_c,passos_c,custo_c='CICLO_NEGATIVO',[],None,custo_ciclo_c
                elif dist_c.get(ALVO) is None or dist_c.get(ALVO)==float('inf'):
                    status_c,caminho_c,passos_c,custo_c='SEM_SOLUCAO',[],None,None
                else:
                    caminho_c=reconstruir(pred_c,ALVO)
                    status_c='OK' if caminho_c else 'SEM_SOLUCAO'
                    passos_c=len(caminho_c)-2 if caminho_c else None
                    custo_c=custo(grafo_consumivel,caminho_c) if caminho_c else None
                save_json(output/'ciclo_negativo_m06.json',{
                    'ciclo':[encode(s,ids) for s in cycle] if cycle else [],
                    'custo':cost,
                    'status':status,
                    'fonte_consumivel':{
                        'status':status_c,
                        'passos':passos_c,
                        'custo':custo_c,
                        'caminho':[encode(s,ids_consumivel) for s in caminho_c],
                    },
                })
            if name=='m05_bonus' and algo=='BELLMAN_FORD':
                pos_graph=grafo_posicoes_ponderado(maze); pos_start=posicao_inicial(maze)
                _,_,pos_cycle,pos_cycle_cost=bellman_ford(pos_graph,pos_start)
                save_json(output/'bellman_ford_g_pos_m05.json',{
                    'g_pos':{'status':'CICLO_NEGATIVO' if pos_cycle else 'OK',
                             'ciclo':[f'({l},{c})' for l,c in pos_cycle] if pos_cycle else [],
                             'custo':pos_cycle_cost},
                    'g_est':{'status':status,'custo':cost},
                })
        if name in ('m02_uma_chave','m03_tres_chaves','m04_esteiras'):
            for approach in ('portas_como_chao','portas_como_parede'):
                n,path=shortest_position(maze,'wall' if approach=='portas_como_parede' else 'floor')
                valid=path_is_valid(maze,path) if path else False
                comparisons.append(dict(mapa=name,abordagem=approach,passos=n,caminho_valido=valid,observacao='Sem caminho' if n is None else ('Caminho respeita regras' if valid else 'Caminho invalido pelas regras de chaves/esteiras')))
            bst=animations[name]['algoritmos']['BFS']
            comparisons.append(dict(mapa=name,abordagem='grafo_de_estados',passos=bst['passos'],caminho_valido=bst['status']=='OK',observacao='Modelagem com chaves e bonus'))
        print(
            f'{name}: {len(graph)-1} estados sem ALVO, '
            f'{len(rows)} arcos incluindo ligações a ALVO; '
            f'armadilhas={len(traps)}',
            flush=True,
        )
    save_csv(output/'solucoes.csv',FIELDS,results)
    save_csv(
        output / 'dfs_classificacao.csv',
        [
            'mapa', 'arvore', 'retorno', 'avanco', 'cruzamento',
            'quantidade_arvore', 'quantidade_retorno',
            'quantidade_avanco', 'quantidade_cruzamento',
        ],
        dfs_rows,
    )
    save_csv(output/'comparacao_modelagem.csv',['mapa','abordagem','passos','caminho_valido','observacao'],comparisons)
    save_json(output/'dados_interativos.json',animations)
    return animations

def gerar_html_interativo(pasta_dados, pasta_html=None, mapa_padrao=None):
    """Gera o mesmo simulador autônomo usado pelo frontend."""
    import subprocess
    root = Path(__file__).resolve().parents[2]
    subprocess.run([sys.executable, str(root / 'scripts' / 'exportar_exploracao.py')], check=True)
    pasta_html = Path(pasta_html) if pasta_html else Path(pasta_dados)
    pasta_html.mkdir(parents=True, exist_ok=True)
    dados = json.loads((root / 'out' / 'parte1' / 'exploracao.json').read_text(encoding='utf-8'))
    pasta_dados = Path(pasta_dados)
    if (pasta_dados / 'exploracao.json').exists():
        dados = json.loads((pasta_dados / 'exploracao.json').read_text(encoding='utf-8'))
    else:
        fornecidos = json.loads((pasta_dados / 'dados_interativos.json').read_text(encoding='utf-8'))
        dados = {nome: dados[nome] if nome in dados and dados[nome]['mapa'] == mapa['mapa']
                 else {'mapa': mapa['mapa'], 'estados': [], 'consumiveis': [], 'armadilhas': []}
                 for nome, mapa in fornecidos.items()}
    payload = json.dumps(dados, ensure_ascii=True, separators=(',', ':')).replace('</', '<\\/')
    source = root / 'frontend' / 'simulator'
    pagina = (source / 'index.html').read_text(encoding='utf-8')
    pagina = pagina.replace('__STYLE__', (source / 'style.css').read_text(encoding='utf-8'))
    pagina = pagina.replace('__SCRIPT__', (source / 'app.js').read_text(encoding='utf-8'))
    pagina = pagina.replace('__DATA__', payload)
    pagina = pagina.replace('__DEFAULT__', json.dumps(mapa_padrao if mapa_padrao in dados else None))
    destino = pasta_html / 'labirinto_interativo.html'
    destino.write_text(pagina, encoding='utf-8')
    return destino
