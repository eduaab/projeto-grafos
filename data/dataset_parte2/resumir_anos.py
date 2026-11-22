#!/usr/bin/env python3
"""Resume os arquivos brutos do ICEWS, um ano por vez.

Continua o piloto de 1995 do EDA.ipynb para todos os anos baixados em raw/.
Os arquivos brutos somam mais de 1,7 GB e não cabem juntos na memória, então
cada ano é lido em partes (chunks) e só o resumo dele é guardado.
Nenhuma linha é apagada: ausências, duplicatas e eventos sem país são
apenas contados e relatados.

Como rodar (dentro de data/dataset_parte2/):
    python resumir_anos.py                       # todos os anos em raw/
    python resumir_anos.py --anos 1995 1996      # só alguns anos
    python resumir_anos.py --ignorar-diferencas  # roda mesmo se as colunas mudarem

Saídas em processado/:
    verificacao_colunas.csv      colunas de cada arquivo comparadas com as do 1º ano
    resumo_anos.csv              uma linha por ano (eventos, qualidade, intensidade, países, pares)
    nulos_por_ano.csv            valores ausentes por coluna e por ano
    correlacao_nulos_por_ano.csv correlação entre as ausências de cada par de colunas, por ano
                                 (base do mapa de calor de ausências)
    presenca_paises.csv          país x ano, True/False (país aparece como origem ou destino)
    eventos_por_pais_ano.csv     quantos eventos cada país tem como origem e como destino, por ano
    pares_paises_por_ano.csv.gz  pares dirigidos entre países diferentes, por ano,
                                 com nº de eventos e soma/média da intensidade
"""
import argparse
import re
import sys
from collections import defaultdict
from pathlib import Path

import pandas as pd

PASTA_SCRIPT = Path(__file__).resolve().parent

# Aceita o nome salvo pelo baixar_icews.py (events.1995.<data>.tab)
# e o nome usado no piloto (eventos_1995.tab).
PADRAO_ANO = re.compile(r"^(?:events|eventos)[._-]?(\d{4})", re.IGNORECASE)

COLUNAS_NECESSARIAS = ["Event Date", "Source Country", "Target Country", "Intensity"]

# Na maioria dos anos o valor ausente vem como campo vazio, mas em 2017 ele vem
# escrito como o texto "NULL". Os dois são tratados como ausentes, e quantos
# vieram como "NULL" fica registrado à parte em nulos_por_ano.csv.
MARCADORES_AUSENTE = ["NULL"]


def encontrar_arquivos(pasta_raw):
    """Agrupa os arquivos .tab de raw/ por ano, pelo nome do arquivo."""
    por_ano = defaultdict(list)
    for arquivo in sorted(pasta_raw.glob("*.tab")):
        encontrado = PADRAO_ANO.match(arquivo.name)
        if encontrado:
            por_ano[int(encontrado.group(1))].append(arquivo)
    return dict(sorted(por_ano.items()))


def ler_cabecalho(arquivo):
    colunas = pd.read_csv(arquivo, sep="\t", nrows=0, dtype="string").columns
    return [c.strip() for c in colunas]


def verificar_colunas(arquivos_por_ano):
    """Compara as colunas de cada arquivo com as do primeiro ano (o piloto)."""
    primeiro_ano = next(iter(arquivos_por_ano))
    referencia = ler_cabecalho(arquivos_por_ano[primeiro_ano][0])

    linhas = []
    for ano, arquivos in arquivos_por_ano.items():
        for arquivo in arquivos:
            colunas = ler_cabecalho(arquivo)
            faltando = [c for c in referencia if c not in colunas]
            extras = [c for c in colunas if c not in referencia]
            linhas.append({
                "ano": ano,
                "arquivo": arquivo.name,
                "qtd_colunas": len(colunas),
                "iguais_a_referencia": colunas == referencia,
                "mesma_ordem": not faltando and not extras and colunas == referencia,
                "colunas_faltando": "; ".join(faltando),
                "colunas_extras": "; ".join(extras),
                "faltam_necessarias": "; ".join(c for c in COLUNAS_NECESSARIAS if c not in colunas),
            })
    return pd.DataFrame(linhas), referencia


