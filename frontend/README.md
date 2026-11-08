# Frontend — Dossiê de Operações do Labirinto

Site visual do projeto de Teoria dos Grafos: visualizar os labirintos catalogados, importar/exportar mapas em `.txt` e criar os seus próprios labirintos numa interface gamificada.

**Importante:** este frontend é só a parte visual. Ele não implementa nem roda nenhum algoritmo de grafo (BFS, DFS, Dijkstra, Bellman-Ford) e não constrói o grafo de estados — isso continua sendo feito em Python, em `src/` (fora desta pasta), conforme exigido pelo enunciado.

## Requisitos

- Node.js 20 ou mais recente
- npm (vem junto com o Node)

## Como rodar

Todos os comandos abaixo são executados dentro desta pasta (`frontend/`):

```bash
npm install
```

Instala as dependências (só precisa rodar de novo se o `package.json` mudar).

```bash
npm run dev
```

Sobe o servidor de desenvolvimento (Vite) com hot-reload. O terminal mostra o endereço, normalmente `http://localhost:5173/`. Antes de subir, isso roda automaticamente `scripts/sync-mapas.mjs`, que lê os `.txt` de `../data/mapas/`, `../data/mapas_grupo/` e `../data/mapas_criados/`, valida cada um (grade retangular, símbolos válidos, exatamente um `S`) e copia os válidos para `public/mapas/` + gera `src/data/mapas.manifest.json` — é assim que a Sala de Mapas sempre mostra os mapas reais e atualizados, sem precisar duplicar os arquivos manualmente. Esses dois (`public/mapas/`, `src/data/mapas.manifest.json`) são gerados e ficam fora do Git.

```bash
npm run build
```

Gera a versão de produção (TypeScript + build do Vite) na pasta `dist/`. Útil pra conferir que não há erro de tipos antes de commitar. Também roda o `sync-mapas.mjs` antes (mesma lógica do `npm run dev`).

```bash
npm run preview
```

Serve localmente o resultado de `npm run build`, pra conferir a build de produção.

```bash
npm run lint
```

Roda o linter (Oxlint).

## Estrutura

```
frontend/
├─ src/
│  ├─ components/   # Layout (header/nav/footer), transição de rota (cortina), ícones
│  ├─ pages/        # Home e as páginas de cada seção
│  └─ styles/        # tema visual (cores, tipografia)
└─ public/
```

### Páginas

- **Base** (`/`) — página inicial, com a apresentação do projeto e navegação para as demais seções.
- **Sala de Mapas** (`/labirintos`, detalhe em `/labirintos/:id`) — galeria dos labirintos catalogados (lidos de verdade a partir dos `.txt`) com miniatura de cada um; ao abrir um, mostra a grade completa com legenda dos símbolos.
- **Oficina de Campo** (`/editor`) — desenhe o seu próprio labirinto numa grade interativa (clique/arraste para pintar com os mesmos símbolos dos mapas oficiais). Baixar, salvar e importar sempre abrem antes um modal de prévia (a grade como vai ficar + validação) com um botão de confirmar. "Salvar" grava o `.txt` direto em `data/mapas_criados/`, sem passar pela pasta de downloads:
  - Rodando com `npm run dev`, é direto — o próprio servidor de desenvolvimento escreve o arquivo (sem nenhum seletor de pasta). Esse endpoint (`vite.config.ts`) só existe em modo dev; some sozinho do build de produção.
  - Sem o servidor de dev (`vite preview`, build publicado), cai para a File System Access API do navegador: você escolhe a pasta uma vez (só em Chrome/Edge — não existe forma de um site escrever num caminho fixo do disco sem essa permissão explícita). Em navegadores sem nenhum dos dois, o botão mostra um aviso pra usar "Baixar .txt".

  Valida ao vivo as mesmas regras do `sync-mapas.mjs` (um único `S`, pelo menos um `G`).
- **Arquivo & Transmissão** (`/importar-exportar`) — importar/exportar labirintos em `.txt`. *Em breve.*
