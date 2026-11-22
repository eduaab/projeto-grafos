# Dataset da Parte 2 — ICEWS Coded Event Data

Eventos políticos codificados automaticamente a partir de notícias ("ator X fez a ação Z contra o ator Y em tal data").

- **Fonte:** Harvard Dataverse — ICEWS Coded Event Data
- **DOI:** [10.7910/DVN/28075](https://doi.org/10.7910/DVN/28075)
- **Cobertura:** um arquivo por ano, de **1995 a 2022** (não existem dados anteriores a 1995).
- **Citação:** Boschee, E.; Lautenschlager, J.; O'Brien, S.; Shellman, S.; Starz, J.; Ward, M. (2015). *ICEWS Coded Event Data*. Harvard Dataverse. doi:10.7910/DVN/28075

> Os arquivos brutos **não são versionados no Git** (são grandes). Eles são baixados pelo script abaixo para a pasta `raw/`, que é criada automaticamente.

## Requisitos

- Python 3.11+
- Nenhuma biblioteca externa (só a biblioteca padrão)
- Internet

## Como rodar

Abra o terminal **dentro desta pasta** (`data/dataset_parte2/`).

> No Linux/Mac pode ser `python3` no lugar de `python`. No Windows, `py` também costuma funcionar.

### 0. Ver a ajuda

```bash
python baixar_icews.py
```

Rodar **sem nenhum argumento** mostra a ajuda (igual ao `--help`) e não baixa nada.

### 1. Só a documentação (~6 MB)

```bash
python baixar_icews.py --docs
```

Baixa **somente** os PDFs (Read Me, guia CAMEO etc.) para `raw/`. Não baixa nenhum dado de eventos e não pergunta nada. Leia o *Read Me* antes de escolher o recorte.

### 2. Baixar eventos de alguns anos

```bash
python baixar_icews.py --de 2010 --ate 2014
```

Usar `--de` e/ou `--ate` baixa **só os eventos** desse intervalo (sem os PDFs). O script mostra a lista e o tamanho estimado e pergunta `Continuar? [s/N]`. Os `.zip` são descompactados automaticamente.

### 3. Baixar eventos de todos os anos

```bash
python baixar_icews.py --eventos
```

São mais de 1,7 GB baixados, e o espaço ocupado depois de descompactar é maior. Confira o espaço em disco antes.

### 4. Documentação + eventos juntos

```bash
python baixar_icews.py --docs --eventos
python baixar_icews.py --docs --de 2010 --ate 2014
```

### 5. Só ver o que seria baixado

```bash
python baixar_icews.py --listar                  # tudo que existe no dataset
python baixar_icews.py --eventos --listar        # só os arquivos de eventos
python baixar_icews.py --docs --listar           # só os PDFs
```

## Opções

| Opção | O que faz |
|---|---|
| *(nenhuma)* | Mostra a ajuda |
| `--docs` | Baixa somente a documentação (PDFs) |
| `--eventos` | Baixa somente os eventos, de todos os anos |
| `--de ANO` / `--ate ANO` | Baixa somente os eventos desse intervalo (ativa `--eventos`) |
| `--docs` + `--eventos`/`--de`/`--ate` | Baixa as duas coisas |
| `--listar` | Só lista os arquivos e sai (sozinho, lista tudo) |
| `--sem-extrair` | Não descompacta os `.zip` |
| `--manter-zip` | Não apaga o `.zip` depois de extrair |
| `--sim` | Não pede confirmação ao baixar eventos |
| `--destino CAMINHO` | Outra pasta de destino (padrão: `./raw`) |

## Resultado

```
data/dataset_parte2/
├─ baixar_icews.py
├─ README.md
└─ raw/                      # criada pelo script
   ├─ *.pdf                  # documentação
   ├─ events.AAAA.<data>.tab # eventos (um por ano)
   └─ .baixados.json         # controle interno: o que já foi baixado e extraído
```

Se a execução for interrompida, rode o mesmo comando de novo: o que já foi baixado e extraído é pulado.

## Resumo de todos os anos (`resumir_anos.py`)

Depois de baixar os eventos, rode (dentro desta pasta):

```bash
python resumir_anos.py                    # todos os anos encontrados em raw/
python resumir_anos.py --anos 1995 1996   # só alguns anos
```

O script continua o piloto de 1995 do `EDA.ipynb` para todos os anos. Como os
brutos somam mais de 1,7 GB, cada ano é lido em partes e só o resumo dele fica
na memória. Nenhuma linha é apagada: ausências, duplicatas e eventos sem país
são contados e relatados.

Antes de qualquer análise, ele confere se todos os arquivos têm as mesmas
colunas do primeiro ano. Se algum ano for diferente, ele para e mostra a
diferença (use `--ignorar-diferencas` para continuar mesmo assim).

Saídas em `processado/`:

| Arquivo | Conteúdo |
|---|---|
| `verificacao_colunas.csv` | Colunas de cada arquivo comparadas com as do primeiro ano |
| `resumo_anos.csv` | Uma linha por ano: eventos, duplicatas, datas inválidas, intensidade, eventos sem país, países, pares dirigidos |
| `nulos_por_ano.csv` | Valores ausentes por coluna e por ano |
| `correlacao_nulos_por_ano.csv` | Correlação entre as ausências de cada par de colunas, por ano (base do mapa de calor de ausências) |
| `presenca_paises.csv` | País × ano (True/False) e em quantos anos cada país aparece |
| `eventos_por_pais_ano.csv` | Eventos de cada país como origem e como destino, por ano |
| `pares_paises_por_ano.csv.gz` | Pares dirigidos entre países diferentes, por ano, com nº de eventos e soma/média da intensidade |

## Arestas do grafo de países (`gerar_arestas.py`)

Depois de rodar `resumir_anos.py`, rode (dentro desta pasta):

```bash
python gerar_arestas.py
```

Gera `arestas_paises.csv`, com todos os anos juntos. Cada linha é um par dirigido entre países diferentes:

| Coluna | Conteúdo |
|---|---|
| `origem`, `destino` | Países de origem e de destino |
| `peso` | Média da intensidade de todos os eventos do par (de −10 a +10) |
| `n_eventos` | Quantidade de eventos do par |
| `anos_com_eventos` | Em quantos anos o par teve pelo menos um evento |
| `par_fraco` | `True` quando o par tem um único evento |

### Tratamento de nomes de países

A Macedônia passou a se chamar Macedônia do Norte em 2019. Nos dados, ela aparece como
"the former Yugoslav Republic of Macedonia" e, de 2020 a 2022, como país de origem, com o
nome cortado ("the former Yugoslav Republic of"). Isso criava dois nós para o mesmo país.
Os dois nomes são unificados como **North Macedonia** antes de montar as arestas.

Em 2017, Curaçao também aparece com o "ç" corrompido ("CuraÃ§ao"), por erro de codificação
nos dados, e é unificado com "Curaçao".

`paises_padronizados.csv` registra cada nome original, o nome usado, o motivo e quantos
eventos foram afetados.

## Não suba os brutos para o GitHub

Adicione ao `.gitignore` na raiz do repositório:

```
data/dataset_parte2/raw/
```

O GitHub costuma recusar arquivos acima de 100 MB (vários arquivos anuais passam disso). Suba apenas versões processadas pequenas (ex.: lista de arestas em CSV gerada por script do grupo).

## Problemas comuns

- **`Erro ao listar arquivos` / `Falha ao acessar`:** verifique a conexão. Em rede com restrição (universidade, VPN), tente outra rede.
- **Erro 403/404:** o Dataverse pode ter mudado a API ou o dataset. Baixe manualmente em https://doi.org/10.7910/DVN/28075 (aba *Data & Analysis*) e coloque os arquivos em `raw/`.
- **Falhou só um arquivo:** rode o mesmo comando de novo; só ele será baixado.
- **Windows, caminho muito longo:** mantenha o repositório em uma pasta curta (ex.: `C:\projetos\projeto-grafos`).
