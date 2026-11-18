# Validação de Dijkstra e Bellman-Ford — Parte 1

## Escopo
Foram mantidas as implementações em `src/graphs/algorithms.py`. A validação adiciona testes independentes em `tests/test_dijkstra.py` e `tests/test_bellman_ford.py`. A biblioteca `networkx` é usada **somente dentro dos testes**, como oráculo para conferência de distâncias.

## Como executar

```bash
python -m pytest -q tests/test_dijkstra.py tests/test_bellman_ford.py
```

Resultado da execução em 17/11/2026 na cópia de trabalho: **28 testes aprovados** (Dijkstra: 14; Bellman-Ford: 14).

Suíte combinada BFS + DFS + Dijkstra + Bellman-Ford + métricas:

```bash
python -m pytest -q tests/test_bfs.py tests/test_dfs.py tests/test_dijkstra.py tests/test_bellman_ford.py tests/test_metricas.py
```

Resultado: **54 testes aprovados**.

## Dijkstra
- Verifica que o caminho de menor custo pode diferir do caminho com menos arestas.
- Verifica arestas com peso zero e vértices desconectados.
- Verifica rejeição de qualquer arco negativo, inclusive em componente inalcançável.
- Verifica origem inexistente.
- Compara todas as distâncias nos mapas m01, m02, m03, m04, m07 e m08 com um oráculo externo, e valida o custo dos caminhos reconstruídos via predecessores.
- Nos mapas m05 e m06, verifica a rejeição por pesos negativos.
- Verifica os status de integração com `resolver` em m05 (RECUSA) e m07 (SEM_SOLUCAO).

## Bellman-Ford
- Verifica menor custo com peso negativo sem ciclo negativo.
- Verifica detecção e reconstrução de um ciclo negativo alcançável, com soma dos pesos conferida nas arestas reais do grafo.
- Verifica que um ciclo negativo inalcançável não afeta a origem.
- Verifica origem inexistente.
- No m05, compara distâncias com oráculo externo e confirma ausência de ciclo negativo alcançável.
- No m06, confirma ciclo negativo alcançável com arestas válidas e custo negativo.
- Nos mapas m01, m02, m03, m04, m07 e m08, compara as distâncias com um oráculo externo.
- Verifica os status de integração em m06 (CICLO_NEGATIVO) e m07 (SEM_SOLUCAO).

## Limitações e pendências
- A comparação com oráculo valida o resultado dos algoritmos **sobre o grafo produzido pelo código do grupo**; não é uma prova independente de que o gerador de estados interpreta corretamente todas as regras dos mapas.
- A opção `--fonte-consumivel` permanece não implementada na construção do grafo e não é coberta por uma implementação corretiva nesta etapa.
- O registro e a apresentação do ciclo negativo no JSON de saída, conforme exigido pelo enunciado, devem ser conferidos separadamente.
- Estes testes não corrigem as integrações existentes nem alteram Dijkstra ou Bellman-Ford.

## Registro de IA
Arquivos de testes e este relatório foram criados com apoio de IA, e o uso deve ser registrado conforme a orientação vigente da docente.
