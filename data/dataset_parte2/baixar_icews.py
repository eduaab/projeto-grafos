#!/usr/bin/env python3
"""Baixa o ICEWS Coded Event Data do Harvard Dataverse (doi:10.7910/DVN/28075).

Usa apenas a biblioteca padrão do Python (sem pip install).
Sem argumentos, mostra a ajuda.

Exemplos:
    python baixar_icews.py --docs                 # SÓ a documentação (PDFs, ~6 MB)
    python baixar_icews.py --listar               # mostra tudo que existe, não baixa nada
    python baixar_icews.py --de 2010 --ate 2014   # SÓ eventos de 2010 a 2014
    python baixar_icews.py --eventos              # SÓ eventos, de todos os anos
    python baixar_icews.py --docs --eventos       # documentação + eventos
"""
import argparse
import json
import re
import sys
import time
import zipfile
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

SERVIDOR = "https://dataverse.harvard.edu"
DOI = "doi:10.7910/DVN/28075"
CABECALHOS = {"User-Agent": "icews-download/1.0 (projeto-grafos)"}
PADRAO_EVENTOS = re.compile(r"^events\.(\d{4})\.", re.IGNORECASE)
MANIFESTO = ".baixados.json"


def abrir(url, tentativas=3, timeout=120):
    """Abre uma URL com algumas tentativas; erros 4xx não são repetidos."""
    ultimo = None
    for t in range(1, tentativas + 1):
        try:
            return urlopen(Request(url, headers=CABECALHOS), timeout=timeout)
        except HTTPError as e:
            ultimo = e
            if e.code in (400, 401, 403, 404):
                break
        except (URLError, TimeoutError) as e:
            ultimo = e
        time.sleep(2 * t)
    raise RuntimeError(f"Falha ao acessar {url}: {ultimo}")


def listar_arquivos():
    """Pergunta ao Dataverse quais arquivos a última versão do dataset tem."""
    url = f"{SERVIDOR}/api/datasets/:persistentId/?persistentId={DOI}"
    with abrir(url) as r:
        dados = json.load(r)
    arquivos = []
    for f in dados["data"]["latestVersion"]["files"]:
        df = f["dataFile"]
        nome = Path(f.get("label") or df.get("filename") or f"arquivo_{df['id']}").name
        arquivos.append({"id": df["id"], "nome": nome, "tamanho": df.get("filesize", 0)})
    return sorted(arquivos, key=lambda a: a["nome"])


def selecionar(arquivos, de, ate, eventos, docs):
    """Escolhe PDFs (se docs) e arquivos events.AAAA.* no intervalo (se eventos)."""
    escolhidos = []
    for a in arquivos:
        m = PADRAO_EVENTOS.match(a["nome"])
        if m:
            if eventos and de <= int(m.group(1)) <= ate:
                escolhidos.append(a)
        elif docs and a["nome"].lower().endswith(".pdf"):
            escolhidos.append(a)
    return escolhidos


def carregar_manifesto(destino):
    """Nomes de arquivos .zip já baixados E extraídos (o .zip pode ter sido apagado)."""
    caminho = destino / MANIFESTO
    if caminho.exists():
        try:
            return set(json.loads(caminho.read_text(encoding="utf-8")))
        except (ValueError, OSError):
            pass
    return set()


def salvar_manifesto(destino, manifesto):
    (destino / MANIFESTO).write_text(json.dumps(sorted(manifesto), indent=1), encoding="utf-8")


def baixar(arq, destino):
    alvo = destino / arq["nome"]
    tmp = alvo.with_name(alvo.name + ".part")
    url = f"{SERVIDOR}/api/access/datafile/{arq['id']}"
    total = 0
    with abrir(url) as r, open(tmp, "wb") as saida:
        while True:
            bloco = r.read(1 << 20)
            if not bloco:
                break
            saida.write(bloco)
            total += len(bloco)
            print(f"\r  {arq['nome']}: {total / 1e6:.1f} MB", end="", flush=True)
    tmp.replace(alvo)
    print()
    return alvo


def extrair(caminho_zip, destino, manter_zip):
    with zipfile.ZipFile(caminho_zip) as z:
        z.extractall(destino)
    if not manter_zip:
        caminho_zip.unlink()


