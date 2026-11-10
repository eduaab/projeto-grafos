import argparse
import os

from src.solve import resolver, gravar_resultado_csv

ALGORITMOS_VALIDOS = ["BFS", "DFS", "DIJKSTRA", "BELLMAN_FORD"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mapa")
    parser.add_argument("--alg", choices=ALGORITMOS_VALIDOS)
    parser.add_argument("--out", required=True)
    parser.add_argument("--fonte-consumivel", action="store_true")
    parser.add_argument("--armadilhas", action="store_true")

    # tamo vendo ainda como que faz se vai fazer no direto no front ou gerar um html so pra isso 
    # parser.add_argument("--interactive", action="store_true")

    args = parser.parse_args()

    if not args.mapa or not args.alg:
        print("Informe --mapa e --alg.")
        return

    if args.armadilhas:
        print("Busca de armadilhas ainda não implementada.")
        return

    resultado = resolver(args.mapa, args.alg, fonte_consumivel=args.fonte_consumivel)
    gravar_resultado_csv(resultado, args.out)

    if resultado["status"] == "RECUSA":
        print("Dijkstra recusou rodar: o grafo tem peso negativo.")
    elif resultado["status"] == "CICLO_NEGATIVO":
        print("Ciclo negativo encontrado:", resultado["caminho"])
        print("Custo do ciclo:", resultado["custo"])
    elif resultado["status"] == "SEM_SOLUCAO":
        print("Não há caminho até a saída.")
    else:
        print("Status:", resultado["status"])
        print("Passos:", resultado["passos"])
        print("Custo:", resultado["custo"])
        print("Caminho:", resultado["caminho"])


if __name__ == "__main__":
    main()