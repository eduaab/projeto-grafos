# Interface, editor e arquivos de resultados — Parte 1

## Como usar

```bash
python scripts/exportar_parte1.py
python scripts/gerar_interface.py
python -m pytest -q tests/test_resultados.py
```

Abra `out/parte1/labirinto_interativo.html` no navegador. O HTML é autônomo, contendo os oito mapas e os caminhos pré-calculados no Python. Também está disponibilizado em `frontend/public/labirinto_interativo.html`, com link nas páginas de detalhes e no editor do frontend.

**Controles:** seleção do mapa e dos quatro algoritmos; play/pause, anterior/próximo, velocidade; estado atual, chaves, bônus e custo acumulado; alternância de camadas presentes no percurso e realce das posições de estados-armadilha. O editor permite pintar, importar um TXT e exportar a grade com validação básica de formato. As mudanças feitas no editor são locais até serem exportadas.

## Saídas

- `arestas_<mapa>.csv`: arcos dirigidos do G_est com destino, movimento, símbolo e peso (inclui arcos de saída até `ALVO`).
- `solucoes.csv`: resultados de BFS, DFS, Dijkstra e Bellman-Ford por mapa.
- `dfs_classificacao.csv`: classificação das arestas da DFS.
- `comparacao_modelagem.csv`: BFS sobre G_pos com portas liberadas/bloqueadas e G_est, nos mapas m02, m03 e m04.
- `armadilhas_m04.csv`, `armadilhas_m07.csv`: estados que não alcançam `ALVO` em busca reversa.
- `percurso_m03.json`, `ciclo_negativo_m06.json`: trajetórias/ciclo nos cenários exigidos.
- `metricas_global.json`, `camadas.json`, `graus_<mapa>.csv`: saídas preexistentes, regeneradas.
- `dados_interativos.json`: dados da animação gerados pelos algoritmos em Python.
- `labirinto_interativo.html`: interface autônoma.

## Limitações verificadas

1. Editar o mapa no navegador não recalcula soluções. Para acrescentar mapas, exporte o `.txt`, copie para `data/mapas_grupo/` e gere novamente os arquivos e o HTML.
2. O destaque de armadilhas é projetado por **posição** (uma mesma casa pode conter estados com propriedades distintas); as listas CSV mantêm os estados completos.
3. A alternância de camada filtra as posições **do percurso escolhido**, não todos os nós do grafo.
4. A DFS mostra um caminho da árvore de exploração, **não** garante o menor caminho.
5. A opção `--fonte-consumivel` ainda não está efetiva. A análise textual e a prova do m05 são responsabilidade do grupo.
6. As figuras PNG estáticas da Seção 8 ainda não foram geradas nesta etapa.
7. A interface do site React já existente não foi migrada para um backend online: o HTML contém os resultados pré-calculados.
8. Validar os outputs com os gabaritos oficiais antes da entrega.

# [IA] ChatGPT – assistência na exportação de resultados, interface e testes; registrar conforme orientação da professora.
