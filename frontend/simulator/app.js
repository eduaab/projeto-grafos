// [IA] ChatGPT – apresentação dos eventos registrados pelos algoritmos Python.
const byId = (id) => document.getElementById(id);
const algorithmNames = { BFS: 'BFS', DFS: 'DFS', DIJKSTRA: 'Dijkstra', BELLMAN_FORD: 'Bellman-Ford' };
const statusNames = { OK: 'Concluído', SEM_SOLUCAO: 'Sem solução', RECUSA: 'Peso negativo · recusa', CICLO_NEGATIVO: 'Ciclo negativo' };
const arcNames = { arvore: 'árvore', retorno: 'retorno', avanco: 'avanço', cruzamento: 'cruzamento' };
const tileTypes = { '#': 'wall', ',': 'mud', '~': 'water', S: 'start', G: 'goal', '+': 'bonus', '*': 'source' };
const arrows = { '^': '↑', '>': '→', v: '↓', '<': '←' };
const maps = new Map(Object.entries(DATA));
const mapSelect = byId('mapSelect');
const algorithmPicker = byId('algorithms');
const panelContainer = byId('panels');
let currentMap;
let runners = [];
let position = 0;
let maximum = 0;
let timer = null;
let loading = false;
let requestVersion = 0;
let fitFrame = null;
const layoutObserver = new ResizeObserver(() => scheduleFit());

function scheduleFit() {
  if (fitFrame !== null) return;
  fitFrame = requestAnimationFrame(() => {
    fitFrame = null;
    fitBoards();
  });
}

function fitBoards() {
  const toolbarHeight = document.querySelector('.playback').getBoundingClientRect().height;
  document.documentElement.style.setProperty('--playback-height', toolbarHeight + 'px');
  const columns = getComputedStyle(panelContainer).gridTemplateColumns.split(' ').length;
  const rows = Math.max(1, Math.ceil(runners.length / columns));
  const panelTop = Math.max(12, panelContainer.getBoundingClientRect().top);
  const availablePanelHeight = (window.innerHeight - panelTop - toolbarHeight - 36 - (rows - 1) * 18) / rows;
  const zoom = Number(byId('zoom').value) / 100;
  for (const runner of runners) {
    const styles = getComputedStyle(runner.viewport);
    const horizontalPadding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
    const verticalPadding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
    const width = runner.board.offsetWidth;
    const height = runner.board.offsetHeight;
    const availableWidth = Math.max(1, runner.viewport.clientWidth - horizontalPadding);
    const headerHeight = runner.board.closest('.panel').querySelector('.panel-heading').offsetHeight;
    const extraHeight = headerHeight + runner.movement.offsetHeight + runner.footer.offsetHeight + verticalPadding;
    const minimumHeight = runners.length > 1 ? 240 : 320;
    const availableHeight = Math.max(minimumHeight, Math.min(540, availablePanelHeight - extraHeight));
    // O enquadramento automático preserva casas legíveis. Mapas maiores
    // usam rolagem no painel em vez de reduzir todos os símbolos a miniaturas.
    const minimumScale = runners.length > 1 ? 0.8 : 0.9;
    const fitScale = Math.min(1.4, (availableWidth - 1) / width, (availableHeight - 1) / height);
    const autoScale = Math.max(minimumScale, fitScale);
    runner.fitZoom = Math.min(100, fitScale / autoScale * 100);
    const scale = autoScale * zoom;
    runner.viewport.style.height = (availableHeight + verticalPadding) + 'px';
    runner.surface.style.width = (width * scale) + 'px';
    runner.surface.style.height = (height * scale) + 'px';
    runner.board.style.transform = `scale(${scale})`;
    renderRoute(runner);
    followState(runner);
  }
  byId('zoomValue').textContent = Math.round(zoom * 100) + (zoom === 1 ? '% · legível' : '%');
}

function followState(runner) {
  if (!runner.state || runner.followedIndex === runner.index) return;
  runner.followedIndex = runner.index;
  const cell = runner.cells.get(stateAddress(runner.state)).tile.getBoundingClientRect();
  const viewport = runner.viewport.getBoundingClientRect();
  const margin = 24;
  if (cell.left < viewport.left + margin) runner.viewport.scrollLeft += cell.left - viewport.left - margin;
  else if (cell.right > viewport.right - margin) runner.viewport.scrollLeft += cell.right - viewport.right + margin;
  if (cell.top < viewport.top + margin) runner.viewport.scrollTop += cell.top - viewport.top - margin;
  else if (cell.bottom > viewport.bottom - margin) runner.viewport.scrollTop += cell.bottom - viewport.bottom + margin;
}