def processar_ano(ano, arquivos, tamanho_parte):
    """Lê um ano em partes e devolve o resumo, os nulos, os países e os pares."""
    linhas = 0
    nulos = pd.Series(dtype="int64")
    nulos_como_texto = pd.Series(dtype="int64")
    # ausentes_juntos[a][b] = linhas em que a coluna a E a coluna b estão ausentes
    ausentes_juntos = pd.DataFrame(dtype="float64")
    hashes_vistos = set()
    duplicadas = 0
    datas_invalidas = 0
    datas_fora_do_ano = 0
    intensidade_falhas = 0
    soma = soma_quadrados = 0.0
    qtd_intensidade = negativas = zeros = positivas = 0
    minimo, maximo = float("inf"), float("-inf")
    sem_pais = mesmo_pais = 0
    como_origem = pd.Series(dtype="int64")
    como_destino = pd.Series(dtype="int64")
    partes_pares = []

    for arquivo in arquivos:
        leitor = pd.read_csv(
            arquivo,
            sep="\t",
            dtype="string",
            keep_default_na=False,
            na_values=[""],
            chunksize=tamanho_parte,
        )
        for parte in leitor:
            parte.columns = parte.columns.str.strip()

            # Mesma limpeza do piloto: tira espaços e trata texto vazio como ausente.
            # Marcadores como "NULL" também viram ausentes, mas são contados antes.
            for coluna in parte.columns:
                parte[coluna] = parte[coluna].str.strip()
            nulos_como_texto = nulos_como_texto.add(
                parte.isin(MARCADORES_AUSENTE).sum(), fill_value=0
            )
            for coluna in parte.columns:
                parte[coluna] = parte[coluna].replace([""] + MARCADORES_AUSENTE, pd.NA)

            linhas += len(parte)
            ausente = parte.isna().astype("int64")
            nulos = nulos.add(ausente.sum(), fill_value=0)
            ausentes_juntos = ausentes_juntos.add(ausente.T @ ausente, fill_value=0)

            # Linhas duplicadas (todas as colunas iguais), inclusive entre partes
            hashes = pd.util.hash_pandas_object(parte, index=False).tolist()
            for valor in hashes:
                if valor in hashes_vistos:
                    duplicadas += 1
                else:
                    hashes_vistos.add(valor)

            # Datas
            datas = pd.to_datetime(parte["Event Date"], errors="coerce")
            datas_invalidas += int((datas.isna() & parte["Event Date"].notna()).sum())
            datas_fora_do_ano += int((datas.notna() & (datas.dt.year != ano)).sum())

            # Intensidade
            intensidade = pd.to_numeric(parte["Intensity"], errors="coerce")
            intensidade_falhas += int((intensidade.isna() & parte["Intensity"].notna()).sum())
            validas = intensidade.dropna().astype(float)
            qtd_intensidade += len(validas)
            soma += float(validas.sum())
            soma_quadrados += float((validas ** 2).sum())
            negativas += int((validas < 0).sum())
            zeros += int((validas == 0).sum())
            positivas += int((validas > 0).sum())
            if len(validas):
                minimo = min(minimo, float(validas.min()))
                maximo = max(maximo, float(validas.max()))

            # Países
            origem = parte["Source Country"]
            destino = parte["Target Country"]
            como_origem = como_origem.add(origem.value_counts(), fill_value=0)
            como_destino = como_destino.add(destino.value_counts(), fill_value=0)

            ambos = origem.notna() & destino.notna()
            iguais = ambos & (origem == destino)
            sem_pais += int((~ambos).sum())
            mesmo_pais += int(iguais.sum())

            # Pares dirigidos entre países diferentes (candidatos a arcos)
            entre = ambos & ~iguais & intensidade.notna()
            if entre.any():
                pares = (
                    pd.DataFrame({
                        "origem": origem[entre],
                        "destino": destino[entre],
                        "intensidade": intensidade[entre].astype(float),
                    })
                    .groupby(["origem", "destino"])["intensidade"]
                    .agg(n_eventos="size", soma_intensidade="sum")
                )
                partes_pares.append(pares)

    if partes_pares:
        pares = pd.concat(partes_pares).groupby(level=["origem", "destino"]).sum()
    else:
        pares = pd.DataFrame(columns=["n_eventos", "soma_intensidade"])
    pares["media_intensidade"] = pares["soma_intensidade"] / pares["n_eventos"]
    pares = pares.reset_index()
    pares.insert(0, "ano", ano)

    media = soma / qtd_intensidade if qtd_intensidade else None
    # Variância amostral (n - 1), a mesma do describe()/std() do pandas
    variancia = (
        (soma_quadrados - qtd_intensidade * media ** 2) / (qtd_intensidade - 1)
        if qtd_intensidade > 1 else None
    )
    paises = set(como_origem.index) | set(como_destino.index)

    resumo = {
        "ano": ano,
        "arquivos": len(arquivos),
        "eventos": linhas,
        "linhas_duplicadas": duplicadas,
        "datas_invalidas": datas_invalidas,
        "datas_fora_do_ano": datas_fora_do_ano,
        "intensidade_falhas_conversao": intensidade_falhas,
        "intensidade_media": media,
        "intensidade_desvio": variancia ** 0.5 if variancia is not None else None,
        "intensidade_min": minimo if qtd_intensidade else None,
        "intensidade_max": maximo if qtd_intensidade else None,
        "eventos_intensidade_negativa": negativas,
        "eventos_intensidade_zero": zeros,
        "eventos_intensidade_positiva": positivas,
        "eventos_sem_pais_origem_ou_destino": sem_pais,
        "eventos_mesmo_pais": mesmo_pais,
        "eventos_entre_paises": int(pares["n_eventos"].sum()) if len(pares) else 0,
        "paises": len(paises),
        "pares_dirigidos": len(pares),
        "pares_media_negativa": int((pares["media_intensidade"] < 0).sum()),
        "pares_com_1_evento": int((pares["n_eventos"] == 1).sum()),
    }

    nulos_ano = pd.DataFrame({
        "ano": ano,
        "coluna": nulos.index,
        "nulos": nulos.astype(int).values,
        "vieram_como_texto_NULL": nulos_como_texto.reindex(nulos.index).fillna(0).astype(int).values,
        "percentual": (nulos.values / linhas * 100) if linhas else 0.0,
    })

    correlacao_nulos = correlacao_ausencias(ausentes_juntos, linhas)
    correlacao_nulos.insert(0, "ano", ano)

    paises_ano = pd.DataFrame({
        "como_origem": como_origem,
        "como_destino": como_destino,
    }).fillna(0).astype(int)
    paises_ano.index.name = "pais"
    paises_ano = paises_ano.reset_index()
    paises_ano.insert(0, "ano", ano)

    return resumo, nulos_ano, paises_ano, pares, correlacao_nulos


