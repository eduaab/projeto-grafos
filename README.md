# Projeto de Grafos

Projeto final de **Teoria dos Grafos e Análise e Visualização de Dados (AVD), 2026.2**.

- **Parte 1 — Labirinto com chaves.** Converte mapas de texto em grafos dirigidos de estados e compara BFS, DFS, Dijkstra e Bellman-Ford.
- **Parte 2 — ICEWS.** Usa os mesmos algoritmos em uma rede dirigida e ponderada de interações entre países e territórios. O site reúne os experimentos e as visualizações de AVD.

[Relatório do Projeto (PDF)](docs/RELATORIO_DO_PROJETO.pdf) · [Declaração de Uso de IA (Google Docs)](https://docs.google.com/document/d/19C3gqRZpTVaySLhPagJ_3efLgbrvHpUWrRSy-6ksJ9I/edit?tab=t.0) 

## Equipe

- Augusto Malheiros de Souza
- Caio Mathews Farias Ferreira
- Eduardo Albuquerque Alves Barbosa
- Gabriel Miranda Mucarbel de Lima
- Rodrigo José Dantas de Oliveira

## Instalação e testes

Os comandos Python são executados **na raiz do repositório**. Para instalar todas as dependências listadas, use **Python 3.12 ou mais recente**, requisito da versão de NumPy fixada no projeto. O frontend usa **Node.js 20.19+ na série 20 ou Node.js 22.12 ou superior**.

```bash
python -m pip install -r requirements.txt
python -m pytest -q
```

Os quatro algoritmos estão em `src/graphs/algorithms.py`. O NetworkX é usado em testes para conferir resultados.

## Site e demonstração

```bash
cd frontend
npm ci
npm run dev
```

Abra o endereço mostrado no terminal. A **home** reúne a linha do tempo do ICEWS, os resultados e figuras das duas partes e o PDF do relatório. A galeria e o editor dão acesso ao **Simulador**, que permite acompanhar a exploração, mostrar o caminho final, trocar de camada e comparar passos, custo e tempo entre algoritmos.

| Ação | Como usar |
|---|---|
| Mostrar um mapa do projeto | Selecione o mapa e os algoritmos no Simulador. |
| Demonstrar a validação | No Editor, use dois `S` e nenhum `G` para ver as duas mensagens. Um mapa válido tem um `S` e pelo menos um `G`. |
| Rodar o mapa surpresa | Com `npm run dev` ativo, abra **Simulador → Importar .txt**, selecione o mapa e rode um algoritmo. |
| Mostrar a correção do `m06` | Selecione Bellman-Ford e compare o resultado com **Fonte consumível** desligada e ligada. |

O servidor local chama o Python para calcular mapas novos. Se o executável tiver outro nome ou caminho, configure `GRAFOS_PYTHON` antes de executar `npm run dev`. O HTML autônomo em [out/parte1/labirinto_interativo.html](out/parte1/labirinto_interativo.html) e a compilação estática permitem reproduzir os resultados já exportados. Para calcular um mapa importado ou recalcular a opção da fonte, use o servidor de desenvolvimento.

Para compilar o site, rode `npm run build` dentro de `frontend/`. As etapas automáticas sincronizam mapas, gráficos, arquivos de resultados e o PDF. Consulte o [README do frontend](frontend/README.md) para os detalhes de execução.

## Parte 1 — Labirintos

Cada vértice do grafo de estados guarda linha, coluna, conjunto de chaves e bônus já consumidos. Cada arco representa um movimento válido e tem o custo da casa de destino. Os estados de saída em `G` ligam ao nó virtual `ALVO` com custo zero. O mapa pode ter várias saídas. Na BFS, vale a saída mais próxima em passos. Dijkstra busca menor custo com pesos não negativos. Bellman-Ford aceita pesos negativos e identifica ciclos negativos alcançáveis. DFS classifica os arcos e identifica ciclos.

### Rodar pelo terminal

```bash
python -m src.cli --mapa data/mapas/m01_terreno.txt --alg BFS --out out/testes/
python -m src.cli --mapa data/mapas/m01_terreno.txt --alg DIJKSTRA --out out/testes/
python -m src.cli --mapa data/mapas/m04_esteiras.txt --armadilhas --out out/testes/
python -m src.cli --mapa data/mapas/m05_bonus.txt --alg BELLMAN_FORD --out out/testes/
python -m src.cli --mapa data/mapas/m06_fonte.txt --alg BELLMAN_FORD --out out/testes/
python -m src.cli --mapa data/mapas/m06_fonte.txt --alg BELLMAN_FORD --fonte-consumivel --out out/testes/
```

`--alg` também aceita `DFS`. A execução com `--alg` acrescenta uma linha a `solucoes.csv` na pasta de saída. Os exemplos usam `out/testes/` para preservar as saídas oficiais. No `m06`, a fonte original produz um ciclo de custo −1. Com a fonte consumível, Bellman-Ford retorna 10 passos e custo 10.

### Regenerar as saídas

```bash
python scripts/exportar_parte1.py
python scripts/exportar_exploracao.py
python scripts/gerar_interface.py
```

| Saída em `out/parte1/` | Conteúdo |
|---|---|
| `arestas_<mapa>.csv` | Arcos por mapa e seus pesos, incluindo as ligações até `ALVO`. |
| `metricas_global.json`, `camadas.json`, `graus_<mapa>.csv` | Ordem, tamanho, densidade, teto, ocupação, graus e transições entre camadas. As métricas excluem `ALVO` e seus arcos. |
| `solucoes.csv`, `dfs_classificacao.csv` | Caminhos, passos, custos, status e contagens por classe de arco da DFS. |
| `comparacao_modelagem.csv` | Comparação entre portas como chão, portas como parede e grafo de estados no `m02`, `m03` e `m04`. |
| `armadilhas_m04.csv`, `armadilhas_m07.csv` | Estados alcançáveis a partir dos quais não se chega a `ALVO`. |
| `percurso_m03.json`, `bellman_ford_g_pos_m05.json`, `ciclo_negativo_m06.json` | Percurso do `m03`, comparação do ciclo no `m05` e resultado do `m06` com e sem a correção. |
| `dados_interativos.json`, `exploracao.json`, `labirinto_interativo.html` | Dados e página do Simulador. |
| Cinco figuras PNG | Percursos de `m03` e `m08`, grafo em camadas e árvore BFS do `m02` e heatmap de multiplicidade do `m08`. |

Para recalcular apenas métricas e graus, use `python -m src.cli --metricas --out out/testes/`. Os dois mapas próprios ficam em [data/mapas_grupo/](data/mapas_grupo/), com gabaritos no relatório.

## Parte 2 — ICEWS e AVD

**Pergunta de pesquisa:** O que as ações e suas intensidades revelam sobre as relações entre os países nos casos analisados no ICEWS?

O [ICEWS Coded Event Data](https://doi.org/10.7910/DVN/28075) reúne eventos políticos codificados a partir de notícias. O recorte de 1995 a 2022 gera **250 vértices, 29.381 arcos dirigidos e 2.940 arcos de peso negativo**. Cada arco vai do país de origem ao país de destino e tem como peso a média de `Intensity` dos eventos daquele par. O custo usado por Dijkstra é `10 - peso`. Bellman-Ford usa os pesos originais.

### Consultas e benchmark

O CSV de arestas já está no repositório. Consultas, benchmark, testes e visualização das saídas prontas funcionam sem baixar os arquivos brutos.

```bash
python -m src.cli --dataset icews --alg DIJKSTRA --source Brazil --target Bhutan --out out/testes_icews/
python -m src.cli --dataset icews --alg BELLMAN_FORD --source Brazil
python -m src.cli --dataset icews --alg BELLMAN_FORD --source "United States" --target Brazil --recorte-aciclico
python -m src.cli --dataset icews --benchmark --out out/testes_icews/
```

Use os nomes dos países conforme o CSV. `--target` seleciona o destino nas consultas. O benchmark inclui três fontes para BFS e DFS, cinco pares para Dijkstra, Bellman-Ford com ciclo negativo e em recorte acíclico, cinco medições por tarefa e escalabilidade em 10%, 50% e 100% dos vértices.

**Preserve o relatório completo:** a CLI grava as medições e um resumo das buscas. O notebook acrescenta as ordens completas, a contagem por camada da BFS e um exemplo de ciclo da DFS ao [JSON da entrega](out/parte2/parte2_report.json). Use `--out out/testes_icews/` para repetir as medições sem sobrescrever o arquivo usado no site.

### Reproduzir dados e gráficos

1. Siga o [guia do dataset](data/dataset_parte2/README.md) para baixar os arquivos brutos.
2. Instale o Jupyter com `python -m pip install jupyter`. Use [EDA.ipynb](data/dataset_parte2/EDA.ipynb) para a exploração inicial de 1995 e [Resumir_Anos.ipynb](data/dataset_parte2/Resumir_Anos.ipynb) para gerar os resumos anuais.
3. Rode `python data/dataset_parte2/gerar_arestas.py` para regenerar o CSV de pares dirigidos.
4. Execute [Parte2_ICEWS.ipynb](data/dataset_parte2/Parte2_ICEWS.ipynb) para gerar o JSON completo e as figuras em [out/parte2/](out/parte2/). O notebook também documenta a exploração, as figuras explanatórias e a discussão da pergunta de pesquisa.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `data/mapas/` e `data/mapas_grupo/` | Mapas fornecidos e mapas próprios. |
| `data/dataset_parte2/` | Download, notebooks, dados processados e lista de arestas do ICEWS. |
| `src/` | CLI, resolução de mapas, grafo de estados, algoritmos, métricas e benchmark. |
| `scripts/` e `tests/` | Exportação de resultados, geração do simulador e testes. |
| `frontend/` | Home, galeria, editor, simulador e painéis de resultados. |
| `out/parte1/` e `out/parte2/` | Saídas, gráficos e resultados publicados. |
| `docs/` | Relatório do projeto e documentação de apoio. |

## Documentos da entrega

- [Relatório do Projeto](docs/RELATORIO_DO_PROJETO.pdf), também disponível no card **Relatório técnico (PDF)** da home.
- [Declaração de Uso de IA (Google Docs)](https://docs.google.com/document/d/1bpXSd3KlEAW76wDqYB074qnSrVh9aNnY/edit?usp=sharing). O enunciado pede a versão assinada em `docs/DECLARACAO_IA.pdf`.
- Arquivos de resultados das duas partes em `out/` e instruções de reprodução neste README.

<!-- [IA] Codex — revisão dos comandos, organização do README e integração do relatório na home. -->