function isPathView() {
  return byId('view').value === 'path';
}

function stateAddress(state) {
  return state[0] + ',' + state[1];
}

function notify(message = '') {
  byId('message').textContent = message;
  byId('message').hidden = !message;
}

function stop() {
  window.clearInterval(timer);
  timer = null;
  byId('play').textContent = 'Iniciar';
}

function addMap(id, data, title) {
  maps.set(id, data);
  const option = document.createElement('option');
  option.value = id;
  option.textContent = title || id.replaceAll('_', ' ');
  mapSelect.appendChild(option);
}

function makeRunner(name) {
  const result = currentMap.algoritmos?.[name];
  const panel = document.createElement('article');
  panel.className = 'panel';
  const header = document.createElement('button');
  header.type = 'button';
  header.className = 'panel-heading';
  header.setAttribute('aria-haspopup', 'dialog');
  const title = document.createElement('span');
  title.className = 'panel-name';
  title.textContent = algorithmNames[name];
  const note = document.createElement('span');
  note.className = 'panel-note';
  note.textContent = isPathView() ? 'Caminho final · direção e ordem dos passos'
    : name === 'BELLMAN_FORD' ? 'Inicialização + melhorias de distância' : 'Visitas aos estados da exploração';
  title.appendChild(note);
  const badge = document.createElement('span');
  badge.className = 'badge';
  header.append(title, badge);
  const viewport = document.createElement('div');
  viewport.className = 'board-scroll';
  viewport.tabIndex = 0;
  viewport.setAttribute('aria-label', 'Mapa. Arraste ou use as setas do teclado para navegar.');
  enablePan(viewport);
  const board = document.createElement('div');
  board.className = 'board';
  board.style.setProperty('--cols', currentMap.mapa[0].length);
  board.setAttribute('role', 'group');
  board.setAttribute('aria-label', 'Mapa de exploração de ' + algorithmNames[name]);
  const cells = new Map();
  for (const [line, row] of currentMap.mapa.entries()) {
    for (const [column, symbol] of [...row].entries()) {
      const tile = document.createElement('div');
      const symbolText = document.createElement('span');
      symbolText.className = 'symbol';
      symbolText.textContent = symbol === '#' ? '' : (arrows[symbol] || (symbol === '.' ? '·' : symbol));
      const count = document.createElement('span');
      count.className = 'count';
      const lock = document.createElement('span');
      lock.className = 'lock-mark';
      tile.append(symbolText, count, lock);
      const address = line + ',' + column;
      cells.set(address, { tile, symbolText, count, lock, symbol, line, column });
      tile.dataset.address = address;
      tile.addEventListener('click', () => showDetails(name, address));
      board.appendChild(tile);
    }
  }
  const mapSurface = document.createElement('div');
  mapSurface.className = 'map-surface';
  const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  overlay.classList.add('route-overlay');
  overlay.setAttribute('aria-hidden', 'true');
  mapSurface.append(board, overlay);
  viewport.appendChild(mapSurface);
  const movement = document.createElement('p');
  movement.className = 'movement';
  const footer = document.createElement('div');
  footer.className = 'panel-footer';
  panel.append(header, viewport, movement, footer);
  panelContainer.appendChild(panel);
  header.addEventListener('click', () => showDetails(name));
  const events = isPathView() ? (result?.caminho || []).map((id) => [id, null, 0]) : result?.eventos || [];
  return { name, result, events, badge, footer, cells, board, overlay, movement, viewport, surface: mapSurface,
    index: 0, counts: new Map(), state: null, event: null };
}

