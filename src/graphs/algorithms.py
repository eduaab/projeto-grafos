
# Variaveis globais ou importantes 

nao_descoberto = None

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