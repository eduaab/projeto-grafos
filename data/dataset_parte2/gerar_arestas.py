#!/usr/bin/env python3
"""Gera a lista de arestas do grafo de países (todos os anos juntos).

Entrada: processado/pares_paises_por_ano.csv.gz (gerado por Resumir_Anos.ipynb)
Saídas:  arestas_paises.csv
         paises_padronizados.csv  (nomes de países unificados e quantos eventos foram afetados)

Cada aresta é um par dirigido origem -> destino entre países diferentes.
peso = média da intensidade de todos os eventos do par.

Como rodar (dentro de data/dataset_parte2/):
    python gerar_arestas.py
"""
# [IA] Claude – apoio com pandas na agregação dos pares por país e na padronização dos nomes
import argparse
from pathlib import Path

import pandas as pd

PASTA_SCRIPT = Path(__file__).resolve().parent
LIMITE_PAR_FRACO = 1

# Nomes que criavam mais de um nó para o mesmo país:
# - Macedônia: virou Macedônia do Norte em 2019, e de 2020 em diante o nome como
#   país de origem vem cortado ("the former Yugoslav Republic of").
# - Curaçao: em 2017 o "ç" vem corrompido ("CuraÃ§ao").
PADRONIZACAO_PAISES = {
    "the former Yugoslav Republic of": (
        "North Macedonia",
        "nome cortado nos dados como país de origem em 2020-2022",
    ),
    "the former Yugoslav Republic of Macedonia": (
        "North Macedonia",
        "nome antigo; o país passou a se chamar Macedônia do Norte em 2019",
    ),
    "CuraÃ§ao": (
        "Curaçao",
        "caractere corrompido (erro de codificação) nos dados de 2017",
    ),
}


def registrar_padronizacao(pares_por_ano):
    linhas = []
    for nome_original, (nome_novo, motivo) in PADRONIZACAO_PAISES.items():
        como_origem = pares_por_ano[pares_por_ano["origem"] == nome_original]
        como_destino = pares_por_ano[pares_por_ano["destino"] == nome_original]
        anos = sorted(set(como_origem["ano"]) | set(como_destino["ano"]))
        linhas.append({
            "nome_original": nome_original,
            "nome_padronizado": nome_novo,
            "motivo": motivo,
            "eventos_como_origem": int(como_origem["n_eventos"].sum()),
            "eventos_como_destino": int(como_destino["n_eventos"].sum()),
            "primeiro_ano": anos[0] if anos else None,
            "ultimo_ano": anos[-1] if anos else None,
        })
    return pd.DataFrame(linhas)


def padronizar_paises(pares_por_ano):
    mapa = {original: novo for original, (novo, _motivo) in PADRONIZACAO_PAISES.items()}
    return pares_por_ano.assign(
        origem=pares_por_ano["origem"].replace(mapa),
        destino=pares_por_ano["destino"].replace(mapa),
    )


def gerar_arestas(pares_por_ano):
    pares_por_ano = pares_por_ano[pares_por_ano["origem"] != pares_por_ano["destino"]]
    arestas = (
        pares_por_ano.groupby(["origem", "destino"])
        .agg(
            n_eventos=("n_eventos", "sum"),
            soma_intensidade=("soma_intensidade", "sum"),
            anos_com_eventos=("ano", "nunique"),
        )
        .reset_index()
    )
    arestas["peso"] = (arestas["soma_intensidade"] / arestas["n_eventos"]).round(6)
    arestas["par_fraco"] = arestas["n_eventos"] <= LIMITE_PAR_FRACO
    return arestas[["origem", "destino", "peso", "n_eventos", "anos_com_eventos", "par_fraco"]]


def main():
    parser = argparse.ArgumentParser(description="Gera a lista de arestas do grafo de países.")
    parser.add_argument("--entrada", type=Path,
                        default=PASTA_SCRIPT / "processado" / "pares_paises_por_ano.csv.gz")
    parser.add_argument("--saida", type=Path, default=PASTA_SCRIPT / "arestas_paises.csv")
    parser.add_argument("--saida-padronizacao", type=Path,
                        default=PASTA_SCRIPT / "paises_padronizados.csv")
    args = parser.parse_args()

    # keep_default_na=False evita que nomes de países sejam lidos como valor ausente
    pares = pd.read_csv(args.entrada, keep_default_na=False, na_values=[""])
    if pares[["origem", "destino"]].isna().any().any():
        raise ValueError("Há pares sem país de origem ou destino na entrada.")

    registrar_padronizacao(pares).to_csv(args.saida_padronizacao, index=False)
    arestas = gerar_arestas(padronizar_paises(pares))
    arestas.to_csv(args.saida, index=False)

    nos = set(arestas["origem"]) | set(arestas["destino"])
    print(f"Arquivo salvo em {args.saida}")
    print(f"Anos: {pares['ano'].min()} a {pares['ano'].max()}")
    print(f"Nós (países): {len(nos)}")
    print(f"Arestas: {len(arestas)}")
    print(f"Arestas com peso negativo: {(arestas['peso'] < 0).sum()}")
    print(f"Pares fracos (n_eventos <= {LIMITE_PAR_FRACO}): {arestas['par_fraco'].sum()} "
          f"({100 * arestas['par_fraco'].mean():.1f}%)")
    print(f"Nomes de países padronizados: veja {args.saida_padronizacao}")


if __name__ == "__main__":
    main()