function enablePan(viewport) {
  let drag = null;
  let suppressClickUntil = 0;
  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.pointerType === 'touch') return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY,
      left: viewport.scrollLeft, top: viewport.scrollTop, moved: false };
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    if (!drag.moved) viewport.setPointerCapture(event.pointerId);
    drag.moved = true;
    viewport.classList.add('dragging');
    viewport.scrollLeft = drag.left - dx;
    viewport.scrollTop = drag.top - dy;
    event.preventDefault();
  });
  const finish = () => {
    if (drag?.moved) suppressClickUntil = performance.now() + 200;
    drag = null;
    viewport.classList.remove('dragging');
  };
  viewport.addEventListener('pointerup', finish);
  viewport.addEventListener('pointercancel', finish);
  viewport.addEventListener('lostpointercapture', finish);
  viewport.addEventListener('click', (event) => {
    if (performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

function setRunnerPosition(runner, target) {
  const events = runner.events;
  target = Math.min(target, events.length);
  if (target < runner.index) {
    runner.counts.clear();
    runner.index = 0;
    runner.state = null;
    runner.event = null;
    runner.followedIndex = -1;
    if (target === 0) runner.viewport.scrollTo(0, 0);
  }
  while (runner.index < target) {
    const event = events[runner.index];
    const state = currentMap.estados[event[0]];
    const address = state[0] + ',' + state[1];
    const layer = state[2] || '-';
    let counts = runner.counts.get(layer);
    if (!counts) {
      counts = new Map();
      runner.counts.set(layer, counts);
    }
    counts.set(address, (counts.get(address) || 0) + 1);
    runner.state = state;
    runner.event = event;
    runner.index++;
  }
}

function visibleCounts(runner) {
  const selectedLayer = byId('layer').value;
  const total = new Map();
  for (const [layer, counts] of runner.counts) {
    if (selectedLayer !== 'all' && selectedLayer !== layer) continue;
    for (const [address, count] of counts) total.set(address, (total.get(address) || 0) + count);
  }
  return total;
}

function renderRunner(runner) {
  const result = runner.result;
  const done = result && runner.index === runner.events.length;
  const counts = visibleCounts(runner);
  const current = runner.state;
  const keys = current?.[2] || '';
  const bonus = new Set(current?.[3] || []);
  const layer = byId('layer').value;
  const visibleStates = currentMap.estados.filter((state) => layer === 'all' || (state[2] || '-') === layer);
  const visiblePositions = new Set(visibleStates.map((state) => state[0] + ',' + state[1]));
  const traps = new Set();
  if (byId('traps').checked) {
    for (const id of currentMap.armadilhas || []) {
      const state = currentMap.estados[id];
      if (layer === 'all' || (state[2] || '-') === layer) traps.add(state[0] + ',' + state[1]);
    }
  }
  const path = new Set();
  if (done || isPathView()) {
    for (const id of (isPathView() ? result?.caminho.slice(0, runner.index) || [] : result.caminho)) {
      const state = currentMap.estados[id];
      if (layer === 'all' || (state[2] || '-') === layer) path.add(state[0] + ',' + state[1]);
    }
  }
  const consumed = new Set([...bonus].map((id) => currentMap.consumiveis[id].join(',')));
  for (const [address, cell] of runner.cells) {
    const { tile, symbol, count, symbolText, lock, line, column } = cell;
    const visits = counts.get(address) || 0;
    const classes = ['tile', tileTypes[symbol] || 'floor'];
    if ('abcd'.includes(symbol)) classes.push('key');
    const door = 'ABCD'.includes(symbol);
    if (door) classes.push('door');
    if (visits) classes.push('visited');
    if (visits > 1) classes.push('revisited');
    if (path.has(address)) classes.push('final');
    if (traps.has(address)) classes.push('trap');
    if (current && current[0] === line && current[1] === column) classes.push('active');
    if (layer !== 'all' && symbol !== '#' && !visiblePositions.has(address)) classes.push('dim');
    const unlocked = door && keys.includes(symbol.toLowerCase());
    if (unlocked) classes.push('unlocked');
    if (consumed.has(address) || ('abcd'.includes(symbol) && keys.includes(symbol))) classes.push('consumed');
    tile.className = classes.join(' ');
    count.textContent = visits || '';
    symbolText.className = 'symbol';
    lock.textContent = unlocked ? '✓' : '';
    tile.title = `Linha ${line}, coluna ${column} · ${visits} visita(s)` + (unlocked ? ' · porta desbloqueada' : '');
  }
  runner.badge.textContent = !result ? 'Sem exploração calculada' : done ? statusNames[result.status]
    : runner.index ? isPathView() ? 'Percorrendo caminho' : 'Explorando' : 'Pronto';
  runner.badge.classList.toggle('warning', !result || (done && result.status !== 'OK'));
  const eventCount = runner.events.length;
  const round = !isPathView() && runner.name === 'BELLMAN_FORD' && runner.event ? ` · rodada ${runner.event[2]}` : '';
  const unit = isPathView() ? 'posições do caminho' : 'eventos';
  runner.footer.textContent = `${runner.index.toLocaleString('pt-BR')} / ${eventCount.toLocaleString('pt-BR')} ${unit}${round} · Clique para detalhes`;
  renderRoute(runner);
  followState(runner);
}

function routeSegments(runner) {
  const ids = runner.result?.caminho || [];
  const limit = isPathView() ? runner.index : runner.index === runner.events.length ? ids.length : 0;
  const segments = [];
  const traversed = new Set();
  for (let step = 1; step < limit; step++) {
    const from = currentMap.estados[ids[step - 1]];
    const to = currentMap.estados[ids[step]];
    const edge = stateAddress(from) + '>' + stateAddress(to);
    const reverse = stateAddress(to) + '>' + stateAddress(from);
    segments.push({ from, to, step, returning: traversed.has(reverse) });
    traversed.add(edge);
  }
  return segments;
}

function renderRoute(runner) {
  const segments = routeSegments(runner);
  const layer = byId('layer').value;
  runner.overlay.replaceChildren();
  runner.overlay.setAttribute('viewBox', `0 0 ${runner.board.offsetWidth} ${runner.board.offsetHeight}`);
  const size = 40;
  const stride = size + 2;
  const visible = segments.filter(({ from, to }) => layer === 'all'
    || (from[2] || '-') === layer && (to[2] || '-') === layer);
  // A última passagem por uma aresta dirigida fica visível. O replay e o card
  // preservam a ordem completa quando o percurso usa o mesmo trecho várias vezes.
  const latest = new Map();
  for (const segment of visible) latest.set(stateAddress(segment.from) + '>' + stateAddress(segment.to), segment);
  for (const segment of latest.values()) {
    const { from, to, step, returning } = segment;
    const dx = to[1] - from[1];
    const dy = to[0] - from[0];
    const offset = size * 0.14;
    const x1 = 3 + from[1] * stride + size / 2 - dy * offset;
    const y1 = 3 + from[0] * stride + size / 2 + dx * offset;
    const x2 = x1 + dx * stride;
    const y2 = y1 + dy * stride;
    const active = isPathView() && step === runner.index - 1;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    // Traços nas bordas das casas deixam o símbolo e o contador livres.
    line.setAttribute('x1', x1 + dx * size * 0.33);
    line.setAttribute('y1', y1 + dy * size * 0.33);
    line.setAttribute('x2', x2 - dx * size * 0.33);
    line.setAttribute('y2', y2 - dy * size * 0.33);
    line.setAttribute('class', 'route-line' + (returning ? ' returning' : '') + (active ? ' current-move' : ''));
    const head = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const x = x2 - dx * size * 0.27;
    const y = y2 - dy * size * 0.27;
    const length = active ? 5 : 4;
    head.setAttribute('d', `M ${x - dx * length - dy * length} ${y - dy * length + dx * length} L ${x} ${y} L ${x - dx * length + dy * length} ${y - dy * length - dx * length}`);
    head.setAttribute('class', line.getAttribute('class'));
    runner.overlay.append(line, head);
  }
  if (isPathView()) {
    const last = segments.at(-1);
    runner.movement.textContent = last
      ? `Passo ${last.step} · (${last.from[0]},${last.from[1]}) ${arrowsForMove(last.from, last.to)} (${last.to[0]},${last.to[1]}) · ${last.returning ? 'retorno por trecho já usado' : 'avanço'}`
      : runner.events.length ? 'Início do caminho · avance para acompanhar o sentido.' : 'Este resultado não possui um caminho final para reproduzir.';
  } else {
    runner.movement.textContent = runner.index === runner.events.length && runner.result?.caminho.length
      ? 'Setas do caminho final disponíveis. Use Reproduzir caminho final para ver a ordem e os retornos.'
      : 'Exploração de estados · mudanças entre ramos podem saltar de posição.';
  }
}

function arrowsForMove(from, to) {
  if (to[0] < from[0]) return '↑';
  if (to[0] > from[0]) return '↓';
  return to[1] > from[1] ? '→' : '←';
}

function render() {
  for (const runner of runners) {
    setRunnerPosition(runner, position);
    renderRunner(runner);
  }
  byId('progress').value = position;
  byId('progressText').textContent = `${position.toLocaleString('pt-BR')} / ${maximum.toLocaleString('pt-BR')} ${isPathView() ? 'posições' : 'eventos'}`;
  byId('back').disabled = !position || loading;
  byId('restart').disabled = !position || loading;
  byId('next').disabled = position >= maximum || loading;
  byId('play').disabled = !maximum || loading;
}

function configurePanels(reset = true) {
  stop();
  if (reset) position = 0;
  panelContainer.replaceChildren();
  const names = [...algorithmPicker.querySelectorAll('input:checked')].map((input) => input.value);
  panelContainer.classList.toggle('compare', names.length > 1);
  runners = names.map(makeRunner);
  maximum = Math.max(0, ...runners.map((runner) => runner.events.length));
  position = Math.min(position, maximum);
  if (!names.length) {
    const empty = document.createElement('p');
    empty.className = 'notice';
    empty.textContent = 'Selecione um ou mais algoritmos para visualizar.';
    panelContainer.appendChild(empty);
  }
  byId('progressLabel').textContent = isPathView() ? 'Caminho final' : 'Exploração';
  byId('viewHint').textContent = isPathView()
    ? 'As setas indicam o sentido real do percurso. O contador mostra passagens pelo caminho final.'
    : 'Os números contam estados processados. A exploração pode trocar de ramo.';
  byId('progress').max = maximum;
  render();
  layoutObserver.disconnect();
  layoutObserver.observe(document.querySelector('.playback'));
  for (const runner of runners) layoutObserver.observe(runner.viewport);
  fitBoards();
}

function loadMap() {
  requestVersion++;
  loading = false;
  byId('calculate').disabled = false;
  byId('source').disabled = false;
  currentMap = maps.get(mapSelect.value);
  byId('zoom').value = '100';
  byId('source').checked = Boolean(currentMap.fonte_consumivel);
  const layers = [...new Set(currentMap.estados.map((state) => state[2] || '-'))].sort();
  byId('layer').replaceChildren(new Option('Todas as camadas', 'all'));
  for (const layer of layers) byId('layer').add(new Option(layer === '-' ? 'Sem chaves' : 'Chaves ' + layer, layer));
  byId('calculate').hidden = Boolean(currentMap.algoritmos);
  configurePanels();
}

function detailField(container, label, value) {
  const field = document.createElement('div');
  field.className = 'detail';
  const caption = document.createElement('span');
  caption.textContent = label;
  const content = document.createElement('strong');
  content.textContent = value ?? '—';
  field.append(caption, content);
  container.appendChild(field);
}

function showDetails(name, address) {
  stop();
  const runner = runners.find((item) => item.name === name);
  const body = byId('detailsBody');
  body.replaceChildren();
  byId('detailsTitle').textContent = algorithmNames[name] + (address ? ' · casa (' + address + ')' : ' · execução');
  const done = runner.result && runner.index === runner.events.length;
  const status = document.createElement('p');
  status.className = 'result-status';
  status.textContent = !runner.result ? 'Sem resultados calculados'
    : done ? statusNames[runner.result.status] : runner.index ? 'Reprodução em andamento' : 'Pronto para iniciar';
  status.classList.toggle('warning', Boolean(done && runner.result.status !== 'OK'));
  const primary = document.createElement('div');
  primary.className = 'primary-metrics';
  const result = runner.result;
  detailField(primary, result?.status === 'CICLO_NEGATIVO' ? 'Custo do ciclo' : 'Custo do percurso',
    done ? result?.custo : 'Ao concluir');
  detailField(primary, 'Passos no percurso', done ? result?.passos : 'Ao concluir');
  const time = result?.tempo_ms;
  detailField(primary, 'Tempo Python (ms)', time == null ? '—'
    : time.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }));
  detailField(primary, isPathView() ? 'Posições exibidas' : 'Eventos exibidos', runner.index);
  const timeNote = document.createElement('p');
  timeNote.className = 'timing-note';
  timeNote.textContent = 'Tempo de uma execução Python com registro dos eventos. A duração da animação é controlada separadamente.';
  const secondaryTitle = document.createElement('h3');
  secondaryTitle.className = 'secondary-title';
  secondaryTitle.textContent = 'Estado e informações complementares';
  body.append(status, primary, timeNote, secondaryTitle);
  const grid = document.createElement('div');
  grid.className = 'details-grid';
  body.appendChild(grid);
  const state = runner.state;
  detailField(grid, 'Estado atual', state ? `(${state[0]},${state[1]}) | ${state[2] || '-'} | {${state[3].join(',')}}` : 'Aguardando');
  detailField(grid, 'Chaves do estado atual', state?.[2] || 'Nenhuma');
  detailField(grid, 'Consumíveis usados', state?.[3].join(', ') || 'Nenhum');
  const valueLabel = name === 'DFS' ? 'Tempo de descoberta' : name === 'BFS' ? 'Distância em passos' : 'Estimativa de custo';
  detailField(grid, isPathView() ? 'Passo atual no percurso' : valueLabel, isPathView() ? Math.max(0, runner.index - 1) : runner.event?.[1]);
  if (!isPathView() && name === 'BELLMAN_FORD') detailField(grid, 'Rodada da atualização', runner.event?.[2]);
  if (address) {
    const cell = runner.cells.get(address);
    detailField(grid, 'Símbolo original da casa', cell.symbol);
    detailField(grid, 'Contador na camada selecionada', visibleCounts(runner).get(address) || 0);
    const visits = [];
    for (const [index, id] of (runner.result?.caminho || []).entries()) {
      const s = currentMap.estados[id];
      if (stateAddress(s) === address) visits.push(`${index} (chaves ${s[2] || '-'})`);
    }
    detailField(grid, 'Passos em que aparece no caminho final', visits.join(' → ') || 'Fora do caminho final');
  }
  if (done) {
    for (const [type, count] of Object.entries(runner.result.classes)) detailField(grid, 'Arcos de ' + (arcNames[type] || type), count);
    if (runner.result.ciclo.length) {
      const cycle = document.createElement('p');
      cycle.className = 'cycle';
      cycle.textContent = runner.result.ciclo.map((id) => {
        const s = currentMap.estados[id];
        return `(${s[0]},${s[1]})|${s[2] || '-'}|{${s[3].join(',')}}`;
      }).join(' → ');
      body.appendChild(cycle);
    }
  }
  const explanation = document.createElement('p');
  explanation.textContent = isPathView()
    ? 'O contador soma as passagens pelo caminho final até este passo. Setas roxas indicam avanço e setas laranja indicam um trecho percorrido no sentido contrário a uma passagem anterior. A casa mantém seu símbolo original.'
    : name === 'BELLMAN_FORD'
    ? 'O contador registra a origem na inicialização e cada melhoria efetiva de distância, inclusive na verificação de ciclo negativo. Tentativas sem melhoria ficam fora da animação.'
    : 'O contador soma os estados processados nesta posição. A mesma casa pode ser visitada com chaves e bônus diferentes. O inventário acompanha o estado em processamento.';
  body.appendChild(explanation);
  if (name === 'DFS') {
    const note = document.createElement('p');
    note.textContent = 'O percurso da DFS pertence à sua árvore de exploração e não tem garantia de ser mínimo.';
    body.appendChild(note);
  }
  byId('details').showModal();
}

function advance(amount) {
  position = Math.max(0, Math.min(maximum, position + amount));
  render();
  if (position === maximum) stop();
}

function play() {
  if (timer !== null) { stop(); return; }
  focusMaps();
  if (position === maximum) { position = 0; render(); }
  byId('play').textContent = 'Pausar';
  timer = window.setInterval(() => advance(Number(byId('batch').value)), Number(byId('speed').value));
}

function focusMaps() {
  if (!runners.length) return;
  window.scrollTo({ top: window.scrollY + panelContainer.getBoundingClientRect().top - 12, behavior: 'instant' });
  fitBoards();
}

async function calculate() {
  stop();
  const version = ++requestVersion;
  const id = mapSelect.value;
  loading = true;
  byId('calculate').disabled = true;
  byId('source').disabled = true;
  render();
  notify('Calculando os eventos nos algoritmos Python…');
  try {
    const response = await fetch('/__explorar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapa: currentMap.mapa, fonte_consumivel: byId('source').checked }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Para calcular mapas novos, abra o site com npm run dev e Python instalado.');
    }
    const data = await response.json();
    if (version !== requestVersion) return;
    maps.set(id, data);
    loadMap();
    notify('Exploração calculada. Escolha um algoritmo ou selecione Todos.');
  } catch (error) {
    if (version !== requestVersion) return;
    byId('source').checked = Boolean(currentMap.fonte_consumivel);
    notify(error instanceof TypeError
      ? 'Para calcular mapas novos ou mudar a fonte, abra o site com npm run dev e Python instalado.'
      : error.message);
  } finally {
    if (version === requestVersion) {
      loading = false;
      byId('calculate').disabled = false;
      byId('source').disabled = false;
      render();
    }
  }
}

