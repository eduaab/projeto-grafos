# Validação de BFS e DFS — Parte 1

Comando: `python -m pytest -q tests/test_bfs.py tests/test_dfs.py`

Resultado em 17/11/2026: **21 testes aprovados** (10 BFS, 11 DFS).

## BFS
- Confere as distâncias em número de arcos, independentemente dos pesos.
- Confere a árvore de predecessores e o desempate pela ordem da lista de adjacência.
- Confere ausência de laços infinitos em grafos cíclicos e tratamento de vértices desconectados.
- Compara as distâncias de cada um dos oito mapas oficiais com `networkx.single_source_shortest_path_length`, exclusivamente dentro de `tests/`.
- Confere o caso `m07_impossivel`, onde ALVO é inalcançável.

## DFS
- Confere os quatro tipos de arcos (árvore, retorno, avanço, cruzamento) em grafo dirigido construído para exercitar todas as classes.
- Confere tempos de descoberta/encerramento, predecessores e detecção de ciclos.
- Confere vértices inalcançáveis e grafo acíclico.
- Nos oito mapas, verifica a cobertura dos arcos incidentes a estados alcançáveis e as relações temporais de cada tipo de arco.
- NetworkX é utilizado apenas nos testes como referência para alcance, sem substituir o algoritmo do grupo.

## Limites e próximos passos
- Os testes verificam o comportamento dos algoritmos **sobre o grafo produzido pelo projeto**; eles não certificam todas as regras da construção de estados.
- Os testes não comprovam a ordem de vizinhos N, L, S, O do construtor. Isso exige testes próprios do construtor.
- O código de `solve.py` para DFS usa o tempo de descoberta como se fosse distância em passos ao escolher uma saída; DFS não garante caminho mínimo. Essa integração deve ser revista antes de usar os resultados de DFS como caminho ótimo.
- A exportação obrigatória `out/parte1/dfs_classificacao.csv` não é criada por esses testes.
- O enunciado originalmente entregue restringia o uso de IA; o grupo deve seguir e documentar a atualização de orientação comunicada pela professora.
