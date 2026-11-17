# Validação independente dos algoritmos — Parte 1

Data: 17/11/2026

## Procedimento

Foram criados testes com grafos artificiais de resultados conhecidos e testes nos oito mapas fornecidos. O NetworkX (3.6.1) foi usado exclusivamente no diretório `tests/` como oráculo de comparação, conforme o enunciado. Executar na raiz do projeto:

```bash
python -m pytest -q
```

## Resultado

**28 testes aprovados** (`tests/test_validacao_algoritmos.py` e `tests/test_metricas.py`). Os algoritmos BFS, DFS, Dijkstra e Bellman-Ford passaram nas verificações executadas.

| Item | Verificação |
| --- | --- |
| BFS | Distâncias mínimas em número de arestas, predecessores e ordem de desempate; oito mapas |
| DFS | Tempos e predecessores; arestas de árvore, retorno, avanço e cruzamento; oito mapas |
| Dijkstra | Distâncias mínimas comparadas ao NetworkX; pesos zero; vértices isolados; recusa de arco negativo |
| Bellman-Ford | Custos mínimos com e sem pesos negativos; recuperação e custo de ciclo negativo; ciclo negativo inacessível ignorado |
| Mapas | m01 a m08; casos específicos m05 e m06; m07 sem solução |

## Pendências que os testes não eliminam

1. A opção `--fonte-consumivel` ainda não muda o grafo: a função `resolver()` recebe o parâmetro, mas não o utiliza para construir estados. O m06 continua retornando `CICLO_NEGATIVO` com a opção ativada.
2. A identificação/exportação dos estados-armadilha não está implementada no fluxo de resolução (`--armadilhas`).
3. A exportação obrigatória `dfs_classificacao.csv` não é realizada pelo fluxo de execução atual.
4. A validade semântica das regras de conversão dos mapas em grafos exige testes adicionais de `estados.py`/`io.py`, inclusive teste mínimo com contagem calculada manualmente.
5. Não foi feita verificação de desempenho ou robustez para mapas-surpresa de tamanho arbitrário.
6. A DFS começa em uma origem e não percorre componentes desconectados; isto é compatível com a solicitação de DFS a partir do estado inicial, mas não corresponde a uma floresta DFS completa para grafo desconexo.

**Nota:** no m07, o nó `ALVO` está presente, mas não é alcançável. Um teste inicial assumiu incorretamente que todos os nós seriam alcançáveis pela DFS; essa premissa foi corrigida para validar apenas os vértices alcançáveis. A falha era do teste, não da DFS.

## Uso de IA

Este conjunto de testes e este relatório foram produzidos com apoio de IA, a ser registrado conforme orientações vigentes da professora.
