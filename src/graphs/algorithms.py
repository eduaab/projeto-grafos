
# Variaveis globais ou importantes 

nao_descoberto = None
NAO_VISITADO = 0
VISITADO = 1
ENCERRADO = 2

# Dijkstra

def dijkstra(grafo, s):
    d = {}
    p = {}
    for v in grafo:
        d[v] = nao_descoberto
        p[v] = -1
    d[s] = 0

    # Faça aberto[v] = true para todo v no grafo
    aberto = {}
    for v in grafo:
        aberto[v] = True

    # Enquanto houver vértice aberto:
    while True in aberto.values():

        # Escolha u cuja estimativa seja a menor dentre os abertos
        u = None
        for v in grafo:
            if aberto[v]:
                if u is None:
                    u = v
                elif d[v] != nao_descoberto and (d[u] == nao_descoberto or d[v] < d[u]):
                    u = v

        # Feche u
        aberto[u] = False

        # Para todo nó aberto v na adjacência de u:
        for v, peso in grafo[u]:
            if aberto[v]:
                # Relaxe a aresta (u, v)
                soma = d[u] + peso
                if d[v] == nao_descoberto or soma < d[v]:
                    d[v] = soma
                    p[v] = u

    return d, p


# BFS

def bfs(grafo, v0):
    estado = {}
    p = {}
    d = {}

    for v in grafo:
        estado[v] = NAO_VISITADO
        p[v] = None
        d[v] = nao_descoberto 

    d[v0] = 0
    estado[v0] = VISITADO
    F = []
    F.append(v0)

    while len(F) != 0:
        vi = F.pop(0)

        for vj, peso in grafo[vi]:  
            if estado[vj] == NAO_VISITADO:
                F.append(vj)
                estado[vj] = VISITADO
                p[vj] = vi
                d[vj] = d[vi] + 1

        estado[vi] = ENCERRADO

    return d, p

#DFS
def dfs(grafo, v0):
    estado = {}
    p = {}
    d = {}
    f = {}
    arestas = {"arvore": [], "retorno": [], "avanco": [], "cruzamento": []}
    tempo = -1

    for v in grafo:
        estado[v] = NAO_VISITADO
        p[v] = None
        d[v] = None
        f[v] = None

    def visita(vi):
        nonlocal tempo
        tempo += 1
        estado[vi] = VISITADO
        d[vi] = tempo

        for vj, peso in grafo[vi]:
            if estado[vj] == NAO_VISITADO:
                arestas["arvore"].append((vi, vj))
                p[vj] = vi
                visita(vj)
            elif estado[vj] == VISITADO:
                arestas["retorno"].append((vi, vj))
            elif d[vi] < d[vj]:
                arestas["avanco"].append((vi, vj))
            else:
                arestas["cruzamento"].append((vi, vj))

        estado[vi] = ENCERRADO
        tempo += 1
        f[vi] = tempo

    visita(v0)
    tem_ciclo = len(arestas["retorno"]) > 0

    return d, f, p, arestas, tem_ciclo