import argparse
import os

from src.solve import resolver, gravar_resultado_csv, calcular_e_salvar_armadilhas
from src.graphs.metricas import exportar_metricas
from src.graphs.resultados import gerar_html_interativo

ALGORITMOS_VALIDOS = ["BFS", "DFS", "DIJKSTRA", "BELLMAN_FORD"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mapa")
    parser.add_argument("--alg", choices=ALGORITMOS_VALIDOS)
    parser.add_argument("--out", help="Pasta de saída (obrigatória na Parte 1; padrão out/parte2 no benchmark)")
    parser.add_argument("--dataset", help="Pasta do dataset com arestas_paises.csv (ou icews para o dataset padrão)")
    parser.add_argument("--benchmark", action="store_true", help="Executa o benchmark da Parte 2")
    parser.add_argument("--source", help="País de origem para consulta em --dataset")
    parser.add_argument("--target", help="País de destino para consulta em --dataset")
    parser.add_argument("--recorte-aciclico", action="store_true", help="Usa o recorte sem ciclos no Bellman-Ford em --dataset")
    parser.add_argument("--fonte-consumivel", action="store_true")
    parser.add_argument("--armadilhas", action="store_true")
    parser.add_argument("--metricas", action="store_true", help="Exporta métricas globais, camadas e graus para todos os mapas")
    parser.add_argument("--pasta-mapas", action="append", help="Pasta para --metricas (pode repetir)")
    parser.add_argument("--interactive", action="store_true", help="Gera out/parte1/labirinto_interativo.html a partir de dados_interativos.json")

    args = parser.parse_args()

    if args.benchmark:
        from pathlib import Path
        from src.benchmark_parte2 import DATASET, SAIDA, executar_benchmark

        if (
            args.mapa or args.alg or args.source or args.target or args.recorte_aciclico
            or args.metricas or args.armadilhas or args.interactive or args.fonte_consumivel or args.pasta_mapas
        ):
            parser.error("--benchmark não pode ser combinado com opções da Parte 1 nem com consulta individual.")
        pasta = DATASET if args.dataset is None or args.dataset.lower() == "icews" else Path(args.dataset)
        destino = Path(args.out) / "parte2_report.json" if args.out else SAIDA
        try:
            executar_benchmark(pasta_dataset=pasta, saida=destino)
        except (OSError, ValueError) as erro:
            parser.exit(1, f"Erro no benchmark: {erro}\n")
        print(f"Benchmark salvo em {destino}")
        return

    if args.dataset is not None:
        import json
        from pathlib import Path
        from src.benchmark_parte2 import DATASET, executar_consulta_dataset

        if args.mapa or args.metricas or args.armadilhas or args.interactive or args.fonte_consumivel or args.pasta_mapas:
            parser.error("--dataset não pode ser combinado com opções da Parte 1.")
        if not args.alg or not args.source:
            parser.error("Com --dataset sem --benchmark, informe --alg e --source.")

        pasta = DATASET if args.dataset.lower() == "icews" else Path(args.dataset)
        try:
            resultado = executar_consulta_dataset(
                pasta_dataset=pasta,
                nome_algoritmo=args.alg,
                origem=args.source,
                destino=args.target,
                recorte_aciclico=args.recorte_aciclico,
            )
        except (OSError, ValueError) as erro:
            parser.exit(1, f"Erro na consulta ao dataset: {erro}\n")

        if args.out:
            caminho_saida = Path(args.out)
            if caminho_saida.suffix.lower() != ".json":
                caminho_saida = caminho_saida / f"consulta_{args.alg.lower()}.json"
            caminho_saida.parent.mkdir(parents=True, exist_ok=True)
            with caminho_saida.open("w", encoding="utf-8") as arquivo:
                json.dump(resultado, arquivo, ensure_ascii=False, indent=2)
                arquivo.write("\n")

        print("Algoritmo:", resultado["algoritmo"])
        print("Status:", resultado["status"])
        if resultado["status"] == "CICLO_NEGATIVO":
            print("Ciclo negativo encontrado:", resultado["ciclo"])
            print("Custo do ciclo:", resultado["custo_ciclo"])
            print("Usa par fraco:", resultado["usa_par_fraco"])
        else:
            print("Alcançados:", resultado["alcancados"])
            if args.target:
                print("Saltos:", resultado.get("saltos"))
                if "custo_transformado" in resultado:
                    print("Custo (10 - peso):", resultado["custo_transformado"])
                elif "custo" in resultado:
                    print("Custo:", resultado["custo"])
                print("Caminho:", resultado.get("caminho"))
                if "usa_par_fraco" in resultado:
                    print("Usa par fraco:", resultado["usa_par_fraco"])
        if args.out:
            print("Resultado salvo em:", caminho_saida)
        return

    if args.source or args.target or args.recorte_aciclico:
        parser.error("--source, --target e --recorte-aciclico exigem --dataset.")
    if args.out is None:
        parser.error("--out é obrigatório para as operações da Parte 1.")

    if args.metricas:
        dados, _ = exportar_metricas(args.pasta_mapas or ["./data/mapas", "./data/mapas_grupo"], args.out)
        print(f"Métricas exportadas para {len(dados)} mapas em {args.out}")
        return

    if args.armadilhas:
        if not args.mapa:
            print("Informe --mapa para --armadilhas.")
            return
        resultado = calcular_e_salvar_armadilhas(args.mapa, args.out)
        print(f"Armadilhas: {resultado['quantidade']} de {resultado['total_estados']} estados alcançáveis ({resultado['percentual']:.1f}%).")
        print(f"Arquivo: {resultado['arquivo']}")
        return

    if args.interactive:
        mapa_padrao = os.path.splitext(os.path.basename(args.mapa))[0] if args.mapa else None
        destino = gerar_html_interativo(args.out, mapa_padrao=mapa_padrao)
        print(f"HTML interativo gerado em {destino}")
        return

    if not args.mapa or not args.alg:
        print("Informe --mapa e --alg.")
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