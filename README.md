# Projeto de Grafos

Projeto final de Teoria dos Grafos + AVD (2026.2): Labirinto com Chaves (Grafo de Estados) + Comparação de Algoritmos.

- **Parte 1:** mapas de labirinto viram um grafo de estados `(posição, chaves, bônus consumidos)`, onde rodam BFS, DFS, Dijkstra e Bellman-Ford.
- **Parte 2:** grafo dirigido e ponderado de relações entre países, montado a partir do dataset ICEWS (1995–2022), com comparação dos mesmos algoritmos.

Os algoritmos são implementação própria do grupo (`src/graphs/algorithms.py`) e são os mesmos nas duas partes. O `networkx` é usado só dentro de `tests/`, como oráculo.

## Equipe

- Augusto Malheiros de Souza
- Caio Mathews Farias Ferreira
- Eduardo Albuquerque Alves Barbosa
- Gabriel Miranda Mucarbel de Lima
- Rodrigo José Dantas de Oliveira

## Declaração de Uso de IA

[Declaração de Uso de IA (Google Docs)](https://docs.google.com/document/d/1lqpXznZW8UVQgdCmkbHMtuP3o-almKKSgwxHWe3Xuj4/edit?tab=t.0)

## Instalação

Requer Python 3.11 ou mais recente. Na raiz do repositório:

```bash
pip install -r requirements.txt
```

Para abrir os notebooks da Parte 2, veja a seção [Notebooks da Parte 2](#notebooks-da-parte-2).

## Testes

```bash
python -m pytest -q
```

## Estrutura do projeto

```
projeto-grafos/
├─ data/
│  ├─ mapas/            mapas fornecidos (m01 a m08)
│  ├─ mapas_grupo/      os dois mapas criados pelo grupo
│  └─ dataset_parte2/   scripts, dados processados e notebooks da Parte 2
├─ docs/                documentação e relatórios
├─ frontend/            site visual dos labirintos (React + Vite)
├─ out/
│  ├─ parte1/           saídas da Parte 1
│  └─ parte2/           relatório do benchmark e gráficos da Parte 2
├─ scripts/             exportação dos resultados e da interface da Parte 1
├─ src/
│  ├─ cli.py            linha de comando das duas partes
│  ├─ solve.py          resolução de um mapa com um algoritmo
│  ├─ benchmark_parte2.py  benchmark e consultas da Parte 2
│  ├─ viz.py
│  └─ graphs/           leitura (io), grafo de estados, lista de adjacência e algoritmos
└─ tests/
```

## Parte 1: labirinto com chaves

### Rodar um algoritmo em um mapa

```bash
python -m src.cli --mapa ./data/mapas/m03_tres_chaves.txt --alg BFS --out ./out/parte1/
python -m src.cli --mapa ./data/mapas/m03_tres_chaves.txt --alg DIJKSTRA --out ./out/parte1/
python -m src.cli --mapa ./data/mapas/m05_bonus.txt --alg BELLMAN_FORD --out ./out/parte1/
python -m src.cli --mapa ./data/mapas/m06_fonte.txt --alg BELLMAN_FORD --fonte-consumivel --out ./out/parte1/
python -m src.cli --mapa ./data/mapas/m04_esteiras.txt --armadilhas --out ./out/parte1/
```

`--alg` aceita `BFS`, `DFS`, `DIJKSTRA` ou `BELLMAN_FORD`. O resultado aparece no terminal.

Cada execução com `--alg` **acrescenta** uma linha ao `solucoes.csv` da pasta indicada em `--out`, sem apagar as anteriores. Para testar mapas avulsos (como o mapa surpresa) sem misturar com o `solucoes.csv` oficial, use outra pasta de saída, por exemplo `--out ./out/testes/`.

`--fonte-consumivel` aplica a correção de regra do m06: a fonte de energia (`*`) passa a valer só na primeira vez, como o bônus. Com ela, o Bellman-Ford dá uma resposta finita no m06 (10 passos, custo 10) em vez do ciclo negativo.

`--armadilhas` grava `armadilhas_<mapa>.csv` com os estados alcançáveis a partir dos quais a saída é inalcançável.

### Gerar todos os resultados da Parte 1

```bash
python scripts/exportar_parte1.py
python scripts/gerar_interface.py
```

O primeiro comando recalcula todos os mapas (`data/mapas/` e `data/mapas_grupo/`) e produz em `out/parte1/`:
`arestas_<mapa>.csv`, `solucoes.csv`, `dfs_classificacao.csv`, `comparacao_modelagem.csv`,
`armadilhas_m04.csv`, `armadilhas_m07.csv`, `percurso_m03.json`, `ciclo_negativo_m06.json`
(com o resultado sem e com `--fonte-consumivel`), `bellman_ford_g_pos_m05.json`,
`metricas_global.json`, `camadas.json`, `graus_<mapa>.csv` e `dados_interativos.json`.

O segundo produz `out/parte1/labirinto_interativo.html` e copia o mesmo arquivo para `frontend/public`. O mesmo HTML também pode ser gerado pela CLI:

```bash
python -m src.cli --interactive --out ./out/parte1/
```

### Labirinto interativo

Abra `out/parte1/labirinto_interativo.html` direto no navegador para reproduzir a exploração dos mapas exportados. O simulador mostra cores e contadores de visitas por casa, incluindo estados fora do caminho final. BFS e DFS contam estados processados, Dijkstra conta estados selecionados e Bellman-Ford conta a inicialização da origem e as melhorias efetivas de distância. O arco virtual até ALVO fica fora dos contadores.

Marque qualquer combinação de BFS, DFS, Dijkstra e Bellman-Ford para acompanhar um, dois, três ou quatro painéis com controles conjuntos. O botão **Selecionar todos** marca os quatro. Clique no nome de um algoritmo ou em uma casa para abrir um card de detalhes. Voltar ou reiniciar restaura contadores, chaves, portas e consumíveis. O filtro de camada aplica-se às contagens e posições dos estados explorados.

Em **Reproduzir caminho final**, os contadores passam a contar as passagens pelo percurso escolhido. As setas roxas mostram avanço e as laranja mostram um trecho usado no sentido contrário a uma passagem anterior. Avance passo a passo para acompanhar a ordem. O card de cada casa lista os passos em que ela aparece no caminho. Os símbolos originais ficam no centro e os números de visitas ficam no canto das casas.

Os controles de reprodução ficam fixos na parte inferior da tela. O enquadramento se ajusta à janela e à quantidade de painéis, preservando casas legíveis. Mapas grandes usam rolagem interna, que acompanha a posição atual durante a animação. **Focar nos mapas** também é aplicado ao iniciar a animação. O zoom permite ampliar os detalhes; **Ver mapa inteiro** calcula a redução necessária para mostrar todo o mapa. O zoom manual varia de 5% a 300%, com 100% como tamanho legível inicial.

As barras internas ficam ocultas. Arraste o mapa, use gestos de toque ou foque o painel e navegue com as setas do teclado. No card, custo, passos, tempo Python e contagem de eventos ficam destacados. O tempo corresponde a uma execução com registro de eventos e exclui a construção do grafo e a reprodução da animação.

Com `npm run dev`, importar um `.txt`, abrir um mapa do editor ou alternar **Fonte consumível** calcula os eventos usando o Python instalado na máquina. Em hospedagem estática ou ao abrir o HTML como arquivo, os mapas já exportados continuam disponíveis, e novos cálculos exigem o servidor local. O editor continua acessível pelo site.

`npm run dev` e `npm run build` geram os eventos automaticamente quando os mapas ou o código Python mudam. Para atualizar manualmente:

```bash
python scripts/exportar_exploracao.py
python scripts/gerar_interface.py
```

Se `python` não estiver no PATH, configure `GRAFOS_PYTHON` com o caminho do executável antes de iniciar o frontend.

### Métricas

Para gerar só `metricas_global.json`, `camadas.json` e `graus_<mapa>.csv`:

```bash
python -m src.cli --metricas --out ./out/parte1/
```

Por padrão, o comando considera `data/mapas/` e `data/mapas_grupo/`. Para indicar pastas específicas:

```bash
python -m src.cli --metricas --pasta-mapas ./data/mapas/ --pasta-mapas ./data/mapas_grupo/ --out ./out/parte1/
```

O cálculo exclui `ALVO` e os arcos para ele. Cada camada é o **subgrafo induzido** pelo conjunto de chaves do estado. Arestas que mudam de camada são contabilizadas separadamente e associadas à casa de chegada (chave coletada). Os estados têm rótulos `(linha,coluna)|chaves|{ids_bonus}`, com bônus numerados por ordem de leitura da grade.

A funcionalidade foi desenvolvida com apoio de IA e deve ser conferida pelo grupo conforme as orientações atualizadas da professora.

### Site (frontend)

O site visual dos labirintos fica em `frontend/` e precisa do Node.js 20 ou mais recente:

```bash
cd frontend
npm install
npm run dev
```

Detalhes em `frontend/README.md`. O site não roda nenhum algoritmo: tudo é calculado em Python.

## Parte 2: dataset ICEWS

### Dados

O dataset é o ICEWS Coded Event Data (Harvard Dataverse, [doi:10.7910/DVN/28075](https://doi.org/10.7910/DVN/28075)). Os arquivos brutos não ficam no repositório. O grafo usado pelos algoritmos já está pronto em `data/dataset_parte2/arestas_paises.csv` (250 países, 29.381 arestas), então **não é preciso baixar nada para rodar a CLI, o benchmark ou os testes**.

Como baixar os brutos e gerar de novo os dados processados e o arquivo de arestas: veja `data/dataset_parte2/README.md`.

### Benchmark

```bash
python -m src.cli --dataset ./data/dataset_parte2/ --benchmark --out ./out/parte2/
```

Gera `out/parte2/parte2_report.json` com: tempo médio de 5 execuções por algoritmo e tarefa, escalabilidade em 10%, 50% e 100% dos nós, BFS/DFS a partir de 3 fontes, BFS × Dijkstra em 5 pares de países, Bellman-Ford no grafo completo (com ciclo negativo) e no recorte sem ciclos, e o teste de robustez sem os pares fracos. Os tempos dependem do computador em que o benchmark é rodado.

### Consultar um algoritmo no dataset

```bash
python -m src.cli --dataset ./data/dataset_parte2/ --alg DIJKSTRA --source Brazil --target Bhutan --out ./out/parte2/
python -m src.cli --dataset ./data/dataset_parte2/ --alg BELLMAN_FORD --source Brazil
python -m src.cli --dataset ./data/dataset_parte2/ --alg BELLMAN_FORD --source "United States" --target Brazil --recorte-aciclico
```

- Os países usam os nomes em inglês do dataset (por exemplo, `"United States"`, `"Russian Federation"`).
- `--target` é opcional. Sem ele, o resultado mostra quantos países foram alcançados a partir da origem.
- O Dijkstra usa os pesos transformados em `10 - peso` (sempre ≥ 0).
- `--recorte-aciclico` roda o Bellman-Ford no recorte sem ciclos (países ordenados por atividade internacional).
- Com `--out`, o resultado também é salvo em `consulta_<algoritmo>.json`.

### Gráficos e análise visual

Os gráficos ficam em `out/parte2/` e são gerados pelo notebook `data/dataset_parte2/Parte2_ICEWS.ipynb`, que lê o `parte2_report.json` do benchmark. Para atualizar os gráficos de algoritmos depois de rodar o benchmark de novo, execute o notebook inteiro.

Diferente da CLI e do benchmark, o notebook lê os arquivos brutos do ICEWS em `data/dataset_parte2/raw/` para os gráficos da análise multivariada. Antes de executá-lo, baixe os dados como explicado em `data/dataset_parte2/README.md`.

## Notebooks da Parte 2

A CLI, os scripts em Python e os testes funcionam apenas com os pacotes listados em `requirements.txt`. Para abrir e executar os notebooks (`data/dataset_parte2/Parte2_ICEWS.ipynb` e `data/dataset_parte2/EDA.ipynb`), é preciso ter o Jupyter instalado no ambiente:

```bash
pip install jupyter
```

## Pendências

- Figuras estáticas PNG da Seção 8 da Parte 1 (percursos do m03 e do m08, grafo de estados do m02 em camadas, árvore BFS do m02 e heatmap de multiplicidade do m08).
- A comparação de modelagens precisa ser documentada e interpretada pelo grupo.

# [IA] ChatGPT — assistência em exportações e interface; declarar conforme orientação atualizada da professora.