function parseMap(text) {
  const rows = text.replace(/\r\n?/g, '\n').split('\n').filter((row) => !row.startsWith(';'));
  while (rows.at(-1) === '') rows.pop();
  if (!rows.length || !rows[0].length) throw new Error('Mapa vazio.');
  if (rows.some((row) => row.length !== rows[0].length)) throw new Error('O mapa precisa ser retangular.');
  const joined = rows.join('');
  if ([...joined].some((char) => !'#.SG,~abcdABCD><^v+*'.includes(char))) throw new Error('Símbolo inválido no mapa.');
  if ([...joined].filter((char) => char === 'S').length !== 1) throw new Error('É necessário exatamente um S.');
  if (!joined.includes('G')) throw new Error('É necessária pelo menos uma saída G.');
  return rows;
}

mapSelect.addEventListener('change', () => { notify(); loadMap(); });
algorithmPicker.addEventListener('change', () => configurePanels(false));
byId('selectAll').addEventListener('click', () => {
  for (const input of algorithmPicker.querySelectorAll('input')) input.checked = true;
  configurePanels(false);
});
byId('view').addEventListener('change', () => configurePanels());
byId('source').addEventListener('change', calculate);
byId('calculate').addEventListener('click', calculate);
byId('play').addEventListener('click', play);
byId('next').addEventListener('click', () => { stop(); advance(Number(byId('batch').value)); });
byId('back').addEventListener('click', () => { stop(); advance(-Number(byId('batch').value)); });
byId('restart').addEventListener('click', () => { stop(); position = 0; render(); });
byId('progress').addEventListener('input', () => { stop(); position = Number(byId('progress').value); render(); });
byId('speed').addEventListener('change', () => { if (timer !== null) { stop(); play(); } });
byId('layer').addEventListener('change', render);
byId('traps').addEventListener('change', render);
byId('zoom').addEventListener('input', () => {
  fitBoards();
});
byId('fit').addEventListener('click', () => {
  fitBoards();
  const required = Math.min(100, ...runners.map((runner) => runner.fitZoom));
  byId('zoom').value = String(Math.max(5, Math.floor(required / 5) * 5));
  for (const runner of runners) runner.viewport.scrollTo(0, 0);
  fitBoards();
});
byId('focusMaps').addEventListener('click', focusMaps);
window.addEventListener('resize', scheduleFit);
byId('closeDetails').addEventListener('click', () => byId('details').close());
byId('details').addEventListener('click', (event) => { if (event.target === byId('details')) byId('details').close(); });
byId('importFile').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const rows = parseMap(await file.text());
    const id = 'importado-' + Date.now();
    addMap(id, { mapa: rows, estados: [], consumiveis: [], armadilhas: [] }, file.name);
    mapSelect.value = id;
    loadMap();
    await calculate();
  } catch (error) { notify(error.message); }
  event.target.value = '';
});

async function init() {
  mapSelect.replaceChildren();
  for (const [id, data] of maps) addMap(id, data);
  const query = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.slice(1));
  const requested = query.get('mapa') || DEFAULT_MAP;
  if (maps.has(requested)) mapSelect.value = requested;
  loadMap();
  try {
    let rows;
    if (hash.has('grade')) rows = parseMap(hash.get('grade'));
    else if (query.has('arquivo') && !maps.has(requested)) {
      const filename = query.get('arquivo');
      const response = await fetch('/mapas/' + encodeURIComponent(filename));
      if (!response.ok) throw new Error('Não foi possível abrir o mapa selecionado.');
      rows = parseMap(await response.text());
    }
    if (rows) {
      addMap('editor', { mapa: rows, estados: [], consumiveis: [], armadilhas: [] }, hash.get('nome') || 'Mapa importado');
      mapSelect.value = 'editor';
      loadMap();
      await calculate();
    }
  } catch (error) { notify(error.message); }
}
init();
