# lista de adjacência DIRIGIDA

def encontrar_vizinhos(mapa, vertice):
    # Retorna os vizinhos do vértice que estão dentro do mapa e não são paredes

    linha, coluna = vertice
    vizinhos = []

    posicoes = [
        (linha - 1, coluna),
        (linha, coluna + 1),
        (linha + 1, coluna),
        (linha, coluna - 1)
    ]

    for nova_linha, nova_coluna in posicoes:

        if 0 <= nova_linha < len(mapa):

            if 0 <= nova_coluna < len(mapa[nova_linha]):

                if mapa[nova_linha][nova_coluna] != '#':
                    vizinhos.append((nova_linha, nova_coluna))

    return vizinhos


def criar_matriz_adjacencia(grafo):
    # Retorna os custos entre estados de origem e destino e a lista dos estados numerados

    estados = list(grafo)
    indices = {}

    for indice in range(len(estados)):
        indices[estados[indice]] = indice

    matriz = []

    for indice_origem in range(len(estados)):
        custos = []

        for indice_destino in range(len(estados)):

            if indice_origem == indice_destino:
                custos.append(0)
            else:
                custos.append(float('inf'))

        matriz.append(custos)

    for estado_origem in grafo:
        indice_origem = indices[estado_origem]

        for estado_destino, peso in grafo[estado_origem]:
            indice_destino = indices[estado_destino]
            matriz[indice_origem][indice_destino] = peso

    return matriz, estados