def correlacao_ausencias(ausentes_juntos, linhas):
    """Correlação entre os indicadores de ausência (1 = ausente, 0 = presente) de cada par de colunas.

    É a correlação de Pearson entre colunas 0/1, calculada a partir das contagens
    acumuladas parte a parte, sem precisar do ano inteiro na memória.
    Colunas sem nenhuma ausência (ou sempre ausentes) não variam, e a correlação
    fica vazia (NaN) para elas.
    """
    colunas = list(ausentes_juntos.columns)
    juntos = ausentes_juntos.reindex(index=colunas, columns=colunas).fillna(0)
    nulos = pd.Series([juntos.loc[c, c] for c in colunas], index=colunas)

    linhas_saida = []
    for a in colunas:
        for b in colunas:
            sa, sb, sab = nulos[a], nulos[b], juntos.loc[a, b]
            denominador = ((linhas * sa - sa ** 2) * (linhas * sb - sb ** 2)) ** 0.5
            correlacao = (linhas * sab - sa * sb) / denominador if denominador else None
            linhas_saida.append({
                "coluna_a": a,
                "coluna_b": b,
                "ambas_ausentes": int(sab),
                "correlacao": correlacao,
            })
    return pd.DataFrame(linhas_saida)


def main():
    parser = argparse.ArgumentParser(description="Resume os arquivos brutos do ICEWS, um ano por vez.")
    parser.add_argument("--raw", type=Path, default=PASTA_SCRIPT / "raw", help="pasta com os .tab (padrão: raw/)")
    parser.add_argument("--saida", type=Path, default=PASTA_SCRIPT / "processado", help="pasta de saída (padrão: processado/)")
    parser.add_argument("--anos", type=int, nargs="+", help="processa só estes anos")
    parser.add_argument("--tamanho-parte", type=int, default=200_000, help="linhas lidas por vez (padrão: 200000)")
    parser.add_argument("--ignorar-diferencas", action="store_true",
                        help="continua mesmo se algum ano tiver colunas diferentes do primeiro")
    args = parser.parse_args()

    if not args.raw.exists():
        sys.exit(f"Pasta {args.raw} não encontrada. Baixe os dados com baixar_icews.py.")

    arquivos_por_ano = encontrar_arquivos(args.raw)
    if args.anos:
        arquivos_por_ano = {a: arqs for a, arqs in arquivos_por_ano.items() if a in set(args.anos)}
    if not arquivos_por_ano:
        sys.exit(f"Nenhum arquivo de eventos (.tab) encontrado em {args.raw}.")

    args.saida.mkdir(parents=True, exist_ok=True)

    # 1) Verificação das colunas, antes de qualquer análise
    verificacao, referencia = verificar_colunas(arquivos_por_ano)
    verificacao.to_csv(args.saida / "verificacao_colunas.csv", index=False)
    print(f"Referência: {len(referencia)} colunas do ano {next(iter(arquivos_por_ano))}.")

    diferentes = verificacao[~verificacao["iguais_a_referencia"]]
    sem_necessarias = verificacao[verificacao["faltam_necessarias"] != ""]
    if not sem_necessarias.empty:
        print("Arquivos sem colunas necessárias para o resumo:")
        print(sem_necessarias[["ano", "arquivo", "faltam_necessarias"]].to_string(index=False))
        sys.exit("Interrompido. Veja processado/verificacao_colunas.csv.")
    if not diferentes.empty:
        print("Arquivos com colunas diferentes do primeiro ano:")
        print(diferentes[["ano", "arquivo", "colunas_faltando", "colunas_extras"]].to_string(index=False))
        if not args.ignorar_diferencas:
            sys.exit("Interrompido. Confira as diferenças ou rode de novo com --ignorar-diferencas.")
    else:
        print("Todos os arquivos têm as mesmas colunas, na mesma ordem.")

    # 2) Resumo de cada ano, um por vez
    resumos, nulos, paises, pares, correlacoes = [], [], [], [], []
    for ano, arquivos in arquivos_por_ano.items():
        print(f"Processando {ano} ({len(arquivos)} arquivo(s))...", flush=True)
        resumo, nulos_ano, paises_ano, pares_ano, correlacao_ano = processar_ano(
            ano, arquivos, args.tamanho_parte
        )
        correlacoes.append(correlacao_ano)
        resumos.append(resumo)
        nulos.append(nulos_ano)
        paises.append(paises_ano)
        pares.append(pares_ano)
        print(f"  {resumo['eventos']:,} eventos · {resumo['paises']} países · "
              f"{resumo['pares_dirigidos']:,} pares dirigidos entre países diferentes", flush=True)

    resumo_df = pd.DataFrame(resumos)
    paises_df = pd.concat(paises, ignore_index=True)
    presenca = (
        paises_df.assign(presente=True)
        .pivot_table(index="pais", columns="ano", values="presente", aggfunc="any", fill_value=False)
        .astype(bool)
    )
    presenca.columns = [str(c) for c in presenca.columns]
    presenca["anos_presente"] = presenca.sum(axis=1)

    resumo_df.to_csv(args.saida / "resumo_anos.csv", index=False)
    pd.concat(nulos, ignore_index=True).to_csv(args.saida / "nulos_por_ano.csv", index=False)
    pd.concat(correlacoes, ignore_index=True).to_csv(args.saida / "correlacao_nulos_por_ano.csv", index=False)
    presenca.to_csv(args.saida / "presenca_paises.csv")
    paises_df.to_csv(args.saida / "eventos_por_pais_ano.csv", index=False)
    pd.concat(pares, ignore_index=True).to_csv(args.saida / "pares_paises_por_ano.csv.gz", index=False)

    print(f"\nPronto. Arquivos salvos em {args.saida}")
    print(resumo_df[["ano", "eventos", "paises", "pares_dirigidos", "pares_media_negativa"]].to_string(index=False))


if __name__ == "__main__":
    main()
