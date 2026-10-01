import { boundaryLoops, cells, COLORS, COLUMNS, ROWS, TOKEN_COUNT, completedRows, rotate } from './model'
import type { Move, Token } from './model'

const layouts = [
  { name: 'Simple squares', groups: [], shuffleMoves: 4 },
  { name: 'First connection', groups: ['AB'], shuffleMoves: 6 },
  { name: 'Two connections', groups: ['AB', 'EF'], shuffleMoves: 8 },
  { name: 'Change direction', groups: ['AD', 'EF', 'KL'], shuffleMoves: 10 },
  { name: 'Chain reaction', groups: ['AB', 'DE', 'HI', 'JK'], shuffleMoves: 12 },
  { name: 'Connected shapes', groups: ['BC', 'DEF', 'HIL'], shuffleMoves: 14 },
  { name: 'Long routes', groups: ['ADG', 'BEH', 'CFI', 'JKL'], shuffleMoves: 16 },
  { name: 'Around the corner', groups: ['ABE', 'CF', 'DGJ', 'HIKL'], shuffleMoves: 18 },
  { name: 'Interlocking paths', groups: ['ADEH', 'BCFI', 'GJKL'], shuffleMoves: 20 },
  { name: 'Final weave', groups: ['ADEHI', 'BCF', 'GJKL'], shuffleMoves: 24 },
  { name: 'Gentle bridge · Easy', groups: ['GH'], shuffleMoves: 6 },
  { name: 'Two stepping stones · Easy', groups: ['CF', 'KL'], shuffleMoves: 8 },
  { name: 'Top shelf · Medium', groups: ['ABC', 'GH'], shuffleMoves: 12 },
  { name: 'Side streets · Medium', groups: ['ADG', 'EH', 'KL'], shuffleMoves: 16 },
  { name: 'Elbow room · Medium', groups: ['ABE', 'DGH', 'FI', 'JK'], shuffleMoves: 18 },
  { name: 'Four lanes · Hard', groups: ['ABC', 'DEF', 'GHI', 'JKL'], shuffleMoves: 22 },
  { name: 'Cornerstone · Hard', groups: ['ABDE', 'CF', 'GJ', 'HK', 'IL'], shuffleMoves: 24 },
  { name: 'Switchbacks · Hard', groups: ['ABCE', 'DGHJ', 'FIL'], shuffleMoves: 28 },
  { name: 'Three currents · Expert', groups: ['ABDEG', 'CFIL', 'HJK'], shuffleMoves: 32 },
  { name: 'Grand junction · Expert', groups: ['ABCF', 'DEGH', 'JKL'], shuffleMoves: 36 },
]

export const levels = layouts.map((layout, index) => {
  const groups = layout.groups.map(group => group.split(''))
  const moves: Move[] = Object.keys(cells).flatMap(cell => {
    const group = groups.find(group => group.includes(cell))
    if (group && group[0] !== cell) return []
    const members = group ?? [cell]
    return [{ id: members.join(''), cells: members, cycle: boundaryLoops(members)[0] }]
  })
  return { ...layout, id: index + 1, moves }
})

export type LevelDefinition = typeof levels[number]

export function createSolvedTokens(): Token[] {
  return Array.from({ length: TOKEN_COUNT }, (_, index) => ({
    id: `token-${index + 1}`, position: index + 1, color: COLORS[Math.floor(index / COLUMNS)],
  }))
}

function levelRandom(levelId: number) {
  let seed = levelId * 7919 + 781
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}

export function createLevelStart(level: LevelDefinition, random = levelRandom(level.id)) {
  let tokens = createSolvedTokens()
  const sequence: Move[] = []
  for (let index = 0; index < level.shuffleMoves; index++) {
    const candidates = level.moves.filter(move => move !== sequence[sequence.length - 1])
    const move = candidates[Math.floor(random() * candidates.length)]
    sequence.push(move)
    tokens = rotate(tokens, move.cycle)
  }
  if (completedRows(tokens).length === ROWS) {
    const move = level.moves[0]
    sequence.push(move)
    tokens = rotate(tokens, move.cycle)
  }
  return { tokens, sequence }
}
