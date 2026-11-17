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
