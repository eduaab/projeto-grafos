import type { CellType } from './parseMaze'

export type PaletteTool = { char: string; type: CellType; label: string }

export const PALETTE: PaletteTool[] = [
  { char: '#', type: 'wall', label: 'Parede' },
  { char: '.', type: 'floor', label: 'Chão' },
  { char: ',', type: 'mud', label: 'Lama' },
  { char: '~', type: 'water', label: 'Água' },
  { char: 'S', type: 'start', label: 'Início' },
  { char: 'G', type: 'goal', label: 'Saída' },
  { char: 'a', type: 'key', label: 'Chave a' },
  { char: 'b', type: 'key', label: 'Chave b' },
  { char: 'c', type: 'key', label: 'Chave c' },
  { char: 'd', type: 'key', label: 'Chave d' },
  { char: 'A', type: 'door', label: 'Porta A' },
  { char: 'B', type: 'door', label: 'Porta B' },
  { char: 'C', type: 'door', label: 'Porta C' },
  { char: 'D', type: 'door', label: 'Porta D' },
  { char: '>', type: 'conveyor', label: 'Esteira →' },
  { char: '<', type: 'conveyor', label: 'Esteira ←' },
  { char: '^', type: 'conveyor', label: 'Esteira ↑' },
  { char: 'v', type: 'conveyor', label: 'Esteira ↓' },
  { char: '+', type: 'bonus', label: 'Bônus' },
  { char: '*', type: 'source', label: 'Fonte' },
]
