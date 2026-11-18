# Projeto de Grafos

Projeto final de Teoria dos Grafos + AVD (2026.2): Labirinto com Chaves (Grafo de Estados) + Comparação de Algoritmos.

## Equipe

- Augusto Malheiros de Souza
- Caio Mathews Farias Ferreira
- Eduardo Albuquerque Alves Barbosa
- Gabriel Miranda Mucarbel de Lima
- Rodrigo José Dantas de Oliveira

## Declaração de Uso de IA

[Declaração de Uso de IA (Google Docs)](https://docs.google.com/document/d/1lqpXznZW8UVQgdCmkbHMtuP3o-almKKSgwxHWe3Xuj4/edit?tab=t.0)

## Métricas da Parte 1

Para gerar `metricas_global.json`, `camadas.json` e `graus_<mapa>.csv` de todos os mapas disponíveis:

```bash
python -m src.cli --metricas --out ./out/parte1/
```

Por padrão, o comando considera `data/mapas/` e `data/mapas_grupo/` (quando houver mapas próprios). Para indicar pastas específicas:

```bash
python -m src.cli --metricas --pasta-mapas ./data/mapas/ --pasta-mapas ./data/mapas_grupo/ --out ./out/parte1/
```

O cálculo exclui `ALVO` e os arcos para ele. Cada camada é o **subgrafo induzido** pelo conjunto de chaves do estado. Arestas que mudam de camada são contabilizadas separadamente e associadas à casa de chegada (chave coletada). Os estados têm rótulos `(linha,coluna)|chaves|{ids_bonus}`, com bônus numerados por ordem de leitura da grade.

```bash
python -m pytest tests/test_metricas.py -q
```

A funcionalidade foi desenvolvida com apoio de IA e deve ser conferida pelo grupo conforme as orientações atualizadas da professora.

## Parte 1 — arquivos de resultados e interface

A partir da raiz do repositório, gere os resultados (recalcula todos os mapas):

```bash
python scripts/exportar_parte1.py
python scripts/gerar_interface.py
```

O primeiro comando produz `out/parte1/arestas_<mapa>.csv`, `solucoes.csv`,
`dfs_classificacao.csv`, `comparacao_modelagem.csv`, `armadilhas_m04.csv`,
`armadilhas_m07.csv`, `percurso_m03.json`, `ciclo_negativo_m06.json`,
`metricas_global.json`, `camadas.json`, `graus_<mapa>.csv` e
`dados_interativos.json`.

O segundo produz `out/parte1/labirinto_interativo.html` (abrível diretamente
no navegador, sem servidor), e copia o mesmo arquivo para `frontend/public`.
A interface oferece seleção dos mapas/algoritmos, animação, avanço manual,
controle de velocidade, filtro de camadas, armadilhas e editor/importação/
exportação de arquivos `.txt`. Ao editar um mapa, as soluções **não** são
recalculadas automaticamente: salve-o em `data/mapas_grupo/` e execute
novamente os dois comandos acima.

Os algoritmos executam em Python, não são reimplementados em JavaScript.

**Limitações pendentes:** `--fonte-consumivel` do m06 ainda não está implementado;
a comparação de modelagens precisa ser documentada e interpretada pelo grupo;
as figuras estáticas PNG obrigatórias da Seção 8 são uma entrega distinta.

# [IA] ChatGPT — assistência em exportações e interface; declarar conforme orientação atualizada da professora.
