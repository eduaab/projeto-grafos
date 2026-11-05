# io.py
# ler/validar os mapas e o dataset

SIMBOLOS_VALIDOS = set("#.SG,~abcdABCD><^v+*")


class MapaInvalidoError(ValueError):
    """Levantada quando o arquivo de mapa não respeita o formato esperado."""

    def __init__(self, erros):
        if isinstance(erros, str):
            erros = [erros]
        self.erros = list(erros)
        super().__init__("\n".join(self.erros))


def mapa_input(path):
    # Lê o arquivo, descarta comentários, valida e retorna a matriz

    with open(path, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    # remove só quebras de linha
    lines = [line.rstrip('\r\n') for line in lines]

    # tira os comentários antes de montar a grade
    lines = [line for line in lines if not line.startswith(';')]

    # ignora linhas em branco no final do arquivo
    while lines and lines[-1] == '':
        lines.pop()

    mapa = [list(line) for line in lines]
    validar_mapa(mapa)
    return mapa


def validar_mapa(mapa):
    erros = []

    # Mapa vazio: não há o que mais verificar
    if not mapa or not mapa[0]:
        raise MapaInvalidoError("O mapa está vazio.")

    # Mapa não retangular (uma mensagem por linha com largura diferente)
    largura = len(mapa[0])
    for i, row in enumerate(mapa, start=1):
        if len(row) != largura:
            erros.append(
                f"A linha {i} da grade tem {len(row)} colunas, "
                f"mas o mapa espera {largura}."
            )

    # Símbolo inválido (uma mensagem por ocorrência)
    for i, row in enumerate(mapa, start=1):
        for j, ch in enumerate(row, start=1):
            if ch not in SIMBOLOS_VALIDOS:
                erros.append(
                    f"Símbolo inválido '{ch}' na linha {i} da grade, coluna {j}."
                )

    # Só um início
    qtd_s = sum(row.count('S') for row in mapa)
    if qtd_s != 1:
        erros.append(
            f"O mapa deve ter exatamente um inicio. Foram encontrados {qtd_s}."
        )

    # Pelo menos uma saída
    if not any('G' in row for row in mapa):
        erros.append("O mapa deve ter pelo menos uma saida.")

    if erros:
        raise MapaInvalidoError(erros)


def mapa_print(mapa):
    # Imprime a matriz de caracteres

    for row in mapa:
        print(''.join(row))