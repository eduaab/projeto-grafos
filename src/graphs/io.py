import csv
import math
import os


def carregar_arestas(pasta_dataset):
    caminho = os.path.join(pasta_dataset, "arestas_paises.csv")

    if not os.path.isfile(caminho):
        raise FileNotFoundError(f"Arquivo não encontrado: {caminho}")

    colunas_esperadas = ["origem", "destino", "peso", "n_eventos", "par_fraco"]
    arestas = []
    pares_vistos = set()

    with open(caminho, "r", encoding="utf-8", newline="") as arquivo:
        leitor = csv.DictReader(arquivo)

        if leitor.fieldnames is None:
            raise ValueError("Arquivo CSV vazio ou sem cabeçalho.")

        for coluna in colunas_esperadas:
            if coluna not in leitor.fieldnames:
                raise ValueError(f"Coluna obrigatória ausente no CSV: {coluna}")

        numero_linha = 1
        for linha in leitor:
            numero_linha += 1

            origem = linha["origem"].strip()
            destino = linha["destino"].strip()

            if origem == "" or destino == "":
                raise ValueError(
                    f"Linha {numero_linha}: origem ou destino vazio."
                )

            if origem == destino:
                raise ValueError(
                    f"Linha {numero_linha}: laço encontrado ({origem} -> {destino})."
                )

            par = (origem, destino)
            if par in pares_vistos:
                raise ValueError(
                    f"Linha {numero_linha}: par repetido ({origem} -> {destino})."
                )
            pares_vistos.add(par)

            try:
                peso = float(linha["peso"])
            except ValueError:
                raise ValueError(
                    f"Linha {numero_linha}: peso inválido ({linha['peso']})."
                ) from None

            if not math.isfinite(peso):
                raise ValueError(
                    f"Linha {numero_linha}: peso não finito ({linha['peso']})."
                )

            try:
                n_eventos = int(linha["n_eventos"])
            except ValueError:
                raise ValueError(
                    f"Linha {numero_linha}: n_eventos inválido ({linha['n_eventos']})."
                ) from None

            if n_eventos < 1:
                raise ValueError(
                    f"Linha {numero_linha}: n_eventos deve ser pelo menos 1 ({n_eventos})."
                )

            texto_fraco = linha["par_fraco"].strip().lower()
            if texto_fraco == "true":
                par_fraco = True
            elif texto_fraco == "false":
                par_fraco = False
            else:
                raise ValueError(
                    f"Linha {numero_linha}: par_fraco inválido ({linha['par_fraco']})."
                )

            arestas.append({
                "origem": origem,
                "destino": destino,
                "peso": peso,
                "n_eventos": n_eventos,
                "par_fraco": par_fraco,
            })

    return arestas


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
