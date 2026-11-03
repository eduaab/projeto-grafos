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
