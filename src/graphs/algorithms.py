
# Variaveis globais ou importantes 

NAO_DESCOBERTO = None
NAO_VISITADO = 0
VISITADO = 1
ENCERRADO = 2

# Dijkstra

def dijkstra(grafo, s):
    d = {}
    p = {}
    for v in grafo:
        d[v] = NAO_DESCOBERTO
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
                elif d[v] != NAO_DESCOBERTO and (d[u] == NAO_DESCOBERTO or d[v] < d[u]):
                    u = v

        # Feche u
        aberto[u] = False

        # Para todo nó aberto v na adjacência de u:
        for v, peso in grafo[u]:
            if aberto[v]:
                # Relaxe a aresta (u, v)
                soma = d[u] + peso
                if d[v] == NAO_DESCOBERTO or soma < d[v]:
                    d[v] = soma
                    p[v] = u

    return d, p

# Bellman-Ford

def bellman_ford(grafo, origem):
    if origem not in grafo:
        raise ValueError("A origem não pertence ao grafo.")

    n = len(grafo)

    distancias = {}
    predecessores = {}
    pesos_predecessores = {}

    for vertice in grafo:
        distancias[vertice] = float("inf")
        predecessores[vertice] = None

    distancias[origem] = 0

    # Verifica todas as arestas V - 1 vezes
    for passada in range(n - 1):
        for inicio in grafo:
            if distancias[inicio] == float("inf"):
                continue

            for destino, peso in grafo[inicio]:
                nova_distancia = distancias[inicio] + peso

                if nova_distancia < distancias[destino]:
                    distancias[destino] = nova_distancia
                    predecessores[destino] = inicio
                    pesos_predecessores[destino] = peso

    # Faz uma passada adicional para detectar ciclo negativo
    afetado = None

    for inicio in grafo:
        if distancias[inicio] == float("inf"):
            continue

        for destino, peso in grafo[inicio]:
            nova_distancia = distancias[inicio] + peso

            if nova_distancia < distancias[destino]:
                distancias[destino] = nova_distancia
                predecessores[destino] = inicio
                pesos_predecessores[destino] = peso
                afetado = destino

    if afetado is None:
        return distancias, predecessores, None, None

    # Volta V vezes para garantir que entrou no ciclo
    atual = afetado

    for passo in range(n):
        atual = predecessores[atual]

    # Recupera o ciclo seguindo os predecessores
    inicio_ciclo = atual
    ciclo = [inicio_ciclo]
    atual = predecessores[inicio_ciclo]

    while atual != inicio_ciclo:
        ciclo.append(atual)
        atual = predecessores[atual]

    # Coloca no sentido das arestas e fecha o ciclo
    ciclo.reverse()
    ciclo.append(ciclo[0])

    # Soma os pesos das arestas do ciclo
    custo_ciclo = 0

    for vertice in ciclo[1:]:
        custo_ciclo += pesos_predecessores[vertice]

    return distancias, predecessores, ciclo, custo_ciclo

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