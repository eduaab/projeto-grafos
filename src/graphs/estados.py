# grafo de posições e grafo de estados

from .graph import encontrar_vizinhos


def criar_estado_inicial(mapa):
    # Retorna a posição inicial sem chaves e sem bônus coletados

    for linha in range(len(mapa)):

        for coluna in range(len(mapa[linha])):

            if mapa[linha][coluna] == 'S':
                return (linha, coluna, '', ())


def custo_entrada(mapa, destino, bonus_coletados):
    # Retorna o custo de entrar na célula, considerando os bônus já coletados

    linha, coluna = destino
    simbolo = mapa[linha][coluna]

    custos = {
        ',': 3,
        '~': 5,
        '*': -2,
        '+': -4
    }

    if simbolo == '+' and destino in bonus_coletados:
        return 1

    custo = custos.get(simbolo, 1)
    return custo


def gerar_movimentos(mapa, estado):
    # Retorna os próximos estados e seus custos, respeitando esteiras, portas e coletas

    linha, coluna, chaves, bonus_coletados = estado
    simbolo_atual = mapa[linha][coluna]
    movimentos = []

    direcoes = {
        '^': (-1, 0),
        '>': (0, 1),
        'v': (1, 0),
        '<': (0, -1)
    }

    for destino in encontrar_vizinhos(mapa, (linha, coluna)):
        nova_linha, nova_coluna = destino

        if simbolo_atual in direcoes:
            movimento = (nova_linha - linha, nova_coluna - coluna)

            if movimento != direcoes[simbolo_atual]:
                continue

        simbolo = mapa[nova_linha][nova_coluna]

        if simbolo in 'ABCD' and simbolo.lower() not in chaves:
            continue

        peso = custo_entrada(mapa, destino, bonus_coletados)
        novas_chaves = chaves
        novos_bonus = bonus_coletados

        if simbolo in 'abcd' and simbolo not in chaves:
            novas_chaves = ''.join(sorted(chaves + simbolo))

        if simbolo == '+' and destino not in bonus_coletados:
            novos_bonus = tuple(sorted(bonus_coletados + (destino,)))

        novo_estado = (nova_linha, nova_coluna, novas_chaves, novos_bonus)
        movimentos.append((novo_estado, peso))

    return movimentos


def criar_grafo_estados(mapa):
    # Monta o grafo com os estados que podem ser alcançados a partir do início

    inicial = criar_estado_inicial(mapa)

    grafo = {inicial: []}
    estados = [inicial]

    indice = 0

    while indice < len(estados):

        estado = estados[indice]

        movimentos = gerar_movimentos(mapa, estado)
        grafo[estado] = movimentos

        for novo_estado, peso in movimentos:

            if novo_estado not in grafo:

                grafo[novo_estado] = []
                estados.append(novo_estado)

        indice += 1

    return grafo