def main():
    ap = argparse.ArgumentParser(
        description="Baixa o ICEWS Coded Event Data (Harvard Dataverse, doi:10.7910/DVN/28075).",
        epilog=(
            "exemplos:\n"
            "  python baixar_icews.py --docs                 só a documentação (PDFs)\n"
            "  python baixar_icews.py --listar               lista tudo, sem baixar\n"
            "  python baixar_icews.py --de 2010 --ate 2014   só eventos de 2010 a 2014\n"
            "  python baixar_icews.py --eventos              só eventos, todos os anos\n"
            "  python baixar_icews.py --docs --eventos       documentação + eventos"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--docs", action="store_true",
                    help="baixa SOMENTE a documentação em PDF (~6 MB), a menos que combine com --eventos/--de/--ate")
    ap.add_argument("--eventos", action="store_true",
                    help="baixa os arquivos de eventos de TODOS os anos (use --de/--ate para filtrar)")
    ap.add_argument("--de", type=int, default=None,
                    help="ano inicial dos eventos (já ativa o download de eventos)")
    ap.add_argument("--ate", type=int, default=None,
                    help="ano final dos eventos (já ativa o download de eventos)")
    ap.add_argument("--listar", action="store_true",
                    help="só lista os arquivos e sai (sozinho, lista tudo que existe)")
    ap.add_argument("--sem-extrair", action="store_true", help="não descompacta os .zip")
    ap.add_argument("--manter-zip", action="store_true", help="não apaga os .zip após extrair")
    ap.add_argument("--sim", action="store_true", help="não pede confirmação ao baixar eventos")
    ap.add_argument("--destino", type=Path, default=Path(__file__).resolve().parent / "raw",
                    help="pasta de destino (padrão: ./raw ao lado deste script)")

    if len(sys.argv) == 1:  # sem argumentos: mostra a ajuda
        ap.print_help()
        return
    args = ap.parse_args()

    eventos = args.eventos or args.de is not None or args.ate is not None
    docs = args.docs
    if args.listar and not (eventos or docs):  # --listar sozinho: mostra tudo
        eventos = docs = True
    de = args.de if args.de is not None else 1900
    ate = args.ate if args.ate is not None else 9999

    if not (eventos or docs):
        ap.error("nada para baixar: use --docs, --eventos ou --de/--ate (ou --listar)")

    print(f"Consultando {SERVIDOR} ({DOI}) ...")
    try:
        todos = listar_arquivos()
    except Exception as e:  # noqa: BLE001
        sys.exit(f"Erro ao listar arquivos: {e}")

    escolhidos = selecionar(todos, de, ate, eventos, docs)
    if not escolhidos:
        sys.exit("Nenhum arquivo selecionado. Use --listar para ver o que existe.")

    total_mb = sum(a["tamanho"] for a in escolhidos) / 1e6
    print(f"{len(escolhidos)} arquivo(s) selecionado(s), ~{total_mb:.0f} MB (tamanho informado pelo Dataverse):")
    for a in escolhidos:
        print(f"  - {a['nome']}  ({a['tamanho'] / 1e6:.1f} MB)")
    if args.listar:
        return

    # Só pede confirmação quando há dados de eventos (grandes)
    if eventos and not args.sim:
        if input("Continuar com o download? [s/N] ").strip().lower() not in ("s", "sim", "y"):
            sys.exit("Cancelado.")

    args.destino.mkdir(parents=True, exist_ok=True)
    manifesto = carregar_manifesto(args.destino)
    falhas = []
    for a in escolhidos:
        nome = a["nome"]
        alvo = args.destino / nome
        e_zip = nome.lower().endswith(".zip")
        if nome in manifesto:
            print(f"  [pulado] {nome} (já baixado e extraído)")
            continue
        try:
            if alvo.exists() and alvo.stat().st_size > 0:
                print(f"  [já baixado] {nome}")
            else:
                baixar(a, args.destino)
            if e_zip and not args.sem_extrair:
                print(f"  extraindo {nome} ...")
                extrair(alvo, args.destino, args.manter_zip)
                manifesto.add(nome)
                salvar_manifesto(args.destino, manifesto)
        except Exception as e:  # noqa: BLE001
            print(f"\n  [ERRO] {nome}: {e}")
            falhas.append(nome)

    print(f"\nConcluído. Arquivos em: {args.destino}")
    if not eventos:
        print("Só a documentação foi baixada. Para os eventos: "
              "python baixar_icews.py --de 2010 --ate 2014   (ou --eventos para todos os anos)")
    if falhas:
        sys.exit(f"Falharam: {', '.join(falhas)}. Rode de novo (os já baixados são pulados).")


if __name__ == "__main__":
    main()
