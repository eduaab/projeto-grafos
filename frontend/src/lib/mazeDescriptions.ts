import type manifest from '../data/mapas.manifest.json'

type ManifestEntry = (typeof manifest)[number]

// What each official map exercises — straight from the professor's own
// slide (Figura "Os 8 Mapas Fornecidos"), not invented copy.
const OFFICIAL_DESCRIPTIONS: Record<string, string> = {
  m01_terreno: 'Custos de terreno: menos passos não é menor custo.',
  m02_uma_chave: 'Uma chave e uma porta — o exemplo para desenhar à mão.',
  m03_tres_chaves: 'Três chaves com ordem de coleta obrigatória.',
  m04_esteiras: 'Arcos de mão única, becos e estados-armadilha.',
  m05_bonus: 'Pesos negativos sem ciclo negativo.',
  m06_fonte: 'Ciclo negativo: um "exploit" do jogo.',
  m07_impossivel: 'Mapa sem solução — provem!',
  m08_grande: '31×71 com 4 chaves: teste de eficiência.',
}

function fallbackDescription(entry: ManifestEntry): string {
  const bits: string[] = []
  if (entry.keys > 0) bits.push(`${entry.keys} chave(s)`)
  if (entry.doors > 0) bits.push(`${entry.doors} porta(s)`)
  if (entry.hasConveyors) bits.push('esteiras')
  if (entry.hasBonus) bits.push('bônus')
  if (entry.hasSource) bits.push('fonte de energia')
  return bits.length ? `Labirinto com ${bits.join(', ')}.` : 'Labirinto sem obstáculos especiais.'
}

export function describeMaze(entry: ManifestEntry): string {
  return OFFICIAL_DESCRIPTIONS[entry.id] ?? fallbackDescription(entry)
}

export function groupLabel(group: ManifestEntry['group']): string {
  if (group === 'oficial') return 'Mapa oficial'
  if (group === 'grupo') return 'Mapa do grupo'
  return 'Mapa criado'
}
