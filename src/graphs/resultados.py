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

def bonus_index(mapa):
    return {(i,j): k for k,(i,j) in enumerate((i,j) for i,r in enumerate(mapa) for j,x in enumerate(r) if x == '+')}

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
                    dfs_rows.append({'mapa':name, **{category: json.dumps([[encode(u,ids),encode(v,ids)] for u,v in values],ensure_ascii=False) for category,values in arcs.items()}})
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
                save_json(output/'ciclo_negativo_m06.json',{'ciclo':[encode(s,ids) for s in cycle] if cycle else [],'custo':cost,'status':status})
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
        print(f'{name}: {len(graph)-1} estados, {len(rows)} arcos; armadilhas={len(traps)}',flush=True)
    save_csv(output/'solucoes.csv',FIELDS,results)
    save_csv(output/'dfs_classificacao.csv',['mapa','arvore','retorno','avanco','cruzamento'],dfs_rows)
    save_csv(output/'comparacao_modelagem.csv',['mapa','abordagem','passos','caminho_valido','observacao'],comparisons)
    save_json(output/'dados_interativos.json',animations)
    return animations

_HTML_INTERATIVO = r'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Labirinto Interativo · Teoria dos Grafos</title>
<style>
:root{font-family:Inter,system-ui,Arial,sans-serif;color:#eaf2e8;background:#101a18}*{box-sizing:border-box}body{margin:0}header{padding:26px max(24px,calc((100vw - 1250px)/2));background:#182a24;border-bottom:1px solid #435647}header h1{margin:4px 0;font-size:clamp(24px,4vw,36px)}header p{color:#bfc9c3;margin:6px 0}main{max-width:1250px;margin:auto;padding:24px;display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:20px}section,.panel{background:#1c2c28;border:1px solid #3d5045;border-radius:12px;padding:18px}h2{font-size:18px;margin:0 0 13px}label{display:block;font-weight:600;font-size:13px;margin:12px 0 5px}button,select,input{font:inherit}select,input[type=range],button{max-width:100%}select{width:100%;border:1px solid #738c7d;background:#13221c;color:#fff;border-radius:7px;padding:9px}button{background:#385b45;border:1px solid #789780;color:white;padding:10px 13px;border-radius:8px;cursor:pointer}button:hover{background:#507b5d}button:disabled{opacity:.4;cursor:not-allowed}.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.board-scroller{overflow:auto;max-height:75vh}.board{display:grid;gap:2px;width:max-content;margin:10px auto 16px;background:#0e1714;padding:4px;border-radius:5px}.tile{width:var(--size);height:var(--size);display:grid;place-items:center;font-weight:700;font-size:calc(var(--size)*.53);border-radius:3px;background:#d8e1cd;color:#16201a;position:relative}.wall{background:#32403a;color:#32403a}.mud{background:#9d7659}.water{background:#6ea5b7}.key{background:#e6c362}.door{background:#aa7979}.goal{background:#81c79b}.start{background:#f4d595}.belt{background:#a3a4da}.bonus{background:#f7b985}.source{background:#d798b7}.trail{outline:3px solid var(--trail);outline-offset:-3px}.current{box-shadow:0 0 0 3px white inset,0 0 0 2px #efaf60;z-index:1}.trap{background:#c55e62!important;color:white}.dim{opacity:.26}.data{background:#13221c;padding:12px;border-radius:8px;line-height:1.65;min-height:135px;word-wrap:break-word}small,.hint{color:#aebdb5}.legend{font-size:12px;line-height:1.8;color:#c6d4c9}.notice{background:#382b22;padding:10px;border-radius:8px;color:#ffdba7}.check{display:flex;align-items:center;gap:8px;font-weight:400}textarea{width:100%;min-height:130px;background:#10211a;color:#f2f2ea;border:1px solid #617668;border-radius:7px;padding:8px;font:13px monospace}.editor-tools{display:flex;gap:6px;flex-wrap:wrap}.editor-tools button{padding:7px 10px}.editor-tools .active{background:#ba864e;color:#111}input[type=file]{width:100%;color:#fff}a{color:#b8dfb7}@media(max-width:820px){main{grid-template-columns:1fr}.board-scroller{max-height:65vh}}
</style></head><body><header><h1>Labirinto com Chaves</h1><p>Algoritmos calculados no Python · reprodução visual, camadas e editor de mapas</p></header><main>
<section><h2 id="mapTitle">Mapa</h2><div class="board-scroller"><div id="board" class="board" role="img" aria-label="Grade do labirinto"></div></div><div class="legend"># parede · S início · G saída · a–d chaves · A–D portas · &gt;&lt;^v esteiras · + bônus · * fonte · , lama · ~ água</div><p class="hint" id="stepText"></p></section>
<aside><div class="panel"><h2>Execução</h2><label for="mapSelect">Mapa</label><select id="mapSelect"></select><label for="algSelect">Algoritmo</label><select id="algSelect"><option>BFS</option><option>DFS</option><option>DIJKSTRA</option><option>BELLMAN_FORD</option></select><label for="speed">Velocidade da animação</label><input id="speed" type="range" min="150" max="1400" step="50" value="650"><small id="speedText">650 ms por passo</small><div class="toolbar"><button id="back">◀ Anterior</button><button id="play">▶ Iniciar</button><button id="next">Próximo ▶</button></div><label for="layerSelect">Camada (chaves coletadas)</label><select id="layerSelect"><option value="all">Todas</option></select><label class="check"><input id="traps" type="checkbox"> Mostrar posições com estados-armadilha</label><div class="data" id="stats" aria-live="polite"></div><p class="hint">A animação reproduz os caminhos já calculados; para executar mapas editados, salve o .txt e gere novamente os resultados no Python.</p></div></aside>
<section><h2>Editor de labirintos</h2><p class="hint">Edite a grade atual, importe um mapa .txt ou exporte o seu. Para incluir o novo mapa na execução, coloque-o em <code>data/mapas_grupo/</code> e execute o exportador.</p><div class="toolbar"><button id="editToggle">Ativar edição</button><button id="reset">Restaurar mapa</button><button id="export">Baixar .txt</button></div><label for="symbol">Pincel</label><div class="editor-tools" id="tools"></div><label for="paste">Importar texto do mapa</label><textarea id="paste" placeholder="Cole aqui as linhas do labirinto... ou use arquivo .txt"></textarea><div class="toolbar"><button id="importText">Carregar texto</button><input id="file" type="file" accept=".txt"></div><p class="hint" id="editStatus"></p></section>
<section><h2>Sobre os resultados</h2><p>Os caminhos e classificações são provenientes dos algoritmos do grupo, executados sobre o grafo de estados.</p><p>Para mapas sem solução, com peso negativo recusado ou com ciclo negativo, o sistema mostra o status em vez de inventar um caminho.</p><p><a href="/">Voltar ao site do projeto</a></p></section>
</main><script>const DATA=__DATA__;const DEFAULT_MAP=__DEFAULT__;</script>
<script>
const $=id=>document.getElementById(id);const mapSelect=$('mapSelect'),algSelect=$('algSelect'),board=$('board'),stats=$('stats');let currentMap='',grid=[],editing=false,step=0,timer=null;const colors=['#f1b74f','#66c4be','#c19dea','#eb828e','#8dcd6b'];const marks={'.':'','S':'S','G':'G','#':'','+':'+','*':'*',',':'≋','~':'≈'};const dirs=['^','>','v','<'];function stop(){if(timer){clearInterval(timer);timer=null};$('play').textContent='▶ Iniciar'};
function lookup(){return DATA[currentMap]?.algoritmos[algSelect.value]||{status:'SEM_SOLUCAO',caminho:[]}}
function palette(c){if(c==='#')return 'wall';if(c===',')return 'mud';if(c==='~')return 'water';if(c==='S')return 'start';if(c==='G')return 'goal';if('abcd'.includes(c))return 'key';if('ABCD'.includes(c))return 'door';if(dirs.includes(c))return 'belt';if(c==='+')return 'bonus';if(c==='*')return 'source';return ''}
function layerMatch(r,c,l){if(l==='all')return true;return (lookup().caminho||[]).some(s=>s.linha===r&&s.coluna===c&&s.chaves===l)}
function render(){let path=lookup().caminho||[],trace=path.slice(0,step+1),last=trace.at(-1),layers=['-'];path.forEach(s=>{if(!layers.includes(s.chaves))layers.push(s.chaves)});const selected=$('layerSelect').value;const cellsize=Math.max(17,Math.min(37,Math.floor(900/(grid[0]?.length||1))));board.style.setProperty('--size',cellsize+'px');board.style.gridTemplateColumns=`repeat(${grid[0]?.length||1},${cellsize}px)`;board.innerHTML='';const traps=new Set((DATA[currentMap]?.armadilhas||[]).map(a=>a[0]+','+a[1]));grid.forEach((row,r)=>row.forEach((c,col)=>{const el=document.createElement('div');el.className='tile '+palette(c);el.textContent=marks[c]??c;if($('traps').checked&&traps.has(r+','+col))el.classList.add('trap');const visits=trace.filter(s=>s.linha===r&&s.coluna===col);if(visits.length){let keyCount=visits.at(-1).chaves==='-'?0:visits.at(-1).chaves.length;el.classList.add('trail');el.style.setProperty('--trail',colors[Math.min(keyCount,colors.length-1)])}if(last&&r===last.linha&&col===last.coluna)el.classList.add('current');if(selected!=='all'&&!layerMatch(r,col,selected))el.classList.add('dim');if(editing){el.style.cursor='crosshair';el.addEventListener('click',()=>{grid[r][col]=brush;render();$('editStatus').textContent='Mapa alterado: exporte .txt e recalcule os algoritmos para atualizar os resultados.'})}board.appendChild(el)}));let result=lookup(),state=last?`(${last.linha},${last.coluna}) | chaves: ${last.chaves} | bônus: {${last.bonus.join(',')}}`:'—';let runningCost=0;for(let i=1;i<trace.length;i++){let s=trace[i],v=grid[s.linha][s.coluna];runningCost+=v===','?3:v==='~'?5:v==='*'?-2:v==='+'&&!trace.slice(0,i).some(x=>x.linha===s.linha&&x.coluna===s.coluna)?-4:1}stats.innerHTML=`<strong>Status: ${result.status}</strong><br>Passos: ${result.passos??'—'} · Custo final: ${result.custo??'—'}<br>Estado atual: ${state}<br>Custo acumulado: ${runningCost}${result.ciclo?.length?'<br>Ciclo negativo detectado: '+result.ciclo.length+' estados':''}`;$('stepText').textContent=`Passo ${path.length?Math.min(step+1,path.length):0} de ${path.length}. ${editing?'Modo de edição ativado.':''}`;$('back').disabled=step===0||!path.length;$('next').disabled=step>=path.length-1||!path.length;}
function updateLayers(){let opts=['all','-',...new Set((lookup().caminho||[]).map(s=>s.chaves))];$('layerSelect').innerHTML='';[...new Set(opts)].forEach(l=>{let o=document.createElement('option');o.value=l;o.textContent=l==='all'?'Todas':l==='-'?'Sem chaves':'Chaves: '+l;$('layerSelect').appendChild(o)})}
function loadMap(){stop();currentMap=mapSelect.value;grid=DATA[currentMap].mapa.map(s=>Array.from(s));step=0;editing=false;$('editToggle').textContent='Ativar edição';$('mapTitle').textContent=currentMap;updateLayers();render()};function choose(){stop();step=0;updateLayers();render()}
Object.keys(DATA).forEach(name=>{let opt=document.createElement('option');opt.value=name;opt.textContent=name;mapSelect.appendChild(opt)});mapSelect.onchange=loadMap;algSelect.onchange=choose;$('layerSelect').onchange=render;$('traps').onchange=render;$('speed').oninput=()=>{$('speedText').textContent=$('speed').value+' ms por passo';if(timer){stop();togglePlay()}};$('next').onclick=()=>{stop();step=Math.min((lookup().caminho||[]).length-1,step+1);render()};$('back').onclick=()=>{stop();step=Math.max(0,step-1);render()};function togglePlay(){if(timer){stop();return};if((lookup().caminho||[]).length<2)return;if(step>=(lookup().caminho||[]).length-1)step=0;$('play').textContent='⏸ Pausar';timer=setInterval(()=>{step++;render();if(step>=(lookup().caminho||[]).length-1)stop()},Number($('speed').value))};$('play').onclick=togglePlay;
let brush='#';const symbols=['#','.','S','G',',','~','a','b','c','d','A','B','C','D','^','>','v','<','+','*'];symbols.forEach(c=>{const b=document.createElement('button');b.textContent=c;b.title='Pintar '+c;b.onclick=()=>{brush=c;document.querySelectorAll('#tools button').forEach(x=>x.classList.remove('active'));b.classList.add('active')};if(c==='#')b.classList.add('active');$('tools').appendChild(b)});$('editToggle').onclick=()=>{stop();editing=!editing;$('editToggle').textContent=editing?'Sair da edição':'Ativar edição';render()};$('reset').onclick=loadMap;
function validate(rows){if(!rows.length||!rows[0].length)throw Error('Mapa vazio');if(rows.some(r=>r.length!==rows[0].length))throw Error('Linhas com tamanhos diferentes');const full=rows.join('');if((full.match(/S/g)||[]).length!==1)throw Error('É necessário exatamente um S');if(!full.includes('G'))throw Error('É necessária pelo menos uma saída G');if([...full].some(c=>!symbols.includes(c)))throw Error('Símbolo desconhecido no mapa')}
function importData(text){try{const rows=text.split(/\r?\n/).filter(s=>s.length&&!s.startsWith(';'));validate(rows);stop();grid=rows.map(s=>Array.from(s));editing=true;$('editToggle').textContent='Sair da edição';$('editStatus').textContent='Mapa importado para edição; os resultados mostrados pertencem ao mapa original. Exporte e recalcule para atualizá-los.';render()}catch(e){$('editStatus').textContent='Erro: '+e.message}}$('importText').onclick=()=>importData($('paste').value);$('file').onchange=async e=>{let f=e.target.files?.[0];if(f)importData(await f.text())};$('export').onclick=()=>{try{validate(grid.map(r=>r.join('')));const data=grid.map(r=>r.join('')).join('\n')+'\n';const blob=new Blob([data],{type:'text/plain;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='labirinto_grupo.txt';a.click();URL.revokeObjectURL(u);$('editStatus').textContent='Arquivo exportado. Para calcular os resultados, salve em data/mapas_grupo/ e execute o gerador.'}catch(e){$('editStatus').textContent='Erro: '+e.message}};if(DEFAULT_MAP&&DATA[DEFAULT_MAP]){mapSelect.value=DEFAULT_MAP}loadMap();
</script></body></html>'''

def gerar_html_interativo(pasta_dados, pasta_html=None, mapa_padrao=None):
    """Monta out/parte1/labirinto_interativo.html a partir de dados_interativos.json.

    pasta_dados: onde ler dados_interativos.json (normalmente out/parte1).
    pasta_html: onde escrever o html (default: a propria pasta_dados).
    mapa_padrao: nome do mapa (sem extensao) que deve vir pre-selecionado.
    """
    pasta_dados = Path(pasta_dados)
    pasta_html = Path(pasta_html) if pasta_html else pasta_dados
    pasta_html.mkdir(parents=True, exist_ok=True)
    dados = json.loads((pasta_dados/'dados_interativos.json').read_text(encoding='utf-8'))
    payload = json.dumps(dados, ensure_ascii=False).replace('</', '<\\/')
    default_valido = mapa_padrao if mapa_padrao in dados else None
    pagina = _HTML_INTERATIVO.replace('__DATA__', payload).replace('__DEFAULT__', json.dumps(default_valido))
    destino = pasta_html/'labirinto_interativo.html'
    destino.write_text(pagina, encoding='utf-8')
    return destino
